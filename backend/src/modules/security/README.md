# Security hardening — v1.1.5

Production security boundary now includes:
- Redis-backed rate limits when Redis is configured;
- secure HTTP headers;
- HSTS in production;
- same-origin + double-submit CSRF protection for authenticated state-changing requests;
- non-HttpOnly CSRF cookie paired with the HttpOnly session cookie;
- production environment validation;
- durable PostgreSQL audit events with in-memory fallback;
- secure `__Host-trove_session` cookie in production.

The CSRF token is intentionally not the session token. The frontend reads `trove_csrf` and sends it as `X-CSRF-Token`.

Before launch, configure HTTPS, a strict `FRONTEND_ORIGIN`, `DATABASE_SSL=true`, Redis, and real secret/provider credentials. Never put payment card data into Trove.
