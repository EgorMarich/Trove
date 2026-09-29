CREATE TABLE IF NOT EXISTS marketing_content (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NULL,
  destination TEXT NULL,
  angle TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  cta JSONB NOT NULL DEFAULT '{}'::jsonb,
  campaign_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_marketing_content_status_time ON marketing_content(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_content_destination ON marketing_content(destination);
