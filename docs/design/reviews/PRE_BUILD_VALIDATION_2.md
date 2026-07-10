# Pre-Build Design Validation — Final Pass

**For owner approval before ANY production code.** Prepared by Claude (coordinator + visual gate).
This is the second, final validation pass requested before implementation approval. It extends
[PRE_BUILD_VALIDATION.md](./PRE_BUILD_VALIDATION.md) (which already covers the A-synthesis homepage
mockups, three-concept comparison, journeys, consistency audit, and metrics). **No production code
has started; `main` is untouched at `d9c5d7d25`.**

**New screenshots (all in [`docs/design/reviews/mockups/`](./mockups/), rendered from
`system-scale.html`):** `scale_1_calculator.png`, `scale_2_country.png`, `scale_3_compare.png`,
`scale_4_portfolio.png`, `scale_5_learn-article.png`, `scale_6_shops.png`,
`scale_7_future-proof.png`, `scale_8_pushed-hero.png`. Interactive source: `system-scale.html`. All
carry the "illustrative sample values — not live" ribbon; every price is the same
internally-consistent sample (spot `$4,108.70` → 24K `485.13 AED/g`).

---

## 1. Pushed beyond implementation constraints (the ideal, not the easy)

I deliberately designed past what today's HTML/CSS makes cheap. Engineering figures out how later.
See **`scale_8_pushed-hero.png`** and the notes in
[Direction V2](../GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md):

- **Karat dial (new signature moment).** Instead of a row of karat tiles, a **circular gold gauge**
  you drag; the arc fills to the selected karat and the center value re-rolls (`485.13 AED/g`). It's
  physical, teaches purity as a proportion of a full ring, and is unlike anything on a competitor —
  but it needs a custom SVG/gesture component that doesn't exist today. Designed anyway.
- **Split-digit price treatment.** The integer is huge, the decimals smaller, the currency raised
  and gold — a bespoke numeral composition (not just a big number) that becomes the brand's face and
  pairs with the odometer "tick."
- **Market-pulse hero field.** A soft radial gold field + a live "updates every few seconds" pulse
  instead of a bordered card — the price sits _in_ the page, not in a box.
- **What I changed from the first mockup:** the earlier hero leaned on a familiar split layout
  (flagged as a cliché in my own B1 critique). This version makes the **identity** carry the hero —
  dial + numeral treatment + pulse field — so the layout is no longer doing the differentiating
  work.

These are design targets; the Visual Acceptance Gate still applies when they're built
(reduced-motion fallback for the dial, keyboard/radio semantics, mobile gesture).

## 2. The system scales across the whole product

The **same** tokens, type, spacing, surfaces, numerals, and one-accent gold applied to six more page
types. Each proves a different stress on the system:

| Page                | Screenshot                  | What it proves                                                                                    | System held? |
| ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------- | ------------ |
| **Calculator**      | `scale_1_calculator.png`    | tool-first (input + result lead; freshness quiet) — the opposite of today's chrome-first page     | ✅           |
| **Country pricing** | `scale_2_country.png`       | a data page can carry _editorial story_ (why Dubai, where, VAT) without a new visual language     | ✅           |
| **Compare**         | `scale_3_compare.png`       | dense comparison as **length-encoded bars** + "cheapest" reveal — designed, not a default table   | ✅           |
| **Portfolio**       | `scale_4_portfolio.png`     | a numbers-heavy **wealth dashboard** (big total + holdings table) in the same warm system         | ✅           |
| **Learn article**   | `scale_5_learn-article.png` | long-form **publication** (measured column, pull-context module, editor byline) — not a blog card | ✅           |
| **Shops**           | `scale_6_shops.png`         | a **curated directory** with honest trust chips (hallmarked, established) and "confirm in person" | ✅           |

**Where the system was tested and reinforced:** the **Learn article** forced a real reading measure
(~66ch) and a typographic scale the homepage didn't exercise — so the type ramp in Direction V2 §VII
is now proven on body copy, not just headings. The **Portfolio** forced a dense data table to sit in
a warm/light system without feeling like a spreadsheet — solved with the shared card +
tabular-numeral + hairline-row treatment (same as Compare). Nothing broke; two components (measured
prose, data table) were added to the shared kit rather than invented per-page.

## 3. Signature components — the permanent GoldTickerLive identity

Which components are _identity_, not just UI — the things that should stay recognizable for years
and carry across web + mobile app. For each, why it earns permanence:

