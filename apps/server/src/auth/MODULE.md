# auth (server)

> **Scope of this file:** non-obvious context only.

## Purpose

Global default-deny authentication: verifies a single HS256 JWT bearer token on every route, attaches identity, and supplies the opt-out/identity decorators (ADR 0003).

## Public surface

- `AuthModule` — registers `JwtAuthGuard` as `APP_GUARD` (global).
- `@Public()` — opts a route out of the guard.
- `@RequireUser()` — marks a route as requiring an existing user row (enforced by future user module).
- `@CurrentUser()` — param decorator returning `AuthenticatedUser` (`{ id, email }`).
- `AuthenticatedUser` type.

## Owns

The global guard (`APP_GUARD`). No DB tables (the `users` table is owned by a future auth/users domain module). JWT verification with `AUTH_JWT_SECRET` from `AppConfig`.

## Depends on

`config` module's `APP_CONFIG` token (`authJwtSecret`).

## Cross-app contract

Client sends `Authorization: Bearer <jwt>`; payload is `{ sub: users.id, email }`. Missing/invalid token on a non-`@Public()` route → 401.

## Gotchas

- The guard is default-deny: every route is protected unless `@Public()`.
- `try/catch` in `jwt.guard.ts` is the sanctioned third-party (jsonwebtoken) boundary wrap — it converts a throw to `null` immediately.
- Token issuance (register/login) is NOT here yet — that lands with the auth/users domain module in a later slice.

## Out of scope

Password hashing, the `users` table, register/login endpoints, refresh tokens (ADR 0003 deferred list).
