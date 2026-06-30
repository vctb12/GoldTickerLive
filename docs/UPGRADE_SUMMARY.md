# Platform Upgrade Summary

Handoff doc for the 2026-06-09 Platform Upgrade Program. See the full plan at
[`docs/plans/2026-06-09_platform-upgrade-program.md`](./plans/2026-06-09_platform-upgrade-program.md).

---

## What shipped

### Fix-first (F1, F2, F2b)

| Task                   | What changed                                                                                                                                                                                                | Landed       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| F1 — License           | `README.md` badge + footer corrected from MIT → Apache-2.0; `package.json` `"license"` field added                                                                                                          | PR #421      |
| F2 — Source docs       | `DATA_ATTRIBUTION`, `translations.js`, homepage/methodology/tracker/terms, README, ARCHITECTURE, ops docs all aligned to gold-api.com as primary                                                            | PR #421      |
| F2b — Archival clarity | Historical-context banner added to `docs/gold-price-provider-migration.md` and `docs/operator-inputs-gold-provider-bakeoff.md` so agent sessions don't treat stale bakeoff docs as current production truth | This session |

### Phase 0 — Hygiene & hardening

| Task                   | What changed                                                                                                                           | Landed       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| T0.1 — Dependabot      | `.github/dependabot.yml` — grouped weekly updates for npm, github-actions, pip                                                         | PR #421      |
| T0.2 — CodeQL          | `.github/workflows/codeql.yml` already present; confirmed informational gate                                                           | Existing     |
| T0.3 — Secret scanning | `docs/SECURITY.md` added: secrets inventory (names only), enable steps, push protection bypass procedure, emergency rotation checklist | This session |

### Phase 2 — Quality gates in CI

| Task                      | What changed                                                                                                                                                                                                                 | Landed       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| T2.1 — Lighthouse budgets | `budget.json` created with per-resource-type budgets (script 600 KB, stylesheet 400 KB, total 1800 KB); `lighthouserc.json` updated to reference it; accessibility, best-practices, SEO raised from `warn` → `error` at 0.90 | This session |

### Phase 3 — Structured data / SEO

| Task                    | What changed                                                                                                                                                                                                                    | Landed       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| T3.1 — JSON-LD complete | `scripts/node/inject-schema.js` updated: `tracker.html` and `compare.html` now get `WebApplication` JSON-LD schemas (FinanceApplication category, featureList, inLanguage, offers, publisher). Schema injected into both pages. | This session |

---

## Still pending

| Task                                     | Notes                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| T0.3 — Push protection (runtime)         | Cannot enable from code. Requires GitHub Settings → Code security → Secret scanning + Push protection → Enable. Steps are in `docs/SECURITY.md`. |
| T1.1 — Secondary gold + cross-validation | Provider bakeoff for secondary failover. Needs owner decision on target provider.                                                                |
| T2.2 — axe-core in Playwright            | Automated accessibility assertions in e2e suite. Zero Playwright e2e failures today; this extends coverage.                                      |
| T3.2 — Sitemap coverage gaps             | `npm run seo-audit` surfaces 28 pages with missing/wrong sitemap entries. Fix requires per-page review.                                          |

---

## Production provider chain (do not change without bakeoff)

```
GOLD_PROVIDER_ORDER=gold_api_com,twelvedata_xauusd,fmp_gcusd
```

Files: `.github/workflows/gold-price-fetch.yml`, `data/gold_price.json`.

AED peg: **3.6725** (immutable, set by UAE Central Bank). Troy oz: **31.1034768 g** (immutable
physical constant).

---

## Key constants & files

| What                            | Where                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| AED peg, troy oz, karat factors | `src/config/constants.js`, `src/config/karats.js`                                                   |
| Primary gold data file          | `data/gold_price.json`                                                                              |
| Production fetch workflow       | `.github/workflows/gold-price-fetch.yml`                                                            |
| Gold posting workflow           | `.github/workflows/post_gold.yml`                                                                   |
| Translation strings             | `src/config/translations.js`                                                                        |
| JSON-LD schema injector         | `scripts/node/inject-schema.js`                                                                     |
| Lighthouse config               | `lighthouserc.json`, `budget.json`                                                                  |
| Secret scanning docs            | `docs/SECURITY.md`                                                                                  |
| Provider migration history      | `docs/gold-price-provider-migration.md` (archived — add "historical context" banner before quoting) |

---

## Verification record (this session)

- `npm test` — 1270/1273 passing (3 pre-existing failures, unchanged)
- `npm run validate` — 0 errors
- `npm run lint` — 0 errors
- `node scripts/node/inject-schema.js` — schemas injected into tracker.html and compare.html
