#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${TROVE_BETA_ENV_FILE:-deploy/.env.beta}"
docker compose --env-file "$ENV_FILE" -f deploy/docker-compose.beta.yml down
