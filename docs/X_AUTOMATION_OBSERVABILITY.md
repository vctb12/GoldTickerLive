# X Automation Observability

This document covers operational visibility for `.github/workflows/post_gold.yml` and
`scripts/python/post_gold_price.py`.

## What is now recorded

Each run emits a structured JSON result and markdown report with:

- `run_id`
- `trigger_source`
- `dry_run`
- `force_post`
- `post_intent`
- `market_open`
- `price_source`
- `price_freshness`
- `template_used`
- `duplicate_guard_result`
- `status` / `outcome` (posted/skipped/failed)
- `error_summary`
- `tweet_length`
- `created_at`

The workflow writes:

- `${{ runner.temp }}/post-gold-result.json`
- `${{ runner.temp }}/post-gold-report.md`

and uploads them as the **post-gold-observability** artifact.

## Optional run sync storage

When `X_AUTOMATION_OBSERVABILITY_SYNC=true`:

- Primary target: Supabase tables `automation_runs`, `tweet_posts`, `tweet_failures`
- Fallback target (if Supabase unavailable): JSON files
  - `X_AUTOMATION_RUNS_FILE` (default `data/automation_runs.json`)
  - `X_AUTOMATION_POSTS_FILE` (default `data/tweet_posts.json`)
  - `X_AUTOMATION_FAILURES_FILE` (default `data/tweet_failures.json`)

No posting policy is changed by observability sync.

## Admin visibility

`GET /api/v1/admin/ops/x-automation` now returns:

- Last successful post
- Last failed post
- Last skipped reason
- Current state hash
- Recent dry runs
- Closed-market status snapshot
- Provider freshness at post time

The Social admin page surfaces this in **X Automation Observability**.

## Operator runbook

### Normal run (scheduled)

- Trigger: schedule in `post_gold.yml`
- Expected: `status=posted` or intentional `status=skip`
- Check: Actions run summary and observability artifact

### Dry run

- Trigger: `workflow_dispatch` with `dry_run=true`
- Expected: `outcome=DRY_RUN_READY`, no X API post
- Check: report includes full run context and guard result

### Force post

- Trigger: `workflow_dispatch` with `force_post=true`
- Effect: bypasses cooldown only (not all guards)
- Check: `force_post=true` in result, inspect `duplicate_guard_result`

### Must post

- Trigger: `workflow_dispatch` with `post_intent=must_post`
- Effect: bypasses soft guard reasons; still respects hard blockers
- Check: `post_intent=must_post`, verify any bypass details in run report

### Closed-market post

- Trigger: operator dispatch outside market hours
- Expected: `post_type=market_closed_reference` with explicit labeling
- Check: `market_open=false`, freshness and source fields in report

### Failure diagnosis

1. Open Actions run summary and read `error_summary`, `operator_action`, `retry_after_seconds`.
2. Download **post-gold-observability** artifact.
3. Check `duplicate_guard_result`, `price_freshness`, and `trigger_source`.
4. If needed, use `/api/v1/admin/ops/x-automation` in admin for latest failure and skip context.
