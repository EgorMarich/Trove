# v0.9 CRM & Communications

Communication preferences are channel-specific and separate marketing from transactional messages.

The development adapter is intentionally mock: emitting an event creates a sent notification in the history without calling an external provider.

Marketing delivery requires the relevant user consent and verified contact. Transactional delivery is controlled separately. Critical security events can be emitted through transactional channels regardless of marketing settings.

Production follow-up: queue/outbox, PostgreSQL persistence, provider adapters (email/SMS/push), retries, delivery webhooks, template versioning, unsubscribe links, and provider-level observability.
