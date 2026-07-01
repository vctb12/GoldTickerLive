# Gold Ticker Live — Design Language

**Status:** canonical umbrella spec (2026-07-01, V1-VISUAL session). **Lineage:** consolidates and
supersedes the narrative parts of [`redesign/DESIGN-SYSTEM.md`](../redesign/DESIGN-SYSTEM.md)
(chosen direction: _Precision Instrument_, Phase-0-locked 2026-06-29) and
[`docs/DESIGN_TOKENS.md`](./DESIGN_TOKENS.md) (Bullion-Desk two-tier buttons). Token **values**
remain sourced from [`styles/partials/tokens.css`](../styles/partials/tokens.css) — this document
never restates a hex that CSS already owns; where it lists one, the CSS is the truth.

The locked gate still holds: we **extend** the warm-parchment token foundation. We do not re-theme,
do not start fresh, and do not add frameworks.

---

## 1. Register

**"Gulf financial desk."** The credibility of a trading terminal crossed with the material warmth of
the Dubai Gold Souk. Concretely:

- Data is the hero. The largest, darkest mark on any page is a price (`--color-ink-data`), never a
  headline, never an illustration.
- Gold is a **value signal**, not a paint bucket. It marks price data, the single flagship action,
  and hairline foil rules — nothing else. Gold everywhere = gold nowhere.
- Chrome is near-zero. Panels earn their borders; decoration that doesn't carry information (orbs,
  glows, blur soup, parallax) is banned (see §9 of `redesign/DESIGN-SYSTEM.md`).
- Honesty artifacts (freshness pills, spot-vs-retail disclaimers, methodology links) are part of the
  visual identity, not clutter to be minimized. They may be restyled; they may never be shrunk into
  illegibility, hidden behind interaction, or deleted.

## 2. Palette

Anchored on the existing tokens (all defined in `styles/partials/tokens.css`, light + dark):

| Role                | Token                                                             | Notes                                                     |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Ink                 | `--color-text` / `--color-ink-data`                               | `ink-data` is reserved for live readout values            |
| Paper               | `--color-bg` / `--color-surface-{2,3}`                            | warm parchment layers                                     |
| Metal (the accent)  | `--color-gold` (+ light/dark/deep)                                | graphical objects ≥3:1 only; `--color-gold-dark` for text |
| Gains               | `--price-up` (`--color-move-up`)                                  | + `--color-move-up-strong` on always-dark surfaces        |
| Losses              | `--price-down` (`--color-move-down`)                              | + `--color-move-down-strong` on always-dark surfaces      |
| Flat                | neutral muted ink (`.tracker-chg-flat`)                           | a rounded-to-zero move is **never** green                 |
| Freshness semantics | `--color-live`, `--color-daily`, `--color-fixed`, `--color-stale` | one hue per state family, always paired with text + icon  |

Rules:

- New CSS uses semantic aliases (`--price-up`, `--surface-*`, `--text-*`) — no raw hex.
- Every new token pair that carries text must be registered in the `CONTRAST_PAIRS` /
  `DARK_CONTRAST_PAIRS` lists in `scripts/node/check-basic-a11y.js` (WCAG AA 4.5:1 body, 3:1 large
  text) so the gate covers it in both themes.
- Colour is never the only carrier of meaning: Δ direction ships a glyph (▲/▼/•) + sign, freshness
  ships text + icon.

## 3. Typography

Three roles, two self-hosted OFL families (see `assets/fonts/LICENSES.md`), zero new font bytes:

1. **Display / headline** — Source Sans 3 (600–700), tight tracking. Under `[dir='rtl']` the token
   flip in `tokens.css` swaps to **Cairo**, whose Naskh-informed forms carry the same weight range;
   real AR strings (not lorem) are the test fixture (`tests/qa` harness runs EN + AR).
2. **Body** — Source Sans 3 400/600; Cairo in RTL. Line-height tokens from `--leading-*`.
3. **Data voice** — the same faces with `--font-numeric-features` (`'tnum' 1, 'lnum' 1, 'zero' 1`).
   `font-variant-numeric: tabular-nums` is **mandatory on every price surface** — hero readouts,
   tables, tickers, chart axes — so digits never jitter on refresh. Numerals stay Western/Latin in
   both languages (`Intl 'en-US'`), isolated LTR inside RTL text where they carry direction glyphs.

A dedicated subset numeric face remains the recorded "highest-leverage future upgrade"
(`redesign/DESIGN-SYSTEM.md` §Vault grafts); it stays deferred behind the static-first byte budget.

## 4. Signature element

**The milled readout.** One device says "Gold Ticker Live": the live-price readout block —
`--readout-radius` corner, `--rim-inset` struck/milled edge (block-axis only, RTL-safe),
`--color-rule` hairline seam between spot and selected reference, freshness pill docked to it. This
is where the boldness budget is spent; everything around it stays quiet. The same geometry echoes at
smaller scale in the karat ladder header and the compare cards — nowhere else.

## 5. Iconography

