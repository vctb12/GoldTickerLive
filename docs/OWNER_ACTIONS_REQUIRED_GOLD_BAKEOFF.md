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
