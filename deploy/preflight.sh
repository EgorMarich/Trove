#!/usr/bin/env sh
set -eu

: "${TROVE_DOMAIN:?TROVE_DOMAIN is required}"
: "${TROVE_ORIGIN:?TROVE_ORIGIN is required}"
: "${NUXT_PUBLIC_SITE_URL:?NUXT_PUBLIC_SITE_URL is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${REDIS_PASSWORD:?REDIS_PASSWORD is required}"
: "${PAYMENT_PROVIDER:?PAYMENT_PROVIDER is required}"
: "${OPS_METRICS_TOKEN:?OPS_METRICS_TOKEN is required}"

case "$TROVE_ORIGIN" in
  https://*) ;;
  *) echo "ERROR: TROVE_ORIGIN must use HTTPS" >&2; exit 1 ;;
esac
case "$NUXT_PUBLIC_SITE_URL" in
  https://*) ;;
  *) echo "ERROR: NUXT_PUBLIC_SITE_URL must use HTTPS" >&2; exit 1 ;;
esac

case "$POSTGRES_PASSWORD" in
  CHANGE_ME*|password|postgres) echo "ERROR: replace the PostgreSQL placeholder/password" >&2; exit 1 ;;
esac
case "$REDIS_PASSWORD" in
  CHANGE_ME*|password|redis) echo "ERROR: replace the Redis placeholder/password" >&2; exit 1 ;;
esac
case "$OPS_METRICS_TOKEN" in
  CHANGE_ME*|token) echo "ERROR: replace the operations metrics token" >&2; exit 1 ;;
esac

if [ "$TROVE_ORIGIN" != "$NUXT_PUBLIC_SITE_URL" ]; then
  echo "ERROR: TROVE_ORIGIN and NUXT_PUBLIC_SITE_URL must match" >&2
  exit 1
fi

case "$PAYMENT_PROVIDER" in
  mock-payment)
    echo "ERROR: mock-payment cannot be used for production" >&2
    exit 1
    ;;
  yookassa)
    : "${YOOKASSA_API_URL:=https://api.yookassa.ru/v3}"
    : "${YOOKASSA_SHOP_ID:?YOOKASSA_SHOP_ID is required}"
    : "${YOOKASSA_SECRET_KEY:?YOOKASSA_SECRET_KEY is required}"
    : "${PAYMENT_RETURN_URL:?PAYMENT_RETURN_URL is required}"
    case "$PAYMENT_RETURN_URL" in https://*) ;; *) echo "ERROR: PAYMENT_RETURN_URL must use HTTPS" >&2; exit 1 ;; esac
    ;;
  *)
    echo "ERROR: unsupported PAYMENT_PROVIDER=$PAYMENT_PROVIDER" >&2
    exit 1
    ;;
esac

if [ "${BOOKING_NATIVE_BOOKING_ENABLED:-false}" = "true" ]; then
  : "${BOOKING_API_KEY:?BOOKING_API_KEY is required when native Booking.com booking is enabled}"
  : "${BOOKING_AFFILIATE_ID:?BOOKING_AFFILIATE_ID is required when native Booking.com booking is enabled}"
fi

if [ "${NUXT_PUBLIC_USE_DEMO_FALLBACK:-false}" != "false" ]; then
  echo "ERROR: NUXT_PUBLIC_USE_DEMO_FALLBACK must be false in production" >&2
  exit 1
fi

echo "Production preflight OK for ${TROVE_DOMAIN}"
