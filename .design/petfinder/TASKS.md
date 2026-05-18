# Build Plan — PetFinder MVP

Ordered, mostly vertical slices. Each slice ends green (`pnpm verify` where an app was touched). Tests are written with the slice, not after (rule-mandated on server). Conventions: kebab-case files, PascalCase React components, ISO dates, strict TS, no `any`, guard clauses, ports & adapters, `neverthrow` Results.

## M0 — Monorepo bootstrap
- [ ] 0.1 Root `package.json` (pnpm workspace + `packageManager` pin), `pnpm-workspace.yaml`, root `tsconfig`, Turbo pipeline (`verify`, `dev`, `build`).
- [ ] 0.2 `apps/server` scaffold: NestJS, tsconfig (build + dev), Vitest + SWC, Drizzle + `postgres`, Zod, `neverthrow`, Pino, helmet/throttler/CORS, `pnpm verify` script (typecheck → test → build). `src/test-utils/postgres-test-db.ts` (testcontainers).
- [ ] 0.3 `apps/client` scaffold: Vite + React 19 (React Compiler), react-router, Vitest + jsdom + Testing Library + MSW, ESLint with the `frontend-architecture` import rules, `pnpm verify` (lint → typecheck → test → build). Import `shared/design/tokens.css` globally; theme toggle (light/dark via `data-theme`).
- [ ] 0.4 `src/shared/` (server): `config/` (Zod `AppConfig` incl. `AUTH_JWT_SECRET`/`AUTH_JWT_TTL`/`STORAGE_DIR`/`DATABASE_URL`/CORS), `db/` (Drizzle client + empty `schema.ts`), `http/` (`toHttp`), `errors/` (error-tag helpers), `auth/` (JWT guard + `@CurrentUser`/`@Public`/`@RequireUser` decorators). Verify: server.

## M1 — Auth slice (vertical: DB → API → UI)
- [ ] 1.1 `users` table in `schema.ts`; `pnpm db:generate` migration.
- [ ] 1.2 Server `auth` module: repository (create/find-by-email/find-by-id, **real-PG tests**), service (register/login/getUser with argon2id, Result error tags: `EmailTaken`, `InvalidCredentials`, `NotFound`, `DbError` — **fake-port tests, all tags**), controller (`/auth/register|login|me`, **supertest**), `MODULE.md`, `index.ts` (`AuthReader`). Wire global JWT guard. Verify: server.
- [ ] 1.3 Client `shared`: http client (token attach/refresh-less, 401 → logout), Zod API response schemas, base UI primitives (Button, Input, Field, Card, Badge, StatusPill, Spinner, EmptyState, ErrorState, ThemeToggle) — all token-driven, AA, ≥44px.
- [ ] 1.4 Client `auth` module: current-user context (`GET /me` hydrate), `/login` + `/register` pages, route guard + `?next=` redirect. **Tests:** API layer (MSW), login flow → token stored → guarded redirect. Verify: client.

## M2 — Reports slice
- [ ] 2.1 `reports` table in `schema.ts`; migration.
- [ ] 2.2 Server `storage` adapter: `StoragePort`/`STORAGE_CLIENT`, local-FS impl (uuid key, MIME `jpeg|png|webp`, ≤5 MB), `MODULE.md`/`index.ts`. **Adapter test** (temp dir).
- [ ] 2.3 Server `reports` module: repository (CRUD + filtered browse + **Haversine candidate query**, real-PG tests incl. distance ranking), service (create/get/edit/status-transition state machine/candidates, dual projection public-vs-owner, authz as first-arg actor; error tags `Forbidden`/`NotFound`/`InvalidTransition`/`DbError` — fake-port tests all tags), controller (all `/reports*` routes incl. photo upload/stream, supertest: public strips contact), `MODULE.md`/`index.ts` (`ReportsReader`/`ReportsWriter`). Verify: server.
- [ ] 2.4 Client `reports` module: landing (hybrid CTA+feed), `/browse` (URL-synced filters), report detail (public vs owner projection), create wizard (3 sections, optional photo), `/me/reports`, candidates page. **Tests:** create-form validation, feed from mocked API, candidates list, projection switch. Verify: client.

## M3 — Matches slice
- [ ] 3.1 `matches` table in `schema.ts`; migration.
- [ ] 3.2 Server `matches` module: repository (create/find-by-report/transition, real-PG tests), service (propose [must own a side], confirm/reject [only the *other* reporter], contact reveal on confirmed, mark-reunited via `ReportsWriter`; error tags `Forbidden`/`NotFound`/`Conflict`/`InvalidTransition`/`DbError` — fake-port tests all tags), controller (`/matches*`, supertest: propose→confirm reveals contact), `MODULE.md`/`index.ts`. Verify: server.
- [ ] 3.3 Client `matches` module: propose action from candidates/detail, `/me/matches` (awaiting-you vs awaiting-other), match detail (confirm/reject + revealed-contact panel). **Tests:** propose action, confirm → contact panel appears. Verify: client.

## M4 — Full-stack feature-complete pass & docs
- [ ] 4.1 Wire all modules in `app.module.ts` / client router; smoke the four core flows manually in `pnpm dev`.
- [ ] 4.2 Resilient-state audit: every async surface has loading/empty/error per the brief.
- [ ] 4.3 a11y pass: AA contrast, focus rings, keyboard nav, alt text, ≥44px, mobile one-handed.
- [ ] 4.4 `local-development.md`: prerequisites, env vars, Postgres (docker), install, migrate, run server, run client, run tests, troubleshooting.
- [ ] 4.5 Update `docs/modules.md` index + every `MODULE.md`. Final `pnpm verify` both apps exits 0.

## Definition of done
All M0–M4 boxes checked; `pnpm --filter @diplomna-robota/server verify` and `pnpm --filter @diplomna-robota/client verify` both exit 0; `local-development.md` lets a fresh clone run FE+BE; `/design-review` available for the visual pass.
