# auth (client)

> **Scope of this file:** non-obvious context only.

## Purpose

Email/password auth UI + session (ADR 0003): login/register pages, JWT storage in `localStorage`, a current-user context hydrated from `GET /auth/me` on load, and a route guard that redirects unauthenticated users to `/login?next=` and back.

## Public surface

`index.ts` exports:

- `LoginPage`, `RegisterPage`, `AccountPage` — route-addressable pages.
- `RouteGuard` — wraps a guarded element; renders the child only when authenticated.
- `AuthSessionProvider` + `useAuthSession()` — the session provider unit (`{ session, login, register, logout }`).
- `tokenStorage` — the token store (`get`/`set`/`clear`); consumed by `app/api-client.ts` for `getAccessToken`.
- `PublicUser`, `AuthSession` types.

## Owns

The `/auth/register`, `/auth/login`, `/auth/me` endpoint wrappers (`api/`), the `petfinder.auth.token` localStorage key (`services/token-storage.ts`), and the auth-session state machine (`loading` → `anonymous` | `authenticated`).

## Depends on

- `shared/http` — `ApiClient` (via `useApiClient`) and `subscribeToSessionExpired` (clears the session on a hard 401).
- `react-router-dom` — `RouteGuard`/pages use `Navigate`/`useNavigate`/`useLocation`/`useSearchParams`.

## Cross-app contract

`POST /auth/register` / `POST /auth/login` → `{ token, user }`; the token is stored and attached to every later request. `GET /auth/me` → `PublicUser` hydrates the session when a token exists. A 409 on register is surfaced as the duplicate-email message.

## Gotchas

- `AuthSessionProvider` must sit **inside** the router (RouteGuard uses router hooks); `app/AppShell.tsx` is the layout route that provides it.
- The session is lazily initialised from token presence (no `setState` in an effect); the effect only does the async `/auth/me` hydration.
- Tokens are never logged. `token-storage.ts` swallows `localStorage` failures (private mode) — session simply does not persist.
- The shared HTTP client mandates a token per request; `app/api-client.ts` sends `'anonymous'` when none is stored so `@Public()` routes still work.

## Out of scope

Refresh tokens, password reset, email verification (ADR 0003 deferred). Top-bar nav / logout placement is design-brief work for a later slice.
