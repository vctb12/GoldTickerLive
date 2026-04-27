# Full-site UX, content, SEO, and admin revamp

## Origin

User asked for a point-by-point implementation of a broad website upgrade: navbar, admin panel, all
HTML pages, conversion of coming-soon pages into real content, new landing pages, stronger UI/UX, a
real Supabase-backed Submit Shop workflow, immediate indexability for launched landing pages, and a
brand shift toward **GoldTickerLive**.

## Guardrails

- Keep price formulas, AED peg, karat purities, and source handling unchanged unless a separate bug
  is proven.
- Keep static multi-page architecture; no framework migration.
- No fake live data, fake shop data, fake testimonials, or guaranteed price language.
- User-facing price copy must preserve spot/reference vs retail distinction.
- Public shop submissions go to a review queue; they are not published automatically.
- New launched content pages are indexable immediately, with canonical, hreflang, OG, and internal
  links.

## File-by-file implementation sequence

### Batch 1 — launch useful content and submission workflow

- [x] `/content/premium-watch/index.html` — replace coming-soon stub with real retail-premium guide.
- [x] `/content/compare-countries/index.html` — replace coming-soon stub with real comparison guide.
- [x] `/content/news/index.html` — replace coming-soon stub with curated market-updates hub.
- [x] `/content/todays-best-rates/index.html` — replace coming-soon stub with best-rates usage
      guide.
- [x] `/content/changelog/index.html` — replace coming-soon stub with transparent product/status
      page.
- [x] `/content/faq/index.html` — replace coming-soon stub with real FAQ content.
- [x] `/content/submit-shop/index.html` — replace coming-soon stub with real public form.
- [x] `/src/pages/submit-shop.js` — submit public shop suggestions to Supabase `shop_submissions`.
- [x] `/styles/pages/content-landing.css` — shared responsive landing/content page pattern.
- [x] `/supabase/schema.sql` — add `shop_submissions` queue and RLS policies.
- [x] `/docs/SUPABASE_SCHEMA.md` — document public shop-submission schema.

### Batch 2 — new indexable landing pages

- [x] `/content/uae-gold-buying-guide/index.html`
- [x] `/content/dubai-gold-rate-guide/index.html`
- [x] `/content/gcc-gold-price-comparison/index.html`
- [x] `/content/spot-vs-retail-gold-price/index.html`
- [x] `/content/gold-making-charges-guide/index.html`
- [x] `/content/22k-gold-price-guide/index.html`
- [x] `/content/24k-gold-price-guide/index.html`

### Batch 3 — shared navigation, footer, and brand consistency

- [ ] `/src/components/nav.js` — update shared brand label to GoldTickerLive.
- [x] `/src/components/nav-data.js` — add 22K and 24K karat guide pages to Prices → Comparison
      section (EN + AR).
- [x] `/src/components/footer.js` — add Methodology link to footer legal row (Terms · Privacy ·
      Methodology).
- [x] Core page metadata — added `og:locale` + `og:locale:alternate` (en_US / ar_AE) to all main
      pages: index, tracker, calculator, shops, methodology, learn, insights, invest, pricing.

### Batch 4 — homepage, tracker, calculator, shops polish

- [x] export.js — `exportCSV` and `exportBriefText` filenames now use `isoTimestamp()` for
      consistency.
- [x] `/shops.html` — empty-state "suggest a shop" link now points to `/content/submit-shop/`
      instead of outdated email.
- [x] `/404.html` — replaced hardcoded hex colors with CSS design-token variables (`--color-gold`,
      `--text-primary`, `--text-secondary`, `--border-default`, `--color-gold-tint`).
- [ ] `/index.html`, `/src/pages/home.js`, `/styles/pages/home.css`
- [ ] `/tracker.html`, `/src/tracker/*`, `/styles/pages/tracker-pro.css`
- [ ] `/calculator.html`, `/src/pages/calculator*`, `/styles/pages/calculator.css`
- [ ] `/shops.html`, `/src/pages/shops/*`, `/styles/pages/shops.css`

### Batch 5 — admin command-center workflow

- [ ] `/admin/index.html` — add shop-submissions stat/attention item and clearer command center.
- [ ] `/admin/shops/index.html` — expose public submission queue workflow.
- [ ] `/admin/content/index.html` — add publish-readiness/SEO workflow polish.
- [ ] `/admin/settings/index.html` — improve grouping and save-state clarity.
- [ ] `/styles/admin.css` — centralize reusable admin workflow styles.

### Batch 6 — generated pages, SEO inventory, validation

- [ ] `/build/generateSitemap.js` — include launched indexable content/landing pages.
- [ ] `/scripts/node/inventory-seo.js` outputs — refresh after landing pages.
- [ ] Run `npm test`, `npm run lint`, `npm run validate`, `npm run quality`, `npm run build`.
- [ ] Document pre-existing failures separately from introduced failures.

## Rollback points

1. Revert content-page launch batch without touching price math.
2. Revert Supabase submission queue if RLS policy needs owner adjustment.
3. Revert nav/footer brand changes independently.
4. Revert admin workflow polish independently.
