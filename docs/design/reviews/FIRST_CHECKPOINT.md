# First Checkpoint — Visual Transformation Program

**For owner review before any homepage implementation.** Prepared by Claude (coordinator + visual
gate). This is the complete design-review package. **I have not started homepage code** — per your
final sequence instruction, I stop here and wait for approval.

**Where everything lives (open these):**

- Visual delta audit →
  [`docs/audits/2026-07-10_VISUAL_TRANSFORMATION_AUDIT.md`](../../audits/2026-07-10_VISUAL_TRANSFORMATION_AUDIT.md)
- Visual Direction V2 (+ benchmark synthesis) →
  [`docs/design/GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md`](../GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md)
- **Before** screenshots (107 PNGs, desktop+mobile, EN+AR) →
  [`docs/design/reviews/before/`](./before/)
- **Concept** mockup (interactive HTML + renders) → [`docs/design/reviews/concepts/`](./concepts/)
  (`homepage-hero-concept.html`, `concept_home_desktop_en.png`, `concept_home_mobile_en.png`)
- Protected checkpoint: branch `design/visual-transformation-checkpoint-2026-07-10`, tag
  `pre-visual-transformation-2026-07-10` @ `d9c5d7d25`.

---

## 1. Benchmark synthesis + principles extracted

Full table in Direction V2 §I. Headline: I studied _why_ TradingView, Bloomberg, Apple, Stripe,
Linear, Arc, Vercel, Notion, Airbnb, Revolut, Coinbase, XE, Wise, Kitco, FT, The Economist, Apple
Weather, Flighty, Polygon.io and Raycast feel premium, and extracted the **principle** from each
(not the look): chart-as-product, one-idea-per-screen, density-as-trust, single-accent restraint,
motion-with-purpose, consumer-finance legibility. **Synthesis:** none of them sits where we do — the
intersection of **market terminal + buying assistant + education + luxury commodity + trusted
reference**. Our original language is an **editorial bullion terminal**: terminal precision,
editorial calm, consumer warmth, restrained material gold. Nobody should think "Stripe/Coinbase" —
they should think "GoldTickerLive."

## 2. GoldTickerLive design principles (philosophy)

Direction V2 §II. In one breath: **the price is the protagonist; one idea per screen; density is a
feature and clutter is a bug; say the disclaimer once; material not decoration; motion must mean
something; designed in Arabic not mirrored; bilingual/accessible/fast are invisible constraints.**

## 3. Information architecture — before vs after

- **Before:** every page = the same template (serif H1 → gold eyebrow → spot/freshness badge →
  disclaimer paragraph → card grid). Tools sit below the fold behind trust chrome. Tracker is a dark
  orphan; the rest is light. Disclaimers repeat 4–5×/page.
- **After:** a small set of **distinct block types** (hero · data-feature · editorial-rail ·
  comparison · teach) composed differently per page so each surface is recognizable; the tool leads;
  one shared surface/type/motion system across light **and** a first-class dark theme; disclaimer
  stated once per surface.

## 4. Homepage user journey — before vs after

- **Before:** land → read a serif headline → look at a price card → scroll ~7,300px past repeated
  card rows with no narrative → maybe reach tools. No arc.
- **After (the journey, Direction V2 §IV):** **current price → what it means for me → check my karat
  → calculate value → compare markets → find a shop → learn → return.** Each section ends by
  pointing at the next step, so the homepage feels like one guided experience.

## 5. Components to REMOVE

- The top X-follow strip **and** the separate mini-ticker double-bar (the same numbers three times).
- Duplicate spot-vs-retail disclaimer blocks (keep one per surface).
- The "header + hero-left + spot-card-right" hero construction.
- Redundant pointer text ("View all karat prices below").
- The three-way karat duplication (karat strip + "prices by karat" + ticker) → one authoritative
  karat presentation.
- Calculator's stacked preamble (title + market-status card + methodology paragraph + feature
  checkmarks) above the tool.

## 6. Components to REDESIGN (carry forward, rebuilt)

- **Live price** → the _living price hero_ (protagonist, tabular ticker face, odometer tick).
- **Chart / sparkline** → one chart language; last point reconciles to canonical spot (pricing F-1).
- **Karat cards** → the **karat ladder** (interactive, teaches ÷24).
- **Country list / compare table** → designed comparison with length-encoded bars + "cheapest
  market" reveal.
- **Freshness badges + status chips** → a single **freshness object** (source · timestamp · state
  via status-dot pulse).
- **Learn card grid** → a publication front page (feature lede + rail).
- **Nav** → keep + add a persistent price pill (desktop) / sticky market summary (mobile); redraw
  the "G" mark.
