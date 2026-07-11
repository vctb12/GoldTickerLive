# GoldTickerLive — Visual Direction V2

**Owner of this system:** Claude (single visual-system owner). **Status:** proposed — awaiting owner
approval at the First Checkpoint. **Companion docs:**
[Visual Transformation Audit (Phase 0)](../audits/2026-07-10_VISUAL_TRANSFORMATION_AUDIT.md) ·
[First Checkpoint package](./reviews/FIRST_CHECKPOINT.md). **Binds to** every financial guardrail:
peg 3.6725, troy 31.1035, karat ÷24, spot≠retail, real data only, reduced-motion usable, EN+AR,
production-build evidence, flags/pilots OFF.

> The goal is not "redesign GoldTickerLive." It is to make it **feel like the best gold reference
> platform on the internet** — a product-design exercise backed by strong engineering. Nobody should
> look at the result and think "Coinbase" or "Stripe" or "another Tailwind site." They should think
> **"this is GoldTickerLive."**

---

## Part I — Benchmark synthesis (principles, not appearances)

I studied _why_ these products feel premium and extracted the transferable principle. **We copy none
of their looks; we adopt their disciplines.**

| Product                                     | The principle worth stealing                                                                    | How it translates to GoldTickerLive                                                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Bloomberg Terminal / FT / The Economist** | Information density earns trust; editorial hierarchy makes dense data readable                  | Prices can be dense and authoritative; use editorial rules (rules, kickers, measured columns) so density reads as expertise, not clutter |
| **TradingView / Polygon.io**                | The chart _is_ the product; live data has weight and precise motion                             | The live price and chart become the hero, with exact, non-decorative motion                                                              |
| **Apple / Apple Weather**                   | One idea per screen; large type; calm; data as hero with a soft narrative                       | Each page states ONE thing; the price is huge and calm; a one-line "what this means"                                                     |
| **Stripe**                                  | Restraint + a single confident accent + immaculate spacing rhythm                               | One assay-gold accent, disciplined 8-pt rhythm, no gradient soup                                                                         |
| **Linear / Vercel / Arc / Raycast**         | Craft in the details: keyboard focus, motion timing (150–250ms), microinteractions with purpose | A motion-timing scale; every interactive element has a considered focus/hover; a signature "tick"                                        |
| **Revolut / Coinbase / Wise / XE**          | Consumer finance made calm and legible; money framed as _understandable_                        | The "what does today's price mean for my wedding jewellery / savings" layer                                                              |
| **Kitco**                                   | The category incumbent — and it looks like a 2010 data portal                                   | Our opening: same authority, modern craft. Be what Kitco would be if rebuilt today                                                       |
| **Flighty**                                 | Delight through data storytelling; motion that _explains_ status                                | Market-status and freshness told through subtle, meaningful motion, not badges alone                                                     |
| **Notion / Airbnb**                         | Warm, human, systemically consistent components; never sterile                                  | A warm (not cold-fintech) palette; one component family used everywhere                                                                  |

**Synthesis → our original position.** GoldTickerLive lives between five worlds — a **market
terminal**, a **consumer buying assistant**, an **education platform**, a **luxury commodity
experience**, and a **trusted reference**. No benchmark occupies that intersection. Our language is:
**an editorial bullion terminal** — the density and precision of a terminal, the calm and hierarchy
of Apple/editorial, the warmth of a consumer product, and a restrained material-gold luxury that
none of the fintech benchmarks have because none of them are _about gold_.

Target reaction: **"This feels like a premium financial platform — and it's unmistakably about
gold."**

---

## Part II — GoldTickerLive design principles (core philosophy)

1. **The price is the protagonist.** On every surface, the live number is the largest, calmest,
   most-crafted element. Everything else supports a decision about it.
