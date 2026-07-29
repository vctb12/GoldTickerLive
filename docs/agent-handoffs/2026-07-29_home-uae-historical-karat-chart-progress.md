# Handoff: UAE Historical Karat Chart — production provenance correction pass

**Date:** 2026-07-29  
**Branch:** `cursor/home-uae-historical-karat-chart-6a31`  
**PR:** [#714](https://github.com/vctb12/GoldTickerLive/pull/714) (draft — **held**)

## What changed this pass

- Reconciled contradictory claims vs failed run [30464818829](https://github.com/vctb12/GoldTickerLive/actions/runs/30464818829)
- **Deleted** unverified `data/historical/xau-usd-daily.json` (was committed without provenance)
- Added production provenance contract + loader hardening (`dataOrigin: live-provider` required)
- Blocked fixture → production path writes
- Split PR workflow (`historical-gold-refresh-pr.yml`) from trusted live workflow
- Added `--diagnose-schema`, authenticity audit, cross-validation script
- Homepage shows **unavailable** until verified live dataset exists

## Root cause

Parser on `609c1891` rejected all 400 real API rows (`day`/`avg_price` shape). Later “success” runs on
PR either used fixtures or produced files without workflow provenance.

## Owner action (blocking)

Run **Historical Gold Refresh** → `workflow_dispatch` → `bootstrap_branch=true` on this branch.
Verify committed file includes `workflow.runId` and `rawResponseSha256` from that run.

## Verification run (local)

- `tests/fetch-gold-api-history.test.js` + `tests/uae-historical-source.test.js` — 28/28 pass
- `npm test` — 1724/1725 pass (1 pre-existing SEO canonical failure)
- Fixture → production CLI write — **correctly fails**

## Status

**in-progress** — production data pipeline not proven until successful live bootstrap workflow.
