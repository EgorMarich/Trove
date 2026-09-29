#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${TROVE_BETA_API_URL:-http://localhost:3001}"
node "$(dirname "$0")/beta-quality-gate.mjs" "$BASE_URL"
