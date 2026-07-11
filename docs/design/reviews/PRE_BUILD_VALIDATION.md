# Pre-Build Design Validation Package

**For owner approval before ANY production code.** Prepared by Claude (coordinator + visual-quality
gate). This extends the [First Checkpoint](./FIRST_CHECKPOINT.md) with high-fidelity mockups and the
validation the owner asked for. **No production implementation has begun** — I stop after this and
wait for explicit approval.

**Locked decisions carried in (confirmed):**

- **F-1 bundled.** The homepage will consume the **same canonical pricing source as the calculator**
  — visual excellence is meaningless if two surfaces disagree on price. Every number in these
  mockups is ONE internally-consistent sample (spot `$4,108.70` → 24K `485.13 AED/g`, and every
  derived value flows from it) shown identically in the nav pill, hero, karat ladder, calculator,
  markets and footer — a visual proof of the single-source rule.
- **Homepage first.** Nothing else begins until the homepage establishes the design language. This
  is the **foundation** every future page, feature, and the eventual mobile app inherits — designed
  as a system, not a one-off.

> **These are DESIGN MOCKUPS**, static HTML/CSS built to be photographed — **not** production code
> wired to live data. Every mockup carries a visible "illustrative sample values — not a live price"
> ribbon. Fonts are system fallbacks; production self-hosts the editorial serif + tabular numeral
> face (woff2, subset, no CDN).

---

## 1. Where every mockup and doc lives

All under [`docs/design/reviews/mockups/`](./mockups/) unless noted. Open the `.html` files directly
to interact; the `.png` files are the captured screenshots (scroll-accurate, full page).

| Deliverable                                                   | File                                                                                                                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A-synthesis homepage — interactive** (desktop + responsive) | `homepage-A-synthesis.html`                                                                                                                                                                |
| A — desktop, full page                                        | `A_desktop_full.png`                                                                                                                                                                       |
| A — desktop, first viewport (hero + nav)                      | `A_desktop_hero.png`                                                                                                                                                                       |
| A — **mobile**, full page                                     | `A_mobile_full.png`                                                                                                                                                                        |
| A — mobile, hero                                              | `A_mobile_hero.png`                                                                                                                                                                        |
| **A-synthesis homepage — Arabic/RTL, interactive**            | `homepage-A-synthesis-ar.html`                                                                                                                                                             |
| A — **Arabic/RTL**, desktop full page                         | `A_ar_desktop_full.png`                                                                                                                                                                    |
| A — Arabic/RTL, desktop hero                                  | `A_ar_desktop_hero.png`                                                                                                                                                                    |
| A — Arabic/RTL, mobile full page                              | `A_ar_mobile_full.png`                                                                                                                                                                     |
| **Concept B — Market Story** (rejected)                       | `../concepts/concept_B_market_story_desktop.png` · `../concepts/homepage-alternatives.html`                                                                                                |
| **Concept C — Value-First** (rejected)                        | `../concepts/concept_C_value_first_desktop.png` · `../concepts/homepage-alternatives.html`                                                                                                 |
| Concept A early hero study                                    | `../concepts/concept_A_living_terminal_desktop.png` · `../concepts/homepage-hero-concept.html`                                                                                             |
| Supporting docs                                               | [Visual Direction V2](../GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md) · [Visual Delta Audit](../../audits/2026-07-10_VISUAL_TRANSFORMATION_AUDIT.md) · [First Checkpoint](./FIRST_CHECKPOINT.md) |

**What the A mockup demonstrates, section by section** (see `A_desktop_full.png`): sticky **nav**
with a persistent live price pill → **hero** (price as protagonist: huge tabular numeral, one
editorial kicker line, delta chip, sparkline, one gold primary CTA, the "what's it worth" meaning
line, and the disclaimer stated **once**) → **audience-routing band** (buying / comparing /
tracking) → **live-market section** ("Is today a high or a low?" — chart + insight stats incl.
3-year range "you are here") → **karat ladder** (6 rungs, purity ÷24 shown, unit toggle) → **inline
calculator** (grams + karat → instant value) → **editorial "Gulf gold markets"** (souk cards —
gradient placeholders, clearly labeled, no fake photos) → **learn rail** (dark feature + guides) →
**footer direction** (dark, brand + price pill + link columns + sources + EN/العربية).

