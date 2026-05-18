<!-- Design system contract. Components reference tokens, never hex literals. -->

# Design System — PetFinder

## Visual Language

**Warm Humane.** Warm neutral surfaces (sand/stone, never pure white or cold gray), soft generous radii, generous spacing, a single warm terracotta accent, and a distinct semantic urgent red reserved for the lost/urgent state. Held to a guardrail: **mature and trustworthy, not childish** — softness comes from radius and warmth, not from oversized rounded toys or playful color. Content and actions always dominate decoration. Light and dark themes have full token parity; a token defined in only one theme is a bug.

Status is always communicated by **icon + label + color together**, never color alone.

## Color Tokens

### Light theme

| Token | Value | Purpose |
|---|---|---|
| `--background` | `#FBF7F2` | App background (warm sand) |
| `--surface` | `#FFFDFA` | Card / panel surface |
| `--surface-raised` | `#FFFFFF` | Elevated surface (modal, popover) |
| `--border` | `#E7DED2` | Hairlines, input borders |
| `--text-primary` | `#2B2620` | Primary text (≥12:1 on background) |
| `--text-secondary` | `#5C5347` | Secondary text (≥6:1) |
| `--text-muted` | `#7C7264` | Muted/meta text (≥4.5:1) |
| `--accent` | `#BE5A33` | Primary actions, positive found/match signal |
| `--accent-hover` | `#A44A28` | Accent hover/active |
| `--accent-contrast` | `#FFFFFF` | Text/icon on accent (≥4.5:1) |
| `--urgent` | `#C2362B` | Lost / urgent state, destructive confirm |
| `--urgent-contrast` | `#FFFFFF` | Text/icon on urgent |
| `--success` | `#2F7D4F` | Confirmed / reunited / resolved |
| `--success-contrast` | `#FFFFFF` | Text/icon on success |
| `--pending` | `#9A6212` | Proposed / awaiting decision |
| `--pending-contrast` | `#FFFFFF` | Text/icon on pending |
| `--muted-status` | `#7C7264` | Closed / rejected |
| `--focus-ring` | `#BE5A33` | Focus outline (3px, always visible) |

### Dark theme

| Token | Value | Purpose |
|---|---|---|
| `--background` | `#1C1815` | App background (warm near-black) |
| `--surface` | `#262019` | Card / panel surface |
| `--surface-raised` | `#2F2820` | Elevated surface (modal, popover) |
| `--border` | `#3D352B` | Hairlines, input borders |
| `--text-primary` | `#F5EFE6` | Primary text (≥13:1 on background) |
| `--text-secondary` | `#C8BCAB` | Secondary text (≥7:1) |
| `--text-muted` | `#9C8F7C` | Muted/meta text (≥4.5:1) |
| `--accent` | `#E08054` | Primary actions, positive found/match signal |
| `--accent-hover` | `#EC9269` | Accent hover/active |
| `--accent-contrast` | `#241D16` | Text/icon on accent (≥4.5:1) |
| `--urgent` | `#E66A5C` | Lost / urgent state, destructive confirm |
| `--urgent-contrast` | `#241D16` | Text/icon on urgent |
| `--success` | `#6FB389` | Confirmed / reunited / resolved |
| `--success-contrast` | `#1C1815` | Text/icon on success |
| `--pending` | `#E0A93F` | Proposed / awaiting decision |
| `--pending-contrast` | `#241D16` | Text/icon on pending |
| `--muted-status` | `#9C8F7C` | Closed / rejected |
| `--focus-ring` | `#E08054` | Focus outline (3px, always visible) |

## Spacing scale

4px base. Tokens: `--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-5` 24 · `--space-6` 32 · `--space-8` 48 · `--space-10` 64. Component padding uses these; no raw px in component CSS.

## Radius scale

Soft, warm. `--radius-sm` 8px (inputs, chips) · `--radius-md` 12px (cards, buttons) · `--radius-lg` 20px (panels, modals) · `--radius-pill` 999px (status badges, avatar).

## Typography

Humanist system stack: `--font-sans: ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Ramp (size / line-height / weight): `--text-xs` 12/16/500 · `--text-sm` 14/20/400 · `--text-base` 16/24/400 · `--text-lg` 18/26/500 · `--text-xl` 22/30/600 · `--text-2xl` 28/36/700 · `--text-3xl` 36/44/700. Base body is `--text-base`; minimum interactive text is `--text-sm`.

## Elevation (warm-tinted shadows)

`--shadow-sm` `0 1px 2px rgba(43,38,32,.06)` · `--shadow-md` `0 4px 12px rgba(43,38,32,.10)` · `--shadow-lg` `0 12px 32px rgba(43,38,32,.16)`. Dark theme overrides the rgba base to a black tint of equivalent depth (defined in the CSS file).

## Sizing / a11y

`--tap-min: 44px` — minimum hit target for all interactive elements. Focus ring is `3px solid var(--focus-ring)` with `2px` offset, never removed.

## Status → token map

| Status | Token | Icon (lucide-style) |
|---|---|---|
| lost | `--urgent` | alert-circle |
| found | `--accent` | hand-heart |
| active | `--text-secondary` | radio |
| proposed | `--pending` | git-pull-request |
| confirmed | `--success` | check-circle |
| rejected | `--muted-status` | x-circle |
| reunited / resolved | `--success` | party-popper |
| closed | `--muted-status` | archive |

## Usage rules

- Always reference tokens via `var(--token-name)`; never hard-code hex in component CSS.
- New tokens are added to every theme block at once — a token defined in only one theme is a bug.
- Every foreground/background pairing in this file is chosen for WCAG 2.1 AA (≥4.5:1 normal text, ≥3:1 large text and non-text indicators). Do not introduce a pairing not listed here without re-checking contrast.
- Status is icon + label + color. Color-only status is forbidden (`INFORMATION_ARCHITECTURE.md` status contract).
- The CSS source of truth is `apps/client/src/modules/shared/design/tokens.css`; this file is the human-readable contract for it. They must not drift.
