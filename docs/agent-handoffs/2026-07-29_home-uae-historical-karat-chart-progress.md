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
- **Playwright evidence:** 13 screenshots in `reports/screenshots/uae-hist-chart/` (EN/AR, mobile,
  ranges, tooltip, loading, stale, error/retry, legend, lang switch).
- **Tests:** 1717 unit tests; 13/13 Playwright chart spec (chromium).

## Owner action for live dataset bootstrap

`GOLD_API_KEY` exists in GitHub Actions (workflow keycheck passed). After merge or on branch:

1. Actions → **Historical Gold Refresh** → Run workflow
2. Set **bootstrap_branch** = `true` to commit live `data/historical/xau-usd-daily.json` to this
   branch (one-time bootstrap)
3. Verify artifact + `node scripts/node/fetch-gold-api-history.mjs --check`

## Verification run (latest)

- `npm test` — 1717 pass
- `npm run lint` / `validate` / `build` / `quality` / `check-links` — pass
- `npm run a11y` — fails on pre-existing `shops.html` contrast (not chart-related)
- Playwright `home-uae-hist-chart.spec.js` — 13/13 pass (chromium)

## Remaining before ready-for-review

- Historical Gold Refresh workflow green on PR (parser fix pushed; awaiting CI)
- Live `xau-usd-daily.json` from gold-api.com (owner workflow_dispatch bootstrap or post-merge
  schedule)
- Full Playwright matrix in CI (firefox/webkit) — project default
