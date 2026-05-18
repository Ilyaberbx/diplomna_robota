# matches (client)

> **Scope of this file:** non-obvious context only.

## Purpose

The reunion loop UI: propose a Match from the candidates surface, review the
Matches touching a report split into "Awaiting your decision" vs "Awaiting the
other party", and a Match detail page that confirms/rejects and renders the
mutually-revealed contact panel — labelled as revealed *because the match is
confirmed*. Contact is never shown for a `proposed`/`rejected` match.

## Public surface

`index.ts` exports:

- `ProposeMatchButton` — a propose action (used on the reports candidates
  surface). Props are `{ lostReportId, foundReportId }`.
- `MyMatchesPage` — `/me/matches?reportId=`, guarded; splits `proposed`
  matches into awaiting-your-decision (you are not the proposer) vs
  awaiting-the-other-party (you proposed).
- `MatchDetailPage` — `/matches/:id?reportId=`, guarded; confirm/reject
  actions and the revealed-contact panel on confirm.
- Types: `MatchStatus`, `MatchView`, `RevealedMatchView`.

## Owns

- `api/` endpoint wrappers (`propose-match`, `list-matches`, `decide-match`
  [confirm+reject]) over `shared/http`, each Zod-parsing the response to a
  `ResultAsync<_, HttpError>`.
- `components/propose-match-button/` — dumb button + smart hook.
- `pages/my-matches/` and `pages/match-detail/` (each: dumb page +
  colocated smart hook + dumb sub-components).

## Depends on

- `shared/http` `ApiClient` + `useApiClient()` provider.
- `auth` module's `useAuthSession()` — the current user id drives the
  proposer-vs-decider split on `/me/matches`.
- `react-router-dom` (`useParams`, `useSearchParams`, `Link`).
- `auth` module's `RouteGuard` — wired in `app/App.tsx`, not imported here.

## Cross-app contract

`POST /matches { lostReportId, foundReportId }` → `MatchView` (proposer must
own one side, else 403; mismatched kinds → 403; duplicate pair → 409).
`GET /matches?reportId=` → `MatchView[]`. `POST /matches/:id/confirm` →
`RevealedMatchView` (`MatchView` + `lostReport`/`foundReport` owner
projections with contact). `POST /matches/:id/reject` → `MatchView`.

## Gotchas

- There is no `GET /matches/:id` server route; the detail page loads via
  `GET /matches?reportId=` (the report id rides in the `?reportId=` query) and
  finds the row by `:id`. Both `/me/matches` and `/matches/:id` therefore
  require `?reportId=` — the propose-confirmation link and the candidates
  surface always carry it.
- The reveal panel renders only in the `confirmed` state — confirm replaces
  the state with the `RevealedMatchView`; reject returns to `ready` with the
  rejected `MatchView`; neither `proposed` nor `rejected` ever shows contact.
- `ProposeMatchButton` derives lost/found from the candidate's `kind`
  (a candidate is opposite-kind to the subject report); the candidates page
  passes the right pair direction.
- Server enforces the proposer-cannot-decide rule; the UI shows the
  confirm/reject buttons and surfaces a server `Forbidden` as the error state
  rather than pre-hiding (the list-page split already segregates by role).

## Out of scope

Marking a Lost Report `reunited` after confirm (report lifecycle, later
slice). A dedicated my-reports entrypoint to enumerate all of a user's
matches without a `reportId` (the server exposes matches per report only;
the propose flow and report surfaces always supply the report id).
