# Owner Actions Required — Gold Provider Bakeoff & X Duplicate-Post Guard

> Direct, manual-only checklist of what the **repo owner** still has to do before this PR is
> safe to mark Ready for Review or merge. Copilot/agents cannot do these for you — they require
> your accounts, your secrets, and your decisions.

---

## Current repo status

- ✅ **Infrastructure implemented.** Provider adapters, bakeoff runner, scorecard, fetch
  orchestrator, X duplicate-post guard, manual provider test workflow, hourly bakeoff workflow,
  operator checklist, env example, and tests are all present.
- ✅ **Tests passing.** `pytest tests/ scripts/python/` — 65/65 green.
- ✅ **Production unchanged.** `gold-price-fetch.yml` still runs the legacy
  `scripts/fetch_gold_price.py`; `post_gold.yml` still consumes the legacy `data/gold_price.json`.
  No production cutover has been performed.
- ✅ **New provider system dormant.** The new orchestrator at
  `scripts/python/fetch_gold_price.py` is not scheduled in any workflow yet.
- ❌ **No real provider winner yet.** No real bakeoff samples exist, the scorecard contains only
  no-key skip data, and no winning/backup provider has been chosen.

---

## Owner must do before merge

Walk through these in order. Do not check the next box until the previous one is genuinely true.

- [ ] Open the PR as **Draft**
- [ ] Add at least **2 provider API keys** as GitHub Secrets (see "Recommended provider keys"
      below)
- [ ] Enable those providers in workflow/env (`*_ENABLED=true` flags)
- [ ] Run `test-gold-providers.yml` (Actions → Run workflow)
- [ ] Confirm at least one provider returns real data (artifact shows non-error sample)
- [ ] Run `gold-provider-bakeoff.yml` for **at least 24 hours**, preferably **48 hours**
- [ ] Download the bakeoff artifact and review `data/provider_scorecard.json`
- [ ] Select a **winning provider** based on the scorecard (not on docs/marketing)
- [ ] Select a **backup provider**
- [ ] Fill in `docs/operator-inputs-gold-provider-bakeoff.md` (sections 2, 3, 4, 5, 6, 8, 11)
- [ ] Ask Copilot to prepare an explicit **production cutover** PR
- [ ] Run a dry-run tweet with **real data** (`DRY_RUN_TWEET=true`)
- [ ] Confirm the **rollback path** works (legacy `post_gold.yml` can be re-enabled)
- [ ] Only then mark the PR **Ready for Review**
- [ ] Only then **merge**

---

## Recommended provider keys to add first

Add whichever ones you actually have. **At least two candidates** must be tested for the bakeoff
to be meaningful.

| Secret name                | Provider                | Notes                                             |
| -------------------------- | ----------------------- | ------------------------------------------------- |
| `TWELVEDATA_API_KEY`       | Twelve Data XAU/USD     | Strong candidate; verify social/display terms     |
| `FINNHUB_API_KEY`          | Finnhub OANDA:XAU_USD   | Confirm XAU is on free tier                       |
| `FMP_API_KEY`              | Financial Modeling Prep | Tight free quota — likely fallback only           |
| `GOLDAPI_IO_KEY`           | GoldAPI.io              | Candidate-only; not previously used               |
| `METAL_SENTINEL_API_KEY`   | Metal Sentinel          | Set with `METAL_SENTINEL_API_HOST`                |
| `METAL_SENTINEL_API_HOST`  | Metal Sentinel host     | RapidAPI host or direct URL                       |

Notes:

- **GoldPriceZ** can remain as legacy/fallback but should **not** be the winning provider unless
  the scorecard somehow proves it (it has historically frozen for 30–45 minutes at a time).
- **gold-api.com** is **disabled by default** because it previously hit limits in production.
- **goldapi.io** is **candidate-only**, disabled by default.

---

## Exact GitHub UI steps

1. Go to the repo → **Settings**.
2. Click **Secrets and variables** → **Actions**.
3. Click **New repository secret**.
4. Add each provider key from the table above (one secret per row).
5. Optionally also add `*_ENABLED=true` repository variables (or set the matching env flag in
   `.env.example` for local runs).
6. Go to **Actions** → **Test Gold Providers (manual)** → **Run workflow**.
7. After the smoke test passes, go to **Actions** → **Gold Provider Bakeoff** → **Run workflow**
   (or let the hourly cron collect samples for ≥ 24 h).
8. Download the artifact from the bakeoff run; inspect `data/provider_scorecard.json`.

---

## After adding secrets, run these

```text
# Manual smoke test (Actions UI):
Actions → Test Gold Providers (manual) → Run workflow
  providers: (leave blank to test all enabled, or e.g. twelvedata_xauusd,finnhub_oanda)
  log_raw: false

# Manual bakeoff (Actions UI):
Actions → Gold Provider Bakeoff → Run workflow
  providers: twelvedata_xauusd,finnhub_oanda,fmp_gcusd,goldapi_io
  duration_hours: 24
  interval_seconds: 360
  commit_results: false
  log_raw: false

# Local readiness gate (run before opening for review or merging):
python scripts/python/gold_bakeoff_readiness.py --strict
```

