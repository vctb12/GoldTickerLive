# Design Audit — Gold Ticker Live

**Branch:** `cursor/design-feel-revamp-4d4a` (based on `main`, 2026-06-27)  
**Agent:** Cursor design-feel revamp (presentation layer only)  
**Status:** Audit complete — **awaiting owner approval before any styling implementation**

---

## Coordination notes

| Item | Detail |
|------|--------|
| PR #443 branch | `claude/elegant-cori-lyo379` is **ahead of `main`** — its work is **not** on `main` yet. Rebase this design branch after #443 merges. |
| Collision surface | PR #443 also touches `styles/partials/tokens.css`, `styles/pages/home.css`, `styles/order.css`, `styles/city-page.css`, `src/components/chart.js`, and many HTML files. Prefer new token aliases / page-scoped overrides over editing the same lines #443 changes. |
| Test baseline | Not re-run for this audit turn (audit-only). Baseline on `main`: **1081 passing** per brief. |
| Screenshots | `docs/audit-screenshots/` — 20 full-page captures + `homepage__desktop-1440__en-v2.png` (hero, SW blocked). Captured against local Vite `:5000` with ~3.5s hydration wait. |

### Screenshot inventory

| Screen | EN desktop | EN mobile | AR desktop | AR mobile |
|--------|------------|-----------|------------|-----------|
| Homepage `/` | ✓ | ✓ | ✓ | ✓ |
| Country `/countries/uae/` | ✓ | ✓ | ✓ | ✓ |
| City `/countries/uae/dubai/gold-rate/` | ✓ | ✓ | ✓ | ✓ |
| Order `/content/order-gold/` | ✓ | ✓ | ✓ | ✓ |
| Chart `/chart/` | ✓ | ✓ | ✓ | ✓ |

**VERIFIED (screenshots):** EN desktop homepage hero, country UAE, city Dubai gold-rate, order-gold, chart — see `docs/audit-screenshots/`.  
**UNVERIFIED / ASSUMED:** AR RTL layout quality — automated captures did not reliably confirm `dir="rtl"` / translated headings on all city templates; manual RTL walk still required in Area E.

---

## Scoring key

Each dimension scored **1–5** (1 = hurts trust/feel, 5 = premium). Scores reflect **current `main`**, not planned fixes.

---

## 1. Homepage (`/`)

**Files:** `index.html`, `styles/pages/home.css`, `styles/partials/tokens.css`, `src/pages/home.js`

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 3 | Display serif (`--font-display`: Georgia stack) + Cairo feels like two brands; EN body lacks a dedicated Latin workhorse. |
| Spacing / rhythm | 3 | Hero padding generous but left column is text-heavy before price; section gaps inconsistent below fold. |
| Colour & contrast | 4 | Warm parchment palette is cohesive; green spot price on closed market reads as “live” (semantic mismatch). |
| Visual hierarchy | 3 | H1 competes with spot card; cached banner + card footer both carry freshness → duplicated noise. |
| Price display | 4 | Large tabular `hlc-price` is strong; change row often hidden when closed; timestamp pill is tiny (0.67rem). |
| Charts | 3 | Home chart section exists below fold; not audited in hero screenshot. |
| Mobile layout | 3 | Long hero copy before price card on narrow viewports (see mobile captures). |
| RTL | 3 | AR desktop capture taken; full parity not verified this turn. |
| Motion / feedback | 3 | Skeleton → price swap present; pulse on live freshness is good; little hover depth on secondary links. |
| Trust signals | 3 | Signals exist but fragmented: sticky cached bar, micro footer chip, separate trust lines. |
| Perceived speed | 4 | Skeleton reserves price height (good CLS guard); Google Fonts CDN still adds latency risk. |

### Top 3 issues (worklist)

| # | Issue | File:line | Impact |
|---|-------|-----------|--------|
| **H1** | **Freshness / source attribution is split across three UI zones** (sticky `home-freshness-bar`, micro `hlc-updated` pill at 0.67rem, duplicate “Closed • Source…” line). Reads as clutter, not confidence. | `styles/pages/home.css:764-781`, `styles/pages/home.css:2400-2414`, `index.html:157-168` + `266-274` | Trust — users must hunt for honest state |
| **H2** | **Hero headline typography (serif display) diverges from data UI (Cairo/mono)** — editorial luxury vs fintech terminal, not one authoritative product. | `styles/partials/tokens.css:189-194`, `styles/pages/home.css:206-234` | Perceived quality — “template mashup” |
| **H3** | **Spot price uses live-green styling while market is closed** — colour implies real-time when badge says closed/cached. | `styles/pages/home.css:519-527` (+ runtime classes from `home.js`) | Trust — freshness honesty |

---

## 2. Country page (`/countries/uae/`)

