# GoldTickerLive — Deep Site Audit

```yaml
date: 2026-07-04
method:
  9 parallel evidence-based auditor agents (one per dimension); every finding cites file:line or a
  live URL
scope: production static site (https://goldtickerlive.com) + repo main @ post-wave
totals: P0=1 · P1=7 · P2=15 (23 findings)
```

> Companion to `docs/MASTER_SITE_AUDIT_AND_REVAMP_PLAN.md`. This audit was run after the 21-PR
> enrichment wave (#496–#516) shipped and was live-verified. Immutable facts (AED peg 3.6725, troy
> oz 31.1035 g, spot≠retail, mandatory freshness labels, EN/AR parity) were treated as constraints,
> not findings.

## Severity summary

| Severity | Count | Meaning                                              |
| -------- | ----- | ---------------------------------------------------- |
| **P0**   | 1     | Breaks trust / correctness / security or a live page |
| **P1**   | 7     | Real quality gap worth fixing soon                   |
| **P2**   | 15    | Polish                                               |

## SECURITY

### [P0] Supabase admin RLS lockdown migration is staged-but-not-applied while the live project has open self-signup, so any outsider who signs up becomes an `authenticated` user with the schema's `using(true)` admin policies over customer-PII (orders.customer jsonb) and price-integrity (pricing_overrides).

- **Evidence:** Source-of-truth supabase/schema.sql:1207-1225 defines every orders admin policy
  `to authenticated using (true)` / `with check (true)` (customer PII jsonb at schema.sql:1197; ~114
  literal-true admin/authenticated policies total). The fix,
  supabase/migrations/002_admin_rls_lockdown.sql:1-27, is explicitly labelled 'RED ZONE — STAGED,
  NOT APPLIED' and states the problem verbatim: '~30 admin policies use to authenticated using
  (true), granting ANY authenticated Supabase user full admin CRUD — including customer PII in
  public.orders.customer and write access to public.pricing_overrides.' Live probe of the referenced
  project GET https://nebdpxjazlnsrfmlpgeq.supabase.co/auth/v1/settings returns
  {"disable_signup":false,"email":true,"github":true,"mailer_autoconfirm":false} — self-signup is
  OPEN and GitHub OAuth grants an authenticated session with no email confirmation. The admin client
  (URL + anon key) is publicly served: https://goldtickerlive.com/admin/supabase-config.js returns
  HTTP 200 (admin/supabase-config.js:19-21). Anon-role reads are correctly gated
  (orders/pricing_overrides return [] over the anon key), so the vector is authenticated-user
  escalation, not anon. I did not create an account to confirm the deployed policy matches
  schema.sql (would be active exploitation of real PII), but schema=source-of-truth + migration
  explicitly-not-applied + open signup is conclusive that the control is unshipped.
- **Fix:** Apply migration 002_admin_rls_lockdown.sql to the live project (replaces `using(true)`
  with the is_admin() role check and removes browser writes to orders/pricing_overrides), AND in
  Supabase Auth set disable_signup=true / restrict to the owner account before/with applying it (the
  migration header lists this as a prerequisite). Then verify the deployed pg_policies actually
  match the hardened set, not schema.sql's permissive baseline.

### [P1] Production (GitHub Pages) emits no security response headers — no CSP, no X-Frame-Options, no Referrer-Policy, no Permissions-Policy — so the public site and the publicly-reachable /admin/ panel have no clickjacking protection and no CSP defense-in-depth over their many innerHTML sinks.

- **Evidence:** `curl -sD- https://goldtickerlive.com/` returns only auto HSTS
  (`strict-transport-security`) and `server: GitHub.com` — no content-security-policy,
  x-frame-options, referrer-policy, or permissions-policy header. The header sets that define them
  live in _headers:51-58 and .htaccess:50-71 but both files self-document the gap (_headers:8-16 /
  .htaccess:42-48: 'GitHub Pages... does NOT read this file'). index.html:40 sets
  X-Content-Type-Options via `<meta http-equiv>`, which browsers ignore for that directive (only
  effective as an HTTP header), so even MIME-sniffing protection is absent at runtime. No .html file
  contains a CSP meta (`grep -rli Content-Security-Policy *.html` → none).
