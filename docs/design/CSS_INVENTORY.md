# CSS Inventory & Design-System Baseline — Phase 1

> **Plan:** `docs/plans/2026-07-12_design-revamp-30-phases.md` → **Act I, Phase 1** (🟢 audit-only,
> zero code change). **Purpose:** Establish the verified "before" state the whole revamp is measured
> against. This document is the input to Phase 2 (dead-CSS quarantine), Phase 3 (token contract),
> Phase 5 (`--gtl-*` codemod), Phase 6 (retire `design-system.css`), Phase 7 (fold the redesign
> layer), and Phase 8 (dark-theme parity).

**Snapshot:** HEAD `4b299c4` · measured 2026-07-12 · branch
`claude/gold-ticker-design-system-iin2va`. **How the numbers were produced:** deterministic
shell/Node measurement over the working tree (line counts via `wc -l`, load-chains parsed from each
page's `<link rel="stylesheet">`, token vars from `styles/partials/tokens.css` +
`styles/design-system.css`, static selector coverage via a Node corpus scan). Every figure below is
reproducible; none is carried over from a prior session.

---

## TL;DR — the fork, in five numbers

| #   | Fact                                                                             | Value                                                       | Feeds phase        |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------ |
| 1   | CSS files / total lines                                                          | **46 files / 41,887 lines**                                 | 9 (budget ceiling) |
| 2   | Shared CSS loaded on **every** page (before page-specific CSS)                   | **11,509 lines**                                            | 2, 6, 7            |
| 3   | Pages shipping **two token systems + a redesign layer** simultaneously           | **11 of 12** content pages                                  | 5, 6, 7            |
| 4   | `-redesign` page stylesheets that **cannot render dark mode**                    | **11 of 12** (only `compare-redesign.css` has `data-theme`) | 8                  |
| 5   | Class selectors with **no literal match** in any HTML/JS source (candidate-dead) | **522 of 3,450**                                            | 2                  |

**Test baseline (re-established this phase):** **1,656 tests / 164 suites — 1,656 pass, 0 fail, 0
skip** (`npm test` on HEAD `4b299c4`, ~65s). The plan carried a stale "1282" from a prior session;
the real, current number is **1,656**. (For reference, it was 1,647 at session start on `cbc4858`;
the five PRs merged this session added net +9 tests.)

---

## 1. The two design systems (the "fork")

There is no design _problem_; there is a design-_system_ fork — two token vocabularies and two
page-CSS layers ship at once.

### Token source A — `styles/partials/tokens.css` (the mature, canonical one)

- **584 lines**, loaded on **every page** via `styles/global.css` (`@import`).
- Semantic `--color-*` naming, WCAG-annotated inline (e.g.
  `--color-ink-data: #0f0c06; /* ≈18.7:1 on bg */`).
- **391 custom-property declarations**, 258 unique names, across namespaces: `--color-*` (152),
  `--text-*` (33), `--surface-*` (26), `--shadow-*` (20), `--gradient-*` (14), `--space-*` (13),
  `--font-*` (13), `--border-*` (13), `--radius-*` (12), plus
  `--weight/--transition/--elev/--ease/--price/--duration/--tracking/--motion/--leading/--z/--table/--focus/--type`.
- **7 `data-theme` (dark) override blocks** — this is the _only_ file that fully models dark mode.
- **Already carries most primitives** the plan's Phase 3/4 wants to "fold in": `--space-1..N`,
  `--radius-*`, `--shadow-*`, `--duration-*`, `--ease-*`, `--motion-*` all exist here. The overlap
  with system B is therefore large, which makes Phases 4–6 lower-risk than the plan assumed.

### Token source B — `styles/design-system.css` (the "Design System v2" layer)

- **351 lines**, loaded **per-page on 11 content pages** (see §3), **not** on `tracker.html`.
- Primitive `--gtl-*` naming (45 vars): type scale (`--gtl-price-hero`, `--gtl-display-1/2`, …), 4px
  spacing ladder (`--gtl-1..10`), radius (`--gtl-r-sm/md/lg/pill`), shadow (`--gtl-shadow-1/2`),
  motion (`--gtl-t-fast/base/slow`, `--gtl-ease`), layout (`--gtl-maxw`, `--gtl-measure`).
- **Aliases straight onto system A** (`--gtl-paper: var(--color-bg)`,
  `--gtl-gold: var(--color-gold)`, …), so B is a _thin re-labelling_ of A plus its own primitives
  and a set of component classes (`.gtl-price`, `.gtl-freshness`, `.gtl-delta`, `.gtl-btn`,
  `.gtl-card`, `.gtl-pill`, `.gtl-bar`, …).
