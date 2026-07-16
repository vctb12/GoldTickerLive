# Operation Midas — Architecture Map (Phase 2, 2026-07-16)

Synthesized from a 4-lane read-only SCOUT fan-out (frontend / price engine / backend+Supabase /
build+CI). Every claim cites a path. Raw scout returns preserved in the session workflow journal.

---

## Lane A — Frontend

**Shape.** 16 hand-maintained root HTML documents (+ `offline.html`, no JS entry), each a full
standalone page with its own head/meta block and one page-specific ES-module entry under
`src/pages/` — there is no `src/main.js`. Shared chrome (nav, footer, ticker, spot bar) is injected
at **runtime** by `mountSharedShell()` (`src/components/site-shell.js:65`), not by templates. The
only build-time HTML injection is `scripts/node/inject-theme-preinit.js` (identical inline theme
pre-init stamped into every head, marker `gtl-theme-preinit`).

**Entry points.** `index.html` → `src/pages/home.js` (only page with `data-i18n` attributes at
scale); `tracker.html` → `src/pages/tracker-pro.js` (1,930 lines, orchestrates `src/tracker/`);
`calculator.html` → `src/pages/calculator.js`; compare/heatmap/portfolio/market/shops each have
their own `src/pages/*.js`; `learn.html` loads **two** modules (`learn.js` + `invest.js`);
`404.html` uses an absolute `/src/...` path unlike the `./src/...` used elsewhere.

**i18n.** Client-side only. EN/AR strings in `src/config/translations.js` (~2,950 lines) plus **11
per-page local `const T = {}` dicts** (guarded by `tests/i18n-local-dict-parity.test.js`). Language
resolution per page: `/ar/` path prefix (never deployed — see AUDIT_LIVE) → `?lang=` param →
`localStorage user_prefs` → `en`. Each page independently sets `documentElement.lang/dir`, wires nav
toggle buttons via `shell.navCtrl.getLangToggleButtons()`, and re-renders itself.
`src/lib/i18n.js:39 translate()` is canonical scaffolding but most pages still hand-roll the chain.

**Service worker.** `sw.js` v20 (deny-listed file): precaches 8 core shells (hand-maintained list),
network-only for `/data/gold_price.json` + `/data/last_gold_price.json`, SWR for leaf HTML/images,
cache-first for hashed assets.

**Vite.** `vite.config.js` auto-discovers **every** `.html` in the repo as a rollup entry (excludes
`dist`, `node_modules`, `.git`, `countries`, `admin`, `embed`). A stray `.html` anywhere (even
`docs/`) breaks the build — observed first-hand in Phase 1.

## Lane B — Price engine & freshness

**Pipeline (write).** `gold-price-fetch.yml` (cron `:02` hourly, market-hours window Sun 21:00 → Fri
20:59 UTC) → `scripts/python/fetch_gold_price.py` → provider adapters in
`scripts/python/gold_providers/` (`gold_api_com` primary; twelvedata/fmp fallbacks) → normalize +
freshness (`is_fresh` vs `max_freshness_seconds` 900) → legacy wrapper adds `gold.*` +
`karats_aed_per_gram` → commit `data/gold_price.json` (reset-hard + 4-retry push). Stale results are
not committed unless `ALLOW_STALE_PRICE`.

**Client (read).** `src/lib/api.js fetchGold()` GETs `/data/gold_price.json?t=<now>` (8 s timeout, 2
retries) → localStorage `gold_price_fallback` on failure.
`src/lib/spot-resolver.js getCanonicalSpot()` is the single memoized derivation point (spot / TROY ×
purity × peg) for ~10 surfaces + nav pill. **But** home + tracker additionally run a realtime engine
whose PRIMARY provider is a **direct browser fetch of `api.gold-api.com/price/XAU`**
(`src/lib/quote-providers/gold-api-com-provider.js:4`, wired at `create-providers.js:37-44`, used at
`home.js:1716`, `tracker-pro.js:1438`), failing over to mintedmetal.com → committed JSON →
`last_gold_price.json`. This **contradicts `spot-resolver.js:6-12`'s documented invariant** ("No
surface performs its own live third-party fetch").

**Freshness: two engines that can disagree.**

