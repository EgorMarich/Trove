#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${TROVE_BETA_ENV_FILE:-deploy/.env.beta}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy deploy/.env.beta.example to deploy/.env.beta first." >&2
  exit 1
fi
docker compose --env-file "$ENV_FILE" -f deploy/docker-compose.beta.yml up -d --build
