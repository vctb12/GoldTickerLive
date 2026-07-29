# Handoff: UAE Historical Karat Chart — gold-api.com daily pipeline

**Date:** 2026-07-29  
**Branch:** `cursor/home-uae-historical-karat-chart-6a31`  
**PR:** [#714](https://github.com/vctb12/GoldTickerLive/pull/714) (draft)

## Completed this session

- Added `src/lib/gold-api-daily-history-contract.js` — centralized validation thresholds
- Added `scripts/node/fetch-gold-api-history.mjs` — gold-api.com `/history` fetch + QA cross-check
- Added `.github/workflows/historical-gold-refresh.yml` — daily refresh (does not touch live fetch)
- Added `src/lib/uae-historical-source.js` — homepage chart loads `data/historical/xau-usd-daily.json`
- Refactored chart off `getUnifiedHistory()` / FreeGoldAPI / embedded monthly baseline
- Updated EN/AR copy for daily-average reference wording
- Tests: `tests/fetch-gold-api-history.test.js`, `tests/uae-historical-source.test.js`
- Installed `pa11y-ci` (was referenced but missing from devDependencies)
- Bootstrap dataset committed at `data/historical/xau-usd-daily.json` (replace via workflow when `GOLD_API_KEY` available)

## Owner action if dataset not yet live

1. Sign up: https://gold-api.com/
2. Add secret **`GOLD_API_KEY`** at GitHub → Settings → Secrets and variables → Actions
3. Run **Historical Gold Refresh** workflow (`workflow_dispatch`)
4. Verify: `node scripts/node/fetch-gold-api-history.mjs --check` on committed JSON

## Verification run

- `npm test` — 1715 pass
- `npm run lint` — pass
- `npm run validate` — pass
- `npm run build` — pass
- Playwright `home-uae-hist-chart.spec.js` — 7/7 pass (chromium); firefox/webkit need browser install in CI
