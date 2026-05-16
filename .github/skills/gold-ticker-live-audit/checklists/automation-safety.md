# Automation Safety Checklist

For any GitHub Actions / workflow / X-posting / automation change.

```md
- [ ] `permissions:` block declared and minimal
- [ ] `workflow_dispatch` supported for any workflow with side effects
- [ ] `dry_run` input gate for any workflow that posts / sends mail
- [ ] No `set -x` on steps that touch `${{ secrets.* }}`
- [ ] Secrets referenced by name only — never echoed
- [ ] Boolean `workflow_dispatch` inputs handled as strings (`!= 'true'`)
- [ ] `post_gold.yml` changes tested with `dry_run: true` before merge
- [ ] Tweet length ≤ 280 chars (URL counts as 23 after shortening)
- [ ] Duplicate-tweet (X 403/187) handled with back-off, not retry
- [ ] Stale-price guard in place (don't post stale as live)
- [ ] State files committed by the workflow itself use `[skip ci]`
- [ ] New provider added → smoke test + bakeoff entry, not production switch
- [ ] Telegram / Discord webhook URLs gated behind `if: always()` (don't break main job)
- [ ] `permissions: contents: write` only when committing observability JSON
- [ ] Schedule cron in UTC, documented with human-readable cadence
- [ ] No production secrets in workflow `env:` blocks (use `secrets.*`)
- [ ] Logs reviewed via GitHub MCP tools (`get_job_logs`) after any change
```

See [`.github/instructions/github-actions.instructions.md`](../../../instructions/github-actions.instructions.md)
and [`docs/X_AUTOMATION_OBSERVABILITY.md`](../../../../docs/X_AUTOMATION_OBSERVABILITY.md).