- **Fix:** Front goldtickerlive.com with Cloudflare (Transform Rule / Worker) or Netlify so the
  existing _headers set is actually emitted, or inject a CSP + `X-Frame-Options: DENY`
  (frame-ancestors 'none') meta/header path for GitHub Pages. Drop reliance on the inert `<meta>`
  X-Content-Type-Options.

### [P2] The admin panel is published to the same public static host, so its intended per-path hardening (no-store/private cache, noindex, DENY framing) is inert and its safety rests entirely on the currently-broken Supabase RLS.

- **Evidence:** deploy.yml:99 (`[ -d admin ] && cp -r admin dist/`) ships admin/ to GitHub Pages;
  https://goldtickerlive.com/admin/ returns HTTP 200. _headers:60-63 intends `/admin/*` →
  `X-Robots-Tag: noindex, nofollow` and `Cache-Control: private, no-store`, but that file is not
  read by GitHub Pages, so admin responses can be cached by intermediaries/browsers and framed.
  Indexing is only partially mitigated by robots.txt `Disallow: /admin/` (advisory). Because auth is
  client-side-only (admin/supabase-config.js:14-16 warns ALLOWED_EMAIL is a bypassable hint), the
  panel's real access control is the RLS covered in finding 1.
- **Fix:** Deploy admin/ to a separate access-gated host (Netlify/Cloudflare where _headers works,
  behind auth) rather than the public Pages site, or accept it is public and treat server-side RLS
  (finding 1) as the sole control — after that migration is applied and verified.

## TRUST

### [P1] On the static production site the freshness label can never reach "Stale" during market hours — multi-hour-old data is capped at "Delayed" because the committed gold_price.json is frozen with is_fresh:true.

