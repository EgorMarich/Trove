CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id TEXT PRIMARY KEY,
  intent_score INTEGER NOT NULL DEFAULT 0,
  intent_segment TEXT NOT NULL DEFAULT 'cold',
  favorite_destinations JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_hotel_class TEXT NULL,
  budget_min NUMERIC(14,2) NULL,
  budget_max NUMERIC(14,2) NULL,
  preferred_duration_min INTEGER NULL,
  preferred_duration_max INTEGER NULL,
  last_activity_at TIMESTAMPTZ NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_intent ON customer_profiles(intent_score DESC);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_segment ON customer_profiles(intent_segment);
CREATE TABLE IF NOT EXISTS customer_destination_interest (
  user_id TEXT NOT NULL,
  destination TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, destination)
);
CREATE INDEX IF NOT EXISTS idx_customer_destination_interest_score ON customer_destination_interest(destination, score DESC);
