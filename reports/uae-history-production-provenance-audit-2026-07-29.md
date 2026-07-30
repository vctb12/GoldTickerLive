# UAE Historical Chart — Production Data Provenance Audit

**Date:** 2026-07-29  
**Branch:** `cursor/home-uae-historical-karat-chart-6a31`  
**PR:** [#714](https://github.com/vctb12/GoldTickerLive/pull/714) (ready for human review)

## Executive summary

A **verified live-provider production dataset** now exists on the PR branch. Bootstrap used a
one-time exact-branch `push` trigger because `workflow_dispatch` is unavailable until
`.github/workflows/historical-gold-refresh.yml` merges to `main` (GitHub only exposes manual
dispatch for workflows on the default branch).

| Item                       | Value                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Bootstrap workflow run     | [30469621213](https://github.com/vctb12/GoldTickerLive/actions/runs/30469621213)                         |
| Job ID                     | `90636164788`                                                                                            |
| Event / ref                | `push` → `refs/heads/cursor/home-uae-historical-karat-chart-6a31`                                        |
| Temporary trigger commit   | `9de3319d6d`                                                                                             |
| Trigger removal commit     | `7c7a14978e`                                                                                             |
| Production file commit     | `c66a4e3417` (artifact fallback — bot commit step missed untracked file; fixed with `git diff --cached`) |
| File SHA-256               | `521e8691c05cfd8268a8d108900b7e9e5bd7bdc04438de3f099afe85831645f7`                                       |
| Git blob                   | `b6e533a9305f6ba96c14cb06f793e91e27db2fea`                                                               |
| `dataOrigin`               | `live-provider`                                                                                          |
| Provider                   | `gold-api.com` `/history`                                                                                |
| Provider response count    | 400                                                                                                      |
| Accepted                   | 400                                                                                                      |
| Rejected                   | 0 (all reasons 0)                                                                                        |
| Raw response SHA-256       | `7dfd173a970a5fc77e5c5918514a0282a06b9be77e5d59f9846ee295971e7add`                                       |
| Normalized records SHA-256 | `770d377adecae570004cde1aa70f0e9fec551bf0a0c2ed893c306f03e40e3a94`                                       |
| Coverage                   | `2025-06-25` → `2026-07-29` (400 records, `calendarAgeDays: 0`)                                          |
| Range counts               | 1M=31, 3M=91, 6M=181, 12M=366                                                                            |

Earlier unverified `data/historical/xau-usd-daily.json` (commit `7c0c40fef0`) was **quarantined and
deleted**. Parser fix for `{ day, avg_price }` landed before the successful bootstrap.

---

## Phase 1 — State verification (2026-07-29)

1. `.github/workflows/historical-gold-refresh.yml` exists on PR branch only (not on `origin/main`).
2. `data/historical/xau-usd-daily.json` was absent before bootstrap; loader showed unavailable.
3. `GOLD_API_KEY` confirmed present in trusted workflow (not logged).
4. Parser supports real fields `day` + `avg_price`.

---

## Bootstrap procedure (why not workflow_dispatch)

GitHub `workflow_dispatch` only fires when the workflow file exists on the **default branch**. Until
PR #714 merges, owners cannot manually dispatch from the UI on the feature branch.

**Secure one-time bootstrap used instead:**

1. Temporary `push` trigger on exact branch + workflow-file path filter only (`9de3319d6d`).
2. Job-level guard:
   `github.repository == 'vctb12/GoldTickerLive' && github.ref == refs/heads/cursor/home-uae-historical-karat-chart-6a31`.
3. Live fetch → validate → artifact upload; commit step initially skipped untracked file.
4. Phase 7 artifact fallback: downloaded `xau-usd-daily-audit-30469621213`, verified hashes,
   committed unchanged (`c66a4e3417`).
5. Temporary trigger removed (`7c7a14978e`); schedule + `workflow_dispatch` only remain.

---

## Live run evidence (run 30469621213)

- **Request:** `GET https://api.gold-api.com/history` with `symbol=XAU`, `groupBy=day`,
  `aggregation=avg`, `orderBy=asc`, Unix **second** timestamps.
- **Response:** top-level JSON array; rows `{ "day": "YYYY-MM-DD", "avg_price": <number|string> }`.
- **HTTP:** success (400 rows).
- **Validation:** production provenance + coverage thresholds passed.
- **Commit message (intended):**
  `chore(data): bootstrap verified XAU/USD history [bot] run=30469621213`

---

## Authenticity audit (`analyzeAuthenticity`)

| Metric                  | Value                                                |
| ----------------------- | ---------------------------------------------------- |
| Record count            | 400                                                  |
| Weekend rows            | 114 (from provider daily averages — not synthesized) |
| `fatal`                 | false                                                |
| Warnings                | none                                                 |
| Unique value ratio      | 0.9975                                               |
| Max unchanged run       | 2                                                    |
| Max monotonic up/down   | 13 / 9                                               |
| Daily return σ          | 52.22                                                |
| Max absolute daily move | 386.72                                               |

No smoothing, interpolation, or weekend fabrication applied.

---

## Cross-validation (QA only — not merged into production)

### A. Ten-date FreeGoldAPI overlap

Secondary consistency check; FreeGoldAPI upstream may also derive from Yahoo Finance — **not fully
independent**. All ten sampled dates returned `no_overlap` (FreeGoldAPI `latest.json` lacks
historical overlap for these dates). QA warning only.

### B. World Bank Pink Sheet monthly (Jul 2026 workbook)

Seven complete months (2025-06 → 2025-12): all **pass** at 8% tolerance. Methodology: mean of
gold-api daily avgs vs World Bank monthly series (aggregation differs).

---

## Security review (2026-07-29)

- API key: `x-api-key` header only; never URL or logs.
- Actions pinned by commit SHA.
- Fixture mode blocked from production path and secrets.
- PR workflow: read-only, fixture-only, no secrets.
- **Medium (documented):** `workflow_dispatch` on non-`main` ref runs YAML from that ref — dispatch
  from `main` after merge only.
- **Medium (documented):** provenance metadata is not GitHub-API-verified at CI time — mitigated by
  trusted bot workflow + required checks.

---

## Licensing / terms (gold-api.com)

Per [gold-api.com/terms](https://gold-api.com/terms) (reviewed 2026-07-29):

- Provider supplies historical/current price data; accuracy/completeness **not guaranteed**.
- Gold Ticker Live independently validates and labels reference (not retail) prices.
- Committed JSON is a **limited rolling site cache** with on-chart attribution — not public domain,
  no licence ownership claim.
- Bulk redistribution not explicitly permitted; terms unclear on long-term archival — keep cache
  narrowly scoped to chart window.

---

## Post-bootstrap fixes

| Commit       | Change                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| `0cd87cfe27` | Browser-safe SHA-256 for client provenance validation (`sha256-hex.js`) |
| (pending)    | E2E stale-state fixture hash sync; production bootstrap test            |

---

## Verification commands (local)

```bash
node scripts/node/fetch-gold-api-history.mjs --check
node scripts/node/cross-validate-gold-api-history.mjs
npm test
NODE_ENV=production npm run build && cp -r data dist/ && npx playwright test tests/e2e/home-uae-hist-chart.spec.js
```

**Status:** Production file present with full provenance. PR ready for human review after CI green.
**Do not merge** until owner approves.
