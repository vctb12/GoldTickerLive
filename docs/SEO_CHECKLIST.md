# SEO Checklist & Operations Guide

Reference for maintaining and improving search visibility for the Gold-Prices website.

---

## Search Console & Bing Setup

### Google Search Console
1. Visit [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://vctb12.github.io/Gold-Prices/`
3. Verification is already done via `<meta name="google-site-verification">` in `index.html`
4. Submit sitemap: `https://vctb12.github.io/Gold-Prices/sitemap.xml`
5. Monitor **Coverage** → check for crawl errors, excluded pages, valid pages
6. Monitor **Enhancements** → check structured data, breadcrumbs, FAQ rich results

### Bing Webmaster Tools
1. Visit [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add site: `https://vctb12.github.io/Gold-Prices/`
3. Verification is already done via `<meta name="msvalidate.01">` in `index.html`
4. Submit sitemap: `https://vctb12.github.io/Gold-Prices/sitemap.xml`
5. Use **URL Inspection** to test important pages

---

## Key URLs to Monitor First

| URL | Intent | Priority |
|-----|--------|----------|
| `/` | Live gold prices GCC | Critical |
| `/tracker.html` | Live gold tracker | Critical |
| `/countries/uae.html` | Gold price UAE today | Critical |
| `/countries/saudi-arabia.html` | Gold price Saudi | Critical |
| `/countries/uae/cities/dubai.html` | Gold price Dubai | High |
| `/calculator.html` | Gold calculator | High |
| `/countries/egypt.html` | Gold price Egypt | High |
| `/countries/index.html` | Country directory | Medium |
| `/shops.html` | Gold shops directory | Medium |
| `/guides/buying-guide.html` | How to buy gold | Medium |

---

## SEO Audit Script

Run the built-in SEO audit to check metadata, canonicals, hreflang, structured data, sitemap, and robots:

```bash
node scripts/seo-audit.js
```

This checks all 32 public HTML pages for:
- Title tags
- Meta descriptions
- Canonical URLs (must match expected pattern)
- Hreflang tags (x-default, en, ar)
- OG tags
- JSON-LD structured data
- Sitemap coverage
- robots.txt validity

---

## Adding a New Page

When adding a new HTML page:

1. **Title tag** — unique, includes intent keyword, under 60 chars
2. **Meta description** — unique, includes value proposition, 120-155 chars
3. **Canonical tag** — absolute URL: `https://vctb12.github.io/Gold-Prices/{path}`
4. **Hreflang tags** — 3 required:
   ```html
   <link rel="alternate" hreflang="x-default" href="https://vctb12.github.io/Gold-Prices/{path}" />
   <link rel="alternate" hreflang="en" href="https://vctb12.github.io/Gold-Prices/{path}" />
   <link rel="alternate" hreflang="ar" href="https://vctb12.github.io/Gold-Prices/{path}?lang=ar" />
   ```
5. **OG tags** — og:title, og:description, og:type, og:url, og:image
6. **Twitter tags** — twitter:card, twitter:title, twitter:description, twitter:image
7. **JSON-LD** — At minimum BreadcrumbList; add Article/FAQPage/WebPage as appropriate
8. **sitemap.xml** — Add a new `<url>` entry with hreflang alternates
9. **Service worker** — Add to `PRECACHE_URLS` in `sw.js`, bump `CACHE_NAME`
10. **Internal links** — Add to nav-data.js, footer.js, or relevant page cross-links
11. **Run audit** — `node scripts/seo-audit.js` to verify

---

## Adding a New Country Page

1. Add entry to `config/countries.js`
2. Create `countries/{slug}.html` following existing country page template
3. Include: title, meta description, canonical, hreflang, OG, BreadcrumbList
4. Add to `sitemap.xml` with hreflang alternates
5. Add to `countries/index.html` country tiles
6. Add to `sw.js` precache list
7. Update footer if the country is high-priority
8. Run `node scripts/seo-audit.js`

---

## Structured Data Types in Use

| Schema | Pages | Purpose |
|--------|-------|---------|
| WebSite + SearchAction | Homepage | Sitelinks search box |
| Organization | Homepage | Brand entity |
| BreadcrumbList | All pages | Breadcrumb rich results |
| FAQPage | Calculator, Learn, Tracker | FAQ rich results |
| Article | Insights, Methodology, Invest, Buying Guide | Article rich results |
| ItemList | Shops | Directory listing |
| CollectionPage | Countries index | Collection page |
| TouristAttraction | Market pages (Dubai Gold Souk, Khan el-Khalili) | Place rich results |
| City | Dubai city page | Place entity |

---

## Multilingual SEO

- All pages support `?lang=ar` for Arabic
- Hreflang tags in HTML `<head>` AND in sitemap.xml
- RTL layout handled by CSS when `dir="rtl"` is set
- All user-visible strings come from `config/translations.js`
- Don't hard-code UI text in HTML or JS

---

## What to Watch After Deployment

1. **Indexing coverage** — Are all 32 pages indexed?
2. **Crawl errors** — Any 404s, soft 404s, or server errors?
3. **Rich results** — Are FAQ, breadcrumb, article schemas generating rich results?
4. **Mobile usability** — Any mobile issues reported?
5. **Core Web Vitals** — LCP, CLS, INP scores for top pages
6. **Search queries** — Which queries are driving traffic? Are country/city queries appearing?
7. **Hreflang errors** — Any hreflang implementation issues in Coverage?

---

## Common SEO Mistakes to Avoid

- ❌ Duplicate title tags across pages
- ❌ Missing or duplicate canonical URLs
- ❌ Orphan pages (not linked from any other page)
- ❌ Adding pages to sitemap that are noindexed
- ❌ JSON-LD schema that doesn't match visible page content
- ❌ Hard-coded English text in bilingual pages
- ❌ Forgetting to bump SW cache version after changes