---

## Exact next action from GitHub UI

### If `Test Gold Providers (manual)` shows up in the Actions tab

1. Go to **Actions** → **Test Gold Providers (manual)** → **Run workflow** (branch:
   `copilot/replace-gold-api-key`).
2. `providers`: `twelvedata_xauusd,finnhub_oanda,fmp_gcusd,goldapi_io,metal_sentinel,goldpricez`
   (or leave blank to test all).
3. `log_raw`: `false`.
4. Open the run, expand "Run one bakeoff round", and confirm at least one provider returns a
   real `ok` row (not `provider_disabled` or `missing_api_key`).
5. Download the `gold-provider-test-<run_id>` artifact and inspect
   `out/provider_test_scorecard.json`.

> 💡 If everything shows `provider_disabled`, you also need to set the matching `*_ENABLED=true`
> repository variable (or secret) for each provider you want to test. The default for every
> non-legacy adapter is **off** so a missing flag is a clean skip, not a credential leak.

### If the workflow does NOT show up in the Actions tab

This is expected: GitHub only lists workflow files that exist on the **default branch**. The
new `test-gold-providers.yml` and `gold-provider-bakeoff.yml` files live only on
`copilot/replace-gold-api-key` until merge.

**Do not merge just to make them appear.** Use one of these instead:

1. **Run from the branch UI** — open the workflow file on the PR branch
   (`.github/workflows/test-gold-providers.yml` → "Run workflow" picker) — GitHub will offer the
   PR branch as a target. This works for `workflow_dispatch` workflows defined on a non-default
   branch as long as you select the correct branch in the dropdown.
2. **Local CLI smoke test** — clone the branch locally, export the provider keys you want to
   test as environment variables (one terminal session, never commit them), and run:
   ```bash
   export TWELVEDATA_API_KEY=...   # paste; do NOT share
   export TWELVEDATA_ENABLED=true
   export FINNHUB_API_KEY=...
   export FINNHUB_ENABLED=true
   python scripts/python/provider_bakeoff.py --once \
     --providers twelvedata_xauusd,finnhub_oanda
   ```
   This calls the same code path as the workflow without any commit, artifact upload, or X post.
3. **Wait for cutover PR** — only after the operator checklist is filled and Copilot has
   prepared a separate cutover PR, the workflows can land on `main` along with the rest.

### After the smoke test succeeds

Run the bakeoff with safe defaults:

| Field              | Value                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| `providers`        | `twelvedata_xauusd,finnhub_oanda,fmp_gcusd,goldapi_io,metal_sentinel,goldpricez` |
| `duration_hours`   | `24` (or `48`)                                                              |
| `interval_seconds` | `360`                                                                       |
| `commit_results`   | `false` (artifact only)                                                     |

> ⚠️ Hosted GitHub runners cap a single run at ~6 hours. For 24h+ coverage, prefer the
> hourly cron schedule already wired into `gold-provider-bakeoff.yml` (`cron: "11 * * * *"`)
> and let it accumulate samples, then download artifacts from the latest run after a day.

---

## Secret-name reference

You added every secret listed below. Only the ones the workflows actually read are documented;
duplicates are noted so nothing is accidentally rotated and silently broken.

### Provider adapter env-var mapping (from the adapter source)

| Secret you added            | Read by adapter             | Adapter behavior if absent     |
| --------------------------- | --------------------------- | ------------------------------ |
| `TWELVEDATA_API_KEY`        | `twelvedata.fetch`          | `missing_api_key`              |
| `FINNHUB_API_KEY`           | `finnhub.fetch`             | `missing_api_key`              |
| `FMP_API_KEY`               | `fmp.fetch`                 | `missing_api_key`              |
| `GOLDAPI_IO_KEY`            | `goldapi_io.fetch`          | `missing_api_key`              |
| `METAL_SENTINEL_API_KEY`    | `metal_sentinel.fetch`      | `missing_api_key`              |
| `METAL_SENTINEL_API_HOST`   | `metal_sentinel.fetch`      | adapter falls back to default  |
| `GOLDPRICEZ_API_KEY`        | `goldpricez.fetch` (legacy) | `missing_api_key`              |

Each adapter **also** checks a per-provider `*_ENABLED` flag (default `false` except
`GOLDPRICEZ_ENABLED` which defaults `true`). To actually exercise an adapter in the workflow,
add `<NAME>_ENABLED=true` as a repository **variable** (or another secret).

