-- Weekly payroll by role, from the workbook's "Gastos sueldos" block.
-- week_no is the pay week within the month (1er, 2a, 3a ...); amounts are integer centavos.
CREATE TABLE IF NOT EXISTS payroll_weekly (
  id          bigserial PRIMARY KEY,
  month       date    NOT NULL,
  week_no     int     NOT NULL,
  role        text    NOT NULL,
  amount_cents bigint NOT NULL,
  source      text    NOT NULL DEFAULT 'workbook',
  source_key  text    NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payroll_weekly_month_idx ON payroll_weekly (month, role);
