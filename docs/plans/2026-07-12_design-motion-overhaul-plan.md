# Design, Type & Motion Overhaul — Plan (plan-gate)

**Date:** 2026-07-12 · **Author:** Design Orchestrator (L0) · **Status:** proposed — **awaiting
owner direction pick before any lane starts.** **Audit:**
[`docs/audits/2026-07-12_design-motion-overhaul-audit.md`](../audits/2026-07-12_design-motion-overhaul-audit.md)
· **Ledger:** [`PHASE_LEDGER.md`](../../PHASE_LEDGER.md) · **Prior direction:**
[`GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md`](../design/GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md)

> **This is a consolidation-and-finishing overhaul, not a rebuild.** The audit established that
> GoldTickerLive already ships a mature, dual-theme, semantic-token "Editorial Bullion Terminal"
> system with self-hosted fonts, a live motion-JS layer, and a strong trust surface. The overhaul
> pays down the **6 documented debts** and adds **at most one bold signature**. A from-scratch
> aesthetic is explicitly not on the table.

---

## Directions

> _Populated from the design-directions workflow (3 independent directions + adversarial critique).
> The owner picks one here; L1 and L4 unblock on that pick._

Three directions were developed by independent design agents and stress-tested by an adversarial
trust reviewer. **All three share the same mandatory "consolidation spine"** (pay down the 6 debts);
they differ only in the **single bold signature** they add. So the owner's real choice is _which
signature (if any) rides on top of the consolidation._

|                     | **A — Consolidate the Instrument**                                                        | **B — The Assay Stamp**                                                                                                                | **C — The Tape**                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **One-liner**       | Keep the look; spend the budget killing the 6 debts + add the one missing catalogue item. | Strike the spot price into brushed metal so **freshness becomes a material property** (fresh catches light, stale goes cold + static). | A slow silent 15-market tape; your market pinned in gold, the world scrolling behind — **earn the name**. |
| **Signature**       | Hero sparkline **line draw-in**, endpoint reconciled to the exact spot value.             | The reference readout as a **hallmark in brushed metal**; specular light driven by the 6-state freshness key.                          | A cross-market **ticker tape** (≤40px, translateX, pause-on-hover, freezes when not live).                |
| **Risk / effort**   | YELLOW · L (high file-count, low-concept)                                                 | YELLOW · M (one new hero material)                                                                                                     | YELLOW · M (mostly reuse of shipped ticker CSS)                                                           |
| **New motion JS**   | ~0.4 KB gz                                                                                | ~1.1 KB gz                                                                                                                             | ~2.5 KB gz                                                                                                |
| **Debts it kills**  | **All 6** (it _is_ the consolidation)                                                     | All 6 + makes debt #5 its forcing function                                                                                             | Debts 1–4 (rides A's spine) + collapses 2 scrolling components                                            |
| **Adversarial fit** | **strong**                                                                                | moderate                                                                                                                               | weak                                                                                                      |

### A — Consolidate the Instrument _(the mandatory spine)_

- **Thesis:** the biggest trust threat here isn't the aesthetic — it's _self-contradiction_ (two
  token namespaces, parallel `base`/`redesign` stylesheets, two freshness renderers let the same
  price render two ways). Consolidation **is** the design work.
- **Palette/type:** change **zero** hexes and **zero** font files. Work is structural: collapse
  `--gtl-*` onto `--color-*`, DRY the duplicated dark block, replace 2 hardcoded chart hexes with
  theme tokens (so the chart finally flips in dark). Numeric face stays Source Sans 3
  tabular+lining+zero.
- **Signature — sparkline draw-in:** on load the price line strokes on from the inline-start,
  endpoint landing on the exact hero value (line and readout are the _same datum_). Animates
  `stroke-dashoffset` only, once, zero CLS; number never moves; RM writes the full line instantly;
  RTL flips the draw origin. ~0.4 KB gz. _(Non-negotiable nuance: `stroke-dashoffset` isn't
  literally transform/opacity — ships with a `clip-path` inset-wipe fallback if the perf gate
  insists.)_
