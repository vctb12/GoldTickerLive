# Autonomous Cowork Audit — goldtickerlive.com

**Date:** 2026-07-10 · **Author:** Claude Code (autonomous cowork session) · **Scope:** live-site
audit of the deployed production site (`https://goldtickerlive.com`) plus repo-code corroboration.
**Change class:** docs-only (this file records findings; it changes no product code).

> **Provenance & honesty note.** The **runtime** observations below (cross-surface price snapshot,
> duplicate network calls, DOM-node counts, tap-target counts, console-capture result, RTL
> behaviour) were captured against the **live site on 2026-07-10** by the cowork audit harness and
> are **point-in-time** — a re-test on another day may differ, and where it does the re-tester
> should say so rather than trust these numbers. The **per-page SEO / structured-data / H1 / meta**
> values in the table were independently **re-extracted this session (2026-07-10) from the repo page
> sources** that generate the live pages, and they corroborate the audit's "SEO is strong" verdict.
> Each finding is tagged with whether it was **re-verified against repo code this session**. Nothing
> here is fabricated; unverified items are labelled as such.

---

## 0. Verification run this session (2026-07-10)

Environment: Node `v22.22.2`, npm `10.9.7`. `node_modules` was empty at session start, so `npm ci`
was run first (installed 349 packages, 0 vulnerabilities). Then:

| Command         | Result                                                                                                                  | Exit |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- | ---- |
| `npm run lint`  | `eslint .` — clean, no findings                                                                                         | 0    |
| `npm test`      | **1407 pass / 0 fail / 0 skipped**, 155 suites (~62 s)                                                                  | 0    |
| `npm run build` | full pipeline (stubs → baseline → shops → learn-fallback → theme → schema → sitemap → `vite build`); `✓ built in 4.87s` | 0    |

Notes: `npm run build` regenerates `public/sitemap.xml` as a side effect; that generated change was
**reverted** to keep this change docs-only. `dist/` is git-ignored. These commands confirm the docs
addition does not break the suite; they are **not** a substitute for the runtime/live findings
below.

---

## 1. Per-page SEO & accessibility table

Values compiled from repo page sources (build inputs → live pages), 2026-07-10. `hreflang` is the
same reciprocal set — **`en` / `ar` / `x-default`** — on every page listed. All pages carry a
`<title>`, a `<meta name="description">`, and a self-referential absolute `rel="canonical"`.
`form-a11y` reflects the live audit's "0 unlabeled inputs" result.

