---
applyTo: "index.html,countries/**,content/**,learn.html,insights.html,methodology.html,shops.html,robots.txt,sitemap.xml,src/**/*seo*,scripts/**/*sitemap*,scripts/**/*seo*"
---

# SEO Instructions

Gold Ticker Live's organic visibility depends on a few non-negotiables. Read this before changing
metadata, canonicals, sitemap, robots, or shipping new content pages.

## 1. Canonical domain strategy

- **Canonical host: `https://goldtickerlive.com/`** — custom domain (see `CNAME`).
- Legacy GitHub Pages URLs under `/Gold-Prices/` exist. They must `301` to the canonical host or
  carry the canonical custom-domain URL via `<link rel="canonical">`. Never duplicate.
- Don't introduce `www.` unless we own the redirect both ways.
- Every page MUST emit:
  - `<link rel="canonical" href="https://goldtickerlive.com/<path>">`
  - `<meta property="og:url" content="https://goldtickerlive.com/<path>">`
  - `<link rel="alternate" hreflang="en" ...>` + `<link rel="alternate" hreflang="ar" ...>` +
    `<link rel="alternate" hreflang="x-default" ...>` where an EN/AR pair exists.

## 2. Sitemap

- `sitemap.xml` is **generated**. Do not hand-edit. Edit:
  - `scripts/node/generate-sitemap.js`
  - `build/generateSitemap.js`
- The build step `extract-baseline → normalize-shops → inject-schema → generateSitemap → vite build`
  always runs sitemap generation. CI validates coverage via `scripts/node/check-sw-coverage.js`
  and governance via `scripts/node/seo-governance.js`.
- New page → sitemap entry (unless `noindex`) + canonical + meta + schema where applicable.

## 3. Robots.txt + noindex policy

- `robots.txt` allows all crawlers by default. Use noindex headers/meta for selective exclusion.
- Required `noindex` set (enforced by `seo-governance.js`):
  - Per-karat city pages that are derivative
  - `investment-return.html`, `invest-in-gold-gcc.html`
  - Social/share landing pages under `content/social/`
- Adding a `noindex` page → add it to the governance allowlist in `scripts/node/seo-governance.js`
  in the same PR, and confirm sitemap exclusion.

## 4. Page-quality minimums (every indexable page)

- Unique `<title>` (≤ 60 chars, brand suffix where appropriate)
- Unique `<h1>` matching intent — don't reuse the homepage H1
- `<meta name="description">` (≤ 160 chars, user-benefit framing, no keyword stuffing)
- OG image (use the existing branded fallback if no page-specific one)
- Schema.org where it earns rich results (FAQ, BreadcrumbList, Article, Organization). Schema
  injection runs via `scripts/node/inject-schema.js` — don't hand-author `<script type="application/ld+json">` in markup unless intentional.
- Internal link **out** to methodology and **in** from at least one related hub page.

## 5. Country / city / karat pages

These are the SEO long tail. Each page must have:

- A local-context paragraph (currency, common karats, market context) — not a templated swap of
  the country name.
- Live karat table with current freshness label.
- Methodology link.
- Internal links to: country index, neighbouring countries, related calculators.
- Hreflang pairs if an Arabic equivalent exists.

If a page is only "country name + boilerplate", it is a thin duplicate. Either enrich it or
`noindex` it.

## 6. Content hub pages

`learn.html`, `insights.html`, articles under `content/` —

- Author tone neutral, factual, **not financial advice**.
- No AI-generated filler. If a section reads as generic, rewrite or cut it.
- One H1; H2/H3 hierarchy. No skipped levels.
- TL;DR / key takeaways at the top for long pieces.
- Last-updated date visible (and accurate).

## 7. Internal linking

- Every priced page → methodology.
- Calculator → tracker, country pages.
- Country pages → calculator, methodology, sibling countries, top cities.
- Avoid orphan pages. The sitemap is not enough — humans must reach the page from the nav, footer,
  or a hub.

## 8. Search Console / Bing Webmaster

- Verification meta tags live at the site root (`index.html`). Do not remove without a replacement.
- After major SEO changes, request a re-index of the changed URLs (manual operator step).

## 9. Common SEO mistakes to avoid

- Editing `sitemap.xml` directly (next build wipes it).
- Adding a page without a canonical (Google picks an arbitrary URL).
- Per-karat city pages indexed (we noindex these — they are thin duplicates).
- `og:url` and `<link rel=canonical>` pointing to different hosts.
- Forgetting hreflang pairs for EN/AR.
- Keyword-stuffing meta description.
- Country page where only the country name changes between H1s.

## 10. Validation commands

```bash
npm run seo:governance:check        # required policy
npm run validate                    # full gate (includes governance)
npm run analytics:inventory:check
npm run linkcheck                   # link health
npm run audit-pages                 # per-page audit
```

See [`docs/SEO_STRATEGY.md`](../../docs/SEO_STRATEGY.md),
[`docs/SEO_CHECKLIST.md`](../../docs/SEO_CHECKLIST.md),
[`docs/SEO_SITEMAP_GUIDE.md`](../../docs/SEO_SITEMAP_GUIDE.md).
