# Backend rules

> **Scope of this file:** rules here apply to **`apps/server/` only**. If a rule also applies to the client, promote it to `/CLAUDE.md` instead. Repo-wide rules in `/CLAUDE.md` (code style, conventions, domain language, auth structural rules) are loaded automatically alongside this file.

## Auth: every endpoint is authenticated

> **Auth mechanism: TBD.** Define your auth provider/token scheme here and in `docs/adr/` when chosen. The structural rules below hold regardless of mechanism.

Every Nest route is authenticated by default via a global auth guard. When adding a new endpoint:

1. **Do not** add `@UseGuards(...)` on controllers or methods. The global guard already runs on every route.
2. Read the user identity via `@CurrentUser() user: { id: string }`. Never read the `Authorization` header or `req.user` directly.
3. If the route requires the user to already exist in our DB (an existing domain record), add `@RequireX()`. **Routes that create that record** must NOT have it — they create the row.
4. Public routes need an explicit `@Public()` decorator and a one-line comment explaining why. Default-deny is the rule.

The cross-cutting auth contract (canonical user identifier, credential on every request) lives in `/CLAUDE.md`.

## Tech stack

This is the canonical stack for `apps/server/`. Names + major versions only — `package.json` is the source of truth for exact versions; this list exists so neither a model nor a human has to re-derive *what kind of project this is* from the lockfile.

- **Runtime / framework:** Node.js, NestJS (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`).
- **Language / build:** TypeScript (strict). `tsc -p tsconfig.build.json` for the production build, `@nestjs/cli` (`nest start --watch`) for dev/watch, SWC (via `unplugin-swc`) for vitest transpile. Dev/watch must use a transpiler that emits `emitDecoratorMetadata` — `tsx`/esbuild does not, which breaks all NestJS reflection-based DI (see `docs/adr/0006-dev-runtime-nestjs-cli.md`).
- **Persistence:** PostgreSQL via the `postgres` driver, Drizzle ORM (`drizzle-orm` + `drizzle-kit` for migrations). Schema in `src/db/schema.ts`; migrations in `drizzle/`.
- **Auth:** TBD. Pick an auth provider/token scheme and document it here and in `docs/adr/`. The structural auth rules above hold regardless of mechanism.
- **Errors as values:** `neverthrow` (`Result` / `ResultAsync`) — see `.claude/rules/error-handling.md`.
- **Validation:** Zod (DTOs + `AppConfig`). `class-validator` / `class-transformer` are forbidden (`error-handling.md` rule 9).
- **Logging:** Pino with a redaction allowlist (`.claude/rules/security.md` rule 2).
- **HTTP hardening:** `helmet`, `@nestjs/throttler`, CORS allowlist sourced from `AppConfig`.
- **Testing:** Vitest, `@testcontainers/postgresql` for ephemeral Postgres in repository tests, `supertest` for controller HTTP tests — see `.claude/rules/testing.md`.
- **Package manager:** pnpm (workspace root pins `packageManager`); Turbo orchestrates workspace scripts from the repo root.

If a change pulls in something not on this list (different ORM, different validator, different test runner, an event bus / mediator, a separate use-case layer), stop and propose an ADR in `docs/adr/` first. The stack above is load-bearing for the rules in `.claude/rules/`.

## Verification: `pnpm verify`

After any change in `apps/server/`, run `pnpm verify` (from `apps/server/`, or `pnpm --filter @diplomna-robota/server verify` from the repo root). It is the single source of truth that the change is good — a change is **not** done until it exits 0. If a step is intentionally skipped (e.g. docs-only PR), say so explicitly.

`pnpm verify` runs, in order:

1. **`pnpm typecheck`** → `tsc --noEmit`. Catches every type error, including `Result` error-tag exhaustiveness violations through `assertNever` (`error-handling.md` rule 5).
2. **`pnpm test`** → `vitest run --passWithNoTests`. Repository tests boot ephemeral Postgres via testcontainers; service tests use hand-written port fakes; controller tests use `supertest`. Coverage rule (success path + every error tag) lives in `.claude/rules/testing.md` rule 5.
3. **`pnpm build`** → `tsc -p tsconfig.build.json`. Confirms the production compile passes (its settings may differ from the dev `tsconfig.json`).

Out of scope of `pnpm verify`:

- **Linting** — `pnpm lint` is currently a no-op. Fold it in once real linting lands.
- **Migration drift** — `pnpm db:generate` is run manually when `src/db/schema.ts` changes. Revisit and add `drizzle-kit generate --check` here if drift becomes a recurring footgun.
- **Dev runtime** — `pnpm dev` is for iteration, not verification.

## Backend rules

@.claude/rules/error-handling.md
@.claude/rules/folder-structure.md
@.claude/rules/backend-architecture.md
@.claude/rules/security.md
@.claude/rules/testing.md