| Page (file)                         | `<title>` (verbatim)                                         | Desc? | Canonical                     | hreflang        | JSON-LD `@type`s                                              | H1                                          | form-a11y          | Notes                                                                  |
| ----------------------------------- | ------------------------------------------------------------ | ----- | ----------------------------- | --------------- | ------------------------------------------------------------- | ------------------------------------------- | ------------------ | ---------------------------------------------------------------------- |
| **home** (`index.html`)             | Gold Ticker Live — Reference Gold Prices UAE & GCC Today     | ✅    | `https://goldtickerlive.com/` | en·ar·x-default | Organization, WebSite, ContactPoint, ImageObject              | "Gold Prices Today — UAE, GCC & Arab World" | ok (no forms)      | Home renders **cached** snapshot → price divergence (Finding 2)        |
| **learn** (`learn.html`)            | Gold Knowledge Hub — Guides & Investing \| Gold Ticker Live  | ✅    | `…/learn.html`                | en·ar·x-default | Article, BreadcrumbList, ImageObject, ListItem, Organization  | "Learn About Gold… / تعلّم عن الذهب"        | ok                 | "Read 0 of 9" counter perception issue — FIXED+MERGED #608 (Finding 9) |
| **calculator** (`.html`)            | Gold Calculator — Value, Scrap, Zakat \| Gold Ticker Live    | ✅    | `…/calculator.html`           | en·ar·x-default | WebApplication, Offer, BreadcrumbList, ListItem, Organization | "Gold Calculator"                           | 0 unlabeled inputs | Tool buried below a screen of disclaimer copy (Finding 7)              |
| **portfolio** (`.html`)             | Gold Portfolio Tracker — Value Holdings \| Gold Ticker Live  | ✅    | `…/portfolio.html`            | en·ar·x-default | WebApplication, Offer, BreadcrumbList, ListItem, Organization | "Gold Portfolio Tracker"                    | 0 unlabeled inputs | Same "tool below disclaimer" pattern as calculator (Finding 7)         |
| **compare** (`.html`)               | Gold Price Comparison — GCC & Arab World \| Gold Ticker Live | ✅    | `…/compare.html`              | en·ar·x-default | WebApplication, Offer, BreadcrumbList, ListItem, Organization | "Compare Gold Prices by Country"            | ok                 | Retail-estimate (spot ≠ retail) model                                  |
| **shops** (`.html`)                 | Gold Shops & Markets Directory by Region \| Gold Ticker Live | ✅    | `…/shops.html`                | en·ar·x-default | ItemList, JewelryStore×27, PostalAddress×27, BreadcrumbList   | "Browse Gold Shops & Markets by Region"     | ok                 | **~1040 card DOM nodes** — perf risk (Finding 5)                       |
| **glossary** (`.html`)              | Gold Glossary — Pricing & Purity Terms \| Gold Ticker Live   | ✅    | `…/glossary.html`             | en·ar·x-default | **BreadcrumbList, ListItem only** (no DefinedTermSet)         | "Gold Glossary"                             | ok                 | Missing `DefinedTermSet` — fix in progress `claude/g16-…` (Finding 6)  |
| **world map** (`heatmap.html`)      | Gold Price World Map — Retail by Country \| Gold Ticker Live | ✅    | `…/heatmap.html`              | en·ar·x-default | WebApplication, Offer, BreadcrumbList, ListItem, Organization | "Gold Price World Map"                      | ok                 | All-in retail-estimate lens; inline-SVG map                            |
| **dubai** (`dubai-gold-price.html`) | Gold Rate in Dubai & UAE — AED per Gram \| Gold Ticker Live  | ✅    | `…/dubai-gold-price.html`     | en·ar·x-default | **FAQPage** (Question×5, Answer×5), BreadcrumbList, ListItem  | "Gold Rate in Dubai & the UAE"              | ok                 | Strong FAQ structured data (re-verified this session)                  |

> **Re-verified against repo code this session:** the glossary "only BreadcrumbList / no
> DefinedTermSet" result (`grep` of `glossary.html`: 0 `DefinedTermSet`), and the dubai `FAQPage`
> presence (1 `FAQPage`, 5 `Question`, 5 `Answer`). Titles, canonicals, hreflang sets, and JSON-LD
> `@type` counts above are all from direct source extraction.

---

## 2. Findings

Severity: **HIGH** = trust/correctness risk users can see · **MED** = quality/perf/SEO gap ·
**LOW/INFO** = polish or confirmation.

### Finding 1 — `InvalidStateError` on View Transitions (INFO, expected)

- **Observed:** an `InvalidStateError: Transition was aborted because of invalid state` can surface
  during cross-document navigation.
- **Assessment:** this is the **expected** abort when the outgoing document unloads mid-transition,
  and it is already `.catch`-guarded. **Re-verified against repo code this session** in
  `src/lib/motion-boot.js`: `document.startViewTransition(...)` is followed by
  `transition.ready?.catch(() => {})`, `transition.finished?.catch(() => {})`, and
  `transition.updateCallbackDone?.catch(() => {})`, with a comment documenting the expected abort
  (lines 47–58). Same-document/hash-only navigations are excluded from the transition path.
- **Status:** not a defect. **Further hardening in progress** on branch `claude/g3-motion-guard`.

### Finding 2 — Cross-surface price inconsistency (HIGH — trust)

- **Observed (live, 2026-07-10 snapshot):** home showed
  **"$4,064 Cached"** while the calculator
  showed **"$4,062.20 Live"** at the same moment; page
  load fired **~15 duplicate `api.gold-api.com/price/XAU` calls**.
