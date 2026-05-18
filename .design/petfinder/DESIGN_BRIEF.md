# Design Brief — PetFinder

## What this is

PetFinder is an online service for finding lost pets. Owners publish **Lost Reports**; finders publish **Found Reports**. The system surfaces ranked candidate matches (species + geographic distance + date window) and a human confirms a **Match**, at which point the two parties' contact details are mutually revealed so they can reunite the animal.

This brief governs the **frontend only**. The domain, modules, data model, and API are locked (see `CONTEXT.md`, `docs/adr/0003-auth-jwt.md`, project memory `petfinder-mvp-decisions`).

## Goals

1. Get a distressed owner from "I lost my pet" to a published Lost Report in under a minute.
2. Immediately reassure that owner by showing active Found Reports near them.
3. Make the Finder flow (file a Found Report, browse Lost Reports) equally frictionless.
4. Make the candidate → propose → confirm → contact-revealed loop legible and trustworthy.
5. Never lose the user in a silent failure: every async surface has a designed state.

## Primary user & emotional context

- **Primary:** the distressed **Owner**, acting fast, often on mobile, possibly at night on poor signal.
- **Close second:** the calm, helpful **Finder**, usually on mobile next to the animal.
- Desktop-first layout, **mobile-adaptive** (graceful stack, one-handed reach, ≥44px targets).
- Tone: calm, reassuring, competent, urgent-but-not-alarming. **Never childish or cute.**

## Hero experience

Hybrid landing (decision C): a compact hero with two unmissable primary CTAs — **"I lost a pet"** / **"I found a pet"** — with the **live nearby feed** of active reports visible together on desktop (no fold problem), gracefully stacking on mobile (CTAs first, feed below). The feed doubles as instant reassurance ("maybe my pet is already here").

## Aesthetic philosophy

**Warm Humane** — warm neutrals, soft/rounded geometry, generous spacing, a friendly warm accent. Held to a guardrail: **mature and trustworthy, not childish**. Restrained ornamentation; content and actions always dominate decoration.

- Warm accent reserved for primary actions and positive "found / matched / reunited" signals.
- A distinct **semantic urgent color** (warm red) reserved strictly for the lost/urgent state and destructive confirmations — never decorative.
- **Light + dark themes both required** (repo `DESIGN.md` mandates parity; a night-time distressed search needs dark). Every token defined in both blocks.
- Status (lost / found / proposed / confirmed / rejected / reunited) is always communicated by **icon + label + color together** — never color alone.

## Hard constraints (non-negotiable)

- **WCAG 2.1 AA**: ≥4.5:1 text contrast, visible focus rings, full keyboard nav, alt text on all images, labelled form fields with inline Zod-driven errors.
- Touch targets ≥44px; primary actions one-hand reachable on mobile.
- Every async surface (feed, candidates, report detail, photo upload, match actions) has explicit **loading / empty / error** states. Empty is a *designed* state ("No reports near you yet — file one and we'll watch for matches"), never a blank.
- **Photo is optional, never blocking** — a report can be filed with no photo; upload degrades gracefully on slow connections and can be added later.
- Privacy is visible: contact details are never shown in browse/candidate/public views; the UI must make it obvious that contact is revealed only after a confirmed Match.

## Frontend stack (fixed — no substitutions without an ADR)

React 19 (React Compiler) + Vite + react-router-dom + CSS Modules (`*.module.css`, runtime styles in `*.styles.ts`) + Zod + `neverthrow`. Tokens consumed as CSS custom properties; HTTP via the shared client with the JWT attached; tests Vitest + Testing Library + MSW.

## Client module map

- `auth` — register/login, token storage, current-user context, route guards.
- `reports` — hybrid landing/feed, browse+filter, report detail (public vs owner projection), create Lost/Found (incl. optional photo), my-reports, lifecycle actions, candidates view.
- `matches` — propose match, incoming/outgoing match lists, confirm/reject, revealed-contact panel.
- `shared` — http client, Zod API layer, UI primitives, design tokens.

## Success criteria

- An owner can register and publish a Lost Report (with or without photo) in one short session.
- The landing feed shows active reports filtered by species/area/date with working loading/empty/error states.
- A reporter can open candidates, propose a Match; the counterpart can confirm; contact appears for both only then.
- Every screen passes AA contrast and keyboard nav; mobile layout is usable one-handed.
- Light and dark themes both fully styled with no missing tokens.

## Out of scope (deferred, designed-around but not built)

Sightings, in-app messaging, multi-photo, map view (cards/list only in MVP), refresh tokens / password reset, push notifications.
