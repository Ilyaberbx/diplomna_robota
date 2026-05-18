# Dev runtime: `@nestjs/cli` (`nest start --watch`), not `tsx`

## Context

`apps/server/CLAUDE.md` pinned `tsx` as the dev/watch runner. The server had
**never successfully booted in dev** — the first `./dev.sh` run surfaced two
bugs in sequence:

1. An ESM circular-import TDZ (`Cannot access 'MATCHES_READER' before
   initialization`) — fixed separately (see ADR 0005's import-path note).
2. With that cleared, `tsx src/main.ts` failed at DI time:

   ```
   UndefinedDependencyException: Nest can't resolve dependencies of the
   JwtAuthGuard (?, Symbol(APP_CONFIG)). argument at index [0] is undefined
   ```

`JwtAuthGuard`'s constructor is `(reflector: Reflector, @Inject(APP_CONFIG)
cfg: AppConfig)`. Arg 1 (explicit token) resolves; arg 0 (injected by
**reflection metadata**, no `@Inject`) is `undefined`.

Root cause: **`tsx` is esbuild-based, and esbuild does not implement
TypeScript's `emitDecoratorMetadata`.** Without emitted `design:paramtypes`,
*every* NestJS reflection-based constructor injection across the codebase
(every `private readonly repo: XRepository`, `reflector: Reflector`, …)
resolves to `undefined`. `JwtAuthGuard` is merely the first provider Nest
instantiates. The app is fundamentally unrunnable under `tsx`.

This stayed invisible because `pnpm verify` never boots the app the way dev
does: `tsc`/`tsc build` don't execute, and `vitest` transpiles via
`unplugin-swc`, which honours the repo's already-correct `.swcrc`
(`decoratorMetadata: true`). Tests pass; dev never worked.

## Decision

Run dev/watch through **`@nestjs/cli`** (`nest start --watch`), the canonical
NestJS dev runner. Its default `tsc` builder honours `tsconfig.json`'s
`emitDecoratorMetadata: true` (via `tsconfig.build.json`, which extends it),
so reflection DI works. Concretely:

- `apps/server/package.json`: `dev` → `nest start --watch`; add devDep
  `@nestjs/cli`; **remove `tsx`** (its only use was the broken `dev` script —
  no backwards-compat shim).
- Add `apps/server/nest-cli.json` (`sourceRoot: src`, `tsConfigPath:
  tsconfig.build.json`, `deleteOutDir: true`).
- `apps/server/CLAUDE.md` tech-stack line updated, with an explicit warning
  that the dev transpiler must emit decorator metadata.

`.swcrc` (used by vitest) is unchanged and remains NestJS-correct, so the
boot smoke (`src/__tests__/app.boot.test.ts`) and dev now share
metadata-emitting semantics — the smoke faithfully represents dev's module
graph + DI resolution.

## Alternatives considered

- **`@swc-node/register` + `node --watch`** — minimal devDep, reuses
  `.swcrc`. Rejected in favour of the canonical, lower-surprise NestJS CLI
  (team preference recorded via decision prompt).
- **`tsc -w` + `node --watch dist`** — no new dep, but two processes and
  worse DX.
- **Drop reflection DI, `@Inject()` every param** — pervasive, anti-idiomatic,
  touches every service constructor. Rejected.

## Consequences

- One devDep added (`@nestjs/cli`); `tsx` removed.
- `pnpm verify` still cannot catch a *dev-runtime transpiler* regression (it
  doesn't run the dev path). Mitigation: the dev runner now uses the same
  metadata-emitting semantics as the SWC test transpiler, and the boot smoke
  exercises the full module graph + DI under SWC — a metadata/cycle
  regression fails there. A future hardening could add a `nest build`
  smoke to `verify`; out of scope here.
- `apps/server/CLAUDE.md`'s stack line is load-bearing for `.claude/rules/`;
  this ADR is the record of the deviation from the previously pinned `tsx`.
