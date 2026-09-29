-- v1.1.5: durable security audit trail.
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  ip TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_events_user_created_idx ON audit_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_type_created_idx ON audit_events(type, created_at DESC);
