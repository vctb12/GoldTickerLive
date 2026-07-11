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
- **Concept** mockups (interactive HTML + renders) → [`docs/design/reviews/concepts/`](./concepts/):
  three explored directions — **A Living Terminal** (`homepage-hero-concept.html`,
  `concept_A_living_terminal_desktop.png`, `concept_home_mobile_en.png`), **B Market Story** & **C
  Value-First** (`homepage-alternatives.html`, `concept_B_market_story_desktop.png`,
  `concept_C_value_first_desktop.png`). Evaluated in **Part B4–B5** below; recommendation =
  A-synthesis.
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

---

# Part B — Final QC (adversarial review before presenting)

The brief is frozen; this section is the uncompromising quality gate applied to my own proposal. I
put on an **independent senior design team hat with permission to reject**, tried to break the
direction, explored genuinely different alternatives, and scored everything honestly. Where a
category was merely "good enough," it's called out with a concrete plan — nothing below is
hand-waved.

## B1 — Internal design review (I tried to break it)

Hunting for weakness in the proposed direction and Concept A. **Findings against my own work:**

1. **"Split hero" is itself a dashboard cliché.** A left-copy / right-data-panel hero is common
   (Stripe, dozens of SaaS). _Risk:_ looks generic. _Fix:_ the identity has to come from the
   **numeral treatment + the tick motion + material gold**, not the split. I'll also test a
   **single-column** hero where the price is centered and huge (closer to Apple Weather) so the
   split isn't load-bearing.
2. **Karat ladder can read as "just another card row."** Four boxes in a row is exactly the pattern
   I'm criticizing. _Fix:_ it must be visibly **interactive and connected** (a real slider/segmented
   control that re-rolls the value, with a connecting rail), not four static tiles. If it can't feel
   alive, it becomes a single karat selector + one big value, not a row.
3. **Odometer tick risks being a gimmick.** Rolling digits can feel toy-ish and, worse, make a price
   _harder_ to read for a second. _Fix:_ roll only the digits that changed, ≤220ms, never on first
   paint; if it ever reduces readability in testing, downgrade to a tint-flash. Reduced-motion
   already crossfades.
4. **Two headlines competing.** The serif editorial H1 _and_ the giant numeral both want to be the
   focal point. _Fix:_ pick one focal point per breakpoint — on desktop the **number** wins and the
   headline is a kicker-scale line; the current concept slightly over-weights the serif H1.
5. **Warm-paper + gold can drift "heritage/luxury cliché"** (generic jeweller sites). _Fix:_ keep
   gold to hairlines/accents/one material moment; lean on **ink + generous whitespace + editorial
   type** for modernity. The moment it gets gradient-heavy it dies.
6. **Journey is asserted, not yet shown.** I claim a guided arc but the concept only shows the hero.
   _Fix:_ the section directly under the hero must be the **audience-routing band** (buying /
   comparing / holding) — the journey's first fork — and it must exist in v1, not "later."
7. **Arabic is still under-proven.** I have EN concepts; AR is described, not designed. _Fix:_ the
   homepage PR must ship an **AR-composed** hero (not mirrored), reviewed with the same scoring, or
   it fails its own gate.
8. **Density vs. calm tension.** "Density is a feature" (terminal) and "one idea per screen" (Apple)
   can conflict. _Resolution:_ density lives on **tracker/compare**; the **homepage** stays calm —
   it's the front door, not the terminal. Stated explicitly so implementation doesn't over-stuff it.

**What I changed/tightened before presenting:** promoted the audience-routing band into v1 (was
"later"); demoted the serif H1 relative to the numeral on desktop; constrained the tick to
changed-digits-only with a readability kill-switch; required the karat ladder to be genuinely
interactive or collapse to a selector; required an AR-composed hero in the homepage PR; and
explicitly assigned "calm" to the homepage vs "dense" to tracker/compare.

## B2 — Confidence assessment (per homepage section, 1–10)

Scored for the **recommended A-synthesis** layout. Any category **< 9** carries a reason + a
concrete plan. Scores are honest pre-build estimates — several are intentionally below 9 because
they're unproven until built.

