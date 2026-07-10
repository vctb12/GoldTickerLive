# GoldTickerLive.com — Live Site Audit & Improvement Plan

**Mode:** Plan only. No code was changed. Findings come from inspecting the live site in-browser on
**2026-06-30**. **Scope walked:** Homepage (EN, light + dark), `/calculator`, Arabic toggle (RTL),
`/methodology`, plus DOM/source, network, and console inspection. **Labeling:** Every claim is
tagged **[VERIFIED]** (seen on screen or in page source/DOM/network) or **[UNVERIFIED]** (assumption
or not fully confirmed in this session).

**Environment note:** The browser window would not shrink below ~792px CSS width in this session, so
true phone-width (≤480px) layout is **[UNVERIFIED]**. All other widths and behaviors were observed
directly.

---

## 1. Overall assessment

GoldTickerLive is, on the trust dimension, **well above the bar for a gold-price site**. The
methodology page is genuinely excellent, the freshness vocabulary is real and applied,
spot-vs-retail separation is repeated everywhere, the AED 3.6725 peg is stated and explained, and
the site degrades gracefully to an "Unavailable" state with em-dashes instead of faking numbers. RTL
is correctly implemented (`dir=rtl`, mirrored layout). The visual style is restrained and credible —
cream/near-black in light mode, dark gold in dark mode, Source Sans 3 + Cairo, no clip-art or
generic "AI-looking" gradients.

The problems are concentrated in two places: **(a) the bilingual layer is a client-side toggle with
no separate indexable Arabic URL and English `<title>`/meta even in Arabic mode — a major SEO/parity
gap for a site whose whole pitch is "bilingual EN/AR,"** and **(b) a handful of trust-label and
layout details that undercut the otherwise strong trust story** (a 9-minute-old price labeled
"Live," two different "current" gold prices on the homepage, a nav that overlaps the logo at tablet
widths, and low-contrast muted text in light mode).

None of the fixes require leaving the static architecture. The biggest one (Arabic indexability) is
the most involved but is still a static-site, pre-render/duplicate-page job — **no framework
migration, SSR, or build-tool swap is recommended.**

---

## 2. What's working (keep / don't regress)

- **[VERIFIED] Methodology page (`/methodology`) is a standout trust asset.** Full formula
  `Price/g = (XAU/USD ÷ 31.1035) × (karat ÷ 24) × FX`, AED peg rationale (hardcoded 3.6725, API AED
  value deleted), 5-tier fallback (gold-api → mintedmetal → committed JSON → localStorage → error),
  freshness states, karat/fineness table, VAT-by-country, DGJG distinction, and a clear disclaimer.
- **[VERIFIED] Freshness labeling is real and applied.** Homepage flipped
  `Cached → Live · Updated 30 Jun 2026, 13:34:50 UTC` on auto-refresh; methodology load showed
  `UNAVAILABLE` with `—` placeholders rather than stale numbers.
