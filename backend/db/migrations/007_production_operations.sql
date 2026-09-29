-- v1.2.4: production operation metadata and audit lookup indexes.
CREATE INDEX IF NOT EXISTS booking_events_booking_created_idx
  ON booking_events(booking_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_created_idx
  ON audit_events(created_at DESC);
