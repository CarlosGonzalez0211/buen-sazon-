// Usage: node scripts/import-uber.mjs <folder-or-files...> [--apply]
// Reads Uber Eats Manager CSV exports (payout summary, payment details, item-level details),
// recognises each by its columns, cross-checks them against each other, and with --apply upserts
// into Neon. Safe to re-run and safe with overlapping date ranges (rows are keyed).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { parsePayoutSummary, parsePaymentDetails, parseItems, reconcile } from '../lib/uber.mjs';

try {
  const path = fileURLToPath(new URL('../.env.local', import.meta.url));
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
} catch { /* rely on real env */ }

const apply = process.argv.includes('--apply');
const targets = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!targets.length) { console.error('Usage: node scripts/import-uber.mjs <folder-or-files...> [--apply]'); process.exit(1); }

const files = targets.flatMap((t) => (statSync(t).isDirectory() ? readdirSync(t).filter((f) => f.toLowerCase().endsWith('.csv')).map((f) => join(t, f)) : [t]));
const payouts = new Map();
const orders = new Map();
const items = new Map();
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  if (/Payout reference ID/.test(text) && /Order Count/.test(text) && !/Workflow ID/.test(text)) {
    for (const p of parsePayoutSummary(text)) payouts.set(p.payout_ref, p);
    console.log('payout summary:', f);
  } else if (/Workflow ID/.test(text) && /Item Name/.test(text) && /Unit price/.test(text) && !/Description of adhoc/.test(text)) {
    for (const i of parseItems(text)) items.set(i.source_key, i);
    console.log('item level   :', f);
  } else if (/Workflow ID/.test(text)) {
    for (const o of parsePaymentDetails(text)) orders.set(o.source_key, o);
    console.log('payment detail:', f);
  } else console.log('skipped (unknown format):', f);
}
const P = [...payouts.values()];
const O = [...orders.values()];
const I = [...items.values()];
const peso = (x) => '$' + (x / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
const real = O.filter((o) => o.status !== 'Ajuste');
const dates = real.map((o) => o.order_date).sort();
console.log(`\n${P.length} payouts, ${real.length} orders (${dates[0]} .. ${dates.at(-1)}), ${O.length - real.length} payments without an order, ${I.length} item lines`);
console.log(`orders: sales ${peso(real.reduce((a, o) => a + o.sales_cents, 0))}, payout ${peso(O.reduce((a, o) => a + o.payout_cents, 0))}`);
console.log('\nCross-checks:');
for (const note of reconcile(P, O, I)) console.log('  ', JSON.stringify(note));

if (!apply) { console.log('\nDry run only. Re-run with --apply to write.'); process.exit(0); }
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL missing'); process.exit(1); }

const sql = neon(process.env.DATABASE_URL);
const chunks = (a, k = 400) => Array.from({ length: Math.ceil(a.length / k) }, (_, i) => a.slice(i * k, i * k + k));
const upsert = async (table, cols, types, key, rows, update) => {
  let n = 0;
  for (const part of chunks(rows)) {
    const def = cols.map((c, i) => `${c} ${types[i]}`).join(', ');
    const set = update.map((c) => `${c} = EXCLUDED.${c}`).join(', ');
    const res = await sql.query(
      `INSERT INTO ${table} (${cols.join(', ')}) SELECT ${cols.map((c) => 'x.' + c).join(', ')}
       FROM jsonb_to_recordset($1::jsonb) AS x(${def}) ON CONFLICT (${key}) DO UPDATE SET ${set} RETURNING 1`, [JSON.stringify(part)]);
    n += res.length;
  }
  return n;
};

const pc = ['payout_ref', 'payout_date', 'order_count', 'sales_cents', 'sales_after_cents', 'marketplace_fee_cents', 'fee_vat_cents', 'vat_withholding_cents', 'isr_withholding_cents', 'other_payments_cents', 'payout_cents'];
const pt = ['text', 'date', 'int', 'bigint', 'bigint', 'bigint', 'bigint', 'bigint', 'bigint', 'bigint', 'bigint'];
const oc = ['source_key', 'order_code', 'order_date', 'completed_at', 'status', 'channel', 'sales_cents', 'offers_cents', 'sales_after_cents', 'marketplace_fee_cents', 'fee_vat_cents', 'vat_withholding_cents', 'isr_withholding_cents', 'other_payments_cents', 'payout_cents', 'payout_date', 'payout_ref'];
const ot = ['text', 'text', 'date', 'timestamp', 'text', 'text', 'bigint', 'bigint', 'bigint', 'bigint', 'bigint', 'bigint', 'bigint', 'bigint', 'bigint', 'date', 'text'];
const ic = ['source_key', 'order_key', 'order_date', 'item_name', 'quantity', 'unit_price_cents', 'status'];
const it = ['text', 'text', 'date', 'text', 'int', 'bigint', 'text'];

const np = await upsert('uber_payouts', pc, pt, 'payout_ref', P, pc.slice(1));
const no = await upsert('uber_orders', oc, ot, 'source_key', O, oc.slice(1));
const ni = await upsert('uber_order_items', ic, it, 'source_key', I, ic.slice(1));
const [{ id }] = await sql.query(`SELECT id FROM users WHERE name = 'Importador (workbook)'`).then((r) => (r.length ? r : [{ id: null }]));
await sql.query(`INSERT INTO audit_log (user_id, action, entity, detail) VALUES ($1, 'import', 'uber_eats', $2)`,
  [id, JSON.stringify({ files: files.length, payouts: np, orders: no, items: ni })]);
console.log(`\nApplied. Payouts ${np}, orders/payments ${no}, item lines ${ni} (inserted or updated).`);