---

## 2. Three concepts, compared visually (why A wins on merit)

All three were built and photographed so the owner compares **products, not descriptions**. A was
then fleshed out fully because it won — not because it came first.

### Concept A — "Living Terminal" (SELECTED) · `A_desktop_full.png`, `A_mobile_full.png`, `A_ar_desktop_full.png`

- **Strengths:** the live price is unmistakably the protagonist (terminal credibility) **and** a
  first-time buyer gets an immediate answer (inline calc + "what's it worth"); one calm guided
  scroll; strongest distinct identity (numeral signature + material gold + editorial calm); degrades
  gracefully (if chart/narrative are unavailable, the price hero still stands).
- **Weaknesses:** the split/stacked hero is a familiar shape (mitigated by making the identity live
  in the numeral/tick/material, not the layout); the karat ladder must be genuinely interactive or
  it reads as cards (committed).
- **Target audience:** all four at once — jewellery buyers, investors/returning users, journalists,
  and first-timers. **Scalability:** highest — the block types (hero · data-feature · ladder ·
  comparison · editorial · teach) become the kit every other page and the mobile app reuse.
  **Originality:** high (numeral face, tick, ladder, material gold, Arabic composition).
- **Why selected:** it's the only concept that keeps **reference-authority** _and_ **consumer
  warmth** _and_ an original identity — exactly the five-worlds intersection GoldTickerLive
  occupies.

### Concept B — "Market Story" (rejected) · `concept_B_market_story_desktop.png`

- **Strengths:** the most premium editorial feel; best for journalists and daily returning readers;
  a strong story ("gold holds near a 3-month high…").
- **Weaknesses:** it **demotes the live number** (smaller, inline) — weakening the core job; and the
  narrative headline is a **factual claim** that must be provably data-derived every load or it
  becomes misinformation / fake urgency (a guardrail risk).
- **Audience:** returning/informed readers, press. **Scalability:** medium — an editorial front
  doesn't template cleanly onto a calculator or compare page. **Originality:** high.
- **Why rejected:** the homepage's #1 job is "what's the price right now?"; a story-first front
  answers that second. We **keep B's best idea** — the "If you're buying / comparing / holding" band
  — grafted into A directly under the hero.

### Concept C — "Value-First" (rejected) · `concept_C_value_first_desktop.png`

- **Strengths:** most immediately useful for a first-time jewellery buyer — the calculator _is_ the
  hero; extremely clear one-idea screen.
- **Weaknesses:** **demotes the market identity** (price relegated to a strip) and **largely
  duplicates the calculator page**, weakening the homepage's reason to exist and the
  reference-authority position.
- **Audience:** first-time buyers only. **Scalability:** low — it's essentially one tool.
  **Originality:** medium.
- **Why rejected:** it cedes the "trusted live reference" moat. We **keep C's best idea** — the
  inline "what's your gold worth" instant — grafted into A's hero/mid-page.

**Verdict:** **A, grafting B's audience-routing band + C's inline calculator.** The mockups show
this synthesis already assembled. A wins because it serves every audience and protects the moat; B
and C each optimize one audience at the cost of the product's core promise.

---

## 3. Homepage stress-test — seven real journeys

Walking realistic users through the A mockup, top to bottom. A journey passes only if it flows
without a forced step.

1. **"What's today's price?" (the 5-second visitor).** Lands → the huge `$4,108.70` + delta
   `+0.30%` + "market open" answer it before scrolling. ✅ Fastest possible path — the price is the
   hero.
2. **Buying wedding jewellery.** Hero meaning line ("a 10 g 22K chain ≈ AED 4,446.90 in metal") →
   audience card "I'm buying jewellery" → inline calculator (grams + karat → value) → "see what a
   shop would charge" (making + VAT). ✅ Metal value first, honest retail framing, one clear path to
   the full calculator. No dead end.
