# Phase 40 — Urdu pilot UI translation (Green · RTL, reuses AR infra)

Activates Urdu as a live locale and ships the **same curated core-pages surface** as the French
pilot, translated into Urdu. Urdu is right-to-left and **reuses the exact RTL infrastructure Arabic
already uses** — no new direction/layout plumbing. Uncovered strings fall back to English. EN/AR
behaviour is unchanged.

> **Stacks on [#576](https://github.com/vctb12/GoldTickerLive/pull/576) (Phase 39) → #575 (Phase
> 38).** Cut from the Phase-39 branch so the locale registry stays consistent (en→ar→fr→ur
> progressively enabled). Merge order: #575 → #576 → this.

## What shipped

- **`src/config/locales.js`** — flip `ur.enabled` to `true`. Urdu now resolves:
  `resolveLocale('ur') === 'ur'`, `isRtlLocale('ur') === true`,
  `getLocaleDir('ur') === getLocaleDir('ar')`, `ACTIVE_LOCALE_CODES === ['en','ar','fr','ur']`.
- **`src/i18n/ur-pilot.js`** — the Urdu pilot dictionary: the identical ~60-key core surface as the
  French pilot (shared shell + homepage price surface), in Urdu. Plus `UR_PILOT_KEYS` and
  `withUrduPilot(translations)`, which grafts it on as the `ur` locale without mutating the input.
- Updated the shared locale tests for Urdu going live (EN/AR resolution still proven unchanged).

## RTL: reusing Arabic's infrastructure

Urdu shares Arabic's script direction. Because the registry marks `ur` as `dir: 'rtl'`, everything
that already keys off direction — `document.dir`, the mirrored nav/layout, the RTL CSS shipped in
the bilingual work — applies to Urdu with **zero new code**. A test asserts
`getLocaleDir('ur') === getLocaleDir('ar')` to lock that equivalence in.

## Guarantees (guarded by tests — `tests/ur-pilot.test.js`, 6)

- Urdu is an **active, RTL** locale, with direction identical to Arabic.
- **No orphan strings**: every pilot key exists in `TRANSLATIONS.en`.
- **Key-set parity with the French pilot** — the two pilots cover exactly the same surface, so the
  locales stay in lockstep as the core grows.
- Every Urdu value is a **non-empty** string; all but the legitimately-identical few (e.g. `USD`)
  differ from English.
- `withUrduPilot(TRANSLATIONS)` renders **Urdu for covered keys** (`nav.home → ہوم`,
  `card.copy → کاپی`) and **English for the rest** — never a raw key — without mutating the input.
- **Reference-estimate framing preserved**: both disclaimers carry "مالی مشورہ نہیں" (not financial
  advice); `spotlight.note` keeps the bullion-equivalent wording.

## Constraints honoured

EN/AR unchanged (proven); $0 / no dependency; no other phase's page files touched; Urdu limited to a
hand-checked core subset with English fallback; RTL via the existing Arabic infra;
reference-estimate framing intact in Urdu.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1308 pass, +6**, i18n parity guards green) +
`npm run lint` — all green.
