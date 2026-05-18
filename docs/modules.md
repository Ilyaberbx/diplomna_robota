# Module index

One-line summary of every module in the repo. Each entry links to the module's `MODULE.md`. Update rule and rationale: see `/CLAUDE.md` and `docs/adr/0002-per-module-context-docs.md`.

## Client (`apps/client/src/modules/`)

- [connectivity](../apps/client/src/modules/connectivity/MODULE.md) — health/connectivity tracer page (ok/loading/error) plus theme toggle.

## Server (`apps/server/src/`)

- [auth](../apps/server/src/auth/MODULE.md) — global default-deny JWT guard + `@Public`/`@CurrentUser`/`@RequireUser`.
- [health](../apps/server/src/health/MODULE.md) — public `GET /health` liveness probe.