- **Dark-mode-blind by design** — the file header literally says _"Theme-aware; dark mode later."_
  It has **zero `data-theme` blocks**.

> **Consequence:** every one of the 11 double-layer pages resolves `--gtl-*` → `--color-*` → a hex
> value. Collapsing B onto A (Phases 3–6) is mostly mechanical re-labelling, not a re-design.

---

## 2. File-by-file inventory (46 files)

Grouped by role. "Loaded by" = which pages pull the file (directly via `<link>`, or on every page
via `global.css`). Line counts via `wc -l`.

### Global chain — loaded on (almost) every page

| File                                        | Lines | Loaded by                       | Notes                                           |
| ------------------------------------------- | ----: | ------------------------------- | ----------------------------------------------- |
| `styles/critical.css`                       |   128 | **all pages** (inline-critical) | 10 `data-theme` blocks; 15 hard-coded hex       |
| `styles/global.css`                         |    10 | **all pages**                   | `@import` aggregator → the 10 partials below    |
| `styles/partials/fonts.css`                 |    96 | via global                      | @font-face (Playfair, Source Sans 3, Cairo)     |
| `styles/partials/price-display.css`         |   344 | via global                      | price-mark styles (pre-dates Phase 12)          |
| `styles/partials/shell.css`                 |    51 | via global                      | header/footer shell                             |
| `styles/partials/skeleton.css`              |   185 | via global                      | loading skeletons (12 candidate-dead classes)   |
| `styles/partials/tokens.css`                |   584 | via global                      | **Token source A — the canonical system**       |
| `styles/partials/base.css`                  |   890 | via global                      | element resets + base type; 9 `data-theme`      |
| `styles/partials/layout.css`                |   382 | via global                      | grid/containers; 15 hard-coded hex              |
| `styles/partials/components.css`            | 4,714 | via global                      | **largest partial; 151 candidate-dead classes** |
| `styles/partials/utilities.css`             | 3,733 | via global                      | **151 candidate-dead classes; 34 `data-theme`** |
| `styles/partials/motion-advanced.css`       |   380 | via global                      | animation utilities (Phase 26 target)           |
| `styles/partials/market-summary-ticker.css` |   165 | via global                      | ticker strip                                    |

**Shared base = 11,509 lines on every single page** before any page-specific CSS loads.

### Token layer B

| File                       | Lines | Loaded by                      | Notes                                  |
| -------------------------- | ----: | ------------------------------ | -------------------------------------- |
| `styles/design-system.css` |   351 | 11 content pages (not tracker) | **Token source B — retire in Phase 6** |

### Page stylesheets

| File                                | Lines | Loaded by                    | Notes                                                                        |
| ----------------------------------- | ----: | ---------------------------- | ---------------------------------------------------------------------------- |
| `styles/pages/tracker-pro.css`      | 5,271 | `tracker.html`               | **Flagship; on system A only, no redesign layer. Phase 16.** 23 `data-theme` |
| `styles/pages/home.css`             | 4,064 | `index.html`                 | + `home-redesign.css`. Phase 15                                              |
| `styles/pages/shops.css`            | 2,890 | `shops.html`                 | + `shops-redesign.css`. Phase 21                                             |
| `styles/pages/calculator.css`       | 1,394 | `calculator.html`            | + `calculator-redesign.css`. Phase 17                                        |
| `styles/pages/insights.css`         | 1,296 | `learn.html`                 | 71 candidate-dead classes                                                    |
| `styles/pages/invest.css`           | 1,070 | `learn.html`                 | 9 `data-theme`                                                               |
| `styles/pages/compare.css`          |   875 | `compare.html`               | + `compare-redesign.css`. Phase 18                                           |
| `styles/pages/learn.css`            |   829 | `learn.html`                 | + `learn-redesign.css`. Phase 22                                             |
| `styles/pages/methodology.css`      |   719 | `methodology.html`           | + redesign. **44 hard-coded hex**                                            |
| `styles/pages/heatmap.css`          |   709 | `heatmap.html`               | + `heatmap-redesign.css`. Phase 19                                           |
| `styles/pages/portfolio.css`        |   552 | `portfolio.html`             | + `portfolio-redesign.css`. Phase 20                                         |
| `styles/pages/market.css`           |   386 | `market.html`                | + `market-redesign.css`. Phase 23                                            |
| `styles/pages/terms.css`            |   316 | `terms.html`, `privacy.html` | no redesign layer                                                            |
| `styles/pages/dubai-gold-price.css` |   282 | `dubai-gold-price.html`      | + redesign                                                                   |
| `styles/pages/glossary.css`         |   196 | `glossary.html`              | + `glossary-redesign.css`. Phase 22                                          |
| `styles/admin.css`                  | 3,013 | `admin/**`                   | out of revamp scope (admin surface)                                          |

