# Payments v1.0.7

Payment processing is provider-based and webhook-first.

## Boundary

- `PaymentProvider` owns gateway-specific operations.
- Trove stores payment intent state, not card numbers.
- Webhooks must be verified before changing payment state.
- Webhook event IDs are idempotent.
- Reconciliation queries the payment provider when state is uncertain.

## Current provider

`mock-payment` is a local provider used for development and integration tests. A real PSP can implement the same interface later.

## Security

The mock webhook uses HMAC-SHA256. In production, a real provider adapter must implement the provider's documented signature verification and timestamp/replay protections.

Do not accept raw card data into Trove unless a future provider contract explicitly requires it. Prefer hosted/tokenized PSP flows.
