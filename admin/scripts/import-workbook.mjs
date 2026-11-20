// Usage: node scripts/import-workbook.mjs <export.txt> [--apply]
// Default is a dry run: parses, cross-checks against the workbook's own totals, prints a report.
// --apply writes to Neon. Safe to re-run: rows carry a source key, so they update instead of duplicating,
// and rows you voided or entered by hand in the app are never touched.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';
import { parseWorkbook } from '../lib/workbook.mjs';

try {
  const path = fileURLToPath(new URL('../.env.local', import.meta.url));
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
} catch { /* rely on real env */ }

const file = process.argv[2];
const apply = process.argv.includes('--apply');
if (!file) { console.error('Usage: node scripts/import-workbook.mjs <export.txt> [--apply]'); process.exit(1); }

const r = parseWorkbook(readFileSync(file, 'utf8'));
const peso = (c) => '$' + (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });

console.log('\nPer sheet (purchases / sales / fixed costs):');
for (const s of r.summaries) console.log(`  ${s.sheet.padEnd(16)} ${peso(s.purchases).padStart(10)} ${peso(s.venta).padStart(10)} ${peso(s.fixed).padStart(10)}`);
const dates = r.sales.map((s) => s.date);
console.log(`\n${r.expenses.length} supplier purchases, ${r.fixed.length} fixed-cost lines, ${r.sales.length} sales days (${dates[0]} .. ${dates.at(-1)})`);
console.log(`${r.payroll.length} weekly payroll lines`);
console.log(`${r.sales.filter((s) => s.credit_cents != null).length} of those days have cash-up detail`);
if (r.unmapped.length) console.log('\nUnmapped names (filed under a default category):', r.unmapped.join(', '));

const byCode = {};
for (const w of r.warnings) (byCode[w.code] ??= []).push(w);
console.log('\nWarnings:', r.warnings.length ? '' : 'none');
for (const [code, list] of Object.entries(byCode)) {
  console.log(`  ${code}: ${list.length}`);
  for (const w of list.slice(0, 12)) console.log('    ', JSON.stringify(w));
  if (list.length > 12) console.log(`     … ${list.length - 12} more`);
}

if (!apply) { console.log('\nDry run only. Re-run with --apply to write.'); process.exit(0); }
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL missing'); process.exit(1); }

const sql = neon(process.env.DATABASE_URL);
const chunks = (a, n = 400) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

// System user that owns imported rows; inactive so it can never sign in through WhatsApp.
let user = (await sql.query(`SELECT id FROM users WHERE name = 'Importador (workbook)'`))[0];
user ??= (await sql.query(`INSERT INTO users (name, role, active) VALUES ('Importador (workbook)', 'staff', false) RETURNING id`))[0];

