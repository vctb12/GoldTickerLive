## Summary

Describe the purpose of this PR and the high-level changes.

## Implementation notes

- Phase commits are grouped and labeled `phx/NN:` where `NN` is the phase number.
- Include link-check, smoke tests, and server fallback changes.

## Checklist
- [ ] Run `npm ci` and `npm run quality`
- [ ] Run `npm run build` and `node scripts/node/check-links.js --dir dist`
- [ ] Playwright smoke tests: `npm run test:playwright`

## Gold provider bakeoff checklist

Only applies to PRs that touch the gold provider adapters, bakeoff scripts, X duplicate-post
guard, or production gold-price workflows. See
[`docs/OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md`](../docs/OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md)
for the full owner-side checklist.

- [ ] This PR is **Draft** until bakeoff results exist
- [ ] No production cutover unless explicitly approved
- [ ] Provider secrets added (≥ 2 candidates)
- [ ] Provider smoke test run (`test-gold-providers.yml`)
- [ ] 24h+ bakeoff complete (`gold-provider-bakeoff.yml`)
- [ ] Scorecard reviewed (`data/provider_scorecard.json`)
- [ ] Winning provider selected
- [ ] Backup provider selected
- [ ] Operator checklist filled (`docs/operator-inputs-gold-provider-bakeoff.md`)
- [ ] Dry-run tweet tested with real data (`DRY_RUN_TWEET=true`)
- [ ] Rollback path confirmed (legacy `post_gold.yml` can be re-enabled)
- [ ] `python scripts/python/gold_bakeoff_readiness.py --strict` passes