- **Tracker dark terminal** → promoted into the shared **dark theme** for the whole site.

## 7. Completely NEW components to introduce

Animated ticker/price with **odometer tick**; **karat ladder**; **"what's it worth" instant** (grams
→ your-karat value inline on the homepage); **market-pulse status dot**; **cheapest-market reveal**
(compare re-rank); **editorial article rail** (learn); **contextual insight panel** ("is today high
or low?"); **sticky mobile market summary**; **expandable live-price sheet** (mobile); **designed
skeleton/empty/error/stale/offline** states; **reduced-motion-aware animated numbers**.

## 8. Motion philosophy

Direction V2 §XIII. Timing scale `fast 120 / base 200 / slow 320ms`, decelerate easing; **every
animation encodes information** (tick = changed, roll direction = up/down, pulse = live vs stale);
subtle and short; **signature = "the tick"** (odometer roll + gold underline sweep). Reduced-motion:
tick→crossfade, reveals→instant, transitions→cut; never less usable, content never gated behind
motion (today's site already passes this; we keep the contract).

## 9. Mobile philosophy

Direction V2 §XI. Designed for the phone, not a squeezed desktop: single-column composition, price
leads with one line of meaning (mobile currently has no hero narrative), thumb-reachable primary
action, keep + refine the bottom tab bar (its best asset), sticky market summary, expandable price
sheet, ≥44px targets. See `concept_home_mobile_en.png`.

## 10. Arabic / RTL philosophy

Direction V2 §XII. Compose **in** Arabic (real Arabic display face, tuned heading rhythm/line
length), mirror **logically** (start/end) but **re-balance** proportions because Arabic headlines
run longer, bidi-isolate LTR numerals so `4,108.70 $` never reorders, and verify **every** signature
moment in AR. Today's AR is a correct but mechanical mirror — that's the gap.

## 11. Typography system

Direction V2 §VII. Editorial serif display + humanist sans UI + a **tabular "ticker" numeral face**
as the brand signature (self-hosted woff2, no CDN). Fluid `clamp()` scale, real size contrast so
hierarchy doesn't depend on the serif alone, one consistent (sparing) kicker treatment,
tabular-lining numerals everywhere prices appear.

## 12. Color & material system

Direction V2 §VIII. Warm **ink on paper** (not pure white), **one** assay-gold accent, accessible
up/down pair (never color-only), reserved brushed-metal/leaf **material** on the price + karat
medallions. **Dark mode first-class** (tracker's terminal becomes the shared dark theme). Tokens
listed for both themes; hues finalized against WCAG AA in build.

## 13. Trust-building strategy

Direction V2 §XIX. Trust from **craft + precision + honesty**: one freshness object per surface, the
disclaimer once and well, real sources named (Gold-API.com · LBMA baseline · fixed 3.6725 peg),
methodology one click away, and **zero** fabricated prices/testimonials/countdowns/urgency/"AI
insights." Make a jewellery buyer feel safe relying on it before a shop visit.

## 14. Accessibility strategy

Direction V2 §XX. WCAG AA contrast, visible gold keyboard-focus on every control, up/down encoded
with shape+sign, `<main>` on every page (incl. offline, audit F-9), reduced-motion honored, RTL
correctness, ≥44px targets, existing a11y tests respected + new-component coverage added.

## 15. Performance strategy

Direction V2 §XXI. Self-host + subset fonts (no external/CDN calls — matches repo constraint +
privacy), transform/opacity-only motion, lazy below-fold charts, no framework (stay static Vite).
LCP < 2.5s mid-mobile, CLS ~0 by reserving price/chart space (fixes the shift the audit flagged).
Verified in the **production** build.

## 16. Before screenshots (desktop + mobile, EN + AR)

In [`before/`](./before/). Flagship set: `home_desktop_en_fold.png`, `home_desktop_en_crop1..7.png`
(below-fold sweep), `home_mobile_en_fold.png`, `home_desktop_ar_fold.png`, plus calculator, compare,
tracker, learn, shops, country, glossary, market, heatmap, portfolio, and `nav-menu_mobile_en/ar`.
Full production build, both viewports, both languages, reduced-motion and normal.

## 17. Proposed visual concepts

[`concepts/homepage-hero-concept.html`](./concepts/homepage-hero-concept.html) (self-contained,
openable) + renders `concept_home_desktop_en.png` / `concept_home_mobile_en.png`. The concept
demonstrates: **the price as protagonist** (huge tabular ticker numerals, raised gold `$`),
editorial headline with italic gold emphasis, persistent nav price-pill, **one** primary gold CTA +
ghost secondary, the **"what's it worth"** meaning line, sparkline, the **karat ladder** signature
moment, market-pulse dot, and the disclaimer stated **once**. Mobile is price-first with the bottom
tab bar. Every number uses the **real** reference values (485.13 / 444.70 / 424.49 / 363.85, peg
3.6725, troy 31.1035) — no fabricated data. It is a **concept**, not the implementation.

## 18. Rationale behind every major decision

| Decision                                                 | User problem                                     | Why the old way was weaker                            | Alternatives considered              | Why this wins                                                                            |
| -------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Price becomes the hero (not a side card)                 | "What's gold worth right now?" is the #1 job     | Header+card buries the one thing they came for        | keep card but enlarge; carousel hero | The price _is_ the product; making it the protagonist answers the job in <5s             |
| Odometer "tick" as motion signature                      | Is this live? did it change? up or down?         | Static number + a badge doesn't convey liveness       | color flash only; pulsing card       | Motion that _encodes_ the change is memorable **and** informative; degrades to crossfade |
| Karat ladder replaces karat card row                     | "What's _my_ karat worth?" + learning ÷24        | Identical card row = generic, static, teaches nothing | dropdown; table                      | Interactive ladder answers the question and teaches purity by feel — a signature moment  |
| Disclaimer once per surface                              | Trust without noise                              | Repeated 4–5×/page reads as clutter, erodes trust     | tooltip-only; footer-only            | One precise statement + "how retail differs →" builds more trust than repetition         |
| One surface/type/motion system incl. first-class dark    | Coherent, premium product feel                   | Tracker dark orphan; rest light; no system            | keep tracker unique; all-light       | A single family everywhere is what makes Apple/Linear feel premium                       |
| Arabic composed, not mirrored                            | Half the audience deserves a designed experience | Mechanical mirror ignores Arabic type rhythm          | machine-mirror + font swap only      | Designed-in-Arabic is table stakes for a GCC-first product                               |
| Tool-first pages (calculator/compare lead with the tool) | Get the answer in one interaction                | ~700px of chrome before the first input               | collapsible chrome above             | Leading with the tool respects intent; trust copy stays, quietly                         |
| Self-hosted subset fonts, no CDN                         | Fast + private                                   | External font calls add latency + a privacy surface   | Google Fonts CDN                     | Matches repo's no-external constraint, improves LCP, removes a tracker                   |

---

## Build & governance plan

**Branch/PR strategy.** One cohesive feature branch + **one primary PR per page**, small supporting
commits allowed, **never** fragmented into dozens of tiny visual PRs. Naming: `redesign/home`,
`redesign/calculator`, … Each PR ships with a review package in `docs/design/reviews/<page>/`
(before/after desktop, before/after mobile, EN + AR, removed/redesigned/new components, new
interactions, perf impact, remaining compromises) and must pass the **Visual Acceptance Gate**
(unmistakable before/after delta; desktop **and** mobile intentional; EN **and** AR polished;
stronger hierarchy/fewer repeats; motion works in the **production** build; reduced-motion usable;
no horizontal overflow; invariants correct; owner grasps the improvement in 5 seconds). I reject
work — mine or a worker's — that's CSS-only reskin, more cards, purposeless animation,
squeezed-desktop mobile, mirrored Arabic, or invisible tech claimed as transformation.

**Build order.** Home (flagship, proves the system) → calculator → compare → tracker → country/GCC →
shops → learn → glossary/market/heatmap → nav/search/footer/mobile-nav/transitions → shared states →
final cross-site consistency + motion audit. Frequent per-component before/after checkpoints, not
long silent stretches.

**Conflicts with existing PRs.** **None.** Open-PR backlog is **0** (post-convergence). The 60-phase
plan is **HELD**; no Part-V execution has started. This program supersedes the "visually
insignificant" phase conveyor while preserving all merged correctness/pricing/i18n/a11y/testing work
and every invariant.

**Guardrails reaffirmed.** Real data only; peg 3.6725 / troy 31.1035 / karat ÷24 / spot≠retail; no
fabricated prices/testimonials/urgency/AI-insights; accessible + reduced-motion; production-build
evidence; bilingual EN+AR; flags/pilots OFF; never push/force-push `main`; never merge red.

---

### ⏸ Stopping here for owner review

Per your final instruction, I am **not** starting homepage code. On your **approve**, I begin the
flagship homepage build on `redesign/home` with frequent before/after per-component checkpoints. If
you want changes to the direction, palette, the identity concept, or the build order, tell me and
I'll revise this package first.