2. **One idea per screen.** Each page answers a single question (What's the price? What's it worth?
   Where's it cheapest? Where do I buy? What should I know?). If a section doesn't serve that
   question — inform a decision, build trust, teach, or make pricing clearer — it is redesigned or
   removed.
3. **Density is a feature, clutter is a bug.** We earn trust with real, dense data — organized by
   editorial hierarchy so it reads as authority, never as noise.
4. **Say the disclaimer once, well.** Spot≠retail is stated in one considered place per surface, not
   five. Trust comes from precision, not repetition.
5. **Material, not decoration.** Gold appears as a restrained material accent and is spent on the
   moments that matter (the live price, the karat). No gradient/shadow/rounded-corner soup.
6. **Motion must mean something.** Every animation encodes information (a tick, a change, a state)
   or it doesn't ship. Fully usable, and never lesser, under reduced-motion.
7. **Designed in Arabic, not mirrored.** Arabic is a first-class composition with its own type
   rhythm.
8. **Bilingual, accessible, fast — non-negotiable, invisible.** These are constraints the design is
   built _within_, not features to show off.

---

## Part III — Distinctive identity

### Signature type treatment

- **Numerals are the brand.** Prices use a **tabular-lining numeric treatment** ("the ticker face"):
  monospaced-digit alignment so figures don't jitter as they tick, slightly condensed, tracked
  tight, with the currency glyph set smaller and raised. This numeric signature is used _only_ for
  live prices and is the single most recognizable element. Self-hosted (woff2, subset), no external
  CDN.
- **Display:** a high-contrast editorial serif for page/section headings (evolves the current serif
  but with more character and a real weight/size scale). **Body/UI:** a neutral humanist sans,
  generous x-height, excellent Arabic companion.
- **Arabic:** a paired Arabic display + text face chosen for the same _voice_ (editorial, confident)
  — never the Latin bold pressed into service.

### Palette & material (see Part VIII for tokens)

Warm **ink** on warm **paper** (not pure white/cream), a single **assay-gold** accent, an accessible
**market up/down** pair, and — reserved for signature moments — a subtle brushed-metal/leaf material
(a CSS treatment, not imagery) on the live price and karat medallions.

### Motion signature — "the tick"

When the price updates: digits **roll vertically** (odometer) over ~220ms with a brief 1px gold
underline sweep left→right; up/down tint flashes once and settles. This exact motion is
GoldTickerLive. Under `prefers-reduced-motion`: a 120ms crossfade of the value, no roll, no sweep —
still clearly "it updated," never lesser.

---

## Part IV — The journey (design the flow, not islands)

Current price → _what it means for me_ → check your karat → calculate jewellery value → compare
markets → find a trusted shop → learn something → return tomorrow. Every page ends by pointing at
the next step in this arc, so the product feels like one guided experience, not a menu of tools.
Emotional job: **reduce uncertainty and inspire confidence** for someone buying wedding jewellery,
investing savings, or prepping for a jeweller visit.

### Signature moments (memorable, and they _explain_)

1. **Living price hero** — the odometer tick + a sparkline that reconciles to the exact hero value.
2. **Karat ladder** — an interactive 24K↔14K ladder; slide a karat and every derived value re-rolls,
   teaching purity ÷24 by feel.
3. **"What's it worth" instant** — type grams once in the hero, get your karat's value inline before
   leaving the homepage.
4. **Cheapest-market reveal** — Compare animates rows into rank order and calls the winner.
5. **Market-status as motion** — open/closed/stale shown by the pulse rate of a single status dot,
   not just text. These reinforce understanding; none is decoration.

---

## Part V — Layout system

- **Grid:** 12-col desktop (max content 1200px, 24px gutters, comfortable margins), 8-col tablet,
  4-col mobile. Content measured for reading (~66ch text columns) — no more
  content-in-a-narrow-left-third with an empty right half.
- **Vertical rhythm:** composed section spacing on an 8-pt scale (§VI), not loose 100px voids. The
  homepage target is a **deliberate** scroll, materially shorter than today's ~7,300px.
- **Section model:** replace "serif-H1 + eyebrow + card grid, repeated" with a small set of composed
  _block types_ (hero, data-feature, editorial-rail, comparison, teach) that look distinct from each
  other.

## Part VI — Spacing system

4px base unit. Named steps: `space-1=4, 2=8, 3=12, 4=16, 5=24, 6=32, 7=48, 8=64, 9=96, 10=128`.
Component padding uses 3–5; section rhythm uses 7–9. One scale, sitewide. No ad-hoc pixel values.

## Part VII — Typography system

Modular scale, `clamp()` for fluid desktop→mobile.

| Token        | Use                                    | Desktop → mobile                               |
| ------------ | -------------------------------------- | ---------------------------------------------- |
| `price-hero` | live hero price (ticker face, tabular) | clamp(3.5rem → 2.75rem), tight tracking        |
| `display-1`  | page H1 (serif)                        | clamp(3rem → 2rem)                             |
| `display-2`  | section heading (serif)                | clamp(2rem → 1.5rem)                           |
| `title`      | card/sub headings (sans, 600)          | 1.25rem                                        |
| `body`       | prose                                  | 1rem/1.6 (1.0625rem AR)                        |
| `meta`       | freshness, labels, kickers             | 0.8125rem, tracked, uppercase for kickers only |
| `num`        | inline prices/tables (tabular-lining)  | inherits, `font-variant-numeric: tabular-nums` |

Kicker/eyebrow labels survive but become **one** consistent treatment, used sparingly (not on every
block). Line-length capped; headings get real size contrast so hierarchy doesn't rely on the serif
alone.

## Part VIII — Color & material system (tokens, both themes)

Values are targets; final hues tuned against WCAG in implementation.

| Token         | Light                           | Dark               | Note                     |
| ------------- | ------------------------------- | ------------------ | ------------------------ |
| `--paper`     | `#F7F3EC` warm                  | `#0E0D0B`          | page bg (warm, not pure) |
| `--surface`   | `#FFFFFF`                       | `#1A1815`          | cards/panels             |
| `--ink`       | `#171512`                       | `#F3EEE4`          | primary text             |
| `--ink-muted` | `#5C554B`                       | `#B3A996`          | secondary                |
| `--gold`      | `#B8891E` (accessible on paper) | `#E4B655`          | the single accent        |
| `--gold-leaf` | material treatment              | material treatment | signature moments only   |
| `--up`        | `#157347` (AA on paper)         | `#3FB27F`          | price up                 |
| `--down`      | `#B23A2E`                       | `#E0705F`          | price down (AA)          |
| `--line`      | `#E7DECF`                       | `#2A261F`          | hairlines                |

Dark mode is **first-class** (the tracker's terminal becomes the shared dark theme, not an orphan).
Up/down never rely on color alone — always paired with an arrow/sign (a11y).

## Part IX — Surface & elevation

Three levels only: **paper** (0) → **surface** (1, hairline border + 1 soft shadow) → **raised** (2,
for menus/sheets/tooltips). No nested cards-in-cards. A panel either has a border or a shadow, never
a heavy both. Gold is never a fill for large areas — only accents, hairlines, and the material
moments.

## Part X — Navigation behavior

- **Desktop:** evolve the current clean bar; add a compact **persistent price pill** in the nav
  (small live XAU + 24K AED) so the number is always present without the ticker double-bar. Retire
  the top X-follow strip + the separate mini-ticker doubling the same numbers.
- **Mobile:** keep the bottom tab bar (its best asset); refine icons/labels; the hamburger opens a
  composed sheet, not a plain list. Add a **sticky mobile market summary** (collapsible) so the
  price follows the user.

## Part XI — Mobile philosophy

Mobile is **designed for the phone**, not a squeezed desktop: single-column composition,
thumb-reachable primary actions (bottom), an **expandable live-price sheet**, larger tap targets
(≥44px), and a hero that leads with the price + one line of meaning (currently mobile has no hero
narrative). Gestures where they help (swipe karat ladder, pull comparison).

## Part XII — Arabic / RTL philosophy

- Compose **in** Arabic: heading rhythm, line length, and weight tuned for Arabic script; a real
  Arabic display face, not the Latin bold.
- Mirror layout logically (start/end, not left/right) but **re-balance** — Arabic headlines run
  longer, so hero proportions differ from EN by design.
- Numerals: keep Western Arabic numerals for prices (regional convention) set LTR within RTL flow,
  with correct bidi isolation so `4,108.70 $` never reorders.
- Verify every signature moment in AR (the tick, ladder, compare) — RTL is a first-class target, not
  a post-pass.

## Part XIII — Animation principles & timing

- **Timing scale:** `fast 120ms` (hovers, taps), `base 200ms` (reveals, state), `slow 320ms` (page
  transitions, comparison re-rank). Easing: `cubic-bezier(.2,.7,.2,1)` (decelerate) for entrances.
- **Budget:** motion is subtle and short; nothing loops forever except the ~1s status-dot pulse.
- **Every animation informs** (tick = value changed; roll direction = up/down; pulse = live vs
  stale).
- **Reduced-motion:** all reveals become instant; the tick becomes a crossfade; transitions become
  cut/fade. The page is never less usable or less complete — content is never gated behind motion
  (audit confirmed today's reveals correctly show all sections under reduced-motion; we keep that
  contract).

## Part XIV — Chart & data-viz styling

- One chart language sitewide: hairline gridlines on `--line`, gold price line, tabular-num axis, a
  crosshair that reads out the exact value, last-point marker reconciled to the canonical spot (ties
  to pricing-audit F-1: chart's last value must equal the hero value).
- Sparklines (hero, cards) share the chart's line + color, no separate style.
- Comparison uses **length** (bars) as the primary encoding (fastest to compare), color only as
  accent.

## Part XV — Data-emphasis rules

Biggest/heaviest type = the value the page is about. Freshness/source/disclaimer are `meta` size,
quiet, once. Numbers are always tabular-lining and right-aligned in tables. Currency and unit are
smaller companions to the figure, never competing with it.

## Part XVI — CTA hierarchy

- **Primary** (one per view): solid gold-on-ink or ink-on-gold, the single most likely next step in
  the journey.
- **Secondary:** outline/ghost.
- **Tertiary:** text links with the gold underline-sweep on hover. Today's homepage shows two
  equal-weight buttons plus four tertiary links competing — we pick one primary per screen aligned
  to the journey arc.

## Part XVII — Iconography

One line-icon set, 1.5px stroke, 24px grid, rounded joins — warm and editorial, not generic
Material/Feather defaults. A small custom set for the domain (karat, troy-oz, souk/shop, peg). The
brand "G" mark gets a distinctive, gold-appropriate redraw.

## Part XVIII — Loading / empty / error / stale / offline states

A designed set (today these are mostly plain text or missing):

- **Skeleton:** shimmer blocks in `--surface`/`--line` matching final layout (price, chart, cards).
- **Empty:** a quiet illustrated state + one action (e.g. Compare with no countries picked).
- **Error:** honest, calm, retry — never a fabricated price.
- **Stale/Cached/Delayed/Fallback:** the freshness object changes the status-dot pulse + label;
  value dims slightly; "last updated" is explicit. Never show a stale number as if live.
- **Offline:** the offline page joins the system (and gets its `<main>` landmark, audit F-9).

## Part XIX — Trust-building strategy

Trust from **craft + precision + honesty**, not repetition: one clear freshness object per surface
(source, timestamp, state), the spot≠retail note stated once and well, real sources named
(Gold-API.com, LBMA baseline, fixed 3.6725 peg), transparent methodology one click away, and
**zero** fabricated prices/testimonials/countdowns/urgency/"AI insights." The design should make a
jewellery buyer feel it's safe to rely on this before walking into a shop.

## Part XX — Accessibility strategy

WCAG AA contrast on all text/controls (tokens tuned to pass); visible keyboard focus (gold ring) on
every interactive element; up/down encoded with shape+sign, not color alone; semantic landmarks
(`<main>` everywhere incl. offline); reduced-motion fully honored; RTL correctness; ≥44px targets;
respects existing a11y tests and adds coverage for new components.

## Part XXI — Performance strategy

Self-host + subset fonts (woff2, `font-display: swap`), no external font/CDN calls (matches the
repo's no-external constraint and privacy posture). Motion via transform/opacity only (GPU, no
layout thrash). Lazy-load below-fold charts. Ship no framework — stay on the static Vite stack.
Budgets: LCP target < 2.5s on mid mobile, CLS ~0 (reserve space for price/chart to stop the layout
shift the audit flagged). Verify in the production build, not dev.

---

## Part XXII — How this maps to build order

Flagship **homepage** first (proves the system end-to-end), then calculator → compare → tracker →
country/GCC → shops → learn → glossary/market/heatmap → nav/search/footer/mobile-nav/transitions →
shared states → final cross-site consistency + motion audit. One cohesive PR per page, each gated by
the Visual Acceptance Gate (before/after desktop+mobile, EN+AR, unmistakable delta, motion works in
prod build, reduced-motion usable, no overflow, invariants correct). Details and the homepage layout
proposal are in the [First Checkpoint](./reviews/FIRST_CHECKPOINT.md).