- `src/lib/freshness-policy.js:3-7` — realtime path: live ≤5 s / cached ≤60 s / delayed ≤300 s.
- `src/lib/live-status.js:32-44` — hourly-JSON path: delayed >30 min / stale >75 min / FX stale
  > 26 h.
- `spot-resolver.classifyFreshness` (`spot-resolver.js:95-98`) compares the **frozen**
  `freshness_seconds` (stamped at pipeline write, e.g. 19 s) against `max_freshness_seconds` (900) —
  neither ages client-side, so the committed file classifies `state:'live'` forever. Consumers of
  that classification (e.g. `home.js:1634 goldIsFresh`) trust it. The realtime engine correctly
  recomputes `ageMs` from the timestamp (`realtime-pricing-engine.js:482-485`).

**FX.** Non-AED from open.er-api.com (daily), AED always peg. Single free-tier provider for ~40
currencies (`src/config/countries.js`); volatile currencies (EGP/LBP/TRY) get the official rate with
no street-rate honesty note; `src/lib/fx-integrity.js` sanitizer exists but its wiring needs
verification (Phase 8).

## Lane C — Backend / Supabase / data

**Three tiers.** (1) The Python Actions pipeline above — the only production writer. (2) An optional
Express app (`server.js` + `server/`) with helmet CSP, layered rate limits (300/min global, 120/min
`/api`), JWT+bcrypt admin auth, Stripe with env-only keys + raw-body webhook verification — **OFF in
production** (`constants.js:25 API_BACKEND_ENABLED:false`; site is static GH Pages). (3) Supabase
project `nebdpxjazlnsrfmlpgeq`: ~45 tables, all with RLS _enabled_ in `supabase/schema.sql` — **but
~30 "Admin" policies are `to authenticated using (true)`** (shops writes :54-67, `site_settings`
insert/update :424-434, orders CRUD incl. customer-PII jsonb :1207-1223, pricing_overrides
:1164-1180, lead/newsletter reads :1410-1477): **any signed-up user is effectively admin.**
Corrective migrations `002/003/004/005` exist but every one is header-marked "RED ZONE — STAGED, NOT
APPLIED". A second Supabase project (`lulqcytwhtjdsbzslpiw`, Prisma comparison) has RLS **disabled**
on all 5 public tables (documented in migration 004, also unapplied). `gold_prices` + `fetch_logs`
have RLS enabled with zero policies (deny-all; service-role only — a trap that already bit once, see
`constants.js:27-33`).

**Admin auth in production is client-side only** (`admin/supabase-config.js:14-17` admits the email
allow-list is a hint; the RLS predicate that should enforce it is `using (true)`).

## Lane D — Build / CI / deploy

**Build.** 8-step chain (`package.json:13`): stubs → extract-baseline → normalize-shops → learn
static fallback → theme preinit → schema inject → sitemap → `vite build`.

