
## Real provider beta

The mock beta environment remains the default. For a controlled real-provider environment, configure the required YooKassa and Booking.com credentials and run `pnpm real:preflight` before any sandbox booking test. The preflight does not create a payment; the Booking.com sandbox journey may create a sandbox order.

## v1.2.8 — Real Provider E2E

Real-provider E2E is available with explicit opt-in:

```bash
pnpm real:preflight
RUN_BOOKING_REAL_E2E=true pnpm real:e2e
```

The Booking.com path is sandbox-only and performs availability → preview → create → details → cancellation cleanup. YooKassa authentication can be probed, while actual test-payment creation requires an explicit safety acknowledgement environment variable.


## Real provider test

See `docs/REAL_TEST_SETUP.md` before configuring YooKassa or Booking.com credentials.

Use `deploy/.env.real-test.example` as the starting point and never commit real secrets.