**Files:** `countries/uae/index.html`, `styles/country-page.css`, `countries/country-page.js`

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 3 | Duplicate `.cp-hero-title` rules (1.15rem then clamp override); table headers at 0.72rem. |
| Spacing / rhythm | 4 | 860px max-width rhythm is decent; tools row wraps tightly on mobile. |
| Colour & contrast | 4 | Gold accents restrained; reference vs retail intel card is a good pattern. |
| Visual hierarchy | 3 | H1 smaller than price cards; intelligence grid rivals hero prices. |
| Price display | 3 | `cp-price-value` clamp 1.25–1.75rem — **much smaller than homepage** for same reference product. |
| Charts | — | N/A on this page |
| Mobile layout | 4 | 2-col price grid adapts; table scroll on narrow widths. |
| RTL | 3 | Not fully verified this turn. |
| Motion / feedback | 3 | Card hover lift is nice; no price-change animation on country hero. |
| Trust signals | 3 | `cp-update-time` at 0.72rem tertiary — easy to miss under cards. |
| Perceived speed | 4 | Skeletons in price cards on first paint. |

### Top 3 issues

| # | Issue | File:line | Impact |
|---|-------|-----------|--------|
| **C1** | **Country hero prices undersized vs homepage spot terminal** — same reference data, weaker authority. | `styles/country-page.css:136-143` (cf. `styles/pages/home.css:519-527`) | Hierarchy — price is the product |
| **C2** | **Page title (`cp-hero-title`) visually subordinate to price cards** — duplicate/conflicting title rules. | `styles/country-page.css:53-57`, `styles/country-page.css:905-910` | Hierarchy |
| **C3** | **Freshness/source line buried** (`cp-update-time` 0.72rem, tertiary colour) below dominant cards. | `styles/country-page.css:157-160`, `countries/country-page.js:234` | Trust |

---

## 3. City page (`/countries/uae/dubai/gold-rate/`)

**Files:** `countries/uae/dubai/gold-rate/index.html` (representative of 100+ generated city gold-rate pages), `scripts/node/consolidate-country-pages.js`

> Note: City **hub** stubs (`/countries/uae/dubai/`) use `countries/stub-city.css` and are intentionally minimal. This audit targets the **gold-rate** surface users actually price-shop on.

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 2 | Inline `font-size` / colours, not token scale. |
| Spacing / rhythm | 2 | Ad-hoc `1.5rem` / `1rem` inline spacing; no shared section rhythm. |
| Colour & contrast | 2 | Hardcoded Tailwind slate (`#64748b`, `#94a3b8`) — **off-palette** vs warm parchment system. |
| Visual hierarchy | 2 | Flat cards; H1 inline styles; no hero treatment. |
| Price display | 3 | Karat cards functional after hydration; no tabular scale, no direction chip. |
| Charts | — | N/A |
| Mobile layout | 3 | Auto-fit grid works; bottom nav overlaps long footer (see mobile capture). |
| RTL | 2 | FAQ `summary::after { float: right }` — physical property, won’t mirror. |
| Motion / feedback | 2 | “Loading live prices…” static text; no skeleton. |
| Trust signals | 3 | Disclaimer yellow box present but emoji-heading (“📖”) feels informal. |
| Perceived speed | 2 | Loading state is plain text, not skeleton shimmer. |

### Top 3 issues

| # | Issue | File:line | Impact |
|---|-------|-----------|--------|
| **X1** | **City gold-rate pages bypass the design system** — extensive inline styles + slate hex colours instead of `tokens.css` / `country-page.css`. | `countries/uae/dubai/gold-rate/index.html:192-237` (pattern in `scripts/node/consolidate-country-pages.js:154-160`) | Feel — reads as unfinished / cheap |
| **X2** | **Visual discontinuity vs country hub** — UAE country page uses `cp-hero` + polished cards; city page looks like a different product. | Compare `countries/uae/index.html:119-144` vs `countries/uae/dubai/gold-rate/index.html:195-215` | Trust + hierarchy |
| **X3** | **RTL bug in city FAQ accordion** — `float: right` on disclosure icon. | `countries/uae/dubai/gold-rate/index.html:112-116` | RTL — bilingual quality |

---

## 4. Order page (`/content/order-gold/`)

**Files:** `content/order-gold/index.html`, `styles/order.css`

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 3 | Step labels 0.72rem; hero title uses display stack — OK but steps feel administrative. |
| Spacing / rhythm | 4 | 780px column, clear step cards. |
| Colour & contrast | 4 | Gold pills for active state; info notice readable. |
| Visual hierarchy | 3 | Reference price badge in hero disconnected from Step 3 total box. |
| Price display | 3 | Badge shows live AED/g; breakdown totals stay `—` until city chosen — looks broken. |
| Charts | — | N/A |
| Mobile layout | 4 | Pill groups wrap; qty control usable. |
| RTL | 3 | Not fully verified. |
| Motion / feedback | 2 | Pills toggle instantly; no calc result animation. |
| Trust signals | 4 | “Not a marketplace” notice is prominent (good). |
| Perceived speed | 3 | Hero price hydrates; total area empty state is weak. |

