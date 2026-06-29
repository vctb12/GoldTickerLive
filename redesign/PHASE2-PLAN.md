# Phase 2 — Component Library Implementation Plan

**Date:** 2026-06-29 **Status:** Phase 2 planning — READ-ONLY plan. This document is the only file
written; no source files are modified, no git, no `npm install`. It applies the chosen **Precision
Instrument** design system (`redesign/DESIGN-SYSTEM.md`) to the core components — the signature
live-price readout, the spot-vs-retail price primitive, and the shared shell — and fixes the two
documented audit defects (`redesign/AUDIT.md`).

All Phase-1 tokens are already present and unconsumed in `styles/partials/tokens.css`
(`--color-ink-data`, `--color-rule`, `--readout-radius`, `--readout-chrome`, `--rim-inset`,
`--font-numeric-features`; retuned `--color-gold #b07d1f`, `--color-bg #fdfbf5`,
`--color-border #d9cfb6`). Phase 2 is greenfield **application** of those tokens. No raw hex is
introduced anywhere.

**Verification convention.** Every edit is tagged **VERIFIED** (the exact lines were read in this
planning pass) or **UNVERIFIED** (reasoned, must be confirmed at implementation). Almost every CSS
line below is VERIFIED; the load-bearing UNVERIFIED items are the JS retail-render wiring, the
runtime contrast re-measurement, and the per-site replacement values in the large decorative batch.

**Hard invariants this plan must never violate** (re-confirmed in the checklist, §7): AED peg
3.6725; troy oz 31.1035; STRICT spot-vs-retail subordination (retail smaller / muted / `est.` /
below the rule, never equal-or-greater weight); freshness always visible with an explicit state
**WORD** (LIVE/DELAYED/CACHED/STALE/UNAVAILABLE), never colour alone; no fabricated data; EN/AR
parity + RTL via logical properties only; static-first vanilla ES6 + Vite.

**Generated-page constraint.** `styles/partials/price-display.css` is **shared, unbundled** CSS
loaded by the 263 verbatim-copied country/city pages (via `global.css`) and by `/chart/`. Its
`.cp-mi-stat--retail`, `.cp-hero .cp-price-value`, and `.price-kind--reference` rules render on
those pages. `styles/country-page.css` is likewise loaded unbundled on every country page. **None of
these classes are baked into HTML by the generator** — the retail card is JS-injected at runtime by
`countries/country-page.js`, so no generated HTML is hand-edited and `consolidate-country-pages.js`
needs no change. `styles/pages/home.css` is loaded **only** by `index.html` (the 263 country pages
do not import it), so all home-hero/decorative edits are scoped to the homepage. `index.html` is
already `/` in `sw.js PRECACHE_URLS`; no top-level page is added or renamed, so PRECACHE_URLS and
the sw-coverage allow-list need no new entries — but bump `sw.js CACHE_NAME` on deploy so the edited
shell re-caches.

---

## Priority 0 — Spot-vs-retail invariant fix

**One line:** Remove the gold gradient + thick gold border from every retail surface so retail can
never carry equal-or-greater visual weight than the reference (spot) mark — fixing the active
invariant violation at `price-display.css:26-30` and `:282-286` and the live country-page retail
card cascade in `country-page.css:741-744,1087-1090`.

**Why this makes retail subordinate.** After these edits, subordination is enforced by four
independent structural signals, none of which is colour-alone:

1. **Ink weight** — retail text drops to `--color-text-muted` (#6a5c48, 6.2:1 AA) while the
   reference/spot value uses `--color-ink-data` (#0f0c06, the darkest mark on the page).
2. **Fill** — retail loses its gold gradient entirely and sits on a flat neutral surface; the
   reference chip keeps the single quiet gold-tint mark.
3. **Border mass** — retail border drops `1.5px → 1px` and from gold to neutral; the reference chip
   keeps its (now flat, low-alpha) gold edge, which is strictly heavier than retail's hairline.
4. **Label + position** — the explicit `est.` / `· Retail est.` label is untouched; on the readout
   retail also sits below the single `--color-rule` divider (§Priority 1).

The reference (spot) chip is the only surface that retains any gold, and only as a flat low-alpha
edge — the de-metallised "certified mark" grafted from Vault.

### Edits (apply in this order)

**P0-1 — `styles/partials/price-display.css:20-24` — reference chip → flat de-metallised gold edge.
VERIFIED.**

```css
/* before */
.price-kind--reference {
  color: var(--text-accent);
  background: var(--color-gold-tint);
  border: 1px solid color-mix(in srgb, var(--color-gold) 35%, transparent);
}
/* after */
.price-kind--reference {
  color: var(--color-gold-deep);
  background: var(--color-gold-tint);
  /* De-metallised "certified mark": one flat low-alpha gold edge, no foil/gradient */
  border: 1px solid color-mix(in srgb, var(--color-gold) 30%, transparent);
}
```

Rationale: DESIGN-SYSTEM §Signature hero + §Spot-vs-retail. `--color-gold-deep` (#6b4a0e, 5.4:1 on
gold-tint) is the spec's named "reference kind-chip label" role (tokens table line 370). Consumers:
`index.html:216` (home hero title) and `src/pages/chart/chart-page.js:211` (chart hero) — the
load-bearing visible change. **Open question for the writer is resolved below (§8): the colour swap
`--text-accent → --color-gold-deep` is OPTIONAL spec-alignment; leaving `--text-accent` also passes
AA and the invariant fix does not depend on it. This plan mandates `--color-gold-deep` for spec
fidelity but flags it as the one cosmetic, non-invariant choice.**

**P0-2 — `styles/partials/price-display.css:26-30` — retail chip → flat muted, subordinate.
VERIFIED.**

```css
/* before */
.price-kind--retail {
  color: var(--color-gold-deep);
  background: linear-gradient(135deg, var(--color-gold-bg) 0%, var(--surface-secondary) 100%);
  border: 1.5px solid color-mix(in srgb, var(--color-gold) 50%, transparent);
}
/* after */
.price-kind--retail {
  /* Subordinate to reference: flat muted, no gold gradient, no thick gold border */
  color: var(--color-text-muted);
  background: var(--surface-secondary);
  border: 1px solid var(--border-subtle);
}
```

Rationale: directly removes the gold gradient (joins RETIRE-FROM-USAGE) + the 1.5px 50%-gold border.
**Latent rule — VERIFIED zero markup consumers** (grep: `.price-kind--retail` appears only in this
CSS definition and DESIGN-SYSTEM.md prose), so this cannot break a rendered page; it forward-proofs
the primitive against any future retail-chip usage. **Reconciliation note:** the Priority-1 (hero)
area map proposed `background: transparent; border: 1px solid var(--color-rule)` for the same rule.
This plan uses the Priority-0 owner's version (`--surface-secondary` + `--border-subtle`) because it
matches the shipping `.cp-mi-stat--retail` treatment (P0-3) for cross-surface consistency;
`--color-rule` is an alias of `--color-border` (≈ `--border-subtle`), so the two proposals are
visually near-identical hairlines and there is no invariant difference.

**P0-3 — `styles/partials/price-display.css:282-286` — shipping retail card (`.cp-mi-stat--retail`)
de-metallise. VERIFIED.**

```css
/* before */
.cp-mi-stat--retail {
  border: 1.5px solid color-mix(in srgb, var(--color-gold) 55%, transparent);
  background: linear-gradient(160deg, var(--color-gold-bg) 0%, var(--surface-secondary) 100%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-gold) 12%, transparent);
}
/* after */
.cp-mi-stat--retail {
  /* Retail estimate: subordinate to the reference cards — flat, muted, no gold, no ring */
  border: 1px solid var(--border-subtle);
  background: var(--surface-secondary);
  box-shadow: none;
}
```

Rationale: this is the retail surface that **actually renders** on ~263 country pages
(`countries/country-page.js:493`). Removing the gold gradient (RETIRE), dropping the border to 1px
off-gold, and killing the gold inset ring makes it lighter-or-equal to the neutral `.cp-mi-stat`
sibling (`country-page.css:1073-1080`, 1.5px `--border-subtle`). The `· Retail est.` /
`· تقدير تجزئة` label pseudo (`:288-298`) is untouched — the `est.` meaning survives.

**P0-4 — `styles/country-page.css:741-744` — flatten the earlier retail block. VERIFIED.**

```css
/* before */
.cp-mi-stat--retail {
  border-color: var(--color-gold);
  background: var(--color-gold-tint);
}
/* after */
.cp-mi-stat--retail {
  border-color: var(--border-subtle);
  background: var(--surface-secondary);
}
```

Rationale: defense-in-depth — removes gold from the first definition so no cascade ordering can
resurrect a gold retail card.

**P0-5 — `styles/country-page.css:1087-1090` — flatten the WINNING retail block + clear the raw-hex
gold. VERIFIED.**

```css
/* before */
.cp-mi-stat--retail {
  border-color: rgb(196 144 46 / 35%);
  background: linear-gradient(135deg, var(--color-gold-tint) 0%, var(--gradient-card) 100%);
}
/* after */
.cp-mi-stat--retail {
  border-color: var(--border-subtle);
  background: var(--surface-secondary);
}
```

Rationale: this is the rule that actually wins on country pages (later top-level rule, equal
specificity to `:741`). It carries the **raw-hex old-gold `rgb(196 144 46)` (#c4902e)** — a Phase-1
token violation — plus the gold gradient. Replacing with `--border-subtle` + `--surface-secondary`
matches P0-3, clears the raw hex, and makes retail provably subordinate to the neutral `.cp-mi-stat`
sibling on every country page in light and dark (both tokens have dark overrides in tokens.css).

**Dark mode:** none of P0-1…P0-5 sit inside `[data-theme=dark]`; all use tokens that already have
dark overrides, so dark theme inherits the flat treatment automatically.

---

## Priority 1 — Signature live-price readout

Rebuild `.hero-live-card` as the Precision-Instrument readout per DESIGN-SYSTEM §Signature hero:
flat parchment panel, one `--shadow-md` + struck rim, no foil/orb/glow/blur/hover-lift; the price is
the darkest, largest mark; freshness carries an explicit state **WORD**; one rule divider; a
subordinate retail row below it. Files touched in apply order: `price-display.css` (price primitive)
→ `home.css` (hero chrome + price + title + new rule/retail) → `home.js` (freshness word + retail
render) → `index.html` (retail row markup).

### P1-1 — `styles/partials/price-display.css:59-70` — re-point the shared price primitive to the data voice. VERIFIED.

```css
/* before */
.price-hero__value,
.hlc-price,
.cp-hero .cp-price-value,
.order-price-badge {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: var(--font-feature-tabular);
  font-weight: var(--weight-extrabold);
  color: var(--text-primary);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
}
/* after */
.price-hero__value,
.hlc-price,
.cp-hero .cp-price-value,
.order-price-badge {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
  font-feature-settings: var(--font-numeric-features);
  font-weight: var(--weight-bold);
  color: var(--color-ink-data);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
}
```

Rationale: DESIGN-SYSTEM §Typography retires faux-800 ("size carries authority, not synthetic
weight") and adds slashed-zero (zero new bytes). This is the PRIMITIVE, so the ink-data/700 voice
propagates to the chart-page reference value and the country `cp-hero .cp-price-value` too —
intended and consistent with the system. Shared/unbundled CSS, VERIFIED these selectors style only
price values.

### P1-2 — `styles/pages/home.css:519-528` — cap the runaway `.hlc-price` override. VERIFIED.

```css
/* before */
.hlc-price {
  font-family: var(--font-numeric);
  font-size: clamp(3.4rem, 8.5vw, 5.25rem);
  font-weight: var(--weight-extrabold);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: var(--tracking-tight);
  min-block-size: 1em;
}
/* after */
.hlc-price {
  font-family: var(--font-numeric);
  font-size: var(--text-data-xl);
  font-weight: var(--weight-bold);
  color: var(--color-ink-data);
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
  font-feature-settings: var(--font-numeric-features);
  line-height: 1;
  letter-spacing: var(--tracking-tight);
  min-block-size: 1em;
}
```

### P1-3 — `styles/pages/home.css:3375-3380` — align the duplicate `.hlc-price` so the voice is deterministic. VERIFIED.

```css
/* before */
.hlc-price {
  font-family: var(--font-numeric);
  font-size: var(--text-data-xl);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}
/* after */
.hlc-price {
  font-family: var(--font-numeric);
  font-size: var(--text-data-xl);
  font-weight: var(--weight-bold);
  color: var(--color-ink-data);
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
  font-feature-settings: var(--font-numeric-features);
  letter-spacing: var(--tracking-tight);
}
```

**Cascade note (P1-1/2/3 must all land):** `.hlc-price` is defined in **three** places, all
specificity (0,1,0) — `price-display.css:59-70`, `home.css:519-528`, `home.css:3375-3380`. The
winner depends on `@import`/source order, which `flatten-css.js` collapses at deploy. Setting
ink-data/700/slashed-zero in all three makes the result deterministic regardless of order. Do NOT
update only one.

### P1-4 — `styles/pages/home.css:383-395` — collapse readout chrome to the design-system budget. VERIFIED.

```css
/* before */
.hero-live-card {
  background: var(--surface-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl, 28px);
  padding: var(--space-6) var(--space-6);
  box-shadow: var(--shadow-xl), var(--shadow-gold);
  position: relative;
  overflow: hidden;
  transition:
    box-shadow var(--transition-premium),
    transform var(--transition-premium);
  backdrop-filter: blur(2px);
}
/* after */
.hero-live-card {
  background: var(--surface-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--readout-radius);
  padding: var(--space-6) var(--space-6);
  box-shadow: var(--rim-inset), var(--readout-chrome);
  position: relative;
  overflow: hidden;
}
```

Rationale: DESIGN-SYSTEM §Signature hero chrome budget = `--readout-radius` (16px) + `--rim-inset`
(struck edge) + `--readout-chrome` (one `--shadow-md`). Removes backdrop-blur, the shadow-gold
stack, and the box-shadow/transform transition. `--rim-inset` is block-axis only → no RTL impact;
net paint reduction (removes a blur compositor layer).

### P1-5 — `styles/pages/home.css:397-400` — delete the hover-lift. VERIFIED.

```css
/* before */
.hero-live-card:hover {
  box-shadow: var(--shadow-2xl), var(--shadow-gold-xl);
  transform: translateY(-2px);
}
/* after */
/* hover-lift retired (DESIGN-SYSTEM §Motion/Elevation: no hover translateY on the readout) */
```

### P1-6 — `styles/pages/home.css:402-424` — delete the foil top rule + corner radial glow. VERIFIED.

```css
/* before (402-412 + 414-424) */
.hero-live-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--rule-foil);
  opacity: 1;
}
.hero-live-card::after {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgb(221 176 64 / 10%) 0%, transparent 65%);
  pointer-events: none;
}
/* after */
/* foil top rule + corner radial glow retired
   (DESIGN-SYSTEM §RTL: deletes the only physical-prop top/left/right paths in the hero) */
```

Rationale: removes the **only non-mirroring physical-prop code paths** in the hero
(`top/left/right`) — a POSITIVE for the RTL invariant — plus retires `--rule-foil` and the corner
glow.

### P1-7 — `styles/pages/home.css:426-460` — rework dark + LIVE variants: drop all gold glow. VERIFIED.

```css
/* before (the dark .hero-live-card, dark ::after, dark :hover, spot-terminal--live x2 blocks) */
[data-theme='dark'] .hero-live-card {
  box-shadow:
    var(--shadow-xl),
    var(--shadow-gold),
    inset 0 0 0 1px rgb(221 176 64 / 10%);
}
[data-theme='dark'] .hero-live-card::after {
  background: radial-gradient(circle, rgb(221 176 64 / 18%) 0%, transparent 65%);
}
[data-theme='dark'] .hero-live-card:hover {
  box-shadow:
    var(--shadow-2xl),
    var(--shadow-gold-xl),
    inset 0 0 0 1px rgb(221 176 64 / 14%);
}
.hero-live-card.spot-terminal--live {
  box-shadow:
    var(--shadow-xl),
    var(--shadow-gold),
    0 0 0 1px rgb(221 176 64 / 20%);
}
[data-theme='dark'] .hero-live-card.spot-terminal--live {
  box-shadow:
    var(--shadow-xl),
    var(--shadow-gold-xl),
    0 0 28px rgb(221 176 64 / 14%),
    inset 0 0 0 1px rgb(221 176 64 / 18%);
}
/* after */
[data-theme='dark'] .hero-live-card {
  background: var(--color-surface);
  border-color: var(--color-border);
  box-shadow: var(--rim-inset), var(--readout-chrome);
}
/* LIVE state signalled by the freshness dot + state word only — no card glow
   (DESIGN-SYSTEM §Elevation: value signalled by ink density + the live dot, never by glow) */
```

Rationale: tokens.css:476-477 already provides the dark `--rim-inset`. POSITIVE for the freshness
invariant — LIVE is no longer signalled by glow/colour; the dot + WORD (P1-11/12) carry it.

### P1-8 — `index.html:166-169` + `styles/pages/home.css:206-234` — demote the marketing H1. VERIFIED.

Markup is **unchanged** (keeps `#hero-title-sub`, on which `home.js:981` and translations key
`home.heroSub` depend). The italic-gold treatment is removed in CSS:

```css
/* home.css:210 before → after */
.hero-title-main { ... font-weight: var(--weight-extrabold); ... }   /* → var(--weight-bold) */
/* home.css:224-234 before → after */
.hero-title-sub {
  ...
  color: var(--text-accent);   /* → var(--color-text-muted) */
  ...
  font-style: italic;          /* → normal (remove the declaration) */
  opacity: 0.9;                /* → 1 (or remove) */
}
```

Rationale: DESIGN-SYSTEM §Typography — H1 drops 800→700 and loses the italic gold subtitle so the
headline does not out-shout the number. **a11y flag:** `.hero-title-main mark` (home.css:218-222)
uses raw `--color-gold` as text, which FAILS AA — out of this priority's scope, routed to §8.

### P1-9 — `styles/pages/home.css:650-659` — demote the provenance trust-line from a gold box. VERIFIED.

```css
/* before */
.hlc-trust-line {
  margin: 0 0 var(--space-4);
  padding: var(--space-3);
  color: var(--text-secondary);
  background: var(--color-gold-tint);
  border: 1px solid var(--color-gold-glow);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
}
/* after */
.hlc-trust-line {
  margin: 0 0 var(--space-3);
  padding: 0;
  color: var(--text-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
}
```

Rationale: DESIGN-SYSTEM §Signature hero item 6 — quiet provenance caption on plain canvas, no gold
box. The provenance text (`index.html:262-264`, "Spot-linked reference · shops may add making
charges, VAT, and margin") stays fully visible; only the box chrome is removed.

### P1-10 — `index.html` (insert after the `price-hero` block, before `.hlc-sparkline` at :243) — add the single rule + subordinate retail row. VERIFIED (insertion point) / UNVERIFIED (final markup + JS wiring).

```html
<!-- after the closing </div> of .price-hero (line 242), before .hlc-sparkline -->
<hr class="hlc-rule" aria-hidden="true" />
<p class="hlc-retail" id="hlc-retail">
  <span class="hlc-retail-label" id="hlc-retail-label">Retail (est. +making +5% VAT)</span>
  <span class="hlc-retail-value" id="hlc-retail-value" data-testid="retail-estimate">—</span>
  <a class="hlc-retail-link" href="content/spot-vs-retail-gold-price/" id="hlc-retail-link"
    >How retail differs →</a
  >
</p>
```

Rationale: DESIGN-SYSTEM §Signature hero render order 5 (the ONE rule) + 6 (spot-vs-retail row below
the rule). The hero has **no retail number today** (VERIFIED `index.html:243` jumps from the
freshness chip to the sparkline). **DECISION (resolving the area-map open question):** per the
no-fabricated-data invariant, `#hlc-retail-value` must show an **illustrative est. RANGE** derived
from the SAME making-charge constants as `ShopVsReferencePanel.js` (`MAKING_LOW 0.08` /
`MAKING_HIGH 0.22`) plus the 5% VAT qualifier — never a single fabricated retail price. **If the
implementer cannot wire honest JS + EN/AR translation keys in this phase, ship the row as label-only
("Retail varies — see calculator →") rather than a placeholder dash that implies missing data.**
This requires new translation keys (`home.retailEstLabel`, `home.retailLink`) with AR parity before
shipping. `data-testid="retail-estimate"` is provided for test hooks. Confirm the
`content/spot-vs-retail-gold-price/` href resolves (UNVERIFIED — implementer to verify the target
exists or repoint).

### P1-10b — `styles/pages/home.css` (add near the `.hlc-trust-line`/`.hlc-indicators` region, ~648-660) — CSS for the rule + retail row. VERIFIED (no such rules exist today).

```css
.hlc-rule {
  block-size: 1px;
  border: 0;
  background: var(--color-rule);
  margin: var(--space-5) 0 var(--space-4);
}
.hlc-retail {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text-muted);
}
.hlc-retail-value {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums lining-nums slashed-zero;
  font-feature-settings: var(--font-numeric-features);
}
.hlc-retail-link {
  font-size: var(--text-ui-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-gold-dark);
  text-decoration: none;
  margin-inline-start: auto;
}
.hlc-retail-link:hover {
  text-decoration: underline;
}
.hlc-retail-link:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-radius: var(--radius-xs);
}
```

Rationale: retail is `--text-base`/600 in `--color-text-muted` on plain canvas (no gold box) — one
full type-step below the price (`--text-data-xl`/700/ink-data). The micro-link uses
`--color-gold-dark` (#7e5912, AA-safe text gold) — **never `--color-gold`** (graphical-object only).
`margin-inline-start: auto` keeps RTL correct. Confirm `--focus-ring-*` tokens exist before using
them (UNVERIFIED — if absent, fall back to
`outline: 2px solid var(--color-gold); outline-offset: 2px` as used elsewhere in home.css).

### P1-11 — `src/pages/home.js:432, 436` — surface the explicit freshness state WORD in the hero readout. VERIFIED.

```js
// before (:432 render path; :436 fallback)
hlcUpdatedEl.textContent = `${sourceText} · ${ageText}`;
...
setTextById('hlc-updated', `${sourceText} · ${ageText}`);
// after
hlcUpdatedEl.textContent = `${statusText} · ${sourceText} · ${ageText}`;
...
setTextById('hlc-updated', `${statusText} · ${sourceText} · ${ageText}`);
```

Rationale: INVARIANT FIX. `statusText` (= Live/Delayed/Cached/Stale/Fallback/Unavailable via
`SOURCE_TX_KEY`, EN translations.js:856-861 / AR :2167-2172) is **already destructured at
home.js:422** and used for the karat strip (:440) but **omitted from the hero readout line** — so
the hero shows source+age but never the state WORD, signalling state by dot colour alone. Prepending
`statusText` upholds "never colour alone." EN/AR parity preserved (tx-driven).

### P1-12 — `src/pages/home.js:331, 335` — mirror the state-word fix in the per-second timer. VERIFIED.

```js
// before (:331 builds the live-updating string)
const hlcText = `${sourceText} · ${ageText}`;
// after
const hlcText = `${statusText} · ${sourceText} · ${ageText}`;
```

Rationale: `startFreshnessTimer` (home.js:323-348) **already destructures `statusText` at :329** but
builds `hlcText` without it. Without this, the state word is overwritten one second after the first
render. The `hlcEl.textContent = hlcText` write at :335 then carries the word continuously.

---

## Priority 2 — Retire decorative effects (hero-first)

DESIGN-SYSTEM §4 RETIRE-FROM-USAGE. All enumerated items live in `styles/pages/home.css` +
`index.html` + `src/pages/home.js` — **home-only**, so zero generator/sw involvement and the 263
country pages are unaffected (they don't import home.css). Tokens stay defined in tokens.css; this
priority only stops APPLYING them on home. **Apply the hero edits (P2-1…P2-8) first, then the
below-fold batch (P2-9…P2-12) in one pass with before/after screenshots.**

**Overlap reconciliation with Priority 1.** P1-4…P1-7 already rewrite `.hero-live-card` (383-460) —
those edits ARE the chrome/foil/glow/blur/hover-lift retirement for the readout, so **P2 does not
re-touch 383-460**; the per-file list in §6 merges them into one sequence. P2 owns the hero-SECTION
decorations (`.hero::before/::after`, `.hero-badge` animation, the parallax JS) and the below-fold
cards.

### P2-1 — `src/pages/home.js:1580-1603` — remove the hero-backdrop scroll parallax block. VERIFIED.

```js
// before: the `if (heroEl) { ... window.addEventListener('scroll', ...) }` parallax block
// after:
// (hero parallax removed — Precision Instrument: the freshness dot is the only hero animation)
```

Remove the JS first (safest, no visual regression on the now-flat hero) so there is no dangling
`--hero-parallax-y` write after the CSS target is deleted.

### P2-2 — `styles/pages/home.css:106-118` — delete `.hero::before` (4 orb radials + parallax transform + will-change). Also delete the dead reduced-motion guard at `:120-124`. VERIFIED.

### P2-3 — `styles/pages/home.css:143-148` — delete the dark `[data-theme='dark'] .hero::before` orb override (now targets a removed pseudo). VERIFIED.

### P2-4 — `styles/pages/home.css:127-136` — delete `.hero::after` (3px `--rule-foil` bottom rule). The existing 1px `--color-border-subtle` `border-block-end` (`:101`) is the seam. VERIFIED.

### P2-5 — covered by P1-6 (`.hero-live-card::before` foil top rule + `::after` corner glow, 402-424). No separate edit.

### P2-6 — covered by P1-4/P1-5/P1-7 (`.hero-live-card` chrome, hover, dark/LIVE shadow stacks). No separate edit.

### P2-7 — `styles/pages/home.css:180` — remove `animation: badge-glow 3s ...` from `.hero-badge` (keep the static box-shadow at :179). VERIFIED.

```css
/* before */
box-shadow: 0 0 0 4px rgb(26 122 50 / 6%);
animation: badge-glow 3s ease-in-out infinite;
/* after */
box-shadow: 0 0 0 4px rgb(26 122 50 / 6%);
/* badge-glow animation retired — hero badge is static */
```

`.hero-badge-dot` `pulse-live-hero` (`:189`) is **preserved** as the single allowed hero animation.
The `@keyframes badge-glow` (`:69-77`) becomes orphaned — leave defined (lint-safe) or delete; do
NOT delete `pulse-live-hero`.

### P2-8 — `index.html:155` — remove the ⚡ emoji from the freshness banner icon span. VERIFIED.

```html
<!-- before -->
<span class="hfb-icon" aria-hidden="true">⚡</span>
<!-- after -->
<span class="hfb-icon" aria-hidden="true"></span>
<!-- emoji retired; freshness carried by the #hfb-text state word -->
```

The ⚡ was `aria-hidden` decoration; `#hfb-text` (:156) carries the explicit state word — freshness
invariant intact.

### P2-9 — `styles/pages/home.css:224-234` — covered by P1-8 (de-italic/de-gold the subtitle). No separate edit; if P2 runs before P1, apply the §P1-8 CSS here.

### P2-10 — `styles/pages/home.css:1431-1438` — remove the universal `.gcc-card`/`.tool-card` hover translateY(-5px) + shadow-gold-lg. VERIFIED.

```css
/* before */
.gcc-card:hover,
.tool-card:hover {
  box-shadow: var(--shadow-gold-lg), var(--shadow-lg);
  border-color: var(--color-gold);
  transform: translateY(-5px);
  text-decoration: none;
  color: inherit;
}
/* after */
.gcc-card:hover,
.tool-card:hover {
  border-color: var(--color-gold);
  text-decoration: none;
  color: inherit;
}
```

The matching reduced-motion guard (~1445-1455) becomes redundant but harmless.

### P2-11 — `styles/pages/home.css:1660-1669` (◈ glyph) + `:1480` (gcc-flag size). VERIFIED.

```css
/* delete .tool-card--primary::after entirely (the ◈ glyph) */
/* .gcc-flag — downsize from the decorative-graphic size */
.gcc-flag {
  font-size: var(--text-base);
  flex-shrink: 0;
} /* was 1.45rem */
```

`.gcc-flag` downsizing is the literal spec fix ("flag emoji at 1.45rem"); the emoji itself ships in
JS-injected gcc-card markup, so full de-emojification would be a separate JS change (out of scope).

### P2-12 — `styles/pages/home.css:1321,1323` + `:3062` — remove `--gradient-gold` fills. VERIFIED.

```css
/* .home-section-title::after (1321 + 1323) before → after */
background: var(--gradient-gold); /* → var(--color-gold-dark) */
box-shadow: var(--shadow-gold); /* → remove */
/* .home-stat-value (3062-3065) before → after: drop the gradient text-clip, render solid */
background: var(--gradient-gold);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
/* → remove all four; the existing color: var(--color-gold-deep) at :3056 becomes the solid fill */
```

a11y: `.home-stat-value` solid `--color-gold-deep` must pass AA on its surface (gradient-clip text
contrast is currently unmeasurable; solid is strictly more legible) — confirm at implementation.

### P2-13 — `styles/pages/home.css` — the remaining `--shadow-gold/-lg/-xl` + `translateY(-2..-5px)` batch. VERIFIED present (per-site value UNVERIFIED).

Across home.css there are ~24 `shadow-gold*` applications and ~11 `translateY(-[2-5]px)` hover sites
(e.g. `:331,349-350,984,991,997-998,1657,1682,1803,1811,1818,1843,2475,2549,3040,3130,3371`).
DESIGN-SYSTEM §4 + §Elevation: no new shadow-gold applications, no hover-lift on static cards.
Replace with `--shadow-xs` at rest, no transform, **site by site** after the hero edits land. This
is the largest batch and the highest visual-regression risk — do it last, in one pass, with
before/after screenshots. (Each site VERIFIED present via grep; the chosen replacement per site is a
judgement call.)

---

## Priority 3 — Shared shell + a11y fixes

### P3-1 — `styles/pages/home.css:2605-2606` — karat copy button → WCAG 2.5.8 ≥24px. VERIFIED.

```css
/* before */
width: 22px;
height: 22px;
/* after */
/* WCAG 2.5.8: target size >= 24px (was 22px). Logical sizing keeps RTL parity. */
inline-size: 24px;
block-size: 24px;
min-inline-size: 24px;
min-block-size: 24px;
```

Icon-only button (no text label), so width/height ARE the target size; 24px is the WCAG 2.2 AA floor
(AUDIT.md:144 + Risk 12). Logical sizing keeps RTL parity (the `margin-inline-start:2px` at :2619 is
untouched). The `@media (pointer:coarse)` rule at :2628-2632 only changes opacity — geometry is
inherited, so touch devices also get 24px. Confirm the glyph stays centred (display:inline-flex +
center already at :2602-2604).

### P3-2 — `styles/pages/home.css:768` — stale freshness label amber → AA warning ink. VERIFIED.

```css
/* before */
.karat-strip-updated[data-freshness-key='stale'] {
  color: var(--color-amber);
}
/* after */
.karat-strip-updated[data-freshness-key='stale'] {
  color: var(
    --color-warning-text
  ); /* #7a4f15 = 6.86:1 on --color-bg (was --color-amber #f59e0b = 2.08:1, AA fail) */
}
```

### P3-3 — `styles/pages/home.css:789` — age-based 'amber' label amber → AA warning ink. VERIFIED.

```css
/* before */
.karat-strip-updated[data-freshness-age='amber'] {
  color: var(--color-amber);
}
/* after */
.karat-strip-updated[data-freshness-age='amber'] {
  color: var(
    --color-warning-text
  ); /* AA-passing; matches freshness-chip[data-freshness-age='amber'] at price-display.css:253 */
}
```

Rationale (P3-2/3): `--color-amber #f59e0b` computes 2.08:1 on `--color-bg` (AA fail) and was never
in the gate's pair list. `--color-warning-text` (#7a4f15 light, 6.86:1; #e0b060 dark, VERIFIED in
tokens.css:74/442) is the canonical warning ink the freshness-chip already uses
(price-display.css:216,253), semantically correct (stale is a warning, not an error), and has a dark
override. The ⚠ glyph (:776) + the explicit `statusText` word (home.js:440) remain — colour is never
the sole signal. `--color-amber` stays DEFINED in tokens.css:277 (still a legitimate
graphical-object background fill elsewhere); only its use as small freshness TEXT is removed.

### P3-4 — `scripts/node/check-basic-a11y.js:61` — lock the warning ink in the gate. VERIFIED.

```js
// before (end of CONTRAST_PAIRS)
  ['--color-success', '--color-bg'],
  ['--color-success', '--color-surface'],
];
// after
  ['--color-success', '--color-bg'],
  ['--color-success', '--color-surface'],
  // Freshness warning ink (karat strip stale/amber labels + freshness-chip cached/delayed).
  // Locked after replacing raw --color-amber (2.08:1 fail) with --color-warning-text (6.86:1).
  ['--color-warning-text', '--color-bg'],
  ['--color-warning-text', '--color-surface-2'],
  ['--color-warning-text', '--color-surface-3'],
];
```

All three pairs pass (6.86 / 6.63 / 6.12 — recompute at implementation to confirm). The light
CONTRAST_PAIRS loader resolves from `:root`; `--color-warning-text` and all three surfaces live in
`:root`. Do NOT add `--color-amber` itself (still a legit graphical fill). The dark gate
(`DARK_CONTRAST_PAIRS`) already locks `--color-warning-text` on `--surface-secondary` (VERIFIED
:78), so no new dark pair is needed.

### P3-5 — Freshness state-word audit (CONFIRMATION, no code change). VERIFIED.

The explicit state WORD is present in every state and never colour-alone across all three live
surfaces: `FreshnessBadge.js:27` (`freshness.badge.*` keys, translations.js EN :1130-1137 / AR
:2437-2444); `FreshnessStrip.js:117-120` (`freshness.strip.*`); the home.js karat strip (:440)
always prints `${statusLabel}: ${statusText}` with a `sourceCached` fallback so it is never empty.
In all three the dot/glyph is `aria-hidden` and the word carries meaning. **The one gap is the hero
readout line — fixed by P1-11/P1-12.** No additional change required here.

### P3-6 — Honest empty/loading/fallback states (CONFIRMATION, no code change). VERIFIED.

`skeleton.js` marks `aria-busy` + `role=presentation/aria-hidden` placeholders (no fake numbers);
`price-fetch-error.js` shows `status.noData` + optional retry (no fabricated price);
`data-status-banner.js` renders a `role=status` text message ("Offline — showing cached data from
{time}"). None are touched by Phase-2 edits. Smoke-test them post-change to confirm no regression.

### P3-7 — FreshnessStrip decision. VERIFIED (dead in runtime).

`src/components/FreshnessStrip.js` is imported in **0 src/ runtime files** (grep: only its own
definition, `tests/freshness-strip.test.js`, AUDIT.md, and a docs artifact). The live freshness UI
is fully served by `FreshnessBadge.js` + the home.js karat-strip renderer + the price-display.css
freshness-chip. **RECOMMENDATION: RETIRE** for Phase 2. **But:** retiring requires deleting
`tests/freshness-strip.test.js` alongside it (the `node --test` suite would otherwise break) — that
test deletion is a code change and is therefore tracked as a **Phase-2 cleanup item, NOT bundled
with the a11y fixes** in this plan. If the team prefers REVIVE, the cheapest path is mounting it via
`mountSharedShell` (site-shell.js) on pages lacking a visible freshness surface — a larger decision.
**Flagged for owner; not auto-resolved here.**

---

## Per-file consolidated edit list

Apply files in this order; within each file, apply edits top-to-bottom by line number so diffs do
not shift. Edits that two priorities both touched are merged (no conflicting instructions).

### 1. `styles/partials/price-display.css` (shared/unbundled — affects home, chart, 263 country pages)

1. `:20-24` reference chip → flat de-metallised gold edge **[P0-1]**
2. `:26-30` retail chip → flat muted, subordinate **[P0-2]** (reconciled: `--surface-secondary` +
   `--border-subtle`)
3. `:59-70` price primitive → ink-data / 700 / slashed-zero **[P1-1]**
4. `:282-286` `.cp-mi-stat--retail` → flat muted, no gold ring **[P0-3]**

### 2. `styles/country-page.css` (shared/unbundled — affects 263 country pages)

5. `:741-744` `.cp-mi-stat--retail` (early block) → neutral **[P0-4]**
6. `:1087-1090` `.cp-mi-stat--retail` (winning block) → neutral, clears raw-hex gold **[P0-5]**

### 3. `styles/pages/home.css` (home only)

7. `:106-118` delete `.hero::before` orbs + parallax; `:120-124` delete dead reduced-motion guard
   **[P2-2]**
8. `:127-136` delete `.hero::after` foil bottom rule **[P2-4]**
9. `:143-148` delete dark `.hero::before` orb override **[P2-3]**
10. `:180` remove `badge-glow` animation from `.hero-badge` **[P2-7]**
11. `:206-234` H1: weight 800→700; subtitle de-italic + `--color-text-muted` **[P1-8 / P2-9]**
12. `:383-395` `.hero-live-card` chrome → `--rim-inset` + `--readout-chrome` + `--readout-radius`;
    no blur **[P1-4 / P2-6]**
13. `:397-400` delete hover-lift **[P1-5]**
14. `:402-424` delete foil top rule + corner glow **[P1-6 / P2-5]**
15. `:426-460` rework dark + LIVE shadow stacks → no gold glow **[P1-7]**
16. `:519-528` `.hlc-price` → `--text-data-xl` / 700 / ink-data / slashed-zero **[P1-2]**
17. `~648-660` ADD `.hlc-rule` + `.hlc-retail` + `.hlc-retail-value` + `.hlc-retail-link` rules
    **[P1-10b]**
18. `:650-659` `.hlc-trust-line` → plain-canvas caption (no gold box) **[P1-9]**
19. `:768` stale freshness label → `--color-warning-text` **[P3-2]**
20. `:789` age-amber freshness label → `--color-warning-text` **[P3-3]**
21. `:1321,1323` `.home-section-title::after` → flat gold-dark, no shadow-gold **[P2-12]**
22. `:1431-1438` remove `.gcc-card`/`.tool-card` hover lift + shadow-gold-lg **[P2-10]**
23. `:1480` `.gcc-flag` font-size 1.45rem → `--text-base` **[P2-11]**
24. `:1660-1669` delete `.tool-card--primary::after` ◈ glyph **[P2-11]**
25. `:2605-2606` karat copy button → 24px (logical) **[P3-1]**
26. `:3062-3065` `.home-stat-value` → solid `--color-gold-deep`, drop gradient text-clip **[P2-12]**
27. `:3375-3380` duplicate `.hlc-price` → align to ink-data / 700 / slashed-zero **[P1-3]**
28. shadow-gold/-lg/-xl + translateY hover BATCH across remaining sites → `--shadow-xs`, no lift
    **[P2-13]** (do last)

### 4. `src/pages/home.js` (home only)

29. `:331` per-second timer `hlcText` → prepend `statusText` **[P1-12]**
30. `:432` + `:436` hero readout render → prepend `statusText` **[P1-11]**
31. `:1580-1603` remove hero parallax scroll block **[P2-1]**
32. ADD `#hlc-retail-value` render path from `MAKING_LOW/HIGH` constants (or label-only fallback) +
    EN/AR translation keys **[P1-10, UNVERIFIED — new code]**

### 5. `index.html` (home only; precached shell — bump `sw.js CACHE_NAME` on deploy)

33. `:155` remove ⚡ emoji from `.hfb-icon` **[P2-8]**
34. after `:242` (before `.hlc-sparkline` at :243) insert `.hlc-rule` + `.hlc-retail` row markup
    **[P1-10]**

### 6. `scripts/node/check-basic-a11y.js`

35. `:61` add three `--color-warning-text` pairs to `CONTRAST_PAIRS` **[P3-4]**

### Deferred / tracked (NOT in this phase's diff)

- Delete `src/components/FreshnessStrip.js` + `tests/freshness-strip.test.js` (Phase-2 cleanup item)
  **[P3-7]**.

---

## Verification plan

### Gates to run (AGENTS core commands — any change touching HTML/CSS/JS)

1. `npm run build` (touches HTML/CSS/JS).
2. `npm test`.
3. `npm run lint` (eslint + **stylelint** — confirm no raw-hex / token violations introduced; P0-5
   removes one existing raw-hex).
4. `npm run validate` (17-check gate). After P3-4, run `node scripts/node/check-basic-a11y.js` and
   confirm it still prints the WCAG-AA success line and exits 0 with the three new
   `--color-warning-text` pairs. Confirm `check-freshness-metadata`, `check-seo-meta`,
   `check-sw-precache`, `check-sw-coverage` stay green after the `index.html` markup edits.
5. `prettier --check` on the edited files (repo formatting gate).

### Screenshots

- **Home hero** at 1280px (two-column) and 375px (stacked), in **EN light, EN dark, AR (dir=rtl)**.
  Confirm: (a) price in `--color-ink-data` at `--text-data-xl`/700 with visible slashed-zeros, NOT
  the old 5.25rem/800; (b) freshness line shows an explicit WORD (LIVE/CACHED/…) before the
  timestamp, dot the only animation; (c) exactly ONE rule divider; (d) retail row below the rule,
  muted/smaller, no gold box; (e) no foil rules, no orbs/corner glow, no blur, no hover-lift, no
  badge-glow, no ⚡.
- **Freshness states** — force live/delayed/cached/stale/unavailable + age=amber via mocked
  `goldUpdatedAt`; confirm the state word + dot both change and the word is never absent on the
  initial render (home.js:432) AND after the 1s timer tick (home.js:335). Verify the karat-strip
  stale/amber label renders the deeper #7a4f15 brown (legible on parchment) in EN and AR.
- **A karat / calculator surface** — open a generated country page (e.g.
  `countries/uae/dubai/gold-rate/`) and `/chart/`: confirm the shared price-display changes render
  correctly **unbundled**; the `.cp-mi-stat--retail` card is the QUIETEST card (flat, muted, no gold
  border/gradient/ring) and visibly lighter than its neutral siblings in light AND dark; the
  `· Retail est.` / `· تقدير تجزئة` label still renders; the `price-kind--reference` /
  `cp-hero .cp-price-value` reference surfaces still read as reference-heavier-than-retail.
- **Karat copy button** — measure the rendered box in DevTools at 320/375px and coarse-pointer:
  computed 24×24px, glyph centred, RTL places it via `margin-inline-start` with no physical-left
  regression.

### WCAG contrast checks

`--color-ink-data` on #fff and #fdfbf5; `--color-text-muted` retail row on #fdfbf5;
`--color-gold-dark` link text on the readout surface; `--color-warning-text` on
bg/surface-2/surface-3 — all must pass AA (≥4.5:1). Confirm `--color-gold` is used only as the 7px
dot / focus ring / chip border (≥3:1 graphical object), never as small text. Re-measure the
DESIGN-SYSTEM's claimed 18.7–18.9:1 (ink-data) and 6.2:1 (muted) independently (UNVERIFIED in this
plan).

### Invariant checklist (re-confirm before shipping)

- [ ] AED peg 3.6725 untouched (no pricing-math file edited).
- [ ] Troy oz 31.1035 untouched.
- [ ] **Spot-vs-retail:** retail is smaller, muted, `est.`-labelled, below the rule, no gold box, on
      every surface (home readout, country `.cp-mi-stat--retail`, latent `.price-kind--retail`);
      reference is the darkest/largest mark and the only gold edge.
- [ ] **Freshness:** explicit state WORD present in the hero readout on first render and every timer
      tick, never colour alone; dot/glyph aria-hidden.
- [ ] **No fabricated data:** `#hlc-retail-value` is an illustrative est. range from
      `MAKING_LOW/HIGH` (or honest label-only), never a single fake retail price; honest
      empty/loading/fallback states unchanged.
- [ ] **EN/AR parity + RTL:** new retail keys have AR parity; hero mirrors at the grid level; only
      logical properties used; the removed foil/corner-glow eliminated the last physical-prop paths.
- [ ] **Static-first:** no framework added; all animation behind `prefers-reduced-motion`; net paint
      reduction (blur + orbs + parallax + gold shadows removed).
- [ ] `sw.js CACHE_NAME` bumped (no new PRECACHE_URLS/sw-coverage entries needed).

---

## Risks & open questions

1. **`.hlc-price` three-place cascade (HIGH).** Defined at `price-display.css:59-70`,
   `home.css:519-528`, `home.css:3375-3380`, all specificity (0,1,0); the deploy-time flatten makes
   source order non-obvious. P1-1/2/3 must ALL land on the same ink-data/700/slashed-zero voice.

2. **New retail row = new data surface (HIGH, UNVERIFIED wiring).** `#hlc-retail-value` needs a
   home.js render path derived from the SAME illustrative making-charge constants as
   `ShopVsReferencePanel.js` (`MAKING_LOW 0.08` / `MAKING_HIGH 0.22`) with the `est.` word — never a
   single fabricated number. If honest JS + EN/AR keys (`home.retailEstLabel`, `home.retailLink`)
   with AR parity cannot be wired this phase, ship label-only ("Retail varies — see calculator →")
   rather than a placeholder dash. The freshness gate (`check-freshness-metadata` allowlist) and
   basic-a11y gate run on `index.html` — the new markup must keep both green. **Verify the
   `content/spot-vs-retail-gold-price/` href target exists (UNVERIFIED).**

3. **Shared/unbundled CSS reaches 263 country pages + `/chart/` (MEDIUM).** P0-2/3, P0-4/5, and P1-1
   change `.cp-mi-stat--retail`, `.cp-hero .cp-price-value`, and `price-kind--reference` on
   generated pages. Intended and consistent with the system, but must be visually checked on a
   generated country page (changed only via `consolidate-country-pages.js`, never hand-edited) and
   on `/chart/` in light + dark.

4. **Large decorative batch (MEDIUM, per-site UNVERIFIED).** P2-13 touches ~24 shadow-gold + ~11
   translateY sites in home.css; each is VERIFIED present but the per-site replacement value is a
   judgement call. Do it last, after the hero edits, with before/after screenshots.

5. **`--color-gold` as small text elsewhere (MEDIUM — out of this plan's scope, FLAG for owner).**
   `.hero-title-main mark` (home.css:218-222) uses raw `--color-gold #b07d1f` as TEXT, which FAILS
   AA (it is graphical-object-only ≥3:1). This plan does not edit it (not in the enumerated scope),
   but it is a live AA risk that a sibling typography/a11y task should fix.

6. **Reference-chip label colour (LOW, the one cosmetic open question).** P0-1 swaps `--text-accent`
   → `--color-gold-deep` for spec fidelity (tokens table line 370). Both pass AA on gold-tint; the
   invariant fix does NOT depend on this. **Owner/writer call:** keep the swap (spec-aligned) or
   leave `--text-accent` for minimal churn. This plan mandates the swap but flags it as optional.

7. **FreshnessStrip retire-vs-revive (LOW–MEDIUM, FLAG for owner).** Dead in runtime (0 src
   imports). Recommendation: retire — but the accompanying `tests/freshness-strip.test.js` deletion
   is a tracked Phase-2 cleanup item, deliberately NOT bundled with the a11y fixes. Revive (mount
   via `mountSharedShell`) is a larger decision. Not auto-resolved.

8. **Three redundant `.cp-mi-stat--retail` blocks (LOW).** After P0-3/4/5 the three blocks
   (price-display:282, country-page:741, country-page:1087) all resolve to the same flat treatment.
   Consolidating to one rule is a possible follow-up but risks specificity surprises; leaving all
   three aligned is the safe minimal move (UNVERIFIED whether the team wants dedup now).

9. **`--focus-ring-*` tokens for the retail link (LOW, UNVERIFIED).** P1-10b assumes
   `--focus-ring-width/-color/-offset` exist; if not, fall back to the
   `outline: 2px solid var(--color-gold); outline-offset: 2px` pattern already used in home.css
   (e.g. :2596-2597).