- **Honest cost:** low perceived aesthetic payoff ("looks the same") despite large effort; the merge
  of 11 `-redesign.css` pairs is a real per-page visual-diff cost; a blind `--gtl-*` rename would
  shift the hero size/serif (a few tokens aren't clean aliases) → requires a
  resolve-to-computed-value token diff first.

```
LTR hero (unchanged look) — the one new moment is the sparkline drawing in:
  AED 4,821.30  ▲ +12.40 (+0.26%)     ← count-up + tint; NUMBER never moves
  ╱‾╲      ╱‾‾●  ← endpoint = 4,821.30  (draw-in once ≤700ms, dashoffset→0)
  24k · 22k · 21k · 18k                 spot ≠ retail (retail shown separately)
```

### B — The Assay Stamp _(most on-brand; highest-consequence)_

- **Thesis:** fuse the two things the site must always say — "this is the authoritative reference"
  and "this data is fresh right now" — into one **material read**. Fresh gold catches a warm
  specular that tracks the pointer; stale → the light drains cold and stops. Freshness literally
  _is_ the material's light.
- **Signature:** pure-CSS brushed-metal plate + `--rim-inset` bevel + a specular `::after` whose
  `translate3d`/opacity are driven by the existing 6-state freshness key. Only the specular moves;
  the number is ink on a higher fixed layer. ~1.1 KB gz pointer handler; bails under
  RM/save-data/no-JS.
- **Why the reviewer holds it back:** a textured plate _behind the LCP number_ is a live WCAG-AA /
  gold-on-light trap across 2 themes × 6 states, and a freshness-coupled moving specular means _any
  coupling bug animates a stale lie._ **Recommended as a gated phase-2 experiment**, not part of
  this overhaul — but its _thesis_ (one 6-state machine → one readout) is adopted as the forcing
  function that kills debt #5.

### C — The Tape _(earns the name; weakest fit)_

- **Thesis:** a product called GoldTicker should have a real ticker — but only as an _instrument_,
  not a marquee. Answers a job the hero can't: cross-market direction + where mine sits. Reuses the
  already- shipped `.market-summary-ticker` CSS; freezes + dims when not live (stillness = a
  freshness signal).
- **Why the reviewer rejects it:** it **reverses V2's settled decision** to retire the doubling
  mini-ticker; it's the _one place numbers translate_ (the pinned cell is the user's own number, in
  a moving band — the closest of the three to violating "the price number never slides"); it
  competes with the nav for the top of the viewport; and it needs per-cell freshness bookkeeping
  across 15+ markets — **maximum trust surface for minimum debt paydown.**

### Adversarial recommendation → **"Consolidate + Draw-In"**

> Ship **A** as the mandatory spine and adopt its sparkline draw-in as the single signature. Fold in
> **B's non-visual thesis only** (freshness = one 6-state machine feeding one readout) to force debt
> #5, but implement freshness as tokenized state changes, **not** a moving specular behind the LCP
> number. Hold B's full material as a **gated phase-2 experiment** behind the shipped
> `/styleguide.html` + an AA-contrast gate. **Reject C** — it reverses a settled product decision
> and puts moving numbers on a trust surface for the least debt paydown.

**Recommended lane order (from the critique):** L1 token-diff-then-merge `--gtl-*`→`--color-*`
(alone, green before anything else) → DRY the dark block + tokenize the 2 chart hexes → merge the 11
`-redesign.css` pairs (one page per PR, each gated on `/styleguide.html`) → unify the freshness
renderers (keep the disclosure affordance, **stale stays static**) → promote `/styleguide.html`
(noindex, sitemap-excluded) → **ship the sparkline draw-in last**, once the styleguide can
regression-test it.

**Trust watch-outs to guard the whole way:** resolve-to-computed-value token diff _before_ any
rename (a blind pass shifts hero size/serif); freshness must land all 6 states with **stale static**
and keep the "about this price" disclosure; the new styleguide route must be `noindex` +
sitemap-excluded + canonical-checked; un-deferring homepage dark exposes untested dark price states
on the highest-traffic page (gate on the 1623-test baseline + a11y 100); keep B's plate out of this
overhaul.

### Owner decision

Pick the signature to ride on the (mandatory, either-way) consolidation spine — see the decision
prompt. L1 and L4 stay `GATED_PENDING_OWNER` in the ledger until this is chosen.

---

## Lane plan (reality-adapted from master prompt §8)

Paths corrected (CSS in `styles/`, not `src/styles/`). Scope reflects the audit, not the stale "~390
pages" framing.

### L1 — Tokens & Theme 🔴 (foundation; must merge first)

- Reconcile the **two token namespaces**: standardize on `--color-*`/`--surface-*` + semantic
  aliases; migrate every `--gtl-*` consumer; delete `--gtl-*`.
- Finish **dark mode** as designed (not an inversion) across the surfaces where the homepage
  deferred it; reconcile with the dual-theme dark that shipped on the other branch.
- Fold in any palette/type-scale token changes the chosen direction requires.
- **No page migration in this lane.** Ship the foundation only. PR includes the WCAG AA contrast
  matrix (gold-on-light is the known trap).

### L2 — Typography 🟡 (mostly done — refinement)

- Fonts are already self-hosted + subset (≤180KB). Verify subsets still cover EN+AR glyph/figure
  needs.
- **Only if the chosen direction calls for it:** add a dedicated numeric/"ticker" face — must keep
  tabular-lining figures and stay within the font budget; prove a `111.11 → 888.88` tick with zero
  jitter.
