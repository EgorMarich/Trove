#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BASE_URL="${TROVE_BETA_BASE_URL:-http://localhost:3001}"
node deploy/beta-e2e.mjs "$BASE_URL"