| Section                                        | Visual | Usab. | Orig. | Perf. | A11y  | Trust | Mobile |  RTL  |
| ---------------------------------------------- | :----: | :---: | :---: | :---: | :---: | :---: | :----: | :---: |
| 1. Live-price hero                             |   9    |   9   | **8** |   9   |   9   |   9   |   9    | **7** |
| 2. Karat ladder                                | **8**  |   9   | **8** |   9   | **8** |   9   | **8**  | **7** |
| 3. "What's it worth" inline calc               |   9    |   9   |   9   |   9   |   9   |   9   |   9    | **8** |
| 4. Audience-routing band                       |   9    |   9   |   9   |  10   |   9   |   9   |   9    | **8** |
| 5. Market chart + history                      |   9    |   9   | **8** | **7** | **8** |   9   | **8**  | **8** |
| 6. Editorial "Gold Markets" (souk photography) |   9    |   9   |   9   | **8** |   9   |   9   |   9    |   9   |
| 7. Learn rail                                  |   9    |   9   | **8** |   9   |   9   |   9   |   9    |   9   |
| 8. Nav + sticky mobile market summary          |   9    |   9   | **8** |   9   |   9   |   9   |   9    | **8** |

**Why < 9, and the plan (every instance):**

- **Originality 8 (hero, ladder, chart, learn rail, nav):** these evolve familiar patterns. _Plan:_
  the originality budget is spent on the **numeral face + tick + material gold + Arabic
  composition + the interactive ladder**; each of those five must land or the section is reworked,
  not shipped.
- **RTL 7 (hero, ladder):** unproven; Arabic headline length + numeral bidi are real hazards.
  _Plan:_ design the AR hero natively, bidi-isolate all numerals, review AR at the same gate before
  merge.
- **A11y 8 (ladder, chart):** interactive ladder + chart crosshair need keyboard + SR support.
  _Plan:_ ladder = radio-group/slider semantics + focus ring; chart = keyboard-scrub + text
  summary + not-color-alone; add axe/pa11y coverage for both.
- **Mobile 8 (ladder, chart, markets):** ladder cramps at 390px; chart is hard on small screens.
  _Plan:_ ladder → horizontal swipe/segmented control; chart → simplified sparkline + tap-to-read.
- **Perf 7 (chart):** the current TradingView embed is the heaviest thing on the page. _Plan:_
  lazy-load below fold, reserve space (CLS≈0), evaluate a lightweight self-rendered chart to drop
  third-party weight; measure LCP in the production build before the section is "done."
- **Visual 8 (ladder):** four tiles risk genericness (see B1-2). _Plan:_ make it visibly interactive
  or collapse to selector+value.

**Rule I'm binding myself to:** no homepage section ships until **every** category reaches ≥9 in the
actual build, verified with before/after screenshots at the Visual Acceptance Gate.

## B3 — Top 5 risks (and mitigations)

1. **"Reskin, not redesign."** _Why:_ easiest failure mode — change type/color, keep the same card
   stack. _Harm:_ owner sees no real change; the program fails its premise. _Mitigate:_ the Gate
   rejects CSS-only/more-cards; each PR shows a **structural** before/after (section count down,
   card-repetition removed), not just restyling.
2. **Market-narrative accuracy (esp. toward Concept B).** _Why:_ an editorial headline like "near a
   3-month high" is a factual claim. _Harm:_ if wrong/stale it's misinformation and brushes the
   no-fake-urgency guardrail. _Mitigate:_ any narrative copy is **derived from real data with a
   verified rule** (e.g. vs true 90-day max) or it doesn't render; never hand-authored urgency.
3. **Cross-surface price divergence (F-1) undermines the redesign.** _Why:_ the concepts assume ONE
   canonical spot; today home/tracker/calculator disagree. _Harm:_ a beautiful hero showing a
   different number than the calculator destroys trust faster than an ugly consistent one.
   _Mitigate:_ the canonical-spot resolver (plan P1–P2) is a **prerequisite for / runs alongside**
   the homepage, which reads the resolver so every number agrees. **Owner flag:** this couples
   visual work to the F-1 fix.
4. **Performance regression from richer visuals + fonts + motion.** _Why:_ self-hosted fonts, chart,
   animated numbers. _Harm:_ slower LCP/CLS, especially mid-range mobile in the GCC. _Mitigate:_
   subset woff2 + `font-display:swap`, transform/opacity-only motion, lazy charts, reserved space;
   hard budget (LCP<2.5s, CLS≈0) verified in the production build per PR.
5. **RTL/Arabic treated as a post-pass.** _Why:_ easy to design EN-first and mirror. _Harm:_ half
   the GCC audience gets a second-class experience — a core-promise failure. _Mitigate:_ AR is a
   first-class deliverable **in every page PR**, scored at the same gate; the homepage ships an
   AR-composed (not mirrored) hero or it's rejected.