> ❗ Owner-side legacy / unused secrets — keep them, but they are **not** wired up:
>
> - `GOLD_API_KEY` — no adapter reads this; not the same as `GOLDAPI_IO_KEY`. Likely a relic
>   from the old `goldpricez.com`-only flow. Safe to leave; do not rename.
> - `API_NINJAS_API_KEY`, `API_FX_URL`, `API_GOLD_URL` — no adapter reads these. There is no
>   `api_ninjas` adapter, and per the brief, API Ninjas should stay out of the default
>   provider order on the free tier. Leave the secrets but do not add an adapter.
> - `SUPABASE_*` — used by other automations (admin / newsletter); unrelated to the bakeoff.

### X / Twitter secret mapping (production poster)

`.github/workflows/post_gold.yml` (production) **only reads the `CONSUMER_*` / `ACCESS_TOKEN*`
names**, then maps them into the `TWITTER_*` env vars the script expects:

```yaml
env:
  TWITTER_API_KEY:             ${{ secrets.CONSUMER_KEY }}
  TWITTER_API_SECRET:          ${{ secrets.CONSUMER_SECRET }}
  TWITTER_ACCESS_TOKEN:        ${{ secrets.ACCESS_TOKEN }}
  TWITTER_ACCESS_TOKEN_SECRET: ${{ secrets.ACCESS_TOKEN_SECRET }}
```

You also added `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`,
`TWITTER_ACCESS_TOKEN_SECRET`. Those are **not currently referenced by any workflow** — they are
spares with the names the script uses internally. Either:

- Keep them as backup (no harm), or
- Drop them later in a separate cleanup PR once you confirm `CONSUMER_*` is the canonical pair.

**Do not delete `CONSUMER_*` — that breaks production tweeting.**

---

## What is still OWNER ACTION REQUIRED

Only the following remain — every one needs your account, your decision, or your wait:

1. **Real provider API keys** — already added; nothing more for me to do here.
2. **Per-provider `*_ENABLED=true` variables** — turn on whichever providers you want to test.
3. **Run the smoke test** in Actions and confirm at least one provider returns real data.
4. **Run / wait for the 24–48 h bakeoff** to accumulate samples.
5. **Review `data/provider_scorecard.json`** in the artifact — Copilot must not pick the winner.
6. **Select winning + backup provider** based on the scorecard data.
7. **Fill `docs/operator-inputs-gold-provider-bakeoff.md`** (sections 2, 3, 4, 5, 6, 8, 11).
8. **Approve a separate production-cutover PR** — the cutover is intentionally not in this PR.
9. **Dry-run a tweet with real data** before flipping production.
10. **Mark Ready for Review** and **merge** — only after all above steps are done.

---

## PR comment to paste (when you're ready to share status)

```text
This PR remains Draft.

Repo-side hardening is complete. Production remains unchanged (legacy GoldPriceZ path).
Test/bakeoff workflows are safe — no X posting, no auto-commit, no production cutover.
No provider winner has been selected yet.

Real provider testing and the 24h+ bakeoff are still pending. Merge is blocked until
the owner-side checklist in docs/OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md is complete.

Owner-side checklist:
- [ ] Provider smoke test with real keys
- [ ] 24h+ bakeoff
- [ ] Scorecard reviewed
- [ ] Winner selected
- [ ] Backup selected
- [ ] Operator checklist filled
- [ ] Production cutover approved (separate PR)
- [ ] Dry-run tweet tested with real data
- [ ] Ready for Review
- [ ] Merge
```

---

## What Copilot / coding agents cannot do for you

- **Cannot create provider accounts** — pricing pages, ToS acceptance, and email verification
  must be done by you.
- **Cannot know secret values** — and must never print them. The agent only sees that a secret
  is referenced; it never receives the value.
- **Cannot prove provider quality** without real samples. A scorecard with all `score=0.00 avoid`
  rows means the bakeoff never ran with real keys, not that the providers are bad.
- **Cannot choose the winner** before bakeoff data exists. Only you can compare unique
  prices/hour, longest frozen period, and 429 counts and make the call.
- **Cannot approve production cutover** without your decision. The cutover edits real schedules
  and must be a separate, owner-approved change.

---

## Related documents

- [`docs/operator-inputs-gold-provider-bakeoff.md`](./operator-inputs-gold-provider-bakeoff.md)
  — full operator checklist (secrets, providers, scorecard decision, rollback).
- [`docs/gold-price-provider-bakeoff.md`](./gold-price-provider-bakeoff.md) — how the bakeoff
  works.
- [`docs/gold-price-provider-migration.md`](./gold-price-provider-migration.md) — exact
  production cutover steps.
- [`docs/x-automation-duplicate-policy.md`](./x-automation-duplicate-policy.md) — duplicate-tweet
  guard rules.
- [`docs/data-source-methodology.md`](./data-source-methodology.md) — source labels and trust
  wording.
- [`scripts/python/gold_bakeoff_readiness.py`](../scripts/python/gold_bakeoff_readiness.py) —
  readiness gate; run before review/merge.
