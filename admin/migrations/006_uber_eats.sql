-- Uber Eats Manager exports: one row per order, per weekly payout, per order item.
-- Money is integer centavos. Keys make re-imports idempotent (overlapping report ranges are fine).
CREATE TABLE IF NOT EXISTS uber_payouts (
  payout_ref      text PRIMARY KEY,
  payout_date     date NOT NULL,
  order_count     int,
  sales_cents     bigint NOT NULL,
  sales_after_cents bigint,
  marketplace_fee_cents bigint,
  fee_vat_cents   bigint,
  vat_withholding_cents bigint,
  isr_withholding_cents bigint,
  other_payments_cents bigint,
  payout_cents    bigint NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uber_orders (
  source_key      text PRIMARY KEY,
  order_code      text,
  order_date      date NOT NULL,
  completed_at    timestamp,
  status          text,
  channel         text,
  sales_cents     bigint NOT NULL DEFAULT 0,
  offers_cents    bigint NOT NULL DEFAULT 0,
  sales_after_cents bigint NOT NULL DEFAULT 0,
  marketplace_fee_cents bigint NOT NULL DEFAULT 0,
  fee_vat_cents   bigint NOT NULL DEFAULT 0,
  vat_withholding_cents bigint NOT NULL DEFAULT 0,
  isr_withholding_cents bigint NOT NULL DEFAULT 0,
  other_payments_cents bigint NOT NULL DEFAULT 0,
  payout_cents    bigint NOT NULL DEFAULT 0,
  payout_date     date,
  payout_ref      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS uber_orders_date_idx ON uber_orders (order_date);
CREATE INDEX IF NOT EXISTS uber_orders_payout_idx ON uber_orders (payout_ref);

CREATE TABLE IF NOT EXISTS uber_order_items (
  source_key      text PRIMARY KEY,
  order_key       text NOT NULL,
  order_date      date NOT NULL,
  item_name       text NOT NULL,
  quantity        int NOT NULL,
  unit_price_cents bigint NOT NULL,
  status          text
);
CREATE INDEX IF NOT EXISTS uber_items_name_idx ON uber_order_items (item_name);
