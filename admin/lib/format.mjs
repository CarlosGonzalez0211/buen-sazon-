// Message text shared by every channel adapter.
export const peso = (c) =>
  '$' + (Number(c) / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ISSUE_TEXT = {
  sum_mismatch: 'Los renglones no suman el total',
  line_mismatch: 'Un renglón no cuadra (cantidad × precio)',
  no_items: 'No se leyeron productos',
  no_total: 'No se leyó el total',
  no_date: 'No se leyó la fecha (usé hoy)',
  future_date: 'La fecha es futura',
  possible_duplicate: 'Posible ticket duplicado',
};

export function formatSummary(e) {
  const lines = e.items.slice(0, 25).map(
    (i) => `• ${i.raw_text} — ${Number(i.quantity)} × ${peso(i.unit_price_cents)} = ${peso(i.line_total_cents)}`);
  if (e.items.length > 25) lines.push(`… y ${e.items.length - 25} más`);
  const issues = (e.issues ?? []).map((i) => '⚠️ ' + (ISSUE_TEXT[i.code] ?? i.code));
  return [
    `🧾 ${e.supplier} · ${String(e.expense_date).slice(0, 10)}${e.ticket_folio ? ' · #' + e.ticket_folio : ''}`,
    ...lines,
    `Total: ${peso(e.total_cents)}`,
    ...issues,
  ].join('\n');
}