| Component                                                    | Why it's permanent identity                                                                                                                                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tabular "ticker" numeral treatment**                       | Every price on every surface uses it; it's the one thing a user sees a thousand times. The split-digit + raised-gold-currency composition is unmistakably ours and readable in EN/AR. **The single strongest identity asset.** |
| **The "tick" motion**                                        | How a live price _changes_ is a brand behavior, not decoration — a recognizable micro-moment competitors don't have, and it encodes up/down.                                                                                   |
| **Karat dial + ladder**                                      | Domain-specific to gold (nobody else needs it); it teaches purity ÷24 by feel and is visually distinctive. The category's signature interaction.                                                                               |
| **Live-market hero (price-as-protagonist + pulse field)**    | The front door of the whole product; sets the "editorial bullion terminal" tone every page inherits.                                                                                                                           |
| **Freshness object (status-dot pulse + source + timestamp)** | Trust is the product's moat; one consistent freshness object everywhere is both identity and credibility.                                                                                                                      |
| **Assay-gold-on-warm-paper palette + material moments**      | The warmth (not cold fintech) + restrained gold material is the emotional signature; it says "gold" without clip-art.                                                                                                          |
| **Editorial serif + humanist sans pairing**                  | The voice — authoritative but human — that separates us from data-portal competitors (Kitco) and cold fintech.                                                                                                                 |
| **Comparison bars (length-encoded)**                         | The recognizable way GoldTickerLive shows "where is it cheapest," reused on compare/country/heatmap.                                                                                                                           |

Everything else (buttons, cards, nav) is _system_, not _signature_ — it should feel excellent but
need not be uniquely ours. The eight above are the ones to protect in every future decision.

## 4. Success metrics — technical **and** product

Technical metrics from [PRE_BUILD_VALIDATION.md §5](./PRE_BUILD_VALIDATION.md) still hold (LCP<2.5s,
CLS≈0, a11y pass, 0 price divergence, disclaimer 5→1, section-repetition 3×→1). Added **product**
metrics — the redesign must move the product, not just the pixels:

| Product outcome                    | Metric to instrument (privacy-conscious, no new trackers)                 | Direction                                        |
| ---------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| Faster route to today's price      | time-to-first-meaningful-view; % seeing price + day-change without scroll | ↑ (price is the hero)                            |
| Increased calculator usage         | homepage → calculator CTR; % sessions that compute a value                | ↑ (inline calc + hero CTA + karat dial handoff)  |
| Increased country-comparison usage | homepage → compare/country CTR; comparisons run per session               | ↑ (comparison hook on 2 journeys)                |
| Increased Learn engagement         | learn-rail CTR; article scroll-depth; "read n of 9" completion            | ↑ (publication treatment + inline price context) |
| Increased return visits            | 7-day return rate; alert sign-ups                                         | ↑ (day context + range "you are here" + alerts)  |
| Improved trust perception          | on-page survey / qualitative; disclaimer-once; single freshness object    | ↑ (craft + precision + honesty)                  |
| Lower confusion                    | task-success in moderated tests ("find 18K/g", "is today high?"); bounce  | ↑ (one idea per screen)                          |
| Stronger feature discoverability   | % of sessions reaching ≥2 tools; nav price-pill CTR                       | ↑ (audience routing surfaces every tool)         |

Each page PR reports movement (or a credible plan) on the rows it touches, with before/after
screenshots, at the Visual Acceptance Gate.

## 5. Future-proof — a 3-year horizon (extends without a redesign)

See **`scale_7_future-proof.png`** — the system absorbs the roadmap using patterns already present,
not new languages. Everything shown is **gated/soon**; nothing fabricated, no live pilots:

| Future capability                 | How the system extends (no redesign)                                                                                                                                          | Guardrail kept                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Silver / Platinum / Palladium** | one **metal-switcher** (segmented control) above every price surface; the entire layout (hero, ladder, calc, compare) is metal-agnostic and re-renders for the selected metal | metals pilot stays **OFF** until owner + real feed |
| **Crypto comparison**             | the **"gold vs other assets"** module already has BTC/ETH rows (gated "soon"); descriptive correlation only                                                                   | descriptive, **never** forecasts; gated            |
| **Premium subscription**          | a **tier badge** (`◆ Premium`) in nav + per-feature lock chips; ad-free/alerts/exports slot into existing surfaces                                                            | billing owner-gated; nothing live                  |
| **Public API / widgets**          | "Public API" + "Widgets / embed" are existing IA entries; the numeral/freshness components are the embeddable unit                                                            | owner-gated infra                                  |
| **Mobile apps**                   | the **token system** (color/space/type/motion) is platform-agnostic; the bottom tab bar + price-first hero are already app-shaped                                             | same design system, no re-theme                    |
| **More languages (FR/HI/UR)**     | type scale uses `clamp()` + logical properties; the **locale menu** already exists; RTL is first-class (proven in AR)                                                         | i18n noindex-until-reviewed                        |
| **AI features**                   | a single **descriptive market-analysis module**, reused sitewide, explicitly "backward-looking & rules-based — never a forecast or advice"                                    | informational-only, never advice                   |
| **Richer analytics**              | the data-feature + chart language + insight stats scale to more series/timeframes                                                                                             | real data + freshness labels                       |

