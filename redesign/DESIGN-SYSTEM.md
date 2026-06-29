# GoldTickerLive — Design System (Phase 1)

**Date:** 2026-06-29 **Status:** Phase 1 synthesis — exploration complete, one direction chosen. No
source files modified (this is the only document written).

This design system **EXTENDS the existing warm-parchment token foundation** per the locked Phase 0
gate decision. It does **not** start fresh, re-theme to "premium neutral", or replace the identity.
Every move below is a _refinement within_ the warm-parchment system already shipping at
goldtickerlive.com: the canvas stays warm parchment, the typeface stays the self-hosted grotesque,
and the existing freshness/state machine, spot-vs-retail primitives, dark theme, OS-fallback, and
RTL font swap are preserved verbatim. The deltas are surgical: cool the canvas a hair, demote gold
from ubiquitous ornament to a single value signal, concentrate all boldness on the live-price
readout, calm the chrome, and fix two documented bugs (the broken type-scale ratio and the retail
chip that is currently _heavier_ than the reference chip).

The page's single job is unchanged and governs every decision: **answer "what is gold worth right
now, and can I trust this number?" instantly.** Data is the hero. Gold reads as value and craft, not
bling.

---

## Current system (baseline)

The new system builds directly on these real, shipping values (verified against
`styles/partials/tokens.css`).

### Palette (current — light theme; dark in parentheses)

| Token                                     | Hex                   | Role                                                                        |
| ----------------------------------------- | --------------------- | --------------------------------------------------------------------------- |
| `--color-bg`                              | `#fefcf7`             | Page canvas — warm parchment (the signature cream base). Dark `#060708`.    |
| `--color-surface`                         | `#ffffff`             | Primary card surface. Dark `#0c0e14`.                                       |
| `--color-surface-2`                       | `#faf7ee`             | Secondary surface — tinted parchment (chips, stat rows). Dark `#141720`.    |
| `--color-surface-3`                       | `#f3eedd`             | Tertiary — deepest warm tint, skeleton/zebra. Dark `#1b1e2c`.               |
| `--color-border`                          | `#e4d9c0`             | Default border — warm tan. Dark `#242840`.                                  |
| `--color-border-subtle`                   | `#ece5d2`             | Subtle hairline. Dark `#1a1e30`.                                            |
| `--border-strong`                         | `#d6ccb4`             | Stronger border (outline buttons, separators).                              |
| `--color-text`                            | `#15110a`             | Primary ink — warm near-black. Dark `#f2eedd`.                              |
| `--color-text-muted`                      | `#6a5c48`             | Secondary text — warm taupe. Dark `#a09890`.                                |
| `--color-text-faint`                      | `#6f6350`             | Tertiary — AA-tuned ≥4.5:1 on tints. Dark `#8f857a`.                        |
| `--color-gold`                            | `#c4902e`             | Core metallic gold — accents, dots, focus ring, foil rules. Dark `#ddb040`. |
| `--color-gold-light`                      | `#ddb040`             | Lighter gold — gradient midtone, hover. Dark `#f0ca5c`.                     |
| `--color-gold-bright`                     | `#f0ca5c`             | Brightest gold — foil highlight, gradient peak. Dark `#fad97a`.             |
| `--color-gold-dark`                       | `#7e5912`             | Text/accent gold — AA on tinted surfaces (`--text-accent`). Dark `#c4902e`. |
| `--color-gold-deep`                       | `#6b4a0e`             | Deepest gold — GCC values, active tab text, hover.                          |
| `--color-gold-bg`                         | `#fdf8e8`             | Gold-wash background. Dark `#100e08`.                                       |
| `--color-gold-tint`                       | `#f8f2dc`             | Pale gold tint — reference chip bg, hover wash. Dark `#0c0a06`.             |
| `--color-live`                            | `#1a7a32`             | LIVE green — freshness pulse, market-open. Dark `#5dd98b`.                  |
| `--color-daily`                           | `#a85800`             | Daily-fixed amber-brown. Dark `#f0a350`.                                    |
| `--color-fixed`                           | `#1050a0`             | Fixed/official blue. Dark `#6ba3f0`.                                        |
| `--color-stale`                           | `#a84000`             | Stale/unavailable burnt-orange. Dark `#f0a350`.                             |
| `--color-move-up`                         | `#176832`             | Price up green (light). Dark `#5dd98b`.                                     |
| `--color-move-down`                       | `#b81428`             | Price down red (light). Dark `#f87171`.                                     |
| `--color-move-up-strong` / `-down-strong` | `#5dd98b` / `#f87171` | AA-safe movement for always-dark surfaces (tracker hero/chart).             |
| `--color-error`                           | `#b81428`             | Error/stale text + danger. Dark `#f87171`.                                  |
| `--tp-hero-glass`                         | `rgb(12 14 22 / 72%)` | Tracker hero glass — **always-dark** midnight, regardless of theme.         |

### Typography (current)

- **Faces:** Self-hosted woff2 — Source Sans 3 (EN, `--font-latin`) + Cairo (AR, swapped under
  `[dir=rtl]`). Weight axis 400–700 only; `--weight-light:300`/`--weight-extrabold:800` synthesize
  (faux). `--font-mono` is system-only.
- **CRITICAL GAP:** `--font-display === --font-main === --font-numeric === --font-sans` → all
  resolve to Source Sans 3. There is **no distinct data/display typeface**; terminal numerics and
  marketing headlines share one voice.
- **Scale:** Major Third `--type-ratio: 1.25` from 16px. Steps 2xs `.625` / xs `.75` / sm `.875` /
  base `1` / md `1.0625` / lg `1.25` / xl `1.5625` / 2xl `≈1.953` (all computed) **then 3xl `2.4375`
  / 4xl `3.0625` / 5xl `3.8125` / 6xl `4.75` are hand-set — BREAKING the ratio** (correct 3xl ≈
  `2.441`).
- **Fluid data:** `--text-data-lg` clamp(1.95→2.75rem), `--text-data-xl` clamp(2.5→3.85rem).
- **Hero override (problematic):** `.hlc-price` clamp(3.4rem, 8.5vw, **5.25rem**) / weight **800** /
  tabular / tracking −0.025em. Hero H1 clamp(2.8→4.1rem)/800 with an **italic gold subtitle**.
- **Numeric primitive:** `--font-feature-tabular: 'tnum' 1, 'lnum' 1` applied on price selectors.

