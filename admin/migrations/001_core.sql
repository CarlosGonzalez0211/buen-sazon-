-- El Buen Sazon admin: core schema.
-- Conventions
--   * Money is INTEGER centavos (MXN). Never floats.
--   * Quantities are NUMERIC(12,3).
--   * Confirmed rows are never edited: corrections void the row and insert a new one
--     (voided_at / replaces_id). Reports only read status = 'confirmed'.
--   * Plain statements only (scripts/run-sql.mjs splits on ";" + newline).

-- ---------- people & access ----------

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  wa_phone    TEXT UNIQUE,
  tg_user_id  TEXT UNIQUE,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devices (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  label        TEXT,
  trusted_at   TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS magic_links (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ
);

-- ---------- catalog ----------

CREATE TABLE IF NOT EXISTS expense_categories (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('cogs', 'opex', 'capex', 'payroll', 'tax', 'other'))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  rfc         TEXT,
  kind        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  category_id  INT REFERENCES expense_categories(id),
  base_unit    TEXT NOT NULL CHECK (base_unit IN ('kg', 'g', 'l', 'ml', 'pza', 'caja', 'paquete', 'servicio')),
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maps messy ticket text to a canonical product, learned once, applied deterministically.
CREATE TABLE IF NOT EXISTS product_aliases (
  id           BIGSERIAL PRIMARY KEY,
  supplier_id  BIGINT REFERENCES suppliers(id),
  alias        TEXT NOT NULL,
  product_id   BIGINT NOT NULL REFERENCES products(id),
  UNIQUE (supplier_id, alias)
);

-- ---------- expenses ----------

CREATE TABLE IF NOT EXISTS receipts (
  id            BIGSERIAL PRIMARY KEY,
  image_url     TEXT NOT NULL,
  image_sha256  TEXT NOT NULL UNIQUE,
  uploaded_by   BIGINT NOT NULL REFERENCES users(id),
  channel       TEXT NOT NULL CHECK (channel IN ('whatsapp', 'telegram', 'web')),
  ocr_json      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id             BIGSERIAL PRIMARY KEY,
  receipt_id     BIGINT REFERENCES receipts(id),
  supplier_id    BIGINT REFERENCES suppliers(id),
  expense_date   DATE NOT NULL,
  total_cents    BIGINT NOT NULL CHECK (total_cents >= 0),
  tax_cents      BIGINT NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
  ticket_folio   TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'void')),
  entered_by     BIGINT NOT NULL REFERENCES users(id),
  confirmed_by   BIGINT REFERENCES users(id),
  confirmed_at   TIMESTAMPTZ,
  voided_at      TIMESTAMPTZ,
  replaces_id    BIGINT REFERENCES expenses(id),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses (expense_date) WHERE status = 'confirmed';

CREATE TABLE IF NOT EXISTS expense_items (
  id               BIGSERIAL PRIMARY KEY,
  expense_id       BIGINT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  product_id       BIGINT REFERENCES products(id),
  raw_text         TEXT NOT NULL,
  category_id      INT REFERENCES expense_categories(id),
  quantity         NUMERIC(12, 3) NOT NULL,
  unit             TEXT,
  unit_price_cents BIGINT NOT NULL,
  line_total_cents BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS expense_items_product_idx ON expense_items (product_id);

-- ---------- sales ----------

CREATE TABLE IF NOT EXISTS sales_daily (
  id             BIGSERIAL PRIMARY KEY,
  sale_date      DATE NOT NULL,
  channel        TEXT NOT NULL DEFAULT 'total' CHECK (channel IN ('total', 'dine_in', 'takeout', 'delivery')),
  gross_cents    BIGINT NOT NULL,
  cash_cents     BIGINT NOT NULL DEFAULT 0,
  card_cents     BIGINT NOT NULL DEFAULT 0,
  tips_cents     BIGINT NOT NULL DEFAULT 0,
  covers         INT,
  source         TEXT NOT NULL CHECK (source IN ('manual', 'softrestaurant')),
  status         TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'void')),
  entered_by     BIGINT REFERENCES users(id),
  voided_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_daily_unique_idx ON sales_daily (sale_date, channel) WHERE status = 'confirmed';

-- ---------- facturas (CFDI) tracking ----------

CREATE TABLE IF NOT EXISTS invoices (
  id            BIGSERIAL PRIMARY KEY,
  expense_id    BIGINT NOT NULL UNIQUE REFERENCES expenses(id),
  status        TEXT NOT NULL DEFAULT 'not_requested'
                CHECK (status IN ('not_requested', 'needed', 'requested', 'received', 'not_available', 'expired')),
  due_date      DATE,
  cfdi_uuid     TEXT UNIQUE,
  xml_url       TEXT,
  pdf_url       TEXT,
  requested_at  TIMESTAMPTZ,
  received_at   TIMESTAMPTZ,
  notes         TEXT
);

-- ---------- audit ----------

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id),
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   BIGINT,
  detail      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- first reporting views ----------

CREATE OR REPLACE VIEW v_expenses_confirmed AS
  SELECT * FROM expenses WHERE status = 'confirmed';

CREATE OR REPLACE VIEW v_weekly_spend_by_category AS
  SELECT date_trunc('week', e.expense_date)::date AS week,
         c.code AS category,
         SUM(i.line_total_cents) AS spend_cents
  FROM expense_items i
  JOIN expenses e ON e.id = i.expense_id AND e.status = 'confirmed'
  LEFT JOIN expense_categories c ON c.id = i.category_id
  GROUP BY 1, 2;

CREATE OR REPLACE VIEW v_product_price_history AS
  SELECT p.id AS product_id, p.name, e.expense_date, e.supplier_id,
         i.unit_price_cents, i.unit
  FROM expense_items i
  JOIN expenses e ON e.id = i.expense_id AND e.status = 'confirmed'
  JOIN products p ON p.id = i.product_id;

CREATE OR REPLACE VIEW v_daily_margin AS
  SELECT s.sale_date,
         s.gross_cents AS sales_cents,
         COALESCE(x.spend_cents, 0) AS spend_cents
  FROM (SELECT sale_date, SUM(gross_cents) AS gross_cents
        FROM sales_daily WHERE status = 'confirmed' GROUP BY sale_date) s
  LEFT JOIN (SELECT expense_date, SUM(total_cents) AS spend_cents
             FROM expenses WHERE status = 'confirmed' GROUP BY expense_date) x
    ON x.expense_date = s.sale_date;
