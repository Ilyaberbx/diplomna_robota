# health (server)

> **Scope of this file:** non-obvious context only.

## Purpose

Liveness probe for the API and for the client's connectivity tracer.

## Public surface

- `GET /health` — `@Public()`, returns `{ status: 'ok' }`.
- `HealthModule` (barrel export).

## Owns

API route prefix `/health`. No DB tables.

## Depends on

`auth` module's `@Public()` decorator (the route opts out of the global guard).

## Cross-app contract

`GET /health` → `200 { status: 'ok' }`. The client `connectivity` module calls this to render an ok/loading/error state.

## Gotchas

Must stay `@Public()` — it is the unauthenticated liveness/readiness signal.

## Out of scope

Deep readiness checks (DB ping, migrations). Liveness only.
