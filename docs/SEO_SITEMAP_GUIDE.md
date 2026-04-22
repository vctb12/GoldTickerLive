# SEO Sitemap Guide

This project generates `sitemap.xml` from code, not from a hand-written file. The generator
enumerates the canonical list of indexable URLs from `src/config/countries.js` +
`src/config/karats.js` + a static list of top-level pages, and writes them to `sitemap.xml` at the
repo root (and to `dist/` at build time).

## Canonical origin

All `<loc>` entries use `https://goldtickerlive.com` — the **apex domain, no `www`, https only**.
The sitemap test and the sitewide SEO test will fail if any `<loc>` uses `www.goldtickerlive.com` or
`http://`. Do not hand-edit `sitemap.xml` to bypass this rule.

## What is in the sitemap

- Top-level pages: `/`, `/tracker.html`, `/calculator.html`, `/shops.html`, `/invest.html`,
  `/learn.html`, `/methodology.html`, `/insights.html`, etc.
- Every `countries/<slug>/` page that is not a `noindex` meta-refresh stub. Country index pages that
  only redirect to `gold-price/` are excluded; the sitemap links to the `gold-price/` canonical page
  instead.
- Every published page under `content/`.
- `404.html` and `offline.html` are **excluded** by design.
- Admin pages under `admin/` are excluded (they are `noindex, nofollow`).

## Adding a new URL

### Adding a country

1. Add an entry to `src/config/countries.js` (code, names, currency, group, decimals, peg flag if
   applicable).
2. Create `countries/<slug>/gold-price/index.html` using an existing country as a template.
3. Re-run `node build/generateSitemap.js` (or run `npm run build`).
4. Run `npm test` to confirm `tests/sitemap.test.js` still passes.

### Adding a top-level page

1. Create the HTML file at the repo root (or under `content/`).
2. Add the page to the static list in `build/generateSitemap.js` (or
   `scripts/node/generate-sitemap.js`, depending on which generator is authoritative at the time —
   the first is what the test invokes).
3. Re-run the generator and run the test.

## Verification

- `npm test` — runs `tests/sitemap.test.js` which asserts:
  - the generator writes a valid `sitemap.xml`;
  - every `<loc>` uses the canonical origin;
  - core static pages and every existing country page are present;
  - `<loc>` values are unique;
  - `offline.html` is not present.
- `npm run build` — re-runs the sitemap generator as part of the Vite build so `dist/sitemap.xml` is
  always up to date for GitHub Pages.

## Troubleshooting

- **Test fails "expected sitemap to include loc for country X"** — the country is declared in
  `countries.js` and has an index file on disk, but the generator skipped it. Check that the country
  slug is spelled consistently, and that the HTML is not `noindex`.
- **Test fails with a `www.` URL** — you probably hand-edited `sitemap.xml` or added a hard-coded
  URL to the generator. Use the canonical origin constant, not a literal.
- **Generator writes `sitemap.xml` in `build/` instead of repo root** — the generator resolves
  `__dirname` to the script's folder. It must write to the repo root; the test will
  `fs.existsSync()` the repo root. If you move the generator, update the output path.

## Related files

- `build/generateSitemap.js` — generator invoked by the test.
- `scripts/node/generate-sitemap.js` — npm script alias.
- `tests/sitemap.test.js` — parity test.
- `tests/seo-sitewide.test.js` — canonical origin sitewide test.
