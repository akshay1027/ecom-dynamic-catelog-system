# ADR-012: Authentication Strategy — JWT in httpOnly Cookies with Role-Based Authorization

**Status:** Accepted  
**Date:** 2026-05-11  
**Branch:** feat/v8-auth

---

## Context

The catalog prototype had no authentication. Every endpoint — read and write — was fully public. Any user could create, update, or delete products and brands without credentials. This needed to change before the system could be used in any real context.

Two decisions were required:
1. **Where to store the auth token on the client** (localStorage Bearer vs httpOnly cookie)
2. **What token format to use** (session IDs vs JWTs)

Additionally, a **role model** was needed: who can do what, and how are admin accounts provisioned.

---

## Decision

### Token storage: httpOnly cookie

The access token (JWT) is stored in an httpOnly, SameSite=strict cookie. The JavaScript running in the browser cannot read it — `document.cookie` does not expose httpOnly cookies.

**Rejected alternative: localStorage Bearer token**

The Bearer pattern (`Authorization: Bearer <token>` in JS-managed localStorage) is common but has a fundamental weakness: any XSS vulnerability in the app — in your code, a dependency, or injected content — can read `localStorage` and exfiltrate the token. The attacker then has a credential that works from anywhere, indefinitely until it expires.

The httpOnly cookie cannot be read by JS at all. An XSS attacker can make authenticated requests from the victim's browser session (CSRF), but cannot steal the token itself. CSRF is mitigated here because:
- The API only accepts `Content-Type: application/json`
- Simple HTML forms cannot send JSON bodies — they cannot forge an API call that passes JSON validation
- `SameSite=strict` prevents the cookie from being sent on cross-origin navigation entirely

httpOnly cookie is the strictly safer choice for any system handling sensitive data.

### Token format: JWT (stateless)

JWT was chosen over server-side sessions (session ID stored in DB or Redis).

**Why JWT:**
- No session store required — no Redis, no sessions table, no session cleanup job
- Verifiable at middleware level by any service without a database round-trip
- Portable: if the system ever splits into microservices, each can verify the token independently

**Tradeoff accepted:** JWTs cannot be revoked before expiry without a denylist (which reintroduces stateful storage). For a 24h TTL prototype this is an acceptable tradeoff — logout clears the cookie client-side, which is sufficient for normal flows. A stolen token is valid until expiry; for prototype scope this risk is accepted.

**No refresh token:** Single 24h access token only. Keeps the implementation simple. A production system would add a long-lived refresh token (7–30d, stored in a separate httpOnly cookie) and a short-lived access token (15min).

### JWT payload

```json
{ "sub": "<user_id>", "email": "<email>", "role": "admin|viewer", "iat": ..., "exp": ... }
```

Role is embedded in the token so `authorize()` middleware never needs a database lookup.

### Role model

Two roles only:
- `admin` — full CRUD on products, brands, variants
- `viewer` — read-only (all GET endpoints are public; viewer role reserved for future explicit grants)

All write endpoints (`POST`, `PUT`, `DELETE`) on `/api/v1/products` and `/api/v1/brands` require `authenticate + authorize('admin')` applied inline per-route inside the router file.

**Rejected alternative: centralized middleware in app.js**

Attempted to split routes at app level (`app.get(...)` for public reads, `app.post(..., authenticate, authorize)` for writes). Express router instances don't isolate by HTTP method when mounted this way — the router handles all its own methods internally regardless of how it's mounted. Reverted to per-route inline middleware, which is explicit and correct.

### Admin provisioning

No public registration endpoint. Accounts are seeded via environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) on first startup. The seed script checks for existing users before inserting, making it idempotent.

**Rejected alternative: migration-time hardcoded admin**

Hardcoding credentials in a migration file is a security anti-pattern — credentials end up in git history. Env-var seeding keeps secrets out of the codebase.

### User store dual-mode

Two user store implementations with identical interface:
- `inMemoryUserStore.js` — Map-based, used when `DATABASE_URL` is not set (dev, CI without Postgres)
- `postgresUserStore.js` — Knex-based, used when `DATABASE_URL` is set

Password hashing: bcryptjs, 10 salt rounds. `findByEmail` returns the `password_hash` for verification; `findById` (used by `/me` after auth) strips it.

---

## Consequences

- All write endpoints now require an admin session cookie — unauthenticated requests return 401, wrong-role requests return 403
- Existing integration tests for products and brands required updating: each `beforeEach` now creates an admin user, logs in, and attaches the cookie to write requests
- Public GET endpoints (catalog, brands list, attribute schema) remain unauthenticated — no change for the storefront use case
- CORS updated to `credentials: true` with explicit `FRONTEND_URL` allowlist — wildcard origin cannot be used with `credentials: true`
- The frontend never handles a token string; it only calls the API with `credentials: 'include'` and lets the browser manage the cookie
