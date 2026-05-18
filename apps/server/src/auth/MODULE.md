# auth (server)

> **Scope of this file:** non-obvious context only.

## Purpose

Self-hosted email/password authentication (ADR 0003): owns the `users` table, issues a single HS256 JWT on register/login, exposes `GET /auth/me`, and runs the global default-deny guard that verifies the bearer token on every route.

## Public surface

- `AuthModule` — registers `JwtAuthGuard` as `APP_GUARD` (global) and mounts `AuthController`.
- Routes: `POST /auth/register`, `POST /auth/login` (both `@Public()`), `GET /auth/me` (guarded).
- `@Public()` — opts a route out of the guard.
- `@OptionalUser()` — on a `@Public()` route, the guard still parses a present bearer token best-effort and attaches `req.user`, but never rejects a missing/invalid one (used by dual-projection GETs).
- `@RequireUser()` — marks a route as requiring an existing user row.
- `@CurrentUser()` — param decorator returning `AuthenticatedUser` (`{ id, email }`).
- `AUTH_READER` token + `AuthReader` port — `me(actorId)` for cross-module user lookup.
- `AuthenticatedUser`, `PublicUser` types.

## Owns

- The `users` table (`src/db/schema.ts`: `id` uuid PK = canonical user id, `email` unique, `passwordHash` argon2id, `createdAt`). Migration `drizzle/0000_*`.
- The global guard (`APP_GUARD`).
- JWT issuance/verification with `AUTH_JWT_SECRET` / `AUTH_JWT_TTL` from `AppConfig`.

## Depends on

- `config` module's `APP_CONFIG` token (`authJwtSecret`, `authJwtTtl`).
- `db` module's `DRIZZLE` token (the `users` table client).

## Cross-app contract

Client sends `Authorization: Bearer <jwt>`; payload is `{ sub: users.id, email }`. `register`/`login` return `{ token, user }`. Duplicate email → 409 `EMAIL_TAKEN`; bad login → 401 `INVALID_CREDENTIALS`. Missing/invalid token on a non-`@Public()` route → 401.

## Gotchas

- The guard is default-deny: every route is protected unless `@Public()`.
- `register`/`login` are `@Public()` because no token can exist before them.
- The password hash never leaves the service — `PublicUser`/`AuthResult` omit it; logger redaction covers `*.token`/`*.secret`.
- New error tags `EmailTaken`/`InvalidCredentials` live in `shared/errors.ts` (re-exported via `auth.errors.ts`) so the exhaustive `toHttp` table maps them; `me`'s missing-user case uses the cross-cutting `NotFound`.
- The `argon2.hash`/`argon2.verify` promises are wrapped with `ResultAsync.fromPromise` in the service (the sanctioned I/O boundary); `jwt.sign` is sync and only throws on misconfiguration.

## Out of scope

Refresh tokens, email verification, password reset, OAuth, MFA (ADR 0003 deferred list).
