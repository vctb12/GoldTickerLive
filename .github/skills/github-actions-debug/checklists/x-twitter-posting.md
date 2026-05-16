# X / Twitter Posting Checklist (`post_gold.yml`)

**This workflow is production.** Treat any change as a public-facing release.

```md
## Pre-change
- [ ] Read `docs/TWITTER_AUTOMATION.md` and `docs/X_AUTOMATION_OBSERVABILITY.md`
- [ ] Confirm last 24h of runs in `data/automation-*.json` look healthy
- [ ] Plan supports `workflow_dispatch` + `dry_run: true`

## Logic
- [ ] Tweet body assembled from current pricing snapshot (not stale)
- [ ] Price age check: if > threshold, post "market closed" or skip
- [ ] Final tweet length ≤ 280 chars (URL counts as 23)
- [ ] Duplicate detection: if X returns 187 or 403 (duplicate), back off (do NOT retry blind)
- [ ] State persisted to `data/*.json` so the next run won't repeat
- [ ] Logs include status codes and timestamps — never secrets or full response bodies

## Verification
- [ ] Dispatched with `dry_run: true`; tweet text reviewed in logs
- [ ] Dispatched once live in a controlled window if the change is significant
- [ ] First scheduled run after merge monitored

## Failure modes
- [ ] OAuth/403 → rotate credentials (note: this is an operator step, not a code fix)
- [ ] 187 duplicate → state file out of sync; investigate freshness pipeline
- [ ] 429 rate limit → enforce minimum interval between dispatches
- [ ] Empty price → upstream provider outage; market-closed message posted instead

## Safety
- [ ] No secrets in logs (no `set -x`, no `env | sort`, no echo of `${{ secrets.* }}`)
- [ ] `permissions: contents: write` only for observability commit step
- [ ] `[skip ci]` on state-commit so it doesn't re-trigger CI
```
