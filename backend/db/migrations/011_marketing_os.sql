CREATE TABLE IF NOT EXISTS marketing_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  user_id TEXT NULL,
  session_id TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketing_events_name_time ON marketing_events(event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_events_user_time ON marketing_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_events_session_time ON marketing_events(session_id, occurred_at DESC);