### Spacing / radii / elevation / motion (current)

- **Spacing:** 4px base. Non-linear past space-4: `0,1px,2,4,8,12,16` then
  `5=24, 6=32, 7=48, 8=64, 9=80, 10=96`. **Trap:** the named index stops tracking the multiplier at
  space-5 (×6, not ×5). `--rhythm-section: space-7 (48)`, `--card-padding: space-4 (16)`.
- **Radii:** xs4 / sm8 / md12 / lg16 / xl22 / 2xl28 + pill999. Hero uses 2xl (28). No
  sharp/architectural option.
- **Elevation:** dual ramp — neutral `--shadow-xs…2xl` (warm-ink rgba) **and a parallel
  `--shadow-gold/-lg/-xl`**. Hero stacks `shadow-xl + shadow-gold`.
- **Motion:** `--transition .18s`; full easing library (`--ease-premium` cubic-bezier(.16,1,.3,1)
  etc.); durations instant80→xslow550. Keyframes `pulse-live-hero`, `badge-glow`, `spark-dot-pulse`,
  `skeleton-shimmer`, `fade-up`. All gated behind `prefers-reduced-motion`.

### Known issues this redesign must fix

1. **Boldness is sprayed, not spent** — four stacked radial "orb" glows + parallax on the hero
   section, a gold-foil top rule **and** bottom rule **and** corner radial glow on one card,
   `backdrop-filter: blur(2px)`, and universal `translateY(-2…-5px)` hover-lift + gold-glow on
   virtually every card. This is the banned "flashy dashboard" look.
2. **Gold is ornament, not value** — 5-stop foil/metallic gradients, gold-tint hovers, gold shadows,
   a `◈` glyph, emoji icons (`⚡ ◈ ⬇`, flags at 1.45rem). Reads consumer-app, not Bloomberg/bank.
3. **No data typeface** — the highest-leverage upgrade the audit flagged.
4. **Retail chip is currently HEAVIER than the reference chip** (`price-display.css:26-30, 282-286`:
   `price-kind--retail` uses a gold _gradient_ fill + 1.5px 50% gold border vs the reference chip's
   flat tint + 35% border). This is an **active spot-vs-retail invariant violation** — retail must
   never carry equal-or-greater visual weight.
5. **Broken type-scale ratio** (`--text-3xl: 2.4375rem` hand-set).

---

## Directions explored

Three refinements of the warm-parchment system were drafted and scored by a three-lens judge panel.
All three converge on the same correct diagnosis (the AI tell is the _spray of effects_, not the
palette) and the same playbook (cool the canvas ~1.5%, desaturate gold, kill
orbs/foil/glow/blur/hover-lift, retire faux-800, one structural rule, freshness adjacent to the
price). They differ in the _signature device_ and how hard they manufacture the "precision
instrument" feel.

### Direction A — Precision Instrument

**Concept:** A private-bank reading room rendered in warm parchment. Data is the hero through
weight, scale and disciplined space — gold demoted to a single value signal — with one bold live
readout that states the price, its freshness, and its spot-vs-retail standing as plainly as a
terminal ticker.

**Palette (deltas):**

| Token              | Value                             | Role                                                                                                                               |
| ------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--color-bg`       | `#fefcf7 → #fdfbf5`               | Cool the parchment ~1.5% toward "paper", off "cream marketing".                                                                    |
| `--color-text`     | `#15110a` (kept)                  | Hierarchy comes from ink, not gold.                                                                                                |
| `--color-ink-data` | **NEW** `#0f0c06`                 | The single darkest ink, reserved for the live spot price + tracker readout — the literal darkest mark on the page. Dark `#f7f3e6`. |
| `--color-gold`     | `#c4902e → #b07d1f`               | Desaturated/deepened struck-metal gold. Value signal only — never a body-card fill. Dark `#ddb040` kept.                           |
| `--color-rule`     | **NEW** = calmed `--color-border` | The single structural seam (spot/retail divider, table baseline).                                                                  |

**Signature hero — THE LIVE READOUT:** Near-flat parchment-white panel, radius **16px** (down from
28), **no** foil rule, **no** corner glow, **no** backdrop-blur, **no** hover-lift; a single
`--shadow-md` is the entire chrome budget. Top to bottom: (1) the spot **price** in
`--color-ink-data` (darkest mark on the page), tabular + slashed-zero, dominating at
clamp(2.6→3.9rem); currency unit `USD/oz` trailing, muted. (2) **Freshness rendered as the price's
second line** — a 7px status dot + `LIVE · 14:32:07 GST · XAU/USD`, with explicit state words (LIVE
/ DELAYED / CACHED / STALE / UNAVAILABLE). The dot is the only animated thing on the page. (3)
Change row (glyph + tinted square + delta, never colour alone). (4) **One** 1px `--color-rule`
divider, then the **spot-vs-retail row**: `Retail (est., +making + 5% VAT)` one full type-step
smaller, muted ink, on plain canvas — subordination by scale + ink weight + label + position below
the rule, never a gold box.

```
EN (dir=ltr) — two-column, copy left / readout right
┌────────────────────────────┬──────────────────────────────────────┐
│  ● Auto-refresh · labeled   │  GOLD SPOT PRICE        [market: OPEN] │
│  Gold Prices Today          │   ██████████████                       │ ← darkest ink, 800, tabular
│  UAE, GCC & Arab World      │   2,417.30  USD/oz                     │
│  Spot-linked reference …    │   ● LIVE · 14:32:07 GST · XAU/USD       │ ← freshness IS line 2
│  [ Open Live Tracker ]      │   ▲ +12.40 (+0.52%)  per troy ounce     │
│  [ Use Gold Calculator ]    │   ┄ Open ┄ High ┄ Low ┄                 │
│  Browse · Alerts · Shops    │   ──────────────────────────────────   │ ← the ONE rule
│                             │   Retail (est. +making +5% VAT)  ~2,5—  │ ← subordinate
│                             │   How retail differs →                  │
└────────────────────────────┴──────────────────────────────────────┘
```

**Anti-AI rationale:** Cliché #1 (cream+serif+terracotta): stays parchment by mandate but cools the
canvas, keeps a grotesque (no serif), and desaturates gold off every fill — no terracotta, warmth is
substrate not theme. Cliché #2 (near-black+acid): the accent is a sparingly-used struck-metal value
signal on a _light_ page. Cliché #3 (broadsheet hairlines): the inverse — structure from
weight/scale/space, exactly one rule line. Reads designed-not-generated because boldness is spent on
a single element while everything else is near-zero chrome.