- **One sprite:** `src/components/icon-sprite.js` is the single source of truth (24×24 viewBox,
  1.5px monoline stroke, `currentColor`). The homepage inline copy is byte-locked by
  `scripts/node/sync-icon-sprite.js --check`; every symbol addition goes through that module and a
  re-sync (which also requires regenerating `ar/index.html`).
- **Flags are SVG symbols** (`f-*`), simplified to read at 16–32px, uniform square viewBox, rendered
  with the `nav-flag` class (border-radius token, hairline border). Flag **emoji are banned in UI**
  — they render as "AE" letter pairs on Windows and tofu on older Android. Inside `<option>` labels
  (which cannot render SVG) flags are simply omitted: text only.
- **Emoji are banned as UI iconography** (tabs, buttons, list bullets, headings, empty states, form
  chrome). Typographic arrows (`→`, `·`) in link text are typography, not icons, and stay — they are
  load-bearing in ~130 bilingual strings with RTL mirroring.
- Every icon is `aria-hidden="true"` with an adjacent real text label, or carries its own label when
  standalone. No numerals, candlesticks, arrows-as-price, or price stamps inside icon art (trust
  rule inherited from PR #464).
- Trust-rule for icon semantics: the freshness state family maps 1:1 to glyphs — live → `i-bolt`,
  delayed/estimated → `i-clock`, cached/fallback → `i-archive`, stale/unavailable → `i-warning`,
  closed → `i-moon`. States always keep their text label.

## 6. Photography & imagery

- **Art direction:** atmospheric, warm, human-scale market imagery — souk light, worked metal, real
  places. Never gold-bars-on-white stock, never handshakes, never watermarks.
- **One grade, one family:** every photograph passes through the same warm duotone grade (shadows
  toward `#15110a` ink, highlights toward parchment; slight desaturation, gentle vignette) so
  mixed-source images read as one voice. The grade is applied by `scripts/images/build-images.py`
  (single source of processing truth).
- **Honesty of provenance:** a photo labelled as a real place must **be** that place. AI-generated
  imagery is allowed only for abstract/texture/illustrative assets (e.g. the OG-card backdrop, the
  bullion band) and is labelled as generated in the manifest. We never present AI output as
  photography of a named location.
- **Licensing:** every asset is recorded in [`assets/MANIFEST.md`](../assets/MANIFEST.md) —
  filename, source URL, author, license, dimensions, usage. Accepted licenses: owned/generated,
  CC0/public domain, CC BY, CC BY-SA (attribution rendered visibly near the image or in the credits
  block, and recorded in the manifest; derivative grades of CC BY-SA photos are shared under the
  same license).
- **Markup contract** (enforced by `scripts/node/check-basic-a11y.js` + tests): every `<img>` has
  meaningful EN alt (localized to AR via `data-i18n-alt` / generator constants; `alt=""` only when
  decorative), explicit `width`/`height` (zero CLS), `loading="lazy"` + `decoding="async"` below the
  fold, `fetchpriority="high"` for the single LCP image of a page, `<picture>` with AVIF → WebP →
  JPEG fallback and `srcset` at ~480/768/1200 breakpoints.
- **Budgets (gates, not aspirations):** homepage first-load image weight ≤ 350 KB; single hero image
  ≤ 120 KB; icon sprite ≤ 30 KB; CLS ≤ 0.05.

## 7. Motion

- Price tick: ≤300ms directional flash (background tint from `--price-up-bg`/`--price-down-bg`),
  digits stay put (tabular numerals). No decorative animation on price data — animation on a number
  is a distrust generator unless it reports a real change.
- Skeleton shimmer (`.skeleton-inline` / `shell-skeleton-*`): shaped to final dimensions, zero CLS
  on data arrival. Dead-dash placeholders (`—`, "Preparing…") are banned in shipped UI.
- Panel/tab transitions ≤200ms, `--ease-out`. Live pulse animates **only** when state is truly
  `live` (freshness honesty).
- Everything respects `prefers-reduced-motion: reduce` (static skeleton fallback already exists).

## 8. Layout & RTL

- Grid-first, `--content-max-width` shell, spacing from the 4px `--space-*` scale.
- **New CSS uses logical properties only** (`margin-inline-*`, `inset-inline-*`, `padding-block-*`,
  `text-align: start/end`); physical `left/right` is allowed only for genuinely directional art
  (chart axes). Legacy `[dir='rtl']` override blocks are burned down opportunistically, never
  extended.
- Numbers with direction glyphs inside RTL text are isolated (`unicode-bidi: isolate` / `dir="ltr"`
  wrapper) so `▲ +1.2%` never reorders.
- Touch targets ≥44px (`--control-height`); layouts verified at 360px minimum in both directions.

## 9. Anti-goals (unchanged, enforced in review)

Gold-gradient-on-everything; glassmorphism blur soup; neon/crypto aesthetics; decorative price
animation; parallax; autoplay; stock-photo clichés; hiding disclaimers to "clean up"; rewriting
working data/fetch/calculation logic during visual work; adding frameworks/CSS libraries;
EN-perfect/AR-broken shipping.
