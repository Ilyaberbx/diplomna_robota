# Module index

One-line summary of every module in the repo. Each entry links to the module's `MODULE.md`. Update rule and rationale: see `/CLAUDE.md` and `docs/adr/0002-per-module-context-docs.md`.

## Client (`apps/client/src/modules/`)

- [auth](../apps/client/src/modules/auth/MODULE.md) — login/register pages, token storage, current-user session + route guard.
- [connectivity](../apps/client/src/modules/connectivity/MODULE.md) — health/connectivity tracer page (ok/loading/error) plus theme toggle.
- [reports](../apps/client/src/modules/reports/MODULE.md) — create wizard, URL-synced browse feed, report detail with projection switch.

## Server (`apps/server/src/`)

- [auth](../apps/server/src/auth/MODULE.md) — `users` table + register/login/me, `AuthReader` port, global default-deny JWT guard + `@Public`/`@CurrentUser`/`@OptionalUser`/`@RequireUser`.
- [reports](../apps/server/src/reports/MODULE.md) — single `kind`-discriminated `reports` table; create/browse/detail/edit with service-layer dual projection; `ReportsReader`/`ReportsWriter` ports.
- [health](../apps/server/src/health/MODULE.md) — public `GET /health` liveness probe.