const cats = Object.fromEntries((await sql.query(`SELECT code, id FROM expense_categories`)).map((c) => [c.code, c.id]));
const names = [...new Set(r.expenses.map((e) => e.supplier))];
for (const n of names) await sql.query(`INSERT INTO suppliers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [n]);
const sup = Object.fromEntries((await sql.query(`SELECT name, id FROM suppliers`)).map((s) => [s.name, s.id]));

const expenseRows = [
  ...r.expenses.map((e) => ({
    supplier_id: sup[e.supplier], category_id: cats[e.category] ?? null, expense_date: e.date, total_cents: e.cents,
    source_key: `wb:${e.date}:${e.supplier}`, notes: null,
  })),
  ...r.fixed.map((f) => ({
    supplier_id: null, category_id: cats[f.category] ?? null, expense_date: f.month, total_cents: f.cents,
    source_key: `wb:fixed:${f.month.slice(0, 7)}:${f.label.toLowerCase().replace(/\s+/g, '-')}`, notes: f.label,
  })),
];

let inserted = 0;
let updated = 0;
for (const part of chunks(expenseRows)) {
  const res = await sql.query(
    `INSERT INTO expenses (supplier_id, category_id, expense_date, total_cents, status, entered_by, confirmed_by, confirmed_at, source, source_key, notes)
     SELECT x.supplier_id, x.category_id, x.expense_date, x.total_cents, 'confirmed', $2::bigint, $2::bigint, now(), 'workbook', x.source_key, x.notes
     FROM jsonb_to_recordset($1::jsonb) AS x(supplier_id bigint, category_id int, expense_date date, total_cents bigint, source_key text, notes text)
     ON CONFLICT (source_key) DO UPDATE SET
       supplier_id = EXCLUDED.supplier_id, category_id = EXCLUDED.category_id,
       expense_date = EXCLUDED.expense_date, total_cents = EXCLUDED.total_cents
     WHERE expenses.status = 'confirmed' AND expenses.source = 'workbook'
     RETURNING (xmax = 0) AS inserted`,
    [JSON.stringify(part), user.id]);
  for (const row of res) row.inserted ? inserted++ : updated++;
}

let salesIn = 0;
let salesUp = 0;
for (const part of chunks(r.sales)) {
  const res = await sql.query(
    `INSERT INTO sales_daily (sale_date, channel, gross_cents, cash_cents, card_cents, credit_cents, debit_cents,
        expected_cash_cents, actual_cash_cents, over_short_cents, drawer_float_cents, source, status, entered_by)
     SELECT x.date, 'total', x.gross_cents, x.cash_cents, x.card_cents, x.credit_cents, x.debit_cents,
        x.expected_cash_cents, x.actual_cash_cents, x.over_short_cents, x.drawer_float_cents, 'workbook', 'confirmed', $2::bigint
     FROM jsonb_to_recordset($1::jsonb) AS x(date date, gross_cents bigint, cash_cents bigint, card_cents bigint, credit_cents bigint,
        debit_cents bigint, expected_cash_cents bigint, actual_cash_cents bigint, over_short_cents bigint, drawer_float_cents bigint)
     ON CONFLICT (sale_date, channel) WHERE status = 'confirmed' DO UPDATE SET
        gross_cents = EXCLUDED.gross_cents, cash_cents = EXCLUDED.cash_cents, card_cents = EXCLUDED.card_cents,
        credit_cents = EXCLUDED.credit_cents, debit_cents = EXCLUDED.debit_cents,
        expected_cash_cents = EXCLUDED.expected_cash_cents, actual_cash_cents = EXCLUDED.actual_cash_cents,
        over_short_cents = EXCLUDED.over_short_cents, drawer_float_cents = EXCLUDED.drawer_float_cents
     WHERE sales_daily.source = 'workbook'
     RETURNING (xmax = 0) AS inserted`,
    [JSON.stringify(part), user.id]);
  for (const row of res) row.inserted ? salesIn++ : salesUp++;
}

let payIn = 0;
let payUp = 0;
const payRows = r.payroll.map((p) => ({ month: p.month, week_no: p.week_no, role: p.role, amount_cents: p.cents,
  source_key: `wb:payroll:${p.month.slice(0, 7)}:w${p.week_no}:${p.role.toLowerCase().replace(/\s+/g, '-')}` }));
for (const part of chunks(payRows)) {
  const res = await sql.query(
    `INSERT INTO payroll_weekly (month, week_no, role, amount_cents, source_key)
     SELECT x.month, x.week_no, x.role, x.amount_cents, x.source_key
     FROM jsonb_to_recordset($1::jsonb) AS x(month date, week_no int, role text, amount_cents bigint, source_key text)
     ON CONFLICT (source_key) DO UPDATE SET amount_cents = EXCLUDED.amount_cents
     RETURNING (xmax = 0) AS inserted`, [JSON.stringify(part)]);
  for (const row of res) row.inserted ? payIn++ : payUp++;
}

await sql.query(`INSERT INTO audit_log (user_id, action, entity, detail) VALUES ($1, 'import', 'workbook', $2)`,
  [user.id, JSON.stringify({ file, expenses: { inserted, updated }, sales: { inserted: salesIn, updated: salesUp }, payroll: { inserted: payIn, updated: payUp }, warnings: r.warnings.length })]);
console.log(`\nApplied. Expenses: ${inserted} new, ${updated} updated. Sales days: ${salesIn} new, ${salesUp} updated.`);
console.log(`(${expenseRows.length - inserted - updated} expense rows left alone because they were voided or edited.)`);
