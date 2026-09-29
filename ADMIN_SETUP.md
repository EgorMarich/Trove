# Trove Admin — quick start

## 1. Database

Apply the new migration together with the existing migrations:

```bash
pnpm --dir backend db:migrate
```

The new migration is `backend/db/migrations/008_admin_cms.sql`.

## 2. Create administrator

```bash
DATABASE_URL="postgres://..." \
ADMIN_EMAIL="admin@trove.local" \
ADMIN_PASSWORD="change-me-please" \
pnpm --dir backend admin:create
```

The command creates the account if it does not exist, or changes an existing account to `admin` and resets its password.

## 3. Run services

```bash
pnpm --dir backend dev
pnpm --dir frontend dev
```

Open:

- Public app: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- Admin API: `http://localhost:3001/api/admin`

## Roles

- `user` — normal customer
- `editor` — Guides CMS
- `manager` — tours / operational sections
- `admin` — full back office

## Current admin modules

- Dashboard
- Users + user profile/history
- Bookings
- Tours / provider search
- Guides CMS
- Public guide publishing API
- Audit events
- User activity analytics

The existing session cookie is reused, so there is no second authentication system for the admin.
