#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
pnpm exec tsx src/integration/real-beta-preflight.ts
