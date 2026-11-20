// Parsers for the three Uber Eats Manager CSV exports (Payout summary, Payment details,
// Payment details (item level)). Pure: text in, rows out. Columns are found by NAME,
// so a reordering by Uber does not shift values.
import { parseCsvLine, cents } from './workbook.mjs';

const lines = (text) => text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
const n = (s) => {
  const t = String(s ?? '').trim();
  if (t === '') return 0;
  const v = Number(t);
  return Number.isFinite(v) ? v : 0;
};
const c = (s) => cents(n(s));

function mdy(s) {
  const m = String(s ?? '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return `${y}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

/** Finds the header row that holds the machine column names (some exports add a description row above it). */
function table(text, mustHave) {
  const rows = lines(text).map(parseCsvLine);
  const hi = rows.findIndex((r) => mustHave.every((k) => r.some((h) => h.trim() === k)));
  if (hi < 0) throw new Error(`header row with ${mustHave.join(', ')} not found`);
  const head = rows[hi].map((h) => h.trim());
  return { rows: rows.slice(hi + 1), col: (name) => head.indexOf(name) };
}

export function parsePayoutSummary(text) {
  const { rows, col } = table(text, ['Payout reference ID', 'Total payout']);
  const g = (r, name) => r[col(name)];
  return rows.filter((r) => (g(r, 'Payout reference ID') ?? '').trim()).map((r) => ({
    payout_ref: g(r, 'Payout reference ID').trim(),
    payout_date: mdy(g(r, 'Payout Date')),
    order_count: Math.round(n(g(r, 'Order Count'))),
    sales_cents: c(g(r, 'Sales (incl. VAT)')),
    sales_after_cents: c(g(r, 'Total Sales after Adjustments (incl. VAT)')),
    marketplace_fee_cents: c(g(r, 'Marketplace Fee (excl. VAT)')),
    fee_vat_cents: c(g(r, 'VAT on Marketplace Fee')),
    vat_withholding_cents: c(g(r, 'VAT Withholdings')),
    isr_withholding_cents: c(g(r, 'Income Tax withholding')),
    other_payments_cents: c(g(r, 'Other payments')),
    payout_cents: c(g(r, 'Total payout')),
  }));
}

export function parsePaymentDetails(text) {
  const { rows, col } = table(text, ['Order ID', 'Workflow ID', 'Total payout']);
  const g = (r, name) => (r[col(name)] ?? '').trim();
  const out = [];
  const seen = new Map();
  for (const r of rows) {
    const date = mdy(g(r, 'Order Date'));
    if (!date) continue;
    const workflow = g(r, 'Workflow ID');
    let key = workflow;
    let status = g(r, 'Order Status');
    // A refund shares the workflow id of the order it refunds, so only the completed row keeps the bare id.
    if (workflow && status && status !== 'Completed') key = `${workflow}:${status.toLowerCase()}`;
    if (!workflow) {
      // payments with no order (ad credits, financing, adjustments): keyed by payout + date + position
      const base = `adj:${g(r, 'Payout reference ID')}:${date}`;
      const k = (seen.get(base) ?? 0) + 1;
      seen.set(base, k);
      key = `${base}:${k}`;
      status = 'Ajuste';
    }
    out.push({
      source_key: key,
      order_code: g(r, 'Order ID') || null,
      order_date: date,
      completed_at: g(r, 'Order Completion time').replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T') || null,
      status,
      channel: g(r, 'Order Channel') || null,
      sales_cents: c(g(r, 'Sales (incl. VAT)')),
      offers_cents: c(g(r, 'Offers on items (incl. VAT)')),
      sales_after_cents: c(g(r, 'Total Sales after Adjustments (incl. VAT)')),
      marketplace_fee_cents: c(g(r, 'Marketplace Fee (excl. VAT)')),
      fee_vat_cents: c(g(r, 'VAT on Marketplace Fee')),
      vat_withholding_cents: c(g(r, 'VAT Withholdings')),
      isr_withholding_cents: c(g(r, 'Income Tax withholding')),
      other_payments_cents: c(g(r, 'Other payments')),
      payout_cents: c(g(r, 'Total payout')),
      payout_date: mdy(g(r, 'Payout Date')),
      payout_ref: g(r, 'Payout reference ID') || null,
    });
  }
  return out;
}

export function parseItems(text) {
  const { rows, col } = table(text, ['Workflow ID', 'Item Name', 'Unit price']);
  const g = (r, name) => (r[col(name)] ?? '').trim();
  const out = [];
  const lineNo = new Map();
  for (const r of rows) {
    const name = g(r, 'Item Name');
    if (!name) continue; // the order's own summary row
    const wf = g(r, 'Workflow ID');
    const k = (lineNo.get(wf) ?? 0) + 1;
    lineNo.set(wf, k);
    out.push({
      source_key: `${wf}|${k}`,
      order_key: wf,
      order_date: mdy(g(r, 'Order Date')),
      item_name: name,
      quantity: Math.round(n(g(r, 'Final Quantity') || g(r, 'Requested Quantity') || 1)),
      unit_price_cents: c(g(r, 'Unit price')),
      status: g(r, 'Order Status') || null,
    });
  }
  return out;
}

/** Cross-checks the files against each other. Partial weeks at the edges of a report range are expected. */
export function reconcile(payouts, orders, items) {
  const notes = [];
  const byRef = new Map();
  for (const o of orders) {
    if (!o.payout_ref) continue;
    const a = byRef.get(o.payout_ref) ?? { sales: 0, payout: 0, orders: 0 };
    a.sales += o.sales_cents;
    a.payout += o.payout_cents;
    if (o.status !== 'Ajuste') a.orders++;
    byRef.set(o.payout_ref, a);
  }
  for (const p of payouts) {
    const a = byRef.get(p.payout_ref);
    if (!a) notes.push({ code: 'payout_without_orders', ref: p.payout_ref });
    else if (a.payout === p.payout_cents && a.sales === p.sales_cents) notes.push({ code: 'payout_ties', ref: p.payout_ref, payout: p.payout_cents });
    else notes.push({ code: 'payout_partial_in_orders_file', ref: p.payout_ref, summary: p.payout_cents, ordersFile: a.payout, summaryOrders: p.order_count, ordersInFile: a.orders });
  }
  for (const [ref, a] of byRef) {
    if (!payouts.some((p) => p.payout_ref === ref)) notes.push({ code: 'orders_payout_not_in_summary', ref, payout: a.payout, orders: a.orders });
  }
  const itemSales = new Map();
  for (const i of items) itemSales.set(i.order_key, (itemSales.get(i.order_key) ?? 0) + i.quantity * i.unit_price_cents);
  let off = 0;
  for (const o of orders) {
    if (o.status === 'Completed' && itemSales.has(o.source_key) && itemSales.get(o.source_key) !== o.sales_cents) off++;
  }
  if (off) notes.push({ code: 'item_sales_differ_from_order_sales', orders: off });
  return notes;
}