- Preload exactly the 2 critical-path faces; `font-display: swap` (body) / `optional` (display).

### L3 — Motion System 🟡 (wiring + cleanup, not a build)

- **Wire or delete** the 4 dead keyframes (`gold-sweep`, `slide-in-start`, `fade-scale-in`,
  `heading-reveal`).
- Consolidate duplicated shimmer/hover rules; keep the ≤12KB gz new-JS budget (most of the system
  exists).
- Build the **2 missing catalogue items**: the signature load moment (owned with L4) and the chart
  line draw-in (owned with L6).
- Re-assert: transform/opacity only, zero CLS, RM in CSS **and** JS, RTL-direction-aware, price
  number never moves. Document every animation in `docs/design/MOTION.md`.

### L4 — Signature / Hero 🟡 (gated on direction pick)

- Build the single chosen signature and the hero around it. ≤900ms, non-blocking, does not delay
  LCP.
- Feature-detected with a static, beautiful, no-JS fallback. Works at 320px, in RTL, under
  reduced-motion.

### L5 — Data Components 🔴 (trust surface — highest care)

- **Unify the two freshness renderers** — retire `.gtl-provenance`'s 2-state/hardcoded-hex path onto
  the 6-state tokenized `.freshness-chip`. No off-token hexes on the trust surface.
- Preserve spot≠retail distinction and the glyph+sign+colour up/down encoding. Keep the throttled
  `aria-live` announcements. Do not de-emphasize any disclaimer/methodology link.

### L6 — Charts & Tools 🟡

- Chart line **draws in once** on first view (≤700ms `stroke-dashoffset`); never on live update.
  Last point reconciles to the exact hero value (ties to pricing-audit F-1).
- Migrate tool-page CSS (calculator/portfolio/compare/heatmap) onto tokens; colourblind-safe
  encoding.

### L7 — Page Consolidation 🟡 (the real "bulk" work — 11 pages, not 390)

- Merge each `page.css` + `page-redesign.css` pair → delete the fork. One PR per page (or small
  group).
- Grep-verify raw hex → 0 outside `tokens.css` on each migrated page; paste the count in the PR.
- **Do not touch any `<head>`** (title/meta/canonical/hreflang/JSON-LD are out of scope).

### L8 — RTL & i18n 🔴

- Convert the ~47 physical `left/right` props (excl. admin) to logical properties; paste
  before/after count.
- Direction-check every animation; Arabic type rhythm; correct numeral system per market (document
  it).
- Direction-implying icons mirror; clock/chart/logo/bar do **not**. Screenshot every changed page in
  `/ar/`.

### L9 — A11y, Perf & CI Gates 🟢 (referee)

