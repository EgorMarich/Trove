# Full booking journey

`pnpm test:journey` runs the complete local booking journey without external credentials:

1. Register a demo user.
2. Run offer price check and provider preview.
3. Create a payment intent.
4. Complete mock payment through a signed webhook.
5. Confirm the provider booking.
6. Verify the final `confirmed` state and lifecycle events.

`pnpm test:all` runs the Booking.com contract harness followed by this journey.
