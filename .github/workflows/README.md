# GitHub Actions workflows

This directory holds every CI / ops / content workflow for the repo.
Each workflow file starts with a standard classification header so
contributors can tell at a glance whether the workflow is a blocking
merge gate or informational. Four tiers are in use:

## Tier 1 — Required merge gates

Must be green for a PR to merge. Failures here block the PR.

| File | What it protects |
| ---- | ---- |
| `ci.yml` | lint, unit tests, `npm run validate`, production build, Playwright smoke |

## Tier 2 — Informational scans

Run on every push/PR, surface findings to the Security tab or as logs,
but do **not** block merges. Promote a check here to Tier 1 by moving
its step into `ci.yml` after it has been stable for a while.

| File | What it reports |
| ---- | ---- |
| `codeql.yml` | CodeQL static analysis (JS/TS), findings in Security tab |
| `perf-check.yml` | Playwright + image-audit, visibility only (uses `\|\| true`) |
| `lighthouse.yml` | Manual-only Lighthouse CI run (`workflow_dispatch`) |

## Tier 3 — Production deploy

Not a merge gate — runs after merge to publish the site.

| File | Trigger |
| ---- | ---- |
| `deploy.yml` | Push to `main` publishes `dist/` to GitHub Pages |

## Tier 4 — Scheduled operational / content jobs

Periodic bots. Failures here are visible in the Actions tab but do not
affect any PR. Most carry `contents: write` scope on a single job to
commit derived data; others only read and post to external APIs.

| File | Cadence | Effect |
| ---- | ---- | ---- |
| `health_check.yml` | daily | smoke-tests public URLs + upstream APIs |
| `uptime-monitor.yml` | every 30 min | pings live site, reports failures |
| `spike_alert.yml` | every 15 min | detects price spikes, posts alerts |
| `post_gold.yml` | every 6 min while markets are open | posts changed gold prices to X (content bot) |
| `daily-newsletter.yml` | daily | generates + dispatches daily digest |
| `weekly-newsletter.yml` | weekly | generates + dispatches weekly digest |
| `sync-db-to-git.yml` | `repository_dispatch` | syncs admin DB to `data/shops.json` |

## Conventions

- Every workflow uses `actions/checkout@v6` and `actions/setup-node@v6`
  with `node-version: 24` and `cache: npm`. Please match that when
  adding a new workflow.
- Every workflow declares `permissions: contents: read` at the top
  level. Jobs that must commit elevate with a per-job
  `permissions: contents: write`. Stay least-privilege.
- Every workflow has a `timeout-minutes:` on its jobs to prevent a
  runaway run from burning minutes. Default to 20 minutes.
- Workflows that can overlap (CI on the same PR, deploy of `main`,
  any scheduled bot) set a `concurrency:` group with
  `cancel-in-progress: true` for PR-scoped groups and `false` for
  serialized production jobs (e.g. `deploy.yml`, `sync-db-to-git.yml`).
- Tier-2 informational workflows may end with `|| true` to avoid
  surfacing noisy failures as merge-blocking red X marks. Tier-1
  `ci.yml` never does.

## How to classify a new workflow

Add a top-of-file comment block like this, then update the table
above:

```yaml
# ------------------------------------------------------------------
# <Workflow name> — <one-line purpose>.
# <Short explanation of trigger / cadence / side effects>.
# Tier: <merge gate | informational scan | production deploy | content / sync bot>
# ------------------------------------------------------------------
name: <Workflow name>
```
