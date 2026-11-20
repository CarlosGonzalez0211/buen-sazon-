// Read-only dashboard queries. Everything is plain SQL over confirmed rows; no model involved.
import { neon } from '@neondatabase/serverless';

// Workbook fixed costs (rent, payroll, utilities...) are kept apart from day-to-day purchases.
const FIXED = `COALESCE(e.source_key, '') LIKE 'wb:fixed:%'`;
// What Uber really pays for the sale, before the taxes it withholds on your behalf (those are not a cost):
// the deposit plus the ISR/IVA withholdings added back. Counted on the order date, not the payout date.
const UBER_NET = '(payout_cents - vat_withholding_cents - isr_withholding_cents)';
const num = (v) => (v == null ? null : Number(v));
const row = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, /^(week|month|date|name|category|supplier|dow|first|last)$/.test(k) ? v : num(v)]));

export async function buildReport() {
  const db = neon(process.env.DATABASE_URL);
  const q = (text, params = []) => db.query(text, params).then((rs) => rs.map(row));

  const [{ d: anchor, first }] = await db.query(
    `SELECT max(sale_date)::text d, min(sale_date)::text first FROM sales_daily WHERE status = 'confirmed'`);
  if (!anchor) return { empty: true };

  const [{ pending }] = await q(`SELECT COUNT(*) AS pending FROM expenses WHERE status = 'pending'`);
  const daily = await buildDaily(db, anchor);

  const categories = await q(`
    SELECT name, SUM(cents) AS cents FROM (
      SELECT COALESCE(c.name, 'Sin categoría') AS name, SUM(i.line_total_cents) AS cents
      FROM expense_items i JOIN expenses e ON e.id = i.expense_id AND e.status = 'confirmed'
      LEFT JOIN expense_categories c ON c.id = i.category_id
      WHERE e.expense_date > $1::date - 90 AND e.expense_date <= $1::date GROUP BY 1
      UNION ALL
      SELECT COALESCE(c.name, 'Sin categoría'), SUM(e.total_cents)
      FROM expenses e LEFT JOIN expense_categories c ON c.id = e.category_id
      WHERE e.status = 'confirmed' AND NOT ${FIXED} AND e.expense_date > $1::date - 90 AND e.expense_date <= $1::date
        AND NOT EXISTS (SELECT 1 FROM expense_items i WHERE i.expense_id = e.id) GROUP BY 1
    ) t GROUP BY 1 ORDER BY 2 DESC`, [anchor]);

  const suppliers = await q(`
    SELECT COALESCE(s.name, 'Sin proveedor') AS supplier, SUM(e.total_cents) AS cents, COUNT(*) AS n
    FROM expenses e LEFT JOIN suppliers s ON s.id = e.supplier_id
    WHERE e.status = 'confirmed' AND NOT ${FIXED} AND e.expense_date > $1::date - 90 AND e.expense_date <= $1::date
    GROUP BY 1 ORDER BY 2 DESC LIMIT 10`, [anchor]);

  const weekday = await q(`
    SELECT extract(isodow FROM sale_date)::int AS dow, AVG(gross_cents)::bigint AS avg, COUNT(*) AS n
    FROM sales_daily WHERE status = 'confirmed' AND sale_date > $1::date - 84 AND sale_date <= $1::date
    GROUP BY 1 ORDER BY 1`, [anchor]);

  const cashup = await q(`
    SELECT sale_date::text AS date, over_short_cents AS cents FROM sales_daily
    WHERE status = 'confirmed' AND over_short_cents IS NOT NULL AND sale_date > $1::date - 90 AND sale_date <= $1::date
    ORDER BY abs(over_short_cents) DESC LIMIT 5`, [anchor]);

  const payroll = await q(`
    SELECT to_char(month, 'YYYY-MM-01') AS month,
      SUM(amount_cents) FILTER (WHERE role = 'Cocinero') AS cocinero,
      SUM(amount_cents) FILTER (WHERE role = 'Ayudante') AS ayudante,
      SUM(amount_cents) FILTER (WHERE role = 'Mesero') AS mesero,
      SUM(amount_cents) FILTER (WHERE role = 'Otros sueldos') AS otros,
      SUM(amount_cents) AS total
    FROM payroll_weekly GROUP BY month ORDER BY month DESC`);

  const uber = await q(`
    SELECT to_char(date_trunc('month', order_date), 'YYYY-MM-01') AS month,
      COUNT(*) FILTER (WHERE status = 'Completed') AS orders,
      SUM(sales_cents) AS sales,
      SUM(offers_cents) AS offers,
      -SUM(marketplace_fee_cents + fee_vat_cents) AS fees,
      -SUM(vat_withholding_cents + isr_withholding_cents) AS withheld,
      SUM(payout_cents) AS payout
    FROM uber_orders GROUP BY 1 ORDER BY 1 DESC`);
  const uberItems = await q(`
    SELECT item_name AS name, SUM(quantity) AS qty, SUM(quantity * unit_price_cents) AS cents
    FROM uber_order_items WHERE status = 'Completed' GROUP BY 1 ORDER BY cents DESC LIMIT 8`);
  const [uberRange] = await q(`SELECT min(order_date)::text AS first, max(order_date)::text AS last FROM uber_orders`);

  const [meta] = await q(`
    SELECT (SELECT max(expense_date)::text FROM expenses WHERE status = 'confirmed') AS last_expense,
           (SELECT max(created_at)::text FROM audit_log WHERE action = 'import') AS last_import`);

  return { anchor, first, pending, daily, categories, suppliers, weekday, cashup, payroll, uber, uberItems, uberRange, meta };
}

