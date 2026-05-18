# Client i18n layer: custom typed-catalog provider-unit (uk + en)

The thesis chapter-7 figures must show a Ukrainian UI to satisfy the Odesa
Polytechnic formatting rule §4 («усі написи на рисунках — українською»). The
client (`apps/client`, Vite + React) currently has no localization: ~175
user-facing strings across ~18 screens are hardcoded English literals. Adding
a localization layer introduces a new ambient state concern, which
`workflow.md` rule 4 requires recording as an ADR before implementation.

## Context

- `frontend-architecture.md`: shared cross-cutting state uses the
  **provider-unit pattern** (Provider + `*.context.ts` + `use-*.ts` +
  `*.types.ts` + `index.ts` exporting only Provider + hook), like
  `shared/providers/theme`. **No Redux/Zustand / external store.**
- House null-guard convention: `useTheme`/`useApiClient` throw without a
  provider mounted.
- Server enums drive visible labels and must not be localized server-side
  (client-only scope): `kind` (lost|found), `species` (dog|cat|bird|other),
  report `status` (active|reunited|resolved|closed), match `status`
  (proposed|confirmed|rejected).
- Tests: every page test owns a `__fixtures__/render-*.tsx` that builds its
  provider tree; test bodies assert **English** literals via
  `getByRole`/`getByText`. There is no shared render helper.
- `thesis/take_screenshots.mjs` already seeds `localStorage` (auth token)
  before navigating, and runs the browser context with `locale: 'uk-UA'`.
- Diploma RULES require ISO 8601 dates throughout; the UI already renders
  dates as ISO slices.
- A second, language-independent §4 MAJOR exists: full-page screenshots
  render functional text at ~4–6 pt (< 10 pt). Out of scope for this ADR
  except that the re-shoot strategy is recorded under Consequences.

## Decision

Introduce a **custom typed-catalog i18n provider-unit** at
`apps/client/src/modules/shared/providers/i18n/`:

```
shared/providers/i18n/
  I18nProvider.tsx        # holds locale state, detection, persistence
  i18n.context.ts         # createContext<I18nContextValue | null>(null)
  use-i18n.ts             # consumer hook; THROWS without provider (house pattern)
  i18n.types.ts           # Locale, Catalog, TKey (union derived from en), params
  i18n.utils.ts           # key resolution + Intl.PluralRules selection (pure)
  catalogs/
    en.ts                 # source-of-truth key set = today's literals, extracted
    uk.ts                 # Ukrainian translations; must satisfy the en key type
  index.ts                # exports { I18nProvider, useI18n } ONLY
```

Decisions locked via design review:

1. **Library:** none. Hand-rolled, zero new runtime dependency. `en.ts`
   defines the canonical key set; `uk.ts` is typed against it so a missing or
   extra key is a compile error (`pnpm typecheck` gate).
2. **Scope:** full bilingual, **uk + en switchable**. All ~175 strings
   migrated in one pass — `en` = mechanically extracted current literals,
   `uk` = translations. No mixed-language screens shipped.
3. **Default + detection:** `localStorage['petfinder.locale']` →
   `navigator.language` (uk* ⇒ uk) → **`'en'` fallback**. Product default
   stays English, so existing test assertions stay green untouched.
4. **Locale switch:** a compact segmented control in `AppShell` beside the
   theme toggle; choice persisted to `localStorage['petfinder.locale']`.
5. **Provider contract:** `useI18n()` **throws** without `<I18nProvider>`
   (consistent with `useTheme`/`useApiClient`). The ~10
   `__fixtures__/render-*.tsx` each gain one `<I18nProvider>` wrapper line;
   test bodies and assertions are unchanged (en catalog renders the same
   English literals).
6. **Enum labels:** central catalog keys per enum value
   (`report.kind.lost`, `report.species.dog`, `match.status.confirmed`, …).
   `status-pill.constants.ts` / `my-reports-page.constants.ts` stop holding
   English literals and instead map enum value → i18n key, resolved via `t()`
   at render. Single source of truth, type-checked.
7. **Plurals:** `Intl.PluralRules(locale)` (built-in) selects a CLDR category;
   the catalog supplies per-category key variants
   (`candidates.one|few|many|other`, days-apart, page count). Correct
   Ukrainian grammar, no dependency.
8. **Dates/numbers:** keep ISO 8601 rendering as-is (diploma RULES require
   ISO); no locale date reformatting in this change.

`t` signature: `t(key: TKey, params?: Record<string, string | number>):
string`, with a `count` param triggering plural-category resolution
(`${key}.${category}` → falls back to the base `key`).

**Smart-hook carve-out (deviation, recorded per workflow rule 4):**
`frontend-architecture.md` reserves component hook calls for the feature
hook. `useI18n()` is exempted as an **ambient cross-cutting read**, exactly
like the theme: it may be called directly in any component/page/leaf that
renders text, instead of threading `t` through every `useXPage()` /
sibling-component prop chain. Rationale: i18n is read-only ambient context
with no business logic; threading it through ~12 page hooks and every dumb
leaf would add churn and indirection without testability benefit (the hook
is already independently testable). The lint config does not enforce the
smart-hook rule; this carve-out is the sanctioned, documented exception.

## Consequences

- `I18nProvider` mounted outermost in `app/App.tsx` (wraps Theme →
  ApiClient → Router). **No `shared/providers/i18n/MODULE.md` and no
  `docs/modules.md` entry** — deliberately consistent with the sibling
  shared providers (`theme`, `api-client`), which have neither;
  `docs/modules.md` indexes domain modules, not `shared/` sub-providers.
  This ADR is the module's reference doc (public surface + ownership +
  gotchas below). Adjusted from the original plan to match codebase
  convention rather than introduce an inconsistent lone doc.
- One large, mostly mechanical diff: every screen swaps literals for `t()`
  keys; two catalogs; ~10 fixture wrappers. `pnpm verify` (lint, typecheck,
  test, build) must exit 0; typecheck enforces uk/en key parity.
- Thesis re-shoot: `take_screenshots.mjs` seeds
  `localStorage['petfinder.locale']='uk'` (via `addInitScript`) and
  re-captures 7.1–7.4 with a **narrower viewport / element-clipped region**
  so embedded text is ≥ 10 pt at ~160 mm (clears the second §4 MAJOR). Then
  rebuild `diploma.pdf` and re-run `/grill-diploma`.
- Future locales: add a `catalogs/<x>.ts` typed against `en`; no structural
  change.

## Alternatives considered

- **react-i18next / react-intl:** standard, ICU plurals, ecosystem tooling.
  Rejected: new runtime dependency + state layer, untyped JSON catalogs by
  default, patterns misaligned with the provider-unit/no-store house style;
  overkill for two locales.
- **uk-only string replacement:** smallest change. Rejected: user requires a
  switchable bilingual product, not just thesis figures.
- **Server-localized labels:** rejected — couples server to presentation and
  breaks client-only scope.
- **Lenient `useI18n` (en fallback, no throw):** zero fixture churn.
  Rejected: a quiet global default contradicts the house null-guard rule;
  explicit provider is preferred and the fixture edits are mechanical.
