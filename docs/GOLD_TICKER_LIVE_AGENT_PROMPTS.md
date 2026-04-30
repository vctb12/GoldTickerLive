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

## Prompt 13 — Homepage Hero and Above-the-Fold Pass

```text
You are upgrading the homepage hero and above-the-fold experience on Gold Ticker Live. The home
page is the single biggest first-impression surface — the average visitor decides in under 5
seconds whether the site is trustworthy. The hero must answer: what is this, is it live, what
should I do next.

INSPECT FIRST
1. Read `index.html` end-to-end. Note every section in DOM order: hero, freshness pill,
   `#hlc-updated`, karat strip (`#karat-strip`, `#karat-strip-updated`), `#country-search`,
   `.country-tiles`, hero CTAs.
2. Read `src/pages/home.js` — focus on `renderHeroCard`, `renderKaratStrip`,
   `startFreshnessTimer` (ticks every 10s, sets `data-freshness-key` on `#hlc-updated` and
   `#karat-strip-updated`), `initCountrySearch` (`#country-search` input, `.country-tile--filtered`
   class, ArrowDown/Up/Escape keyboard nav), `KARAT_STRIP_UNIT_MULT`, `karatStripUnit`
   localStorage in `user_prefs`.
3. Read `styles/pages/home.css` — hero card, freshness pill `::before` pseudo-elements
   (⚠/✕ for stale/unavailable, color-blind accessible), `.country-search-input`,
   `.country-search-empty`, `.kstrip-unit-toggle`.
4. Read `src/lib/live-status.js` — `STALE_AFTER_MS = 12 * 60 * 1000`, freshness states
   `live | cached | stale | unavailable`.
5. Read translations `home.*`, `home.karatStripLabelGram/Tola/Oz`, `gold.freshness.label`,
   `gold.badge`, `aed.badge` in `src/config/translations.js`.

WORK — hero
- Make the hero answer in one glance: "Live UAE & GCC gold prices, derived from XAU/USD spot."
  No corporate fluff, no hype, no "best price guaranteed" wording.
- The freshness pill (`#hlc-updated`) must be visible above the fold on 360px width. Use the
  existing `data-freshness-key` states (`live`, `cached`, `stale`, `unavailable`) and the
  CSS `::before` icons. Do not move the threshold (12 min) without owner approval.
- Primary CTA → tracker. Secondary CTA → calculator. Tertiary text link → methodology.
  All three labels live in translations.
