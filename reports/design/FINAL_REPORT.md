# Dual-Theme Premium Gold System + P0 Fixes — Final Report (feat/ui-overhaul)

```yaml
date: 2026-07-06
brief: owner v3 "Feature Completion + Premium Gold Revamp" (supersedes the v1 dark-default brief)
spec: reports/design/DESIGN_SPEC.md (v3 revision)
evidence: reports/design/shots/ (before-* vs after-*)
```

## What shipped (one commit per concern)

1. **`theme(v3)` — dual theme, light default.** Light (warm parchment) is the default; first visit
   honors the OS preference (`auto`); the premium layered near-black/gold identity is the dark
   OPTION behind the toggle and persists. All three deciders agree on the `auto` fallback (pre-paint
   snippet via `inject-theme-preinit.js`, the internal-stub generator, and the `nav.js` runtime
   controller that had been silently clobbering the other two). `critical.css` paints light-first
   with `[data-theme='dark']` + OS-dark `:root:not([data-theme])` blocks; `manifest.json` background
   `#fdfbf5`. The premium dark palette itself is unchanged: layered near-blacks
   `#0b0b0d/#141418/#1c1c22/#26262c`, warm hairlines, 3-tier disciplined gold (metallic `#ddb040`,
   antique `#b5945c` for large serif headings, bright `#fad97a` sparing), self-hosted Playfair
   Display (latin subset, OFL, swap) through `--font-display` with the existing `[dir='rtl']` Cairo
   swap.

2. **`fix(p0-1)` — returning-visitor crash on compare / heatmap / portfolio.** `cache.js#loadState`
   wrote `STATE.status.*` / `STATE.fxMeta.*` / `STATE.freshness.*` unguarded; those three pages
   define STATE without the containers. Fresh profiles booted fine — with cached `localStorage` the
   pages threw a TypeError before nav/widgets rendered (why clean headless audits kept missing it).
   Fixed with defensive container init in `loadState` plus the missing containers on all three
   pages.

3. **`fix(shops)` — default tab rendered 0 of 27 listings.** The default "Verified Shops" tab
   filtered on `listing_type === 'verified_shop'`, but the curated dataset carries no
   verified/sponsored/listing_type fields: 27 entries derive to 14 `market_cluster` + 13
   `pending_unverified`, so the landing tab showed 0 while facets said 27 and the 13 direct shops
   were unreachable from every tab. First tab is now the honest combined **"Shops"** directory
   (verified + pending; per-card chips keep the truthful "Verified details" / "Unverified listing"
   split; Verified badge only for true `verified_shop`). Legacy `?listing=verified_shop` deep links
   map over; the Supabase upgrade path can never land on a dead tab; `mapRow` normalizes
   `listing_type` variants and legacy boolean columns.

4. **`fix(footer)` — P0-4 light-theme footer contrast.** The premium sitewide layer re-skins the
   footer with light-resolving surface tokens, but the ink rules still carried dark-era hardcoded
   values (40–58% white links/copy, `--text-on-dark` brand, opacity-dimmed disclaimer) —
   near-invisible on parchment. Every footer ink is now a theme-paired token; opacity dims removed
   from trust copy.

## VERIFIED (ran here, evidence in repo)

- **Contrast (computed, not guessed):**
  - Dark palette table in DESIGN_SPEC.md — all AA (worst 4.68:1 vs 4.5; antique headings 6.4–6.9:1
    vs 3.0 large-text).
  - Footer, on the actual color-mix backgrounds (`#fffefe` light / `#151519` dark): light —
    links/sources muted `#6a5c48` 6.44:1, tagline/disclaimer/copy faint `#6f6350` 5.83:1, brand
    18.7:1, accent links `#7e5912` 6.27:1, error `#b81428` 6.58:1, success `#137a36` 5.40:1; dark —
    muted 6.41:1, faint 5.66:1, brand 15.7:1, accent `#f0ca5c` 11.5:1, error 6.58:1, success 10.5:1.
    `scripts/node/check-basic-a11y.js` CI gate green.
- **Theme round-trip (Chromium, Vite):** unset pref boots light under OS-light and near-black under
  OS-dark; toggle to dark repaints body to `rgb(11,11,13)` and persists across reload; computed
  footer colors match the token values in both themes.
- **Shops tabs (Chromium):** Shops 13 / Markets 14 / Sponsored 0 with honest empty state (13+14=27,
  every listing reachable); legacy deep link lands on Shops(13); RTL label `المحلات`; zero console
  errors. Screenshots `after-shops-default-tab-{fixed,ar}.png`.
- **Crash repro (Chromium):** seeded `gold_price_cache`/`fx_rates_cache` localStorage reproduced the
  exact TypeError on all three pages pre-fix; post-fix all three boot clean with nav and widgets.
- **Suites/gates ran:** shops-related unit suites 67/67 (`node --test`); eslint + stylelint clean on
  touched files; basic-a11y gate green. Footer screenshots `after-footer-{light,dark}.png`.
- **RTL:** verified on tracker/shops shots and the shops tab checks above; Learn page untouched
  (owner CONFIRMED-GOOD surfaces preserved).

## ASSUMED / NOT RUN (environment limits)

- **Lighthouse** — no binary in sandbox; the repo's lighthouse CI job covers the deploy preview.
  Font cost is +46 KB swap-loaded woff2; LCP risk low but unmeasured here.
- **Full `npm test` freshness caveat** — ~12 spotBar/ticker tests are market-hours dependent and
  fail on clean main at certain hours; treat those as pre-existing (reproduced on untouched main).
- **Playwright spec suite** — ad-hoc Chromium scripts (same engine) used for the verifications
  above; the two e2e specs referencing the old tab selector were updated.
- **Live-data render paths** — external feeds blocked in sandbox; honest loading/unavailable states
  are what the screenshots show.

## Rollback

Single branch `feat/ui-overhaul`; each concern is its own commit and reverts independently. The
light theme is the untouched parchment system, so reverting the theme commit only changes the
default/toggle mechanics, not light-mode rendering.

## Notes

- `docs/design-language.md` should gain a short dual-theme section (light default, premium dark
  option) in a follow-up.
- Remaining v3 lanes tracked outside this report: account save (Supabase auth + RLS report), nav
  search wiring, portfolio/heatmap verification rounds, P1 polish list.
