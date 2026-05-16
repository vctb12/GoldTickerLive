---
name: github-actions-debug
description: Use for failed workflows, deployment issues, X/Twitter posting bugs, provider smoke / bakeoff failures, CodeQL findings, GitHub Pages deploy failures, or any CI investigation.
when_to_use:
  - A scheduled or PR workflow turned red
  - Hourly `post_gold.yml` is silent or duplicating
  - Provider smoke / bakeoff fails on a PR
  - GitHub Pages deploy is not picking up changes
  - CodeQL flags a finding
related_files:
  - .github/workflows/**
  - scripts/python/**
  - docs/AUTOMATIONS.md
  - docs/TWITTER_AUTOMATION.md
  - docs/X_AUTOMATION_OBSERVABILITY.md
  - docs/gold-price-provider-bakeoff.md
related_prompts:
  - .github/prompts/workflow-debug.prompt.md
  - .github/prompts/x-twitter-automation-review.prompt.md
  - .github/prompts/provider-bakeoff.prompt.md
---

# Skill: GitHub Actions Debug

Systematic triage for workflow failures, with extra care for the production X-post and the
provider bakeoff system.

## Inputs to gather

- Workflow file path (`.github/workflows/<name>.yml`)
- Failed run ID and / or last successful run ID
- Recent diffs to the workflow file or to scripts it invokes
- Whether the failure is **new** or **flaky** (compare to last 5 runs)
- Whether secrets are present (check via job logs without echoing values)

Use the GitHub MCP tools:

- `list_workflow_runs` — filter by workflow + status
- `get_workflow_run` — top-level details
- `get_job_logs` — actual step logs (use `failed_only: true` + `tail_lines`)
- `get_workflow_job` — single job, including step-by-step status

## Step-by-step workflow

1. **Triage**: was this a cancellation, timeout, or real failure?
2. **Compare**: get logs from the last successful run; diff env (runner image, Node / Python
   version, action versions).
3. **Reproduce**: re-run with `workflow_dispatch` + `dry_run: true` if the workflow supports it.
4. **Localize**: identify the specific step. Read the actual log, not the job summary.
5. **Fix**: change the smallest thing that addresses root cause (not just the symptom).
6. **Verify**: re-dispatch; if it's a scheduled workflow, monitor the next scheduled run.
7. **Document**: if it's a known failure mode (rate limits, provider outages, duplicate tweets),
   add it to the relevant checklist below.

## Checklists in this skill

- [`checklists/workflow-triage.md`](./checklists/workflow-triage.md) — generic failure triage
- [`checklists/x-twitter-posting.md`](./checklists/x-twitter-posting.md) — `post_gold.yml` specific
- [`checklists/provider-bakeoff.md`](./checklists/provider-bakeoff.md) — bakeoff / smoke
- [`checklists/pages-deploy.md`](./checklists/pages-deploy.md) — GitHub Pages deploy

## Common failure modes

| Symptom                                | Likely cause                                            | Fix                                  |
| -------------------------------------- | ------------------------------------------------------- | ------------------------------------ |
| Step succeeds but next step skipped    | `if:` condition string vs. boolean                      | `if: github.event.inputs.x != 'true'`|
| `command not found: linkinator`        | `npm ci` not run before `npm run linkcheck`             | Add install step                     |
| X API returns 403                      | Duplicate tweet OR auth credentials rotated             | Check duplicate-detect; rotate creds |
| Tweet `>280 chars`                     | URL not counted as 23, or templated copy too long       | Use length check incl. URL = 23      |
| `permissions: contents: write` denied  | `permissions:` block missing or scoped wrong            | Add explicit permissions             |
| CodeQL finds path-traversal            | `fs.readFile(userInput)` without allowlist              | Add path-normalize + allowlist root  |
| Pages deploy stale                     | Workflow built old commit; rerun                        | Re-run deploy job; check artifact    |
| Provider smoke flaky                   | 3rd-party rate limit or transient outage                | Retry once; alert if persistent      |

## Final report template

```md
# Workflow Debug Report — <workflow file>

## Failure
- Run: <link>
- Step: <step name>
- Error: <one-line>

## Root cause
<short explanation>

## Fix
- <file>: <what changed>

## Verification
- Re-dispatched with `dry_run: true`: <link, outcome>
- Next scheduled run will confirm

## Risks / follow-ups
- <e.g. provider rate limit may recur — open issue>
```