### `-redesign` layer (12 files — Phase 7 folds these in, Phase 6 removes their token source)

| File                                         | Lines | `--gtl-*` refs | `data-theme`? |
| -------------------------------------------- | ----: | -------------: | :-----------: |
| `styles/pages/home-redesign.css`             | 1,085 |            236 |      ❌       |
| `styles/pages/methodology-redesign.css`      |   552 |             59 |      ❌       |
| `styles/pages/market-redesign.css`           |   408 |             26 |      ❌       |
| `styles/pages/dubai-gold-price-redesign.css` |   381 |             23 |      ❌       |
| `styles/pages/learn-redesign.css`            |   359 |             24 |      ❌       |
| `styles/pages/glossary-redesign.css`         |   298 |             29 |      ❌       |
| `styles/pages/calculator-redesign.css`       |   207 |              5 |      ❌       |
| `styles/pages/shops-redesign.css`            |   188 |              7 |      ❌       |
| `styles/pages/compare-redesign.css`          |   180 |              3 | ✅ (3 blocks) |
| `styles/pages/portfolio-redesign.css`        |   114 |              3 |      ❌       |
| `styles/pages/heatmap-redesign.css`          |    82 |              3 |      ❌       |

### Component stylesheets

| File                                     | Lines | Loaded by                        |
| ---------------------------------------- | ----: | -------------------------------- |
| `styles/components/alert-manager.css`    |   587 | `tracker.html`                   |
| `styles/components/shops-map.css`        |   531 | `shops.html` (bumped +2 by #685) |
| `styles/components/edu.css`              |   383 | compare, heatmap, portfolio      |
| `styles/components/price-provenance.css` |   166 | compare                          |

### Dead / orphan

| File                              | Lines | Status                                                                                                     |
| --------------------------------- | ----: | ---------------------------------------------------------------------------------------------------------- |
| `styles/pages/tracker-pro-v4.css` |   491 | **Unreferenced by any HTML page.** Delete in Phase 2. (Only mentioned in docs/prompts, never `<link>`-ed.) |

---

## 3. Per-page CSS load chains

Every page loads `critical.css` + `global.css` (→ 10 partials) = **11,509 shared lines**, then its
page-specific files. The double-layer pages additionally load `design-system.css` **and** a
`-redesign.css`.

| Page                          | Page-specific stylesheets (in order)                                                        | Shared + page = **total lines** |   Double-layer?    |
| ----------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------: | :----------------: |
| `index.html` (home)           | home.css → **design-system.css** → home-redesign.css                                        |                      **17,012** |         ✅         |
| `tracker.html`                | tracker-pro.css → alert-manager.css                                                         |                      **17,369** | ❌ (system A only) |
| `calculator.html`             | calculator.css → **design-system.css** → calculator-redesign.css                            |                          13,464 |         ✅         |
| `compare.html`                | compare.css → edu.css → **design-system.css** → price-provenance.css → compare-redesign.css |                          13,469 |         ✅         |
| `dubai-gold-price.html`       | dubai-gold-price.css → **design-system.css** → dubai-gold-price-redesign.css                |                          12,526 |         ✅         |
| `glossary.html`               | glossary.css → **design-system.css** → glossary-redesign.css                                |                          12,357 |         ✅         |
| `heatmap.html`                | heatmap.css → edu.css → **design-system.css** → heatmap-redesign.css                        |                          13,038 |         ✅         |
| `learn.html`                  | learn.css → insights.css → invest.css → **design-system.css** → learn-redesign.css          |                          15,419 |         ✅         |
| `market.html`                 | market.css → **design-system.css** → market-redesign.css                                    |                          12,657 |         ✅         |
| `methodology.html`            | methodology.css → **design-system.css** → methodology-redesign.css                          |                          13,134 |         ✅         |
| `portfolio.html`              | portfolio.css → edu.css → **design-system.css** → portfolio-redesign.css                    |                          12,913 |         ✅         |
| `shops.html`                  | shops.css → shops-map.css → **design-system.css** → shops-redesign.css                      |                          15,473 |         ✅         |
| `privacy.html` / `terms.html` | terms.css                                                                                   |                          11,826 |         ❌         |
| `404.html` / `offline.html`   | (critical + global only)                                                                    |                          11,509 |         ❌         |

**The two anomalies the plan calls out are confirmed:**

- **`tracker.html` is on neither the token-B layer nor a redesign layer** — it is the largest single
  page stylesheet (5,271 lines) and the odd one out. This is why Phase 16 is the pivotal rebuild.
- **11 of 12 content pages carry the full double layer** (design-system.css + a redesign file).

---

## 4. `--gtl-*` migration surface (Phase 5)

`--gtl-*` is referenced in **13 files** (`design-system.css` itself + **12 consumers**). Phase 5's
"zero `--gtl-*` outside `design-system.css`" target means re-labelling references in these 12:

| Consumer                                     | `--gtl-*` refs |
| -------------------------------------------- | -------------: |
| `styles/pages/home-redesign.css`             |            236 |
| `styles/pages/methodology-redesign.css`      |             59 |
| `styles/pages/glossary-redesign.css`         |             29 |
| `styles/pages/market-redesign.css`           |             26 |
| `styles/pages/learn-redesign.css`            |             24 |
| `styles/pages/dubai-gold-price-redesign.css` |             23 |
| `styles/pages/shops-redesign.css`            |              7 |
| `styles/components/price-provenance.css`     |              6 |
| `styles/pages/calculator-redesign.css`       |              5 |
| `styles/pages/portfolio-redesign.css`        |              3 |
| `styles/pages/heatmap-redesign.css`          |              3 |
| `styles/pages/compare-redesign.css`          |              3 |

Because every `--gtl-*` already aliases a `--color-*`/primitive in system A, this is a **name-only**
codemod — no computed value changes if the Phase 3 mapping is 1:1.

---

## 5. Dark-theme parity gap (Phase 8)

- `tokens.css` models dark mode fully (**7 `data-theme` blocks**); several page/partial files add
  their own overrides (utilities 34, tracker-pro 23, components 16, home 16, critical 10, base 9,
  invest 9).
- **The redesign layer is almost entirely dark-blind: 11 of 12 `-redesign.css` files have zero
  `data-theme` blocks** — only `compare-redesign.css` (3 blocks) handles it. Once Phase 7 folds
  these into the page stylesheets, Phase 8 must add dark handling to each.
- **Tell for the hunt:** **315 hard-coded hex values live outside `tokens.css`** (they don't flip in
  dark mode). Heaviest: `methodology.css` 44, `invest.css` 44, `admin.css` 27, `utilities.css` 26,
  `components.css` 20, `heatmap.css` 20, `tracker-pro.css` 18, `layout.css`/`critical.css` 15 each,
  `home.css`/`price-provenance.css` 14 each. (Admin is out of revamp scope.)

---

## 6. Dead / unmatched CSS (Phase 2 input)

Static selector-coverage scan over the full HTML/JS corpus (excludes `docs/design/reviews` mockups
and `docs/plans`). A class is "unmatched" if its exact literal appears **nowhere** in any `.html`,
`.js`, `.mjs`, `.ts` source.

- **3,450 class selectors total → 522 unmatched (candidate-dead).**
- Concentrated in the global partials, whose consumers are JS-rendered shells that use _different_
  class names:

| File                             | class selectors |         unmatched (candidate-dead) |
| -------------------------------- | --------------: | ---------------------------------: |
| `styles/partials/components.css` |             346 |                            **151** |
| `styles/partials/utilities.css`  |             397 |                            **151** |
| `styles/pages/insights.css`      |             108 |                                 71 |
| `styles/pages/tracker-pro.css`   |             336 |                                 37 |
| `styles/admin.css`               |             286 |                                 32 |
| `styles/design-system.css`       |              30 | 15 (unadopted `.gtl-*` components) |
| `styles/partials/skeleton.css`   |              28 |                                 12 |

**Calibration (spot-checked, high confidence these are truly dead):** `.nav-bar`, `.footer-main`,
`.footer-newsletter*`, `.surface-elevated`, `.nav-drawer-overlay`, `.mobile-bottom-bar` appear in
**zero** source files — the live shell is rendered by `src/components/nav.js` + `footer.js` using a
different class vocabulary, so the old nav/footer/utility rules in `components.css` /
`utilities.css` are stranded. `.nav-drawer-overlay` and `.mobile-bottom-bar` are already listed in
the stale `reports/cleanup-audit/purgecss.json` (that report references pre-restructure filenames
like `styles/order.css` and is otherwise out of date — this scan supersedes it).

> **Caveats for Phase 2 (do not delete blind):** this is a _candidate_ list, not a verdict. The scan
> cannot see class names built by string concatenation in JS (e.g. `'gtl-dot--' + state`) — those
> are already excluded via a prefix-stem heuristic, but confirm each removal against the rendered
> DOM before quarantining. `#id`-column figures are unreliable (hex literals in property values
> match the `#…` pattern) and are excluded from the 522 total, which counts **classes only**.

---

## 7. RTL / i18n & icon state (Phases 24, 28)

- **RTL:** logical properties dominate — **633** logical uses
  (`margin/padding/border/inset-inline|block*`, `text-align:start|end`) vs **58** residual physical
  (`margin/padding-left|right`, bare `left:`/`right:`). (Method differs from the plan's "208 vs 49";
  both agree the residual is _cleanup, not rebuild_. Phase 28.)
- **Emoji-as-icons: fully solved.** 0 in HTML, **0 in `src/**/*.js`** (the plan's "5 left" is
  stale).
- **Icon system already exists** (plan Phase 24 assumes it doesn't):
  `src/components/icon-sprite.js`, `scripts/node/sync-icon-sprite.js` (wired into `npm run validate`
  as `--check`), and `tests/manifest-icons-absolute.test.js`. Only 3 standalone `.svg` files remain
  (`favicon.svg` ×2, `assets/og-image.svg`). **Phase 24 should be re-scoped from "build a sprite" to
  "audit/extend the existing sprite."**

---

## 8. Reconciliation with the plan's stated facts

| Plan claim (HEAD, 2026-07-12)                            | Verified this phase                              | Verdict             |
| -------------------------------------------------------- | ------------------------------------------------ | ------------------- |
| 46 files / 41,885 lines                                  | 46 files / **41,887** (+2 from #685)             | ✅ (drifted +2)     |
| tokens.css 394 vars                                      | **391 declarations / 258 unique**                | ≈ (counting method) |
| design-system.css 45 `--gtl-*`                           | **45**                                           | ✅                  |
| 11 of 12 pages double-layered                            | **11** (design-system.css on 11; redesign on 11) | ✅                  |
| tracker.html excluded from both                          | confirmed                                        | ✅                  |
| `tracker-pro-v4.css` dead (491)                          | **491, unreferenced by any page**                | ✅                  |
| 7 `data-theme` in tokens.css; 1/12 redesign handles dark | **7; only compare-redesign (1/12)**              | ✅                  |
| Test baseline 1282 (unconfirmed)                         | **stale — see §TL;DR for current**               | ❌ corrected        |
| Emoji: 0 HTML, 5 in src JS                               | **0 / 0**                                        | ❌ drifted (now 0)  |
| No icon sprite system                                    | **A sprite system now exists**                   | ❌ drifted          |
| RTL 208 logical vs 49 physical                           | 633 logical vs 58 physical (broader method)      | ≈ (same conclusion) |

---

## 9. Method & reproducibility

All figures were produced by deterministic measurement (no rendering required for the inventory):

- **Line counts / totals:** `find styles -name '*.css' -exec wc -l`.
- **Load chains:** parsed each page's `rel="stylesheet"` links, in order.
- **Token vars:** grep of `--*:` declarations in `tokens.css` / `design-system.css`.
- **`--gtl-*` surface, hard-coded hex, `data-theme`:** grep counts per file.
- **Selector coverage:** a Node corpus scan (`scratchpad/css-coverage.mjs`) that flags class
  selectors with no literal match across all `.html/.js/.mjs/.ts`. Kept in scratchpad — Phase 1 is
  audit-only; recommend committing it as `scripts/design/css-coverage.mjs` in Phase 2 when it drives
  the real quarantine.
- **Test baseline:** `npm test` (`node --test`, 204 test files, concurrency 1) on HEAD `4b299c4`.

## 10. "Before" screenshot grid — status

The 8-shot grid (EN/AR × light/dark × mobile/desktop) is captured by driving the Vite dev server
with Playwright: locale via the `?lang=ar` query param, theme via `data-theme` (set by
`src/components/nav.js`). The reproducible procedure is documented for the flagship surfaces
(`index.html`, `tracker.html`); capturing and archiving the PNGs is the one remaining Phase-1
sub-task (see `PHASE_LEDGER.md`). It was deprioritized this session in favour of the verifiable
inventory + baseline, which every later phase depends on.

---

_Phase 1 is audit-only: no product CSS/JS was modified. This document, `PHASE_LEDGER.md`, and the
plan file are the only artifacts._
