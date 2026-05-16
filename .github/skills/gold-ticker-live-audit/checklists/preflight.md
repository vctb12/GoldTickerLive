# Preflight Checklist

Run this before touching any code in a Gold Ticker Live session.

```md
- [ ] Read `AGENTS.md` end-to-end (canonical charter)
- [ ] Read `.github/copilot-instructions.md` (always-on)
- [ ] Identify which `.github/instructions/*.instructions.md` files apply
- [ ] `git status` clean; on the right branch (never `main`)
- [ ] `git log --oneline -10` to see recent direction
- [ ] `cat package.json | jq .scripts` to know which commands exist
- [ ] Check `docs/REVAMP_PLAN.md` for related in-progress work
- [ ] Check `docs/plans/` for matching proposal
- [ ] Identify the smallest coherent unit of work that achieves the goal
- [ ] If >2h of work: draft a plan file before editing
- [ ] Remove `playwright-report/` and `test-results/` before any validate / test run
- [ ] Confirm you understand the AED peg (3.6725) and won't change it without owner approval
- [ ] Confirm you understand the reference vs. retail bright line
```
