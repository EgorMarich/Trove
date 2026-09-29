# Infrastructure

The infrastructure layer is intentionally independent from domain modules.

```text
infrastructure/
├── database/
│   ├── client.ts
│   └── health.ts
└── redis/
    ├── client.ts
    ├── idempotency.ts
    └── lock.ts
```

Domain modules should depend on repository contracts, not directly on PostgreSQL or Redis. The next migration step will introduce repositories around the existing store interfaces and switch implementations without changing the booking API contract.