**Self-critique:** The differentiation from cliché #1 is subtle and "not screenshot-obvious in a
thumbnail." Reusing Source Sans 3 + slashed-zero for the data voice is the _cheapest_ terminal tell
— the audit flagged the missing data typeface as highest-leverage, so this is the most contestable
call. Stripping nearly all motion risks "looks unfinished" feedback.

### Direction B — Vault / Bullion Craft

**Concept:** The current price rendered as a struck assay readout on a deepened parchment vault —
one matte-gilt rule of authority, freshness as a dateline, retail demoted to a sub-ledger; gold
becomes weight, not shine.

**Palette (deltas):**

| Token                 | Value                                                  | Role                                                                                                                            |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `--color-bg`          | `#fefcf7 → #fbf7ee`                                    | Deepen parchment toward "aged vault". Dark `#07080b`.                                                                           |
| `--color-vault-ink`   | `#171109`                                              | Primary ink with a hair more depth — the assay-readout colour. Dark `#f3efe0`.                                                  |
| `--color-gilt`        | `#9c6f1f`                                              | The single value-accent — one authority rule, reference mark, focus ring, live tick. **Never** a gradient/fill. Dark `#d8b25a`. |
| `--color-gilt-edge`   | `#c9a55a`                                              | Milled-rim highlight only. Dark `#e4c478`. _(Drafted with a leaked placeholder `#c9a costing`; corrected here.)_                |
| `--color-retail-wash` | `#f4ecd9`                                              | Flat retail sub-ledger bg (NOT a gradient). Dark `#14110a`.                                                                     |
| `--rim-inset`         | inset light-top + dark-bottom                          | The struck/milled bevel (replaces gold shadow on the plate).                                                                    |
| `--font-numeric-data` | subset woff2 (e.g. IBM Plex Mono, digits only ~8–12KB) | The highest-leverage add — a true tabular/mono data face.                                                                       |

**Signature hero — THE ASSAY PLATE:** A single weighty parchment plate, square-shouldered (radius
**10px**), bordered by a _milled rim_ (1px border + 1px inset light-top + 1px inset shadow-bottom →
reads pressed/struck, not floating). The price is the only large element — weight **700** (not 800),
`--color-vault-ink`, engraved not glowing. **Above** it: one **2px flat matte-gilt bar (~40px)** —
the only metallic element, the "certified" mark (NOT the 5-stop foil). Freshness is a typeset
**dateline** — gilt tick (live) / amber square (cached) / hollow red square (stale) +
`XAU/USD · 12:04:31 GST · live`, the existing state machine restyled flat + square (thin state-keyed
underline, no pill). Retail appears only as a recessed sub-ledger strip at the plate's foot, inset
into `--color-retail-wash`, ~one-third the price size, flat, prefixed `Est. retail —`.

```
EN (dir=ltr) — copy left / assay plate right
+----------------------------+   +-------------------------------------+
| [• auto-refresh · labeled] |   |====  (40px matte-gilt rule)         |
|  Gold Prices Today         |   |  GOLD SPOT PRICE        market:OPEN |
|  UAE, GCC & Arab World     |   |   2,387.40   USD / troy ounce       | ← 700, engraved
|  Spot-linked reference …   |   |  ▲ +12.30 (+0.52%)   24h            |
|  [ Open Live Tracker ]     |   |  ──────────────                     |
|  [ Use Gold Calculator ]   |   |  ▪ XAU/USD · 12:04:31 GST · live    | ← dateline
|  Browse · Alerts · Shops   |   |  Open 2,375  High 2,391  Low 2,369  |
|                            |   | :Est. retail — making + VAT [how]: | ← recessed sub-ledger
+----------------------------+   +-------------------------------------+
```

