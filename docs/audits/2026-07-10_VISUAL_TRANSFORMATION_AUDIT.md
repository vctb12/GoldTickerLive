# Visual Transformation Audit (Phase 0) — 2026-07-10

**Auditor:** Claude (sole coordinator + visual-quality gate) · **Method:** production `dist`
(`NODE_ENV=production` build + `stage-dist-statics` + `cp countries`), served on `localhost:8080`,
exercised in headless Chromium at **desktop 1440×900** and **mobile 390×844**, **EN and AR**,
`prefers-reduced-motion` both states. Screenshots live in
[`docs/design/reviews/before/`](../design/reviews/before/) (107 PNGs: `<page>_<vp>_<lang>_fold.png`
above-the-fold, `_full.png` whole page, `home_desktop_en_crop1..7.png` below-fold sweep).

This is a **visual** audit. It does not re-litigate the pricing/data-integrity/testing state — that
is in [`2026-07-10_POST_CONVERGENCE_MAIN_AUDIT.md`](./2026-07-10_POST_CONVERGENCE_MAIN_AUDIT.md) and
all of its invariants and findings still bind. Nothing here weakens peg 3.6725, troy 31.1035, karat
÷24, spot≠retail, real-data-only.

> **Honesty note on method.** My first capture pass reused one browser context per viewport, so a
> page visited in AR left `localStorage.lang=ar` and the _next_ page's EN shot rendered Arabic. I
> caught this on Learn, re-captured Learn/Shops/Portfolio/Country with **fresh contexts**, and
> confirmed all pages resolve `en/ltr` correctly. The lang-persistence-across-pages is intended
> behavior, **not** a bug. Corrected EN shots are the ones in the folder.

---

## 0. The one-sentence verdict

The site is **competently built and visually coherent, but generic**: every page is the same recipe
— a centered black serif display heading, a gold eyebrow label, a freshness/spot badge, a paragraph
of spot-vs-retail disclaimer, and then rows of near-identical bordered cream cards. It reads as a
well-executed content template, not as a product with its own identity or a single memorable moment.
Nothing on screen makes a first-time visitor think "this is the best gold platform on the internet."
**That is the gap the transformation must close, and the recent engineering did not touch it.**

---

## 1. Honest separation of the recently-merged work

The owner asked for this explicitly and told me not to defend prior work. Split by **user-visible
visual impact**, not by effort:

