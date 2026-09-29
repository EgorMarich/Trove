#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());"

for file in db/migrations/*.sql; do
  version=$(basename "$file")
  if psql "$DATABASE_URL" -tAc "SELECT 1 FROM schema_migrations WHERE version='$version'" | grep -q 1; then
    echo "Skipping $version (already applied)"
    continue
  fi
  echo "Applying $version"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations(version) VALUES ('$version') ON CONFLICT DO NOTHING;"
done
