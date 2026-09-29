# Trove production deployment

## 1. Prepare environment

Copy `deploy/.env.production.example` to `deploy/.env.production` and replace every `CHANGE_ME` value with real secrets.

Production requires:

- HTTPS domain in `TROVE_DOMAIN` / `TROVE_ORIGIN`.
- PostgreSQL and Redis passwords that are not placeholders.
- `PAYMENT_PROVIDER=yookassa` and valid YooKassa credentials.
- `PAYMENT_RETURN_URL` using HTTPS.
- `NUXT_PUBLIC_USE_DEMO_FALLBACK=false`.
- `OPS_METRICS_TOKEN` as a random secret.
- Booking.com credentials only when native provider booking is enabled.

## 2. Run preflight

From the repository root:

```sh
set -a
. ./deploy/.env.production
set +a
./deploy/preflight.sh
./deploy/compose-preflight.sh
```

`compose-preflight.sh` validates the rendered Docker Compose configuration without starting services.

## 3. Start the stack

```sh
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

The startup order is:

```text
PostgreSQL + Redis
      ↓
Migration job
      ↓
Backend
      ↓
Frontend
      ↓
Caddy / HTTPS
```

Database migrations are executed by the one-shot `migrate` service. Applied migration versions are stored in `schema_migrations`, so migrations are not replayed on every restart.

## 4. Smoke test

```sh
TROVE_BASE_URL=https://your-domain.example ./smoke.sh
```

The smoke test verifies the public frontend, readiness, API health, providers, provider health, robots and sitemap.

## 5. Backups

Create a PostgreSQL custom-format backup:

```sh
POSTGRES_CONTAINER=trove-postgres-1 \
POSTGRES_USER=trove \
POSTGRES_DB=trove \
BACKUP_DIR=./backups \
./scripts/backup-postgres.sh
```

Verify the archive before treating it as a usable backup:

```sh
BACKUP_FILE=./backups/trove-....dump ./scripts/verify-backup.sh
```

Restore only during a controlled maintenance window:

```sh
POSTGRES_CONTAINER=trove-postgres-1 \
POSTGRES_USER=trove \
POSTGRES_DB=trove \
BACKUP_FILE=./backups/trove-....dump \
./scripts/restore-postgres.sh
```

## 6. Real payment/provider rollout

Keep Booking.com native booking disabled until the partner credentials, product access and required booking flow have been verified in the appropriate provider environment.

For payments, keep YooKassa as the only production payment provider. A redirect back from the payment provider is not treated as payment proof; Trove reconciles the payment through the provider API and then continues the booking flow.

## 7. Operational checks

Backend readiness:

```text
GET /api/ready
```

Protected metrics:

```text
GET /api/ops/metrics
X-Ops-Token: <OPS_METRICS_TOKEN>
```

The reconciliation worker should remain enabled in production so unresolved payment/provider states are revisited automatically.

## 8. Rollout order

Use this order for a real beta:

1. Run preflight.
2. Validate Compose configuration.
3. Start PostgreSQL and Redis.
4. Let the migration job finish successfully.
5. Start backend/frontend/Caddy.
6. Run smoke checks.
7. Test registration/login and a complete mock/local journey in a non-production environment.
8. Configure real YooKassa credentials and verify a real payment in the appropriate test/production setup.
9. Configure Booking.com partner access and provider credentials only after access is confirmed.
10. Monitor readiness, payment reconciliation and provider reconciliation before opening traffic broadly.

## Beta Quality Gate

After `beta:up`, run the high-risk HTTP QA suite:

```bash
pnpm beta:qa
```

It verifies CSRF enforcement, booking idempotency, payment failure/retry, duplicate webhook handling, provider confirmation/recovery, cancellation boundaries, cross-user isolation, input validation, and security headers.
