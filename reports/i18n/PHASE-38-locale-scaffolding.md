# Phase 38 — N-locale i18n scaffolding (Yellow · EN/AR unchanged)

A de-risked foundation for adding locales beyond EN/AR. It introduces a **locale registry** (source
of truth) and the **canonical translate helper** that 30+ call sites already hand-write inline — as
purely additive modules. No existing consumer is touched, and EN/AR output is **provably identical**
to today. The French (39) and Urdu (40) pilots build on this.

## The problem it de-risks

Two patterns are copy-pasted across the codebase:

- **Locale resolution** — `const lang = urlLang === 'ar' ? 'ar' : 'en'` in ~15 page entry points.
- **Translation lookup** — `TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en?.[key] ?? key` in 30+.

Adding a third or fourth language by editing every one of those sites is exactly the kind of wide,
error-prone change this phase removes. Instead there is now one resolver and one lookup to adopt.

## Shipped (additive — no consumers changed this phase)

- **`src/config/locales.js`** — the registry:
  - `LOCALES` — `en`/`ar` **enabled**; `fr`/`ur` **declared but disabled** (each with `endonym`,
    `englishName`, `dir`), so switcher/direction/hreflang scaffolding is ready before the pilot
    ships.
  - `DEFAULT_LOCALE`, `SUPPORTED_LOCALE_CODES`, `ACTIVE_LOCALE_CODES` (`['en','ar']` today).
  - `resolveLocale(requested)` — maps a raw `?lang=` value to a live locale, defaulting to `en`.
  - `getLocaleMeta` / `getLocaleDir` / `isRtlLocale` / `isActiveLocale`.
- **`src/lib/i18n.js`** — `translate(translations, locale, key, { fallback, vars })` implementing
  the exact `locale → default → fallback → key` chain, plus `interpolate()` (`{token}` /
  `{{token}}`) and `createTranslator(dict, locale)` returning the `t(key, vars)` shape pages already
  use locally.

## The EN/AR-unchanged invariant (guarded by tests)

- `resolveLocale(x)` is asserted **byte-for-byte identical** to the legacy
  `x === 'ar' ? 'ar' : 'en'` across a battery of inputs (`ar`, `en`, `''`, `AR`, `fr`, `ur`, `xx`,
  `null`, `undefined`, …). It is exact-match only, so while `en`/`ar` are the active set the output
  cannot differ. When Phase 39/40 flips `fr`/`ur` to `enabled: true`, `resolveLocale('fr')` starts
  returning `'fr'` automatically — no other change needed.
- `translate(TRANSLATIONS, locale, key)` is asserted equal to the inline
  `TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en?.[key] ?? key` for **every** EN key across `en`,
  `ar`, and an unknown locale — proving zero divergence from current behaviour.

## How the pilots (39/40) adopt this

1. Flip `LOCALES.fr.enabled` (or `ur`) to `true`.
2. Add a `TRANSLATIONS.fr` block.
3. Swap the inline `=== 'ar'` resolution for `resolveLocale(...)` and inline lookups for
   `translate(...)` at the surfaces in scope. Direction/RTL comes from `isRtlLocale` (Urdu reuses
   the AR RTL infra).

## Constraints honoured

EN/AR behaviour unchanged (proven, not asserted); $0 / no dependency; additive only — no other
phase's files touched; parked locales ship disabled so nothing renders until its pilot.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1297 pass, +11**) + `npm run lint` — all green.
