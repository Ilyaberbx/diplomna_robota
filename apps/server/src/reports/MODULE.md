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
  - `PATCH /reports/:id` (guarded) — reporter-only edit of mutable fields.
- `REPORTS_READER` / `ReportsReader` — `getRecord`, `publicById`, `browsePublic` (cross-module reads; used by `matches`/`candidates` in later slices).
- `REPORTS_WRITER` / `ReportsWriter` — `markStatus` (lifecycle transitions, wired to a route in a later slice).
- Types: `ReportKind`, `ReportSpecies`, `ReportStatus`, `ReportRecord`, `PublicReport`, `ReportPage`.

## Owns

- The `reports` table (`src/db/schema.ts`; migration `drizzle/0001_*`). Single table for both kinds — the later Candidate query reads both kinds in one query and a repository may only touch its own module's tables. `status`/`species`/`kind` stored as `text`, validated by Zod enums at the boundary (no PG enum types). `reporter_id` FKs `users.id`.

## Depends on

- `db` module's `DRIZZLE` token.
- `auth` module's `@CurrentUser()` / `@Public()` / `@OptionalUser()` decorators and `AuthenticatedUser` type (public API).
- `shared/http` `toHttp`, `ZodBody`, `ZodQuery`.

## Cross-app contract

`GET /reports` query params: `kind`, `species`, `status`, `lat`+`lng`+`radiusKm` (all-or-none; Haversine bound in SQL, no PostGIS), `from`, `to`, `page`, `pageSize`. Response `{ items, page, pageSize, total }`. Detail/create/update responses carry a `viewer` discriminator (`'public' | 'owner'`); only `'owner'` includes `contactPhone`/`contactEmail`. Reporter-only PATCH → non-reporter gets 403 `FORBIDDEN`.

## Gotchas

- `GET /reports/:id` is `@Public()` **and** `@OptionalUser()`: the guard parses the token best-effort and attaches `req.user` when valid, but never rejects a missing/bad token. Plain `@Public()` would skip token parsing entirely and the owner projection could never trigger.
- Distance filtering uses Drizzle's `sql` operator for the Haversine expression (all values are bound params) — the sanctioned way to express SQL Drizzle can't model; the PRD mandates plain-SQL Haversine, no PostGIS.
- `markStatus` (writer) is exposed for the lifecycle slice; no route uses it yet.
- `ZodQuery` was added to `shared/http/zod-body.pipe.ts` alongside `ZodBody` for query parsing as a `Result<T, ParseError>`.

## Out of scope

Photo upload/stream (Slice 4), Candidate query (Slice 5), Match loop (Slice 6), status-transition route + state machine (Slice 9).
