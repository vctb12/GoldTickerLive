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
- [ ] Confirm **PR Provider Smoke** check is green on PR #253 with at least one real
      `ok` row from a non-legacy provider (or run the local CLI smoke fallback)
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

> **GitHub limitation — `workflow_dispatch` visibility.** A `workflow_dispatch`-only
> workflow file that exists **only on a feature branch** is not reliably exposed in the
> Actions tab. The "Run workflow" button only appears after the workflow file is present
> on the **default branch**. **Do not merge just to make the dispatch button appear.**
> Use the `pull_request`-triggered smoke check below or the local CLI fallback first.

### Preferred path: PR Provider Smoke (visible in PR Checks)

`.github/workflows/pr-provider-smoke.yml` runs on `pull_request` and therefore appears
under **PR #253 → Checks** immediately, no merge required.

1. Open **PR #253 → Checks** tab.
2. Find **PR Provider Smoke / One-round provider smoke (PR check)**.
3. Click into the run, expand "Run one-round smoke (real providers)".
4. Confirm at least one provider returns a real `ok` row (not `provider_disabled`,
   `missing_api_key`, or `auth_error`).
5. Download the **`pr-provider-smoke-<run_id>`** artifact and inspect
   `out/provider_scorecard.json`.

If the check did not auto-trigger (e.g. you re-ran the PR but no listed paths changed),
re-run it from **Checks → PR Provider Smoke → Re-run jobs**, or push an empty commit:
`git commit --allow-empty -m "trigger smoke" && git push`.

> 💡 The smoke job sets `<NAME>_ENABLED=true` **only inside its own env block**. Those
> flags do not propagate to `post_gold.yml`, `gold-price-fetch.yml`, or any other
> production workflow. You do **not** need to add `*_ENABLED=true` repository variables
> to make the PR smoke run — only the `*_API_KEY` secrets.

### Fallback A: dispatch from the file URL (sometimes works for branch-only workflows)

This works **only** when GitHub has already indexed the workflow against the default
branch via a previous run on `main`. For brand-new files it usually 404s; treat it as
a "try, and if it fails use the smoke check or local fallback."

1. Open the workflow file on the PR branch:
   `https://github.com/<org>/<repo>/blob/copilot/replace-gold-api-key/.github/workflows/test-gold-providers.yml`
2. If a "Run workflow" picker is offered at the top of the file, select branch
   `copilot/replace-gold-api-key` and dispatch.

### Fallback B: local CLI smoke test

Clone the branch locally, export the provider keys you want to test as environment
variables (one terminal session, **never commit them, never paste them into GitHub
comments or docs**), and run:

```bash
export TWELVEDATA_API_KEY=...     # paste; do NOT share or commit
export TWELVEDATA_ENABLED=true
export FINNHUB_API_KEY=...
export FINNHUB_ENABLED=true
export FMP_API_KEY=...
export FMP_ENABLED=true
export GOLDAPI_IO_KEY=...
export GOLDAPI_IO_ENABLED=true
export GOLDPRICEZ_API_KEY=...
export GOLDPRICEZ_ENABLED=true
export METAL_SENTINEL_API_KEY=...
export METAL_SENTINEL_API_HOST=...
export METAL_SENTINEL_ENABLED=true

python scripts/python/provider_bakeoff.py --once \
  --providers twelvedata_xauusd,finnhub_oanda,fmp_gcusd,goldapi_io,metal_sentinel,goldpricez
python scripts/python/provider_scorecard.py
```

This calls the same code path as the workflow without any commit, artifact upload, or
X post.

### After the smoke check (PR or local) shows real `ok` rows

Only after PR Provider Smoke succeeds with at least one real `ok` row from a
non-legacy provider do you proceed to the 24h+ bakeoff. The bakeoff workflow
(`gold-provider-bakeoff.yml`) becomes UI-visible only once it lands on the default
branch via a separate cutover PR — until then, accumulate samples by waiting for the
hourly cron once the file is on `main`, or extend the smoke loop locally.

### Why the previous `gold-provider-bakeoff.yml #1..#6` runs appeared

The earlier "failed runs" you saw labelled with `gold-provider-bakeoff.yml` are
explained by one of:

1. **Likely**: they were `gold-bakeoff-readiness.yml` runs triggered by `pull_request`
   on this PR. The Actions tab labels each run by workflow name; older readiness runs
   would show under "Gold Bakeoff Readiness", not under bakeoff itself. Cross-check
   the run's "Triggered by" line.
2. The file briefly had a different trigger in an earlier branch revision and those
   runs persist in history. The current trigger set is `workflow_dispatch` + hourly
   `cron` only — verify with:
   ```bash
   sed -n '/^on:/,/^[a-z]/p' .github/workflows/gold-provider-bakeoff.yml
   ```
3. The hourly cron only runs from the default branch in normal operation; if you saw
   runs attributed to the PR head SHA, that is GitHub showing the schedule run that
   happened to coincide with the PR being open.

In all three cases the current state is safe: no `push` trigger on any
bakeoff/test/smoke workflow.

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
