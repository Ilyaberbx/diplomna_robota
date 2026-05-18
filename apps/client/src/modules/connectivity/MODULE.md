# connectivity (client)

> **Scope of this file:** non-obvious context only.

## Purpose

The walking-skeleton tracer page (calls `GET /health` through the shared HTTP client, renders loading / ok / error, plus a light/dark theme toggle) and the app-level not-found page. Neither owns a business domain.

## Public surface

- `HealthPage` — route-addressable page (mounted at `/health` by `app/`; the connectivity diagnostic surface).
- `NotFoundPage` — the `*` catch-all 404 page (mounted by `app/`), styled, with a link back to `/`.

## Owns

The `/health` endpoint wrapper (`api/get-health.ts`) and the connectivity state machine. No global state.

## Depends on

- `shared/http` — `ApiClient` transport (via the `useApiClient` provider hook).
- `shared/providers/theme` — `useTheme` for the toggle.

## Cross-app contract

`GET /health` → `200 { status: 'ok' }` (server `health` module). Any non-ok HTTP/parse/network outcome renders the error state.

## Gotchas

The health route is `@Public()` server-side; the client still sends a placeholder bearer token because the shared HTTP client mandates one (real auth wiring lands in slice #4).

## Out of scope

Authenticated data; any business domain. `HealthPage` exists only to prove the client↔server wire; `NotFoundPage` is presentational only (no data).
