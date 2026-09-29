-- v1.1.4: durable provider-order boundary and reconciliation state.
ALTER TABLE provider_orders
  ALTER COLUMN provider_order_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS provider_orders_booking_status_idx
  ON provider_orders(booking_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS booking_attempts_provider_request_idx
  ON booking_attempts(provider_id, provider_request_id)
  WHERE provider_request_id IS NOT NULL;