## B4 — Alternative homepage concepts explored

Three genuinely different balances were built and reviewed in-browser (renders in `concepts/`):

- **Concept A — "Living Terminal"** (`concept_A_living_terminal_desktop.png`,
  `concept_home_mobile_en.png`): price-as-protagonist split hero + karat ladder + inline "what's it
  worth" + one primary CTA. Balance: **live market data forward**, with a consumer action and light
  editorial framing.
- **Concept B — "Market Story"** (`concept_B_market_story_desktop.png`): FT/Economist editorial
  front — a serif headline telling today's story with the price inline, a wide chart + stat column,
  and three "If you're buying / comparing / holding" cards. Balance: **editorial storytelling
  forward.**
- **Concept C — "Value-First"** (`concept_C_value_first_desktop.png`): Revolut-style consumer
  utility — a big "What is your gold worth today?" calculator as the hero (weight + karat → instant
  AED), live spot as a top strip, an "explore prices" rail. Balance: **consumer guidance/utility
  forward.**

| Criterion                        | A · Living Terminal | B · Market Story  | C · Value-First   |
| -------------------------------- | ------------------- | ----------------- | ----------------- |
| Serves buyers (jewellery)        | ●●●                 | ●●                | ●●●               |
| Serves investors/returning       | ●●●                 | ●●●               | ●                 |
| Serves journalists/citation      | ●●●                 | ●●●               | ●                 |
| Serves first-timers              | ●●                  | ●●                | ●●●               |
| Distinctive identity             | ●●●                 | ●●●               | ●●                |
| Premium / editorial feel         | ●●●                 | ●●●               | ●●                |
| "Best gold platform" credibility | ●●●                 | ●●                | ●                 |
| Accuracy / fabrication risk      | low                 | **higher** (copy) | low               |
| Overlap with existing pages      | low                 | low               | **high** (≈ calc) |

**Strengths/weaknesses.** **A** balances all four audiences and keeps market credibility while
giving buyers an action; weakest on first-timer hand-holding. **B** is the most premium and best
storytelling, but demotes the live number and carries narrative-accuracy risk (#2). **C** is the
most immediately useful for a first-time buyer but demotes the market identity and largely
duplicates the calculator page, weakening the homepage's reason to exist.

## B5 — Recommendation

**Adopt Concept A ("Living Terminal") as the spine, grafting the strongest ideas from B and C** —
the judge-panel outcome, not the first idea:

- from **A**: price-as-protagonist hero, the numeral/tick signature, the interactive karat ladder;
- from **C**: the inline **"what's it worth"** instant (promoted from a line to a mini-calc in the
  hero) — the immediate utility A lacked for first-timers;
- from **B**: the **"If you're buying / comparing / holding"** audience-routing band directly under
  the hero — the journey's first fork, and B's single best idea.

**Why this is the best long-term direction:** the product's durable moat is being the **trusted,
live, bilingual gold _reference_** for the GCC — used by buyers, investors, and journalists. That
demands the **live price be the protagonist** (A) with **market credibility**, while still guiding a
first-time buyer to an answer (C) and telling enough of a story to bring people back tomorrow (B). B
alone risks accuracy and demotes the number; C alone becomes "a calculator with a homepage" and
cedes the reference-authority position. A-with-grafts is the only option that keeps the authority
**and** the consumer warmth **and** an original identity — and it degrades gracefully (if
narrative/chart is unavailable, the price hero still stands). It also sequences into one calm guided
scroll — hero → routing band → chart/history → markets/editorial → learn — materially shorter than
today's ~8,300px card stack.

**Owner decisions this surfaces:** (a) approve **A-synthesis** as the homepage direction; (b)
confirm the **identity/palette** ("editorial bullion terminal," warm ink/paper + one assay-gold
accent, numeral signature); (c) accept that the homepage should **read the canonical-spot resolver**
so its numbers can't diverge (couples to F-1, plan P1–P2) — or explicitly defer and accept temporary
divergence; (d) confirm **build order** (homepage first).

---

### ⏸ Stopping here for owner review

Per your final instruction, I am **not** starting homepage code and will not until you **explicitly
approve the direction**. On approval I begin the flagship homepage on `redesign/home` (A-synthesis)
with frequent before/after per-component checkpoints and the Visual Acceptance Gate applied to every
section, EN **and** AR. If you want a different concept (B or C), a different palette/identity, or a
different build order, tell me and I'll revise this package before any code.
