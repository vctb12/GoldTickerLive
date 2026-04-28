# SEO Checklist & Operations Guide

Reference for maintaining and improving search visibility for Gold Ticker Live.

---

## Search Console & Bing Setup

### Google Search Console

1. Visit [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://goldtickerlive.com/`
3. Verification is already done via `<meta name="google-site-verification">` in `index.html`
4. Submit sitemap: `https://goldtickerlive.com/sitemap.xml`
5. Monitor **Coverage** → check for crawl errors, excluded pages, valid pages
6. Monitor **Enhancements** → check structured data, breadcrumbs, FAQ rich results

### Bing Webmaster Tools

1. Visit [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add site: `https://goldtickerlive.com/`
3. Verification is already done via `<meta name="msvalidate.01">` in `index.html`
4. Submit sitemap: `https://goldtickerlive.com/sitemap.xml`
5. Use **URL Inspection** to test important pages

---

## Key URLs to Monitor First

| URL                                   | Intent               | Priority |
| ------------------------------------- | -------------------- | -------- |
| `/`                                   | Live gold prices GCC | Critical |
| `/tracker.html`                       | Live gold tracker    | Critical |
| `/countries/uae/gold-price/`          | Gold price UAE today | Critical |
| `/countries/saudi-arabia/gold-price/` | Gold price Saudi     | Critical |
| `/countries/uae/dubai/gold-prices/`   | Gold price Dubai     | High     |
| `/calculator.html`                    | Gold calculator      | High     |
| `/countries/egypt/gold-price/`        | Gold price Egypt     | High     |
| `/countries/index.html`               | Country directory    | Medium   |
| `/shops.html`                         | Gold shops directory | Medium   |
| `/content/guides/buying-guide.html`   | How to buy gold      | Medium   |

---

## SEO Audit Script

Run the built-in SEO audit to check metadata, canonicals, hreflang, structured data, sitemap, and
robots:

```bash
npm run seo-audit
```

This checks all public HTML pages for:

- Title tags
- Meta descriptions
- Canonical URLs (must match expected pattern)
- Hreflang tags (x-default, en, ar)
- OG tags
- JSON-LD structured data
- Sitemap coverage
- robots.txt validity

Additional validation commands:

```bash
npm run validate         # SEO meta + DOM safety + sitemap coverage + analytics
npm run check-links      # Internal link health check
```

---

## Adding a New Page

When adding a new HTML page:

1. **Title tag** — unique, includes intent keyword, under 60 chars (rendered, not HTML-encoded)
2. **Meta description** — unique, includes value proposition, 140–160 chars
3. **Canonical tag** — absolute URL: `https://goldtickerlive.com/{path}`
4. **Hreflang tags** — 3 required:
   ```html
   <link rel="alternate" hreflang="x-default" href="https://goldtickerlive.com/{path}" />
   <link rel="alternate" hreflang="en" href="https://goldtickerlive.com/{path}" />
   <link rel="alternate" hreflang="ar" href="https://goldtickerlive.com/{path}?lang=ar" />
   ```
   For directory-style URLs (ending `/`), the ar alternate must also end with `/?lang=ar`.
5. **OG tags** — og:title, og:description, og:type, og:url, og:image, og:locale, og:locale:alternate
6. **Twitter tags** — twitter:card, twitter:title, twitter:description, twitter:image
7. **JSON-LD** — At minimum BreadcrumbList; add Article/FAQPage/WebPage as appropriate
8. **sitemap.xml** — regenerate with `npm run generate-sitemap`
9. **Service worker** — Add to `PRECACHE_URLS` in `sw.js`, bump `CACHE_NAME`
10. **Internal links** — Add to nav-data.js, footer.js, or relevant page cross-links
11. **Run audit** — `npm run seo-audit` to verify

---

## Adding a New Country Page

1. Add entry to `src/config/countries.js`
2. Run `node build/generatePages.js` to generate `countries/{slug}/gold-price/index.html` and city
   pages
3. Include: title, meta description, canonical, hreflang, OG, BreadcrumbList
4. Regenerate sitemap with `npm run generate-sitemap`
5. Add to `countries/index.html` country tiles
6. Update footer if the country is high-priority
7. Run `npm run seo-audit` to verify

---

## Structured Data Types in Use

| Schema                 | Pages                                           | Purpose                 |
| ---------------------- | ----------------------------------------------- | ----------------------- |
| WebSite + SearchAction | Homepage                                        | Sitelinks search box    |
| Organization           | Homepage                                        | Brand entity            |
| BreadcrumbList         | All pages                                       | Breadcrumb rich results |
| FAQPage                | Calculator, Learn, Tracker                      | FAQ rich results        |
| Article                | Insights, Methodology, Invest, Buying Guide     | Article rich results    |
| ItemList               | Shops                                           | Directory listing       |
| CollectionPage         | Countries index                                 | Collection page         |
| TouristAttraction      | Market pages (Dubai Gold Souk, Khan el-Khalili) | Place rich results      |
| City                   | Dubai city page                                 | Place entity            |

---

## Multilingual SEO

- All pages support `?lang=ar` for Arabic
- Hreflang tags in HTML `<head>` AND in sitemap.xml
- RTL layout handled by CSS when `dir="rtl"` is set
- All user-visible strings come from `config/translations.js`
- Don't hard-code UI text in HTML or JS

---

## What to Watch After Deployment

1. **Indexing coverage** — Are all ~500 public pages indexed in Google Search Console?
2. **Crawl errors** — Any 404s, soft 404s, or server errors?
3. **Rich results** — Are FAQ, breadcrumb, article schemas generating rich results?
4. **Mobile usability** — Any mobile issues reported?
5. **Core Web Vitals** — LCP, CLS, INP scores for top pages
6. **Search queries** — Which queries are driving traffic? Are country/city queries appearing?
7. **Hreflang errors** — Any hreflang implementation issues in Coverage report?

---

## Green Checks (as of last audit)

- ✅ All 687 public HTML pages have title, canonical, OG, and hreflang tags
- ✅ Sitemap covers 497 public URLs with hreflang alternates
- ✅ Homepage has WebSite + Organization + SearchAction JSON-LD
- ✅ All country/city/karat pages have BreadcrumbList JSON-LD
- ✅ hreflang `ar` alternates include correct trailing slash before `?lang=ar`
- ✅ robots.txt disallows `/admin/`, `/api/`, and internal directories
- ✅ `https://goldtickerlive.com` (no `www`) used consistently across all canonicals, OG, and
  hreflang URLs

---

## Common SEO Mistakes to Avoid

- ❌ Duplicate title tags across pages
- ❌ Missing or duplicate canonical URLs
- ❌ Orphan pages (not linked from any other page)
- ❌ Adding pages to sitemap that are noindexed
- ❌ JSON-LD schema that doesn't match visible page content
- ❌ Hard-coded English text in bilingual pages
- ❌ Forgetting to bump SW cache version after changes
