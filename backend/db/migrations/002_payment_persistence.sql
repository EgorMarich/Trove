-- v1.1.3: payment persistence hardening.
-- payment_events.id is used as a durable webhook/event idempotency key.
-- No card/payment credentials are stored here.
CREATE INDEX IF NOT EXISTS payment_events_type_idx ON payment_events(type, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_intents_provider_payment_idx ON payment_intents(provider, provider_payment_id);
