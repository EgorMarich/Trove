# Promotions & Loyalty

Development-stage promotion and loyalty domain. Storage is in-memory for now and must move to PostgreSQL before production.

The module keeps promotion validation separate from booking creation so a future pricing/CRM layer can reuse it.
