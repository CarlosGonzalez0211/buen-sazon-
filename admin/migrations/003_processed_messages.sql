-- Webhook dedupe: Meta redelivers messages it thinks were not acknowledged.
CREATE TABLE IF NOT EXISTS processed_messages (
  message_id  TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
