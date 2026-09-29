CREATE TABLE IF NOT EXISTS marketing_audiences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  audience_id TEXT NULL REFERENCES marketing_audiences(id) ON DELETE SET NULL,
  channels JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_automations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trigger JSONB NOT NULL DEFAULT '{}'::jsonb,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_attribution (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NULL REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  session_id TEXT NULL,
  user_id TEXT NULL,
  offer_id TEXT NULL,
  booking_id TEXT NULL,
  revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status_time ON marketing_campaigns(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_attribution_campaign_time ON marketing_attribution(campaign_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_attribution_booking ON marketing_attribution(booking_id);
