# Operator Inputs — Gold Provider Bakeoff & X Automation

> Single source of truth for everything the repo owner/operator must do **manually** before the
> new provider-adapter + bakeoff system can be activated in production. Fill in this file as you
> go and treat the checklists as the go/no-go gates.

> ⚠️ **Workflow visibility note (read first).** A `workflow_dispatch`-only workflow file that
> exists **only on a feature branch** is not reliably exposed in the Actions tab —
> GitHub typically only shows the "Run workflow" button after the file lands on the default
> branch. **Do not merge just to make it visible.** Use the PR-visible smoke check
> (`.github/workflows/pr-provider-smoke.yml`, runs on `pull_request`) or the local CLI fallback
> documented in [`OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md`](./OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md#exact-next-action-from-github-ui).
> Never paste secret values into GitHub comments or docs.

Related docs:

- [`docs/gold-price-provider-bakeoff.md`](./gold-price-provider-bakeoff.md) — how the bakeoff works.
- [`docs/gold-price-provider-migration.md`](./gold-price-provider-migration.md) — how to flip
  production from legacy GoldPriceZ to the winning provider.
- [`docs/x-automation-duplicate-policy.md`](./x-automation-duplicate-policy.md) — duplicate-tweet
  guard rules.
- [`docs/data-source-methodology.md`](./data-source-methodology.md) — source-type labels and
  trust wording.
- [`.env.example`](../.env.example) — all supported env variables.

---

## 1. Current status

- This PR adds **infrastructure only**: provider adapters, bakeoff runner, scorecard, X
  duplicate guard, and supporting workflows. Tests pass; no production cutover happens
  automatically.
- The PR **does not** prove which provider is best. That requires real samples from the
  bakeoff workflow.
- **Production must not be switched** until the bakeoff has collected at least 24h of samples
  and the scorecard has been reviewed.
- Legacy GoldPriceZ (`scripts/fetch_gold_price.py` + `.github/workflows/post_gold.yml`) remains
  the active production path until you explicitly flip it per
  [`gold-price-provider-migration.md`](./gold-price-provider-migration.md).
- For the owner-only checklist, see
  [`OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md`](./OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md).
- Before opening for review or merging, run the readiness gate:
  `python scripts/python/gold_bakeoff_readiness.py --strict`

---

## 2. Required GitHub Secrets

Add these under **Settings → Secrets and variables → Actions → Repository secrets**.
Never paste real values into this file or any committed doc.

| Secret name                  | Provider / purpose                  | Required for bakeoff? | Required for production? | Added? (yes/no) | Notes |
| ---------------------------- | ----------------------------------- | --------------------- | ------------------------ | --------------- | ----- |
| `METAL_SENTINEL_API_KEY`     | Metal Sentinel auth                 | Yes (if testing)      | Only if chosen           |                 |       |
| `METAL_SENTINEL_API_HOST`    | Metal Sentinel base URL/host        | Yes (if testing)      | Only if chosen           |                 | RapidAPI host or direct URL — TBD per dashboard |
| `FINNHUB_API_KEY`            | Finnhub OANDA:XAU_USD               | Yes (if testing)      | Only if chosen           |                 | Verify XAU available on free tier |
| `FMP_API_KEY`                | Financial Modeling Prep (GCUSD)     | Yes (if testing)      | Only if chosen           |                 | Free quota tight — likely fallback |
| `GOLDAPI_IO_KEY`             | GoldAPI.io (`x-access-token`)       | Yes (if testing)      | Only if chosen           |                 | Candidate only; not previously used |
| `TWELVEDATA_API_KEY`         | Twelve Data `/time_series` XAU/USD  | Yes (if testing)      | Only if chosen           |                 | Confirm social/display terms |
| `GOLDPRICEZ_API_KEY`         | GoldPriceZ (legacy/fallback)        | Optional              | Only if kept             |                 | Existing secret; reuse if present |
| `CONSUMER_KEY`               | X/Twitter API key                   | No                    | Yes                      |                 | Already configured (see `.github/workflows/post_gold.yml`) |
| `CONSUMER_SECRET`            | X/Twitter API secret                | No                    | Yes                      |                 | Already configured |
| `ACCESS_TOKEN`               | X/Twitter access token              | No                    | Yes                      |                 | Already configured |
| `ACCESS_TOKEN_SECRET`        | X/Twitter access token secret       | No                    | Yes                      |                 | Already configured |

The four X/Twitter secrets are mapped to `TWITTER_API_KEY` / `TWITTER_API_SECRET` /
`TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_TOKEN_SECRET` in
`.github/workflows/post_gold.yml`.

---

## 3. Provider enablement checklist

A provider is only attempted at runtime when its `*_ENABLED=true` env flag is set **and** its
API key/host is present. Otherwise it skips cleanly with `provider_disabled` or
`missing_api_key`.

| Provider              | Env flag                  | API key secret           | Enabled? | Account created? | Free quota checked? | Public/social posting terms checked? | Attribution needed? | Notes |
| --------------------- | ------------------------- | ------------------------ | -------- | ---------------- | ------------------- | ------------------------------------ | ------------------- | ----- |
| `metal_sentinel`      | `METAL_SENTINEL_ENABLED`  | `METAL_SENTINEL_API_KEY` |   yes    |      yes         |        No           |               No                     |      No             | Skeleton adapter — host/path may need adjustment per dashboard |
| `finnhub_oanda`       | `FINNHUB_ENABLED`         | `FINNHUB_API_KEY`        |   yes    |      yes         |        No           |               No                     |      No             | Test symbol discovery on `OANDA:XAU_USD` first; may be `plan_gated` on free tier |
| `fmp_gcusd`           | `FMP_ENABLED`             | `FMP_API_KEY`            |   yes    |      yes         |        No           |               No                     |      No             | Free plan likely too tight for 240/day — treat as fallback/benchmark |
| `goldapi_io`          | `GOLDAPI_IO_ENABLED`      | `GOLDAPI_IO_KEY`         |   yes    |      yes         |        No           |               No                     |      No             | **Candidate only** — not previously used by operator; keep disabled until quota & terms confirmed |
| `twelvedata_xauusd`   | `TWELVEDATA_ENABLED`      | `TWELVEDATA_API_KEY`     |   yes    |      yes         |        No           |               No                     |      No             | Basic plan ≈ 8 credits/min, 800/day. Verify social/display terms before naming as primary |
| `goldpricez`          | `GOLDPRICEZ_ENABLED`      | `GOLDPRICEZ_API_KEY`     |   yes    |      yes         |        No           |               No                     |      No             | **Existing/problematic** — price freezes 30–45 min, causing duplicate-post rejections on X |
| `gold_api_com`        | `GOLD_API_COM_ENABLED`    | _(no key required)_      |   yes    |      yes         |        No           |               No                     |      No             | **Not preferred** — hit limits and became unreliable in previous real production use. Keep disabled |

Mark provider rows complete only when **all** of the per-provider columns are filled.

---

## 4. Bakeoff run plan

Fill in once a bakeoff run is launched (see
[`gold-price-provider-bakeoff.md`](./gold-price-provider-bakeoff.md) for the workflow
controls).

- Bakeoff start date/time:
- Bakeoff end date/time:
- Duration: ☐ 24h ☐ 48h ☐ other: ____ _(recommended default: at least 24h, 48h preferred)_
- Interval seconds: 360 _(default = 6 min; change only with reason)_
- Providers included: `goldapi_io,twelvedata_xauusd,fmp_gcusd` _(first 24h run; based on
  PR Provider Smoke 2026-05-01 — `finnhub_oanda` excluded as plan-gated, `metal_sentinel`
  excluded pending HTTP 400 fix, `goldpricez` excluded as legacy/`missing_price`)_
- Workflow used: `.github/workflows/gold-provider-bakeoff.yml`
- Results stored as: ☑ artifacts only ☐ committed files _(default: artifacts; commit only if explicitly needed)_
- `commit_results` setting: ☑ false ☐ true _(default: false)_
- Notes:

**Recommended defaults**

- Run for **at least 24h**; prefer **48h** to capture more than one market session.
- Do **not** select a winner from a short test (a few hours is not representative).
- GitHub Actions cron can be delayed or dropped under load — a longer window protects against
  sampling gaps.

---

## 5. Provider scorecard decision

Fill in after reviewing `data/provider_scorecard.json` (or the artifact from the bakeoff run).

- Winning provider: _____
- Backup provider: _____
- Provider to avoid: _____
- Scorecard file reviewed: ☐ yes ☐ no
- Unique prices/hour: _____
- Unique timestamps/hour: _____
- Longest frozen period: _____
- 429/rate-limit count: _____
- Auth/plan errors: _____
- Stale response count: _____
- Decision reason:

**Decision rule.** Do **not** choose a provider only because its docs or pricing page look
good. Choose based on observed update frequency and reliability — specifically unique
timestamps/hour, longest frozen period, and stale/429 counts.

---

## 6. Production activation checklist

Walk through these in order. Do not check the next box until the previous one is genuinely true.

- [x] API keys added as GitHub Secrets (Section 2) — confirmed via PR Provider Smoke 2026-05-01
- [ ] Provider enable flags set (Section 3)
- [x] Manual provider smoke test passed — `PR Provider Smoke` on PR #253 (2026-05-01) returned
      real `ok` rows from `twelvedata_xauusd`, `goldapi_io`, and `fmp_gcusd`. `finnhub_oanda`
      (plan_gated/403), `metal_sentinel` (http_error/400), and `goldpricez` (missing_price)
      excluded from the first 24h bakeoff. See
      [`OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md` → Smoke test results — 2026-05-01](./OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md#smoke-test-results--2026-05-01).
- [ ] Bakeoff ran for at least 24h (Section 4)
- [ ] `data/provider_scorecard.json` reviewed (Section 5)
- [ ] Winning provider selected
- [ ] Backup provider selected
- [ ] X duplicate guard dry-run tested locally (`DRY_RUN_TWEET=true python scripts/python/post_gold_price.py`)
- [ ] `DRY_RUN_TWEET=true` tested in workflow
- [ ] Production workflow reviewed (`.github/workflows/post_gold.yml` and/or new post-gold-price.yml)
- [ ] Start at 10-minute polling first (`cron: "3-53/10 * * * *"`)
- [ ] Only move to 6-minute polling once quota and workflow stability are confirmed (`cron: "2-56/6 * * * *"`)
- [ ] Confirm stale/cached tweets are disabled (`ALLOW_STALE_TWEET=false`) unless explicitly wanted
- [ ] Confirm tweet labels do not say `LIVE` unless source really supports it
- [ ] Confirm no API keys are exposed in frontend JS, logs, JSON files, or docs
- [ ] Confirm rollback path to legacy workflow works (Section 10)

---

## 7. Recommended production env values

After bakeoff, replace `winning_provider` and `backup_provider` with the actual adapter names
(e.g. `twelvedata_xauusd`, `goldapi_io`).

```env
GOLD_PROVIDER_ORDER=winning_provider,backup_provider,goldpricez
MAX_GOLD_FRESHNESS_SECONDS=900
AED_PEG=3.6725
ALLOW_STALE_PRICE=false
ALLOW_STALE_TWEET=false
MIN_TWEET_MOVE_USD=1.00
MIN_TWEET_MOVE_PCT=0.03
FORCE_SUMMARY_AFTER_MINUTES=60
SKIP_DUPLICATE_TWEETS=true
DRY_RUN_TWEET=false
SOFT_FAIL_ON_NO_FRESH_PRICE=true
HTTP_TIMEOUT_SECONDS=10
HTTP_RETRIES=2
```

`winning_provider` and `backup_provider` are placeholder names — they **must** be replaced
with the real adapter names from `scripts/python/gold_providers/registry.py` after the bakeoff.

---

## 8. Workflow decisions

- Production polling cadence: ☑ 10 minutes ☐ 6 minutes _(recommended default: 10 min first)_
- Production cron: `3-53/10 * * * *` _(recommended default; replace with chosen cron)_
- Bakeoff workflow enabled? ☐ yes ☐ no
- Provider test workflow enabled? ☐ yes ☐ no
- Commit bakeoff outputs? ☑ no ☐ yes _(recommended default: no — use artifacts)_
- Keep artifacts only? ☑ yes ☐ no _(recommended default: yes)_
- Production cutover approved? ☑ no ☐ yes _(default: not approved)_
- Notes:

**Recommended**

- Start with `cron: "3-53/10 * * * *"` (10 minutes, offset away from minute 0).
- Move to `cron: "2-56/6 * * * *"` only after stable results.
- Avoid minute 0 — Actions are most likely to be delayed/dropped at the top of the hour.
- Keep `concurrency: { group: gold-price-automation, cancel-in-progress: true }` enabled.
- The shortest supported interval is 5 minutes; do not try anything tighter.

---

## 9. X/Twitter posting policy

The duplicate guard already enforces this in `scripts/python/tweet_guard.py` and
`scripts/python/post_gold_price.py`, but you still control the policy via env vars and
copy review.

- [ ] Skip if provider timestamp unchanged
- [ ] Skip if tweet text hash unchanged
- [ ] Skip if price movement below threshold unless forced summary is due
- [ ] Skip stale data unless explicitly allowed (`ALLOW_STALE_TWEET=true`)
- [ ] **Never** add random characters / invisible Unicode just to bypass X duplicate detection
- [ ] Use “Gold reference price” by default
- [ ] Use “Last known price — not live” for cached data **only** if `ALLOW_STALE_TWEET=true`
- [ ] Use “futures/reference” wording for futures-style sources (FMP `GCUSD`)

X enforces duplicate detection server-side: identical or near-identical recent posts return
HTTP 403 with code 187 (“Status is a duplicate”). The bot must skip, not retry with cosmetic
changes.

---

## 10. Rollback plan

If the new provider pipeline misbehaves in production:

1. **Disable** the new workflow (set `on:` to `workflow_dispatch:` only, or comment out
   `schedule:`).
2. **Re-enable** the legacy GoldPriceZ workflow (`.github/workflows/post_gold.yml` is the
   pre-existing path) if it was disabled.
3. Set `DRY_RUN_TWEET=true` if uncertain about tweet content while debugging.
4. Remove or set `*_ENABLED=false` provider flags for the misbehaving adapter(s).
5. Keep bakeoff JSONL artifacts and `data/provider_scorecard.json` for debugging — do not
   purge them.

---

## 11. Open questions for me

Fill in answers; revisit before flipping production. Defaults reflect repo conventions; replace
`_____` with your specific decision.

- Which provider keys do I currently have? _____ _(owner-only knowledge — never write secret values here)_
- Which provider accounts should I create? _____ _(recommended first two: Twelve Data, Finnhub)_
- Do I want a 24h or 48h bakeoff? **48h preferred**, 24h minimum.
- Should bakeoff results be committed or artifact-only? **Artifact-only by default.**
- Do I want to start production at 10 minutes? **Yes — `3-53/10 * * * *` first**, then move to 6 min only after stability.
- Do I allow stale/cached tweets? **No — `ALLOW_STALE_TWEET=false`.**
- Which X/Twitter secrets are currently configured? `CONSUMER_KEY`, `CONSUMER_SECRET`,
  `ACCESS_TOKEN`, `ACCESS_TOKEN_SECRET` _(see `.github/workflows/post_gold.yml`)_
- Do I want GoldPriceZ kept as last fallback or removed entirely? **Keep as legacy/fallback only;
  not a winner candidate.**
- Do I want gold-api.com disabled completely because it previously hit limits? **Yes — disabled
  by default (`GOLD_API_COM_ENABLED=false`).**
- Is `goldapi.io` in scope? **Candidate-only — `GOLDAPI_IO_ENABLED=false` until tested.**

---

## 12. Readiness gate

Before opening this PR for review or merging, run:

```bash
python scripts/python/gold_bakeoff_readiness.py --strict
```

The gate checks infra files, gitignore, workflow safety, production safety, the operator
checklist, and bakeoff samples. Exit code 0 = safe to merge; exit code 2 = Draft PR safe but
merge blocked by owner actions; exit code 1 = something fundamentally wrong.

You can also trigger this in GitHub Actions: **Actions → Gold Bakeoff Readiness → Run workflow**.
