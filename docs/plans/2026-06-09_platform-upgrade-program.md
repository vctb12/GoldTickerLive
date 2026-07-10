# Platform Upgrade Program — Gold Ticker Live

```yaml
plan-status:
  status: active
  priority: P1
  class: hygiene + data-integrity + quality-gates + seo
  owner: '@vctb12'
  created: '2026-06-09'
  last_updated: '2026-06-09'
  canonical_pr_fix_first: 'https://github.com/vctb12/GoldTickerLive/pull/421'
  bootstrap_source: 'Cursor Upgrade Prompt (2026-06-09 session)'
  next_recommended_task: 'T0.3 — secret scanning + push protection (Settings + docs note)'
```

> **How to use this plan:** Run **one task at a time**. Paste the **Session prompt** for that task
> into Cursor Composer / Agent. `@` mention the matching file in `.github/prompts/` when listed.
> Read [`AGENTS.md`](../../AGENTS.md) and [`PLAN.md`](../../PLAN.md) before every session.

**Entry point (copy-paste bootstrap):**
[`prompts/platform-upgrade.md`](../../prompts/platform-upgrade.md)

---

## Table of contents

1. [Stack truth (verified 2026-06-09)](#1-stack-truth-verified-2026-06-09)
2. [Operating rules](#2-operating-rules)
3. [Progress registry](#3-progress-registry)
4. [Fix-first — F1 & F2](#4-fix-first--f1--f2)
5. [Phase 0 — Hygiene & hardening](#5-phase-0--hygiene--hardening)
6. [Phase 1 — Data integrity](#6-phase-1--data-integrity)
7. [Phase 2 — Quality gates in CI](#7-phase-2--quality-gates-in-ci)
8. [Phase 3 — Structured data / SEO](#8-phase-3--structured-data--seo)
9. [Phase 4 — Charting (optional)](#9-phase-4--charting-optional)
10. [Definition of done (every task)](#10-definition-of-done-every-task)
11. [Prompt file index](#11-prompt-file-index)

---

## 1. Stack truth (verified 2026-06-09)

| Topic                  | Actual state                                                                                      | Stale docs may say              |
| ---------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------- |
| Node                   | **24** (`.nvmrc`)                                                                                 | 22                              |
| Front-end              | Vanilla ES modules, Vite 8, static MPA                                                            | —                               |
| Runtime deps           | **Yes** — `express`, `lightweight-charts`, etc. (`package.json`)                                  | Zero runtime deps               |
| Tests                  | **~1112** cases, 132 `tests/*.test.js` files                                                      | 205 tests                       |
| Workflows              | **24** under `.github/workflows/`                                                                 | 8 workflows                     |
| Playwright config      | `playwright.config.js`                                                                            | `playwright.config.yml`         |
| Primary gold source    | **gold-api.com** (`gold_api_com`) via `gold-price-fetch.yml` → `data/gold_price.json`             | goldpricez.com                  |
| Client live lane       | Parallel race: `gold-api.com` + `mintedmetal.com` (`src/lib/quote-providers/create-providers.js`) | Direct goldpricez fetch         |
| FX                     | `open.er-api.com`; AED peg **3.6725** fixed                                                       | —                               |
| License                | **Apache-2.0** (`LICENSE`)                                                                        | MIT (README — fixed in PR #421) |
| Charts                 | **lightweight-charts** already in `src/components/chart.js`                                       | Custom-only chart               |
| CodeQL                 | `.github/workflows/codeql.yml` exists                                                             | Not implemented                 |
| Lighthouse             | `.github/workflows/lighthouse.yml` + `lighthouserc.json` (warn-only)                              | Not implemented                 |
| Dependabot             | `.github/dependabot.yml` (npm, actions, pip)                                                      | Not implemented                 |
| JSON-LD                | `scripts/node/inject-schema.js` (partial)                                                         | Not implemented                 |
| Historical freegoldapi | `src/lib/freegoldapi.js` + Layer 2 in `historical-data.js`                                        | Not implemented                 |

**Production provider chain** (do not change without bakeoff):

```text
GOLD_PROVIDER_ORDER=gold_api_com,twelvedata_xauusd,fmp_gcusd
```

Files: `.github/workflows/gold-price-fetch.yml`, `data/gold_price.json`.

---

## 2. Operating rules

1. **Read before you edit** — open impacted files; cite `file:line` in the plan PR.
2. **Plan before you build** — restate task → impacted files → numbered plan → **wait for approval**
   (owner sessions) or document plan in PR body (autonomous agents).
3. **One task = one branch = one PR** — branch template: `cursor/<slug>-131d`.
4. **Smallest correct solution** — no drive-by refactors.
5. **Bilingual EN/AR** — user-visible strings in `src/config/translations.js`.
6. **Trust primitives sacred** — reference ≠ retail; freshness labels mandatory.
7. **Immutable constants** — AED peg `3.6725`, troy oz, karat factors in `src/config/karats.js`.
8. **Production-critical** — do not modify `post_gold.yml`, `gold-price-fetch.yml`,
   `data/gold_price.json`, `sw.js`, `src/config/constants.js` without explicit approval.
9. **Verified vs unverified** — state what you ran (`npm test`, `validate`, etc.).

---

## 3. Progress registry

| ID   | Task                                           | Status                 | PR / evidence                                             |
| ---- | ---------------------------------------------- | ---------------------- | --------------------------------------------------------- |
| F1   | License consistency                            | ✅ Done                | [#421](https://github.com/vctb12/GoldTickerLive/pull/421) |
| F2   | Source-of-truth docs (gold-api.com)            | ✅ Done (core + sweep) | [#421](https://github.com/vctb12/GoldTickerLive/pull/421) |
| F2b  | Archival bakeoff docs still mention GoldPriceZ | ⬜ Optional            | Historical context — update only if confusing             |
| T0.1 | Dependabot grouped (npm, actions, pip)         | ✅ Done                | [#421](https://github.com/vctb12/GoldTickerLive/pull/421) |
| T0.2 | CodeQL scanning                                | ✅ Exists              | `.github/workflows/codeql.yml`                            |
| T0.3 | Secret scanning + push protection              | ⬜ Pending             | GitHub Settings + `docs/` note                            |
| T1.1 | Secondary gold + cross-validation              | ⬜ Pending             | —                                                         |
| T1.2 | Historical freegoldapi enrichment              | 🟡 Mostly done         | `src/lib/freegoldapi.js` — gap-fill only if needed        |
| T2.1 | Lighthouse CI budget merge gate                | 🟡 Partial             | `lighthouse.yml` warn-only; no `budget.json`              |
| T2.2 | axe-core in Playwright                         | ⬜ Pending             | —                                                         |
| T3.1 | JSON-LD complete + validate                    | 🟡 Partial             | `inject-schema.js` — validate all types                   |
| T3.2 | Sitemap coverage (28 seo-audit gaps)           | ⬜ Pending             | `npm run seo-audit`                                       |
| T4.1 | lightweight-charts                             | ✅ Done                | `src/components/chart.js`                                 |

---

## 4. Fix-first — F1 & F2

### F1 — License consistency ✅

| Item           | Before           | After                     |
| -------------- | ---------------- | ------------------------- |
| `LICENSE`      | Apache-2.0       | unchanged                 |
| `README.md`    | MIT badge/footer | Apache-2.0                |
| `package.json` | no field         | `"license": "Apache-2.0"` |

**Rollback:** Revert PR #421 license commits.

---

### F2 — Price-source drift ✅

**Wiring truth (unchanged):** gold-api.com primary; GoldPriceZ legacy adapter only.

**Aligned surfaces:** `DATA_ATTRIBUTION`, `translations.js`, homepage/methodology/tracker/terms,
README, ARCHITECTURE, TEARDOWN, CURSOR_HANDOVER, ops docs, script comments.

**Remaining (optional):** `docs/gold-*-provider-*.md`, `docs/plans/*` bakeoff archives.

#### Session prompt — F2b archival doc sweep (optional)

```markdown
@AGENTS.md @PLAN.md @docs/plans/2026-06-09_platform-upgrade-program.md
@.github/prompts/platform-upgrade-f2-archival-docs.prompt.md

Task: F2b — Archival doc clarity pass (optional).

Goal: Add a one-line "historical context" banner to bakeoff/migration docs that still center
GoldPriceZ so agents do not treat them as current production truth. Do NOT rewrite history or change
provider wiring.

Read: docs/gold-price-provider-migration.md, docs/gold-api-provider-evaluation.md,
docs/operator-inputs-gold-provider-bakeoff.md

Plan → wait for approval → implement smallest diff (banner + link to data-source-methodology.md).

Verify: npm test, npm run lint. No changes to workflows or data/gold_price.json.
```

**Prompt file:** `.github/prompts/platform-upgrade-f2-archival-docs.prompt.md`

---

## 5. Phase 0 — Hygiene & hardening

### T0.1 — Dependabot grouped ✅

- **Files:** `.github/dependabot.yml` (npm, github-actions, pip)
- **Verify:** GitHub → Insights → Dependabot; grouped PRs appear weekly.

---

### T0.2 — CodeQL ✅

- **Files:** `.github/workflows/codeql.yml`
- **Note:** Informational gate; alerts triaged in Security tab.

---

### T0.3 — Secret scanning + push protection ⬜

**Cannot be enabled from code alone** — requires GitHub repo Settings.

| Step | Action                                                                                |
| ---- | ------------------------------------------------------------------------------------- |
| 1    | Settings → Code security → Secret scanning → Enable                                   |
| 2    | Settings → Code security → Push protection → Enable                                   |
| 3    | Document in `docs/SECURITY.md` or `docs/environment-variables.md`                     |
| 4    | If historical exposure suspected, note follow-up in `docs/` (no secret values in git) |

**Secrets inventory (names only):** `GOLD_API_COM_KEY`, `GOLDPRICEZ_API_KEY`, `TWELVEDATA_*`,
`FMP_*`, Twitter (`CONSUMER_*`, `ACCESS_*`), Telegram, Discord, Supabase.

#### Session prompt — T0.3

```markdown
@AGENTS.md @docs/plans/2026-06-09_platform-upgrade-program.md
@.github/prompts/platform-upgrade-t03-secrets.prompt.md @docs/environment-variables.md

Task: T0.3 — Secret scanning documentation + verification checklist.

I will enable secret scanning and push protection in GitHub Settings manually. Your job:

1. Add `docs/SECURITY.md` (or extend environment-variables.md) with:
   - How to enable secret scanning + push protection
   - List of secret _names_ (never values) used by this repo
   - What to do if push protection blocks a commit
   - Link to GitHub docs
2. Add a short row to `docs/CURSOR_HANDOVER.md` §2 confirming the Settings steps.
3. Do NOT echo any secret values.

Plan → implement → verify docs links. No workflow changes unless adding a non-blocking reminder in
CI (optional, ask first).
```

**Prompt file:** `.github/prompts/platform-upgrade-t03-secrets.prompt.md`

---

## 6. Phase 1 — Data integrity

### T1.1 — Secondary gold source + cross-validation ⬜

**Goal:** Add client-side secondary validation without rewriting `api.js`. If primary and secondary
diverge beyond threshold, surface correct freshness label.

| Item       | Detail                                                                   |
| ---------- | ------------------------------------------------------------------------ |
| Candidates | `freegoldapi.com` (no key, CORS), existing `quote-providers/*`           |
| Files      | `src/lib/quote-providers/`, `src/config/constants.js` (threshold), tests |
| Verify     | `?debug=true` simulate primary fail; `npm test`                          |
| Risk       | Third-party feed = reference/derived — label correctly                   |
| Tradeoff   | Extra lazy fetch paths only                                              |

**Do not** change `GOLD_PROVIDER_ORDER` in `gold-price-fetch.yml` in the same PR.

#### Session prompt — T1.1

```markdown
@AGENTS.md @docs/plans/2026-06-09_platform-upgrade-program.md
@.github/prompts/platform-upgrade-t11-secondary-gold.prompt.md
@.github/instructions/gold-pricing.instructions.md @src/lib/quote-providers/create-providers.js
@src/lib/api.js

Task: T1.1 — Secondary gold source with cross-validation (client lane only).

Restate task in one sentence. Read create-providers.js, api.js, freshness vocabulary in
live-status.js.

Plan (wait for approval):

- Add optional secondary spot check (e.g. freegoldapi or existing adapter) LAZY — not on every poll.
- Configurable divergence threshold in constants (or quote-providers config).
- If divergence > threshold, freshness label reflects delayed/estimated — never present as
  authoritative live.
- Tests for threshold logic and label mapping.
- Do NOT rewrite api.js; extend provider chain only.
- Do NOT touch gold-price-fetch.yml or data/gold_price.json.

Verify: npm test, npm run validate, debug panel primary-fail simulation. PR body: What / Why / How /
Proof / Risks. Bilingual if any new UI strings.
```

**Prompt file:** `.github/prompts/platform-upgrade-t11-secondary-gold.prompt.md`

---

### T1.2 — Historical archive enrichment 🟡

**Status:** Layer 2 (`freegoldapi.com`) exists in `src/lib/freegoldapi.js` + `historical-data.js`.

**Gap-fill only if:** export/archive views lack expected date range or labels wrong.

#### Session prompt — T1.2 gap-fill

```markdown
@AGENTS.md @docs/plans/2026-06-09_platform-upgrade-program.md
@.github/prompts/platform-upgrade-t12-historical.prompt.md @src/lib/historical-data.js
@src/lib/freegoldapi.js @src/lib/export.js

Task: T1.2 — Historical archive gap-fill (only if evidence of missing coverage).

1. Run tracker Archive mode + export CSV/JSON locally.
2. Document current date range and labels (freegoldapi-reference vs LBMA-baseline).
3. If gaps exist, extend merge logic only — label "Historical baseline" / "derived".
4. If already sufficient, close task in PLAN.md with evidence — no code change.

Verify: npm test, manual archive screenshot, export file sample in PR.
```

**Prompt file:** `.github/prompts/platform-upgrade-t12-historical.prompt.md`

---

## 7. Phase 2 — Quality gates in CI

### T2.1 — Lighthouse CI budget gate 🟡

**Current:** `lighthouse.yml` + `lighthouserc.json` — assertions are **warn** only (0.75–0.9).

| Item   | Detail                                                                    |
| ------ | ------------------------------------------------------------------------- |
| Add    | `budget.json` resource budgets                                            |
| Tune   | Thresholds from `phase0-lighthouse-baseline.yml` output                   |
| Decide | Merge gate vs informational (recommend: warn first PR, tighten second)    |
| URLs   | `/`, `/tracker.html`, `/calculator.html`, `/shops.html`, one country page |

#### Session prompt — T2.1

```markdown
@AGENTS.md @docs/plans/2026-06-09_platform-upgrade-program.md
@.github/prompts/platform-upgrade-t21-lighthouse.prompt.md @.github/workflows/lighthouse.yml
@lighthouserc.json @.github/workflows/phase0-lighthouse-baseline.yml

Task: T2.1 — Lighthouse CI budget gate.

1. Run phase0 baseline or read existing baseline artifacts in docs/.
2. Add budget.json with resource-size budgets from current dist/ build.
3. Update lighthouserc.json assertions from warn → error for SEO/a11y/best-practices first;
   performance warn until stable.
4. Ensure lighthouse.yml builds dist/ and runs LHCI against staticDistDir or preview URL.
5. Document thresholds in PR — do not block legitimate PRs on first land.

Verify: workflow_dispatch on test branch; deliberately oversize asset in branch to confirm fail
(then revert).

Do not change post_gold.yml or production fetch paths.
```

**Prompt file:** `.github/prompts/platform-upgrade-t21-lighthouse.prompt.md`

---

### T2.2 — Accessibility assertions in Playwright ⬜

| Item | Detail                                           |
| ---- | ------------------------------------------------ |
| Add  | `@axe-core/playwright` devDependency             |
| Scan | home, tracker, calculator, one country page      |
| Tags | `wcag2a`, `wcag2aa`, `wcag21aa`                  |
| Note | Automated a11y ≠ full WCAG; document manual gaps |

#### Session prompt — T2.2

```markdown
@AGENTS.md @docs/plans/2026-06-09_platform-upgrade-program.md
@.github/prompts/platform-upgrade-t22-a11y-playwright.prompt.md @playwright.config.js @tests/e2e/

Task: T2.2 — axe-core Playwright assertions.

Plan → approval:

- Add @axe-core/playwright (check GitHub Advisory DB first).
- New spec: tests/e2e/a11y.spec.js scanning key URLs with wcag2a/2aa/21aa.
- Wire into ci.yml e2e job if runtime acceptable; else document local command.
- Fix violations found OR document in reports/a11y-audit.md with issue links — do not blanket
  suppress rules.

Verify: npx playwright test tests/e2e/a11y.spec.js, npm test, npm run lint. RTL: include calculator
or country page with dir=rtl if feasible.
```

**Prompt file:** `.github/prompts/platform-upgrade-t22-a11y-playwright.prompt.md`

---

## 8. Phase 3 — Structured data / SEO

### T3.1 — JSON-LD complete + validate 🟡

**Current:** `scripts/node/inject-schema.js` — Organization, WebSite, BreadcrumbList, FAQPage,
Dataset.

| Item     | Detail                                                     |
| -------- | ---------------------------------------------------------- |
| Path A   | Hand-author / extend inject-schema.js (preferred)          |
| Validate | Google Rich Results Test, Schema Markup Validator per type |
| CI       | `inject-schema.js --check` already in validate             |

#### Session prompt — T3.1

```markdown
@AGENTS.md @docs/plans/2026-06-09_platform-upgrade-program.md
@.github/prompts/platform-upgrade-t31-jsonld.prompt.md @scripts/node/inject-schema.js
@docs/SEO_CHECKLIST.md

Task: T3.1 — JSON-LD structured data validation pass.

1. Inventory which page types lack required schema (homepage, tracker, calculator, FAQ, country,
   methodology).
2. Extend inject-schema.js only where gaps exist — Path A (no schema-dts unless owner requests).
3. Run inject-schema.js --check and npm run validate.
4. Document validator URLs and pass/fail per schema type in PR (screenshots or checklist).

Do not change canonical URLs or noindex without seo-governance prompt. EN+AR: schema
name/description where localized pages exist.
```

**Prompt file:** `.github/prompts/platform-upgrade-t31-jsonld.prompt.md`

---

### T3.2 — Sitemap coverage (28 gaps) ⬜

**Evidence:** `npm run seo-audit` reports pages not in sitemap.

#### Session prompt — T3.2

```markdown
@AGENTS.md @docs/plans/2026-06-09_platform-upgrade-program.md
@.github/prompts/platform-upgrade-t32-sitemap.prompt.md
@.github/prompts/seo-noindex-governance.prompt.md @build/generateSitemap.js
@scripts/node/generate-sitemap.js

Task: T3.2 — Sitemap coverage cleanup.

1. Run npm run seo-audit; save full list of 28 gaps.
2. Classify each: should index (add to sitemap) vs should noindex (stub/legacy) per SEO governance.
3. Implement smallest fix — usually sitemap generator allowlist or noindex meta on stubs.
4. Re-run seo-audit until gaps are intentional and documented.

Do not delete country pages. No silent canonical changes.
```

**Prompt file:** `.github/prompts/platform-upgrade-t32-sitemap.prompt.md`

---

## 9. Phase 4 — Charting (optional)

### T4.1 — lightweight-charts ✅

**Done:** `package.json` dependency + `src/components/chart.js` with TradingView attribution.

**No further work** unless chart UX bugs filed.

---

## 10. Definition of done (every task)

- [ ] Plan approved (or documented in PR for autonomous runs)
- [ ] Smallest correct diff; no unrequested refactors
- [ ] Bilingual EN/AR if user-visible copy changed
- [ ] Trust primitives untouched (reference ≠ retail, freshness labels)
- [ ] `npm test` green; new logic has tests
- [ ] `npm run build && npm run validate` green
- [ ] `npm run preflight` + `npm run seo-audit` reported
- [ ] Before/after screenshots for UI changes (desktop + 360px RTL)
- [ ] PR body: What / Why / How / Proof / Risks / rollback

---

## 11. Prompt file index

| Task                  | @-mention prompt                                                  |
| --------------------- | ----------------------------------------------------------------- |
| Bootstrap / pick next | `@.github/prompts/platform-upgrade-bootstrap.prompt.md`           |
| F2b archival docs     | `@.github/prompts/platform-upgrade-f2-archival-docs.prompt.md`    |
| T0.3 secrets          | `@.github/prompts/platform-upgrade-t03-secrets.prompt.md`         |
| T1.1 secondary gold   | `@.github/prompts/platform-upgrade-t11-secondary-gold.prompt.md`  |
| T1.2 historical       | `@.github/prompts/platform-upgrade-t12-historical.prompt.md`      |
| T2.1 Lighthouse       | `@.github/prompts/platform-upgrade-t21-lighthouse.prompt.md`      |
| T2.2 axe Playwright   | `@.github/prompts/platform-upgrade-t22-a11y-playwright.prompt.md` |
| T3.1 JSON-LD          | `@.github/prompts/platform-upgrade-t31-jsonld.prompt.md`          |
| T3.2 Sitemap          | `@.github/prompts/platform-upgrade-t32-sitemap.prompt.md`         |

**Human entry:** [`prompts/platform-upgrade.md`](../../prompts/platform-upgrade.md)

---

## Reconciliation

When a task ships, update:

1. This file — progress registry row
2. [`PLAN.md`](../../PLAN.md) — active queue
3. [`docs/plans/README.md`](./README.md) — proposal table
4. [`docs/REVAMP_PLAN.md`](../REVAMP_PLAN.md) — if track-level note needed