3. **Comparing UAE vs Saudi.** Audience card "I'm comparing markets" (already names today's
   cheapest) → or the "Gulf gold markets" section shows Dubai `485.13 AED/g` vs Riyadh
   `495.80 SAR/g` with "vs GCC average" → "compare countries" / "all countries". ✅ The comparison
   hook appears twice on the path, both leading to the compare tool.
4. **Calculating an 18K necklace.** Karat ladder → tap **18K** (`363.85 AED/g`, purity .750 shown) →
   inline calculator with 18K selected → value + "full calculator adds scrap/zakat/…". ✅ The ladder
   teaches purity ÷24 _and_ routes to the exact calculation.
5. **Daily returning visitor.** Nav price pill is always visible; hero delta + "this week +1.8%" +
   "3-yr range: you are here → top of range" give the day's context instantly; "set a price alert"
   via the tracking card. ✅ Reasons to return (context + alerts) are surfaced without scrolling
   far.
6. **Landing from Google on mobile.** `A_mobile_hero.png`: price-first single column,
   thumb-reachable gold CTA, sticky bottom tab bar (Prices/Calculator/Compare/Shops/Menu).
   Everything below stacks in one column; no horizontal scroll. ✅ Designed for the phone, not a
   squeezed desktop.
7. **Arabic-primary user.** `A_ar_desktop_hero.png` / `A_ar_mobile_full.png`: composed **in** Arabic
   — headline "سعر الذهب اليوم في الإمارات والخليج والعالم العربي", right-aligned, price still the
   protagonist, numerals bidi-isolated LTR (`4,108.70`, `485.13`, `31.1035` never reorder),
   sparkline flipped so "now" sits at the RTL reading end, nav/cards/footer flow right-to-left. ✅
   Not a mechanical mirror.

**Refinements made during the stress-test (before presenting):** promoted the audience-routing band
to sit **directly under the hero** (was going to be lower) so journeys 2–3 fork immediately; ensured
the karat ladder both teaches _and_ links to the calculator (journey 4); surfaced "set an alert" for
the returning user (journey 5). No journey felt forced after these.

**One honest nit to fix in build:** on mobile the hero "what's it worth" meaning line currently
wraps a bit awkwardly (`A_mobile_hero.png` bottom) — in production it becomes a single tidy sentence
or a compact inline chip. Logged, not blocking.

---

## 4. Visual consistency audit — is it ONE design language?

Checking every section against a single system (nothing should look borrowed from another product):

| Dimension            | The one rule                                                                                  | Verdict across all sections                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Typography**       | editorial serif for headings, humanist sans for UI, tabular "ticker" numerals for every price | ✅ consistent hero→ladder→calc→footer; all prices tabular-lining                                 |
| **Spacing**          | 4px base; sections on 64–96px rhythm; cards padded 24–32px                                    | ✅ one scale sitewide; no ad-hoc gaps                                                            |
| **Color & material** | warm ink on warm paper, ONE assay-gold accent, dark panels for "trust/among-terminal" moments | ✅ gold only as accent/hairline/CTA; dark used deliberately (learn feature, footer) not randomly |
| **Iconography**      | one line style, gold-tinted in soft chips                                                     | ✅ routing icons + market/shop marks share the language (production swaps in the custom set)     |
| **Charts**           | hairline grid, gold line, tabular axis, last-point marker                                     | ✅ hero sparkline and market chart share one style; ladder/insight numerals match                |
| **Cards / surfaces** | 3 elevation levels max, hairline border OR one soft shadow, no cards-in-cards                 | ✅ routing, stats, ladder, markets, guides all use the same surface treatment                    |
| **Buttons / CTA**    | one primary (gold) per view, ghost secondary, text-link tertiary                              | ✅ hero has exactly one gold primary; secondary is ghost; links are gold-underline               |
| **Navigation**       | sticky bar + price pill (desktop), bottom tab bar (mobile)                                    | ✅ same nav system top and bottom; footer echoes the price pill                                  |
| **Motion (spec)**    | tick/pulse/reveal only, timing scale 120/200/320ms, reduced-motion equivalent                 | ✅ specified consistently (static mockups; motion verified in build)                             |
| **Disclaimer**       | stated once per surface                                                                       | ✅ one hero disclaimer + contextual "how retail differs" links, not repeated blocks              |