- The hero AED + USD price card must surface its source line (e.g. "Spot · derived from
  XAU/USD · AED at 3.6725 peg").

WORK — karat strip
- Verify the unit toggle (g / tola / oz) persists via `karatStripUnit` in `user_prefs`
  localStorage. Default is grams. Active state is unambiguous.
- Each karat row has a copy button that copies "X g 24K = AED Y · GoldTickerLive" (use
  the existing handler; do not invent a new format).
- Karat rows align cleanly at 360px — no overflow, no truncated numerals.

WORK — country search
- `#country-search` filters `.country-tiles` via `.country-tile--filtered`. Verify
  ArrowDown/Up/Escape keyboard navigation still works and `applyLangToPage()` covers AR.
- Empty state (`.country-search-empty`) reads naturally in EN + AR with the typed query.
- Tap-target on each country tile ≥ 44×44 px on mobile.

WORK — freshness timer hygiene
- Confirm the 10s tick in `startFreshnessTimer` only writes when the rendered string
  changes (avoid layout thrash and aria-live spam).
- `aria-live="polite"` only on the freshness pill region — not on the price numerals.

CONSTRAINTS
- Do not change `STALE_AFTER_MS`, `AED_PEG`, or `GOLD_REFRESH_MS`.
- Do not change the karat purity table, the troy-ounce constant, or `KARAT_STRIP_UNIT_MULT`.
- Every user-visible string EN + AR via `src/config/translations.js`.
- Do not introduce a new freshness state name without updating
  `src/lib/live-status.js`, the CSS selectors keyed on `data-freshness-key`, and tests.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: throttle the network and confirm cached / stale / unavailable pills render.
- Manual: tab through the hero — every interactive element is reachable and labeled.
- Manual: 360px and 1440px in EN + AR; copy a karat row in each language.

DELIVERABLE
PR with focused commits (hero, freshness pill, karat strip, country search, RTL, tests).
Update `docs/tracker-state.md` if you clarified any freshness copy.
```

---

## Prompt 14 — Country & City Pages Deep Dive

```text
You are upgrading the country and city pages — the SEO long-tail and the second-largest
surface in the repo. Pages live under `countries/<country>/` (top-level country page),
`countries/<country>/<city>/gold-prices/` (city pages), and karat-specific pages where they
exist. JSON-LD is injected by `scripts/node/inject-schema.js` (NOT idempotent — running build
twice will produce diff noise; commit a clean state).

INSPECT FIRST
1. List every directory under `countries/`. Note which countries have city sub-pages
   (e.g. `countries/uae/dubai/gold-prices/`) and which only have a country-level page.
2. Read `countries/country-page.js` (the shared page hydrator) and `countries/index.html`
   (the country index landing page).
3. Read `scripts/node/inject-schema.js` — note that `fs.writeFileSync` modifies source HTML
   directly (line ~377). Confirm it adds BreadcrumbList for country/city pages and check the
   `--check` flag used by `npm run validate`.
4. Read `src/components/breadcrumbs.js` and `src/components/internalLinks.js`.
5. Read `scripts/node/check-sitemap-coverage.js` so you understand which routes must appear
   in the sitemap and which are intentionally excluded.

WORK — content
- Country page: short city-aware intro (1–2 sentences in EN + AR), live price card for the
  country's primary currency, karat table, list of cities with strong anchor text
  ("Gold prices in <city>"), link to the calculator pre-filled with that country's currency,
  link to methodology, link back to the country index.
- City page: 1-paragraph intro that names the city, market hub if relevant (e.g. Gold Souk
  for Dubai), live karat-by-karat table, top N shops in that city pulled from
  `data/shops*.json`, breadcrumb (Home → Country → City), link back to the country page.
- Karat-specific pages (where present): pure topical pages — explain the karat, show the
  current karat-specific price for the relevant country, link to comparison guides.

WORK — schema
- BreadcrumbList JSON-LD on every country and city page, generated by `inject-schema.js`.
- `Place` or `LocalBusiness` schema on city pages only when shop data is actually present.
- Run `node scripts/node/inject-schema.js` once; commit the resulting HTML diff in a
  separate commit titled "chore: refresh injected JSON-LD".

WORK — internal linking & breadcrumbs
- Every country page must link to all of its cities. Every city page must link back to its
  country and to ≥ 1 sibling city. Use descriptive anchors, not "click here".
- Breadcrumbs render via `src/components/breadcrumbs.js` and are mirrored in BreadcrumbList
  JSON-LD. RTL parity required.

WORK — bilingual & SEO
- Each country/city page has unique `<title>` and `<meta name="description">`. Title pattern:
  "Gold Prices in <City>, <Country> Today | Gold Ticker Live". Description ≤ 160 chars.
- `hreflang` for `en` and `ar` plus `x-default`. Canonical points to self, never to the parent.

CONSTRAINTS
- Do NOT rename or remove any `countries/**/gold-prices/` URL path — they are indexed.
- Do NOT change the canonical URL of any existing country/city page; if you find a bug,
  document it in a separate plan.
- `inject-schema.js` is not idempotent — keep its commit isolated to avoid diff noise.
- Bilingual EN + AR for every user-visible string; AR copy must read naturally for GCC users.

VERIFY
- `npm run validate` (sitemap coverage, SEO meta, schema check).
- `npm run check-links` and `npm run seo-audit`.
- `npm test`.
- `npm run build` then `npm run preview`; spot-check a country page and two city pages in EN + AR.

DELIVERABLE
PR with commits split (country page polish / city page polish / breadcrumbs / schema injection /
internal links / sitemap). Update `docs/SEO_CHECKLIST.md` with newly green pages.
```

---

## Prompt 15 — Content Guide Library

```text
You are upgrading the content guide library — the long-form SEO + trust layer of Gold Ticker
Live. Guides live under `content/guides/*.html`, `content/22k-gold-price-guide/`,
`content/24k-gold-price-guide/`, `content/spot-vs-retail-gold-price/`,
`content/dubai-gold-rate-guide/`, `content/uae-gold-buying-guide/`,
`content/gold-making-charges-guide/`, `content/gold-price-history/`,
`content/premium-watch/`, `content/changelog/`. Each guide should read like a useful,
trust-building public-utility article — not an SEO doorway page.

INSPECT FIRST
1. List every HTML file under `content/guides/` and the named guide directories above.
2. Read `content/guides/24k-vs-22k.html`, `content/guides/aed-peg-explained.html`,
   `content/guides/gold-karat-comparison.html`, `content/guides/buying-guide.html`,
   `content/guides/zakat-gold-guide.html`, `content/guides/invest-in-gold-gcc.html`,
   `content/guides/gcc-market-hours.html`. Note thin sections, weak intros, missing FAQ,
   missing internal links.
3. Read `content/22k-gold-price-guide/index.html` and the parallel 24K guide. Compare structure
   for consistency (they're linked from `nav-data.js` Prices → Comparison section).
4. Read `content/spot-vs-retail-gold-price/index.html` — the trust-cornerstone explainer.
5. Read `content/dubai-gold-rate-guide/index.html` and `content/uae-gold-buying-guide/index.html`.
6. Read `content/gold-making-charges-guide/index.html` and `content/gold-price-history/index.html`.

WORK — structure
- Each guide: H1, meta description, 1-paragraph TL;DR, 4–8 H2 sections, a "Key takeaways"
  list, an FAQ (3–6 Q&As), a "Related" block linking to ≥ 3 other guides + the calculator
  + the methodology page. Last-updated date visible at the top.
- 22K vs 24K guide pair must read consistently — same section order, same comparison table
  shape, same anchor IDs where relevant.
- "Spot vs retail" guide is the trust cornerstone — link every freshness pill, every
  disclaimer, every methodology mention back to it.

WORK — copy
- No marketing fluff. No "best", no "guaranteed", no "lowest price today" unless the data
  page actually proves it.
- Every example price is captioned as illustrative ("for example") if it's hard-coded.
- Cross-link every guide to ≥ 3 others using descriptive anchor text.

WORK — schema
- FAQPage JSON-LD on guides that actually have an FAQ section (see Prompt 16).
- BreadcrumbList JSON-LD on every guide via `inject-schema.js`.
- Article schema with `datePublished` + `dateModified` if those dates are real and
  trustworthy; do not fabricate dates.

WORK — bilingual
- Every guide ships in EN + AR. Translation keys for guide-shared chrome (TL;DR, Key
  takeaways, FAQ heading, Related) live under `content.guides.*` in
  `src/config/translations.js`.

CONSTRAINTS
- Do not invent statistics, expert quotes, or testimonials.
- Do not change canonical URLs of guide pages.
- Do not introduce English-only headings on AR pages.

VERIFY
- `npm run validate`, `npm run check-links`, `npm run seo-audit`, `npm test`,
  `npm run lint`, `npm run build`.
- Manual: read one guide end-to-end in EN and one in AR; both should read naturally aloud.

DELIVERABLE
PR with commits split per guide cluster (22K/24K, spot-vs-retail, Dubai/UAE buying, making
charges, history, premium watch). Update `docs/SEO_STRATEGY.md` with the guide map.
```

---

## Prompt 16 — FAQ + Structured Data

```text
You are unifying the FAQ experience and FAQPage JSON-LD across Gold Ticker Live. The hub
FAQ lives at `content/faq/index.html`, and many guides + country pages have inline FAQ
sections. JSON-LD is injected by `scripts/node/inject-schema.js`.

INSPECT FIRST
1. Read `content/faq/index.html`. List every Q&A and group them by topic (pricing,
   methodology, shops, conversions, automation).
2. Grep all guide HTML files for inline `<h2>FAQ</h2>` or similar sections; list every page
   that has FAQ content.
3. Read `scripts/node/inject-schema.js` — find the FAQPage branch (or add one if absent)
   and the rule for including/excluding pages.
4. Read translations under `faq.*` and any per-guide FAQ keys.

WORK — content
- Hub FAQ: comprehensive, grouped by topic, anchor-linkable IDs (`#faq-pricing-1`,
  `#faq-methodology-3`). Each answer ≤ 4 sentences, plain language, EN + AR.
- Per-page inline FAQs: 3–6 questions specific to that page. No copy-paste from the hub.
- Every FAQ answer that touches money math links to `methodology.html` for context.
- Every FAQ that touches retail vs spot links to `content/spot-vs-retail-gold-price/`.

WORK — structured data
- FAQPage JSON-LD ONLY on pages whose visible content actually contains the same Q&A pairs.
  Schema-without-content is a Google penalty risk.
- The hub FAQ emits one FAQPage JSON-LD covering all questions.
- Inline FAQ sections on guide pages emit a scoped FAQPage JSON-LD with only that page's
  questions.
- Validate via `inject-schema.js --check` (the same flag `npm run validate` uses).

WORK — accessibility
- Use `<details>` / `<summary>` for collapsible Q&As, or accessible disclosure pattern with
  `aria-expanded` and keyboard support. Don't trap focus.
- Heading order: H1 page title → H2 topic group → H3 question.

CONSTRAINTS
- Do NOT add FAQPage schema to pages without visible Q&As.
- Do NOT change existing FAQ anchor IDs that may be linked from outside.
- Bilingual EN + AR.

VERIFY
- `npm run validate` (schema --check + SEO meta).
- `npm run seo-audit`.
- `npm test`.
- Manual: paste 3 sample URLs into Google's Rich Results Test if available.

DELIVERABLE
PR with commits split (hub FAQ rewrite / inline FAQ updates / schema injection / a11y).
Update `docs/SEO_CHECKLIST.md` and add a row in `docs/SEO_STRATEGY.md` listing FAQ-eligible
pages.
```

---

## Prompt 17 — Site Search

```text
You are improving the site search at `content/search/index.html`, hydrated by modules under
`src/search/`. Search is one of the highest-signal UX surfaces — when it works, users find
what they need; when it fails, they bounce.

INSPECT FIRST
1. Read `content/search/index.html` and every JS module under `src/search/`.
2. Read `src/lib/search.js` if separate from `src/search/`.
3. Read translations `search.*`. Check `nav-data.js` for the `recentSearches` label keys.
4. Read the search-trigger code in `src/components/nav.js`.
5. Note how the search index is built (likely a generated JSON of pages/guides/countries).

WORK
- Index coverage: every public page (top-level, country, city, guide, tool, shop list) has
  a record with `{ title, description, url, locale, type }`. Build script lives under
  `scripts/node/`; if missing, add one and wire it into `npm run build`.
- Query UX: debounced input (150–200ms), top-N results grouped by type (Guides, Tools,
  Countries, Cities, Shops), keyboard nav (ArrowUp/Down, Enter, Escape).
- Empty state: friendly EN + AR copy with 3 suggested links (tracker, calculator, methodology).
- Recent searches: local-only (`localStorage`), capped at 5, clearable. Use the
  `recentSearches` translation key from `nav-data.js`.
- Bilingual: when the page is in AR, search index queries AR titles/descriptions; when in
  EN, queries EN. Cross-language match is OK as a fallback.
- RTL: input alignment, result list direction, kbd hints all mirror correctly.
- A11y: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, `aria-live="polite"`
  for result count.

CONSTRAINTS
- Do NOT add a heavy search dependency (no Algolia client SDK, no Lunr if not already in
  the repo). Prefer a tiny in-memory index.
- DOM-safety: render results via `el()` / `replaceChildren()`. No `innerHTML`.
- Bilingual EN + AR for every label.

VERIFY
- `npm run validate`, `npm test`, `npm run build`.
- Manual: type 5 queries in EN, 5 in AR. Tab through results. Open one with Enter.
- DOM-safety baseline: `node scripts/node/check-unsafe-dom.js`.

DELIVERABLE
PR with commits split (index build / query UX / keyboard / RTL / tests).
```

---

## Prompt 18 — Admin Panel UX

```text
You are upgrading the admin panel UX. The admin lives under `admin/` (auth via Supabase
GitHub OAuth) with sub-areas `admin/shops/`, `admin/analytics/`, `admin/content/`,
`admin/settings/`, `admin/orders/`, `admin/access/`, `admin/pricing/`, `admin/social/`.
The admin is a private surface — never indexed, never cached by the SW.

INSPECT FIRST
1. Read `admin/index.html`, `admin/auth.js`, `admin/supabase-auth.js`,
   `admin/supabase-config.js`.
2. Read every sub-area's `index.html` and any companion JS under `admin/shared/`.
3. Read `server/lib/admin/shop-manager.js`, `server/repositories/shops.repository.js`,
   `server/lib/audit-log.js`, `server/lib/auth.js`.
4. Read `tests/sw-exclusions.test.js` to confirm `/admin/*` is excluded from the SW cache.
5. Read `robots.txt` to confirm `/admin/` is `Disallow`.

WORK — shops admin
- List view: sortable, filterable by city/specialty, paginated. Bulk-edit affordances if
  the repo supports them.
- Edit form: required-field validation, inline error messages, autosave to drafts (NOT
  publish on every keystroke). Use `atomicWriteJSON()` from `server/lib/fs-atomic.js` for
  any persistence path you change.
- Audit log surface: show recent edits per shop with timestamp + actor.

WORK — analytics
- Surface the named events from `assets/analytics.js` in a clean dashboard. No raw SQL
  pasted into the UI; aggregate sensibly.
- Empty state when no events have fired yet — say "No events in this range".

WORK — content
- List of guides + country/city pages with last-modified dates and a "view live" link.
- Edit affordances should be plan-only in this PR unless explicitly scoped.

WORK — settings
- Site settings (theme defaults, lang defaults, ad slots, formspree endpoint) in a single
  panel. Save via `atomicWriteJSON()`. Show a clear "saved at <time>" toast.

WORK — security
- Confirm `/admin/*` is excluded from the SW cache (do NOT regress
  `tests/sw-exclusions.test.js`).
- Confirm every admin route is JWT + bcrypt + Helmet protected (see `server/lib/auth.js`).
- Never echo `JWT_SECRET`, `ADMIN_PASSWORD`, or `ADMIN_ACCESS_PIN` to the client or logs.

CONSTRAINTS
- Do NOT weaken Helmet, rate-limiting, or CSRF protection.
- Do NOT add the admin to the sitemap or `robots.txt` allow list.
- Do NOT cache admin assets in the SW.
- Bilingual is OPTIONAL inside the admin (it's an internal tool). Keep one consistent
  language; document the choice.

VERIFY
- `npm test`, `npm run validate`, `npm run lint`, `npm run build`.
- Manual: log in to the admin (with required env vars set: `JWT_SECRET`,
  `ADMIN_PASSWORD`, `ADMIN_ACCESS_PIN`), edit a shop, confirm the audit log records it,
  confirm the public site reflects the change.
- Confirm `tests/sw-exclusions.test.js` passes.

DELIVERABLE
PR with commits split per admin area. Update `docs/ADMIN_GUIDE.md` and
`docs/environment-variables.md` if you added or renamed any env var.
```

---

## Prompt 19 — Newsletter & Alert System

```text
You are upgrading the newsletter and price-alert system. Newsletter lives in
`server/routes/newsletter.js`, generated by `scripts/node/generate-newsletter.js`, and sent
by `scripts/node/send-newsletter.js`. Daily/weekly cadence runs via
`.github/workflows/daily-newsletter.yml` and `.github/workflows/weekly-newsletter.yml`.
Price alerts use the `gold_price_alerts` localStorage key from `src/config/constants.js`.

INSPECT FIRST
1. Read `server/routes/newsletter.js` (subscribe endpoint, validation, persistence).
2. Read `scripts/node/generate-newsletter.js` and `scripts/node/send-newsletter.js`.
3. Read `.github/workflows/daily-newsletter.yml` and
   `.github/workflows/weekly-newsletter.yml`.
4. Read `src/config/constants.js` — `CACHE_KEYS.alerts` is `'gold_price_alerts'`.
5. Find existing alert UI (likely on tracker or home). Read translations `alerts.*` and
   `newsletter.*`.

WORK — newsletter
- Subscribe form: email validation, double-opt-in if currently single-opt, clear
  unsubscribe link in every email. Honor the cadence the user picked.
- Welcome email: brand "Gold Ticker Live", clear cadence expectation, methodology link,
  unsubscribe link.
- Daily/weekly content: top-of-mind countries' prices, freshness pill replicated as text,
  link to tracker, link to methodology, "what changed" 1-paragraph summary.
- Persist subscribers via `atomicWriteJSON()` (see Prompt 18).

WORK — price alerts
- UI on tracker: "Notify me when 24K AED/g crosses <threshold>" with direction (above/below).
- Persist alerts in `localStorage` under the `gold_price_alerts` key (already in
  `CACHE_KEYS`). Cap the number of active alerts per user (e.g. 5) with a clear message.
- Alert evaluation runs client-side on each tracker price tick. When triggered, show a
  non-blocking toast and optionally fire a `Notification` API prompt (only with
  user-explicit consent).
- Server-side delivery (email/push) is OUT of scope for this PR unless the repo already
  ships it — leave a clearly named hook only.

WORK — bilingual & a11y
- Every newsletter/alert string EN + AR. AR email subject lines must read naturally.
- Alert form is keyboard-navigable, errors are inline, and the toast respects
  `prefers-reduced-motion`.

CONSTRAINTS
- Do NOT echo `FORMSPREE_ENDPOINT` or any secret in client bundles or logs.
- Do NOT enable email delivery without owner-provided credentials.
- Bilingual EN + AR.

VERIFY
- `npm run validate`, `npm test`, `npm run build`.
- Manual: subscribe with a dev email, set an alert, confirm localStorage entry, simulate
  threshold cross by editing the cached price.

DELIVERABLE
PR with commits split (subscribe / welcome email / daily template / weekly template /
alert UI / alert evaluation / tests). Update `docs/AUTOMATIONS.md`.
```

---

## Prompt 20 — X/Twitter Automation Polish

```text
You are polishing the hourly X-post automation. The workflow is
`.github/workflows/post_gold.yml` — it runs on schedule and is LIVE in production. Python
helpers live under `scripts/python/` (utils, fetcher, poster). The post template lives in
`src/social/postTemplates.js` and `scripts/python/utils/*` provides shared formatting.

INSPECT FIRST
1. Read `.github/workflows/post_gold.yml` carefully. Note triggers, env vars, secrets,
   the `sys.path` setup that imports `scripts/python/utils/*`.
2. Read every file under `scripts/python/` (entrypoint + utils).
3. Read `src/social/postTemplates.js` and `content/social/x-post-generator.html`.
4. Read `scripts/node/tweet-gold-price.js` if Node is involved alongside Python.
5. Check secret names referenced in workflow yaml — do not echo or log them.

WORK — template
- Headline: "UAE Gold Today · 24K AED/g · 22K AED/g".
- Body: one line each for 24K and 22K (AED + USD), one line freshness ("as of HH:MM GST"),
  one line source ("XAU/USD spot · AED at fixed peg 3.6725"), tracker link.
- No emoji spam. ≤ 1 emoji if the existing template uses it.
- Hashtags: 1–3 max, relevant only (#GoldPriceUAE, #GoldPriceDubai). Do not stuff.

WORK — workflow safety
- Keep the import path layout for `scripts/python/utils/*` intact (the workflow patches
  `sys.path`).
- Do NOT echo secrets in any `run:` step. Use `${{ secrets.* }}` only inside Python via
  env-var passthrough.
- Add a dry-run flag (env or CLI) so the script can render output without posting.
  Wire CI to use the dry-run flag on PRs.
- Concurrency: `concurrency: post-gold` to prevent overlapping runs.
- Failure handling: if the price fetch fails, do NOT post a fallback or stale price —
  log and exit non-zero.

WORK — observability
- On success, log a single redacted line: timestamp + 24K AED/g (no secrets).
- On failure, set a workflow notice/error annotation so it's visible in the Actions UI.
- Keep `scripts/node/notify-discord.js` / `notify-telegram.js` integration optional (only
  fire if their respective webhooks are set).

CONSTRAINTS
- Do NOT change the post cadence without owner approval.
- Do NOT post unverified or stale data; never label estimated as "live".
- Do NOT introduce a new dependency without checking `gh-advisory-database`.

VERIFY
- Run the script locally with the dry-run flag and a test fixture.
- `npm run validate`, `npm test`, `npm run lint`.
- Open the workflow YAML in an Actions linter (yamllint) if available.

DELIVERABLE
PR with commits split (template / workflow safety / dry-run / observability). Update
`docs/AUTOMATIONS.md` and `docs/twitter_bot_architecture.md`.
```

---

## Prompt 21 — Service Worker & Offline Experience

```text
You are upgrading the service worker (`sw.js`) and the offline page (`offline.html`).
The SW must continue to exclude `/admin/*` and `/api/*` from caching (enforced by
`tests/sw-exclusions.test.js`).

INSPECT FIRST
1. Read `sw.js` end-to-end. Note `CACHE_NAME` (versioned, currently `goldtickerlive-vN`),
   the precache list, the runtime fetch handler, and the `/admin/*` + `/api/*` bypass.
2. Read `offline.html`. Note copy, branding, and any links it offers.
3. Read `tests/sw-exclusions.test.js`.
4. Read `_headers` and `_redirects` for any hosting-side cache rules.

WORK — caching strategy
- Precache: HTML shell, critical CSS, nav JS, freshness JS, fonts, logo. Keep the precache
  list small.
- Runtime cache (stale-while-revalidate): country/city HTML, guide HTML, images.
- Network-first: `/data/gold_price.json`, FX endpoints (no SW cache for prices — too risky
  for a freshness-sensitive product).
- Bypass entirely: `/admin/*`, `/api/*`, anything with `?nocache`.
- Bump `CACHE_NAME` to a new version (e.g. `goldtickerlive-vN+1`) and clean up old caches
  in the `activate` event.

WORK — offline page
- "You're offline" headline, last-cached price card if available (read from the same
  localStorage caches the live site uses), a "Try again" button, links to methodology and
  to recent guides that are already in the runtime cache.
- Bilingual EN + AR.

WORK — install/update flow
- Show a non-blocking "Update available — refresh to apply" toast when a new SW activates.
- Honor `prefers-reduced-motion` for the toast.

CONSTRAINTS
- Do NOT cache `/admin/*` or `/api/*`. `tests/sw-exclusions.test.js` MUST stay green.
- Do NOT cache the live price JSON.
- Do NOT precache the entire `countries/**` tree — it's too large.
- Bilingual EN + AR for the offline page.

VERIFY
- `npm test` (sw-exclusions + any new SW tests).
- `npm run validate`.
- Manual: build, preview, kill the network in devtools, reload — confirm offline page
  renders with the cached price.
- Manual: bump CACHE_NAME, reload, confirm old cache is purged.

DELIVERABLE
PR with commits split (cache strategy / cache version bump / offline page / update toast /
tests).
```

---

## Prompt 22 — Pricing & Invest Pages

```text
You are upgrading `pricing.html`, `invest.html`, and `src/pages/tracker-pro.js`. These
pages discuss money — they need maximum trust copy and zero hype.

INSPECT FIRST
1. Read `pricing.html` end-to-end. Note any tier comparison tables, CTAs, and disclaimers.
2. Read `invest.html`. Note any "performance" claims or historical assertions — flag
   anything that lacks a citation.
3. Read `src/pages/tracker-pro.js`. Check whether "pro" features are gated, free, or
   placeholder.
4. Read `content/guides/invest-in-gold-gcc.html` for tone reference.
5. Read translations `pricing.*`, `invest.*`, `trackerPro.*`.

WORK — pricing
- Tier table: clear features per tier, monthly/annual toggle if used, no hidden fees.
  If there is no real paid tier today, label everything as "Free for now" honestly.
- Refund / cancellation copy if there is paid tier; link to terms.
- Trust block: methodology link, sample data freshness, contact link.

WORK — invest
- Replace any unsourced performance claim with sourced or removed copy.
- "Past performance is not indicative of future results" disclaimer — visible, not buried.
- Link prominently to `content/guides/invest-in-gold-gcc.html` and methodology.
- Calculator embed or link for hypothetical investment math; clearly labeled hypothetical.

WORK — tracker-pro
- If features are placeholder, label them "Coming soon" — don't show a fake gate.
- If features exist, document them and link to pricing.

CONSTRAINTS
- No fabricated reviews, testimonials, or performance numbers.
- No "guaranteed return" wording. No "best investment" wording.
- Bilingual EN + AR.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: read every disclaimer aloud in EN and AR.

DELIVERABLE
PR with commits split (pricing / invest / tracker-pro / disclaimers / tests). Add a row in
`docs/LIMITATIONS.md` noting any unimplemented tier.
```

---

## Prompt 23 — Tools Suite: Weight Converter, Zakat, Investment Return

```text
You are upgrading the tools suite at `content/tools/index.html`,
`content/tools/weight-converter.html`, `content/tools/zakat-calculator.html`, and
`content/tools/investment-return.html`. Tools are returning-user magnets — they must be
fast, accurate, mobile-friendly, and honest about what they do.

INSPECT FIRST
1. Read each of the four HTML files end-to-end and any module that hydrates them.
2. Read `src/lib/price-calculator.js`, `src/config/karats.js`,
   `src/config/constants.js` (TROY_OZ_GRAMS, AED_PEG).
3. Read translations `tools.*`, `tools.weightConverter.*`, `tools.zakat.*`,
   `tools.investmentReturn.*`.
4. Read `src/lib/export.js` for share/export helpers.

WORK — weight converter
- Units: g, kg, oz, troy oz, tola, baht, mithqal, grain. Always pivot through grams
  internally to avoid round-trip drift.
- Precision: 4 decimal places by default, adjustable.
- Show the source equation under the result ("1 tola = 11.6638 g").

WORK — zakat calculator
- Inputs: gold weight (with unit), purity (karat), additional cash, debts, currency.
- Threshold: nisab in gold (~85g of 24K equivalent) computed from the live spot price;
  show the current nisab value and the date.
- Output: zakat due (2.5%) with a clear "consult a qualified scholar for personal
  guidance" footnote.
- Bilingual: AR copy must use proper religious terminology (الزكاة, النصاب).

WORK — investment return
- Inputs: amount, purchase date, sell date (or today), karat, currency.
- Output: ROI %, absolute gain/loss, annualized return; explicit "hypothetical, before
  fees and taxes" disclaimer.
- Use historical price data only if available; if not, label as illustrative.

WORK — shared
- All inputs use `inputmode="decimal"` for numeric fields.
- All results have a "Copy", "Share" (via `postTemplates.js`), and "Download CSV"
  (via `src/lib/export.js`, filename uses `isoTimestamp()`, brand "GoldTickerLive").
- Errors inline, not in console.
- Mobile: single-column on 360px, no overflow.

CONSTRAINTS
- Do NOT alter `TROY_OZ_GRAMS`, `AED_PEG`, or the karat purity table.
- DOM-safety: 0 sinks. Use `el()` / `replaceChildren()`.
- Bilingual EN + AR.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: enter realistic values for each tool in each language, copy/share/export.

DELIVERABLE
PR with commits split per tool. Add unit tests for unit conversion math under `tests/`.
```

---

## Prompt 24 — Chart Component

```text
You are upgrading the chart component (`src/components/chart.js`) and the SVG builders in
`src/tracker/dom-builders.js`. The chart is one of the few moving visual elements on the
site — it must be performant, accessible, and respect reduced motion.

INSPECT FIRST
1. Read `src/components/chart.js` end-to-end.
2. Read `src/tracker/dom-builders.js` — note the SVG `createElementNS` builders that
   replaced the legacy `innerHTML` sinks (DOM-safety baseline is 0 sinks).
3. Read `src/lib/historical-data.js` for the data shape.
4. Read translations `chart.*`.

WORK — rendering
- SVG only, built with `createElementNS`. No charting library.
- Lines: 24K, 22K, 21K, 18K (toggle on/off via legend). Time range toggle: 24h, 7d, 30d, 90d.
- Currency toggle: USD, AED.
- Tooltip on hover/focus; `aria-describedby` for the focused point.

WORK — accessibility
- `role="img"` on the SVG with `aria-label` summarizing range + change %.
- Alternative: a `<table>` fallback hidden visually but accessible to screen readers,
  populated from the same data.
- Keyboard: arrow keys move the focused datapoint; Home/End jump to start/end.

WORK — reduced motion
- `prefers-reduced-motion: reduce` → no draw-in animation, no hover-grow, instant
  state changes.

WORK — fallback
- If `historical-data.js` returns nothing or stale data, render a clear "Historical data
  unavailable" panel with a retry link, not a broken chart.

CONSTRAINTS
- DOM-safety baseline: 0 sinks. Do NOT introduce `innerHTML` / `outerHTML` /
  `insertAdjacentHTML` in the chart code.
- Do NOT add a charting library.
- Bilingual EN + AR (axis labels, tooltip, legend).

VERIFY
- `node scripts/node/check-unsafe-dom.js`.
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: tab through the chart, toggle reduced motion in the OS, switch language.

DELIVERABLE
PR with commits split (rendering / a11y / reduced motion / fallback / tests).
```

---

## Prompt 25 — Footer, Internal Links & Breadcrumbs

```text
You are upgrading the footer, internal-links component, and breadcrumbs.
`src/components/footer.js`, `src/components/internalLinks.js`,
`src/components/breadcrumbs.js`. These are repeated across the site — small improvements
multiply.

INSPECT FIRST
1. Read each of the three components.
2. Read `src/components/nav-data.js` to understand the canonical link map (used by both
   nav and footer).
3. Read translations `footer.*`, `internalLinks.*`, `breadcrumbs.*`.

WORK — footer
- Group links: Product (tracker, calculator, tools), Markets (countries, cities), Learn
  (guides, FAQ, methodology), Company (about, privacy, terms, contact), Social (X, RSS).
- Include the freshness pill summary: "Live · last updated <time>" mirroring the home page.
- Year auto-updates. Brand: "Gold Ticker Live".
- Source label: "Spot from XAU/USD · AED at 3.6725 fixed peg".

WORK — internal links
- The component picks contextually relevant links based on the current page type. From a
  country page → the country's cities + calculator; from a guide → 3 sibling guides +
  methodology; from the tracker → calculator + methodology + spot-vs-retail guide.
- Anchor text is descriptive — never "click here".

WORK — breadcrumbs
- Render visible breadcrumbs and emit BreadcrumbList JSON-LD via `inject-schema.js`.
- RTL parity: separators mirror correctly.
- Truncation: on 360px, collapse middle items with an aria-labeled ellipsis.

CONSTRAINTS
- Do NOT hard-code strings; use `nav-data.js` and translations.
- Bilingual EN + AR.
- DOM-safety: `el()` / `replaceChildren()` only.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: open 5 different page types and confirm contextual links + breadcrumbs.

DELIVERABLE
PR with commits split (footer / internal links / breadcrumbs / tests).
```

---

## Prompt 26 — Compare Countries & Today's Best Rates

```text
You are upgrading the comparison surfaces: `content/compare-countries/`,
`content/todays-best-rates/`, and `content/gcc-gold-price-comparison/`. These pages turn
static traffic into engagement — they must be live, fair, and clearly methodology-linked.

INSPECT FIRST
1. Read each of the three index pages and any companion JS.
2. Read `src/pages/home.js` for the existing country-tile rendering patterns.
3. Read `src/lib/price-calculator.js` and the country list source.
4. Read translations `compare.*`, `bestRates.*`, `gccComparison.*`.

WORK — compare countries
- Multi-select up to N countries; show a side-by-side table of 24K/22K/21K/18K AED, USD,
  and per-gram-local-currency.
- Sort by price asc/desc, currency, freshness.
- Mobile: collapses to a stacked card layout below 600px.
- Methodology link prominent at the top.

WORK — today's best rates
- Auto-rank countries by 24K g price in a fixed reference currency (USD by default,
  toggleable to AED).
- Honest caveat: "Reference prices only. Local retail prices may differ. See methodology."
- Last-updated pill mirrors the home page.

WORK — GCC comparison
- Focused subset: UAE, KSA, Kuwait, Qatar, Bahrain, Oman.
- Adds market-hours awareness (link to `content/guides/gcc-market-hours.html`).
- Currency-of-day-open delta if available.

CONSTRAINTS
- Do NOT fabricate "best deal" claims. Always say "reference price".
- Bilingual EN + AR.
- DOM-safety baseline.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: select 4 countries in compare, sort, switch currency, switch language.

DELIVERABLE
PR with commits split per page. Cross-link the three pages so users can move between them.
```

---

## Prompt 27 — Social Sharing & Embed Widget

```text
You are upgrading the social sharing surfaces and the embed widget.
`content/social/x-post-generator.html`, `content/embed/`, `src/social/postTemplates.js`.
The embed widget is how third-party sites can show our live price — it must be lightweight,
attribution-clear, and trustworthy.

INSPECT FIRST
1. Read `content/social/x-post-generator.html` and `src/social/postTemplates.js`.
2. Read `content/embed/index.html` and the embed JS.
3. Read translations `social.*`, `embed.*`.
4. Read `_headers` for any iframe / CSP rules.

WORK — sharing
- One-click templates for X, Facebook, WhatsApp, LinkedIn — with a preview showing the
  exact rendered text.
- Default copy: 24K AED/g + 22K AED/g + freshness + tracker URL.
- Use Web Share API where supported, fall back to copy-to-clipboard otherwise.

WORK — embed widget
- Iframe-friendly: lightweight HTML/CSS/JS, no admin code, no analytics that bleed into
  parent.
- Clear "Powered by Gold Ticker Live" attribution with a link.
- Configurable via URL params: `?karat=24&currency=AED&size=compact|full&lang=en|ar`.
- Auto-refresh respecting `GOLD_REFRESH_MS`. Show freshness pill.
- CSP headers: ensure `_headers` allows the embed origin to be framed where appropriate
  (or document the policy).

CONSTRAINTS
- Embed widget must NOT load admin code or any auth-dependent scripts.
- DOM-safety in the embed.
- No emoji spam in default share text.
- Bilingual EN + AR.

VERIFY
- `npm run validate`, `npm test`, `npm run build`.
- Manual: open the embed in an `<iframe>` on a test page; confirm freshness ticks; share
  via X/WhatsApp/LinkedIn templates.

DELIVERABLE
PR with commits split (sharing UX / embed widget / attribution / docs). Update
`docs/AUTOMATIONS.md` with the embed URL parameter spec.
```

---

## Prompt 28 — Submit Shop & Order Gold Flows

```text
You are upgrading the user-submission flows: `content/submit-shop/index.html` and
`content/order-gold/index.html`, backed by `server/repositories/shops.repository.js` and
the admin shop manager.

INSPECT FIRST
1. Read both flow pages end-to-end.
2. Read `server/repositories/shops.repository.js` — note `atomicWriteJSON()` usage and
   the schema validation.
3. Read `server/lib/admin/shop-manager.js`.
4. Read translations `submitShop.*`, `orderGold.*`.

WORK — submit shop
- Multi-step form: location → contact → specialty → optional photos.
- Field validation inline (email, phone, URL via `safeHref` / `safeTel` helpers).
- "We review every submission before publishing" disclaimer; do NOT auto-publish.
- Submit endpoint persists to a `pending_shops` JSON via `atomicWriteJSON()` and surfaces
  the entry in the admin queue.

WORK — order gold
- This page is informational, not a marketplace. The flow connects users with verified
  shops near them — it does NOT process payment.
- Filter by city + karat + min weight; show ≥ 3 shop matches with phone/website links.
- Footer disclaimer: "Gold Ticker Live is an information service. We don't sell or broker
  gold."

CONSTRAINTS
- Do NOT introduce a payment integration without owner approval.
- All persistence via `atomicWriteJSON()`.
- DOM-safety; phone/URL via helpers.
- Bilingual EN + AR.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: submit a fake shop; verify it lands in `pending_shops` and surfaces in the admin
  queue; reject it from the admin and confirm the rejection is audited.

DELIVERABLE
PR with commits split (submit form / pending queue / order-gold / disclaimers / tests).
Update `docs/EDIT_GUIDE.md` with the submission lifecycle.
```

---

## Prompt 29 — Dark Mode & Theme System

```text
You are upgrading the dark mode and theme system. `src/lib/site-settings.js` persists the
choice; `src/components/nav.js` `_cycleTheme()` and `_applyTheme()` handle the toggle and
sync the desktop + drawer buttons; CSS uses a `data-theme` attribute on `<html>` (or
`<body>`) to switch surface tokens.

INSPECT FIRST
1. Read `src/lib/site-settings.js`.
2. Read `src/components/nav.js` — `_cycleTheme`, `_applyTheme`, the
   `.nav-drawer-bottom` wrapper containing `#nav-theme-toggle-drawer`.
3. Read `styles/global.css` — surface tokens (`--surface-primary`, `--surface-secondary`,
   `--surface-tertiary`), text tokens (`--text-primary`, `--text-secondary`,
   `--text-tertiary`). Note the dark-mode bug: `--surface-base` and `--surface-card` are
   undefined and fall through to `#fff`.
4. Read translations for `nav.theme.*` and the `themeLabels` per locale in `nav-data.js`.

WORK
- Themes: `light`, `dark`, `system`. Cycle order is documented and consistent.
- Fix the `--surface-base` / `--surface-card` bug: either define them explicitly per theme
  or migrate all references to the canonical `--surface-primary` / `--surface-secondary`.
- Confirm every page surface uses tokens (not hand-picked hex). Audit `styles/pages/*.css`
  for raw colors and convert to tokens.
- The theme toggle must be reachable in both nav (desktop) and drawer (mobile). Both
  buttons stay in sync via `_applyTheme()`.
- `prefers-color-scheme` honored when theme is `system`.
- A11y: `aria-pressed` reflects current state; `aria-label` localized via `themeLabels`.

CONSTRAINTS
- Do NOT introduce per-page theme overrides.
- Do NOT regress dark-mode contrast on any page.
- Bilingual aria-labels.

VERIFY
- `npm run validate`, `npm test`, `npm run quality`.
- Manual: cycle theme on home, tracker, calculator, shops, a country page, a guide; both
  EN and AR; confirm no `#fff` flash on dark.
- Run a Lighthouse a11y audit on dark mode for the home page.

DELIVERABLE
PR with commits split (token fix / per-page audit / nav sync / a11y / tests). Update
`docs/DESIGN_TOKENS.md` with the canonical surface/text token list.
```

---

## Prompt 30 — Analytics Events Standardization

```text
You are standardizing the analytics event catalog in `assets/analytics.js`. Inconsistent
event names make funnels useless.

INSPECT FIRST
1. Read `assets/analytics.js` — list every `track(...)` call site (grep across the repo).
2. Read `admin/analytics/` to see what the dashboard expects.
3. Read translations to confirm any event names that show up in the UI.

WORK — catalog
Standardize to these named events (snake_case), parameters in {}:

- `page_view` { path, locale }
- `tracker_view` { karat, country, currency }
- `karat_change` { from, to }
- `country_change` { from, to }
- `unit_change` { from, to }
- `currency_change` { from, to }
- `calculator_use` { weight, unit, karat, currency }
- `tool_use` { tool: 'weight'|'zakat'|'investment-return' }
- `share_click` { surface, channel }
- `copy_click` { surface, value_type }
- `alert_set` { karat, threshold, direction, currency }
- `alert_clear` { karat }
- `newsletter_subscribe` { source, cadence }
- `search_query` { length, result_count, locale }
- `search_open` { ... }
- `theme_change` { to }
- `lang_change` { to }
- `outbound_click` { url_host }
- `error` { type, where }

WORK — implementation
- Replace ad-hoc strings with constants exported from `assets/analytics.js`.
- Strip PII: never log email, phone, full search query if it could contain PII; truncate.
- Sample-rate noisy events (`page_view`) consistently.

CONSTRAINTS
- Do NOT introduce a new analytics dependency.
- Do NOT log secrets or PII.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: walk through home → tracker → calculator → newsletter; confirm each named event
  fires once with the right parameters in devtools.

DELIVERABLE
PR with commits split (catalog constants / call-site migrations / dashboard updates / tests).
Add `docs/ANALYTICS_EVENTS.md` documenting the catalog.
```

---

## Prompt 31 — GitHub Actions Workflow Hardening

```text
You are hardening the GitHub Actions workflows. The workflow files live under
`.github/workflows/`: `ci.yml`, `deploy.yml`, `codeql.yml`, `lighthouse.yml`,
`perf-check.yml`, `daily-newsletter.yml`, `weekly-newsletter.yml`,
`gold-price-fetch.yml`, `health_check.yml`, `post_gold.yml`, `spike_alert.yml`,
`uptime-monitor.yml`, `sync-db-to-git.yml`.

INSPECT FIRST
1. Read every workflow file. List triggers, secrets, jobs, runners, permissions.
2. Note current Node version and any pinned action SHAs.
3. Read `.github/workflows/README.md` if present.

WORK — security
- Pin every third-party action to a full commit SHA (not a tag).
- Set explicit `permissions:` per job (default to `contents: read`).
- Use `concurrency:` keys to prevent duplicate runs (especially `post_gold`,
  `gold-price-fetch`, `daily-newsletter`).
- Never `echo` secrets in `run:` steps.
- Verify the Python `sys.path` patching pattern in `post_gold.yml` is preserved exactly.

WORK — reliability
- `ci.yml`: must run `npm ci`, `npm run validate`, `npm run quality`, `npm test`,
  `npm run build`, and Playwright smoke. (Already does — confirm and tighten.)
- `deploy.yml`: only runs on `main` after CI is green. Uses GitHub Pages deploy.
- `gold-price-fetch.yml`: failure must NOT publish a stale price.
- `spike_alert.yml`, `uptime-monitor.yml`, `health_check.yml`: notify Discord/Telegram via
  `scripts/node/notify-*.js` only when webhooks are configured.
- All scheduled workflows: use a humane cron (no every-minute crons unless intentional).

WORK — observability
- Use `actions/upload-artifact@<sha>` for diagnostic outputs (lighthouse reports, audit
  diffs).
- Add a workflow `name:` and consistent badge URLs in `README.md` if missing.

CONSTRAINTS
- Do NOT change the cadence of `post_gold.yml` without owner approval — it is live in
  production.
- Do NOT introduce a paid action.
- Run `gh-advisory-database` for any new action you add.

VERIFY
- yamllint locally.
- Push the changes and confirm a single CI run succeeds.
- For `post_gold.yml`, run with the dry-run flag (Prompt 20) before merging.

DELIVERABLE
PR with commits split per workflow concern (SHA pinning / permissions / concurrency /
reliability / observability). Update `.github/workflows/README.md`.
```

---

## Prompt 32 — Pre-deploy, Changelog & Release

```text
You are improving the pre-deploy + changelog + release pipeline.
`scripts/node/pre-deploy-check.js` (`npm run pre-deploy`) runs 8 go/no-go checks;
`scripts/node/changelog.js` (`npm run changelog`) generates a Conventional Commits
changelog from git log; `scripts/node/package-release.js` packages a release artifact.

INSPECT FIRST
1. Read each of the three scripts and the corresponding `package.json` script entries.
2. Read `CHANGELOG.md` to see the existing format.
3. Read `docs/CHANGELOG.md` if it differs from the root.

WORK — pre-deploy
- The 8 checks should at minimum cover: build success, validate pass, tests pass, no
  uncommitted changes, no DOM-safety regression, sitemap fresh, robots.txt unchanged,
  CNAME unchanged. Confirm each — add anything missing.
- Output is a summary with PASS/FAIL per check and a clear non-zero exit on any FAIL.

WORK — changelog
- Group by Conventional Commit type: feat, fix, perf, refactor, docs, chore, test, ci.
- Include PR/commit SHAs for traceability.
- Bilingual is NOT required for the changelog (engineering doc).

WORK — release
- `package-release.js`: produce a tarball of `dist/` + `CHANGELOG.md` + a small
  `release.json` with brand, version, build SHA, build timestamp.
- Tag the release in git (only on `main`, only via the workflow — not locally).

CONSTRAINTS
- Do NOT auto-publish a release. The packaging is artifact-only; promotion is a
  human/owner step.
- Do NOT remove existing CHANGELOG entries.

VERIFY
- `npm run pre-deploy` exits 0 on a clean main; introduce a deliberate failure to confirm
  it exits non-zero.
- `npm run changelog` produces output that diffs cleanly against the previous run.

DELIVERABLE
PR with commits split (pre-deploy checks / changelog grouping / release packaging /
docs). Update `docs/CONTRIBUTING.md` and `CHANGELOG.md`.
```

---

## Prompt 33 — E2E & Coverage

```text
You are upgrading the test suite. Unit tests live under `tests/*.test.js` (node:test).
E2E lives under Playwright (`playwright.config.js`). CI runs validate / quality / unit /
build / Playwright smoke, but does NOT currently run `test:coverage`.

INSPECT FIRST
1. Read `playwright.config.js` and the existing E2E specs.
2. Read every file under `tests/`. Note which areas of `src/` are well-covered and which
   are not.
3. Read `package.json` test scripts: `test`, `test:coverage`, `test:e2e` (or equivalent).
4. Read `.github/workflows/ci.yml` to see exactly which test commands run in CI.

WORK — unit
- Add tests for any module under `src/lib/` that currently has no tests, prioritizing
  `live-status.js`, `price-calculator.js`, `formatter.js`, `cache.js`, `safe-dom.js`,
  `export.js`.
- For each new test, follow the existing node:test patterns and avoid network calls.

WORK — E2E
- Add Playwright specs covering: home renders, tracker renders, calculator computes a
  realistic value, country page loads, language toggle persists, theme toggle persists,
  search returns results, offline page renders when SW is active, admin login is gated.
- Run on Chromium + WebKit + Firefox if the existing config supports it.

WORK — coverage
- Wire `npm run test:coverage` into a non-blocking CI job (informational only) so we can
  see trends without making it a gate.
- Set a minimum threshold per directory (e.g. `src/lib/` ≥ 70%) — only fail CI if the
  threshold drops, not if it stays low.

CONSTRAINTS
- Do NOT introduce flaky time-dependent tests (use injected clocks).
- Do NOT add tests that require live network calls.

VERIFY
- `npm test`, `npm run test:coverage`, `npx playwright test`.
- CI passes.

DELIVERABLE
PR with commits split (unit tests / E2E specs / coverage CI / docs). Update
`docs/CONTRIBUTING.md` with the test matrix.
```

---

## Prompt 34 — Dependency Audit & Advisory Check

```text
You are auditing dependencies in `package.json` and `package-lock.json`. Use the
`gh-advisory-database` tool BEFORE adding any new dependency, and audit existing ones for
known vulnerabilities and abandoned packages.

INSPECT FIRST
1. Read `package.json` (root and `src/package.json` if present).
2. Read `package-lock.json` lock pinning.
3. Read `pyproject.toml` for Python deps used by `scripts/python/`.
4. Read `reports/cleanup-audit/depcheck.json` if present — it lists likely-unused deps.

WORK
- For every direct dependency, run `gh-advisory-database` (npm ecosystem). Record any
  advisory hits.
- Remove dependencies flagged as unused by depcheck AND verified to be unreferenced via
  grep.
- Bump any dep with a known critical/high advisory to a fixed version, ONE PER COMMIT.
- For dev-only tooling, prefer pinning to a known-good minor.
- Document any advisory we accept (with reason) in `docs/DEPENDENCIES.md`.

CONSTRAINTS
- Do NOT bump a major version without testing across the validate/test/build pipeline.
- Do NOT add a new heavy dependency (no charting libs, no CSS frameworks, no SPA libs).
- Do NOT remove a dep without grepping every reference first.

VERIFY
- `npm ci`, `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- `gh-advisory-database` re-run shows zero high/critical advisories on direct deps.

DELIVERABLE
PR with commits split per dep change (one bump or one removal per commit). Update
`docs/DEPENDENCIES.md`.
```

---

## Prompt 35 — Placeholder & Stub Page Completion

```text
You are completing placeholder/stub pages. The repo uses
`scripts/node/generate-placeholders.js` to scaffold pages and
`scripts/node/enrich-placeholder-pages.js` to fill them out. Some scaffolded pages still
read as thin or generic — they're SEO liabilities.

INSPECT FIRST
1. Read both scripts end-to-end.
2. Run `node scripts/node/audit-pages.js` (if present) and inspect the output for thin
   pages. Otherwise grep for telltale "Coming soon" / placeholder phrases.
3. Cross-reference the sitemap to find indexed thin pages.

WORK
- For each thin page, fill in the unique intro paragraph, key facts, ≥ 3 internal links,
  and an FAQ if relevant.
- Refuse to invent content. Where data is genuinely unavailable (e.g. a city with no
  shops yet), label honestly: "We're still adding shops in <City>. See nearby cities."
  and provide alternatives.
- If a page is truly unfit for indexing, add `noindex` and remove from the sitemap; add
  a one-line note in `docs/SEO_CHECKLIST.md`.

CONSTRAINTS
- No fake content, no fake reviews, no fake "expert" quotes.
- Bilingual EN + AR.

VERIFY
- `npm run validate` (sitemap coverage, SEO meta, placeholder check).
- `npm run check-links`, `npm run seo-audit`.

DELIVERABLE
PR with commits split per page cluster. Update `docs/SEO_CHECKLIST.md` and the sitemap.
```

---

## Prompt 36 — Mobile-First Layout Audit

```text
You are running a mobile-first layout audit at 320px–414px on every public page. Mobile
is where the majority of UAE/GCC traffic lives.

INSPECT FIRST
1. Open each top-level page at 360px, 390px, 414px in devtools: `index.html`,
   `tracker.html`, `calculator.html`, `shops.html`, `learn.html`, `insights.html`,
   `methodology.html`, `invest.html`, `pricing.html`.
2. Open one country page, one city page, one guide, one tool. Both EN and AR.
3. Read `styles/global.css` and `styles/pages/*.css` for any `min-width` / `max-width`
   breakpoints.

WORK
- No horizontal scroll on any page at 320px (allow up to 414px).
- Tap targets ≥ 44×44 px for every interactive element. Spacing between targets ≥ 8 px.
- Sticky elements (nav, freshness pill, CTA bar) do not overlap the page content's
  primary actions; combined sticky height ≤ 30% of viewport.
- Numerals (prices, percentages) never break across lines or truncate.
- Tables → cards on small screens where the table has > 3 columns.
- Mobile drawer dismisses on Escape and on backdrop tap; trap focus while open.
- RTL parity at 360px on every page touched.

CONSTRAINTS
- No new media queries that don't extend existing breakpoint tokens.
- Bilingual EN + AR.
- DOM-safety baseline preserved.

VERIFY
- `npm run validate`, `npm test`, `npm run quality`, `npm run build`.
- Manual checklist (above) per page; capture screenshots at 360px in EN + AR for the PR.
- Lighthouse mobile score baseline must not regress.

DELIVERABLE
PR with commits split per page cluster (home / tracker / shops / countries / guides / tools).
Attach before/after screenshots in the PR body.
```

---

## Prompt 37 — RSS Feed & News

```text
You are upgrading the RSS feed and news section. `scripts/node/generate-rss.js` builds
the feed; `content/news/` is the news landing page.

INSPECT FIRST
1. Read `scripts/node/generate-rss.js` end-to-end.
2. Read `content/news/index.html` and any per-post pages.
3. Read translations `news.*`, `rss.*`.
4. Read the feed's current XML output (build, then check `dist/rss.xml` or wherever it lands).

WORK — RSS
- Title, description, language (`en` and `ar` separate feeds), `lastBuildDate`,
  per-item `pubDate` (real, not `now()`), GUIDs that are stable URLs.
- One item per news post + optionally one item per substantive guide update.
- Atom + RSS 2.0 if the existing tooling supports both; one feed minimum.

WORK — news landing
- Reverse-chronological list, summary + read-time, link to per-post.
- Per-post page: H1, dateline, body, share block (Prompt 27), related guides.
- Article schema JSON-LD with real `datePublished` + `dateModified`.

WORK — discovery
- `<link rel="alternate" type="application/rss+xml">` in the `<head>` of every public page.
- Footer link to RSS.

CONSTRAINTS
- No fabricated news posts. If there's no real news, surface only a "Latest from the
  guides" feed.
- Bilingual EN + AR.

VERIFY
- `npm run validate`, `npm test`, `npm run build`.
- Manual: paste the feed URL into a feed reader; confirm 5 most recent items render.

DELIVERABLE
PR with commits split (generator / landing / per-post template / discovery / docs).
```

---

## Prompt 38 — Supabase Data Sync

```text
You are upgrading the Supabase data sync. `supabase/` holds schema and seed; the sync
workflow is `.github/workflows/sync-db-to-git.yml`; the runtime client is
`server/lib/supabase-data.js`. The admin uses Supabase GitHub OAuth.

INSPECT FIRST
1. Read `supabase/` directory tree (migrations, schema SQL, seed).
2. Read `.github/workflows/sync-db-to-git.yml` end-to-end.
3. Read `server/lib/supabase-data.js`.
4. Read `admin/supabase-config.js` and `admin/supabase-auth.js`.
5. Read `docs/SUPABASE_SCHEMA.md`, `docs/SUPABASE_SETUP.md`.

WORK
- Schema: every table has a `created_at` and `updated_at` column with sensible defaults.
- RLS: every table has explicit Row Level Security enabled. Public reads only on tables
  meant to be public (e.g. `shops_public`).
- Sync workflow: pulls public tables to Git as JSON; idempotent; commits only on diff.
- Runtime client: never exposes the service-role key client-side. Anon key only.
- Error handling: on Supabase outage, fall back to the last Git-committed JSON.

CONSTRAINTS
- Do NOT commit any service-role key or `.env` file.
- Do NOT broaden RLS without owner approval.
- Bilingual considerations apply to any user-facing data label, not the schema itself.

VERIFY
- `npm test`, `npm run validate`.
- Manually run the sync workflow against a staging Supabase if available.

DELIVERABLE
PR with commits split (schema migrations / RLS / sync workflow / runtime client / docs).
Update `docs/SUPABASE_SCHEMA.md` and `docs/environment-variables.md`.
```

---

## Prompt 39 — 404 / Error Pages & Redirect Hygiene

```text
You are upgrading `404.html`, `_redirects`, and `src/pages/not-found.js`. Error pages are
the unexpected meeting points — they should be helpful, branded, and honest.

INSPECT FIRST
1. Read `404.html` end-to-end.
2. Read `_redirects` and `_headers`.
3. Read `src/pages/not-found.js` and any router fallback.
4. Run `npm run check-links` and inspect the report for broken outbound and internal
   links.

WORK — 404
- Friendly copy: "We couldn't find that page. Here's what's nearby:" — list 3 most-likely
  intents (tracker, calculator, country index, search) with descriptive anchors.
- Live freshness pill mirroring the home page so the user can still get a price.
- Search input that pre-fills with the failing slug if available.
- Bilingual EN + AR.

WORK — redirects
- Preserve every legacy URL with a `301` to the canonical equivalent. Do NOT introduce a
  redirect loop.
- Common paths to consider: trailing slash normalization, country code aliases (e.g.
  `/uae/` → `/countries/uae/`), legacy guide slugs.
- Document every new redirect in `docs/REVAMP_PLAN.md`.

WORK — error logging
- If the SPA catches a render error, log a redacted analytics event (Prompt 30:
  `error { type, where }`).

CONSTRAINTS
- Do NOT redirect indexed canonical URLs to themselves.
- Do NOT remove any existing redirect without a documented rationale.
- Bilingual EN + AR.

VERIFY
- `npm run check-links`, `npm run validate`, `npm test`.
- Manual: visit /this-does-not-exist and confirm the page is helpful.

DELIVERABLE
PR with commits split (404 page / redirects / error logging / docs). Update
`docs/REVAMP_PLAN.md`.
```

---

## Prompt 40 — Image Audit & Asset Optimization

```text
You are auditing images and assets. `scripts/node/image-audit.js` (`npm run image-audit`)
inspects asset sizes; assets live under `assets/`; the favicon is `favicon.svg`.

INSPECT FIRST
1. Run `npm run image-audit`. Read the report.
2. List every `<img>` across the codebase. Note which lack `width`/`height` (CLS risk),
   `alt` (a11y), `loading="lazy"`, or `decoding="async"`.
3. Read `assets/` for oversized PNGs/JPGs.
4. Read `favicon.svg` and confirm dark-mode parity.

WORK
- Every `<img>` has explicit `width` and `height` (or `aspect-ratio` CSS) — no CLS.
- Every `<img>` has meaningful `alt` (or `alt=""` for decorative).
- Below-the-fold images: `loading="lazy"` and `decoding="async"`.
- Above-the-fold hero images: `fetchpriority="high"`, no `loading="lazy"`.
- Convert oversized PNGs to WebP/AVIF where supported (only if the build pipeline already
  produces them — do not add a new pipeline).
- Favicon: SVG primary, PNG fallback at 32×32 and 192×192. Maskable icon for PWA.
  Manifest references match (`manifest.json`).
- OG/Twitter card images: 1200×630, branded, generated once and committed; do not
  generate per-page in build.

CONSTRAINTS
- Do NOT introduce a runtime image-processing dep.
- Do NOT remove an image referenced from any indexed page.
- Bilingual considerations: alt text in EN + AR where pages are bilingual.

VERIFY
- `npm run image-audit`, `npm run validate`, `npm run build`.
- Lighthouse: CLS ≤ baseline; LCP ≤ baseline.

DELIVERABLE
PR with commits split (alt + dimensions / lazy-load / favicon + manifest / OG image / docs).
Update `docs/PERFORMANCE.md` with the new baseline.
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
