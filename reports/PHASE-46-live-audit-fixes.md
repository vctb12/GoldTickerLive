# Phase 46 — Live-site audit fixes (footer, favicon, history backfill)

Fixes three of the four defects from the owner's live-site audit. The fourth — price-freshness
flapping — is a fetch/fallback investigation and is taken up as its own focused **Phase 47**.

## 1. Footer column headings invisible ✅ fixed

**Cause.** The footer was re-skinned to a **light** surface (`.site-footer-global` background =
`color-mix(--surface-primary 92%, --surface-secondary)` ≈ near-white), but two footer elements still
hardcoded **dark-era white ink**, so they went invisible on the light background — exactly what the
in-file comment warned about ("any dark-era hardcoded white ink here goes near-invisible in light
mode"). The reported headings "Price tools" / "Markets" / "Learn & trust" are section labels
rendered as `.footer-section-heading { color: rgb(255 255 255 / 72%) }`.

**Fix.** `styles/partials/utilities.css` — `.footer-section-heading` and `.footer-col-note` now use
the theme-aware `var(--color-text-muted)` (dark ink on light, light ink on dark), so they're
readable in **both** themes. No new token was invented (avoided the mismatched-`var()`-fallback
anti-pattern).

## 2. `/assets/favicon.svg` 404 ✅ fixed

**Cause.** The web manifest is built to `/assets/manifest-*.json`, and its icon `src` strings were
**relative** (`"favicon.svg"`, `"assets/favicon-192x192.png"`). The browser resolves those against
the manifest URL → `/assets/favicon.svg` (404) and `/assets/assets/favicon-192x192.png` (404).
Worse, the 192/512/maskable PNGs were **not emitted to the build at all** — nothing in the HTML
references them and Vite doesn't parse manifest JSON for assets.

**Fix.** The PWA icons are now served from `public/` (copied verbatim to the site root at stable
paths) and `manifest.json` references them with **absolute** paths (`/favicon.svg`,
`/favicon-192x192.png`, `/favicon-512x512.png`, `/favicon-512-maskable.png`, and the two shortcut
icons). Verified after `npm run build`: all four icons resolve from dist root and the built manifest
points at them. A test (`tests/pwa-manifest-audit.test.js`, extended) asserts every manifest icon
`src` is absolute so this can't regress.

## 3. Homepage / tracker history stops at 2025-08 ⚠️ mechanism shipped — needs owner data

**Cause.** The long-range history reads `src/data/historical-baseline.json` (monthly average
XAU/USD). It ends at **2025-08 ($3465)**; the 11 months **2025-09 → 2026-07** are missing.

**Why the values aren't in this PR.** This is a gold-price reference site — inventing 11 monthly
averages would be a trust defect, so I did **not** fabricate them. The real recorded series lives in
the owner-gated Supabase `price_history` table (I must not touch it), and no verifiable public
dataset is available in this environment. Per the ground rules, the data is an **owner action**.

**What shipped (so the owner can land it in one command):**

- `src/lib/monthly-baseline-merge.js` — tested, deterministic merge: validates rows, **appends only
  new months (never overwrites committed data)**, sorts, and `findMonthlyGaps()` reports the gap.
- `scripts/node/backfill-monthly-baseline.mjs` — CLI wrapper: reads real `{date, price}` rows and
  writes the extended baseline. Ignores null-priced rows (so the template can be filled
  incrementally).
- `reports/data/PHASE-46-monthly-baseline-backfill.template.json` — the 11 missing months with
  `price: null` for the owner to fill from their `price_history` export (or a verified LBMA/public
  monthly average), then run the script.
- `tests/monthly-baseline-merge.test.js` (5) — validation, append-only/no-overwrite, idempotency,
  gap detection, and a guard documenting the current 2025-08 endpoint.

**Owner action:** paste the 11 real monthly averages into the template (or point the script at a
`price_history` export) and run `node scripts/node/backfill-monthly-baseline.mjs`. The
homepage/tracker history then extends to the current month with zero further code change.

## 4. Freshness flaps between Live/Cached/Fallback/SecondaryProvider → **Phase 47**

Initial read: the client freshness policy (`src/lib/freshness-policy.js`) allows `live` only within
a **5-second** age budget, so any small fetch delay flips `live → cached`, and provider timeouts
flip to `fallback`. Tightening the client fetch/fallback orchestration and logging is a focused
change with its own tests — handled next as Phase 47 (no change to the owner-gated
`gold-price-fetch.yml`).

## Constraints honoured

No owner-gated files touched (`gold-price-fetch.yml`, `post_gold.yml`, `sw.js`, Supabase/billing);
AED peg (3.6725), troy-oz (31.1035), and reference-estimate framing untouched; **no fabricated
prices**; theme-aware CSS only; PWA icons additive.

## Gate

`npm run build` + `npm run validate` + `npm test` + `npm run lint` — all green.
