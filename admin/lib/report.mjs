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

  const [kpi] = await q(`
    SELECT
      (SELECT COALESCE(SUM(gross_cents), 0) FROM sales_daily WHERE status = 'confirmed' AND sale_date > $1::date - 30 AND sale_date <= $1::date) AS sales30,
      (SELECT COALESCE(SUM(gross_cents), 0) FROM sales_daily WHERE status = 'confirmed' AND sale_date > $1::date - 60 AND sale_date <= $1::date - 30) AS sales_prev30,
      (SELECT COUNT(*) FROM sales_daily WHERE status = 'confirmed' AND sale_date > $1::date - 30 AND sale_date <= $1::date) AS days30,
      (SELECT COALESCE(SUM(e.total_cents), 0) FROM expenses e WHERE e.status = 'confirmed' AND NOT ${FIXED} AND e.expense_date > $1::date - 30 AND e.expense_date <= $1::date) AS purchases30,
      (SELECT COALESCE(SUM(e.total_cents), 0) FROM expenses e WHERE e.status = 'confirmed' AND NOT ${FIXED} AND e.expense_date > $1::date - 60 AND e.expense_date <= $1::date - 30) AS purchases_prev30,
      (SELECT SUM(card_cents)::float8 / NULLIF(SUM(gross_cents) FILTER (WHERE card_cents IS NOT NULL), 0) FROM sales_daily WHERE status = 'confirmed' AND sale_date > $1::date - 30 AND sale_date <= $1::date) AS card_share,
      (SELECT COALESCE(SUM(over_short_cents), 0) FROM sales_daily WHERE status = 'confirmed' AND sale_date > $1::date - 30 AND sale_date <= $1::date) AS over_short30,
      (SELECT COALESCE(SUM(sales_cents), 0) FROM uber_orders WHERE order_date > $1::date - 30 AND order_date <= $1::date) AS uber_sales30,
      (SELECT COALESCE(SUM(sales_cents), 0) FROM uber_orders WHERE order_date > $1::date - 60 AND order_date <= $1::date - 30) AS uber_sales_prev30,
      (SELECT COALESCE(SUM(${UBER_NET}), 0) FROM uber_orders WHERE order_date > $1::date - 30 AND order_date <= $1::date) AS uber_net30,
      (SELECT COUNT(*) FROM uber_orders WHERE status = 'Completed' AND order_date > $1::date - 30 AND order_date <= $1::date) AS uber_orders30,
      (SELECT COUNT(*) FROM expenses WHERE status = 'pending') AS pending`, [anchor]);

  const weekly = await q(`
    WITH s AS (SELECT date_trunc('week', sale_date)::date w, SUM(gross_cents) sales FROM sales_daily WHERE status = 'confirmed' GROUP BY 1),
         p AS (SELECT date_trunc('week', e.expense_date)::date w, SUM(e.total_cents) purchases FROM expenses e WHERE e.status = 'confirmed' AND NOT ${FIXED} GROUP BY 1)
    SELECT to_char(COALESCE(s.w, p.w), 'YYYY-MM-DD') AS week, s.sales, p.purchases
    FROM s FULL JOIN p ON p.w = s.w ORDER BY 1`);

  const monthly = await q(`
    WITH s AS (SELECT date_trunc('month', sale_date)::date m, SUM(gross_cents) sales FROM sales_daily WHERE status = 'confirmed' GROUP BY 1),
         p AS (SELECT date_trunc('month', e.expense_date)::date m,
                      SUM(e.total_cents) FILTER (WHERE NOT ${FIXED}) purchases,
                      SUM(e.total_cents) FILTER (WHERE ${FIXED}) fixed
               FROM expenses e WHERE e.status = 'confirmed' GROUP BY 1),
         u AS (SELECT date_trunc('month', order_date)::date m, SUM(sales_cents) uber_sales, SUM(${UBER_NET}) uber_net
               FROM uber_orders WHERE order_date <= $1::date GROUP BY 1)
    SELECT to_char(COALESCE(s.m, p.m, u.m), 'YYYY-MM') AS month, s.sales, p.purchases, p.fixed, u.uber_sales, u.uber_net
    FROM s FULL JOIN p ON p.m = s.m FULL JOIN u ON u.m = COALESCE(s.m, p.m) ORDER BY 1`, [anchor]);

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

  return { anchor, first, kpi, weekly, monthly, categories, suppliers, weekday, cashup, payroll, uber, uberItems, uberRange, meta };
}