### Top 3 issues

| # | Issue | File:line | Impact |
|---|-------|-----------|--------|
| **O1** | **Price total breakdown shows em-dashes until city select** — empty state reads as error, not guided next step. | `content/order-gold/index.html` (total section), `styles/order.css:84-107` | UX trust |
| **O2** | **Hero price badge styling doesn’t match sitewide price terminal** — isolated gold pill vs authoritative numeric display. | `styles/order.css:58-71` | Hierarchy / consistency |
| **O3** | **Step labels too small (0.72rem caps)** — workflow feels like fine print, not premium wizard. | `styles/order.css:93-100` | Typography |

---

## 5. Chart page (`/chart/`)

**Files:** `chart/index.html`, `styles/pages/chart.css`, `src/components/chart.js`

| Dimension | Score | Notes |
|-----------|-------|-------|
| Typography | 3 | Page title plain; chip labels OK after Phase 57 polish. |
| Spacing / rhythm | 4 | Clear control groups; stats grid tight on mobile. |
| Colour & contrast | 3 | Token-themed chart.js reader exists; TradingView watermark adds noise. |
| Visual hierarchy | 2 | No bound live price hero; chart is the only focal point. |
| Price display | 2 | Y-axis tick range in screenshot shows ~2800–5600 AED band while spot cards show ~483 AED/g — **visually untrustworthy**. |
| Charts | 2 | Themed area chart but scale/units appear wrong in capture; bottom ticker shows `UNKNOWN`. |
| Mobile layout | 3 | Controls stack; chart height 50vh on small screens. |
| RTL | 3 | Not fully verified. |
| Motion / feedback | 2 | Chip active state only; no loading shimmer on canvas. |
| Trust signals | 2 | `chart-meta` is small; ticker unknown state undermines page. |
| Perceived speed | 3 | Large canvas; empty/loading not styled. |

### Top 3 issues

| # | Issue | File:line | Impact |
|---|-------|-----------|--------|
| **R1** | **Chart Y-axis scale appears inconsistent with AED/gram reality in screenshot** — users will distrust all numbers on-site. | `src/components/chart.js` (data binding / `setCustomData`), `chart/index.html:84-110` | **Block-level trust** — likely needs owner review (data logic may be out of presentation scope) |
| **R2** | **No price hero / freshness chip bound to chart** — chart floats without the “authoritative number + updated X ago” pattern used on home. | `chart/index.html:82-110`, `styles/pages/chart.css:1-12` | Hierarchy |
| **R3** | **Empty / loading / error states are plain text** — `chart-empty` unstyled vs skeleton system elsewhere. | `styles/pages/chart.css:74-77` | Perceived quality |

---

## Cross-cutting findings (foundation for Area A)

| Theme | Evidence | Priority |
|-------|----------|----------|
| Token sprawl vs usage | Rich `tokens.css` (type scale, semantic colours) but components still use magic `0.72rem`, `#64748b`, inline styles | **A** |
| Single font stack | Cairo for everything; Latin display uses system serif — no self-hosted paired Arabic/Latin family | **A** |
| Price component fragmentation | `.hlc-price`, `.cp-price-value`, `.order-price-badge`, city inline cards — four treatments | **B** |
| City template debt | `consolidate-country-pages.js` emits non-token HTML for 100+ pages | **C + E** |
| PR #443 overlap | Same CSS files targeted — coordinate merges | **Process** |

---

## Recommended work sequence (matches brief §5)

| Area | Scope | Primary files (avoid #443 conflicts where possible) |
|------|-------|-----------------------------------------------------|
| **A** | Tokens + type system | `styles/partials/tokens.css`, `styles/partials/base.css`, font assets |
| **B** | Unified price display | `styles/partials/components.css` (new `.price-hero` primitive), `home.css`, `country-page.css`, `order.css` |
| **C** | Hierarchy + layout | `home.css`, `country-page.css`, table partials |
| **D** | Chart theming | `styles/pages/chart.css` — **chart data scale → `OPEN_FOR_OWNER.md`** |
| **E** | Mobile + RTL | `city-page.css`, city template markup (via generator proposal), logical props sweep |
| **F** | Motion | `styles/partials/motion-advanced.css`, price pulse tokens |
| **G** | Trust elevation | freshness chip component styles (shared) |
| **H** | Performance | font preload/self-host in HTML shells |

---

## Stop line

**No styling changes have been implemented.** Awaiting approval of this audit before Area A.

**Next step after approval:** Area A plan (tokens + typography) as a short bullet proposal → implement → before/after screenshots → `npm test`.
