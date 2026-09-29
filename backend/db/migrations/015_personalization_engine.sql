CREATE TABLE IF NOT EXISTS personalization_impressions (
  id TEXT PRIMARY KEY,
  user_id TEXT NULL,
  session_id TEXT NULL,
  offer_id TEXT NOT NULL,
  placement TEXT NOT NULL,
  score INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personalization_impressions_user_time ON personalization_impressions(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_personalization_impressions_session_time ON personalization_impressions(session_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_personalization_impressions_offer_time ON personalization_impressions(offer_id, occurred_at DESC);
