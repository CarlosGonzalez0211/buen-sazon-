-- Store the original photo in Postgres for now (4 users, ~300 KB per ticket).
-- Move to object storage later; image_url is kept for that.
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS image_bytes BYTEA;

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS image_mime TEXT;

ALTER TABLE receipts ALTER COLUMN image_url DROP NOT NULL;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS issues JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS expenses_dupe_idx ON expenses (supplier_id, expense_date, total_cents);