**Anti-AI rationale:** Replaces decoration with a genuine **material metaphor** (a struck assay
plate) that has internal logic. The milled-rim bevel is the sharpest answer to cliché #3 — it
doesn't just use fewer hairlines, it makes the edge read physical. Demoting gold to a single flat
solid gilt bar is the most decisive anti-bling move; retiring 800-weight entirely ("NO 800
anywhere") is the private-bank-not-app discipline. It is the only direction that _actually_ proposes
the distinct data typeface the audit flagged.

**Self-critique:** Dropping the price to 700/data-xl shrinks the brand moment. The
matte-gilt-on-deepened-parchment distinction is fidelity-dependent and may collapse to "beige and
brown" on cheap screens — and `--color-gilt #9c6f1f` is used as _text_ (chip ink + dateline), where
it **fails AA** (computes 4.17:1 on parchment, 3.79:1 on retail-wash). Squaring only the hero to
10px while the rest stays 16–28px may read as a mistake. The new woff2 is the only change touching
the asset/font path. Did not verify `tracker-pro-v4.css`, so the dark-tracker unification is
unproven. _(And the draft shipped a literal broken token value — a spec-hygiene defect.)_

### Direction C — Editorial Trust Desk

**Concept:** The gold price rendered as a financial-desk headline: one dominant number, a provenance
"dateline" (source · timestamp · state), and a one-line plain-language read — authority earned
through hierarchy and a single hairline rule, not serifs or gold.

**Palette (deltas):**

| Token               | Value               | Role                                                                         |
| ------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `--color-bg`        | `#fefcf7 → #fcfaf4` | Calmer "paper of record". Dark `#07080b`.                                    |
| `--color-dateline`  | `#8a7a5e`           | NEW — provenance/byline ink + small-caps eyebrows. Dark `#b3a888`.           |
| `--color-rule`      | `#d8cdb2`           | NEW — the single structural hairline (dateline rule).                        |
| `--color-gold-mark` | `#9c6f16`           | Demoted gold — reference mark/dot + reference chip ink only. Dark `#d9b24a`. |
| `--color-ink`       | `#13100a`           | Headline number + H1 ink. Dark `#f3efe0`.                                    |
| `--color-live`      | `#1a7a32 → #176a2c` | Deepened ~1 step for AA as small dateline text.                              |

**Signature hero — THE DATELINE HERO:** Four stacked, inline-start-aligned registers separated by
**one** full-width hairline: (1) small-caps eyebrow `GOLD SPOT · XAU/USD` + a single gold-mark dot.
(2) The dominant **number** in **AED** (peg-converted), clamp 3.0–4.6rem/700, with a subordinate
`USD/oz` line and an inline change pill. (3) The **dateline rule**, on which the provenance renders
as a _sentence_: `Updated 14:32:07 GST · source: Spot feed · LIVE`, state words explicit. (4) The
**read** — one plain-language lede. Retail never appears as a number in the hero — only named in the
read-line and pushed to the below-fold ShopVsReference panel.

```
EN (dir=ltr) — left-aligned dateline column
┌──────────────────────────────────────────────┐
│ • GOLD SPOT · XAU/USD            [market: ●OPEN]│ ← small-caps eyebrow + gold dot
│   AED 9,012.40                    ▲ +0.84%      │ ← THE NUMBER (700, tabular)
│   USD 2,453.10 / troy oz                        │ ← subordinate
│ ───────────────────────────────────────────────│ ← THE DATELINE RULE
│ Updated 14:32:07 GST · Spot feed · ● LIVE       │ ← provenance as a sentence
│ About 1g of 24K ≈ AED 245 at spot. Jewellers    │ ← THE READ
│ add making charges, VAT & margin.               │
│ Open 8,998 · High 9,031 · Low 8,977             │
└──────────────────────────────────────────────┘
```

**Anti-AI rationale:** Provenance as authored sentences (`delayed ~90s`, `fallback estimate`)
instead of "templated badge soup" is a real anti-generated tell; pulling retail entirely out of the
hero is the strongest spot-vs-retail _honesty_.

**Self-critique:** The premise is a "confident DISPLAY voice" but it forbids any display face and
manufactures the editorial signal from **small-caps-via-letter-spacing on Source Sans 3** — the
single most generic premium-SaaS move, and a fragile a11y pattern. Worse, **Cairo can't render
caps-spacing**, so the supposed signature signal does not survive the bilingual mandate — half the
audience never sees it. Freshness as a sentence is harder to scan and truncate (long Arabic
strings). `--color-dateline #8a7a5e` **fails AA** (4.00:1) and `--color-gold-mark #9c6f16` fails
(4.28:1) on the most trust-critical text. Switching the hero number to AED shifts emphasis away from
the XAU/USD spot traders anchor on.

---

## Judge panel & decision

Three lenses, each scored 0–10 per direction.

| Lens                                                                               | Precision Instrument | Vault / Bullion Craft | Editorial Trust Desk |
| ---------------------------------------------------------------------------------- | :------------------: | :-------------------: | :------------------: |
| **1. Trust & invariant fit** (freshness unmistakable, spot-vs-retail obvious)      |        **9**         |         **9**         |          6           |
| **2. Premium restraint & anti-AI-look** (designed-not-generated, dodges 3 clichés) |        **7**         |         **8**         |          6           |
| **3. Feasibility** (token delta, RTL, WCAG 2.2 AA verified, static-first perf)     |        **9**         |           6           |          4           |
| **TOTAL**                                                                          |        **25**        |        **23**         |        **16**        |

**Per-lens favourites:** Trust → Precision (by a hair over Vault). Premium → Vault. Feasibility →
Precision.

### CHOSEN DIRECTION: **Precision Instrument** (with grafts from Vault / Bullion Craft)

**Why.** Precision Instrument wins the aggregate (25 vs 23 vs 16) and, decisively, owns the
tiebreaker the brief names — the best **trust + premium balance that actually ships**. It scores
top-of-set on Trust (its freshness-as-the-price's-second-line is the most immediate "is this
current?" answer of the three) and top-of-set on Feasibility (a true _evolution_ of the tokens — 4
adds, 6 retunes, ~0 removals — with verified AA on every key pair, RTL that _eliminates_ the
existing physical-prop hazards, and a net _reduction_ in paint cost). Vault scored one point higher
on the pure-aesthetics lens, but its signature value-accent (`--color-gilt #9c6f1f`) is used as
small _text_ where it **fails WCAG AA (4.17:1)**, it gambles the whole "precision" signal on a new
font file in the asset path, and it leaves the dark tracker hero unverified — all of which the
feasibility judge penalised hard (6/10). Editorial Trust Desk is disqualified for a top slot: its
signature device fails AA twice over (`#8a7a5e` = 4.00:1, `#9c6f16` = 4.28:1), the device itself
**does not survive RTL** (Cairo can't render small-caps), and freshness-as-prose blunts the single
thing the trust lens prizes most.

Choosing Precision Instrument honours the locked Phase 0 gate most faithfully too: it is the
smallest, cleanest delta from the shipping token system, so it reads unambiguously as _refinement_,
not rewrite.

### Runner-up ideas grafted in (from Vault / Bullion Craft)

Vault's premium lead is real, and its strongest _non-failing_ ideas are grafted onto the Precision
base:

1. **The milled-rim bevel as the structural edge** (`--rim-inset`: inset light-top + shadow-bottom,
   **block-axis only** so it needs no RTL mirroring). This is strictly better than a flat hairline
   border _and_ better than the physical-prop foil rule it replaces — it reads "struck/pressed",
   giving the readout material authority without a single gradient. Adopted as the hero readout's
   edge treatment, layered with Precision's single `--shadow-md`.
2. **The "certified mark" idea, de-metallised.** Instead of Vault's gilt bar, the reference
   price-kind chip's _border_ re-points from the current 5-stop foil to a **flat** desaturated gold
   at low alpha — one quiet mark that says "this is the reference", zero gradient.
3. **The data-typeface upgrade documented as a Phase-2 stretch.** Precision ships the perf-safe
   slashed-zero-on-Source-Sans-3 baseline now (zero new bytes). Vault's distinct
   `--font-numeric-data` (subset mono, digits + symbols only, `font-display: swap`, `unicode-range`
   scoped, preloaded) is recorded as the **single highest-leverage future upgrade** with concrete
   loading constraints — so the audit's core complaint is answered, just deferred behind the
   static-first budget rather than declined.

What is **rejected** from the runners-up: Vault's `#9c6f1f` gilt-as-text (fails AA) and its broken
`#c9a costing` token; Editorial's small-caps eyebrow (RTL-fragile, generic), its AED-as-hero-number
(shifts emphasis off XAU/USD), and its freshness-as-prose (poor scannability/truncation).

---

## Chosen design system (source of truth)

This is the definitive spec. Everything is expressed as CSS custom properties, RTL-aware via logical
properties, and preserves the existing dark theme + `prefers-color-scheme` fallback + `[dir=rtl]`
font swap.

### Palette

Light values shown first; **Dark** in the final column. Tokens marked **NEW** are added; **RETUNE**
changes an existing value; everything else is **KEPT** verbatim.

| Token                                     | Light                 | Dark                  | Role                                                                                                                           | Status              |
| ----------------------------------------- | --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| `--color-bg`                              | `#fdfbf5`             | `#060708`             | Page canvas — parchment cooled ~1.5% off "cream".                                                                              | RETUNE (`#fefcf7`→) |
| `--color-surface`                         | `#ffffff`             | `#0c0e14`             | Primary card surface.                                                                                                          | KEPT                |
| `--color-surface-2`                       | `#faf7ee`             | `#141720`             | Secondary tinted surface.                                                                                                      | KEPT                |
| `--color-surface-3`                       | `#f3eedd`             | `#1b1e2c`             | Tertiary tint, skeleton/zebra.                                                                                                 | KEPT                |
| `--color-border`                          | `#d9cfb6`             | `#242840`             | Default border — calmed.                                                                                                       | RETUNE (`#e4d9c0`→) |
| `--color-border-subtle`                   | `#ece5d2`             | `#1a1e30`             | Subtle hairline.                                                                                                               | KEPT                |
| `--border-strong`                         | `#d6ccb4`             | —                     | Stronger border.                                                                                                               | KEPT                |
| `--color-rule`                            | `var(--color-border)` | (inherits)            | **The single structural seam** (readout spot/retail divider, table baseline). One per region, never decorative.                | **NEW (alias)**     |
| `--color-text`                            | `#15110a`             | `#f2eedd`             | Primary ink.                                                                                                                   | KEPT                |
| `--color-ink-data`                        | `#0f0c06`             | `#f7f3e6`             | **Darkest mark on the page** — reserved exclusively for the live spot price value + tracker readout. Hierarchy by ink density. | **NEW**             |
| `--color-text-muted`                      | `#6a5c48`             | `#a09890`             | Secondary text (freshness/retail body).                                                                                        | KEPT                |
| `--color-text-faint`                      | `#6f6350`             | `#8f857a`             | Tertiary, AA-tuned.                                                                                                            | KEPT                |
| `--color-gold`                            | `#b07d1f`             | `#ddb040`             | **Struck-metal value signal only** — focus ring, the live-OK accent dot, reference-chip border. Never a body-card fill.        | RETUNE (`#c4902e`→) |
| `--color-gold-light`                      | `#ddb040`             | `#f0ca5c`             | Gradient midtone (legacy use only).                                                                                            | KEPT                |
| `--color-gold-bright`                     | `#f0ca5c`             | `#fad97a`             | Gradient peak (legacy use only).                                                                                               | KEPT                |
| `--color-gold-dark`                       | `#7e5912`             | `#c4902e`             | Text/accent gold (`--text-accent`), AA on tints.                                                                               | KEPT                |
| `--color-gold-deep`                       | `#6b4a0e`             | —                     | Reference kind-chip label, single hero seal. AA on gold-tint.                                                                  | KEPT                |
| `--color-gold-tint`                       | `#f8f2dc`             | `#0c0a06`             | Reference chip bg.                                                                                                             | KEPT                |
| `--color-live`                            | `#1a7a32`             | `#5dd98b`             | LIVE green — freshness pulse, market-open.                                                                                     | KEPT                |
| `--color-daily`                           | `#a85800`             | `#f0a350`             | Daily-fixed amber-brown.                                                                                                       | KEPT                |
| `--color-fixed`                           | `#1050a0`             | `#6ba3f0`             | Fixed/official blue.                                                                                                           | KEPT                |
| `--color-stale`                           | `#a84000`             | `#f0a350`             | Stale/unavailable.                                                                                                             | KEPT                |
| `--color-move-up` / `-down`               | `#176832` / `#b81428` | `#5dd98b` / `#f87171` | Price movement (light).                                                                                                        | KEPT                |
| `--color-move-up-strong` / `-down-strong` | `#5dd98b` / `#f87171` | —                     | AA-safe movement on always-dark surfaces.                                                                                      | KEPT                |
| `--color-error`                           | `#b81428`             | `#f87171`             | Error/stale text + danger.                                                                                                     | KEPT                |

**WCAG contrast notes (recomputed; light theme unless noted).** All "AA" = WCAG 2.2 AA for normal
text (≥4.5:1) unless flagged as a graphical object (≥3:1).

- `--color-ink-data #0f0c06` on `--color-surface #ffffff` ≈ **18.9:1** (AAA); on
  `--color-bg #fdfbf5` ≈ **18.7:1**. The price is the most legible mark on the page — by design.
- `--color-text #15110a` on `#fdfbf5` ≈ 17.0:1 (AAA).
- `--color-text-muted #6a5c48` on `#fdfbf5` ≈ **6.2:1** (AA) — freshness/retail body text.
- `--color-text-faint #6f6350` on `--color-surface-3 #f3eedd` ≈ ~5:1 (AA), unchanged.
- `--color-gold-deep #6b4a0e` on `--color-gold-tint #f8f2dc` ≈ **5.4:1** (AA) — reference kind-chip
  label.
- `--color-gold #b07d1f` as a **7px status dot** is a graphical object (needs ≥3:1): on `#fdfbf5` ≈
  **3.5:1** (passes 3:1). **It is NEVER used as small text** — that is the rule that keeps the
  desaturated gold safe (and is exactly the rule Vault's gilt-as-text broke).
- Status palette untouched: `--color-live #1a7a32` ≈ 4.8:1; `--color-error #b81428` ≈ 6.1:1;
  `-strong` dark-safe variants ≥4.5:1 on dark. Movement is **colour + glyph + tinted shape**, never
  colour alone.
- Dark theme: `--color-ink-data #f7f3e6` on `#060708` ≈ ~18:1; `--color-gold #ddb040` on `#060708` ≈
  ~9:1.

### Typography

**Faces (KEPT — no new file ships in Phase 1):** Source Sans 3 (`--font-latin`) + Cairo
(`--font-arabic`, swapped under `[dir=rtl]`). Weights 400/500/600/700; **faux-800 retired** from the
hero (the size carries authority, not synthetic weight).

**The precision-instrument voice, manufactured from what we already pay for:**

- `--font-numeric: var(--font-latin)` with
  **`font-variant-numeric: tabular-nums lining-nums slashed-zero`** and
  `--font-feature-tabular: 'tnum' 1, 'lnum' 1, 'zero' 1`. Slashed-zero is the single most "terminal"
  signal and it rides the already-loaded SS3 woff2 — **zero new bytes**. Cairo numerals stay tabular
  via the existing RTL swap.
- _(Phase-2 stretch, documented not shipped:_ `--font-numeric-data` = a subset monospaced face (e.g.
  IBM Plex Mono / Spline Sans Mono), digits + `. , % $` + ~12 currency/karat glyphs only (~8–12KB),
  `font-display: swap`, `unicode-range` scoped, `<link rel=preload>`. This is the highest-leverage
  upgrade if the perf budget allows one more woff2.)\*

**Scale (Major Third, `--type-ratio: 1.25` from 16px base) — fixed:**

| Token                       | Value                                                                        | Note                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--text-2xs` … `--text-2xl` | `.625` / `.75` / `.875` / `1` / `1.0625` (md) / `1.25` / `1.5625` / `≈1.953` | KEPT (computed).                                                                                                                                       |
| `--text-3xl`                | `calc(var(--type-base) * 1.25 * 1.25 * 1.25 * 1.25 * 1.25)` ≈ **2.441rem**   | **FIX** — restores the ratio (was hand-set `2.4375`). Use chained `calc(... * ratio)`, **not** `pow()` (uneven engine support, can break first paint). |
| `--text-4xl`…`6xl`          | retained for legacy                                                          | Remove from default hero flow.                                                                                                                         |
| `--text-data-lg`            | clamp(1.95→2.75rem)                                                          | KEPT.                                                                                                                                                  |
| `--text-data-xl`            | clamp(2.6rem, 5vw, 3.9rem)                                                   | RETUNE (marginal, from `clamp(2.5, 4.8vw, 3.85)`).                                                                                                     |

**Hierarchy (the whole design):**

- Hero spot **price** → `--text-data-xl` clamp(2.6→3.9rem), weight **700**, `--color-ink-data`,
  tabular + slashed-zero, `--tracking-tight`. Caps the runaway `.hlc-price` 5.25rem/800 override.
- Change row → `--text-data-md` / 700.
- Open/High/Low strip → `--text-data-sm` / 600.
- Freshness line → `--text-ui-sm` / 600, tabular.
- Retail row → `--text-base` / 600 — **one full step DOWN** from the change/reference cluster.
- Marketing H1 → drops **800 → 700**, loses the italic gold subtitle (headlines must not out-shout
  the number).

**Line heights / tracking (KEPT):** none 1 / tight 1.2 / snug 1.35 / normal 1.5 / relaxed 1.65;
tighter −.04 / tight −.025 / wide .025 / caps .1em.

### Spacing

KEEP the 4px base and the existing scale. The space-5 = ×6 quirk is left as-is (changing it risks
regressions) but documented as canonical in the token-audit. The readout uses generous vertical
rhythm (`space-5`/`space-6` between price → freshness → change → rule → retail) so hierarchy reads
through whitespace, not borders.

```
--space-unit: 0.25rem;  /* 4px base — KEPT */
--rhythm-section: var(--space-7);   /* 48px — KEPT */
--card-padding:   var(--space-4);   /* 16px — KEPT */
```

### Radii

```
--radius-xs:4  --radius-sm:8  --radius-md:12  --radius-lg:16  --radius-xl:22  --radius-2xl:28  --radius-pill:999   /* ramp KEPT */
--radius-card:   var(--radius-lg);   /* 16 */
--readout-radius: var(--radius-lg);  /* 16 — the hero readout drops from 2xl(28) to lg(16): sharper = instrument */
```

The hero readout retunes **down** from `--radius-2xl` (28) to `--radius-card` (16). No new sharp/0px
token is introduced (Vault's 10px is rejected as inconsistent with the rest of the page).

### Elevation / shadows

The readout collapses the current `--shadow-xl + --shadow-gold + inset ring + hover-to-2xl` stack
into a **single soft `--shadow-md`**, layered with the grafted **milled-rim bevel** (block-axis
insets, no mirroring needed):

```
--readout-chrome: var(--shadow-md);                       /* NEW — the entire hero elevation budget */
--rim-inset: inset 0 1px 0 rgb(255 255 255 / 70%),        /* NEW — grafted from Vault; struck/pressed edge */
             inset 0 -1px 0 rgb(21 17 10 / 8%);
/* Dark: inset 0 1px 0 rgb(255 255 255 / 6%), inset 0 -1px 0 rgb(0 0 0 / 40%) */
```

- The parallel **`--shadow-gold` ramp is retired from usage** (tokens stay defined for legacy;
  nothing new applies them).
- Static content cards: `--shadow-xs` at rest, **no hover-lift**.
- Value is signalled by ink density + the live dot, never by glow.

### Motion

KEEP the full easing/duration library and **every** `prefers-reduced-motion` guard.

```
--ease-premium: cubic-bezier(.16, 1, .3, 1);   /* KEPT */
--transition: .18s ease;                       /* KEPT */
/* durations instant80 → xslow550 — KEPT */
```

- **The only animation on the home hero is the freshness LIVE dot** (existing `pulse-live-hero`,
  ~2s, reduced-motion-gated).
- Retire from usage: hero-section parallax, the four orb glows, `card-reveal`/`fade-up`/hover-lift
  staggers on static cards, `badge-glow` on the hero.
- Keep state-transition crossfades on the freshness chip (legitimately informative when state
  changes).

### Signature live-price hero (the one bold element)

A near-flat parchment-white readout panel. **Chrome budget, total:** `--readout-radius` (16px) +
`--rim-inset` (struck edge) + `--readout-chrome` (one `--shadow-md`). **No** foil top rule, **no**
bottom rule, **no** corner radial glow, **no** `backdrop-filter`, **no** hover translateY. The
reference price-kind chip border re-points from the 5-stop foil to a **flat** `--color-gold` at low
alpha (the de-metallised "certified mark" grafted from Vault).

Render order, top → bottom:

1. **Kind chip** `GOLD SPOT PRICE` (gold-tint bg, `--color-gold-deep` label) + **market-status**
   pill.
2. **PRICE** — `--color-ink-data` (darkest mark on the page), `--text-data-xl` (2.6→3.9rem), weight
   700, tabular + slashed-zero. Trailing, muted: `USD/oz`.
3. **FRESHNESS = the price's second line** (not a footnote): a 7px status dot (`--color-gold` OK /
   `--color-live` confirmed-live / amber cached / red stale) + explicit state word +
   `· 14:32:07 GST · XAU/USD`, `--text-ui-sm`/600 tabular. **State words are always present** — LIVE
   / DELAYED / CACHED / STALE / UNAVAILABLE — never colour alone. The dot is the only animated
   element.
4. **Change row** — existing glyph + tinted-square direction indicator + delta + `per troy ounce`.
5. **The ONE rule** — a single 1px `--color-rule` horizontal divider.
6. **Spot-vs-retail row** (below the rule) — `Retail (est., +making + 5% VAT)` at `--text-base`/600,
   `--color-text-muted`, on plain canvas (**no gold box**). Subordinate by scale + ink weight + the
   explicit `est.` label + position below the rule. Trailing micro-link `How retail differs →`.
   Quiet provenance caption: `Spot-linked reference · shops add making charges, VAT, margin`.

**ASCII wireframe — EN (`dir=ltr`), two-column home hero (copy left, readout right):**

```
┌────────────────────────────┬──────────────────────────────────────────┐
│  ● Auto-refresh · labeled   │  GOLD SPOT PRICE              [market: OPEN]│  kind-chip + status
│                             │                                            │
│  Gold Prices Today          │   ███████████████                          │  PRICE — darkest ink,
│  UAE, GCC & Arab World      │   2,417.30  USD/oz                         │  700, tabular slashed-0
│                             │                                            │
│  Spot-linked reference      │   ● LIVE · 14:32:07 GST · XAU/USD            │  freshness = line 2
│  prices before retail …     │   ▲ +12.40  (+0.52%)   per troy ounce       │  glyph+tint indicator
│                             │   ┄┄ Open ┄ High ┄ Low ┄┄                    │  O/H/L strip, data-sm
│  [ Open Live Tracker ]      │   ─────────────────────────────────────    │  the ONE rule
│  [ Use Gold Calculator ]    │   Retail (est. +making +5% VAT)     ~2,5—    │  subordinate, plain bg
│                             │   How retail differs →                      │
│  Browse · Alerts · Shops    │   Spot-linked reference · shops add …        │  quiet provenance
└────────────────────────────┴──────────────────────────────────────────┘
```

**RTL mirroring (`dir=rtl`).** The whole two-column grid mirrors at the grid level — the readout
column moves to the **left**, copy to the **right** — via logical properties only. Inside the
readout: kind-chip → right edge, market-status → left (flex `order`, no physical positioning); the
freshness row uses `text-align: start` so `LIVE · timestamp` begins on the reading edge in both
directions; `USD/oz` → `دولار/أونصة` trailing the number on its start side; the O/H/L strip and the
single `--color-rule` divider are full-width / direction-agnostic. The change glyph (▲/▼) keeps
semantic up = gain in both locales (colour + glyph, never rotation). Crucially, **this hero removes
the foil rule and corner glow entirely — deleting the only non-mirroring physical-prop code paths**
that exist in the current hero (`home.css:407-419` `top/left/right`). The grafted `--rim-inset` is
block-axis only, so it needs no mirroring. Localised pseudo-content is preserved: `· Retail est.` →
`· تقدير تجزئة`, state words → AR equivalents.

---

## Token-change plan for `styles/partials/tokens.css`

A minimal, ordered diff. Apply in this order. Anything touching dark-mode is flagged **[DARK]**.

### 1. ADD — new custom properties (4 + 2 component tokens)

| Token                     | Value                                                                     | Where used                                                                   | Dark override                                                                     |
| ------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `--color-ink-data`        | `#0f0c06`                                                                 | `.hlc-price`, `.price-hero__value--xl`, tracker readout value                | **[DARK]** `#f7f3e6`                                                              |
| `--color-rule`            | `var(--color-border)`                                                     | the single structural seam (readout divider, table baseline)                 | inherits (no separate value needed)                                               |
| `--readout-chrome`        | `var(--shadow-md)`                                                        | the hero readout's only elevation                                            | inherits (`--shadow-md` already has dark form)                                    |
| `--rim-inset`             | `inset 0 1px 0 rgb(255 255 255 / 70%), inset 0 -1px 0 rgb(21 17 10 / 8%)` | hero readout struck edge (grafted from Vault)                                | **[DARK]** `inset 0 1px 0 rgb(255 255 255 / 6%), inset 0 -1px 0 rgb(0 0 0 / 40%)` |
| `--readout-radius`        | `var(--radius-lg)`                                                        | hero readout corner (component alias)                                        | inherits                                                                          |
| `--font-numeric-features` | `'tnum' 1, 'lnum' 1, 'zero' 1`                                            | extend `--font-feature-tabular` usage on price selectors (adds slashed-zero) | inherits                                                                          |

### 2. RETUNE — change value, keep token name (no consumer churn)

| Token            | Old                             | New                                                                                                                                     | Note                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--color-bg`     | `#fefcf7`                       | `#fdfbf5`                                                                                                                               | Cool the parchment ~1.5%. **[DARK]** unchanged (`#060708`).                                                                                                                                                                                                    |
| `--color-border` | `#e4d9c0`                       | `#d9cfb6`                                                                                                                               | Calmer rule colour. **[DARK]** unchanged (`#242840`).                                                                                                                                                                                                          |
| `--color-gold`   | `#c4902e`                       | `#b07d1f`                                                                                                                               | Desaturate/deepen to struck-metal value signal. **[DARK] KEEP `#ddb040`** (the dark gold is already correct — do **not** retune it; only the light value changes). The AA-tuned `--color-gold-dark`/`-deep`/`--text-accent` are **unaffected** and still pass. |
| `--text-3xl`     | `2.4375rem` (hand-set)          | `calc(var(--type-base) * var(--type-ratio) * var(--type-ratio) * var(--type-ratio) * var(--type-ratio) * var(--type-ratio))` ≈ 2.441rem | Restores the 1.25 ratio. **Use chained `calc()`, not `pow()`** (engine support).                                                                                                                                                                               |
| `--text-data-xl` | `clamp(2.5rem, 4.8vw, 3.85rem)` | `clamp(2.6rem, 5vw, 3.9rem)`                                                                                                            | Marginal; the hero price uses this instead of a 5.25rem override.                                                                                                                                                                                              |

### 3. KEEP — do not touch (explicitly preserved)

- Entire **status palette** + AA notes: `--color-live`/`-daily`/`-fixed`/`-stale`/`-move-up`/`-down`
  and the `-strong` dark-safe variants.
- The full **freshness state machine** (`data-freshness-key` / `data-freshness-age` + colours +
  `⚠`/`✕` glyphs + pulse).
- All AA-tuned **gold text tokens** (`--color-gold-dark`, `--color-gold-deep`, `--text-accent`),
  `--color-gold-tint`.
- **Radius ramp**, **spacing scale**, **motion/easing/duration** library.
- **`[data-theme=dark]` block**, **`prefers-color-scheme` fallback**, **`[dir=rtl]` font swap**
  (`--font-main`/`-display`/`-numeric` → Cairo).
- **`--font-feature-tabular`** primitive (extended in §1, not replaced).

### 4. RETIRE FROM USAGE — leave defined, stop applying (mark DEAD in token-audit)

These stay in the token file for legacy/lint safety, but **must be explicitly documented as dead**
so they are not silently re-applied. Verified live today at `home.css:394` (blur) and
`home.css:403-422` (`::before`/`::after` physical-prop foil + corner glow).

- `--rule-foil` (5-stop) and `--foil-underline` — on `.hero-live-card::before`.
- `--gradient-gold` (5-stop) — as a fill on the reference/retail chips and content cards.
- `--shadow-gold` / `-lg` / `-xl` — the parallel gold-glow ramp (no new applications).
- `backdrop-filter: blur(2px)` on the hero card; the four `.hero::before` orb radials + parallax;
  the `::after` corner radial glow.
- `--color-champagne` / `-soft` — retire (already flagged in token-audit; do not expand).
- The italic gold `.hero-title-sub`; the `◈` tool-card glyph; the `⚡` freshness-banner emoji; flag
  emoji at 1.45rem.

### 5. New semantic component tokens to introduce

- `--readout-chrome`, `--rim-inset`, `--readout-radius`, `--font-numeric-features` (all in §1).
- `--color-rule` as the canonical name for the single structural seam.

**Net delta:** ~6 added, 6 retuned, 0 hard-removed from the token file. A true evolution within the
warm-parchment identity, not a rewrite.

---

## Invariant & a11y guardrails

How this system upholds the hard invariants and the brief's a11y/perf demands.

### Spot-vs-retail subordination (STRICT)

- The reference (spot) price is `--color-ink-data` — the **literal darkest, largest mark** on the
  page. Retail sits **below the single `--color-rule` divider**, one full type-step smaller, in
  `--color-text-muted`, on **plain canvas with no gold box**.
- **Fixes the current invariant violation:** today `price-kind--retail` carries a gold _gradient_
  fill + 1.5px 50% gold border, making retail _heavier_ than the reference chip. The new system
  removes that gradient (it joins the retired-from-usage list) so retail can never out-weigh the
  reference. Reference and retail are distinguished by mass, label, and position — never by giving
  retail the stronger visual.
- Retail always carries the explicit `est.` label + `+making + VAT` qualifier; the hero provenance
  caption names making charges, VAT, and margin. Making-charge figures remain computed estimates,
  never live shop data.

### Freshness always visible (PRODUCT, not decoration)

- Freshness is the **price's second line**, impossible to miss in the same downward glance that
  reads the price.
- The verified `data-freshness-key` / `data-freshness-age` state machine is preserved verbatim, only
  restyled. **Every state shows an explicit word** (LIVE / DELAYED / CACHED / STALE / UNAVAILABLE /
  estimated / derived / fallback) plus its glyph (`●`/`⚠`/`✕`) — **never colour alone**. The status
  dot is `aria-hidden` decoration; the word carries meaning.
- The freshness chip text is legible (`--text-ui-sm`/600 tabular) — never the "10px grey timestamp"
  failure.

### WCAG 2.2 AA contrast (recomputed, not self-reported)

- Every key text pair passes AA: `--color-ink-data` 18.7–18.9:1, `--color-text` 17:1,
  `--color-text-muted` 6.2:1, `--color-text-faint` ~5:1, `--color-gold-deep` on tint 5.4:1,
  `--color-live` 4.8:1, `--color-error` 6.1:1.
- The desaturated `--color-gold #b07d1f` is **only ever a graphical object** (7px dot, focus ring,
  chip border) at ≥3:1 (3.5:1 on parchment) — **never small text**. This is the explicit rule that
  avoids the AA failures that sank Vault's gilt-as-text (4.17:1) and Editorial's dateline (4.00:1) /
  gold-mark (4.28:1).
- Movement is colour + glyph + tinted shape; dark surfaces use the `-strong` AA-safe variants.

### RTL correctness (logical-property-first)

- The hero mirrors at the grid level; inside the readout, everything uses `inset-inline`,
  `margin-inline`, `padding-inline`, `text-align: start/end`, `border-inline` — no hardcoded
  left/right.
- This direction **eliminates** the only physical-prop hazards in the current hero (the foil rule's
  `top/left/right` and the corner glow's `right:-60px`) by removing those effects entirely. The
  grafted `--rim-inset` is block-axis only → no mirroring.
- The `[dir=rtl]` Cairo font swap and tabular numeral features carry over; localised pseudo-content
  (`· تقدير تجزئة`, AR state words) is preserved.

### Static-first performance (faster than current)

- **Net reduction in paint cost.** Removing `backdrop-filter: blur(2px)`, four stacked
  radial-gradient orbs, the scroll-linked parallax transform, and multi-layer gold shadows cuts
  compositor work and improves LCP/INP — the LCP element becomes a plain text node + one
  `--shadow-md` + a cheap inset bevel, not a blurred glow-stacked card.
- **Zero new font bytes in Phase 1** — slashed-zero is a feature flag on the already-loaded SS3
  woff2. `font-display: swap`, subset `unicode-range`, and the `min-block-size: 1em` CLS guard on
  `.hlc-price` are unchanged.
- The Phase-2 `--font-numeric-data` upgrade, if adopted, is constrained to a digit/symbol subset
  (~8–12KB), `font-display: swap`, `unicode-range` scoped, preloaded — so it stays within the
  static-first budget.
- No framework; vanilla ES6 + Vite preserved. All animation behind `prefers-reduced-motion`.
