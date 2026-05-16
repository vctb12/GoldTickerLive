---
applyTo: ".github/workflows/**,scripts/**,server/**,config/**,docs/**automation*,docs/**twitter*,docs/**x*,docs/**provider*"
---

# GitHub Actions Instructions

Workflows under `.github/workflows/` ship to production. `post_gold.yml` runs **hourly** and
posts to `@GoldTickerLive` on X. Read this file before changing any workflow.

## 1. Workflow inventory (current)

| Workflow                          | Purpose                                                      | Trigger                  |
| --------------------------------- | ------------------------------------------------------------ | ------------------------ |
| `ci.yml`                          | Lint + build + tests on PRs                                  | `pull_request`           |
| `codeql.yml`                      | CodeQL static analysis                                       | `push`, `pull_request`, `schedule` |
| `deploy.yml`                      | Build + deploy to GitHub Pages                               | `push` to `main`         |
| `post_gold.yml`                   | **Production** — hourly X post                               | `schedule`, `workflow_dispatch` |
| `daily-newsletter.yml`            | Daily newsletter send                                        | `schedule`, `workflow_dispatch` |
| `weekly-newsletter.yml`           | Weekly digest                                                | `schedule`, `workflow_dispatch` |
| `check-alerts.yml`                | User alert evaluation                                        | `schedule`, `workflow_dispatch` |
| `spike_alert.yml`                 | Price-move spike detection                                   | `schedule`, `workflow_dispatch` |
| `health_check.yml`                | Site health probe                                            | `schedule`, `workflow_dispatch` |
| `uptime-monitor.yml`              | Uptime monitor + alerting                                    | `schedule`, `workflow_dispatch` |
| `lighthouse.yml`                  | Perf audit                                                   | `pull_request`, `workflow_dispatch` |
| `perf-check.yml`                  | Perf budget enforcement                                      | `pull_request`           |
| `pr-provider-smoke.yml`           | Smoke test for provider adapters on PR                       | `pull_request`           |
| `gold-provider-bakeoff.yml`       | Compare providers on freshness / latency / cost              | `schedule`, `workflow_dispatch` |
| `gold-bakeoff-readiness.yml`      | Bakeoff dataset readiness gate                               | `workflow_dispatch`      |
| `test-gold-providers.yml`         | Provider connectivity matrix                                 | `workflow_dispatch`      |
| `gold-price-fetch.yml`            | Periodic price fetch + commit observability JSON             | `schedule`, `workflow_dispatch` |
| `sync-db-to-git.yml`              | Sync Supabase observability tables → committed JSON          | `schedule`, `workflow_dispatch` |

## 2. Permissions

- Every workflow declares `permissions:` explicitly. Default to least privilege.
- `contents: write` only when committing files (observability sync).
- `issues: write` / `pull-requests: write` only for jobs that comment / open PRs.
- Never use the implicit GITHUB_TOKEN scope without scoping it.

## 3. Triggers

- `schedule`: cron in UTC. Document the human-readable cadence in a comment next to it.
- `workflow_dispatch`: **all production workflows must support manual dispatch** with at least a
  `dry_run: true|false` input where the workflow has side effects (posting, sending mail).
- `push` on `main` only for deploys and analytics writes.
- Never trigger price-fetch / poster workflows on `push` — they belong on schedule / dispatch.

## 4. X / Twitter posting safety

`post_gold.yml` is **production**. Before changing logic:

1. Run with `workflow_dispatch` + `dry_run: true` and verify the generated tweet text in logs.
2. Confirm duplicate-tweet handling (X 403/187 means duplicate — the workflow must back off, not
   retry).
3. Tweet length ≤ 280 chars including the URL (X shortens links to 23 chars — count accordingly).
4. Stale price guard: if price age > threshold, post a "Market closed" or skip — never post stale
   as live.
5. State persistence: `data/*.json` observability logs are committed by the workflow itself (see
   `[skip ci]` commit messages). Don't bypass this.

## 5. Telegram / Discord notifications

- Webhook URLs come from secrets. Never log the URL itself — log only the response status.
- Failures must not break the rest of the workflow; gate notifications behind `if: always()`.

## 6. Provider smoke tests and bakeoff

- New provider adapter → add smoke test job in `pr-provider-smoke.yml` style + bakeoff entry in
  `gold-provider-bakeoff.yml`.
- Bakeoff results land in `docs/gold-price-provider-bakeoff.md` and `reports/`.
- Don't switch the production provider in the same PR that adds it. Separate PR after one full
  bakeoff window.

## 7. Logging without secrets

- Never `set -x` on a step that touches `${{ secrets.* }}`.
- Mask values manually: `echo "::add-mask::$SECRET"` if you must echo derived values.
- Don't `cat` a `.env` file. Don't `env | sort`.
- Test secret presence with `[ -n "${X_API_KEY:-}" ]`, never by echoing the value.

## 8. Caching, artifacts, state files

- Cache key includes lockfile hash. Re-using stale caches between Node versions breaks builds
  silently.
- Artifacts: short retention (7 days for logs, 30 days for reports). Don't upload secrets.
- State files (observability JSON) live in `data/` and are committed by the workflow itself.
  Schema in `docs/X_AUTOMATION_OBSERVABILITY.md`.

## 9. Common Actions-expression mistakes

- `${{ github.event.inputs.dry_run }}` is a **string** (`"true"` / `"false"`), not a boolean. Use
  `if: ${{ github.event.inputs.dry_run != 'true' }}`.
- Boolean inputs from `workflow_dispatch` are strings on the wire — same handling.
- `needs.<job>.outputs.<x>` is a string. Coerce in JS / bash.
- `if:` on a step ≠ `if:` on a job — step-level uses outputs from the same job; job-level uses
  `needs`.
- `runs-on: ubuntu-latest` floats; pin when reproducibility matters.

## 10. Workflow debug checklist

When a workflow fails:

```md
- [ ] Read the actual failing step's log (not just the job summary)
- [ ] Check whether it was a cancellation vs. a real failure
- [ ] Compare to the last successful run's environment (Node version, runner image)
- [ ] Confirm secrets are present (name only — never echo)
- [ ] Confirm permissions are sufficient (`permissions:` block)
- [ ] Re-run with `workflow_dispatch` + `dry_run: true` if available
- [ ] Check for upstream provider outages (3rd-party APIs)
- [ ] Inspect `data/*.json` observability logs for the same window
```

Use the GitHub MCP tools (`list_workflow_runs`, `get_job_logs`, `get_workflow_run`) — don't claim
you can't access logs.

## 11. CodeQL

- Findings on `main` block deploys (configurable). Triage in-PR by adding a `# codeql[suppress: ...]`
  comment only with justification, or refactor the code.
- Don't silence CodeQL globally to "unblock" a release.

See [`docs/AUTOMATIONS.md`](../../docs/AUTOMATIONS.md),
[`docs/TWITTER_AUTOMATION.md`](../../docs/TWITTER_AUTOMATION.md),
[`docs/X_AUTOMATION_OBSERVABILITY.md`](../../docs/X_AUTOMATION_OBSERVABILITY.md),
[`docs/gold-price-provider-bakeoff.md`](../../docs/gold-price-provider-bakeoff.md).
