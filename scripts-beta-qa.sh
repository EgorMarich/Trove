#!/usr/bin/env bash
set -euo pipefail

check() {
  local pattern="$1" file="$2" label="$3"
  grep -Eq "$pattern" "$file" || { echo "FAIL: $label"; exit 1; }
  echo "PASS: $label"
}

check '"version": "1\.2\.6"' package.json 'root version'
check '"version": "1\.2\.6"' backend/package.json 'backend version'
check 'schema_migrations' backend/scripts-migrate.sh 'tracked migrations'
check 'CONSENT_REQUIRED' backend/src/index.ts 'server consent enforcement'
check 'PROVIDER_CANCELLATION_REQUIRED' backend/src/index.ts 'provider cancellation boundary'
check 'checkout_started' frontend/app/pages/booking/'[id].vue' 'checkout analytics'
check 'canRetryPayment' frontend/app/pages/account/bookings/'[id].vue' 'payment retry UI'
check 'Мои поездки' frontend/app/pages/payment/return/'[id].vue' 'payment recovery navigation'
check 'consent: \{ termsAccepted' backend/src/integration/full-booking-journey.ts 'journey consent contract'
check 'cancelled_draft' backend/src/integration/full-booking-journey.ts 'journey cancellation path'
check 'beta-quality-gate' package.json 'beta quality gate command'
check 'payment_failure_and_duplicate_webhook' deploy/beta-quality-gate.mjs 'payment failure/replay coverage'
check 'user_isolation' deploy/beta-quality-gate.mjs 'cross-user isolation coverage'

echo 'Static beta QA: 12/12 passed'