**Conclusion:** the eight sections read as one family. The dark learn-feature and dark footer are
the same surface language as the (future) dark theme — deliberate, not an orphan like today's
tracker.

---

## 5. Homepage success metrics (what "better" means, measurably)

Engineering and the owner should judge the shipped homepage against these — not "looks nicer."
Targets are directional; instrument with the existing privacy-conscious analytics (no new trackers).

| Goal                                       | Metric                                                                     | Target vs today                                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Faster path to the calculator**          | clicks/scroll-depth from landing → calculator; % sessions reaching a value | calculator reachable **above/near the fold**; fewer steps than today's below-fold tool                                 |
| **Clearer "today" understanding**          | % who see day-change + range context (hero/insight in viewport)            | context visible **without scrolling**; qualitative "is today high or low?" answerable in 5s                            |
| **Higher Learn engagement**                | click-through from homepage learn rail → a guide; "Read n of 9" progress   | measurable rail CTR; keep the read-progress fix                                                                        |
| **Better country-pricing discoverability** | click-through to compare / a country page from home                        | comparison hook reachable in **≤1 scroll**, appears on 2 journeys                                                      |
| **Better mobile usability**                | mobile bounce, tap-target pass rate, 0 horizontal-overflow                 | ≥44px targets, no overflow, price-first hero, sticky market summary                                                    |
| **Stronger trust perception**              | one freshness object; disclaimer-once; sources named                       | disclaimer count **5→1** per surface; single freshness/source line                                                     |
| **Reduced visual clutter**                 | homepage section count; repeated tool-card sections                        | today repeats the tool set as cards **3×** (~8,300px) → **one** routing band + purposeful sections, materially shorter |
| **Price consistency (F-1)**                | identical 24K value across hero/ladder/calc/nav under one source           | **exactly one** canonical value everywhere — 0 divergence (regression-tested)                                          |
| **Performance**                            | LCP, CLS in the production build (mid-mobile)                              | LCP < 2.5s, CLS ≈ 0 (reserved price/chart space)                                                                       |
| **Accessibility**                          | axe/pa11y pass; keyboard path; reduced-motion usable                       | 0 new violations; every interactive element focusable; content never gated behind motion                               |

Each homepage-section PR must show movement (or a credible plan) on the relevant rows, with
before/after screenshots, before it passes the Visual Acceptance Gate.

---

## 6. Confirmations & guardrails

- **F-1 bundling: confirmed and designed-in.** The homepage reads the canonical-spot resolver; the
  mockups prove the single-value rule visually. Homepage build proceeds **with** (or immediately
  after) the resolver so numbers can never diverge.
- **Homepage-first: confirmed.** No other page starts until the homepage lands the design language
  and passes the gate. The system built here is the foundation every page and the mobile app
  inherit.
- **Frozen brief + all guardrails intact:** real data only; peg 3.6725 / troy 31.1035 / karat ÷24 /
  spot≠retail; no fabricated prices/testimonials/urgency/AI-insights; accessible + reduced-motion;
  bilingual EN+AR with intentional RTL; production-build screenshot evidence; flags/pilots OFF;
  never push/force-push `main`; never merge red. `main` remains untouched at `d9c5d7d25`; all work
  is on `design/visual-transformation-checkpoint-2026-07-10`.

---

### ⏸ Stopping here for owner approval

This is the pre-build validation package. **No production code will begin until you explicitly
approve this direction.** On approval I start the flagship homepage on `redesign/home`
(A-synthesis + F-1 canonical source), building section by section with before/after screenshots at
every step, EN **and** AR, each gated. If you want changes — a different concept, palette, section,
or the mobile/RTL treatment — tell me and I'll revise the mockups first.
