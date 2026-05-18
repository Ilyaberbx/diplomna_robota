# Leaf `MatchesReaderModule` to break the reports↔matches cycle

Slice 7 adds the `reunited` lifecycle transition on a Lost Report, which is
legal only when the report has a `confirmed` Match. The rule needs a read of
the `matches` table from inside the `reports` service. This forces a
cross-module dependency decision recorded here.

## Context

- `matches` already depends on `reports` via `REPORTS_READER`
  (`MatchesModule` imports `ReportsModule`).
- `reports` must now learn "does this Lost Report have a confirmed Match?".
  `backend-architecture.md` rule 4 forbids `reports` reading the `matches`
  table directly; the read must go through a `matches` port.
- Having `ReportsModule` import `MatchesModule` while `MatchesModule` imports
  `ReportsModule` is a circular NestJS module dependency. `backend-architecture.md`
  rule 6 forbids circular DI (and `forwardRef`), and names the resolution:
  *"two modules that need to call each other indicate a missing third module
  — split, don't cycle."*

## Decision

Introduce a leaf module `MatchesReaderModule`, colocated in `src/matches/`,
that:

- owns the single `MatchesRepository` (so the `matches` table still has one
  owning module and one repository instance — `backend-architecture.md`
  rule 4 preserved),
- provides and exports the new `MATCHES_READER` / `MatchesReader` port
  (`hasConfirmedMatchForLost(lostReportId): ResultAsync<boolean, DbError>`),
  backed by `MatchConfirmationReader` whose only dependency is
  `MatchesRepository`,
- imports nothing but the global `DbModule`.

Wiring becomes acyclic:

```
MatchesReaderModule (leaf)  ←  ReportsModule  ←  MatchesModule
```

`MatchesModule` imports both `ReportsModule` (for `REPORTS_READER`, unchanged)
and `MatchesReaderModule` (to reuse the single `MatchesRepository` for the
write path). `ReportsModule` imports `MatchesReaderModule` only — never
`MatchesModule` — so no cycle and no `forwardRef`.

A new error tag `InvalidTransition` is added to `src/shared/errors.ts` and
wired into the exhaustive `error-status.ts` table as 409 `INVALID_TRANSITION`.

## Import-path note (added after a boot crash)

The module-level DAG above is acyclic, but the **ES-module** graph is not
automatically so. The shared `matches/index.ts` barrel eagerly re-exports
`MatchesModule` (a value), and `MatchesModule` imports `ReportsModule`. So if
`reports` reaches the leaf reader surface *through the `matches` barrel*, the
ESM evaluation order becomes:

```
reports.module → matches/index → matches.module → reports/index →
reports.module (re-entered) → reports.service → matches/index (mid-eval) →
MATCHES_READER in TDZ → ReferenceError at the @Inject decorator
```

This crashed the server on boot under `tsx` while `pnpm verify` stayed green
(tsc/build never execute the graph; vitest imports modules per-file in test
order, not the `main.ts → AppModule` order).

**Rule:** `reports` imports the leaf reader surface **by concrete file
path** — `MATCHES_READER`/`MatchesReader` from `matches.ports.ts`,
`MatchesReaderModule` from `matches-reader.module.ts` — never from the
`matches` barrel. Both leaf files are cycle-free (they import only the
repository + `db`/`shared`), so this makes the runtime import graph exactly
the acyclic DAG above. This is a deliberate, narrow exception to
`folder-structure.md` rule 4 (barrel-only cross-module imports), of the same
character as the deviation below and required by the same
mutual-dependency. It is not lint-enforced on the server (server `lint` is a
no-op), so no rule-config change is needed. A boot smoke
(`apps/server/src/__tests__/app.boot.test.ts`) instantiates the full
`AppModule` graph and fails the gate if this (or any) cycle returns.

## Consequence / accepted deviation

This places **two `@Module` declarations in one context folder**
(`matches/matches.module.ts` and `matches/matches-reader.module.ts`), which is
a deviation from `apps/server/.claude/rules/folder-structure.md` rule 2 ("one
NestModule per context"). The deviation is accepted because it is precisely
the "missing third module" resolution that `backend-architecture.md` rule 6
prescribes for a mutual-dependency, and the alternative (`forwardRef`) is
explicitly forbidden. The leaf module is a thin read-surface split of the same
bounded context, not a new context: it owns no new table and exposes only a
reader port. The chosen option (clean reader port + leaf module) was preferred
over "keep the check in matches and have reports delegate" because the latter
cannot be wired without the forbidden cycle.
