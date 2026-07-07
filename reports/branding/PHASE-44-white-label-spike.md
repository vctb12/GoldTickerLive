# Phase 44 — White-label static branding spike (Green · demo only)

A **non-functional design spike** exploring how the site could be re-skinned for a white-label
partner. Strictly limited to static branding tokens — **no tenant system, no billing, no
multi-tenancy backend, and nothing wired to the live theme.** The flag ships OFF and the resolver is
inert while off, so this changes nothing at runtime. Its purpose is to inform the Phase 45 decision
brief.

## What shipped

- **`src/branding/brand-config.js`**
  - `WHITE_LABEL_ENABLED = false` — master flag; the spike is inert until a decision green-lights
    it.
  - `BRANDS` — the real `gold-ticker-live` brand (palette mirrored from `tokens.css`) plus two
    clearly labelled **demo** skins (`demo-silver-souk`, `demo-bourse-dor`) that only exist to show
    re-skinnability. Each brand is presentation-only: `name`, bilingual `tagline`, `logoGlyph`, and
    a six-token colour set.
  - `resolveBrandKey(key)` — while the flag is off, **always** returns the default brand (fail-safe,
    same shape as the locale resolver). `getBrand(key)` falls back to default for unknown keys.
  - `brandToCssVars(brand)` — maps a brand to a `--brand-*` CSS custom-property set. Deliberately a
    **separate namespace** from the live `--color-*` tokens, so a future opt-in skin could apply it
    without touching the shipped theme.

## What this spike is NOT (scope guard)

It is **not** productised multi-tenancy. There is no tenant identity, no per-tenant config store, no
billing/plan/pricing, no auth boundary. A test asserts no brand descriptor carries any
`tenant|billing|plan|price|subscription|stripe|invoice|seat` field — so the spike cannot quietly
grow into the productised work this phase explicitly defers.

## Tests — `tests/brand-config.test.js` (6)

Flag ships OFF and the resolver is inert (every key → default) while off; the default brand carries
the real palette (`#b07d1f` / `#fdfbf5`); demo brands exist and are flagged `demo`; every brand has
an identical, complete, valid-hex token set with a bilingual tagline; `brandToCssVars` emits only
`--brand-*` (never `--color-*`); and no brand carries tenant/billing scope.

## Feeds into Phase 45

The decision brief weighs whether white-label is worth productising. This spike gives it a concrete,
tested reference for the _design_ cost (a token set per brand + a skin layer) while making clear the
_productisation_ cost (tenancy, billing, support) is entirely separate and out of scope here.

## Constraints honoured

$0 / no dependency; demo only — no tenants, no billing; flag OFF and inert; `--brand-*` namespace
does not touch the live theme; additive module; no other phase's files touched.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1292 pass, +6**) + `npm run lint` — all green.
