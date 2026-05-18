# reports (client)

> **Scope of this file:** non-obvious context only.

## Purpose

Publish and browse Lost/Found reports with an optional single photo: a create
wizard (with an explicitly skippable photo step), a URL-synced filterable
browse feed with pagination, and a report detail page that renders the public
or owner projection based on the API response shape (never client-side
guessing). A report is never blocked by the absence of a photo.

## Public surface

`index.ts` exports:

- `CreateReportPage` — `/report/new?kind=lost|found` (guarded by auth `RouteGuard` in `app/`).
- `BrowsePage` — `/browse`, public, filters + pagination synced to the URL query.
- `ReportDetailPage` — `/reports/:id`, public; switches projection on the response. Renders a reporter-only "View candidates" link (shown only on the `viewer: 'owner'` projection).
- `CandidatesPage` — `/reports/:id/candidates`, guarded by auth `RouteGuard` in `app/`; renders the server-ranked candidate list with the legible match signal (species, distance, date proximity, photo) and loading/empty/error states.
- Types: `ReportKind`, `ReportSpecies`, `ReportStatus`, `PublicReport`, `ReportProjection`, `ReportPage`, `Candidate`.

## Owns

- `api/` endpoint wrappers (`create-report`, `browse-reports`, `get-report`, `get-candidates`, `upload-photo`) over `shared/http`, each Zod-parsing the response to a `ResultAsync<_, HttpError>`.
- Create-form validation (`create-report-form.utils.ts` — pure Zod helper).
- `components/report-photo/` — dumb `ReportPhoto` (image or designed placeholder), used by the detail page and feed cards.
- `reports.config.ts` — builds the public `GET /reports/:id/photo` URL for the `<img src>` (does not use the JSON transport; ADR 0004).

## Depends on

- `shared/http` `ApiClient` + `useApiClient()` provider (transport, token attach).
- `react-router-dom` (`useSearchParams` for URL-synced filters, `useParams`, `useNavigate`).
- `auth` module's `RouteGuard` — wired in `app/App.tsx`, not imported here.
- `matches` module's `ProposeMatchButton` (public API) — rendered per candidate on `CandidatesPage` to start the reunion loop.

## Cross-app contract

`POST /reports` returns the owner projection (`viewer: 'owner'`, with contact). `GET /reports` returns `{ items, page, pageSize, total }`; items are the public projection (no contact). `GET /reports/:id` returns `viewer: 'public'` anonymously and `viewer: 'owner'` to the reporter (token attached by the shared client). Browse query params: `kind`, `species`, `page` (area/date params modelled in types for later slices). `POST /reports/:id/photo` is `multipart/form-data` with a single `photo` field (reporter-only); `GET /reports/:id/photo` is public and streams the image or 404s. `GET /reports/:id/candidates` is reporter-only (403 to others) and returns a server-ranked `Array<{ report: PublicReport, distanceKm, speciesMatch, daysApart }>`; the client renders the array order as-is (ranking is the server's job, never recomputed here).

## Gotchas

- The projection switch is driven entirely by the discriminated `viewer` field — `report-schemas.ts` uses `z.discriminatedUnion('viewer', …)` so an unknown shape becomes a `parse` `HttpError`, not a render guess.
- Browse filters live in the URL (`?kind&species&page`); changing a filter resets `page=1` and removing a filter deletes its param so a shared link round-trips.
- Create wizard is a single page with four `fieldset` sections (not separate routes): facts, location/date, optional photo, contact. The photo step is explicitly skippable ("you can add one later"); on submit the report is created first, then — only if a file was chosen — the photo is uploaded. An upload failure is non-blocking: the user still lands on the published report.
- Photo bytes are never fetched through `shared/http`; `ReportPhoto` renders `<img src>` straight at the `@Public()` stream route. The upload path uses the new `client.upload` (multipart) added to the frozen transport surface (ADR 0004).

## Out of scope

My-reports dashboard (the candidates page is reachable from the report detail in this slice; the full `/me/reports` entrypoint lands in Slice 7), the Match propose/confirm loop itself (owned by the client `matches` module; this module only renders its `ProposeMatchButton` on the candidates surface), lifecycle status actions, landing/hybrid feed (later slices). Multi-photo is out (single photo by PRD).
