# reports (client)

> **Scope of this file:** non-obvious context only.

## Purpose

Publish and browse Lost/Found reports (no photo yet — Slice 4): a create
wizard, a URL-synced filterable browse feed with pagination, and a report
detail page that renders the public or owner projection based on the API
response shape (never client-side guessing).

## Public surface

`index.ts` exports:

- `CreateReportPage` — `/report/new?kind=lost|found` (guarded by auth `RouteGuard` in `app/`).
- `BrowsePage` — `/browse`, public, filters + pagination synced to the URL query.
- `ReportDetailPage` — `/reports/:id`, public; switches projection on the response.
- Types: `ReportKind`, `ReportSpecies`, `ReportStatus`, `PublicReport`, `ReportProjection`, `ReportPage`.

## Owns

- `api/` endpoint wrappers (`create-report`, `browse-reports`, `get-report`) over `shared/http`, each Zod-parsing the response to a `ResultAsync<_, HttpError>`.
- Create-form validation (`create-report-form.utils.ts` — pure Zod helper).

## Depends on

- `shared/http` `ApiClient` + `useApiClient()` provider (transport, token attach).
- `react-router-dom` (`useSearchParams` for URL-synced filters, `useParams`, `useNavigate`).
- `auth` module's `RouteGuard` — wired in `app/App.tsx`, not imported here.

## Cross-app contract

`POST /reports` returns the owner projection (`viewer: 'owner'`, with contact). `GET /reports` returns `{ items, page, pageSize, total }`; items are the public projection (no contact). `GET /reports/:id` returns `viewer: 'public'` anonymously and `viewer: 'owner'` to the reporter (token attached by the shared client). Browse query params: `kind`, `species`, `page` (area/date params modelled in types for later slices).

## Gotchas

- The projection switch is driven entirely by the discriminated `viewer` field — `report-schemas.ts` uses `z.discriminatedUnion('viewer', …)` so an unknown shape becomes a `parse` `HttpError`, not a render guess.
- Browse filters live in the URL (`?kind&species&page`); changing a filter resets `page=1` and removing a filter deletes its param so a shared link round-trips.
- Create wizard is a single page with three `fieldset` sections (not three routes); the photo step is intentionally absent until Slice 4.

## Out of scope

Photo upload (Slice 4), candidates view, my-reports dashboard, lifecycle status actions, landing/hybrid feed (later slices).
