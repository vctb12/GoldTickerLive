# UAE Historical Karat Chart — Final Independent Review (2026-07-29)

**PR:** [#714](https://github.com/vctb12/GoldTickerLive/pull/714)  
**Branch:** `cursor/home-uae-historical-karat-chart-6a31`  
**Head at review:** `7390ed746e` (post bot-commit proof)

## Reviewer A — Product / data correctness

| Severity | File | Issue                              | Impact | Resolution                                                                                                                                                                                                | Commit |
| -------- | ---- | ---------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| —        | —    | No unresolved high/medium findings | —      | Chart formulas use canonical AED peg 3.6725, troy 31.1034768, karat factors from `karats.js`; daily-average reference disclaimer present; EN/AR parity via translations; RTL covered in Playwright matrix | —      |

**Verified:** Table/chart/CSV share `uae-historical-karat-data.js`; freshness states
(loading/stale/unavailable) tested; production dataset `dataOrigin: live-provider`, 400 records,
2025-06-25 → 2026-07-29.

## Reviewer B — Security / workflows / provenance

| Severity | File                                                         | Issue                                     | Impact                           | Resolution                                                                                          | Commit       |
| -------- | ------------------------------------------------------------ | ----------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- | ------------ |
| —        | `.github/workflows/historical-gold-refresh.yml`              | Temporary feature-branch push trigger     | Medium (secret on arbitrary ref) | Removed after bot-commit proof run `30473279767`; final workflow is `main` + schedule/dispatch only | `7390ed746e` |
| —        | `scripts/node/cross-validate-gold-api-history.mjs`           | FreeGoldAPI parser expected `data.prices` | High (false `no_overlap`)        | Fixed top-level array + `yahoo_finance` filter; 10 numeric overlap rows                             | `ed78129a7c` |
| —        | `scripts/node/cross-validate-gold-api-history.mjs`           | Hard-coded World Bank constants           | Medium (unproven QA)             | Replaced with fixture `tests/fixtures/world-bank/pink-sheet-gold-monthly-2025.json`                 | `ed78129a7c` |
| —        | `public/sitemap.xml`                                         | `playwright-report/` indexed              | High (SEO leakage)               | Generator exclusions + regression test                                                              | `ed78129a7c` |
| —        | `src/lib/historical-data.js`, `export.js`, `tracker-pro.css` | Global baseline label migration           | Medium (scope creep)             | Reverted to `origin/main` — out of PR scope                                                         | `ed78129a7c` |
| Low      | `package.json`                                               | `pa11y-ci` added                          | Low                              | Pre-existing `npm run a11y` script lacked declared dependency; repair documented                    | PR baseline  |
| Low      | Workflow dispatch on `main`                                  | Requires merge before manual dispatch     | Info                             | Documented in workflow header; GitHub only exposes default-branch workflows                         | `ed78129a7c` |

**Bot-commit proof:** Workflow run
[30473279767](https://github.com/vctb12/GoldTickerLive/actions/runs/30473279767) — fetch 400/400,
tests pass, bot commit `f00894dff0` pushed without artifact fallback. Regression test
`tests/historical-gold-bot-commit.test.js` proves staged-diff fix.

**Trusted-collaborator assumption:** Repository secrets available to workflows on trusted branches;
no protected GitHub Environment configured for `GOLD_API_KEY` in this repo — documented honestly.

## Cross-validation snapshot (QA only)

| Date       | gold-api avg | FreeGoldAPI | Source        | % diff | Result |
| ---------- | ------------ | ----------- | ------------- | ------ | ------ |
| 2025-06-25 | 3332.55      | 3327.10     | yahoo_finance | 0.16%  | pass   |
| 2025-07-17 | 3335.77      | 3340.10     | yahoo_finance | 0.13%  | pass   |
| 2025-08-08 | 3395.26      | 3439.10     | yahoo_finance | 1.27%  | pass   |
| 2025-09-02 | 3503.97      | 3549.40     | yahoo_finance | 1.28%  | pass   |
| 2025-09-24 | 3756.11      | 3732.10     | yahoo_finance | 0.64%  | pass   |
| 2025-10-16 | 4263.40      | 4280.20     | yahoo_finance | 0.39%  | pass   |
| 2025-11-07 | 4001.41      | 3999.40     | yahoo_finance | 0.05%  | pass   |
| 2025-12-02 | 4207.73      | 4186.60     | yahoo_finance | 0.50%  | pass   |
| 2025-12-24 | 4488.97      | 4480.60     | yahoo_finance | 0.19%  | pass   |
| 2026-01-20 | 4726.03      | 4759.60     | yahoo_finance | 0.71%  | pass   |

_Secondary consistency check; sources may not be statistically independent if both trace to Yahoo
Finance._

## Verdict

**No unresolved high or medium findings remain.** Ready for human review.
