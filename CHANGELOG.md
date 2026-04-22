# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Track A, Phase 5 — CSP hardening

- feat(security): externalize inline analytics to `assets/analytics.js` (gtag loader + Clarity
  IIFE + DNT/opt-out gate). A new CJS codemod `scripts/node/externalize-analytics.js` walks every
  `.html` file in the repo and swaps the three legacy inline blocks for a single
  `<script src="…/assets/analytics.js" defer></script>`, computing the correct relative depth per
  file. Idempotent; `--check` mode.
- feat(security): drop `'unsafe-inline'` from `scriptSrc` in `server.js` CSP now that all inline
  analytics is externalized.
- chore(ci): `npm run validate` now runs `externalize-analytics --check` so a regression adding new
  inline analytics fails CI.

### Track C — Product polish

- feat(tracker): `renderSeasonal()` in `src/tracker/render.js` populates the previously-dead
  `#tp-seasonal-results` with typical-high month, typical-low month, and seasonal spread (%),
  derived from monthly averages over `state.history`.
- feat(shops): bilingual "Featured: editorially selected markets…" footnote under the featured grid
  (`#shops-featured-note`) plus "Directory last reviewed {date}" label inside the filter bar
  (`#shops-directory-reviewed`). Both wired through `applyLang()` in `src/pages/shops.js`.
- feat(design): new site-wide trust utilities in `styles/global.css` — `.trust-banner` (+
  `--success` variant), `.freshness-label` (+ `--live` / `--cached` / `--stale` / `--delayed` /
  `--estimated` / `--baseline`), `.methodology-link`, `.disclaimer` (+ `--inline`), backed by new
  `--color-warning*` tokens (amber for stale/cached/delayed data, not red) with explicit dark-mode
  overrides.

### Tests

- test(sitemap): new `tests/sitemap.test.js` (6 assertions) — runs the sitemap generator, asserts
  every `<loc>` uses the canonical apex origin (no www, no http), that core static pages and every
  on-disk country page are covered, that `<loc>` values are unique, and that `offline.html` is not
  in the sitemap.
- docs: new `docs/SEO_SITEMAP_GUIDE.md` documents how to add URLs and how the sitemap is verified.

### Track A — Stabilize (production revamp foundations)

- chore(repo): remove tracked build artifacts (`dist/`, `playwright-report/`, `test-results/`) from
  git; add to `.gitignore`.
- chore(config): deduplicate tool configs — `.prettierrc` and `.eslintrc.json` removed;
  `.prettierrc.json` and `eslint.config.mjs` (flat) are now the single sources of truth.
- fix(ci): rewrite `ci.yml` — the previous file contained two concatenated YAML documents and was
  silently producing zero jobs (every run marked failure). New workflow pins Node 20, runs
  `validate → quality → test → build`, and uploads `dist/` artifacts. Test-only secrets
  (`JWT_SECRET`, `ADMIN_PASSWORD`, `ADMIN_ACCESS_PIN`) provided via workflow env.
- fix(ci): `perf-check.yml` no longer uses the deprecated `microsoft/playwright-github-action@v1`;
  replaced with `npx playwright install --with-deps`. Node pinned to 20.
- test: fix `tests/verify-shops.test.js` (was written against Jest globals; converted to
  `node:test` + `node:assert` — matches the rest of the suite). All 221 tests now pass.
- test(e2e): broaden Playwright smoke coverage to home, shops, tracker, calculator, countries index,
  a country page, and the 404 page. Checks HTTP status and layout presence, not brittle substrings.
- chore(husky): fix invalid shebang in `.husky/pre-commit` (`. "/usr/bin/env bash"` → proper
  `#!/usr/bin/env sh`); remove `npm test` from the hook (kept in CI) so commits stay fast. Update
  `prepare` script to husky v9 form (`husky` — `husky install` is deprecated).
- chore(style): `stylelint value-keyword-case` now ignores standard font-family keywords (`Arial`,
  `Roboto`, `Cairo`, …) so autofix does not silently lowercase them.
- fix(build): `scripts/node/extract-baseline.js` no longer hard-fails when
  `src/lib/historical-data.js` imports the baseline JSON directly (it now does — the JSON file is
  the source of truth). The script stays as a safety net for regressions.
- chore(lint): `eslint.config.mjs` bumped to `ecmaVersion: 'latest'`; `src/lib/historical-data.js`
  added to ignore list because espree does not yet parse import attributes
  (`assert { type: 'json' }`).
- docs: add transient `REVAMP_STATUS.md` tracking the 30-phase revamp plan (Tracks A–E). File is
  deleted at Phase 30 (launch); contents roll into this changelog.

### Pre-Track-A

- feat(tracker): lazy-load GoldChart; forward live/history updates; add image-audit tool and a
  lightweight CI workflow (#129) — defers heavy chart library to improve initial load.
