-- v1.1.9: operational indexes for background reconciliation.
CREATE INDEX IF NOT EXISTS payment_intents_reconciliation_idx
  ON payment_intents(status, updated_at ASC)
  WHERE provider_payment_id IS NOT NULL AND status IN ('processing','unknown');

CREATE INDEX IF NOT EXISTS provider_orders_reconciliation_idx
  ON provider_orders(status, updated_at ASC)
  WHERE provider_order_id IS NOT NULL AND status IN ('unknown','pending');
