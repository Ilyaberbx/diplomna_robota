# reports (server)

> **Scope of this file:** non-obvious context only.

## Purpose

Owns the single Lost+Found `reports` table (discriminated by `kind`) and the
publish/browse/detail/edit surface. Privacy is enforced here as a
service-layer dual projection: the public projection never carries
`contactPhone`/`contactEmail`; the reporter sees the owner projection with
contact.

## Public surface

- `ReportsModule` — mounts `ReportsController`.
- Routes:
  - `POST /reports` (guarded) — create a Lost/Found report; returns the owner projection.
  - `GET /reports` (`@Public()`) — filtered, paginated browse; every item is the public projection (no contact).
  - `GET /reports/:id` (`@Public()` + `@OptionalUser()`) — public projection by default, owner projection when the bearer token matches the reporter.
  - `GET /reports/:id/candidates` (guarded, reporter-only) — opposite-kind public reports ranked by species exact-match, Haversine distance, then date-window proximity; non-reporter gets 403 `FORBIDDEN`. Each item is `{ report: PublicReport, distanceKm, speciesMatch, daysApart }`. Candidates are computed, never stored.
  - `POST /reports/:id/status` (guarded, reporter-only) — validated lifecycle transition. Body `{ status: 'reunited' | 'resolved' | 'closed' }`. Lost `active → reunited | closed`; Found `active → resolved | closed`. Illegal target/from-state → 409 `INVALID_TRANSITION`; `reunited` also requires a `confirmed` Match (checked via the `matches` `MATCHES_READER` port) else 409; non-reporter → 403 `FORBIDDEN`. Returns the owner projection.
  - `PATCH /reports/:id` (guarded) — reporter-only edit of mutable fields.
  - `POST /reports/:id/photo` (guarded, `multipart/form-data`, single `photo` field) — reporter-only; stores the photo and returns the owner projection.
  - `GET /reports/:id/photo` (`@Public()`) — streams the stored image, or 404 when the report has no photo.
- `REPORTS_READER` / `ReportsReader` — `getRecord`, `publicById`, `browsePublic`, `revealContact` (cross-module reads; `matches` uses `getRecord` for ownership/decider checks and `revealContact` for the confirmed-match contact reveal). `revealContact` returns the contact-included owner projection (`OwnerReport`) — the projection rule stays owned here; callers never re-derive contact from the raw record.
- `REPORTS_WRITER` / `ReportsWriter` — `markStatus(actorId, id, target)`: reporter-checked, state-machine-validated lifecycle transition returning the owner projection (`Forbidden | NotFound | InvalidTransition | DbError`). Wired to `POST /reports/:id/status`.
- Types: `ReportKind`, `ReportSpecies`, `ReportStatus`, `ReportRecord`, `PublicReport`, `ReportPage`.

`getCandidates` is a reporter-only domain method on `ReportsService` reached only through the controller route; it is intentionally **not** on the `ReportsReader` cross-module port (the `matches` slice composes candidates from `getRecord` + its own logic, not this reporter-scoped read).

## Owns

- The `reports` table (`src/db/schema.ts`; migration `drizzle/0001_*`). Single table for both kinds — the later Candidate query reads both kinds in one query and a repository may only touch its own module's tables. `status`/`species`/`kind` stored as `text`, validated by Zod enums at the boundary (no PG enum types). `reporter_id` FKs `users.id`.

## Depends on

- `db` module's `DRIZZLE` token.
- `auth` module's `@CurrentUser()` / `@Public()` / `@OptionalUser()` decorators and `AuthenticatedUser` type (public API).
- `storage` module's `STORAGE_CLIENT` token / `StoragePort` (photo put/get; ADR 0004).
- `matches` module's `MATCHES_READER` / `MatchesReader` port (`hasConfirmedMatchForLost`), provided by the leaf `MatchesReaderModule`. Used only by `markStatus` to enforce the reunited-requires-confirmed-Match rule. `reports` never reads the `matches` table — the cycle with `MatchesModule` is broken by depending on the leaf reader module, not `MatchesModule` (ADR 0005).
- `shared/http` `toHttp`, `ZodBody`, `ZodQuery`, `errorToStatus`/`errorToBody` (the photo stream route writes the error body directly since it is not a JSON `toHttp` return).

## Cross-app contract

`GET /reports` query params: `kind`, `species`, `status`, `lat`+`lng`+`radiusKm` (all-or-none; Haversine bound in SQL, no PostGIS), `from`, `to`, `page`, `pageSize`. Response `{ items, page, pageSize, total }`. Detail/create/update responses carry a `viewer` discriminator (`'public' | 'owner'`); only `'owner'` includes `contactPhone`/`contactEmail`. Reporter-only PATCH → non-reporter gets 403 `FORBIDDEN`.

## Gotchas

- Photo: single optional image, `image/jpeg|png|webp`, ≤5 MB. MIME + size are validated in `ReportsService.attachPhoto` (typed `UnsupportedMediaType` 415 / `PayloadTooLarge` 413 in `shared/errors.ts`, wired into `error-status.ts`), not in the controller. `attachPhoto` is reporter-only (`Forbidden`); `getPhoto` 404s when `photoKey` is null. The photo bytes live behind `storage`'s `StoragePort`; `reports` only stores the returned key in `reports.photo_key`.
- `GET /reports/:id/photo` streams via `@Res()` and bypasses `toHttp` (binary, not JSON); it maps Result errors to status/body manually with the shared `errorToStatus`/`errorToBody`. Its success response overrides `Cross-Origin-Resource-Policy` to `cross-origin` (Helmet's global default is `same-origin`) because the client embeds it as a plain cross-origin `<img src>` (ADR 0004); without this the browser blocks the image.
- `GET /reports/:id` is `@Public()` **and** `@OptionalUser()`: the guard parses the token best-effort and attaches `req.user` when valid, but never rejects a missing/bad token. Plain `@Public()` would skip token parsing entirely and the owner projection could never trigger.
- Distance filtering and candidate ranking use Drizzle's `sql` operator for the Haversine expression (all values are bound params) — the sanctioned way to express SQL Drizzle can't model; the PRD mandates plain-SQL Haversine, no PostGIS.
- `findCandidates` orders by `species = subject.species` DESC (exact-match first), then Haversine km ASC, then `abs(event_date diff in days)` ASC, filtered to the opposite `kind` and excluding the subject. The subject `eventDate` is bound as an ISO string cast `::timestamptz` — passing a JS `Date` as a bare parameter (no column type context) makes the `postgres` driver throw `ERR_INVALID_ARG_TYPE`.
- `markStatus` enforces the lifecycle state machine (`LIFECYCLE_TRANSITIONS` in `reports.types.ts` is the single source of truth): reporter check → `active`-and-allowed-target check → for `reunited`, a `confirmed`-Match check via `MATCHES_READER`. All illegal cases return `InvalidTransition` (wired into the exhaustive `error-status.ts` as 409 `INVALID_TRANSITION`).
- `ZodQuery` was added to `shared/http/zod-body.pipe.ts` alongside `ZodBody` for query parsing as a `Result<T, ParseError>`.

## Out of scope

The match loop itself (the `matches` module owns it; this module only exposes `revealContact` for the confirmed-match reveal). Multi-photo is explicitly out (PRD: single photo).