- **Root cause:** the **home** page renders the committed cached snapshot (`src/config/constants.js`
  → `API_GOLD_URL: '/data/gold_price.json'`), while other surfaces resolve spot through the live
  provider (`src/lib/quote-providers/gold-api-com-provider.js`, composed in `create-providers.js`).
  Two different sources at the same instant → a visible "Cached vs Live" divergence and a small but
  real credibility hit. **Architecture corroborated against repo code this session** (both the
  snapshot path and the direct-provider path exist); the **specific price values and the ~15-call
  count are point-in-time live observations** that were not re-captured this session.
- **Recommendation (no owner-gated files):** (a) make every surface read from a **single shared
  quote resolver** so home and calculator can never show different spot at the same tick, and/or
  render home from the same provider result the other pages use; (b) **de-duplicate** the repeated
  `price/XAU` fetches behind one in-flight promise / short-TTL cache; (c) keep the freshness label
  honest — if home is genuinely cached, the calculator should reconcile to the same value or both
  should show the same label. **Do not** touch `.github/workflows/gold-price-fetch.yml` or
  `data/gold_price.json` production semantics; this is a client-side resolver/coalescing change.

### Finding 3 — Arabic RTL is native (INFO — confirmation)

- **Observed:** the Arabic surface is genuinely RTL — `dir="rtl"`, `lang="ar"`, mirrored navigation,
  translated `<title>` — not a bolted-on flip. EN/AR semantic parity holds.
- **Status:** healthy; preserve. No action.

### Finding 4 — SEO is strong (INFO — confirmation, verified)

- **Observed / re-verified:** self-referential absolute `canonical` sitewide; reciprocal `hreflang`
  **`x-default` / `en` / `ar`** on every page; JSON-LD **Organization / WebSite / FAQPage /
  BreadcrumbList** on home, and **FAQPage** on `dubai-gold-price.html`; `robots.txt` present with
  `Disallow: /admin/` and a `Sitemap:` line; sitemap valid.
- **Status:** strong. The one structured-data gap is glossary's missing `DefinedTermSet` (Finding
  6). `/admin/` correctly disallowed.

### Finding 5 — Shops page DOM weight (MED — perf)

- **Observed:** the shops directory renders **~1040 card DOM nodes** in one shot.
- **Risk:** layout/paint cost and memory on low-end mobile; scroll jank.
- **Recommendation:** paginate or virtualize the card list (render on scroll / windowing), or
  progressively hydrate below-the-fold regions. Pure front-end; no owner-gated surface.

### Finding 6 — Glossary missing `DefinedTermSet` JSON-LD (MED — SEO)

- **Observed / re-verified this session:** `glossary.html` carries **only** `BreadcrumbList`
  (+`ListItem`) JSON-LD — **0** `DefinedTermSet` blocks — despite being a glossary of defined terms.
- **Recommendation:** add a `DefinedTermSet` / `DefinedTerm` graph so each glossary entry is
  machine-readable (better rich-result eligibility). Schema injection lives in
  `scripts/node/inject-schema.js` (runs in `npm run build` + `npm run validate --check`).
- **Status:** **fix in progress** on branch `claude/g16-glossary-definedtermset`.

### Finding 7 — Tool pages bury the tool below disclaimer copy (MED — UX)

- **Observed:** **0 unlabeled inputs** anywhere (good a11y), **but** the calculator and portfolio
  pages push the actual interactive tool **below a full screen of disclaimer / explainer copy**, so
  the primary action is not visible on first paint.
- **Recommendation:** lead with the tool (or a compact tool summary), move the long disclaimer to a
  collapsible "About this estimate" / below-the-fold block — while keeping the spot-vs-retail
  disclaimer present and honest. Front-end layout only.

### Finding 8 — Tap-target sizes below minimum (MED — mobile a11y)

- **Observed (live):** **9–36 interactive elements per page** measured **below 24/32 px** minimum
  touch-target size.
- **Recommendation:** raise interactive hit areas to ≥ 44×44 CSS px (or ≥ 24 px with adequate
  spacing per WCAG 2.5.8) via padding/min-size utilities.
