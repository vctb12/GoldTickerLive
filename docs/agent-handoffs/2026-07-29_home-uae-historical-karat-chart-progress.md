# Handoff: UAE Historical Karat Chart — gold-api.com daily pipeline

**Date:** 2026-07-29  
**Branch:** `cursor/home-uae-historical-karat-chart-6a31`  
**PR:** [#714](https://github.com/vctb12/GoldTickerLive/pull/714) (draft)

## Completed this session

- **Parser fix:** gold-api.com `/history` returns `{ day, avg_price }` per official `llms.txt` — not
  `{ timestamp, avg }`. CI was rejecting all 400 live rows (`no_records`).
- **`allowStale` display path:** `uae-historical-source.js` accepts aged committed files for UI
  disclosure while fetch/CI remain strict.
- **Workflow:** `historical-gold-refresh.yml` uses official fixture on PR without secret; optional
  `workflow_dispatch` input `bootstrap_branch=true` commits live refresh to current branch.
- **Live dataset committed:** `data/historical/xau-usd-daily.json` bootstrapped from CI artifact
  (run `30465923073`) — 400 records, coverage `2025-06-25` → `2026-07-29`, `calendarAgeDays: 0`.
- **Playwright evidence:** 20 screenshots in `reports/screenshots/uae-hist-chart/` (EN/AR,
  light/dark, mobile, ranges, tooltip, loading, stale, error/retry, legend, lang switch).
- **Tests:** 1717 unit tests (1 pre-existing SEO canonical failure unrelated to chart); 13/13
  Playwright chart spec (chromium).

## Secret status

`GOLD_API_KEY` is configured in GitHub Actions (workflow keycheck passed). Not available in Cursor
cloud env. Daily schedule will refresh after merge.

## Verification run (latest)

- `npm test` — 1717 pass
- `npm run lint` / `validate` / `build` / `quality` / `check-links` — pass
- `npm run a11y` — fails on pre-existing `shops.html` contrast (not chart-related)
- Playwright `home-uae-hist-chart.spec.js` — 13/13 pass (chromium)

## CI status (latest push)

- **All PR checks green** including Audit assets/Playwright, Historical Gold Refresh, CodeQL,
  Lighthouse, Build + audit links, Readiness gate
- Historical workflow on live data: 400 records, `rejected: 0`, artifact uploaded

## Remaining before ready-for-review

- `npm run a11y` — pre-existing `shops.html` contrast + tracker anchor warnings (not introduced by
  this PR; not in CI gate). Chart-specific surfaces pass Playwright a11y interactions.
- Cross-validation: CI reported `comparison_source_unavailable` (FreeGoldAPI blocked on runner)
