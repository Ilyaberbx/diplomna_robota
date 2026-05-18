# Information Architecture — PetFinder

Structural layer for the frontend. Routes map to `react-router-dom`; every data interaction maps to a locked API endpoint (see `CONTEXT.md` / API surface). No endpoint is invented here.

## Route map

| Path | Page | Auth | Primary API |
|---|---|---|---|
| `/` | Landing (hybrid: dual CTA + nearby feed) | public | `GET /reports?status=active` |
| `/browse` | Browse & filter feed | public | `GET /reports` (kind, species, status, lat/lng/radius, from/to, page) |
| `/reports/:id` | Report detail (public vs owner projection) | public (richer if owner/counterpart) | `GET /reports/:id`, `GET /reports/:id/photo` |
| `/report/new?kind=lost\|found` | Create report wizard | auth | `POST /reports`, `POST /reports/:id/photo` |
| `/me/reports` | My reports (lifecycle dashboard) | auth | `GET /reports?reporter=me` (client filters), `POST /reports/:id/status` |
| `/reports/:id/candidates` | Candidates for a report | auth (reporter only) | `GET /reports/:id/candidates` |
| `/me/matches` | My matches (incoming/outgoing) | auth | `GET /matches?reportId=` per owned report |
| `/matches/:id` | Match detail (confirm/reject, revealed contact) | auth (a party only) | `POST /matches/:id/confirm`, `/reject` |
| `/login` | Login | public | `POST /auth/login` |
| `/register` | Register | public | `POST /auth/register` |
| `*` | Not found | public | — |

`GET /auth/me` hydrates the current-user context on app load when a token exists.

Routing notes:
- Guarded routes redirect unauthenticated users to `/login?next=<path>`; after auth, return to `next`.
- `report/new` reads `kind` from query so the two landing CTAs deep-link straight into the right wizard variant.
- `/reports/:id` renders the **public projection** by default and swaps to the **owner / confirmed-counterpart projection** (contact panel) based on the API response shape, not client-side guessing.

## Global navigation

- **Top bar (persistent):** logo → `/`; "Browse"; primary CTA "Report a pet" (dropdown: Lost / Found); right side: when anon → "Log in"; when authed → "My reports", "My matches", avatar/menu (logout). Collapses to a bottom-anchored action bar + hamburger on mobile (one-handed reach: primary CTA stays thumb-accessible).
- **No deep nesting.** Max depth is 2 (section → detail). Candidates and Match detail are reachable from a report/my-reports, and also linkable directly.
- **Breadcrumbs** only on detail pages (`Browse / Report` and `My reports / Candidates`).

## Page structures

### Landing `/`
Compact hero (h1 + one-line value prop) → two large CTAs ("I lost a pet" / "I found a pet") → inline "near you" feed (active reports, species chips, distance, date, status badge) → "Browse all" link. Desktop: hero + feed above fold side-by-stacked. Mobile: CTAs first, feed below. States: loading skeleton cards, empty ("No active reports near you yet — file one and we'll watch for matches"), error (retry).

### Browse `/browse`
Filter rail (kind toggle Lost/Found/All, species, radius from a location, date range, status) + result grid of report cards + pagination (`?page`). Filters reflect into the URL query so a search is shareable/back-button-safe. States: loading, empty-for-filters, error.

### Report detail `/reports/:id`
Photo (or designed placeholder), pet facts (species/breed/name/color/description), last-seen/found location + map-less coordinate summary + date, status badge (icon+label+color). If viewer is the reporter: owner toolbar (Edit, Change status, View candidates). If viewer is a confirmed counterpart: **contact panel** (clearly labeled "Revealed because this match is confirmed"). Otherwise: no contact, plus a "Think this is a match?" affordance routing into propose flow when authed.

### Create report `/report/new`
Single-page wizard, 3 progressive sections (not separate routes): (1) kind + species + core facts, (2) location + date, (3) optional photo + contact. Inline Zod errors per field, single submit. Photo step explicitly skippable ("Add later"). On success → report detail with a "published" confirmation and a nudge to review candidates.

### My reports `/me/reports`
Grouped by status (Active / Reunited|Resolved / Closed). Each row: thumbnail, key facts, candidate count badge, quick actions (status transition, candidates). Empty state routes to create.

### Candidates `/reports/:id/candidates`
Ranked list of opposite-kind candidates with the match signal made legible: species match, distance, date proximity, photo. Each has a "Propose match" action. States: loading, empty ("No likely candidates yet — we'll keep checking"), error.

### My matches `/me/matches` & Match detail `/matches/:id`
List split into **Awaiting your decision** (you are the counterpart of a proposed match) and **Awaiting the other party** (you proposed). Detail shows both reports side-by-side, the match status, and either confirm/reject actions (if you're the deciding counterpart) or the revealed contact panel (if confirmed).

## Core user flows

**Owner — lost pet (hero):** Landing → "I lost a pet" → (auth gate if anon → register/login → back) → create wizard → published → see candidates → propose match → wait → counterpart confirms → contact revealed → mark Reunited.

**Finder — found pet:** Landing → "I found a pet" → (auth) → create wizard (photo strongly encouraged here) → published → browse/candidates of Lost reports → propose match → owner confirms → contact revealed.

**Counterpart confirm:** notification-less in MVP — user checks `/me/matches` → "Awaiting your decision" → match detail → compare reports → Confirm (contact reveals for both) or Reject.

**Anonymous reassurance:** Landing → scan nearby feed → open a report (public, no contact) → prompted to register only when they want to act (propose/report).

## Status → visual contract (for tokens phase)

Each status pairs an icon + label + color token (color never alone): `lost` (urgent), `found` (accent-positive), `active`, `proposed` (neutral-pending), `confirmed` (success), `rejected` (muted-negative), `reunited`/`resolved` (success-strong), `closed` (muted).

## Out of scope (no routes)

Sightings, messaging threads, map view, notification center, admin/moderation.