- Wire Lighthouse CI + axe-core into Actions with the §2 budgets as **hard failures**
  (`lighthouserc.json` and `.pa11yci.js` already exist — extend, don't rebuild). Free tier only.
  Open issues against lanes that blow a budget; block their PRs.

### L10 — UX Copy 🟢

- One copy deck (`docs/design/COPY.md`) for freshness/empty/error/stale/offline, EN+AR (Arabic
  written, not machine-translated). Other lanes consume it; this lane edits no other files.

### L11 — Styleguide 🟢

- Promote `docs/design/reviews/styleguide.html` → shipped `/styleguide.html` (noindex,
  sitemap-excluded) covering **light+dark, LTR+RTL, all 6 freshness states, motion, chart states**.
  Write `docs/design/DESIGN_SYSTEM.md` as the living spec.

---

## Sequencing

1. **L1 merges first** (touches everything).
2. Then **L2 ∥ L3**.
3. Then **L4 ∥ L5 ∥ L6**.
4. Then **L7**.
5. **L8, L9, L10, L11** run continuously from the moment L1 lands.

**Never in parallel:** L1 with anything · L5 with L7 · L8 with L4.

---

## Verification gates (per PR — evidence, not assertions)

- `npm test` ≥ **1623 passing / 0 failing** · `npm run lint` · `npm run validate` · `npm run build`.
- `grep -rEn '#[0-9a-fA-F]{3,8}' styles/ --include=*.css | grep -v tokens.css | wc -l` — trend to 0;
  paste count.
- Lighthouse (mobile+desktop) + `@axe-core/cli` = 0 violations, committed under `docs/audits/`.
- Screenshots: mobile+desktop × EN+AR × light+dark (8 min) per PR.
- CPU-throttled (4×) 60fps proof for anything animated; a `prefers-reduced-motion` recording; RTL
  keyboard tab-through of any new interactive component.

---

## Guardrails (unchanged, non-negotiable)

Spot≠retail never styled the same · freshness first-class (never animate stale) · the price number
never moves · transform/opacity only, zero CLS · reduced-motion honored in CSS **and** JS · logical
properties + RTL-direction-aware motion · up/down never colour-only · ≤12KB gz new motion JS · dual
theme as tokens · self-host+subset fonts ≤180KB · Lighthouse Perf ≥90 / A11y 100 · **stay static**
(no framework). Financial invariants (peg 3.6725, troy 31.1035, karat ÷24, real data only) are
untouched by this presentation work.

---

## Appendix — L1 token-diff audit (the mandated precondition, run 2026-07-12)

**Owner pick: "Consolidate + Draw-In" (Direction A).** Before any `--gtl-*`→`--color-*` rename, the
critique required resolving every `--gtl-*` to its computed value. Done — and it **overturns
Direction A's optimistic "value-identical aliases" claim.** `--gtl-*` is defined in
`styles/design-system.css` (45 tokens); consumed **469×** across 14 files (`home-redesign.css` 222,
`methodology-redesign.css` 52, `glossary-redesign.css`/`market-redesign.css` 25 each,
`dubai-gold-price-redesign.css` 22, `learn-redesign.css` 21, `price-provenance.css` 5,
`styleguide.html` 21, + smaller).

**Class 1 — 13 clean colour aliases → mechanical rename, zero visual risk:**
`--gtl-paper`→`--color-bg` · `--gtl-surface`→`--color-surface` · `--gtl-ink`→`--color-text` ·
`--gtl-ink-muted`→`--color-text-muted` · `--gtl-ink-faint`→`--color-text-faint` ·
`--gtl-ink-data`→`--color-ink-data` · `--gtl-gold`→`--color-gold` ·
`--gtl-gold-deep`→`--color-gold-dark` · `--gtl-gold-soft`→`--color-gold-tint` ·
`--gtl-line`→`--color-border` · `--gtl-line-soft`→`--color-border-subtle` ·
`--gtl-up`→`--color-move-up` · `--gtl-down`→`--color-move-down`.

**Class 2 — ~32 independent scale tokens that DIFFER from `tokens.css` → a decision, not a rename:**

| `--gtl-*`                                                  | Value                                    | Nearest `tokens.css`                           | Verdict                                               |
| ---------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `--gtl-price-hero`                                         | `clamp(3.25rem, 2.2rem+4.6vw, 6.5rem)`   | `--text-data-xl clamp(2.6rem,5vw,3.9rem)`      | **DIFFERS** — blind rename shrinks the hero price.    |
| `--gtl-display-1/2`, `-title`, `-body`, `-meta`, `-kicker` | editorial fluid scale (kicker `0.72rem`) | `--text-*` modular 1.25                        | **DIFFERS** — separate scale; not mapped.             |
| `--gtl-9` / `--gtl-10` (spacing)                           | `96px` / `128px`                         | `--space-9 80px` / `--space-10 96px`           | **DIFFERS** — off-by-one at the top of the scale.     |
| `--gtl-r-sm/md/lg`                                         | `10/14/18px`                             | `--radius-sm/md/lg 8/12/16px`                  | **DIFFERS** — 2px larger each.                        |
| `--gtl-maxw`                                               | `1180px`                                 | `--content-max-width 1280px`                   | **DIFFERS** — 100px narrower.                         |
| `--gtl-ease`                                               | `cubic-bezier(.2,.7,.2,1)`               | `--ease-premium cubic-bezier(.16,1,.3,1)`      | **DIFFERS** — different curve.                        |
| `--gtl-serif`                                              | `…,'Iowan Old Style',Georgia,serif`      | `--font-serif-display …,'Cairo',georgia,serif` | **DIFFERS** — Iowan vs Cairo fallback (RTL-relevant). |
| `--gtl-measure`, `--gtl-shadow-1/2`, `--gtl-t-*`           | `66ch`, custom shadows, 120/200/320ms    | (no direct token)                              | **NEW** — no equivalent.                              |

**Consequence for L1 (revised, decision-ready):** L1 is **not** a mechanical rename. The correct L1
is:

1. Rename the **13 Class-1 aliases** mechanically (safe, do first).
2. For **Class 2**, make a per-family call: the `--gtl-*` editorial scale is the _newer, chosen_
   redesign language, so **promote it into `tokens.css` as canonical** (add the editorial type
   scale, `66ch` measure, and reconcile spacing/radii) rather than snapping redesign pages back to
   the older values — OR alias each `--gtl-*` to the nearest token and **accept + screenshot the
   per-page visual delta**. Either way it requires a decision per family and per-page visual
   diffing; it is **not** blind.
3. `--gtl-serif`: keep one serif stack; retain the `Cairo` fallback (RTL coherence) over
   `Iowan Old Style`.

This is why the ledger keeps **L1 as its own gated lane/PR** (RED), not a task folded into this
session. The audit means the L1 session can execute with eyes open instead of shipping a silent
hero-size/serif shift.