// One row per calendar day, so the page can add up any week, month or the whole history itself.
// All money in centavos: s = restaurant sales, us/un = Uber gross/net, p = purchases, l = labor,
// o = other fixed costs + card fees, c = card sales, x = cash over/short.
//  - Labor comes from the weekly payroll lines (pay week k of a month = days 7(k-1)+1..7k); a month without
//    them falls back to its "Sueldos" line spread over the month. Insurance/TE lines are spread over the month.
//  - Other fixed costs (rent, utilities, taxes...) are spread evenly over the days of their month.
//  - The card fee follows card sales: the month's fee divided by that month's card sales, per day.
async function buildDaily(db, anchor) {
  const [sales, uber, purch, fixed, weeks] = await Promise.all([
    db.query(`SELECT sale_date::text d, gross_cents s, COALESCE(card_cents, 0) c, COALESCE(over_short_cents, 0) x
              FROM sales_daily WHERE status = 'confirmed' AND sale_date <= $1::date ORDER BY 1`, [anchor]),
    db.query(`SELECT order_date::text d, SUM(sales_cents) us, SUM(${UBER_NET}) un FROM uber_orders WHERE order_date <= $1::date GROUP BY 1`, [anchor]),
    db.query(`SELECT e.expense_date::text d, SUM(e.total_cents) p FROM expenses e
              WHERE e.status = 'confirmed' AND NOT ${FIXED} AND e.expense_date <= $1::date GROUP BY 1`, [anchor]),
    db.query(`SELECT to_char(e.expense_date, 'YYYY-MM') m, e.total_cents t, COALESCE(e.notes, '') label, c.code
              FROM expenses e LEFT JOIN expense_categories c ON c.id = e.category_id
              WHERE e.status = 'confirmed' AND ${FIXED}`),
    db.query(`SELECT to_char(month, 'YYYY-MM') m, week_no k, amount_cents a FROM payroll_weekly`),
  ]);
  const by = (rows) => new Map(rows.map((r) => [r.d, r]));
  const S = by(sales); const U = by(uber); const P = by(purch);

  const month = {};
  const mm = (m) => (month[m] ??= { sueldos: 0, laborFixed: 0, other: 0, fee: 0, cardSum: 0, weeks: {} });
  for (const f of fixed) {
    const t = Number(f.t); const m = mm(f.m); const label = f.label.trim().toLowerCase();
    if (label.startsWith('comisión tarjetas')) m.fee += t;
    else if (f.code === 'payroll' && label === 'sueldos') m.sueldos += t;
    else if (f.code === 'payroll') m.laborFixed += t;
    else m.other += t;
  }
  for (const w of weeks) mm(w.m).weeks[Number(w.k)] = (mm(w.m).weeks[Number(w.k)] ?? 0) + Number(w.a);
  for (const r of sales) { const m = mm(r.d.slice(0, 7)); m.cardSum += Number(r.c); }

  const first = sales[0]?.d;
  const out = [];
  const end = new Date(anchor + 'T00:00:00Z');
  for (let t = new Date(first + 'T00:00:00Z'); t <= end; t = new Date(t.getTime() + 86400000)) {
    const d = t.toISOString().slice(0, 10);
    const ym = d.slice(0, 7); const day = Number(d.slice(8, 10));
    const dim = new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)), 0)).getUTCDate();
    const m = month[ym] ?? { sueldos: 0, laborFixed: 0, other: 0, fee: 0, cardSum: 0, weeks: {} };
    const wk = Math.min(5, Math.ceil(day / 7));
    const bucketDays = wk === 5 ? dim - 28 : 7;
    const hasWeeks = Object.keys(m.weeks).length > 0;
    const labor = (hasWeeks ? (m.weeks[wk] ?? 0) / bucketDays : m.sueldos / dim) + m.laborFixed / dim;
    const sale = S.get(d);
    const fee = m.cardSum ? (Number(sale?.c ?? 0) * m.fee) / m.cardSum : 0;
    out.push({
      d,
      s: Number(sale?.s ?? 0), c: Number(sale?.c ?? 0), x: Number(sale?.x ?? 0),
      us: Number(U.get(d)?.us ?? 0), un: Number(U.get(d)?.un ?? 0),
      p: Number(P.get(d)?.p ?? 0),
      l: Math.round(labor), o: Math.round(m.other / dim + fee),
    });
  }
  return out;
}
