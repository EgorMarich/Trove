CREATE TABLE IF NOT EXISTS marketing_automation_executions (
  id TEXT PRIMARY KEY,
  automation_id TEXT NOT NULL REFERENCES marketing_automations(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  user_id TEXT NULL,
  session_id TEXT NULL,
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  result JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketing_automation_executions_due ON marketing_automation_executions(status, run_at);
CREATE INDEX IF NOT EXISTS idx_marketing_automation_executions_user ON marketing_automation_executions(user_id, created_at DESC);
