# Module index

One-line summary of every module in the repo. Each entry links to the module's `MODULE.md`. Update rule and rationale: see `/CLAUDE.md` and `docs/adr/0002-per-module-context-docs.md`.

## Client (`apps/client/src/modules/`)

- [auth](../apps/client/src/modules/auth/MODULE.md) — login/register pages, token storage, current-user session + route guard.
- [connectivity](../apps/client/src/modules/connectivity/MODULE.md) — health/connectivity tracer page (ok/loading/error) plus theme toggle.
- [reports](../apps/client/src/modules/reports/MODULE.md) — create wizard (skippable photo step), URL-synced browse feed, report detail with projection switch + reporter-only candidates link, ranked candidates page (each with a propose-match action), photo/placeholder rendering.
- [matches](../apps/client/src/modules/matches/MODULE.md) — propose action on the candidates surface, `/me/matches` split into awaiting-your-decision vs awaiting-the-other-party, match detail with confirm/reject + revealed-contact panel (shown only when confirmed).

## Server (`apps/server/src/`)

- [auth](../apps/server/src/auth/MODULE.md) — `users` table + register/login/me, `AuthReader` port, global default-deny JWT guard + `@Public`/`@CurrentUser`/`@OptionalUser`/`@RequireUser`.
- [reports](../apps/server/src/reports/MODULE.md) — single `kind`-discriminated `reports` table; create/browse/detail/edit with service-layer dual projection; reporter-only photo upload + public photo stream; reporter-only Haversine-ranked candidate query; `ReportsReader`/`ReportsWriter` ports.
- [matches](../apps/server/src/matches/MODULE.md) — `matches` table + propose/list/confirm/reject; one Match per (lost, found) pair; non-proposing-Reporter-only decide; mutual contact reveal on confirm via the `reports` `revealContact` port.
- [storage](../apps/server/src/storage/MODULE.md) — local-filesystem blob adapter behind `StoragePort`/`STORAGE_CLIENT` (photo bytes); swappable backend (ADR 0004).
- [health](../apps/server/src/health/MODULE.md) — public `GET /health` liveness probe.