**Design rule that makes this work:** every surface is built from a small kit of **metal-agnostic,
locale-agnostic, tier-aware** blocks. Adding a metal, a language, a tier, or an asset is
_configuration_, not a redesign.

## 6. Final honest recommendation — the 5 criticisms that would still land

Asked truthfully: if this launched publicly tomorrow, what would an experienced product designer
still criticize? Here are the five most likely, what I've already done, and what honestly remains.

1. **"It's mockups — the hard part (motion, real data, the dial's gesture) isn't proven."** _Fixed
   as far as static allows:_ the mockups are high-fidelity and internally consistent; motion, RTL,
   and states are specified. _Remains:_ the tick, karat dial, and reduced-motion equivalents must be
   proven **in the production build** — that's exactly what the section-by-section Gate enforces.
   Honest and unavoidable until we build.
2. **"The warm-paper + gold palette risks a heritage/jeweller cliché."** _Mitigated:_ gold is
   confined to accents/hairlines/one material moment; ink + whitespace + editorial type carry
   modernity; a first-class **dark theme** exists. _Remains:_ this is a taste line to hold in build
   — one gradient-heavy section and it tips. Owner may prefer to see a **dark-theme hero variant**
   before approving; I can produce it on request.
3. **"Two focal points — the serif headline and the giant numeral — still compete a little."**
   _Fixed:_ the pushed hero demotes the headline to a kicker line so the **number wins**. _Remains:_
   needs verification at every breakpoint in AR (longer headlines) during build.
4. **"Some blocks are still cards; a skeptic will call parts of it 'nice cards.'"** _Fixed
   structurally:_ the homepage collapses today's 3× repeated tool-card sections into one routing
   band; compare/country/portfolio use bars/tables/dashboards, not card grids. _Remains:_ the
   routing band, shop cards, and learn guides are card-based by nature — defensible, but a purist
   will note it. The differentiation must keep coming from the signature components, not the cards.
5. **"Real photography is faked with gradients; the souk sections live or die on image quality."**
   _Honest by design:_ I used clearly-labeled gradient placeholders (no fabricated photos).
   _Remains:_ the editorial "Gulf markets" and shop sections need genuine, licensed souk photography
   to reach the intended premium bar — a real content dependency, not a design one. Flagged for the
   owner: **we need a photography source** (or the sections adapt to an illustration system).

**Also honestly remaining (smaller):** the mobile hero "what's it worth" line wraps awkwardly
(logged, fixed in build); the karat dial needs a genuinely accessible non-gesture path; performance
of a self-rendered chart vs the current TradingView embed is unproven until measured.

**Recommendation:** the visual system is **strong, coherent, original, and proven to scale** across
eight surfaces and the 3-year roadmap. The five criticisms above are either already addressed or are
**build-time verifications and one content dependency (photography)** — none is a reason to change
the system. My recommendation is to **approve the visual system** and let me build the flagship
homepage first (A-synthesis + karat dial + canonical F-1 source), section by section, each held to
the Visual Acceptance Gate with before/after EN+AR evidence — and to tell me now if you want a
**dark-theme hero variant** and how you want to handle **souk photography** before I start.

---

## Guardrails & status

Real/labeled data only; peg 3.6725 / troy 31.1035 / karat ÷24 / spot≠retail; no fabricated live
prices (every mockup ribbon-labeled); EN+AR with intentional RTL; reduced-motion specified;
metals/crypto/ premium/API shown **gated**, none live; flags/pilots OFF; `main` untouched at
`d9c5d7d25`; all work on `design/visual-transformation-checkpoint-2026-07-10` (PR #641).

### ⏸ Stopping here — requesting implementation approval

This completes the final validation pass. **No production code will begin until you explicitly
approve the visual system.** Two questions that would help me start clean: (a) approve the system
as-is, or do you want a **dark-theme hero variant** first? (b) how should we source **souk
photography** (license a set, or design an illustration system)? On your approval I begin
`redesign/home`.
