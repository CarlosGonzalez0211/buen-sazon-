// Pure, deterministic checks on what the model extracted. No I/O.
// The model only reads text off the photo; every number is re-derived and checked here.

export const toCents = (pesos) => Math.round(Number(pesos) * 100);

export function normalizeAlias(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
}

/** Turn raw extraction (pesos, floats) into integer-centavo rows + a list of issues. */
export function normalizeReceipt(raw, today = new Date().toISOString().slice(0, 10)) {
  const issues = [];
  const items = (raw.items ?? []).map((it) => {
    const quantity = Number(it.quantity ?? 1) || 1;
    const line_total_cents = toCents(it.line_total);
    let unit_price_cents = it.unit_price != null ? toCents(it.unit_price) : Math.round(line_total_cents / quantity);
    const expected = Math.round(quantity * unit_price_cents);
    if (Math.abs(expected - line_total_cents) > Math.max(2, quantity)) {
      issues.push({ code: 'line_mismatch', text: it.raw_text, expected, got: line_total_cents });
    }
    return { raw_text: String(it.raw_text ?? '').trim(), quantity, unit: it.unit ?? null, unit_price_cents, line_total_cents };
  });

  const total_cents = toCents(raw.total);
  const tax_cents = raw.tax != null ? toCents(raw.tax) : 0;
  const sum = items.reduce((a, i) => a + i.line_total_cents, 0);
  // Tickets differ on whether line prices include tax; accept either, flag anything else.
  const ok = [total_cents, total_cents - tax_cents].some((t) => Math.abs(sum - t) <= Math.max(5, items.length));
  if (items.length && !ok) issues.push({ code: 'sum_mismatch', items_sum: sum, total: total_cents });
  if (!items.length) issues.push({ code: 'no_items' });
  if (!(total_cents > 0)) issues.push({ code: 'no_total' });

  let expense_date = /^\d{4}-\d{2}-\d{2}$/.test(raw.date ?? '') ? raw.date : null;
  if (!expense_date) { issues.push({ code: 'no_date' }); expense_date = today; }
  else if (expense_date > today) issues.push({ code: 'future_date', date: expense_date });

  const payment_method = ['cash', 'card', 'transfer', 'other'].includes(raw.payment_method) ? raw.payment_method : null;
  return {
    merchant: String(raw.merchant_name ?? '').trim() || 'DESCONOCIDO',
    merchant_rfc: raw.merchant_rfc || null,
    ticket_folio: raw.ticket_folio ? String(raw.ticket_folio) : null,
    expense_date, total_cents, tax_cents, payment_method, items, issues,
  };
}
