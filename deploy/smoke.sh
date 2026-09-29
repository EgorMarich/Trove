#!/usr/bin/env sh
set -eu

: "${TROVE_BASE_URL:?TROVE_BASE_URL is required, e.g. https://trove.example.com}"

fail() { echo "SMOKE FAIL: $1" >&2; exit 1; }
check() {
  name="$1"; url="$2"; expected="$3"
  body="$(mktemp)"
  trap 'rm -f "$body"' EXIT INT TERM
  status="$(curl -sS -L -o "$body" -w '%{http_code}' --max-time 15 "$url" || true)"
  [ "$status" = "$expected" ] || fail "$name returned HTTP $status (expected $expected)"
  echo "PASS $name ($status)"
}

case "$TROVE_BASE_URL" in https://*) ;; *) fail "TROVE_BASE_URL must use HTTPS" ;; esac
check "frontend" "$TROVE_BASE_URL/" 200
check "backend readiness" "$TROVE_BASE_URL/api/ready" 200
check "backend health" "$TROVE_BASE_URL/api/health" 200
check "providers" "$TROVE_BASE_URL/api/providers" 200
check "provider health" "$TROVE_BASE_URL/api/providers/health" 200
check "robots" "$TROVE_BASE_URL/robots.txt" 200
check "sitemap" "$TROVE_BASE_URL/sitemap.xml" 200

echo "Production smoke checks passed"