- **[VERIFIED] Spot-vs-retail separation is everywhere** — hero ("Spot-linked reference prices
  before retail premiums, making charges, and tax"), spot card ("Retail prices add making charges,
  VAT, and margin"), calculator ("Reference estimate, not a retail shop quote"), country cards.
- **[VERIFIED] Calculator works and is correct.** 10 g × 22K @ AED 435.37/g produced **AED
  4,353.72**; state is shareable via URL (`/calculator?w=10&k=22&c=AED&mode=value`); quick presets
  (1g/5g/10g/1 tola/1 oz) and bidirectional Weight↔AED mode.
- **[VERIFIED] RTL is correct.** Arabic toggle sets `lang=ar` + `dir=rtl`, mirrors the full layout
  (logo right, nav right-to-left, CTA flipped), localizes body copy and the peg/methodology line;
  the AR preference persists across navigation.
- **[VERIFIED] Engineering hygiene:** clean console (no errors), self-hosted `woff2` fonts (Source
  Sans 3 Latin, Cairo Arabic/Latin — no external font request), WebP hero, `:focus-visible` styles
  present, JSON-LD on homepage (`Organization`, `WebSite`, `FAQPage`), canonical + hreflang tags
  present.

---

## 3. Prioritized improvements

### P0 — Critical (trust / core SEO)

**P0-1. Arabic has no separately indexable URL, and `<title>`/meta stay English in Arabic mode.**

- **Problem [VERIFIED]:** The language switch is a client-side `<button>` with no `href`. Toggling
  to Arabic does **not** change the URL (`urlChanged: no`), and `document.title` remained
  `Gold Calculator — Value, Scrap, Zakat | Gold Ticker Live` while `lang=ar`/`dir=rtl`. Meanwhile
  the homepage declares `<link rel="alternate" hreflang="ar" href="/?lang=ar">` — a URL the toggle
  never actually produces.
- **Why it matters:** For a site whose differentiator is "bilingual EN/AR," roughly half the content
  is effectively invisible to search engines: there is no crawlable Arabic page, the Arabic pages
  share English titles/descriptions, and the hreflang target doesn't match the real toggle
  mechanism. This is the single highest-leverage fix for Arabic-market discovery (the actual
  GCC/Arab audience).
- **Proposed fix (static-friendly):** Pre-render a distinct Arabic URL per page at build time — e.g.
  `/ar/` and `/ar/calculator.html` (or `/calculator.ar.html`) — each served with
  `<html lang="ar" dir="rtl">`, Arabic `<title>`/meta description, and **reciprocal** hreflang pairs
  (`en` ↔ `ar` ↔ `x-default`) whose hrefs are the real static URLs. Keep the in-page toggle as a
  convenience, but make it navigate to the static AR URL so the crawlable page and the toggle agree.
  No framework needed — this is a duplicate-page generation step in the existing Vite build.

**P0-2. Canonical strategy is inconsistent (`/` vs `/calculator.html`).**

- **Problem [VERIFIED]:** Homepage canonical resolves to `/`, but `/calculator` (the live, linked
  URL) declares canonical `/calculator.html`. So the URL users and internal links use
  (`/calculator`) is not the canonical the page names.
- **Why it matters:** Mismatched canonical vs. requested URL invites duplicate-URL ambiguity
  (`/calculator`, `/calculator.html`, `/calculator?…` all potentially live), splitting signals and
  risking the wrong URL being indexed on a site where SEO is a first-class concern.
- **Proposed fix:** Pick one canonical form sitewide (recommend extensionless `/calculator`) and
  make every page's canonical equal its own clean URL; 301/normalize the `.html` and trailing-slash
  variants to it. Verify the homepage and inner pages use the _same_ convention.

---

### P1 — High (trust + UX correctness)

**P1-1. A 9-minute-old price is labeled "Live."**

- **Problem [VERIFIED]:** On `/calculator` the top ticker read `05:29:50 PM · 9 min. ago` while the
  freshness badge read `Live · Updated 30 Jun 2026, 13:29:50 UTC`. The methodology documents a
  **12-minute** "Stale" threshold, so 9 minutes is technically still "Live" by design.
- **Why it matters:** The product's core promise is trustworthy freshness. "Live" next to "9 min.
  ago" reads as self-contradictory and quietly erodes the very trust the rest of the site works hard
  to build. A 12-minute window for a "Live" claim is generous for a price surface.
- **Proposed fix:** Tighten the "Live" window (e.g. ≤90s–2min, matching the documented ~90s
  re-poll), and relabel the intermediate band (≈2–12 min) as **"Delayed"** with the age shown. Keep
  "Stale" for older. This costs nothing in architecture and makes the badge and the "x min ago"
  stamp agree.

**P1-2. The homepage shows two different "current" gold prices.**

- **Problem [VERIFIED]:** The site spot card showed **$4,022.90 / $4,015–$4,022** range, while the
  embedded TradingView "Gold Price Chart" plotted a last-price marker of **5059.30** on the same
  screen. Two conflicting "now" prices appear within one viewport.
- **Why it matters:** On a price-trust site, a visitor who notices the chart says ~5,059 and the
  headline says ~4,022 has no way to reconcile them — it reads as one of the numbers being wrong.
  The chart almost certainly uses TradingView's own/independent feed [UNVERIFIED as to cause], but
  the user can't know that.
- **Proposed fix:** Either (a) feed the chart from the same gold-api series the rest of the site
  uses, or (b) clearly label the chart as an independent third-party feed and visually separate it
  from the official spot value, or (c) pin the chart's last value to the site's spot. Add a one-line
  freshness/source caption to the chart consistent with the sitewide vocabulary.

**P1-3. Header nav overlaps the logo at tablet / small-laptop widths.**

- **Problem [VERIFIED]:** At ~792–1240px the desktop nav renders on top of the logo — "Live Prices"
  overlaps "Gold Ticker Live," and "Discover" overlaps the search icon (mirrored in Arabic: "استكشف"
  over the logo). At 792px the hamburger toggle (`aria-label="فتح القائمة"`) is `display:none` while
  14 desktop nav links are still shown.
- **Why it matters:** Overlapping header text is the most visible "this site is broken" signal a
  first-time visitor gets, and it appears across a very common width range (tablets, small laptops,
  split-screen). It directly contradicts the "premium/trustworthy" goal.
- **Proposed fix:** Raise the nav collapse breakpoint (switch to the hamburger at ~1024–1100px
  instead of below 792px), or let the nav wrap/condense before it collides. No new components — the
  hamburger already exists; it just engages too late.

**P1-4. Muted secondary text fails WCAG AA contrast in light mode.**

- **Problem [VERIFIED, computed]:** The dominant muted text color is `rgb(160,152,144)` (312
  elements). On the light-mode cream background `rgb(253,251,245)` that is ≈ **2.7:1**, below the
  4.5:1 AA threshold for normal text. The gold/amber accent `rgb(196,144,46)` on cream is similarly
  low (~2.8:1) and was used for the "Status: Cached…" banner text, which looked faint.
- **Why it matters:** Secondary text (subtitles, card descriptions, freshness sub-labels,
  disclaimers) is exactly the content that carries the trust nuance — it should be the _most_
  readable, not the least. Low contrast also hurts on mobile in sunlight, common for a UAE/GCC
  audience.
- **Proposed fix:** Darken muted text in light mode to meet ≥4.5:1 (e.g. move toward
  `rgb(110,102,94)` or darker) and verify the amber used for small text/labels on cream; reserve the
  lighter gold for large headings/icons only. Re-check dark mode separately (the same token reads
  fine on the dark background).

**P1-5. Inline "Quick convert" reference value rendered blank on first paint.**

- **Problem [UNVERIFIED]:** On the homepage Quick-convert (10 g, 24K), the "Reference value" row
  showed only a gold underline with no number in the captured frames. It may populate after the
  first price fetch or on input; this was not confirmed to persist.
- **Why it matters:** An empty result in the headline conversion tool, even briefly, reads as broken
  on the most-seen part of the page and is a layout-shift moment.
- **Proposed fix:** Confirm whether it populates; if it's waiting on the live fetch, seed it from
  the cached price immediately (the site already caches in localStorage for exactly this) and label
  freshness, so a number is always visible on first paint.

---

### P2 — Polish

- **P2-1. `favicon.svg` returns 404. [VERIFIED]** `https://goldtickerlive.com/assets/favicon.svg` →
  404 on load. Add the asset (or fix the reference) — a missing favicon is a small but visible
  polish/trust tell in the browser tab.
- **P2-2. ~30+ separate JS module chunks on first load. [VERIFIED]** 47 requests including granular
  modules (`nav`, `footer`, `ticker`, `spotBar`, `reveal`, `count-up`, `freshness-pulse`,
  `price-motion`, `RealtimeSlaPanel`, etc.) plus an inline `data:` module. All 200, no errors, but
  consider consolidating the critical-path bundle to reduce request overhead and perceived load on
  slower mobile connections. **Stay within the current Vite setup** — this is chunking config, not
  an architecture change.
- **P2-3. "Quote verification checklist" heading repeats identically on 3 cards. [VERIFIED]** Three
  side-by-side cards share the exact same H-title with different bullets. Give each a distinct
  sub-heading (e.g. "On the invoice," "On charges," "Against the reference") or merge into one
  grouped block.
- **P2-4. Methodology exposes internal build paths. [VERIFIED]** User-facing copy names
  `.github/workflows/gold-price-fetch.yml`, `data/gold_price.json`, `data/last_gold_price.json`, and
  "no API keys in the client bundle." It's not a security leak (no secrets), but for a premium
  finance brand it reads as internal plumbing. Reframe in user terms ("an automated hourly job
  refreshes our committed price snapshot") and drop literal repo filenames.
- **P2-5. Freshness vocabulary isn't 100% consistent across surfaces. [VERIFIED]** The homepage
  "About Our Prices" card lists `Live, Delayed, Cached/Fallback, Estimated, Historical baseline`;
  the methodology states box lists `Live / Cached / Delayed / Stale / Fallback`; the ticker also
  uses `Unavailable`. Unify one canonical set of state names and use it identically everywhere
  (legend, badges, exports).
- **P2-6. Numeral system differs between surfaces. [VERIFIED]** EN homepage country cards render
  Eastern Arabic-Indic numerals (e.g. ٤٣٥.٣٧ with native currency glyphs) while the AR calculator
  shows Latin digits (435.37). Pick one convention per locale and apply consistently; document the
  choice.
- **P2-7. Tracker-handoff text column wraps too narrowly. [VERIFIED]** On `/calculator`, the
  "Compare this in the live tracker" block wraps ~3 words per line in a narrow left column with
  large empty space to the right. Widen the text column / rebalance the grid.
- **P2-8. Mixed-direction (bidi) glitch in helper text. [VERIFIED]** The calculator helper rendered
  `AED 435.37 د.إ per gram` with the Arabic currency glyph embedded mid-sentence and slightly out of
  order. Wrap the currency token in an explicit bidi isolate (`<bdi>` / `&#8296;`) to fix ordering
  in mixed EN/AR strings.

---

## 4. Suggested sequence

1. **P0-1 / P0-2** together (Arabic static pages + canonical normalization) — one SEO workstream,
   highest impact, fully static.
2. **P1-1, P1-2, P1-3** — the trust/credibility quick wins (freshness label window, chart price
   reconciliation, nav breakpoint). Low effort, high perceived-quality return.
3. **P1-4 / P1-5** — contrast token + ensure the headline converter never shows blank.
4. **P2** batch — favicon, bundle consolidation, copy/vocabulary consistency, bidi/numeral polish.

---

## 5. One idea beyond the brief (optional)

Because the methodology and freshness system are already this strong, consider surfacing a small,
persistent **"freshness + source" chip on every price card** that links straight to the relevant
methodology anchor (e.g. spot → `#live-formula`, AED → `#aed-peg`). It turns the site's best asset
(transparency) into a repeated trust touchpoint exactly where buyers hesitate, and it's pure
internal linking — no new infrastructure. **[suggestion, not a verified gap]**
