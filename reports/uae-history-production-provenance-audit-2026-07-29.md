# UAE Historical Chart — Production Data Provenance Audit

**Date:** 2026-07-29  
**Branch:** `cursor/home-uae-historical-karat-chart-6a31`  
**PR:** [#714](https://github.com/vctb12/GoldTickerLive/pull/714) (draft — **held**)

## Executive summary

Earlier owner-facing reports **overstated** production readiness. The failed run
[30464818829](https://github.com/vctb12/GoldTickerLive/actions/runs/30464818829) is the first
**real** secret-bearing fetch on this branch (parser rejected all 400 rows). Later “successful” PR
workflow runs used **fixture mode** or wrote files **without production provenance**. The committed
`data/historical/xau-usd-daily.json` (commit `7c0c40fef0`) lacked `dataOrigin`, workflow run ID, and
raw-response hash — **quarantined and deleted** in this pass.

**No verified live production dataset exists until a successful `workflow_dispatch` bootstrap run
commits a file with `dataOrigin: live-provider` and matching workflow metadata.**

---

## Evidence timeline

| Time (UTC) | Commit SHA | Workflow run | Mode | Key used | Provider rows | Accepted | Rejected | Committed to repo | Notes |
|------------|------------|--------------|------|----------|---------------|----------|----------|-------------------|-------|
| 15:13:36 | `609c1891` | [30464818829](https://github.com/vctb12/GoldTickerLive/actions/runs/30464818829) | **live** (broken parser) | Yes | 400 | 0 | 400 | No | `validation failed — no_records`; root cause: parser expected `{timestamp,avg}` not `{day,avg_price}` |
| 15:27:17 | `f10fd7e56` | [30465923073](https://github.com/vctb12/GoldTickerLive/actions/runs/30465923073) | **live** (parser fixed) | Yes | 400 | 400 | 0 | No (PR event) | Wrote temp file on runner; artifact only |
| 15:32:40 | `7c0c40fef0` | — | **agent artifact copy** | N/A | 400 | — | — | **Yes** | Committed without provenance fields; **not production-verified** |
| 15:34–15:44 | `ca67db5276` | 30466550505, 30467352675 | PR fixture path | No* | 400 | 400 | 0 | No | *PR workflow used fixture when key absent; misleading “green” if interpreted as live |
| 15:44+ | `ca67db5276` | 30467352675 | PR + key present | Yes** | 400 | 400 | 0 | No | **Security issue:** same-repo PR could reference secrets; fixed by splitting PR workflow |

**Production file hash (deleted, unverified):** `bca8ecc1888b272057b538d754bc5dae154eddaeb190dc1c9b59cfc089bab3b2`

---

## Root cause of 400 rejected records (run 30464818829)

gold-api.com `/history` returns documented shape:

```json
[{ "day": "YYYY-MM-DD", "avg_price": 1234.56 }]
```

The parser at `609c1891` only read `timestamp`/`avg` aliases. All 400 rows had valid `day` but were
rejected as missing price → `recordsFetched: 0`, `rejected: 400`, error `no_records`.

**Fix (this pass):** strict `{ day, avg_price }` parser with per-reason rejection tally.

---

## Remediation in this pass

1. **Deleted** unverified `data/historical/xau-usd-daily.json`
2. **Added** production provenance contract (`dataOrigin`, workflow run ID, SHA-256 hashes)
3. **Blocked** fixture writes to production path
4. **Hardened** homepage loader — rejects missing/non-live provenance
5. **Split** workflows: `historical-gold-refresh-pr.yml` (fixture, read-only) vs trusted live workflow
6. **Added** `--diagnose-schema` for secret-free live response inspection
7. **Added** authenticity + cross-validation scripts (QA only)

---

## Licensing / terms (gold-api.com)

Per [gold-api.com/terms](https://gold-api.com/terms) (reviewed 2026-07-29):

- Service provides historical/current price data; **accuracy not guaranteed**
- Public website use is intended
- **Bulk redistribution** of committed JSON is **not explicitly permitted** in terms — treat committed
  file as **site-serving derived cache** with attribution; owner legal review recommended before
  calling data “open” or redistributable

---

## Owner action required

1. Actions → **Historical Gold Refresh** → `workflow_dispatch` on this branch
2. Set `bootstrap_branch` = **true** (one-time)
3. Verify run succeeds and commits `data/historical/xau-usd-daily.json` with:
   - `dataOrigin: "live-provider"`
   - `workflow.runId` matching the run URL
   - `rawResponseSha256` matching audit artifact
4. Optional: run `diagnose_schema=true` first to inspect live response shape

**Do not mark PR ready until step 3 is complete and cross-validation passes.**
