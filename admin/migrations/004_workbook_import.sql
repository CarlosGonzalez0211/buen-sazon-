-- Support importing the historical workbook (and the cash-up detail it carries).

-- Header-level category for expenses that have no item lines (supplier totals, fixed costs).
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS category_id INT REFERENCES expense_categories(id);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'app';

-- Natural key so re-running an import updates rows instead of duplicating them (NULLs allowed).
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS expenses_source_key_idx ON expenses (source_key);

-- Cash-up detail from the "Tarjetas" sheets.
ALTER TABLE sales_daily ADD COLUMN IF NOT EXISTS credit_cents BIGINT;

ALTER TABLE sales_daily ADD COLUMN IF NOT EXISTS debit_cents BIGINT;

ALTER TABLE sales_daily ADD COLUMN IF NOT EXISTS expected_cash_cents BIGINT;

ALTER TABLE sales_daily ADD COLUMN IF NOT EXISTS actual_cash_cents BIGINT;

ALTER TABLE sales_daily ADD COLUMN IF NOT EXISTS over_short_cents BIGINT;

ALTER TABLE sales_daily ADD COLUMN IF NOT EXISTS drawer_float_cents BIGINT;

-- Days with only a gross figure have no known cash/card split.
ALTER TABLE sales_daily ALTER COLUMN cash_cents DROP NOT NULL;

ALTER TABLE sales_daily ALTER COLUMN card_cents DROP NOT NULL;

ALTER TABLE sales_daily DROP CONSTRAINT IF EXISTS sales_daily_source_check;

ALTER TABLE sales_daily ADD CONSTRAINT sales_daily_source_check CHECK (source IN ('manual', 'softrestaurant', 'workbook'));

-- Spend by category now also counts expenses that have no item lines.
CREATE OR REPLACE VIEW v_weekly_spend_by_category AS
  SELECT week, category, SUM(spend) AS spend_cents
  FROM (
    SELECT date_trunc('week', e.expense_date)::date AS week, c.code AS category, SUM(i.line_total_cents) AS spend
    FROM expense_items i
    JOIN expenses e ON e.id = i.expense_id AND e.status = 'confirmed'
    LEFT JOIN expense_categories c ON c.id = i.category_id
    GROUP BY 1, 2
    UNION ALL
    SELECT date_trunc('week', e.expense_date)::date, c.code, e.total_cents
    FROM expenses e
    LEFT JOIN expense_categories c ON c.id = e.category_id
    WHERE e.status = 'confirmed' AND NOT EXISTS (SELECT 1 FROM expense_items i WHERE i.expense_id = e.id)
  ) t
  GROUP BY 1, 2;
