# Identity, Accounts & Security Foundation

Trove now uses an `authRepository` persistence boundary.

## Persistence modes

- When `DATABASE_URL` is configured, users, sessions and verification tokens are stored in PostgreSQL.
- Without `DATABASE_URL`, the repository falls back to in-memory storage so the local provider/booking demos remain runnable.
- Business logic imports `authRepository`; the old `authStore` export is retained only as a compatibility alias during the migration.

## PostgreSQL-backed entities

- `users`
- `sessions`
- `verification_tokens`

Session reads update `last_activity_at` only for non-expired sessions. Verification-token consumption is an atomic `UPDATE ... RETURNING`, so a token cannot be successfully consumed twice under concurrent requests.

## Production notes

- Run `pnpm db:migrate` before enabling `DATABASE_URL` in production.
- Use Redis for sessions in the next persistence step if horizontal session infrastructure is required; PostgreSQL is the current durable source of truth for this migration.
- Verification/reset codes are still exposed only in non-production responses for local development. A real email/SMS provider must replace that path before production launch.
