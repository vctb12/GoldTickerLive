# Contributing to Gold Ticker Live

Thank you for your interest in contributing! This guide covers the conventions, workflow, and
practical steps for working on Gold Ticker Live.

---

## Code Style

- **Vanilla ES6 modules** — no frameworks, no bundler plugins, no TypeScript
- **All UI strings** must go in `config/translations.js` — never hard-code text
- **Bilingual** — every user-facing feature must support English + Arabic
- **RTL-aware** — use logical CSS properties (`inline-start`, `inline-end`) where possible
- **No new dependencies** unless absolutely necessary and discussed first
- **Consistent naming** — `camelCase` for JS, `kebab-case` for CSS classes and file names

### File organization

| Type                 | Location                  |
| -------------------- | ------------------------- |
| Page-specific CSS    | `styles/pages/<page>.css` |
| Page-specific JS     | `scripts/pages/<page>.js` |
| Shared UI components | `components/<name>.js`    |
| Core libraries       | `lib/<name>.js`           |
| Configuration        | `config/<name>.js`        |
| Automation scripts   | `scripts/<name>.js`       |
| Guide articles       | `guides/<slug>.html`      |
| Tool pages           | `tools/<slug>.html`       |

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

2. **Create country page:** Copy an existing file in `countries/` (e.g., `countries/oman.html`) and
   update the country-specific content.

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

4. **Update navigation:** Add the country to `components/nav-data.js` if it should appear in the nav
   dropdown.

5. **Update footer:** Add to `components/footer.js` if the country belongs to GCC or primary
   regions.

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
npm install           # install dependencies
npm test              # runs 350+ unit tests
npm run preflight     # audit-pages + check-links
npm run seo-audit     # validate SEO metadata
npm run validate      # DOM-safety, SEO meta, SW coverage, analytics gate
```

Tests run with `--test-concurrency=1` to prevent file races on shared JSON data.

---

## Pre-Deploy Checks

Before merging or deploying, run the full gate:

```bash
npm run pre-deploy          # 11-check gate, exits 1 on any FAIL
npm run pre-deploy:fast     # same but skips the slow npm test step
```

Checks performed (in order):

| #   | What                                                          | Severity |
| --- | ------------------------------------------------------------- | -------- |
| 1   | `data/gold_price.json` present, valid, and fresh              | critical |
| 2   | `sitemap.xml` present, ≥ 50 URLs, and ≤ 7 days old            | critical |
| 3   | `dist/` and core HTML files exist                             | critical |
| 4   | No `.env` / `secrets.json` checked in                         | critical |
| 5   | Service-worker registered in `index.html`                     | warning  |
| 6   | `CNAME` file present and non-empty                            | warning  |
| 7   | `data/shops-data.json` parseable                              | critical |
| 8   | `npm run validate` passes (DOM-safety, SEO meta, SW coverage) | critical |
| 9   | `robots.txt` present and contains `User-agent`                | critical |
| 10  | `npm test` passes                                             | critical |
| 11  | Working tree has no uncommitted changes                       | critical |

The script always exits non-zero when any **critical** check fails. Run `npm run build` first to
populate `dist/`.

---

## Generating a Changelog Entry

```bash
npm run changelog              # print Conventional Commits grouped by type to stdout
npm run changelog:write        # prepend to CHANGELOG.md
npm run changelog -- --since v1.2.3   # since a specific git tag or SHA
npm run changelog -- --version v1.3.0 # use an explicit version header
```

Commit messages should follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(tracker): add karat-purity explanation card
fix(css): dark-mode hover tint on nav icon buttons
docs: update CONTRIBUTING with pre-deploy section
chore(ci): pin Node to 20 in ci.yml
```

Breaking changes use `!` before the colon:

```
feat(api)!: drop support for legacy price endpoint
```

The script auto-detects the most recent git tag as the lower bound when no `--since` is supplied. If
no tags exist it reads the last 200 commits.

---

## Packaging a Release Artifact

```bash
npm run build                 # build dist/ first
npm run release:package       # package release → release/ directory
npm run release:package -- --dry-run  # preview without writing files
```

Output written to `release/`:

| File                                 | Contents                                                 |
| ------------------------------------ | -------------------------------------------------------- |
| `release.json`                       | brand, version, buildSha, buildTimestamp, distFiles list |
| `CHANGELOG.md`                       | copy of root `CHANGELOG.md`                              |
| `gold-ticker-live-vX.Y.Z-SHA.tar.gz` | tarball of `dist/` + both above files                    |

**Important:** the script never tags git or publishes anywhere. Promotion (tagging, uploading
assets) is a human or owner-approved CI step on `main`.

---

## Important Notes

- **AED peg is fixed** at 3.6725 — never fetch it from an API
- **Prices are estimates** — always frame as "bullion-equivalent estimates" with appropriate
  disclaimers
- **Service worker version** must be bumped in `sw.js` when precache URLs change
- **Dark mode** uses `[data-theme="dark"]` attribute — test both themes
- **Admin auth uses Supabase GitHub OAuth** — configure allowed email in `admin/supabase-config.js`

---

## Supabase Development

The admin panel uses Supabase for authentication and data persistence.

- **Config**: `admin/supabase-config.js` — Supabase URL, anon key, allowed email
- **Auth**: `admin/supabase-auth.js` — GitHub OAuth flow
- **Schema**: `supabase/schema.sql` — run in Supabase SQL Editor to create tables
- **Environment**: Copy `.env.example` to `.env` and fill in your Supabase credentials
- **Tables**: `shops`, `site_settings`, `audit_logs`, `user_profiles`, `gold_prices`, `fetch_logs`

See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for the full setup guide.

---

## Questions?

Open an issue or check the [Wiki](https://github.com/vctb12/Gold-Prices/wiki) for deeper
documentation.
