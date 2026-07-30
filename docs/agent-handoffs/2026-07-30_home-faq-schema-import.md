# Home FAQ schema import repair handoff

- Task selected: Repair the homepage's missing imports for the existing FAQ schema helpers.
- Why selected: `npm run lint` reproduced two `no-undef` errors in a public-page entry module; the
  fix is low-risk and non-owner-gated.
- Branch: `codex/initial-safe-phase`
- Commit: `4f5266a6d0` (implementation commit)
- Pull request: pending
- Main files changed: `src/pages/home.js`, `docs/plans/2026-07-30_home-faq-schema-import.md`,
  `docs/AGENT_MASTER_TRACKER.md`
- Checks: baseline install passed; baseline lint failed on the two missing imports; baseline unit
  suite has unrelated redirects/network failures; post-fix results pending.
- Current status: implementation complete; PR preparation pending branch push.
- Remaining risk: browser verification may be limited if Playwright browsers are not installed; full
  validation/build may expose existing generated-artifact drift.
- Owner decisions required: None.
- Recommended next safe task: Reconcile the tracker’s stale open-phase rows against current
  GitHub/main reality before starting another feature phase.
- Follow-up prompt:
  `Continue GoldTickerLive from the current branch/PR. Re-read AGENTS.md, docs/AGENT_MASTER_TRACKER.md, PLAN.md, and current GitHub state; verify the FAQ-schema import repair, then select the next non-owner-gated PR-sized task without merging.`
