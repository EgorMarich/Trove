-- Admin catalog controls for provider-backed tour offers.
-- Provider data remains source-of-truth; this table stores Trove editorial overrides.
CREATE TABLE IF NOT EXISTS admin_tour_overrides (
  provider_id TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  title_override TEXT,
  description_override TEXT,
  badge_override TEXT,
  tags_override JSONB,
  admin_notes TEXT,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider_id, offer_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_tour_overrides_active ON admin_tour_overrides(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_tour_overrides_featured ON admin_tour_overrides(is_featured);
