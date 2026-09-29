CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  image_url TEXT,
  badge TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 0,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_promotions_status_dates ON promotions(status, starts_at, ends_at, priority DESC);

CREATE TABLE IF NOT EXISTS homepage_blocks (
  id TEXT PRIMARY KEY,
  block_type TEXT NOT NULL CHECK (block_type IN ('promotion','hero','text','image','tours','guides','destinations')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  locale TEXT NOT NULL DEFAULT 'all',
  title TEXT,
  subtitle TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_homepage_blocks_public ON homepage_blocks(status, locale, sort_order);
