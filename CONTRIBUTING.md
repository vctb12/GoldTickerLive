# Contributing to GoldPrices

Thank you for your interest in contributing! This guide covers the conventions, workflow, and practical steps for working on GoldPrices.

---

## Code Style

- **Vanilla ES6 modules** — no frameworks, no bundler plugins, no TypeScript
- **All UI strings** must go in `config/translations.js` — never hard-code text
- **Bilingual** — every user-facing feature must support English + Arabic
- **RTL-aware** — use logical CSS properties (`inline-start`, `inline-end`) where possible
- **No new dependencies** unless absolutely necessary and discussed first
- **Consistent naming** — `camelCase` for JS, `kebab-case` for CSS classes and file names

### File organization

| Type | Location |
|------|----------|
| Page-specific CSS | `styles/pages/<page>.css` |
| Page-specific JS | `scripts/pages/<page>.js` |
| Shared UI components | `components/<name>.js` |
| Core libraries | `lib/<name>.js` |
| Configuration | `config/<name>.js` |
| Automation scripts | `scripts/<name>.js` |
| Guide articles | `guides/<slug>.html` |
| Tool pages | `tools/<slug>.html` |

---

## PR Workflow

1. **Fork or branch** from `main`
2. Name your branch: `feature/<short-name>` or `fix/<short-name>`
3. Make changes, keeping PRs small and focused
4. Run preflight checks before pushing:
   ```bash
   npm install
   npm test
   npm run preflight
   npm run seo-audit
   ```
5. Open a PR against `main` with a clear description
6. Wait for CI checks to pass and review

---

## Adding a New Country

1. **Add to config:** Add an entry to `config/countries.js`:
   ```js
   { code: 'XX', name: 'Country Name', nameAr: 'الاسم', currency: 'XXX', flag: '🇽🇽', group: 'region', decimals: 2 }
   ```

2. **Create country page:** Copy an existing file in `countries/` (e.g., `countries/oman.html`) and update the country-specific content.

3. **Create city pages:** Under `<country-slug>/` create the city structure:
   ```text
   country-slug/
   ├── gold-price/index.html
   └── city-name/
       ├── gold-prices/index.html
       ├── gold-rate/
       │   ├── 18-karat/index.html
       │   ├── 21-karat/index.html
       │   ├── 22-karat/index.html
       │   └── 24-karat/index.html
       └── gold-shops/index.html
   ```

4. **Update navigation:** Add the country to `components/nav-data.js` if it should appear in the nav dropdown.

5. **Update footer:** Add to `components/footer.js` if the country belongs to GCC or primary regions.

6. **Update sitemap:** Run `npm run generate-sitemap` or add manually to `sitemap.xml`.

7. **Update service worker:** Add precache URLs to `sw.js` and bump `CACHE_NAME`.

---

## Adding a New Guide

1. Create `guides/<slug>.html` following the template of `guides/buying-guide.html`
2. Include proper SEO metadata: title, description, canonical, hreflang, JSON-LD BreadcrumbList
3. Use `components/nav.js` and `components/footer.js` for shared navigation
4. Add the guide to `components/nav-data.js` under the Learn group
5. Add to `sitemap.xml`

---

## Adding a New Tool Page

1. Create `tools/<slug>.html` with proper SEO metadata
2. Add a companion CSS file to `styles/pages/` if needed
3. Import from `lib/` and `config/` for pricing logic
4. Add to `components/nav-data.js` under the Tools group
5. Add to `sw.js` precache and bump cache version
6. Add to `sitemap.xml`

---

## Testing

```bash
npm install           # Required for some test dependencies
npm test              # Runs 66+ tests
npm run preflight     # Runs audit-pages + check-links
npm run seo-audit     # Validates SEO metadata
```

Tests run with `--test-concurrency=1` to prevent file races on shared JSON data.

---

## Important Notes

- **AED peg is fixed** at 3.6725 — never fetch it from an API
- **Prices are estimates** — always frame as "bullion-equivalent estimates" with appropriate disclaimers
- **Service worker version** must be bumped in `sw.js` when precache URLs change
- **Dark mode** uses `[data-theme="dark"]` attribute — test both themes
- **No admin credentials in source** — all secrets go in GitHub repository settings

---

## Questions?

Open an issue or check the [Wiki](https://github.com/vctb12/Gold-Prices/wiki) for deeper documentation.
