# Phase 39 — French pilot UI translation (Green · LTR, core pages)

Activates French as a live locale and ships a hand-checked **core-pages** translation set, built on
the Phase 38 scaffold. French is LTR; every uncovered string falls back to English through the
shared `translate()` helper, so nothing renders as a raw key. EN/AR behaviour is unchanged.

> **Stacks on [#575](https://github.com/vctb12/GoldTickerLive/pull/575) (Phase 38).** Cut from the
> Phase-38 branch because `locales.js` / `i18n.js` aren't on `main` yet; based on the Phase-38
> branch so the diff is just Phase 39's activation + dictionary. Merge #575 first.

## What shipped

- **`src/config/locales.js`** — flip `fr.enabled` to `true`. French now resolves:
  `resolveLocale('fr') === 'fr'`, `isRtlLocale('fr') === false`,
  `ACTIVE_LOCALE_CODES === ['en','ar','fr']`.
- **`src/i18n/fr-pilot.js`** — the pilot dictionary: ~60 hand-written French strings for the shared
  shell (nav, footer, header, breadcrumbs) and the homepage price surface (spotlight, karat table,
  change, units, cards, freshness/status). Plus `FR_PILOT_KEYS` and `withFrenchPilot(translations)`,
  which grafts the pilot on as the `fr` locale without mutating the input.
- Updated the Phase-38 locale tests to reflect French going live, **keeping the EN/AR-unchanged
  assertion intact** (EN/AR/unknown still resolve exactly as the legacy binary; only `fr` is new).

## Why the pilot dictionary is kept separate from `translations.js`

`src/config/translations.js` is held to **exact EN/AR key parity** by
`tests/i18n-sitewide-guard.test.js` — no string may ship in one language only. French is a _pilot_
with deliberate partial coverage, so putting a partial `fr` block there would either fight that
guard or force 1200+ premature translations. Keeping it in `src/i18n/fr-pilot.js` lets French cover
the core surface now, fall back to English elsewhere, and grow under Phase 41's content-translation
policy — without weakening the EN/AR parity guarantee.

## Guarantees (guarded by tests — `tests/fr-pilot.test.js`, 5)

- French is an **active, LTR** locale (`isActiveLocale`, `isRtlLocale`, `resolveLocale`).
- **No orphan strings**: every pilot key exists in `TRANSLATIONS.en` — this is a translation of an
  existing surface, never a new string.
- Every French value is a **non-empty** string, and all but the legitimately-identical few (e.g.
  `USD`) actually differ from English.
- `withFrenchPilot(TRANSLATIONS)` renders **French for covered keys** (`nav.home → Accueil`,
  `card.copied → Copié !`) and **English for the rest** (e.g. any `tracker.*` key) — never a raw
  key, never Arabic — and does not mutate the input map.
- **Reference-estimate framing preserved**: both disclaimers carry "conseil financier" (not
  financial advice); `spotlight.note` keeps the estimated-bullion-equivalent wording, not retail.

## How a page serves French (adoption, not done here)

A core page adopts French by resolving its locale with `resolveLocale(urlLang)` and looking copy up
via `translate(withFrenchPilot(TRANSLATIONS), locale, key)`. This phase does not rewrite existing
page files (they belong to earlier phases); it delivers the activation + dictionary + proven render
path.

## Constraints honoured

EN/AR unchanged (proven); $0 / no dependency; no other phase's page files touched; French limited to
a hand-checked core subset with English fallback; reference-estimate framing intact in French.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1302 pass, +5**, i18n parity guards green) +
`npm run lint` — all green.
