# matches (server)

> **Scope of this file:** non-obvious context only.

## Purpose

Owns the reunion loop: a human-proposed link between exactly one Lost Report
and one Found Report with lifecycle `proposed` → `confirmed` | `rejected`.
On `confirmed`, the contact details of both reports are mutually revealed
**through the `reports` ReportsReader port** — this module never reads or
re-projects the `reports` table.

## Public surface

- `MatchesModule` — mounts `MatchesController`.
- Routes (all guarded):
  - `POST /matches` — propose `{ lostReportId, foundReportId }`; the proposer
    must own one side, else 403 `FORBIDDEN`. Mismatched kinds → 403. Duplicate
    `(lost, found)` pair → 409 `CONFLICT`. Returns the `proposed` match view
    (no contact).
  - `GET /matches?reportId=` — every Match touching that report (either side).
  - `POST /matches/:id/confirm` — only the *non-proposing* Reporter; returns
    the confirmed match view **plus** `lostReport`/`foundReport` as the
    contact-revealed owner projection.
  - `POST /matches/:id/reject` — only the *non-proposing* Reporter; returns
    the rejected match view (no contact).
- Types: `MatchStatus`, `MatchView`, `RevealedMatchView`.
- `MatchesReaderModule` — a leaf NestModule (folder-structure rule 2 deviation,
  ADR 0005) that owns the single `MatchesRepository` and exports the
  `MATCHES_READER` / `MatchesReader` port (`hasConfirmedMatchForLost`). It
  imports nothing but the global `DbModule`, so `ReportsModule` can depend on
  it without a cycle (`MatchesModule` imports `ReportsModule`).
- `MATCHES_READER` / `MatchesReader` — `hasConfirmedMatchForLost(lostReportId)`:
  whether the Lost Report has at least one `confirmed` Match. Consumed by
  `reports` for the reunited lifecycle rule.

## Owns

- The `matches` table (provided via `MatchesRepository`, owned by the leaf
  `MatchesReaderModule` so both the write path and the cross-module reader
  share one repository instance) (`src/db/schema.ts`; migration `drizzle/0002_*`):
  uuid pk, `lost_report_id`/`found_report_id` FK `reports.id`, `proposed_by`
  FK `users.id`, `status` text (Zod-validated at the boundary, no PG enum),
  `created_at`, `resolved_at`. `unique(lost_report_id, found_report_id)`
  enforces one Match per pair — a duplicate insert surfaces as `DbError`
  (the service pre-checks via `findPair` and returns `Conflict` first; the
  constraint is the race-safe backstop).

## Depends on

- `db` module's `DRIZZLE` token (the `matches` table client).
- `reports` module's `REPORTS_READER` / `ReportsReader` port:
  `getRecord` (ownership + decider checks) and `revealContact` (the
  contact-included owner projection on confirm). The projection rule lives in
  `reports`; this module never re-derives it.
- `auth` module's `@CurrentUser()` decorator and `AuthenticatedUser` type.
- `shared/http` `toHttp`, `ZodBody`, `ZodQuery`.

## Cross-app contract

`POST /matches` body `{ lostReportId, foundReportId }` (both uuid).
`GET /matches?reportId=` → `MatchView[]`. `confirm` response is
`RevealedMatchView` (`MatchView` + `lostReport`/`foundReport` owner
projections with `contactPhone`/`contactEmail`, `viewer: 'owner'`); all other
match payloads (`propose`, `list`, `reject`) are plain `MatchView` with no
contact anywhere.

## Gotchas

- The non-proposing Reporter is computed, not stored: load both reports,
  find which side the `proposedBy` user owns, the decider is the reporter of
  the *other* side. The proposer attempting confirm/reject → `Forbidden`.
- Only a `proposed` match can transition; a second confirm/reject →
  `Conflict`.
- Contact reveal goes exclusively through `ReportsReader.revealContact`
  (added to the reports port in this slice). `matches` holds no contact
  columns and never selects from `reports`.
- `ReportsReader.revealContact` was added for this slice; `reports`'
  `MODULE.md` lists it.
- `reports` imports the leaf reader surface (`MATCHES_READER`/`MatchesReader`
  from `matches.ports.ts`, `MatchesReaderModule` from
  `matches-reader.module.ts`) **by concrete file path, not via this module's
  `index.ts` barrel**. The barrel eagerly re-exports `MatchesModule` (which
  imports `reports`), so a barrel import reintroduces the reports↔matches ESM
  cycle at module-evaluation time (`Cannot access 'MATCHES_READER' before
  initialization`). Deliberate, narrow exception to folder-structure rule 4 —
  see ADR 0005. A boot smoke (`src/__tests__/app.boot.test.ts`) guards it.

## Out of scope

The `reunited` transition itself (the `reports` module owns the lifecycle
route + state machine; `matches` only answers "is there a confirmed Match?"
via `MATCHES_READER`). Notifications/email. Re-proposing a rejected pair (the
unique constraint keeps one row per pair; lifecycle re-open is a later
concern).
