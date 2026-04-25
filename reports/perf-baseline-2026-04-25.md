# Performance baseline — 2026-04-25

**Status:** Partial baseline. Source-tree inventory captured here; full Lighthouse / `vite build`
chunk analysis must be re-run on the developer host (sandbox runs Node 20 but `vite.config.js`
requires Node ≥ 22 for `node:fs`'s `globSync` — see `.nvmrc` = 24).

**Why a baseline:** plan §B.0 requires this report before any further Track B perf work, so
before/after deltas have a reference. No code changes ship in this PR.

## 1. Repository surface inventory (no build required)

### 1.1 HTML entry points

| Bucket                                                                      | Count |
| --------------------------------------------------------------------------- | ----- |
| Top-level `*.html`                                                          | 13    |
| Total HTML files (pre-built leaf pages + entries; excluding `node_modules`) | 689   |

689 pre-built HTML files matches the canonical-origin guard in `tests/seo-sitewide.test.js`. Static
multi-page architecture is intact (no SPA migration drift).

### 1.2 `src/` JavaScript by directory

```
256K  src/pages/
148K  src/components/
128K  src/lib/
104K  src/tracker/
 68K  src/config/
 32K  src/seo/
 28K  src/utils/
 28K  src/social/
 16K  src/search/
 12K  src/routes/
  8K  src/data/
```

### 1.3 Top JS files in `src/` (un-minified, pre-bundle)

| Bytes  | File                          |
| ------ | ----------------------------- |
| 62 546 | `src/pages/shops.js`          |
| 43 339 | `src/components/nav.js`       |
| 39 508 | `src/tracker/render.js`       |
| 29 583 | `src/pages/calculator.js`     |
| 26 462 | `src/pages/tracker-pro.js`    |
| 26 202 | `src/config/translations.js`  |
| 25 621 | `src/pages/home.js`           |
| 22 869 | `src/components/nav-data.js`  |
| 19 937 | `src/social/postTemplates.js` |
| 16 840 | `src/lib/export.js`           |

**Implications for Track B PRs:**

- `translations.js` is **26 KB**, well under the 40 KB threshold the plan sets for the per-locale
  split. The split is **not currently justified**; revisit only if it crosses 40 KB or if LCP on the
  homepage measurably regresses.
- `src/pages/shops.js` (62 KB) is the single largest entry-point payload and the natural first
  target if "reduce bundle size" needs evidence-based picks. It's only loaded on `shops.html`, not
  the homepage, so the homepage LCP impact is zero.
- `src/tracker/render.js` (39 KB) + `src/pages/tracker-pro.js` (26 KB) ≈ 65 KB tracker-only code.
  Plan item B #9 ("route-split tracker bundle out of homepage") is consistent with this; verify the
  homepage bundle does not pull tracker code.

### 1.4 CSS by file

```
252K  styles/pages/    (per-page CSS split)
152K  styles/global.css
 48K  styles/admin.css
 16K  styles/country-page.css
 12K  styles/order.css
 12K  styles/guide-page.css
  8K  styles/market-page.css
  8K  styles/city-page.css
  4K  styles/critical.css
```

`critical.css` exists at 4 KB — verify it is inlined in `<head>` for above-the-fold paint on the key
pages (LCP relevant).

### 1.5 Image inventory (production assets only)

| Bytes     | File                                  |
| --------- | ------------------------------------- |
| 1 491 919 | `assets/screenshots/home.png`         |
| 1 077 139 | `assets/screenshots/methodology.png`  |
| 950 648   | `assets/screenshots/gold-guide.png`   |
| 886 472   | `assets/screenshots/calculator.png`   |
| 26 416    | `assets/og-image.png`                 |
| 17 652    | `assets/favicon-512x512.png`          |
| 6 014     | `assets/favicon-192x192.png`          |
| 5 744     | `assets/apple-touch-icon.png`         |
| 2 212     | `assets/og-image.svg`                 |
| 912       | `assets/favicon-32x32.png`            |
| 258       | `favicon.svg`                         |
| 1         | `assets/screenshots/image.png` (stub) |

**Total image weight in `assets/`:** ≈ 4.46 MB, of which **~4.41 MB is the four screenshots**.

> **Important finding:** the four large screenshots are referenced **only from `README.md`**, not
> from any production HTML or JS. They do not affect page-load performance. They do bloat the
> `git clone` and the deployed static tree, however. Two reasonable follow-ups:
>
> 1. Convert to WebP (~70–80 % size reduction expected) — README still renders. Low effort.
> 2. Add `assets/screenshots/` to a deploy `.assetignore` / Netlify `_redirects` so they aren't
>    published to the CDN. Out of scope here.

`assets/og-image.png` (26 KB) is the only image that actually ships on every page (Open Graph meta).
It is already small; AVIF/WebP for OG images is platform-dependent and may regress on older crawlers
— leave alone.

`scripts/node/image-audit.js` requires `data/asset-report.json` (not present in repo); produced
during a separate ETL step. The build host should generate it if image audit is wanted in CI.

## 2. What requires a real build (run locally on Node 24)

The sandbox cannot complete `vite build` (Node 20 vs. required Node 24). Run these on the developer
host and append outputs to this file in a follow-up PR:

```bash
nvm use 24
npm ci
npm run build
du -ah dist/ | sort -rh | head -50          # dist byte inventory
du -sh dist/                                  # total transferred weight
ls -la dist/assets/ | sort -k5 -rn | head -30 # bundled JS/CSS chunks (fingerprinted)
```

Optional, requires installing `rollup-plugin-visualizer`:

```bash
npm install --save-dev rollup-plugin-visualizer
# then add visualizer() to vite.config.js plugins[] and re-run build
```

## 3. Lighthouse / Core Web Vitals — manual capture

Run on the developer host with Chrome installed:

```bash
npm run preview &                                     # localhost:4173
npx lighthouse http://localhost:4173/                  --preset=desktop --output=json --output-path=reports/lh-home-desktop.json
npx lighthouse http://localhost:4173/tracker.html      --preset=desktop --output=json --output-path=reports/lh-tracker-desktop.json
npx lighthouse http://localhost:4173/shops.html        --preset=desktop --output=json --output-path=reports/lh-shops-desktop.json
npx lighthouse http://localhost:4173/calculator.html   --preset=desktop --output=json --output-path=reports/lh-calculator-desktop.json
npx lighthouse http://localhost:4173/countries/uae/    --preset=desktop --output=json --output-path=reports/lh-uae-desktop.json
# repeat without --preset=desktop for the default mobile (Moto-G4-throttled) profile
```

Capture and pin to this file: **LCP, CLS, INP, TBT, total transferred bytes** for each page. Those
five numbers per page are the before-snapshot every Track B PR should diff against.

## 4. Caching layer state (current)

Documented for completeness — already verified as part of plan §B.

| Layer          | State                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_headers`     | `/assets/*`, `/styles/*`, `/src/*` → `max-age=31536000, immutable`. HTML → 5 min, must-revalidate. `sw.js` → `max-age=0`. `manifest.json` → 1 h.                          |
| `.htaccess`    | `*.v[0-9]*.{js,css}` → `max-age=31536000, immutable`. `sw.js` → `max-age=0`. `*.html` → `max-age=86400`.                                                                  |
| Service worker | `goldprices-v14`. Network-first for navigations (HTML), cache-first for same-origin static destinations (`style/script/image/font/manifest`). Bypasses `open.er-api.com`. |
| Admin host     | `Cache-Control: private, no-store` for `/admin/*` (set in `_headers`) + Helmet defaults.                                                                                  |

**Open caching follow-up (plan B #8):** verify `sw.js` does not cache `/api/*` or `/admin/*`.
Inspection of `sw.js`:

- `shouldCacheRequest()` only caches `request.destination ∈ {style, script, image, font, manifest}`
  with no query string. `/api/*` JSON responses have `destination: ''` so they are never cached by
  `cacheFirstWithUpdate`.
- `networkFirstWithFallback()` (used for `request.mode === 'navigate'`) **does** call
  `cache.put(request, response.clone())` for every `response.ok` HTML navigation, including
  `/admin/` if the user visits it. This is the gap. Suggested fix: short-circuit at the top of
  `fetch` listener:
  `if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return;`. Captured for
  a follow-up PR (small, testable).

## 5. Suggested next Track B PRs (ranked by ROI, evidence-driven)

1. **Convert `assets/screenshots/*.png` → WebP** (-3 MB). README continues to render. Trivial, no
   page-load impact but reduces clone weight. _Risk: none._
2. **`sw.js` exclusion of `/api/` and `/admin/`** + a node:test that constructs a fake fetch event
   and asserts no `cache.put`. _Risk: low._
3. **Route-split `src/tracker/*` out of homepage bundle.** Verify with `npx vite build` post-fix
   that the homepage entry's chunk graph no longer pulls `tracker/render.js`. _Risk: low._
4. **`shops.js` audit** (62 KB). Look for dead imports / heavy formatters that could be lazy-loaded
   behind the search input. _Risk: medium — this is the largest leaf-page entry._
5. **Lighthouse capture** (this is "before"; everything above is "after"). _Risk: none — read-only._

## 6. What this baseline deliberately does not do

- No `vite build --report` chunk numbers (Node version mismatch).
- No real Lighthouse runs (no Chrome in sandbox).
- No code changes. Track B work lands in subsequent focused PRs that diff against this file.
