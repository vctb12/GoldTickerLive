# Realtime Ops Runbook (Phase 6)

> Purpose: on-call playbook for the gold-price realtime data path. Pairs with
> `docs/realtime-baseline-audit.md` (how it works today), `docs/realtime-architecture.md` (target
> architecture), and `docs/realtime-validation-report.md` (what changed).
>
> Audience: anyone (human or agent) responding to a realtime data incident. Keep this file short,
> scannable, and dated when changed.

---

## 1. Health signals

| Where to look                                  | What "healthy" looks like                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `data/gold_price.json`                         | Validated emergency snapshot with a current provider timestamp and explicit freshness flags                              |
| GitHub Actions → `Gold Price Fetch`            | Last run within the cron window (`'2 21-23 * * 0'`, `'2 * * * 1-4'`, `'2 0-20 * * 5'`), status green                     |
| Optional Express API (local/self-hosted only)  | HTTP 200 when explicitly run; it is not part of the Pages production price path                                          |
| Tracker badge in the UI                        | "Live" within ~30 min of cron tick; "Delayed" 30–75 min; "Stale" only beyond 75 min; "Fallback" when upstream reports it |
| `getLiveFreshness()` `reason` codes (devtools) | `fresh` while live; `age-exceeds-delayed`, `age-exceeds-stale`, `upstream-fallback`, `upstream-stale` as appropriate     |

The `reason` field on `getLiveFreshness()` is the fastest way to diagnose a mislabel claim — it
tells you which precondition triggered the bucket.

## 2. Known failure modes & first response

### 2.1 "Live" pill never appears (always "Delayed" or worse)

1. Check `data/gold_price.json` `fetched_at_utc`. If older than ~60 min, the workflow probably
   skipped — go to §2.2.
2. Check `is_fresh` in the file. If `false`, the upstream provider reported stale at adapter time;
   check provider status page.
3. Check `is_fallback` in the file. If `true`, the live provider call failed at adapter time and the
   adapter served a cached value; the UI is correctly showing "Fallback".

### 2.2 `Gold Price Fetch` workflow has not run recently

1. Open `.github/workflows/gold-price-fetch.yml` runs. Look for the last successful run.
2. Common causes:
   - GitHub Actions outage (status.github.com).
   - Provider 5xx — `fetch_gold_price.py` exits non-zero and the file is not committed. Logs are in
     the workflow run.
   - Disk-space / commit failure on the runner — re-run.
3. Manual recovery: `workflow_dispatch` the same workflow. The next scheduled tick will resume the
   cadence.

### 2.3 Tracker shows "Live" for visibly old data

This is the trust-critical scenario. As of the realtime truthfulness PR, this must be unreachable;
if it happens, treat as a P1 trust bug.

1. Read the `reason` field in `getLiveFreshness()`. If it returns `'live'` for old data, **the
   anti-mislabel guard regressed** — bisect on `src/lib/live-status.js` and re-run
   `tests/live-status.test.js`.
2. Check whether `normalizeGoldResponse()` in `src/lib/api.js` is dropping `isFallback` / `isFresh`.
   The post-PR behavior is to pipe both fields through; if removed, the engine has nothing to guard
   against.
3. Hot-fix: revert the change that broke either invariant; tests in `tests/live-status.test.js`
   should catch the regression in CI.

### 2.4 Browser leader or provider failover issue

1. Inspect `getLivePriceManager().getSnapshot()` for `leader`, `online`, `transport`, and
   `providerHealth`.
2. Confirm only one tab owns the local-storage lease and that sibling tabs receive
   `BroadcastChannel` updates.
3. Check Gold API response age, CORS, HTTP status, and rate-limit behavior. Three consecutive
   failures intentionally open that provider circuit for 30 seconds.
4. If the provider remains unavailable, verify the UI says `fallback`, `cached`, or `unavailable`
   and that the Actions snapshot remains available. Do not relabel the recovery value as live.

