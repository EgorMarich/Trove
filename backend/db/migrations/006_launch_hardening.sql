CREATE TABLE IF NOT EXISTS booking_consents (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL,
  ip_hash TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS booking_consents_user_idx ON booking_consents(user_id, accepted_at DESC);
