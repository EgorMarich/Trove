# Trove — real test setup

## What can be tested now

There are two separate real-provider tests:

1. **YooKassa test shop** — a real hosted checkout flow with test money.
2. **Booking.com Demand API sandbox** — real API search/availability/preview/create/details/cancel against Booking.com test inventory.

They are not automatically the same payment transaction. Trove must not charge the traveller through YooKassa and then create a Booking.com `pay_at_property` reservation for the same full amount. The payment responsibility must match the provider payment model returned by Booking.com preview.

## YooKassa test shop

Required:

- YooKassa account
- test shop
- test shop ID
- test secret key
- public HTTPS callback URL if you want to exercise webhooks locally

Environment:

```env
PAYMENT_PROVIDER=yookassa
YOOKASSA_API_URL=https://api.yookassa.ru/v3
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...
PAYMENT_RETURN_URL=https://<public-host>/payment/return/{paymentIntentId}
YOOKASSA_RETURN_URL=https://<public-host>/payment/return/{paymentIntentId}
```

The current Trove implementation reconciles the payment against YooKassa's API after redirect, so a public webhook endpoint is useful but not required for the basic redirect/reconciliation test. Never commit the secret key.

## Booking.com sandbox

Required:

- Managed Affiliate Partner access
- Partner Centre access
- Demand API key
- X-Affiliate-Id
- native booking permission for the relevant order flow

Environment:

```env
BOOKING_API_BASE_URL=https://demandapi-sandbox.booking.com/3.2
BOOKING_API_KEY=...
BOOKING_AFFILIATE_ID=...
BOOKING_NATIVE_BOOKING_ENABLED=true
BOOKING_BOOKER_COUNTRY=nl
BOOKING_CURRENCY=EUR
```

Use only sandbox inventory while testing. The sandbox provides test accommodations and supports accommodation search, availability, booking and cancellation.

## Important payment distinction

For a Booking.com accommodation order, `/orders/preview` is the source of truth for payment timing and payment methods. The response can expose `pay_online_now`, `pay_online_later`, or `pay_at_the_property`. Trove must not hardcode one of these for production.

### If the selected product is pay-at-property

The Booking.com reservation can be tested without charging the full stay through YooKassa. The traveller pays according to the property's policy.

### If the selected product is pay-online

The Demand API requires the payment method supported by the preview. If Trove is the merchant of record and collects the traveller's money itself, Booking.com documents a VCC model: Trove needs a Booking.com payment agreement and the ability to generate/fund VCCs. YooKassa alone does not turn into a Booking.com VCC.

If Booking.com is the merchant of record, the integration can forward the required card/3DS data to Booking.com, which introduces a separate PSP/PCI/SCA integration and should not be implemented by storing raw card details in Trove.

## Localhost webhook

For local webhook testing, expose the backend through an HTTPS tunnel and configure the resulting public URL in YooKassa's test shop. Keep the local app's return URL pointing at the same public origin.

## Recommended first real test

Run these in order:

1. YooKassa test shop → create payment → hosted checkout → return → API reconciliation.
2. Booking.com sandbox → availability → preview → create → details → cancel.
3. Only after both are independently green, implement the exact commercial payment model for the selected Booking.com inventory.

This separation prevents a customer from being charged by Trove while the supplier expects payment at the property.