| Bucket                                                         | Items                                                                                                                                                                                                 | Visible on screen?                                                                               |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Genuinely visible improvement**                              | #637 calculator→tracker handoff link now renders on desktop (was 0×0); tracker "command center" dark terminal treatment; freshness badges present on price surfaces                                   | Small, localized. The handoff is one link; the badges are chips.                                 |
| **Invisible engineering (real value, zero visual delta)**      | 41-PR convergence to `main`; pricing invariants + tests (1574/0); format normalization (#635); feature-flag unions (all OFF); i18n plumbing; SEO/schema; a11y landmarks; #636 shops **test-only** fix | **None.** A visitor cannot see any of it.                                                        |
| **"Called a revamp but did not change the visual experience"** | The 60-phase plan, the master tracker, the audits, most phase PRs                                                                                                                                     | The homepage, calculator, compare, shops, learn look materially the same as before the campaign. |

**Conclusion:** the prior process optimized correctness and governance — which are now genuinely
strong — and mistook that for a redesign. The visual experience was never the deliverable. This
program makes it the deliverable.

---

## 2. Cross-cutting problems (every page)

1. **One template, repeated.** Serif H1 → gold eyebrow → spot/freshness badge → disclaimer paragraph
   → card grid. Calculator, Compare, Learn, Country, Shops are the same skeleton with different
   nouns. Nothing signals "you are on the calculator" vs "you are on compare" except the words.
2. **Card overload.** Karat cards, trust pills, guide cards, country chips, "command center"
   mini-cards — the bordered-cream-card is the answer to every layout question. Rows of identical
   cards = the generated-template look the owner called out.
3. **Disclaimer repetition.** "Spot-linked reference… making charges, VAT, and margin" appears
   **4–5× per page** (hero note, spot card, karat section, About-Our-Prices card, footer strip). It
   is important once; five times it becomes visual noise and erodes the very trust it's trying to
   build.
4. **Weak hierarchy / dead space.** Big serif headings are the only hierarchy device. Wide bordered
   boxes put content in a narrow left column and leave the right half empty (Learn featured-guides,
   Home karat section). The homepage is ~7,300px tall with long stretches of empty cream between
   sections — vertical rhythm is loose, not composed.
5. **The tool is buried under chrome.** The thing the user came for (calculate, compare) sits
   _below_ the fold, behind title + freshness + market-status card + methodology paragraph + feature
   checkmarks. On the calculator, ~700px of trust/metadata precedes the first input.
6. **No motion identity.** Sections fade/opacity-reveal on scroll (15/21 home sections start at
   `opacity:0`), correctly disabled under reduced-motion — but the reveal is the _only_ motion and
   it's generic. No signature transition, no data-driven motion, no microinteraction that teaches.
7. **Inconsistent surface system.** Tracker is dark ("terminal"); everything else is light cream.
   There is no shared elevation/surface language tying them into one product.
8. **Arabic is a mechanical mirror.** AR simply flips the LTR grid. The Arabic display type is the
   same weight as a Latin bold; there is no Arabic-first composition, no consideration that Arabic
   numerals, line length, and heading rhythm differ. It's correct RTL, not _designed_ RTL.

---

## 3. Per-page findings

Legend for "components": **remove** (delete/merge away), **replace** (rebuild differently),
**consolidate** (fold several into one).

### 3.1 Homepage — `index.html` (flagship)

_Shots: `home_desktop_en_fold/full`, `home_desktop_en_crop1..7`, `home_mobile_en_fold`,
`home_desktop_ar_fold`._

- **What's generic:** classic **header + hero-left + spot-card-right**. The single most valuable
  thing on the site — the live gold price — is rendered as a bordered card sitting beside a
  decorative serif headline, exactly the "header + card" the brief rejects.
- **Structure:** 21 sections, `<main>` ~7,291px: hero → Gold Price Chart (TradingView) → Price
  History → karat cards → trust pills → About-Our-Prices dark card → Live Gold Prices
  (GCC/MENA/Global tabs) → tools → quick-convert. Real content exists; it's just laid out as a long
  scroll of card blocks.
- **Weak hierarchy:** three different sections use the same serif-H1 + eyebrow, so the chart, the
  karat table and the country list read as equally important. There's no visual argument for what to
  look at.
- **Excessive cards:** karat strip (5 identical cards), trust strip (6 identical pills), country
  tiles.
- **Missing market storytelling:** the price is a number in a box. Nothing says _is today high or
  low, up or down over a week/month, what it means for a buyer_. The chart is present but
  disconnected from the hero and from any interpretation.
- **Missing interaction:** nothing to _do_ in the hero except click two buttons. No live pulse, no
  scrub, no "what's my karat worth right now."
- **Mobile:** leads with the full-width spot card + a good bottom tab bar (Live Tracker / Calculator
  / Compare / Shops / Menu) — the strongest mobile element on the site. But there's **no hero
  headline or narrative** on mobile; it's the desktop card, stacked. Above-the-fold is card + two
  repeated disclaimers.
- **RTL:** mirrored hero/card; Arabic H1 is bold sans, no display treatment.
- **Remove:** duplicate disclaimer blocks; the redundant "View all karat prices below" pointer.
  **Replace:** the hero (→ live-market hero, §Direction). **Consolidate:** karat strip + "prices by
  karat" + ticker all show karat prices three ways — merge into one authoritative karat
  presentation.
- **Layout risk:** the scroll container is `<body>` (`height:100vh; overflow-y:auto`) and
  `main.page-enter-active` retains a `transform`. This makes `document.scrollingElement`
  non-scrollable (programmatic scroll, anchor jumps, scroll-restoration and `position:sticky` inside
  `<main>` are all at risk). Real wheel users can scroll (the wheel targets `<body>`), so it's not
  visibly broken today — but it's fragile and should be fixed as part of the rebuild. **[verify on
  live before severity]**

### 3.2 Calculator — `calculator.html`

_Shots: `calculator_desktop_en_fold`, `calculator_mobile_en_fold`._

- The whole above-the-fold is preamble: centered "Gold Calculator" serif title, spot + 24K badges,
  freshness line, a **"Market status: open"** card, a labels/methodology paragraph, four feature
  checkmarks — _then_ the tabs (Gold Value / Scrap / Zakat / Buying Power / Unit Converter), and the
  actual input form is below all of it. **The tool is the last thing you reach.**
- **Replace:** lead with the calculator; demote freshness/methodology to a compact, dismissible
  strip. This is the page with the clearest "one primary idea" (compute a value) buried the deepest.

### 3.3 Compare — `compare.html`

_Shots: `compare_desktop_en_fold`, `compare_desktop_en_scrolled`._

