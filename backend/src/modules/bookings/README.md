# Booking module

The booking module owns the Trove booking lifecycle and persistence boundary.

## Persistence
When `DATABASE_URL` is configured, `bookingStore` persists through PostgreSQL:
- bookings
- idempotency records
- lifecycle events
- provider attempts

Without `DATABASE_URL`, the same API falls back to in-memory storage for local/demo development.

## Recovery rules
- A booking may have multiple provider attempts, but only one confirmed `providerOrderId` is accepted.
- Provider failures are retryable up to 3 attempts.
- Retry scheduling uses exponential backoff at the orchestrator boundary.
- Unknown outcomes must be reconciled before another provider booking attempt is allowed in production.
- Lifecycle events and attempts are durable when PostgreSQL is enabled.

## Boundary
Business logic should use `bookingStore` rather than accessing PostgreSQL directly. This keeps the orchestrator independent from the persistence implementation and makes the remaining payment migration incremental.
