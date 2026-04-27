# Repo & Site Audit — 2026-04-23

This is PR #1 of the charter-respecting improvement campaign: a **docs-only, evidence-based** audit.
No code, config, or SEO surface is modified here. The owner can triage these findings and pick which
P0 items graduate into plan PRs under [`docs/plans/`](./plans/), per
[`AGENTS.md` §4.3](../AGENTS.md).

### How to read this file

- Every claim below is grounded in a file path or workflow at the SHA this PR is based on.
- Live-site numbers (Lighthouse, Core Web Vitals, axe scans, responsive screenshots) are
  **explicitly flagged as follow-ups**. This sandbox cannot drive a browser against
  `https://goldtickerlive.com/` and the charter forbids fabricating verification claims
  ([`AGENTS.md` §6.11](../AGENTS.md#6-product-trust-guardrails)). The existing
  [`lighthouse.yml`](../.github/workflows/lighthouse.yml) and [`.pa11yci.js`](../.pa11yci.js) are
  the right tools for that work in a follow-up PR.
- Findings are neutral. They identify where the repo is strong, where it's reasonable, and where
  there's room to improve. They are not a mandate to change anything.

---

## A. Stack & architecture

### Detected stack

| Area          | Detected                                                                                                                                         | Source                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Frontend      | Vanilla ES modules under `src/`, static multi-page HTML at repo root and in `countries/`, `content/`                                             | [`AGENTS.md` §1, §3](../AGENTS.md), `package.json`        |
| Build         | Vite 8 (`vite build`), preceded by `scripts/node/extract-baseline.js` → `normalize-shops.js` → `build/generateSitemap.js`                        | `package.json` `scripts.build`                            |
| Styling       | Hand-authored CSS with tokens (`styles/global.css`) + per-page files under `styles/pages/`; stylelint-config-standard 40                         | `package.json`, `styles/`                                 |
| Backend       | Node/Express 5 admin API in `server/` + `server.js`; `fs.readFileSync/writeFileSync` for JSON persistence; Helmet, CORS, rate-limit, JWT, bcrypt | `package.json` dependencies                               |
| Python        | Automation in `scripts/python/` (gold poster, newsletters, Supabase client, spike detector); linted with ruff 0.9.2                              | `pyproject.toml`, `scripts/python/`, `ci.yml` python-lint |
| Hosting       | GitHub Pages for the static site (see `deploy.yml`); `CNAME` + `goldtickerlive.com`                                                              | `.github/workflows/deploy.yml`, `CNAME`                   |
| Admin OAuth   | Supabase GitHub OAuth (admin panel)                                                                                                              | `admin/`, `supabase/`                                     |
| Module system | Root `package.json` `"type": "commonjs"`; `src/package.json` `"type": "module"` so `src/**/*.js` loads as ESM                                    | `package.json`, `src/package.json`                        |

### Dependency health (snapshot from `package.json`)

Runtime deps are on current major versions at audit time:

- `express ^5.2.1`, `helmet ^8.1.0`, `express-rate-limit ^8.3.2`, `cors ^2.8.6`, `morgan ^1.10.1`
- `jsonwebtoken ^9.0.3`, `bcryptjs ^3.0.3`

> **Note:** Persistence is via plain `fs.readFileSync` / `fs.writeFileSync` in
> `server/repositories/`. `lowdb` was previously listed here but was removed in the 2026-04-24
> dependency audit; `uuid` was removed in the 2026-04-27 follow-up (replaced with
> `crypto.randomUUID()` where applicable). See `docs/DEPENDENCIES.md` for the current snapshot.

Dev deps likewise on current majors: `vite ^8.0.9`, `eslint ^10.2.1`, `prettier ^3.8.3`,
`stylelint ^17.8.0`, `@playwright/test ^1.48.2`, `terser ^5.46.1`, `linkinator ^7.6.1`,
`husky ^9.1.7`, `lint-staged ^16.4.0`.

CI runs `npm audit --audit-level=high || true` on every PR
([`ci.yml` line 51](../.github/workflows/ci.yml#L51)). It is intentionally **non-blocking**; a
follow-up could optionally promote high-severity advisories to blocking, but that's a policy call,
not a defect.

> **Follow-up not done here:** a live `npm audit --json` snapshot. Adding the lockfile parse + a
> brief "advisories open at <date>" table would be a natural addition to the next audit refresh. Out
> of scope for a docs-only PR.

### Top-level directory map

| Path                   | Purpose                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `/`                    | Entry HTML (`index.html`, `tracker.html`, `shops.html`, `calculator.html`, `invest.html`, …), `CNAME`, `sw.js`                 |
| `src/`                 | ES modules: `components/`, `pages/`, `lib/`, `config/`, `tracker/`, `search/`, `seo/`, `social/`, `data/`, `utils/`, `routes/` |
| `styles/`              | `global.css` tokens + primitives, per-page CSS under `styles/pages/`                                                           |
| `countries/`           | Pre-generated country / city / karat / market static pages                                                                     |
| `content/`             | Guides, FAQ, tools, compare, news, premium-watch, newsletter, etc.                                                             |
| `admin/`               | Admin panel (Supabase GitHub OAuth)                                                                                            |
| `server/`, `server.js` | Express admin backend                                                                                                          |
| `scripts/node/`        | Build, validation, audit, enrichment, sitemap, link-check                                                                      |
| `scripts/python/`      | Automation (hourly X-poster, newsletters, Supabase helpers)                                                                    |
| `.github/workflows/`   | CI, deploy, codeql, semgrep, lighthouse, perf-check, post_gold, newsletters, uptime/health/spike, sync-db                      |
| `tests/`               | 23 node:test suites + a Playwright `e2e/` directory                                                                            |
| `docs/`                | Reference docs + master plan + `plans/` intake folder                                                                          |
| `supabase/`            | Supabase schema / setup artifacts                                                                                              |
| `reports/`             | Link-check and other CI-produced reports                                                                                       |

---

## B. CI / CD & workflow inventory

Workflows live in `.github/workflows/`. Each has a tier header; only `ci.yml` gates merges.

| Workflow                | Tier               | Trigger                                 | Notes                                                                 |
| ----------------------- | ------------------ | --------------------------------------- | --------------------------------------------------------------------- |
| `ci.yml`                | **Merge gate**     | push/PR to `main`, manual, nightly cron | validate → quality → test → build → link-check; `e2e` job is blocking |
| `deploy.yml`            | Production deploy  | push to `main`                          | Publishes to GitHub Pages                                             |
| `codeql.yml`            | Informational scan | schedule / PR                           | Security scan                                                         |
| `semgrep.yml`           | Informational scan | schedule / PR                           | Pattern-based SAST                                                    |
| `lighthouse.yml`        | Informational scan | `workflow_dispatch`                     | Manual LHCI autorun against `npm run preview`                         |
| `perf-check.yml`        | Informational scan | —                                       | Performance sanity                                                    |
| `post_gold.yml`         | **Production bot** | hourly schedule                         | **§6.10 — do not touch without explicit approval and a plan entry.**  |
| `daily-newsletter.yml`  | Content bot        | schedule                                | Daily digest                                                          |
| `weekly-newsletter.yml` | Content bot        | schedule                                | Weekly digest                                                         |
| `uptime-monitor.yml`    | Content/ops bot    | schedule                                | Pings health endpoints                                                |
| `health_check.yml`      | Content/ops bot    | schedule                                | Health probes                                                         |
| `spike_alert.yml`       | Content/ops bot    | schedule                                | Price spike detection                                                 |
| `sync-db-to-git.yml`    | Content/ops bot    | schedule / dispatch                     | Persists DB state back to git                                         |

### Validation surface (what `ci.yml` actually runs)

From [`package.json` scripts](../package.json) composed into `ci.yml`:

- `npm run validate` → `validate-build.js` + `check-unsafe-dom.js` + `check-seo-meta.js`
  - `check-sitemap-coverage.js` + `enrich-placeholder-pages.js --check` +
    `externalize-analytics.js --check`
- `npm run quality` → `eslint .` + `prettier --check .` + `stylelint '**/*.css'`
- `npm test` → 23 `node:test` suites in `tests/*.test.js`
- `NODE_ENV=production npm run build` → full Vite production build; dist size + HTML count logged
- `generate-sitemap.js` + `check-sitemap-coverage.js` — sitemap regenerated and enforced
- `check-links.js --dir dist --fail-on-error || true` + `linkinator` baseline +
  `enforce-linkcheck.js`
- `python-lint` job: `ruff check scripts/python`
- `e2e` job: `playwright test --project=chromium` against a `python3 -m http.server` preview of
  `dist/`

**Assessment:** the merge gate is substantive and well-layered. DOM-safety baseline, SEO meta,
sitemap coverage, placeholder-page drift, EN/AR parity (via nav-data and seo-sitewide tests), and
tracker invariants are all enforced. Few repos of this size run a Playwright smoke alongside 23 unit
suites on every PR. This is a strength.

---

## C. Test surface

23 suites live in `tests/*.test.js` (plus `tests/e2e/` for Playwright):

```
audit-log, auth, circuit-breaker, errors, formatter, freshness-pulse, historical,
input-validation, live-status, nav-data, price-calculator, pricing-engine,
repositories, route-utils, safe-dom, seo-metadata, seo-sitewide, server,
shop-manager, sitemap, tracker-hash, tracker-modes, verify-shops
```

Notable invariant-enforcing suites:

- `seo-sitewide.test.js` — rejects `www.` or `http://` in canonical/og:url site-wide
- `nav-data.test.js` — enforces NAV_DATA shape + EN/AR parity including primary-flag positions
- `tracker-hash.test.js` — locks the tracker URL-hash contract documented in `docs/tracker-state.md`
- `tracker-modes.test.js` — locks the 5-mode + 2-panel tab registry
- `safe-dom.test.js` — verifies the sanctioned sinks in `src/lib/safe-dom.js`

---

## D. SEO surface (read-only — §6.4)

Per [`AGENTS.md` §6.4](../AGENTS.md#6-product-trust-guardrails) I am **documenting only**, not
changing anything on the SEO surface. Every finding below is a question for the owner, not an action
item I will silently execute.

### `robots.txt`

Present at repo root. `Allow: /` for all user-agents. Disallows `/admin.html`, `/admin/`, `/api/`,
`/server/`, `/tests/`, `/node_modules/`, `/supabase/`, `/repositories/`, `/dist/`. Points to
`Sitemap: https://goldtickerlive.com/sitemap.xml` (apex origin — consistent with the sitewide test
enforcement).

### Canonical / og:url

Root `index.html` uses:

```html
<link rel="canonical" href="https://goldtickerlive.com/" />
<meta property="og:url" content="https://goldtickerlive.com/" />
```

Apex, HTTPS — matches `tests/seo-sitewide.test.js` enforcement.

### `CNAME`

Contains `www.goldtickerlive.com` (single line). **This is worth the owner's attention.**

- The rest of the site (canonicals, og:url, robots sitemap URL, `tests/seo-metadata.test.js`) uses
  the **apex** origin `https://goldtickerlive.com`.
- GitHub Pages uses `CNAME` to set the primary custom domain; a `www.` value typically means the
  site's apex requests are served via a redirect to `www.`, which would mean every canonical URL the
  site publishes (apex) redirects once before resolving. That's not broken, but it's inconsistent
  with the apex-first story enforced elsewhere, and redirect hops are a small but real Core Web
  Vitals / crawl-efficiency tax.
- **I am not changing this.** Changing `CNAME` is exactly the kind of SEO surface edit §6.4 says
  must ride on a plan PR, not a silent fix. See P1 below.

### `sitemap.xml` (root)

Generated by `build/generateSitemap.js` (invoked in `package.json` build script) and regenerated
again in `ci.yml` via `scripts/node/generate-sitemap.js`. Coverage is enforced by
`scripts/node/check-sitemap-coverage.js` in `npm run validate`. Not inspected in this PR.

### Structured data / og / twitter

`index.html` head contains 13 occurrences of canonical/og:/twitter:/JSON-LD markers (grep in repo).
Not individually enumerated here — a dedicated SEO-verification pass belongs in its own plan PR (see
P1 below) so the owner can review a structured inventory rather than a docs-only narrative.

---

## E. Data source & freshness UX (partial verification)

Charter clauses §6.1–§6.3 (spot vs retail separation, labelled freshness) are the highest-stakes
product invariants. Quick grounded observations from the code:

- [`src/lib/api.js`](../src/lib/api.js) already implements a **primary → secondary → cached
  fallback** chain with a `source` field on the returned object (`cache-fallback` etc.) and an
  `updatedAt` timestamp. So "add data-source redundancy from scratch" is _not_ the right framing —
  the redundancy layer exists.
- [`src/lib/live-status.js`](../src/lib/live-status.js) provides `getLiveFreshness()` with a
  10-minute stale threshold (`GOLD_MARKET.STALE_AFTER_MS`) plus relative-age formatting, and
  `tests/live-status.test.js` locks the behavior.
- `tests/freshness-pulse.test.js` plus `styles/global.css` `[data-freshness-pulse]` and
  `src/lib/freshness-pulse.js` implement a throttled (90s default) visual pulse.

**Where a follow-up would still help** (proposals only, flag for plan PR):

1. **Stale-state visibility audit.** The threshold exists; a site-wide audit of whether every
   user-facing price surface actually _renders_ the stale label when `freshness.isStale` is true
   would be valuable. There's no single test asserting "every price surface consumes
   `getLiveFreshness()`."
2. **Provider identity in UI.** `api.js` returns `source` but I did not verify it surfaces in the UI
   beyond the tracker. Surface-by-surface "what do we show when we served from fallback?" is worth a
   read-only inventory before any change.
3. **Currency / unit coverage matrix.** The README lists 24+ currencies and 7 karats; a generated
   matrix of which pages actually expose which currency × unit × karat would make §6.1–§6.3 easier
   to reason about across all country pages.

None of these requires immediate code change. They're candidates for plan PRs.

---

## F. Accessibility (repo tooling inventory, not a live scan)

**What exists:**

- [`.pa11yci.js`](../.pa11yci.js) runs `pa11y-ci` with `WCAG2AA` standard against three URLs (`/`,
  `/tracker.html`, `/shops.html`) on localhost. Invoked by `npm run a11y`.
- `styles/global.css` has a global `prefers-reduced-motion: reduce` reset for motion primitives
  (verified in memory from prior sessions; matches `tests/freshness-pulse.test.js` expectations).
- The nav component has a tri-state theme toggle (auto/light/dark) respecting the user's system
  preference in `auto` mode (recorded in repo memory; `src/components/nav.js`).

**Gaps worth considering** (read-only observations):

1. `.pa11yci.js` only covers 3 URLs. Country / city / market pages and content articles don't have
   a11y coverage in the automated pass. A wider URL set (sampled rather than exhaustive — 689 HTML
   files exist) would catch more regressions.
2. `pa11y-ci` is not wired into `ci.yml` — it's a manual `npm run a11y`. That's a reasonable choice
   given browser setup cost, but worth being explicit about.
3. No axe-core or Playwright-a11y check in the `e2e` job. Could be added cheaply inside the existing
   Playwright setup.

None of these are defects. They're candidates.

---

## G. Performance (repo tooling inventory, not a live measurement)

**What exists:**

- [`lighthouse.yml`](../.github/workflows/lighthouse.yml) — manual `workflow_dispatch` LHCI autorun
  against a Vite preview on `http://localhost:4173`, uploaded to LHCI temporary public storage. Good
  scaffolding; informational tier.
- [`perf-check.yml`](../.github/workflows/perf-check.yml) — additional perf sanity.
- `scripts/node/image-audit.js` — `npm run image-audit`, composed into `npm run perf:ci`.
- `docs/performance-baseline.json` — a recorded baseline (not inspected in this PR).

**What I deliberately did not do:**

- I did not run Lighthouse against `https://goldtickerlive.com/`. The sandbox cannot drive a browser
  against a production URL, and inventing numbers would violate §6.11. The correct next step is a
  follow-up PR that either (a) dispatches `lighthouse.yml` and attaches the report URL, or (b) runs
  LHCI locally against the current `main` build and records the numbers in a plan PR.

---

## H. PWA / service worker / manifest

- `manifest.json` is valid and well-scoped: name, short_name, description, start_url, scope, display
  `standalone`, theme/background colors, SVG + 192×192 + 512×512 icons (present under `assets/`),
  `shortcuts` entries for Tracker and Calculator.
- `sw.js` exists at repo root and `offline.html` is present — the offline shell is wired.
- I did not verify SW registration is invoked from every entry page. A quick follow-up grep
  inventory is reasonable before claiming PWA readiness.

---

## I. Repo hygiene (present / absent)

| Item                                                        | Status                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| `LICENSE`                                                   | Present                                                    |
| `CHANGELOG.md`                                              | Present at repo root and under `docs/`                     |
| `CONTRIBUTING.md`                                           | Present at repo root and under `docs/`                     |
| `.editorconfig`                                             | Present                                                    |
| `.prettierrc.json`, `.prettierignore`                       | Present                                                    |
| `.stylelintrc.json`                                         | Present                                                    |
| `eslint.config.mjs`                                         | Present (flat config)                                      |
| `.nvmrc`                                                    | Present                                                    |
| `.husky/`                                                   | Present, `husky` wired through `lint-staged`               |
| `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` | All present and consistent                                 |
| README                                                      | Bilingual, badge-forward, links to live site and sub-pages |

There is no _missing-hygiene_ problem to fix. The candidate improvements are polish, not triage.

---

## J. Prioritized recommendations

Each recommendation cites the charter clause it respects, so the owner can evaluate it against the
same rules the implementation would be bound by. None of these is implemented in this PR.

### P0 — highest value × lowest risk (candidates for the next plan PR)

1. **Document the apex-vs-www origin choice and the `CNAME` value.** `CNAME` says
   `www.goldtickerlive.com` while every canonical/og:url/sitemap URL in the repo uses the apex
   `https://goldtickerlive.com`. Either (a) confirm the redirect is intentional and note it in
   `docs/SEO_STRATEGY.md`, or (b) plan a `CNAME`/redirect change as a dedicated plan PR.
   **Charter:** §6.4 (no silent SEO surface changes).

2. **Generate a read-only SEO-surface inventory.** One JSON artifact listing, per entry HTML file,
   the canonical, og:url, og:image, twitter:card, JSON-LD @type values, hreflang, and robots-meta.
   Committed under `reports/seo/` (or similar), produced by a new script added in a plan PR. Makes
   every future SEO change reviewable as a diff of generated output. **Charter:** §6.4, §6.11.

3. **Site-wide stale/freshness coverage audit.** A static-analysis pass (grep + AST) that lists
   every page with a gold-price rendering, and for each whether it consumes `getLiveFreshness()` and
   whether it renders the `stale` state. Report-only; no code change. Findings seed a future plan PR
   if gaps exist. **Charter:** §6.1–§6.3.

### P1 — this month

4. **Extend pa11y coverage beyond 3 URLs** (sampled country, content, calculator, invest, a selected
   shop page). Keep `npm run a11y` manual; expand the URL list. **Charter:** §6.11 keeps the honesty
   expectation; no guardrail loosens.

5. **Add axe-core assertions inside the existing Playwright `e2e` job** against the same URLs pa11y
   covers, gated as informational-first, blocking later if stable. **Charter:** respects §4 Autonomy
   Contract (plan-first for non-trivial).

6. **Record a Lighthouse baseline for the current `main` build.** Dispatch `lighthouse.yml` or run
   LHCI locally, attach the report URLs, update `docs/performance-baseline.json` if applicable.
   **Charter:** §6.11.

7. **`npm audit` snapshot in the audit doc.** Refresh this file with a dated advisory table so the
   health statement is time-stamped rather than "current majors."

### P2 — polish

8. **README polish pass.** Screenshots, tech-stack section, deploy section, explicit env-var table
   pointing to `docs/environment-variables.md`.

9. **Service-worker registration sweep.** Confirm which entry pages register `sw.js` and document
   the decision for ones that don't.

10. **Dependabot / scheduled advisory review.** Light automation only; no version-bump PRs opened
    here.

---

## K. Out of scope (explicitly)

By design, this PR does **not**:

- Edit any HTML, CSS, JS, or Python source.
- Change any workflow (`post_gold.yml`, `ci.yml`, `deploy.yml`, etc.).
- Modify `CNAME`, `robots.txt`, `manifest.json`, or any SEO tag in any page.
- Touch any `docs/*.md` other than adding this single new file.
- Bump any dependency.
- Open any plan PR. Each P0/P1 candidate above, if approved, becomes its own
  `docs/plans/YYYY-MM-DD_<slug>.md` + draft PR per §4.3.

---

## L. Next step for the owner

Pick zero or more P0 items. For each chosen item, I will open a **separate plan PR** with a concrete
file-level scope, success criteria, rollback plan, and charter-compliance checklist before any
implementation PR touches code. The campaign stays plan-first.
