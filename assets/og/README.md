# Social cards (`assets/og/`)

Per-section Open Graph / Twitter (X) share cards, 1200×630 PNG, one per hand-authored top-level
page. The homepage card is `assets/og-image.png`; section cards live here.

## Design contract (must hold for every card)

- **1200×630**, flattened opaque PNG, **palette-optimized to < 200 KB** (WhatsApp drops previews >
  ~300 KB; the repo `image-audit` flags > 200 KB).
- Critical text inside the centered ~1080×600 safe zone (feeds crop the edges).
- **Trust rules (non-negotiable):** the generated art is abstract gold material only — **no legible
  prices, no numerals, no candlestick/line charts, no up/down arrows, no fake data.** Coins in the
  source art are blank/unstamped. Copy uses _reference_ language, never implies a live/retail quote.
- Brand-neutral wordmark ("Gold Ticker Live") so one card serves EN and AR; section taglines have an
  Arabic counterpart composited beneath the English one.

## How they were produced

1. **Background** — one shared photoreal dark+gold backdrop generated with HiggsField
   (`nano_banana_pro`, 16:9, 4K), prompted explicitly for _no text / numbers / charts / arrows_ and
   blank coins. The same backdrop is reused by every card (zero extra cost).
2. **Composite** — brand wordmark, section title, eyebrow, EN + AR taglines and the coin+G mark are
   layered over the backdrop with headless Chromium using the site's own self-hosted fonts
   (`Source Sans 3` + `Cairo`), so type is vector-sharp, not AI-rendered.
3. **Encode** — exported 1200×630 and re-encoded as a dithered 256-colour PNG (no banding).

To regenerate a card, recreate the backdrop with the prompt above, then re-composite with the same
template/copy and re-point the page's `og:image` / `twitter:image` / `*:alt` meta.

## Meta wiring

Each section page's `<meta property="og:image">`, `<meta name="twitter:image">` and the
`*:image:alt` text point at its own card. `og:image:width`/`height` stay `1200`/`630`. Files live
under `/assets/` to inherit immutable `Cache-Control` from `_headers`. After replacing any card,
force a re-scrape (Meta Sharing Debugger / X Post Inspector) — scrapers cache aggressively and won't
pick up same-URL changes on their own.
