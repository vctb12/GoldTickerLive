# Phase 20 — RTL & bilingual polish (Track E · Green)

Audited the Arabic (`?lang=ar`, `dir="rtl"`) rendering path across the translation dictionary, the
CSS direction handling, and the directional-glyph/icon plumbing. The RTL implementation is already
**mature** — 299 logical-property uses vs ~50 physical, 243 `[dir='rtl']` override blocks, every CSS
pseudo-element arrow already dir-guarded, and complete EN↔AR arrow-twin coverage in the dictionary.
This phase fixes the one genuine directional **bug** plus a small number of clear physical-property
gaps, and records the verification of everything that was already correct.

## Fixes shipped

1. **Inverted Arabic pagination arrows (real bug)** — `src/config/translations.js`
   (`tracker.pagination.prev` / `.next`). The author had mirrored the arrow's _position_ from
   English but kept the English _glyph direction_, so both arrows pointed backwards for an RTL
   reader. In RTL, "previous/back" must point **→** and "next/forward" must point **←** (readers
   advance leftward).
   - `prev`: `'السابق ←'` → `'السابق →'`
   - `next`: `'→ التالي'` → `'← التالي'`
   - Rendered live on the tracker archive pager (`src/tracker/archive.js:138,159`). Single-glyph
     edits inside existing values — no key added/removed, so the EN/AR parity guard
     (`tests/i18n-sitewide-guard.test.js`) stays green.

2. **`text-align: left` → `text-align: start`** — `styles/pages/shops.css`, `.shops-nearme-status`
   and `.shops-nearme-results` (the "near me" geolocation status/results copy). These were pinned to
   the physical left edge, so Arabic text mis-aligned; `start` follows the writing direction.

3. **Shops modal close button → logical inset** — `styles/pages/shops.css`, `.shops-modal-close`.
   Converted `right: 1.2rem` → `inset-inline-end: 1.2rem` and the small-viewport `@media` variant
   `right: 0.8rem` → `inset-inline-end: 0.8rem`, then **removed** the now-redundant
   `[dir='rtl'] .shops-modal-close { right: auto; left: 1.2rem }` override. This also fixes a latent
   bug: the small-viewport variant had no RTL override, so on narrow screens the close button kept a
   1.2rem (not 0.8rem) inset in Arabic. One self-contained component, converted in isolation.

## Verified correct — no change needed

- **Directional icons.** Only two direction-bearing sprite symbols exist (`i-exchange`,
  `i-external`). `i-exchange` is already registered in the RTL-mirror set
  (`src/components/icon-sprite.js:378`, `DIRECTIONAL`), and external-link icons are conventionally
  left un-mirrored. No back/next/chevron sprite id is rendered un-mirrored. No gap.
- **Swipe scroll-hints.** Both the karat strip (`home.karatStripScrollHint`) and the compare table
  (`compare.js swipeHint`) are i18n-managed and ship correctly-flipped Arabic arrows (`… ←` /
  `← … →`). No gap.
- **Arrow-bearing CTAs.** The site's convention is EN strings embed `→` and the AR dictionary ships
  hand-flipped `←` twins (65× `→` / 61× `←` in `translations.js`). Bound CTAs (`data-i18n` / id →
  `page-hydrator` / page module) therefore resolve to the flipped Arabic glyph at runtime.
- **CSS pseudo-element arrows & breadcrumb chevrons** are all `[dir='rtl']`-guarded already
  (learn/home/market/dubai page CSS, `components.css` breadcrumb `›`→`‹`).

## Registered follow-ups (out of scope for this polish phase)

- **Untranslated static first-paint copy** — a few tracker body links (e.g. the data-trust banner's
  `<a href="methodology.html">Methodology →</a>`, `tracker.html:174`) are static English in the
  markup. They are the JS-hydrated first-paint fallback (the tracker shell re-renders translated
  copy via `src/pages/tracker-pro.js`), so this is a **content-translation** concern (Phase 41
  territory), not an RTL directional bug. Left as-is.
- **`styles/admin.css`** carries the most physical-direction properties (32) but the admin surface
  is English-only / non-bilingual — deliberately skipped.
- **Eastern-Arabic numerals + `tabular-nums`.** Eastern-Arabic glyphs aren't guaranteed equal-width,
  so tabular alignment can be marginally imperfect in AR. Cosmetic, not directional. Noted only.

## Gate

`npm run build` (translations + CSS touched) + `npm run validate` + `npm test` (incl. the i18n
parity/coverage suite) + `npm run lint` — all green. `scripts/qa/parity-diff-scan.mjs` confirms the
edited AR values remain distinct from their EN counterparts (no accidental identical-string
regression).