- **Evidence:** data/gold_price.json:17 ships "is_fresh": true (also live: curl
  https://goldtickerlive.com/data/gold_price.json returns is_fresh:true). api.js
  normalizeGoldResponse pipes it through as isFresh:true; primary-provider.js:23 forwards it;
  quote-freshness-bridge.js:12-15 keeps it true; home.js:296/411/532 pass isFresh:goldIsFresh into
  the hero, spotBar and ticker. In live-status.js:221-239 the `if (isFresh === true)` branch has NO
  stale outcome — for any age > delayedMaxAgeMs (300s) it returns key:'delayed', so the 75-min
  STALE_AFTER_MS safety net (whose stated contract is "anything older than the refresh window is no
  longer trustworthy") is unreachable. spotBar.js:150 sets data-freshness straight from this key, so
  during a GitHub-Actions gap a 3-hour-old price renders "Delayed" (defined in-code as "still
  trustworthy, just slightly behind") instead of "Stale". Same committed file correctly shows
  "Stale" at 75min on compare/portfolio (which omit isFresh), so the label contradicts itself
  page-to-page.
- **Fix:** In getLiveFreshness, escalate to 'stale' inside the isFresh===true branch when ageMs >
  staleAfterMs BEFORE applying the 5s/60s/300s live-API budget; or gate that live-API budget behind
  CONSTANTS.API_BACKEND_ENABLED so the static deployment (which can never flip is_fresh to false
  client-side) uses the 30/75-min age path. Add a test asserting isFresh:true + ageMs>staleAfterMs →
  'stale'.

### [P2] Global spot bar and bottom ticker hard-code "Live" in their container aria-label and never update it, so screen-reader users always hear "Live" even when data is stale, cached, fallback, or the market is closed.

- **Evidence:** spotBar.js:49 sets aria-label "Live gold spot prices" once at injection;
  ticker.js:129 sets aria-label "Live gold price ticker" once. Neither updateSpotBar
  (spotBar.js:110-159) nor updateTicker (ticker.js:225-278) ever rewrites the container aria-label —
  they only update the inner data-freshness/status pill. The accessible name therefore claims "Live"
  permanently, violating the trust rule "never call data live unless truly live" for the
  assistive-tech layer even when data-freshness is 'stale'/'fallback'/'closed'/'unavailable'.
- **Fix:** Drop "Live" from the static container label (e.g. "Gold spot prices" / "Gold price
  ticker"), or recompute and set the container aria-label from the current freshness key inside
  updateSpotBar/updateTicker so the accessible name tracks the visible pill.

### [P2] compare.html and portfolio.html render their own spot badge without the market-closed overlay, so during the closed-market window (e.g. Sunday 21:02–22:00 UTC after the cron commits) the page badge shows "Live" while the global bar/hero correctly show "Closed".

- **Evidence:** compare.js:287-298 (renderSpotBadge) and portfolio.js:368-379 (renderSpotBadge) call
  getLiveFreshness() and use f.key directly, without applyMarketClosedOverlay. The shared surfaces
  DO apply it — spotBar.js:149, ticker.js:256, and home.js:320 — so on the same page the
  compare/portfolio badge and the global spot bar disagree. Reachable weekly: the cron runs Sunday
  21:02–23:02 UTC (.github/workflows/gold-price-fetch.yml:16) but getMarketStatus
  (live-status.js:64-76) keeps the market 'closed' until 22:00 Sunday, so a fresh <30-min commit at
  21:05 makes the compare badge read "Live · 3 min ago" while the bar reads "Closed" — a "live"
  claim during a closed market.
- **Fix:** Wrap the key with applyMarketClosedOverlay in both renderSpotBadge functions (const key =
  applyMarketClosedOverlay(f.key)) and drive dataset.state / the label from that, mirroring
  spotBar.js and home.js. Import applyMarketClosedOverlay in compare.js and portfolio.js.

## I18N

### [P1] document.title is never localized in AR on home/calculator/shops/methodology/invest, so the browser-tab & screen-reader page title stays English in Arabic mode (parity gap on the flagship home page).

- **Evidence:** grep shows 0 `document.title =` assignments in src/pages/home.js, calculator.js,
  shops.js, methodology.js, invest.js, and none have a `docTitle` dict key;
  src/components/site-shell.js sets no title either. By contrast 6 pages DO localize it:
  compare.js:754, dubai-gold-price.js:48, glossary.js:45, heatmap.js:820, market.js:45, and
  portfolio.js (all via t('docTitle')). So in ?lang=ar the home page keeps its English <title> 'Live
  Gold Prices...' in the tab and in the screen-reader page-title announcement. No i18n guard test
  covers document.title parity.
- **Fix:** Add a localized `docTitle` string to each missing page's dict and assign
  `document.title = t('docTitle')` in the AR render path (or centralize title localization in
  mountSharedShell), matching the pattern already used by compare/glossary/market/etc. Then add a CI
  check that every page localizing content also localizes its title.

### [P2] Local-dict EN/AR parity guard omits submit-shop.js, terms.js, privacy.js; submit-shop.js ships an EN-only orphan key that the guard would otherwise flag.

- **Evidence:** tests/i18n-local-dict-parity.test.js:33-44 (LOCAL_DICTS) lists 10 pages but omits
  src/pages/submit-shop.js, terms.js, privacy.js — all of which use the same guarded
  `const T = { en, ar }` shape (submit-shop.js:15, terms.js:11, privacy.js:11).
  src/pages/submit-shop.js:30 defines `successAr: null` inside `en` with no counterpart in `ar`
  (verified: en=14 keys, ar=13, enOnly=['successAr']). The full guard suite still passes 13/13,
  proving the divergence is uncaught. successAr is dead (success message uses t('success') at
  submit-shop.js:238 and :283), so no runtime break, but the guard's whole purpose is to catch
  exactly this EN/AR key drift.
- **Fix:** Add ['src/pages/submit-shop.js','T'], ['src/pages/terms.js','T'],
  ['src/pages/privacy.js','T'] to LOCAL_DICTS, and delete the dead `successAr: null` key in
  submit-shop.js (or give it an ar counterpart) so parity holds.

### [P2] Site-wide data-i18n coverage guard skips learn.html (63 keys); an orphan data-i18n='budgetLabel' already resolves to a raw key and no test catches it.

- **Evidence:** tests/i18n-sitewide-guard.test.js:128-131 restricts data-i18n coverage to
  htmlNamespaces = { 'tracker.html', 'index.html' }. learn.html loads invest.js (learn.html:891),
  whose renderStaticText hydrates ALL [data-i18n] nodes (invest.js:699-702) via tx() which returns
  the RAW key on a miss (invest.js:658). learn.html:590 has data-i18n="budgetLabel" but invest.js's
  I18N dict defines no `budgetLabel` in en or ar (verified by diffing all 63 learn.html keys against
  I18N: only budgetLabel is missing from both). It is only masked because invest.js:709 overwrites
  #budget-label's textContent right after the loop; remove/rename that override and 'budgetLabel'
  renders verbatim in both languages. No CI guard scans learn.html data-i18n keys.
- **Fix:** Extend the data-i18n guard to also validate learn.html against invest.js's I18N dict
  (un-namespaced), and remove the orphan data-i18n="budgetLabel" attribute (or add a `budgetLabel`
  key to I18N) so the label no longer depends on a coincidental override.

## PERF

### [P1] Every main page downloads a redundant, UNMINIFIED duplicate of its page JS via <link modulepreload> that is never executed — roughly doubling first-load JS and firing a cascade of 404 requests.

- **Evidence:** Source HTML hand-authors modulepreload hints to raw source paths: index.html:93-96
  (`<link rel="modulepreload" href="src/pages/home.js">`, `src/lib/api.js`,
  `src/components/site-shell.js`), shops.html:76-78 (`./src/pages/shops.js` …),
  calculator.html:77-79, tracker.html, plus
  compare/dubai-gold-price/glossary/heatmap/market/portfolio.html (10 files). Vite emits each as a
  verbatim unminified asset AND preloads it, while the real bundled+minified entry
  (`<script type=module src=./src/pages/shops.js>`) does the work. LIVE-VERIFIED:
  `curl https://goldtickerlive.com/assets/shops-OZ1D1brR.js` → HTTP 200, 104KB, raw source starting
  `import { COUNTRIES } from '../config/countries.js';` — byte-identical to src/pages/shops.js
  (106,623 bytes); the executed entry is the separate MINIFIED /assets/shops-Dr1CRyyj.js. Homepage
  preloads unminified /assets/home-CJ9jgw5F.js (69KB) + /assets/api-BVfX0dQE.js (10KB); calculator
  +74KB; tracker +70KB. Dead per page: index ~79KB, shops ~114KB, calculator ~84KB, tracker ~84KB
  (uncompressed). The raw copies' bare imports 404 on the CDN:
  https://goldtickerlive.com/config/index.js →404, /lib/api.js →404, /config/countries.js →404, so
  each preload also spawns broken sub-requests + console errors. None are precached by sw.js, so no
  offline benefit.
- **Fix:** Delete the `<link rel="modulepreload" href="[./]src/...">` lines from the 10 source HTML
  heads (index, tracker, shops, calculator, compare, dubai-gold-price, glossary, heatmap, market,
  portfolio). Vite already auto-injects correct hashed `crossorigin` modulepreloads for the real
  entry chunks (utils/site-shell/etc.), so the hand-authored source-path hints only produce these
  dead, unminified duplicate assets. After removal, rebuild and confirm dist/assets no longer
  contains verbatim src copies (`head -c80 dist/assets/*.js` should show no
  `import ... from '../...'`).

### [P2] Dead component MarketSummaryTicker's stylesheet ships in the render-blocking global.css on every page despite the component never being used in production.

- **Evidence:** src/components/MarketSummaryTicker.js (exports renderMarketSummaryTicker) is
  imported ONLY by tests/market-summary-ticker.test.js — no production page or module imports it
  (grep across all _.html/_.js in src excluding tests returns only the file itself). Yet its
  stylesheet styles/partials/market-summary-ticker.css (3.6KB) is @imported at styles/global.css:5
  (`@import url('./partials/market-summary-ticker.css');`), which the build flattens into
  dist/assets/global-BQpE2xq5.css (178KB) — a render-blocking `<link rel=stylesheet>` in every page
  head (dist/index.html links /assets/global-BQpE2xq5.css).
  `grep '.market-summary-ticker{' dist/assets/global-BQpE2xq5.css` confirms the dead rules are
  present in the shipped bundle, downloaded and parsed on every page load.
- **Fix:** Remove the `@import url('./partials/market-summary-ticker.css');` line from
  styles/global.css:5, and delete the dead src/components/MarketSummaryTicker.js,
  styles/partials/market-summary-ticker.css, and tests/market-summary-ticker.test.js (also drop the
  corresponding entry in scripts/node/split-global-css-partials.js:30). This stops the unused ticker
  CSS from shipping render-blocking on every page.

## CORRECTNESS

### [P1] Flagship tracker links to a methodology anchor (#spot-vs-retail) that does not exist, so the core "reference price is not retail price" deep-link lands at the top of the page instead of the intended section.

- **Evidence:** tracker.html:272, 298, 999, 1308 all use href="methodology.html#spot-vs-retail", and
  it is also injected at runtime by src/pages/tracker-pro.js:270,277,435 (modulepreloaded at
  tracker.html:83) into the hero readout disclaimer. methodology.html contains 0 occurrences of
  id="spot-vs-retail" (grep -c returns 0). The other 6 methodology anchors used site-wide
  (#disclaimer, #fallback, #fx-rates, #gold-data, #karat-conversion, #not-included) all resolve to
  real IDs — only this one is broken. Confirmed live: curl
  https://goldtickerlive.com/methodology.html finds 0 'spot-vs-retail'; curl
  https://goldtickerlive.com/tracker.html still links to it. check-links.js cannot catch this
  because extractLinks() strips '#' fragments (scripts/node/check-links.js:90).
- **Fix:** Add an anchor to methodology.html for the reference-vs-retail explainer — e.g. give the
  relevant section id="spot-vs-retail" (the 'not-included' / making-charges+VAT section at
  methodology.html line 461 is the natural target) — or repoint the 4 static links plus the three
  src/pages/tracker-pro.js references to an existing anchor such as #not-included. Add a
  fragment-anchor check to the link validator so stripped-# deep links are covered.

### [P2] The METHODOLOGY_FRAGMENTS allow-list in cross-page-links.js is stale: all five non-empty entries fail to match any real section id in methodology.html, so any buildMethodologyHref() call passing one silently emits a broken deep link.

- **Evidence:** src/lib/cross-page-links.js:18-25 declares METHODOLOGY_FRAGMENTS = {'',
  'spot-vs-retail', 'formula', 'sources', 'freshness', 'karats'}. grep 'id="<frag>"'
  methodology.html returns 0 for every one of spot-vs-retail/formula/sources/freshness/karats,
  whereas the real section IDs are live-formula, gold-data, fx-rates, freshness-states and
  karat-conversion. buildMethodologyHref (line 31-40) treats these as valid and appends them
  verbatim as #hash; current callers (page-hydrator.js, calculator.js) happen to pass no fragment,
  so it is latent today but guaranteed to break the moment any caller supplies one.
- **Fix:** Sync METHODOLOGY_FRAGMENTS to the actual methodology.html section IDs (e.g.
  formula→live-formula, freshness→freshness-states, karats→karat-conversion,
  sources→gold-data/fx-rates) and add the spot-vs-retail anchor per the P1 fix, or drop entries that
  have no corresponding section. Consider a unit/validation test that asserts every
  METHODOLOGY_FRAGMENTS entry resolves to an id in methodology.html.

## UX

### [P1] Glossary in-page jump navigation stays English when the page is switched to Arabic, breaking EN/AR parity on the page's primary navigation

- **Evidence:** glossary.html:123-126 hardcodes the four jump links ("Pricing & value", "Units &
  purity", "Products", "Markets & benchmarks") as a single non-duplicated <nav> with no
  data-lang-block twin; src/pages/glossary.js:17-32,41 only localizes 'glossary-jump-label' (and
  hero), so the link texts and the nav aria-label="Glossary sections" are never translated. In
  Arabic mode every section heading they point to is Arabic (glossary.html:169), producing English
  links over an Arabic page. Confirmed on production: curl https://goldtickerlive.com/glossary.html
  shows the same English-only links at lines 127-130. Contrast the sibling market page which
  duplicates the jump nav per language (market.html:123 EN + market.html:131 AR).
- **Fix:** Make the glossary jump nav bilingual like market/dubai: either duplicate the <nav> into
  data-lang-block="en"/"ar" twins (with translated link text and aria-label), or add the four link
  ids plus the aria-label to the JS T table in src/pages/glossary.js and swap their textContent in
  applyLang().

### [P2] Market 'next steps' router cards render a right-pointing arrow (→) in Arabic RTL, where it should flip to a left arrow (←)

- **Evidence:** styles/pages/market.css:342-345 sets .mkt-router-title::after { content: ' \2192' }
  with no RTL override, but the Arabic router cards are wrapped in dir="rtl" (market.html:639), so
  the arrow points the wrong way relative to Arabic reading flow. The sibling Dubai page fixes
  exactly this at styles/pages/dubai-gold-price.css:250-252 ([dir='rtl'] .dubai-router-title::after
  { content: ' \2190' }); market simply omits that rule.
- **Fix:** Add the RTL override to market.css to mirror dubai: [dir='rtl'] .mkt-router-title::after
  { content: ' \2190'; } (or use a logical/mirrored glyph).

## OBSERVABILITY

### [P1] X-automation observability logs never record the posted tweet_id — the automation's primary trace key is always null, so no run can be reconciled against the actual X post.

- **Evidence:** scripts/python/post_gold_price.py:1452-1453 reads the ID as
  `hasattr(response.data, "id")` / `str(response.data.id)`, but tweepy (pinned
  scripts/python/requirements.txt:17 `tweepy==4.16.0`) returns `create_tweet().data` as a plain dict
  (`response.data["id"]`), so `hasattr(dict,"id")` is False and tweet_id stays None. Empirically
  confirmed in the live logs: 242/242 POSTED entries in data/automation_runs.json and 250/250 in
  data/tweet_posts.json have `"tweet_id": null`, and data/last_tweet_state.json shows
  `"last_tweet_id": null` for the 2026-07-04T21:12:09Z post. posted_tweet_id
  (post_gold_price.py:2158,2182) therefore feeds null into both the run record and last_tweet_state.
- **Fix:** Read the id defensively with dict-then-attribute fallback:
  `tweet_id = response.data.get("id") if isinstance(response.data, dict) else getattr(response.data, "id", None)`;
  add a regression assertion so a POSTED outcome without a captured tweet_id is flagged in the run
  summary.

### [P2] The analytics event-inventory governance gate in `npm run validate` is a silent no-op — it warns but exits 0 on a missing/stale inventory, so the event catalog can drift out of sync with green CI.

- **Evidence:** scripts/node/export-analytics-inventory.js:36-52: the `--check` branch calls
  `console.warn(...)` then `return` (exit 0) for both the missing-report and stale-report cases;
  `process.exit(1)` (line 61) only fires on a thrown runtime error. It is wired into the validate
  chain at package.json:60. Verified empirically: corrupting reports/analytics/event-inventory.json
  and re-running `--check` still exits 0, whereas every sibling gate in the same chain
  (inject-schema.js, externalize-analytics.js, inventory-seo.js, seo-governance.js,
  sync-icon-sprite.js) calls process.exit(1) on failure.
- **Fix:** In the missing and stale branches set `process.exitCode = 1` (or `process.exit(1)`) after
  the warning, matching the other `--check` gates, so a drifted src/lib/analytics.js EVENT_SCHEMA
  fails validate instead of passing silently.

## SEO

### [P2] Two stale, divergent sitemap generators create a silent regression footgun; only the deploy-time generator produces the correct sitemap.

- **Evidence:** build/generateSitemap.js:55-73 hardcodes an 11-page staticPages list that OMITS
  three indexable, self-canonical pages present in the live sitemap: dubai-gold-price.html,
  glossary.html, market.html (all lack noindex; canonicals verified e.g.
  dubai-gold-price.html:'<link rel="canonical" href="https://goldtickerlive.com/dubai-gold-price.html">').
  This script is wired into `npm run build` (package.json:13). public/sitemap.xml is a tracked
  14-URL HAND-MAINTAINED copy that no generator reproduces (violating AGENTS.md 'Sitemap is
  generated — must not hand-edit'). Live is correct (https://goldtickerlive.com/sitemap.xml = 14
  URLs) ONLY because deploy.yml separately re-runs scripts/node/generate-sitemap.js (filesystem
  walk) after build and gates with check-sitemap-coverage.js. build/generateSitemap.js's 11-URL
  output is discarded before deploy — dead but misleading code.
- **Fix:** Make scripts/node/generate-sitemap.js the single source of truth: delete
  build/generateSitemap.js (or have it re-export the canonical generator) and remove it from the
  package.json:13 build chain; delete or regenerate public/sitemap.xml so no stale hand-maintained
  copy can drift. This removes the risk that dropping the deploy regenerate step ships a sitemap
  missing 3 indexable pages.

### [P2] Meta descriptions (and titles) on three pages exceed SERP display limits and will be truncated in search results.

- **Evidence:** Whitespace-collapsed meta description lengths: dubai-gold-price.html:43 = 201 chars,
  market.html:43 = 216 chars, glossary.html:43 = 184 chars — all well over Google's ~155-160 char
  display limit (other pages e.g. index 152, tracker 147 are fine). Titles also over ~60 chars:
  dubai-gold-price.html 89 chars, market.html 80 chars. The regression guard
  scripts/node/check-seo-meta.js:109 only enforces a 10-char MINIMUM description and no
  title/description maximum, so these slip through validation.
- **Fix:** Trim the three descriptions to <=155 chars and the dubai/market titles to <=60 chars
  (front-load the primary keyword). Optionally add a maximum-length assertion (title <=60,
  description <=160) to check-seo-meta.js so future over-long metadata is caught in CI.

### [P2] Flagship 'Gold Rate in Dubai' local landing page has only a single inbound internal link, weakening its internal-link equity.

- **Evidence:** grep of all HTML for inbound links to dubai-gold-price.html finds exactly one
  source: index.html:776 ('<a href="dubai-gold-price.html" class="tool-card">'). It is not linked
  from methodology.html, market.html, shops.html, or compare.html even though those are its natural
  related pages, and it carries sitemap priority 0.9. This is thin linking versus AGENTS.md
  local-page policy (lines 92-96: local pages 'must connect to calculators, methodology, related
  country/market content — not fragment into orphans').
- **Fix:** Add contextual inbound links to dubai-gold-price.html from market.html (how gold is
  priced -> local Dubai example), methodology.html, shops.html (UAE shops), and compare.html so the
  highest-value local landing page accumulates internal link equity.

### [P2] hreflang="ar" points to ?lang=ar, which serves byte-identical English HTML with an English canonical — no crawlable Arabic document exists.

- **Evidence:** Live / and /?lang=ar return identical static HTML with <html lang="en"> and
  <link rel="canonical" href="https://goldtickerlive.com/"> (verified via curl); the alternate is
  <link rel="alternate" hreflang="ar" href="https://goldtickerlive.com/?lang=ar"> (index.html head +
  sitemap). There is no separate Arabic URL — /ar/ returns HTTP 404 and no ar/index.html exists on
  disk. Arabic rendering is entirely client-side JS, so the ?lang=ar URL canonicalizes back to the
  English page and search engines get no distinct Arabic version to index for Arabic searchers. This
  is the known, owner-gated ?lang=ar design (documented in scripts/node/generate-sitemap.js:102-107
  referencing OWNER_REVIEW.md Phase 43) — surfaced for visibility, not as an unknown defect.
- **Fix:** Owner decision: either explicitly accept the tradeoff (the hreflang=ar cluster provides
  no crawlable AR page), or pre-render a distinct Arabic document (e.g. /ar/ or ?lang=ar served as
  static AR HTML) with its own <html lang="ar">, self-referencing canonical, and reciprocal hreflang
  so the Arabic version is independently indexable.

## A11Y

### [P2] Primary CTA hover state fails WCAG AA text contrast in light theme (3.42:1)

- **Evidence:** styles/partials/components.css:2487 sets .btn-primary{color:#fff8e8}; :2495-2500
  .btn-primary:hover{background:var(--color-gold)...} adds NO color override, so on hover the
  near-white #fff8e8 text sits on light gold --color-gold #b07d1f = 3.42:1 (below AA 4.5:1 for
  14.4px/700 bold button text). The base state passes (#fff8e8 on --color-gold-dark #7e5912 =
  5.97:1); only hover regresses because the background lightens. Confirmed in the DEPLOYED bundle:
  dist/assets/global-BQpE2xq5.css contains `.btn-primary{...color:#fff8e8}` and
  `.btn-primary:hover{background:var(--color-gold)...}`, and https://goldtickerlive.com/ references
  exactly `/assets/global-BQpE2xq5.css`. Affects non-hero primary CTAs across calculator.html,
  shops.html, tracker.html, index.html (the .hero .btn-primary:hover override at
  styles/pages/home.css:316 flips to dark bg/light text and is safe; dark theme flips text to
  --color-on-gold and is safe).
- **Fix:** On .btn-primary:hover (components.css:2495) add `color: var(--color-on-gold)` — dark ink
  #1a1305 on #b07d1f = 5.09:1 — or keep the hover background at --color-gold-dark instead of
  lightening to --color-gold.

### [P2] Mobile bottom-nav active item conveys 'current page' by color only — no aria-current for screen readers

- **Evidence:** src/components/nav.js:1027-1040 builds each bottom-nav link as
  `<a href=... class="mobile-bottom-nav-item is-active" aria-label=...>` — the active item gets only
  the visual `is-active` class and no `aria-current`, so SR users get no current-page indication on
  the primary mobile navigation. This is inconsistent with the rest of the nav, which does set it:
  nav.js:161, 251, 265, 283 all emit `aria-current="page"` for active dropdown/drawer links.
- **Fix:** In the non-menu branch of the bottom-nav template (nav.js:1037), append
  `${isActive ? ' aria-current="page"' : ''}` to the `<a>` so the active tab is programmatically
  identifiable, matching the dropdown/drawer links.

## Remediation plan (this session)

Fixes are shipped as small, scoped PRs, each verified with `lint` + `test` + `validate` + `build`
and each touching site files so it also triggers a clean production deploy.

### Fixing now

- **TRUST P1** — freshness now escalates to `stale` past the 75-min window even when `isFresh:true`
  (`src/lib/live-status.js`) + regression test. **[shipped in the Trust PR]**
- **TRUST P2** — `compare.js` / `portfolio.js` spot badges now apply the market-closed overlay.
- **TRUST P2** — spotBar / ticker container `aria-label` no longer hard-codes "Live".
- **SEO P2** — trim over-long `glossary`/`market`/`dubai` titles + descriptions and extend the
  meta-length guard to cover them.
- **CORRECTNESS P1** — add the missing `#spot-vs-retail` anchor on `methodology.html`.
- **I18N P1** — localize `document.title` in Arabic on home/calculator/shops/methodology/invest.
- **UX P1** — make the glossary jump-nav bilingual (EN/AR).
- **UX P2** — flip the market "next steps" arrow for RTL.
- **A11Y P2** — CTA hover contrast + mobile bottom-nav `aria-current`.
- **PERF P1/P2** — remove dead hand-authored `modulepreload` source-path hints; drop dead
  `MarketSummaryTicker` CSS.
- **OBSERVABILITY P1** — capture the posted `tweet_id` correctly in `post_gold_price.py`.

### Deferred — requires owner decision (documented, not auto-applied)

- **SECURITY P0 — Supabase admin RLS lockdown** (`supabase/migrations/002_admin_rls_lockdown.sql`,
  staged-not-applied; live project has open self-signup). This is a **live-database + auth change on
  real customer PII** and the migration's own header requires disabling signup first. Applying it
  autonomously is out of scope for a safe change — **owner must apply the migration and set
  `disable_signup=true`** (or explicitly authorize it). Highest-priority item on the board.
- **SECURITY P1 — no security response headers on GitHub Pages.** GitHub Pages cannot emit custom
  headers; the existing `_headers` / `.htaccess` are inert there. Real fix needs a CDN front
  (Cloudflare/Netlify) — an infrastructure decision for the owner.