- Functionally the **best-realized tool**: karat pills, selected-country chips + add dropdown, a
  "Currently most affordable: Kuwait" insight banner, and a sortable comparison table (local/g ·
  USD/g · VAT · Making · Retail est · vs UAE). The insight banner is a good instinct.
- Still fronted by the centered-serif-hero + preamble recipe. The table is dense and generic
  (default table styling); the comparison — which should be the signature of this page — doesn't
  feel special.
- **Replace:** the hero preamble → put the comparison and the "most affordable" insight up top.
  **Redesign:** the table into a designed comparison (visual price bars, flag-anchored rows).

### 3.4 Portfolio Tracker — `tracker.html`

_Shots: `tracker_desktop_en_fold`._

- The **only dark page** and the closest thing to a financial terminal: big `$4,108.20` spot +
  `485.07 AED/g`, a "Command center desk" sidebar (Reference / Freshness / Data source / AED peg /
  History), tabs (Live / Compare / Planner), day-change strip.
- Strong bones, but: a **row of five status chips** (Fallback · Delayed · SecondaryProvider ·
  XAU/USD · Market open) is noisy; the sidebar is five small text cards repeating metadata that's
  also in the banner; and its darkness is **totally disconnected** from the rest of the (light)
  site.
- **Consolidate:** status chips → one freshness object. **Decision:** either the dark terminal
  becomes the shared visual system (and the whole site gets a dark surface language) or the tracker
  adopts the site system — right now it's an orphan.

### 3.5 Learn hub — `learn.html`

_Shots: `learn_desktop_en_fold` (re-captured EN), `learn_mobile_en_fold`._

- Serif "Learn About Gold…" H1, "FEATURED GUIDES" eyebrow, a description in the **left third** of a
  wide bordered box (right two-thirds empty), "Read 0 of 9 featured guides" progress, a filter
  input, then a "Start here" card grid (BEGINNER badge · min-read · title · blurb · "Read guide →").
- It's a **functional guide list, not a publication.** No hero article, no imagery, no editorial
  hierarchy, no sense of a flagship piece. The card grid is the same card grid as everywhere else.
- Keep the "Read 0 of 9" progress (and the no-InvalidStateError/no-flicker fix). **Redesign:** into
  a publication front page (feature lede + rail), not a box of equal cards.

### 3.6 Country page — `dubai-gold-price.html`

_Shots: `country-dubai_desktop_en_fold/scrolled`, `country-dubai_mobile_en`._ Same recipe applied to
a single market; the country's _story_ (is Dubai cheaper? why? Gold Souk context) isn't told. This
page type is pure SEO surface and should become the template for dozens of city pages, so its design
ROI is high. **Redesign** into a market-story layout.

### 3.7 Shops — `shops.html`

_Shots: `shops_desktop_en_fold/scrolled`, `shops_mobile_en`._ A list with a price disclaimer (the
#636 test targets its copy). Reads as a bare directory, not the "curated & trustworthy" destination
the brief wants. **Redesign** into curated cards with trust signals; keep honest (no fabricated
ratings).

### 3.8 Glossary / Market / Heatmap / Portfolio

_Shots captured for all._ Glossary = term list; Market = summary; Heatmap = country grid; Portfolio
= holdings tool. All inherit the same template; none has a distinctive treatment. Lower priority
than the flagship set but must join the same family once it exists.

### 3.9 Nav + mobile menu

_Shots: `nav-menu_mobile_en/ar_fold`._ Desktop nav is a clean centered wordmark + link row +
search + theme + "Live Tracker" CTA. Mobile has a good bottom tab bar; the hamburger opens a menu.
Nav is one of the more polished elements and needs evolution, not replacement — but it carries no
brand signature (the "G" mark is generic).

---

## 4. What a genuinely redesigned version should _feel_ like

- **Home:** you land and the **live price is the page**, not a card — large, alive, with a subtle
  accurate motion when it ticks, immediately answering "is today high or low, and what does a gram
  of my karat cost right now." One clear idea, then a guided path down (understand → check karat →
  calculate → compare → find a shop → learn).
- **Calculator:** the input is the first thing you see; you get a real number in one interaction;
  trust copy is present but quiet.
- **Compare:** the comparison _is_ the hero — visual, sortable, with the "cheapest market" answer up
  top.
- **Learn:** feels like a small premium publication, not a blog index.
- **Everywhere:** one surface/type/motion system, an Arabic composition that was _designed_ rather
  than mirrored, and at least a few moments a user remembers.

Success = a first-time visitor feels "premium" in 5 seconds; a returning visitor immediately notices
a dramatic change; every screen shows craftsmanship. The
[Visual Direction V2](../design/GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md) defines the system that gets
us there.
