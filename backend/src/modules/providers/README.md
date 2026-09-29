# Provider ecosystem

v1.0.1 introduces a provider registry/health boundary and keeps provider-specific integrations behind adapters.

## Principles

- Search, price check, redirect and native booking are independent capabilities.
- A provider can be disabled when credentials are absent without breaking the rest of search.
- Provider health is observable through `GET /api/providers/health`.
- Booking.com native order integration is intentionally isolated from Trove's internal booking record.
- Trove must not mark a provider booking as confirmed until the provider returns a successful order result.

## Booking.com native flow

Booking.com Demand API v3.2 uses `/orders/preview` before `/orders/create`. Preview returns the final price/policies and an `order_token`; the token is then used by create. The token expires after 15 minutes.

The implementation should keep the provider order token short-lived and server-side. Do not persist it in the browser or expose provider credentials.
