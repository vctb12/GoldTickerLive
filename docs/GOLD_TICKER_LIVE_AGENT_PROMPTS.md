# Gold Ticker Live — Agent Prompt Library

A practical, repo-aware library of prompts for driving GitHub Copilot Agent (cloud, CLI, IDE chat),
Claude Code, Codex, Cursor, and similar tools through real product work on **Gold Ticker Live** —
the bilingual EN/AR live gold-price platform that ships from this repo to
[goldtickerlive.com](https://goldtickerlive.com/).

These prompts were written specifically for this codebase. They reference the actual files, scripts,
conventions, guardrails and product surfaces that exist in the repo. They are written so you can
paste them into an agent session as-is.

> Companion docs to read alongside this file: [`AGENTS.md`](../AGENTS.md),
> [`docs/REVAMP_PLAN.md`](./REVAMP_PLAN.md), [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md),
> [`docs/SEO_STRATEGY.md`](./SEO_STRATEGY.md), [`docs/DESIGN_TOKENS.md`](./DESIGN_TOKENS.md),
> [`docs/ACCESSIBILITY.md`](./ACCESSIBILITY.md), [`docs/AUTOMATIONS.md`](./AUTOMATIONS.md).

---

## How to Use These Prompts

1. **Pick the prompt that matches the work.** Don't merge two prompts into one mega-task; agents
   produce better diffs when scope is clear.
2. **Paste the prompt verbatim** into the Copilot Agent task box (or the chat panel of your editor).
   They're written in second person and assume the agent has tools to read files, run commands, and
   open a PR.
3. **Let the agent inspect first.** Every prompt opens with an "explore" step — don't skip it. The
   repo's guardrails (price math, freshness labels, deployment base path, hourly X-post workflow)
   are non-obvious if you only read a few files.
4. **Work in focused commits.** Each prompt asks the agent to keep commits scoped (tokens vs. layout
   vs. SEO vs. docs). Reviewers and rollbacks are dramatically easier this way.
5. **Verify before finishing.** Each prompt ends with the verification commands that exist in
   `package.json` (`npm run validate`, `npm test`, `npm run quality`, `npm run build`). The agent
   must state what it ran vs. what it inferred.
6. **Don't break deployment.** The site ships from `main` to GitHub Pages on the custom domain
   `goldtickerlive.com`. Never silently change `CNAME`, `vite.config.js` `base`, the service-worker
   scope, canonical URLs, or the `countries/**/gold-prices/` URL paths.
7. **Bilingual is non-negotiable.** Any user-visible string lives in `src/config/translations.js`
   and ships in EN + AR. RTL layout must work for every surface that gets touched.
8. **Open a draft PR early.** For multi-step work, publish the plan as a draft PR first so you can
   redirect cheaply.

> **Tip:** If the agent stalls, paste **Prompt 11 — Safe Large-PR Execution** into the same session.
> It re-orients the agent to ship small, sequenced commits instead of one mega-diff.

---

## Prompt 1 — Full UI/UX Revamp

```text
You are working on the Gold Ticker Live repo (custom domain: goldtickerlive.com). This is a
bilingual EN/AR static multi-page site (no React, no Next, no SPA). All design tokens live in
`styles/global.css` and `styles/pages/*.css`. All user-visible strings live in
`src/config/translations.js`.

GOAL
Run a sitewide UI/UX revamp that makes the product feel like a serious, premium, trustworthy
live-gold-price platform — not a generic info page. Improve global polish, navigation, hero flow,
card hierarchy, CTA clarity, mobile layout, RTL behavior, trust signals, and visual rhythm.

INSPECT FIRST
1. Read `index.html`, `tracker.html`, `calculator.html`, `shops.html`, `learn.html`,
   `insights.html`, `methodology.html`, `invest.html`, `offline.html`, `404.html`.
2. Read `styles/global.css` (tokens + primitives) and every file under `styles/pages/`.
3. Read `src/components/nav.js`, `src/components/footer.js`, `src/components/ticker.js`,
   `src/components/internalLinks.js` and any shared card components.
4. Read `src/pages/home.js` and `src/tracker/render.js` to understand dynamic content rendering.
5. Read `src/config/translations.js` so every copy change you make ships in EN + AR.
6. Open the site at desktop (1440px) and mobile (360px, 414px) widths in your head — list the
   surfaces that look weak (cramped cards, weak hierarchy, unclear CTAs, ambiguous freshness).

WORK
- Use existing tokens (`--color-*`, `--surface-*`, `--space-*`, `--text-*`, `--radius-*`,
  `--shadow-*`, `--ease-*`, `--duration-*`). Never hand-pick raw hex or rems where a token exists.
- Tighten heading scale and spacing rhythm across home, tracker, calculator, shops, content guides.
- Improve hero flow on `index.html`: clear value proposition, freshness pill near the live price,
  obvious primary CTA to the tracker.
- Improve nav active states, mobile drawer hierarchy, language/theme toggle clarity. Keep the nav
  data-driven via `src/components/nav-data.js`.
- Strengthen card primitives: cards must look consistent across home, tracker, shops, and country
  pages. Consolidate `.card` / `.panel` variants where they overlap.
- Mobile pass at 360px: no horizontal scroll, no overlapping sticky elements, tap targets ≥ 44px.
- RTL pass on every surface you touch: mirror chevrons/arrows, verify alignment.
- Add visible trust signals where it strengthens the page (source label, last-updated pill,
  methodology link). Do NOT change pricing math.

CONSTRAINTS
- No new dependencies, no framework migration, no new build system.
- Don't change `CNAME`, `vite.config.js` `base`, service-worker scope, canonical URLs, or the
  `countries/**/gold-prices/` URL paths.
- Don't touch the AED peg constant, troy-ounce constant, karat purity values, or freshness
  thresholds.
- Every user-visible string change ships in EN + AR via `src/config/translations.js`.
- Respect `prefers-reduced-motion: reduce` for any new motion.

VERIFY
- `npm run validate` (build integrity + DOM-safety + SEO meta + sitemap + placeholder + analytics)
- `npm test`
- `npm run quality`
- `npm run build`
- Manual: skim home / tracker / shops / a country page at 360px and at 1440px in both EN and AR.

DELIVERABLE
A single PR with focused commits (tokens, layout, nav, hero, cards, mobile/RTL, content polish,
docs). PR body lists what changed, what was verified, and any surfaces intentionally deferred.
Update `docs/REVAMP_PLAN.md` with the section you completed.
```

---

## Prompt 2 — Live Tracker Upgrade

```text
You are working on the Gold Ticker Live tracker page (`tracker.html`, rendered by
`src/tracker/render.js` and helpers in `src/tracker/`). The tracker is the product's flagship
surface. It must feel live, trustworthy, and easy to use on mobile.

GOAL
Tighten the live-tracker experience: clearer freshness states, better karat toggles, country tabs,
per-gram / per-ounce / per-tola unit logic, smarter loading and fallback states, unambiguous
"last updated" labels, explicit source labeling, and a usable comparison flow.

INSPECT FIRST
1. Read `tracker.html`, `src/tracker/render.js`, `src/tracker/state.js` (or equivalent),
   `src/tracker/karat.js`, `src/tracker/country.js`, and any chart helpers.
2. Read `src/lib/api.js`, `src/lib/cache.js`, `src/lib/price-calculator.js`,
   `src/lib/formatter.js` to understand price flow and freshness.
3. Read `src/config/constants.js` for `GOLD_REFRESH_MS`, `AED_PEG`, `TROY_OZ_GRAMS`.
4. Read translations under `tracker.*` in `src/config/translations.js`.
5. Read `docs/tracker-state.md` if it exists.

WORK
- Make the freshness state obvious at a glance: live (green pill), delayed (amber + reason),
  cached (slate + timestamp), stale (red + "as of …"). Use existing CSS tokens, no new colors.
- Make the data-source label visible (XAU/USD spot via <source>, AED derived via fixed peg
  3.6725). The user should never wonder where the number came from.
- Karat toggles: clear active state, large tap targets, keyboard navigable, persist to
  `user_prefs` localStorage.
- Country tabs: smooth horizontal scroll on mobile, clear active state, RTL parity.
- Unit toggles (g / oz / tola): persist via `user_prefs`, format numbers via
  `src/lib/formatter.js`.
- Loading state: real skeletons that match final layout, no layout shift.
- Fallback state: when the API fails, show the last cached price with a clear "as of …" stamp,
  not "—" or "undefined".
- Comparison flow: ensure side-by-side karat / country comparisons are usable on 360px wide.
- Verify `aria-live="polite"` is set correctly on the price region, no spammy re-announces.

CONSTRAINTS
- DO NOT change the spot/AED/karat/troy-ounce math. Any formula change requires a separate plan
  and explicit owner approval.
- DOM-safety baseline must not regress. Use `el()` / `replaceChildren()` from
  `src/lib/safe-dom.js`. Don't add new `innerHTML` sinks.
- Every user-visible string ships in EN + AR. Verify Arabic copy is natural, not machine-feeling.
- Keep the page lightweight; no charting libraries that aren't already in the repo.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: throttle network in devtools and confirm cached + stale states render readable copy.
- Manual: switch karat, country, unit, and language; confirm everything persists across reload.
- DOM-safety baseline check: `node scripts/node/check-unsafe-dom.js`.

DELIVERABLE
PR with focused commits (state machine, freshness UI, toggles, mobile, RTL, tests). Update
`docs/tracker-state.md` (or create it) describing the freshness states and their copy keys.
```

---

## Prompt 3 — SEO and Indexing Upgrade

```text
You are upgrading SEO + indexing across Gold Ticker Live (goldtickerlive.com). The site is a
static multi-page bilingual platform. SEO infrastructure lives in `src/seo/`, generated via
`scripts/node/inject-schema.js`, `scripts/node/generate-sitemap.js`, and validated by
`scripts/node/check-seo-meta.js`, `scripts/node/inventory-seo.js`, and `scripts/node/seo-audit.js`.

GOAL
Make every public page indexable, well-titled, well-described, properly canonicalized, with
correct Open Graph / Twitter card metadata, valid JSON-LD, complete sitemap coverage, healthy
internal linking, and search-intent-aligned headings.

INSPECT FIRST
1. Read `robots.txt`, `sitemap.xml` (if committed), `build/generateSitemap.js`,
   `scripts/node/generate-sitemap.js`, and `scripts/node/inject-schema.js`.
2. Read `src/seo/seoHead.js` and `src/seo/metadataGenerator.js`. Confirm the Site Name constant
   matches the current brand "Gold Ticker Live".
3. Spot-check 10 pages: `index.html`, `tracker.html`, `shops.html`, two `countries/<country>/`
   pages, two `countries/<country>/<city>/gold-prices/` pages, and three content guides.
4. Read `docs/SEO_STRATEGY.md` and `docs/SEO_CHECKLIST.md`.
5. Run `npm run seo-audit` and read `reports/seo-audit.md` to see current gaps.

WORK
- Title tags: unique per page, ≤ 60 chars where possible, brand suffix `| Gold Ticker Live`.
- Meta descriptions: unique per page, 140–160 chars, clear value, no keyword stuffing.
- Canonical: every page has one. City pages canonicalize to themselves, not to the country page.
  Don't change existing canonical URLs without a migration note.
- Open Graph + Twitter cards: every public page has `og:title`, `og:description`, `og:url`,
  `og:image`, `og:locale`, `og:locale:alternate`. Twitter cards mirror them.
- JSON-LD: WebSite + Organization on home; BreadcrumbList on country/city pages; FAQ where the
  page actually has a Q&A section. No schema on pages without the supporting content.
- Internal linking: every country page links to its cities and to the calculator + methodology;
  every city page links back to its country and to the tracker. Use descriptive anchor text.
- Headings: one `<h1>` per page, semantic order, no skipped levels.
- Bilingual: `hreflang` for `en` and `ar` plus `x-default` on all top-level pages.
- Sitemap: every public route from `countries/**`, `content/**`, top-level pages is included with
  `<lastmod>`. No 404s. No noindex pages in the sitemap.

CONSTRAINTS
- Do not change canonical URLs of existing pages without explicitly documenting the redirect
  story.
- Do not weaken `robots.txt` (keep `/admin/` and `/api/` disallowed).
- Don't introduce SEO copy that misrepresents the data (e.g. "official retail price").

VERIFY
- `npm run seo-audit`
- `npm run validate` (runs check-seo-meta + check-sw-coverage + inject-schema --check)
- `npm run check-links` (or `npm run linkcheck` for full URL audit)
- `npm test` if SEO-touching tests exist
- Manual: paste 5 sample URLs into a Twitter/Facebook card validator if possible.

DELIVERABLE
PR with commits grouped by area (titles/descriptions, canonical, OG/Twitter, JSON-LD, sitemap,
internal links). Update `docs/SEO_CHECKLIST.md` with what's now green. Note any pages
intentionally left non-indexed.
```

---

## Prompt 4 — Shops Directory Upgrade

```text
You are improving the Gold Ticker Live shops directory (`shops.html` + supporting modules under
`src/pages/shops*.js` if present, plus `data/shops*.json` and the admin shop manager under
`server/lib/admin/shop-manager.js`). The directory should feel premium, useful, and honest about
what it is — an informational listing, not a marketplace.

GOAL
Rebuild the shops experience so users can find verified gold shops by city, filter sensibly, see
trustworthy details, and clearly understand what data is and isn't shown. Prepare for future
monetization (sponsored placements) without compromising trust today.

INSPECT FIRST
1. Read `shops.html` and any module that hydrates it (search, filters, modal, list/map toggle).
2. Read all relevant JSON in `data/` (shop list, normalization output from
   `scripts/node/normalize-shops.js`).
3. Read `server/lib/admin/shop-manager.js`, `server/repositories/shops.repository.js`, and the
   admin UI under `admin/` that edits shops.
4. Read translations keys for `shops.*`.
5. Inspect city/country pages to see how shops are surfaced contextually.

WORK
- Filter UX: city / district / specialty / open-now (if data supports). Filters must work on
  360px width with sticky filter bar that doesn't overlap the list.
- Shop card: name, area, hours (if known), specialty tags, distance hint where applicable, clear
  "info only — verify before visiting" footnote.
- Shop modal / detail panel: full address, phone (use `safeTel`), website (use `safeHref`), map
  link (Apple Maps + Google Maps), opening hours table, methodology disclaimer.
- Trust signals: explicit "listed for information; we do not vouch for retail prices" line, plus
  link to methodology. Surface verification status if the data carries it.
- Empty state: "No shops match your filters yet — try clearing one filter, or browse by city."
- City pages: each city auto-shows its top N shops with a clear link to the full directory.
- Mobile: list view first, map secondary (lazy-loaded). No giant map blocking content.
- Future monetization hook (no implementation): leave a clearly named slot in markup for
  `data-shop-placement="sponsored"` so a future owner-approved feature can light it up.
  Do not enable any sponsored slot in this PR.

CONSTRAINTS
- Never present unverified data as endorsed. No fake reviews, no fake ratings.
- Don't change the shop schema in `data/shops*.json` without updating the admin manager and the
  normalization script in lockstep.
- DOM-safety: phone / website / map links must go through `safeTel` / `safeHref`.
- Bilingual EN + AR for every label.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: filter by city, open a shop modal, use phone link on mobile (verify `tel:`), confirm
  RTL alignment.
- Run `node scripts/node/normalize-shops.js` and confirm the output is unchanged unless you
  intentionally evolved the schema.

DELIVERABLE
PR with focused commits (markup, filters, modal, mobile, trust copy, tests). Document any new
data fields in `docs/EDIT_GUIDE.md`.
```

---

## Prompt 5 — Calculator and Tools Upgrade

```text
You are improving the Gold Ticker Live calculator (`calculator.html`) and the helper tools under
`content/tools/` (weight converter, investment-return, zakat-calculator). These pages turn
casual visitors into return users — they need to feel fast, accurate, and honest about
estimates vs. retail prices.

GOAL
Polish the calculator UX, gold weight conversions, AED/USD clarity, karat selection, buy/sell
spread disclaimer, save/share/export features, and full mobile usability.

INSPECT FIRST
1. Read `calculator.html` and the JS module that hydrates it.
2. Read `src/lib/price-calculator.js`, `src/lib/formatter.js`, and `src/config/karats.js` for
   purity values and the canonical formula `price_per_gram = (XAU/USD ÷ 31.1035) × purity × FX`.
3. Read `content/tools/weight-converter.html`, `content/tools/zakat-calculator.html`, and
   `content/tools/investment-return.html`.
4. Read translations for `calc.*`, `tools.*`.
5. Read `src/lib/export.js` (CSV/JSON download helpers) and `src/social/postTemplates.js` (share).

WORK
- Inputs: weight, unit (g, oz, tola, baht, mithqal), karat, currency, country premium toggle.
  All inputs use semantic `<label>` + `aria-describedby` help text.
- Output: clear estimate value, "before retail premiums + making charges" footnote, link to
  methodology, freshness pill matching the home/tracker style.
- Buy/sell spread disclaimer: short, human, never alarmist. Link to a methodology section that
  explains what spread is and why retail differs.
- Share + export: copy to clipboard, generate a tweet-ready string via `postTemplates.js`,
  download CSV via `src/lib/export.js`. Filenames use `isoTimestamp()`.
- Mobile: numeric inputs trigger numeric keyboards (`inputmode="decimal"`). No layout breaks at
  320px–414px. Submit/recalc button is large and reachable.
- Errors: invalid weight, missing currency, etc. show inline messages, not console noise.
- Auxiliary tools (weight converter, zakat, investment-return): same shell, same trust footnote,
  consistent buttons.

CONSTRAINTS
- DO NOT change the price formula, AED peg constant, troy-ounce constant, or karat purity table.
  If a bug is found, document it in a separate issue/PR.
- DOM-safety baseline: 0 sinks. Use `el()` / `replaceChildren()`.
- Every user-visible string ships in EN + AR.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: enter realistic weights for 18K / 21K / 22K / 24K, switch units, switch country, switch
  language. Verify the export CSV opens cleanly in a spreadsheet.

DELIVERABLE
PR with commits split by tool. Update `docs/methodology.md` (or `methodology.html`) if you
clarify any wording about premiums or spread.
```

---

## Prompt 6 — Data Reliability and Methodology

```text
You are improving the Gold Ticker Live data layer and the user-facing methodology copy. The
goal is unambiguous trust: every number must be traceable to a labeled source, a timestamp, and
a clear estimate disclaimer.

INSPECT FIRST
1. Read `src/lib/api.js`, `src/lib/cache.js`, `src/lib/price-calculator.js`,
   `src/lib/formatter.js`, `src/config/constants.js`.
2. Read `data/gold_price.json` shape and the workflow that populates it (likely a GitHub Action
   under `.github/workflows/`).
3. Read `methodology.html` and any methodology copy in translations.
4. Read `scripts/node/price-spike-alert.js` and `scripts/node/uptime-check.js` to understand
   alerting on the data side.

WORK
- API adapter: a single, well-named adapter per source. Each adapter returns
  `{ value, currency, timestamp, source, confidence }`. No silent fallbacks without labeling.
- Caching: in-memory + localStorage with explicit TTL constants in `src/config/constants.js`.
  Stale reads are returned with a `stale: true` flag and a `staleSince` timestamp; the UI must
  display this state, not hide it.
- Validation: numeric range guards (e.g. spot must be within sane bounds; reject negative or
  zero). On rejection, fall back to last good cached value and label it.
- Timestamps: always render with `Intl.DateTimeFormat` honoring user locale + the freshness
  thresholds documented in `docs/tracker-state.md`.
- Methodology page: explain XAU/USD spot, the AED fixed peg (3.6725), troy-ounce constant
  (31.1035 g), karat purity table, what's a spot estimate vs. a retail price, and why the
  numbers may differ from a jeweler. Use plain language. No marketing fluff.
- User trust copy: "Reference price derived from XAU/USD. Before retail premiums and making
  charges. May differ from shop prices." (and the AR mirror).

CONSTRAINTS
- DO NOT change the actual formulas, constants, or freshness thresholds without owner approval
  and a documented migration.
- Do not introduce new data sources without an explicit plan entry.
- Avoid alarming language; the goal is calm honesty.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: simulate API failure (block the host in devtools) and confirm the UI shows cached +
  stale states with timestamps.
- Run `npm run seo-audit` to confirm methodology metadata is complete.

DELIVERABLE
PR with commits split (adapter / cache / validation / methodology copy / tests). Update
`docs/methodology.html`-related docs in `docs/`.
```

---

## Prompt 7 — Performance and Accessibility Audit

```text
You are running a performance + accessibility pass on Gold Ticker Live. The site is static and
intentionally lightweight. The goal is to keep it that way while removing the small papercuts
that add up.

INSPECT FIRST
1. Read `vite.config.js`, the service worker (`sw.js`), `_headers`, `_redirects`.
2. Read `tests/sw-exclusions.test.js` to understand what must NOT be cached (admin, api).
3. Skim `styles/global.css` for unused selectors (use `npm run quality` output as a hint).
4. Read `docs/PERFORMANCE.md`, `docs/ACCESSIBILITY.md`.
5. Run `npm run image-audit` and `npm run perf:ci` to get a baseline.
6. Open the home page and tracker in a Lighthouse run; capture LCP, CLS, INP.

WORK — performance
- Reduce CLS: every `<img>` has explicit `width` + `height` (or aspect-ratio). Cards reserve
  space for placeholder text so async hydration doesn't shift layout.
- Lazy-load images and heavy embeds with `loading="lazy"` and `decoding="async"`.
- Avoid blocking scripts; defer or `type="module"` everywhere it's safe.
- Service worker: don't cache `/admin/*`, `/api/*`, or any HTML that depends on auth. Verify
  `tests/sw-exclusions.test.js` still passes.
- Eliminate duplicate CSS rules; collapse equivalent variants into one primitive.

WORK — accessibility
- Focus states: visible 2-3px outline using `--color-focus-ring` on every interactive element.
- ARIA: `aria-live="polite"` on the live price region only; don't sprinkle `aria-*` on static
  content.
- Labels: every input has a `<label for>` or `aria-label`; every button has an accessible name.
- Heading order: one `<h1>` per page, no skipped levels.
- Contrast: only use tokens; no hand-picked low-contrast text on the surface tokens.
- Keyboard: tab through the homepage and tracker — every interactive element is reachable in a
  sensible order, drawer closes on `Escape`.
- Reduced motion: every transition / animation respects `prefers-reduced-motion: reduce`.

CONSTRAINTS
- No new dependencies. No CSS framework migration.
- Don't disable the service worker; modify behavior with tests.
- Don't change the HTML structure of indexed pages in ways that break canonical URLs.

VERIFY
- `npm run validate`, `npm test`, `npm run quality`, `npm run build`, `npm run image-audit`.
- `npm run a11y` (pa11y-ci) if it's wired up for the touched routes.
- `npm run perf:ci` for a perf delta. Attach the before/after numbers in the PR body.

DELIVERABLE
PR with commits (CLS, lazy-load, SW, focus, ARIA, contrast, motion, tests). Update
`docs/PERFORMANCE.md` and `docs/ACCESSIBILITY.md` with the new baseline.
```

---

## Prompt 8 — Arabic / RTL Quality Pass

```text
You are running a translation + RTL pass on Gold Ticker Live. Arabic is a first-class language
on this site, not an afterthought. Bilingual parity is enforced by tests
(`tests/translations.test.js`), but quality of wording is your job.

INSPECT FIRST
1. Read `src/config/translations.js` — every key has an EN value and an AR value. Note any
   AR strings that read like literal English calques.
2. Read `tracker.html`, `index.html`, `shops.html`, `calculator.html` and verify the page-level
   `lang` and `dir` switching helpers in `src/lib/i18n.js` (or equivalent).
3. Read `styles/global.css` for `[dir="rtl"]` overrides; note any layout that mirrors arrows /
   chevrons via CSS.
4. Read `docs/SEO_STRATEGY.md` for Arabic SEO conventions used here.

WORK
- Fix Arabic copy that sounds machine-translated. Use clear modern Arabic suitable for UAE/GCC
  readers. Keep financial terminology consistent (سعر مرجعي, مصدر السعر, آخر تحديث, تقديري,
  المصنعية, الضريبة, الهامش).
- Mirror visual elements that have direction: arrows, chevrons, progress bars, before/after
  pseudo-elements.
- Check numerals: prefer Western digits (1, 2, 3) for prices in this market context unless the
  product explicitly opts into Arabic-Indic digits — keep whatever the rest of the site uses,
  consistently.
- Date / time formatting: use locale-aware `Intl.DateTimeFormat('ar-AE', …)` so the AR view
  reads naturally.
- Page metadata: `<html lang="ar" dir="rtl">` is set on AR-served pages or via the lang toggle
  (`?lang=ar`). `og:locale:alternate` + `hreflang` are present on every public page.
- Navigation drawer / language toggle: clearly labeled in both languages.
- Tracker freshness states: AR copy must be just as scannable as EN ("مباشر", "متأخر",
  "مخزن مؤقتاً", "قديم").

CONSTRAINTS
- Don't add any English-only string anywhere a user can see.
- Don't break the EN parity tests; every key changed in AR must still have its EN counterpart.
- Don't restructure RTL via inline styles; use the `[dir="rtl"]` cascade in `styles/global.css`.

VERIFY
- `npm run validate` (translation parity is checked here)
- `npm test`
- Manual: load `?lang=ar` on home, tracker, calculator, shops, a country page, a content guide.
  Read each page out loud — anything that sounds awkward gets rewritten.

DELIVERABLE
PR with commits split (translations / RTL CSS / mirrored components / tests). List in the PR
body any AR phrases you intentionally rewrote and why.
```

---

## Prompt 9 — Repo Cleanup and Architecture

```text
You are running a repo-cleanup pass on Gold Ticker Live. The goal is to remove duplication,
centralize tokens, simplify scripts, and document architecture — without breaking any existing
behavior.

INSPECT FIRST
1. Read `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/REVAMP_PLAN.md`, `docs/CONTRIBUTING.md`.
2. List every file under `src/`, `scripts/node/`, `scripts/python/`, `server/`. Note duplicates,
   near-duplicates, and dead code (`reports/cleanup-audit/depcheck.json` is a hint).
3. Read `styles/global.css` and `styles/pages/*.css`. Note token reuse vs. hand-picked values.
4. Read `package.json` scripts. Note scripts that overlap (e.g. multiple sitemap or check
   helpers).

WORK
- Centralize design tokens in `styles/global.css`. Replace hand-picked colors / radii / spacings
  in `styles/pages/*.css` with the canonical tokens.
- Consolidate near-duplicate components. Document the canonical version in
  `docs/ARCHITECTURE.md` or `docs/DESIGN_TOKENS.md`.
- Move stray constants into `src/config/constants.js`. No magic numbers in component files.
- Simplify scripts: if two scripts in `scripts/node/` do the same thing, keep one and delete the
  other (with a note in `CHANGELOG.md`).
- Archive truly-dead files. If a file is referenced nowhere, move it to a clearly named
  `scripts/archive/` or delete it; record the deletion in `CHANGELOG.md`.
- Update `docs/ARCHITECTURE.md` with the current folder map and the responsibilities of each
  major module.
- Re-validate the DOM-safety baseline (`scripts/node/check-unsafe-dom.js`); the goal is 0 sinks
  staying at 0.

CONSTRAINTS
- DO NOT delete a file without grepping every reference to it. If it's referenced, refactor
  references first.
- DO NOT rename `countries/**/gold-prices/` URL paths — they're indexed.
- DO NOT change `BASE_PATH` in `src/config/constants.js` or `vite.config.js` `base`.
- DO NOT introduce a build framework or runtime dependency.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- `node scripts/node/check-unsafe-dom.js`
- `npm run check-links` to confirm nothing was accidentally orphaned.
- Manual: open the site after build; navigate every top-level page, the tracker, calculator,
  shops, and a country page — confirm no visual regressions.

DELIVERABLE
PR with commits split per cleanup area (tokens / components / constants / scripts / docs).
Update `docs/ARCHITECTURE.md` and `CHANGELOG.md`. Note in the PR body anything you opted not to
remove and why.
```

---

## Prompt 10 — Monetization and Growth

```text
You are preparing Gold Ticker Live for sustainable monetization and audience growth — without
making the product feel like a spam SEO site. AdSense slot config already exists in
`src/config/constants.js` (`AD_CONFIG`), the X-post automation runs hourly via
`.github/workflows/post_gold.yml`, and a newsletter scaffold exists under
`server/routes/newsletter.js` and `scripts/node/generate-newsletter.js`.

GOAL
Add ad slots cleanly, refine newsletter / alerts, polish X automation, build a clear lead-capture
flow, and set up product-meaningful analytics events. Everything must respect the trust
guardrails — no fake live data, no fake testimonials, no dark patterns.

INSPECT FIRST
1. Read `src/config/constants.js` (`AD_CONFIG`, `FORMSPREE_ENDPOINT`).
2. Read `scripts/node/generate-newsletter.js`, `scripts/node/send-newsletter.js`,
   `scripts/node/tweet-gold-price.js`, `scripts/node/notify-discord.js`,
   `scripts/node/notify-telegram.js`, `scripts/node/price-spike-alert.js`.
3. Read `.github/workflows/post_gold.yml` and any newsletter / spike workflows.
4. Read `assets/analytics.js`. Confirm what events are already tracked.
5. Read `content/social/x-post-generator.html` and `src/social/postTemplates.js`.

WORK — ads
- Wire up ad slots only where layout reserves the space (no CLS spikes). Use the slot IDs from
  `AD_CONFIG`. Hide ads silently if the publisher ID is empty.
- Don't place ads above the live-price card on the home or tracker. The first paint must be
  product, not ad.

WORK — newsletter / alerts
- Strengthen the welcome email copy in `server/routes/newsletter.js` (Gold Ticker Live brand,
  clear unsubscribe, expectation of cadence).
- Add a "Notify me" alert flow on the tracker (uses existing `gold_price_alerts` localStorage
  key from `src/config/constants.js`). Persist threshold + direction.
- Newsletter generator: include freshness, top-of-mind country prices, link to methodology, and
  a short "what changed today" summary.

WORK — X / Twitter automation
- Polish the post template in `src/social/postTemplates.js`: clear headline, AED + USD per gram
  for 24K and 22K, source label, link to tracker, no emoji spam.
- Workflow safety: re-read `.github/workflows/post_gold.yml`. Don't break the import path for
  `scripts/python/utils/*`. Don't echo secrets.

WORK — content / SEO growth
- Add internal links from each city page to the calculator + methodology + a relevant guide.
- Sketch a content backlog (titles + outlines only) in
  `docs/plans/YYYY-MM-DD_content-backlog.md`. No filler articles in the same PR.

WORK — analytics
- Use named events: `tracker_view`, `karat_change`, `country_change`, `calculator_use`,
  `share_click`, `alert_set`, `newsletter_subscribe`. Standardize names across the codebase.

CONSTRAINTS
- Don't fake data. No fabricated reviews, testimonials, news.
- Don't degrade trust to chase clicks. Every monetization surface must be honest.
- Don't enable a feature this PR doesn't fully implement; leave a slot if needed.

VERIFY
- `npm run validate`, `npm test`, `npm run build`.
- Manual: subscribe to the newsletter (with a dev Formspree endpoint), set an alert in the
  tracker, generate a tweet via the social tool, walk through the home → tracker → calculator
  funnel and confirm the analytics events fire.

DELIVERABLE
PR with commits split by area (ads / newsletter / alerts / X / analytics). Update
`docs/AUTOMATIONS.md` and `docs/REVAMP_PLAN.md`. Note any owner-only steps (Formspree key,
AdSense IDs, X API tokens).
```

---

## Prompt 11 — Safe Large-PR Execution

```text
You are running a large multi-area change on Gold Ticker Live. The risk with big PRs is breakage
and unreviewable diffs. Your job is to ship the same scope of work via a single PR with a
clean, sequenced commit history that a reviewer can read top-to-bottom.

GROUND RULES
1. Open a draft PR after the first commit. Push frequently.
2. Each commit covers exactly one bucket. Suggested buckets, in order:
   - `chore: scaffold plan + checklist in docs/plans/`
   - `style: tokens + design-token consolidation in styles/global.css`
   - `feat: shared components / nav / footer updates`
   - `feat: home + hero polish`
   - `feat: tracker freshness + states`
   - `feat: calculator + tools UX`
   - `feat: shops directory polish`
   - `feat: country/city pages`
   - `chore: SEO metadata + JSON-LD + sitemap`
   - `perf: lazy-load + CLS + image-audit`
   - `a11y: focus + ARIA + reduced-motion`
   - `i18n: AR copy + RTL fixes`
   - `chore: docs (REVAMP_PLAN, ARCHITECTURE, CHANGELOG)`
   - `test: regression coverage`
   - `chore: cleanup + dead-code removal`
3. Never bundle unrelated changes into a single commit. If a fix is genuinely unrelated, ship it
   in a separate small PR.
4. Don't force-push the PR branch once the draft PR is open. Append commits.
5. Run `npm run validate` before each push. If it fails, fix forward.
6. After every 3–4 commits, write a short progress note in the PR description with a checklist.

GUARDRAILS (non-negotiable)
- No price-math changes.
- No `BASE_PATH` / `vite.config.js` `base` / `CNAME` / SW scope changes.
- No new framework, no new heavy dependency.
- No deleting `countries/**/gold-prices/` URL paths.
- DOM-safety baseline must not regress (run `node scripts/node/check-unsafe-dom.js`).
- Bilingual EN + AR for every user-visible string.

VERIFY (per push)
- `npm run validate`
- `npm test`
- `npm run quality`
- `npm run build`
- Spot-check the touched surface in browser if applicable.

VERIFY (final)
- All four of the above plus `npm run check-links` and `npm run seo-audit`.
- Manual desktop + mobile (360px) walkthrough of every touched surface, EN + AR.
- Update `docs/REVAMP_PLAN.md` and `CHANGELOG.md` with the shipped scope.

OUTPUT
The PR body must list, by bucket, what changed and what you verified. If a bucket was deferred,
say so explicitly with a one-line reason. Do not claim verification you didn't run.
```

---

## Prompt 12 — Rebrand Maintenance Prompt

```text
You are running a rebrand-consistency sweep on Gold Ticker Live. The product was renamed from
"Gold Prices" / "GoldPrices" to "Gold Ticker Live" (compact form: "GTL"). The repo lives at
`vctb12/Gold-Prices` and ships from `main` to the custom domain `goldtickerlive.com`. Some
references to the old name MUST stay (URL paths, deployment base path, historical changelog
entries). Your job is to confirm the public brand reads consistently as "Gold Ticker Live"
everywhere it should, and to document the references that intentionally remain.

INSPECT FIRST
1. Read `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md` (the migration log) so you know what's
   intentionally unchanged.
2. Read `manifest.json`, `index.html`, `tracker.html`, `shops.html`, `calculator.html`,
   `learn.html`, `insights.html`, `methodology.html`, `invest.html`, `offline.html`, `404.html`.
3. Read `src/seo/metadataGenerator.js`, `src/seo/seoHead.js`, `src/components/internalLinks.js`.
4. Read `src/config/translations.js`.
5. Read `src/social/postTemplates.js`, `scripts/node/tweet-gold-price.js`,
   `scripts/node/notify-*.js`, `scripts/node/generate-rss.js`,
   `scripts/node/uptime-check.js`, `scripts/node/price-spike-alert.js`,
   `scripts/node/generate-newsletter.js`, `scripts/node/send-newsletter.js`,
   `server/routes/newsletter.js`, `server.js`.

GREP CHECKS
Run these searches and review every hit against `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`:

- `git grep -nI "GoldPrices"` (one-word brand token — should be zero on public surfaces)
- `git grep -nI "Gold Prices"` (review hits; topic phrases like "How Gold Prices Work" are OK,
  brand-as-product mentions are not)
- `git grep -nI "Gold-Prices"` (URL/path; mostly intentional under `BASE_PATH` and historical
  docs)
- `git grep -nI "gold-prices"` (lowercase URL slug; intentional under `countries/**/gold-prices/`)
- `git grep -nI "Gold Price Tracker"` (legacy product name; should be zero on public surfaces)

DECISION RULES
- If a hit is **brand-as-product** (page title, OG title, footer brand, app name, X bot
  username, RSS feed title, manifest name), rewrite to "Gold Ticker Live" (or "GTL" only when
  space is genuinely tight).
- If a hit is a **descriptive topic phrase** ("Why UAE Gold Prices Differ from Global Spot",
  "How Gold Prices Work"), leave it. Add an inline comment if the next reader might wonder.
- If a hit is a **URL / route segment** (`/Gold-Prices/`, `countries/**/gold-prices/`,
  `BASE_PATH`), DO NOT change it. Confirm it's listed in
  `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`. If it's not, add it.
- If a hit is in **historical changelog / commit messages**, leave it.
- If a hit is in `localStorage` cache keys or service-worker cache version names, decide based
  on backward compatibility. Don't force a key migration that would silently nuke users' saved
  settings; bump the SW cache version (e.g. `goldtickerlive-vN+1`) instead.

ACTION
- Update what should change.
- For anything you intentionally leave, append a row to the table in
  `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md` explaining why.

VERIFY
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run build`
- Final grep sweep listed above. The PR body must show the grep counts before and after.

DELIVERABLE
A small focused PR titled "chore: rebrand consistency sweep". The PR body lists the file count
touched, the grep deltas, and the entries you added to `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`.
```

---

## Appendix — Repo-Specific Reminders

These reminders apply to every prompt above; they are baked into the prompts but listed here for
quick reference:

- **Brand:** "Gold Ticker Live" (compact: "GTL"). Domain: `goldtickerlive.com`.
- **Architecture:** static multi-page, vanilla ES modules, no framework.
- **Tokens:** `styles/global.css` (`--color-*`, `--surface-*`, `--space-*`, `--text-*`,
  `--radius-*`, `--shadow-*`, `--ease-*`, `--duration-*`). Don't hand-pick.
- **Strings:** every user-visible string in `src/config/translations.js`. EN + AR parity is enforced
  by `npm run validate`.
- **Money math:** `price_per_gram = (XAU/USD ÷ 31.1035) × purity × FX`; AED uses the fixed peg
  3.6725. These are **do-not-touch** unless explicitly asked.
- **DOM safety:** use `el()` / `replaceChildren()` from `src/lib/safe-dom.js`. The baseline is 0
  sinks in `src/tracker/render.js`; `npm run validate` blocks regressions.
- **Service worker:** `sw.js` excludes `/admin/*` and `/api/*`. `tests/sw-exclusions.test.js`
  enforces it.
- **Deployment:** `main` → GitHub Pages on `goldtickerlive.com` (custom domain). The repo also works
  under `/Gold-Prices/` if the GitHub project path is ever used as a fallback — keep `BASE_PATH`
  flexibility in `src/config/constants.js`.
- **Verification commands you can rely on:** `npm run validate`, `npm test`, `npm run lint`,
  `npm run quality`, `npm run build`, `npm run seo-audit`, `npm run check-links`,
  `npm run image-audit`, `npm run pre-deploy`.
- **Hourly automation:** `.github/workflows/post_gold.yml` is production. Don't break the
  `scripts/python/utils/*` import layout, don't echo secrets.

If a future agent reads only one section of this file, it should be the **Appendix** and **Prompt 11
— Safe Large-PR Execution**.
