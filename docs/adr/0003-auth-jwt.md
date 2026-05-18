# Auth — self-hosted email/password with a single JWT access token

The repo's auth mechanism was marked TBD in `/CLAUDE.md` and both app `CLAUDE.md` files. The structural contract (single canonical user id, credential on every request, global default-deny guard, `@Public()` opt-out) was already fixed; only the *mechanism* was open. This ADR picks it.

## Decision

Authentication is **self-hosted email + password**, issuing a **single signed JWT access token** (no refresh token) on register and login.

- `users` table owns the canonical identifier: `users.id` (uuid, PK). No surrogate ids elsewhere — every user FK references `users.id`.
- Passwords hashed with **argon2id**. Plaintext never logged (covered by the Pino redaction allowlist).
- Login / register return `{ token, user }`. The JWT payload is `{ sub: users.id, email }`, signed HS256 with `AUTH_JWT_SECRET` from `AppConfig`, expiry `AUTH_JWT_TTL` (default `7d`).
- A global Nest guard verifies the `Authorization: Bearer <jwt>` header on every route, attaches identity, and is read via `@CurrentUser()`. `@Public()` opts a route out (register, login, health, and read-only public report browsing).
- The client stores the token and attaches it to every request.

## Scope / explicitly deferred

Out of MVP scope, to be added later without reversing this decision: refresh-token rotation, email verification, password reset, OAuth/third-party IdP, account lockout/MFA.

## Why

- **Minimal & strict.** Smallest mechanism that satisfies the existing structural contract; no new architectural concepts.
- **Zero external services.** Critical for a locally-deployable demo and for testcontainers-based integration tests — no hosted IdP account needed to run or test the app.
- **Auditable surface.** One token type, one guard, one secret. No refresh-token store or rotation state machine to reason about.

## Alternatives considered

- **Third-party IdP (Clerk/Auth0/Supabase Auth).** Least code, but adds a hosted dependency, an external account to run locally, and signup friction for a demo. Rejected for the MVP; not precluded later.
- **Access + refresh tokens.** Better real-world session security, but adds a token store, rotation, and revocation surface that the MVP does not need. Deferred.

## Consequences

- A leaked access token is valid until expiry (no revocation). Acceptable for the MVP threat model; revisit with refresh tokens + a denylist if the app goes beyond demo.
- `AUTH_JWT_SECRET` is required config; the server must refuse to boot without it (Zod-validated `AppConfig`).