### 2.5 Time drift / wrong "age" displayed

1. The freshness engine uses `Date.now()` and the data file's `timestamp_utc` / `fetched_at_utc`.
   There is no client-server time sync.
2. If a client's clock is wildly wrong, age will be wrong everywhere on the page. This is rare;
   documented for completeness.
3. The browser manager recalculates provider age from the provider timestamp on every accepted
   quote, restore, and cross-tab broadcast.

## 3. Rollback toggles & degraded modes

| Toggle                                                            | Effect                                                                                                                                                                                   |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revert the realtime truthfulness PR                               | Returns to the pre-PR freshness engine (four buckets, no `isFallback` guard). **Re-introduces the trust bug** where a fallback snapshot can be labelled "Live"; only use as last resort. |
| Increase `CONSTANTS.GOLD_REFRESH_MS` in `src/config/constants.js` | Reduces client-side poll pressure if a downstream cache layer (CDN, GitHub Pages) is rate-limiting.                                                                                      |
| Stop the optional Express service                                 | Has no effect on GitHub Pages production; the browser manager and Actions snapshot are independent.                                                                                      |
| Disable `Gold Price Fetch` cron                                   | Freezes the data file. UI will progress through "Delayed" → "Stale" honestly; do **not** disable as a "fix" — it just hides the problem.                                                 |
| Browser provider circuit opens                                    | The manager stops retrying that provider briefly, uses the static/cache recovery path, and probes again automatically.                                                                   |

## 4. Safe degraded modes (GitHub-native)

Current production order: direct browser provider; static Pages snapshot; local last-known cache;
unavailable. Every fallback remains visibly labelled and the browser manager never calls a
Pages-hosted REST or SSE endpoint. The legacy list below is retained for incident-history context;
use the current order above when triaging production.

1. **Backend healthy + static file fresh** — normal operation.
2. **Backend down, static file fresh** — clients use static JSON; UI shows "Live"/"Delayed" honestly
   off the file's timestamp.
3. **Static file stale (cron skipped) + provider live** — file gradually ages; UI progresses Live →
   Delayed → Stale on schedule. Re-run the workflow.
4. **Provider down (`is_fallback: true` in file)** — UI shows "Fallback" with last-known value; this
   is the system working as intended.
5. **No data at all** — UI shows `unavailable` everywhere. Hero / tracker / ticker explicitly read
   "Unavailable", not "Live".

## 5. Triage checklist (paste into incidents)

```
- [ ] Time and impact window
- [ ] Affected surface (hero / tracker / ticker / country / multiple)
- [ ] What freshness key is currently shown? (live / delayed / cached / stale / fallback / unavailable)
- [ ] What does `data/gold_price.json` say? (is_fresh, is_fallback, fetched_at_utc)
- [ ] Last successful `Gold Price Fetch` workflow run?
- [ ] Browser manager snapshot: leader, online, transport, active provider, and circuit states?
- [ ] Has anything in `src/lib/live-status.js` or `src/lib/api.js#normalizeGoldResponse` changed recently?
- [ ] Have anti-mislabel tests in `tests/live-status.test.js` been touched?
- [ ] Is the failure reproducible in a fresh incognito window? (rules out client-cache anomalies)
- [ ] Did `Gold Price Fetch` exit non-zero in CI? (provider 5xx, network, consensus, commit failure)
```

## 6. Related references

- `docs/realtime-baseline-audit.md` — current pipeline & measured numbers
- `docs/realtime-architecture.md` — target SSE/WS architecture, why staged
- `docs/realtime-validation-report.md` — what shipped in the truthfulness PR
- `docs/AUTOMATIONS.md` — every scheduled workflow and its contract
- `.github/workflows/gold-price-fetch.yml` — the upstream cadence
- `src/lib/live-status.js` — the freshness truth engine
- `src/lib/api.js` — `normalizeGoldResponse()` — truth-metadata propagation
- `server/routes/api-v1.js` — `/api/v1/prices/latest` backend
