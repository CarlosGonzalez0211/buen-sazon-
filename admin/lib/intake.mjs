// Channel-agnostic intake: ingest a photo -> pending expense -> confirm / cancel.
// Telegram (and later WhatsApp / web) are thin adapters over these functions.
import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { extractReceipt } from './extract.mjs';
import { normalizeAlias, normalizeReceipt } from './validate.mjs';

const sql = () => neon(process.env.DATABASE_URL);

export async function findUser(channel, id) {
  if (channel === 'telegram') {
    return (await sql().query(`SELECT * FROM users WHERE tg_user_id = $1 AND active`, [String(id)]))[0] ?? null;
  }
  // WhatsApp ids vary for Mexican numbers (52 vs 521 prefix), so match on the last 10 digits.
  const last10 = String(id).replace(/\D/g, '').slice(-10);
  if (last10.length < 10) return null;
  const rows = await sql().query(
    String.raw`SELECT * FROM users WHERE active AND right(regexp_replace(coalesce(wa_phone, ''), '\D', '', 'g'), 10) = $1`, [last10]);
  return rows[0] ?? null;
}

/** Photo bytes -> pending expense with items. Returns { duplicate } or { expenseId, receipt, unmapped }. */
export async function ingestReceipt({ bytes, mime, user, channel, extract = extractReceipt }) {
  const db = sql();
  const sha = createHash('sha256').update(bytes).digest('hex');

  const dup = await db.query(
    `SELECT e.id FROM receipts r JOIN expenses e ON e.receipt_id = r.id AND e.status <> 'void' WHERE r.image_sha256 = $1`, [sha]);
  if (dup.length) return { duplicate: dup[0].id };

  const raw = await extract(bytes, mime);
  if (!raw.is_receipt) return { notReceipt: true };
  const r = normalizeReceipt(raw);

  const sup = (await db.query(
    `INSERT INTO suppliers (name, rfc) VALUES ($1, $2)
     ON CONFLICT (name) DO UPDATE SET rfc = COALESCE(suppliers.rfc, EXCLUDED.rfc) RETURNING id`,
    [r.merchant.toUpperCase(), r.merchant_rfc]))[0];

  // Same supplier + date + total (or same folio) already on the books = probable double entry.
  const soft = await db.query(
    `SELECT id FROM expenses WHERE status <> 'void' AND supplier_id = $1 AND expense_date = $2 AND
       (total_cents = $3 OR ($4::text IS NOT NULL AND ticket_folio = $4))`,
    [sup.id, r.expense_date, r.total_cents, r.ticket_folio]);
  if (soft.length) r.issues.push({ code: 'possible_duplicate', expense_id: soft[0].id });

  const rec = (await db.query(
    `INSERT INTO receipts (image_bytes, image_mime, image_sha256, uploaded_by, channel, ocr_json)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [Buffer.from(bytes), mime, sha, user.id, channel, JSON.stringify(raw)]))[0];

  const exp = (await db.query(
    `INSERT INTO expenses (receipt_id, supplier_id, expense_date, total_cents, tax_cents, payment_method, ticket_folio, entered_by, issues)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [rec.id, sup.id, r.expense_date, r.total_cents, r.tax_cents, r.payment_method, r.ticket_folio, user.id, JSON.stringify(r.issues)]))[0];

  let unmapped = 0;
  for (const it of r.items) {
    const alias = (await db.query(
      `SELECT a.product_id, p.category_id FROM product_aliases a JOIN products p ON p.id = a.product_id
       WHERE a.alias = $1 AND (a.supplier_id = $2 OR a.supplier_id IS NULL) ORDER BY a.supplier_id NULLS LAST LIMIT 1`,
      [normalizeAlias(it.raw_text), sup.id]))[0];
    if (!alias) unmapped++;
    await db.query(
      `INSERT INTO expense_items (expense_id, product_id, raw_text, category_id, quantity, unit, unit_price_cents, line_total_cents)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [exp.id, alias?.product_id ?? null, it.raw_text, alias?.category_id ?? null, it.quantity, it.unit, it.unit_price_cents, it.line_total_cents]);
  }
  return { expenseId: exp.id, receipt: { ...r, supplier: r.merchant }, unmapped };
}

/** Only a pending expense can be confirmed; this is the single gate into the reports. */
export async function confirmExpense(expenseId, user) {
  const db = sql();
  const rows = await db.query(
    `UPDATE expenses SET status = 'confirmed', confirmed_by = $2, confirmed_at = now()
     WHERE id = $1 AND status = 'pending' RETURNING id, total_cents`, [expenseId, user.id]);
  if (!rows.length) return null;
  await db.query(`INSERT INTO audit_log (user_id, action, entity, entity_id) VALUES ($1,'confirm','expense',$2)`, [user.id, expenseId]);
  // Every confirmed ticket enters the factura tracker; someone decides later whether it's needed.
  await db.query(`INSERT INTO invoices (expense_id) VALUES ($1) ON CONFLICT DO NOTHING`, [expenseId]);
  return rows[0];
}

export async function voidExpense(expenseId, user) {
  const db = sql();
  const rows = await db.query(
    `UPDATE expenses SET status = 'void', voided_at = now() WHERE id = $1 AND status <> 'void' RETURNING id`, [expenseId]);
  if (rows.length) await db.query(`INSERT INTO audit_log (user_id, action, entity, entity_id) VALUES ($1,'void','expense',$2)`, [user.id, expenseId]);
  return rows[0] ?? null;
}

export async function getExpenseSummary(expenseId) {
  const db = sql();
  const e = (await db.query(
    `SELECT e.*, s.name AS supplier FROM expenses e LEFT JOIN suppliers s ON s.id = e.supplier_id WHERE e.id = $1`, [expenseId]))[0];
  const items = await db.query(`SELECT * FROM expense_items WHERE expense_id = $1 ORDER BY id`, [expenseId]);
  return { ...e, items };
}