- **Status:** **fix in progress** on branch `claude/g6-tap-targets`.

### Finding 9 — Learn "Read 0 of 9" counter (RESOLVED — MERGED #608)

- **What was actually wrong:** the counter **logic works** — it advances to "Read 1 of 9" and writes
  `localStorage['gtl_learn_guides_read']` on guide-anchor navigation. **Re-verified this session:**
  `src/config/learn-hub-catalog.js` exports `LEARN_PROGRESS_KEY = 'gtl_learn_guides_read'`. The real
  issue was semantic: "read" meant **clicked**, not **scrolled/read**.
- **Fix:** **MERGED in PR #608** (`claude/learn-hub-progress-perception-kr5f7r`, merged 2026-07-09):
  scroll-dwell completion (`observeDwell()` — ≥60% visible for ≥3 s marks a guide read) plus a
  one-time legacy-id migration for returning users whose slash-stripped ids never matched the
  canonical hrefs, plus a pre-hydration "Loading guides…" affordance and a manifest icon-404 fix.
- **Not a bug — do not chase:** `#learn-catalog-root` **keeps** `data-static-fallback="true"` even
  after successful hydration, because hydration uses `replaceChildren()` (which swaps children but
  leaves the wrapper's attribute in place). **Re-verified this session:** the attribute is written
  by `scripts/node/render-learn-static-fallback.mjs` on the wrapper `<div id="learn-catalog-root">`.
  This attribute is **not** a hydration-failure signal; any future console/HTML gate must not treat
  its presence as "hydration failed".

### Finding 10 — Console-error capture was inconclusive (INFO — method gap)

- **Observed:** the audit harness could **not** reliably capture console errors this run — the
  result is **inconclusive**, not "clean".
- **Do not claim** the console is error-free without evidence.
- **Recommendation:** add a **Playwright console-error gate** (fail CI on unexpected `console.error`
  / uncaught rejection during a scripted nav across the key pages), with the expected
  View-Transition abort (Finding 1) explicitly allow-listed so it does not flap the gate. Playwright
  is already a devDependency and `npm run test:playwright` exists.

---

## 3. Recommended follow-ups (all $0, none owner-gated)

| #   | Follow-up                                                                | Owning branch / status                             |
| --- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| 1   | Single shared quote resolver + fetch de-dup so home ≠ calc can't diverge | new (Finding 2) — not yet started                  |
| 2   | View-Transition abort hardening                                          | `claude/g3-motion-guard` (in progress)             |
| 3   | Glossary `DefinedTermSet` JSON-LD                                        | `claude/g16-glossary-definedtermset` (in progress) |
| 4   | Tap-target sizing pass                                                   | `claude/g6-tap-targets` (in progress)              |
| 5   | Shops list pagination / virtualization                                   | new (Finding 5) — not yet started                  |
| 6   | Playwright console-error CI gate (allow-list the expected VT abort)      | new (Finding 10) — not yet started                 |
| 7   | Tool-first layout on calculator/portfolio                                | new (Finding 7) — not yet started                  |

Guardrails respected throughout: no edits proposed to `gold-price-fetch.yml`, `post_gold.yml`,
`sw.js`, billing, or Supabase; AED peg **3.6725**, troy **31.1034768 g**, and spot-vs-retail
(reference ≠ retail) framing preserved.

---

## 4. What was NOT verified this session

- The **live price values** ("$4,064" / "$4,062.20") and the **~15 duplicate call** count are as
  captured by the 2026-07-10 live audit; they were **not** re-captured against the live site this
  session (only the underlying dual-source architecture was corroborated in code).
- The **~1040 shops DOM nodes** and **9–36 sub-minimum tap targets per page** are live-audit
  measurements, not re-measured here.
- **Console cleanliness** remains **unproven** (Finding 10) — treated as inconclusive, not clean.

Cross-reference: this audit feeds the living-tracker board and open-PR inventory in
[`docs/AGENT_MASTER_TRACKER.md`](../AGENT_MASTER_TRACKER.md).