**CI. The merge gate is OFF.** `ci.yml` (validate → quality → tests → build → sitemap coverage →
blocking Playwright e2e) is **`disabled_manually` since 2026-04-24** (GitHub API workflow state;
last run #191, 2026-04-24, failure). `health_check.yml` and `spike_alert.yml` are also
`disabled_manually`. `agent-ci.yml` (2026-07-10, active) covers only `cowork/**|claude/**|agent/**`
branches with lint+test+build and states it does not replace ci.yml. **Nothing gates merges to main
today.** Additionally, ci.yml's e2e job would fail even if re-enabled: `ci.yml:159`
`cp -r countries dist/` references a tree deleted in the 2026-07-04 IA reset.

**Soft gates.** `lighthouserc.json` assertions all `warn`; `perf:ci` ends `|| true`; ci.yml's
`npm audit` and `check-links` are `|| true`.

**Deploy.** `deploy.yml` → GitHub Pages on every push to main + 30-min cron safety net (sized
against a "6-min fetch" schedule that no longer exists — comment at deploy.yml:37 is wrong, fetch is
hourly). It raw-copies `sw.js`, `src/`, `data/`, `styles/`, `admin/` into `dist/` next to the
fingerprinted bundle → **publishes internal state publicly** (`/data/last_tweet_state.json`,
`automation_runs.json`, `tweet_failures.json`) and creates bundled-vs-raw drift potential.
`_headers`/`_redirects` are **inert on GitHub Pages** (the files document this themselves) —
security headers can only come from Cloudflare config.

**Concurrent main writers.** gold-price-fetch (:02) + post_gold (:09) + record-price-history
(:05/:35) + sync-db-to-git all push to main with per-workflow concurrency only — standing race; 4×
push failure silently drops an hour of price data.

---

## Constants inventory (Directives 1–3 ground truth)

| Constant             | Canonical                                                                                | Value                                 | Duplicates / drift                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AED peg              | `src/config/constants.js:9` (deny-listed file)                                           | 3.6725                                | 6 Node scripts (`tweet-gold-price.js:38`, `notify-discord.js:28`, `notify-telegram.js:29`, `generate-rss.js:27`, `generate-newsletter.js:72,109`, `price-spike-alert.js:33`), 4 Python (`gold_providers/base.py:46`, `fetch_gold_price.py:201`, `post_gold_price.py:34`, `record_price_history.py:28`, `utils/price_fetcher.py:23`), 2 server routes (`server/routes/alerts.js:43`, `developer-api.js:45`) — all same value, no drift |
| Troy oz              | `src/config/constants.js:10`                                                             | **31.1035**                           | **DRIFTED 3-way**: pipeline writers use 31.1034768 (`base.py:45`, `fetch_gold_price.py:206`, `post_gold_price.py:37`) = Directive-2 exact; client + `record_price_history.py:27` + `price_fetcher.py:24` + `alerts.js:43` + `developer-api.js:46` use 31.1035. Client re-derives from `xau_usd_per_oz` with 31.1035 → can differ from pipeline-written grams in the 5th decimal                                                       |
| Karat purity         | `src/config/karats.js:1-9`                                                               | **code/24** (24K = 1.0, 22K = 22/24…) | Exact fractions, no decimal literals. `spot-resolver.js:15`: "karat purity = code/24 — never re-derived". **Conflicts with campaign Directive 3's fineness table (.999/.9167/…)** — see risk register. Display copy uses ".999"/"99.9%"/"100%" inconsistently (F5)                                                                                                                                                                    |
| Freshness thresholds | none canonical                                                                           | —                                     | `freshness-policy.js` (5 s/60 s/300 s) vs `live-status.js` (30 min/75 min/26 h) vs pipeline `max_freshness_seconds` 900 — three regimes, no shared module                                                                                                                                                                                                                                                                             |
| Constants in copy    | `translations.js` ~40 strings, `learn-hub/content-text.js`, `faq-schema.js`, `footer.js` | 31.1035 / 3.6725 / 91.7% etc.         | Copy is hand-written, not interpolated from CONSTANTS; `scripts/qa/parity-diff-scan.mjs:78-79` checks string presence only                                                                                                                                                                                                                                                                                                            |

## Test coverage picture

1668 tests / 213 files, strong on: freshness (~15 suites), spot-resolver derivation, karat math, FX
integrity, fallback chain, i18n parity guards, Express routes, Python pipeline
(`test_gold_providers.py` etc.), sitemap/SEO governance, SW routing. Playwright e2e exists
(chromium, vs `dist/` on http.server) but **has not run in CI since 2026-04-24**. Not covered:
workflow YAML behavior, live RLS enforcement (no harness hits Supabase), visual regression.

## Top fragility points (merged, deduplicated)

1. `ci.yml` disabled → main unguarded (+ its e2e job broken by `cp -r countries dist/`).
2. Supabase `to authenticated using (true)` admin policies; staged fixes unapplied; `site_settings`
   writable by any signed-up user.
3. Frozen-freshness classification: `spot-resolver.classifyFreshness` trusts commit-time
   `freshness_seconds` → committed JSON is "live" forever on that path.
4. Troy-ounce 3-way drift across write/read boundary (31.1034768 vs 31.1035).
5. Two freshness-threshold systems; component importing the wrong one mislabels the core trust
   surface.
6. ~14 hardcoded peg/troy copies outside the protected constants file.
7. deploy.yml raw-copies `src/`+`data/` into dist (public internal state; bundle drift), and the
   prod hero fetches gold-api.com directly contra the documented invariant.
8. Language-toggle wiring is a per-page contract — a page that forgets it silently ships a broken AR
   toggle.
9. sw.js hand-maintained precache/version + `.catch(warn)` on `addAll` → silent partial offline
   shells.
10. FX single point of failure (open.er-api.com) for ~40 currencies; volatile-currency honesty (LBP
    official vs street) unaddressed.
