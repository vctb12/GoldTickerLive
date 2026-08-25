# Open-PR Merge Campaign Audit — 2026-08-25

## Campaign state

- **Status:** `blocked-before-merge`
- **Frozen at:** `2026-08-25T14:40:43Z`
- **Repository:** `vctb12/GoldTickerLive`
- **Target branch:** `main`
- **Frozen main SHA:** `4da24841878f10c7a0f59bc7e6ed3ab2c00a10ee`
- **Campaign branch:** `codex/open-pr-merge-campaign-2026-08-25`
- **Reconciliation PR:** [#775](https://github.com/vctb12/GoldTickerLive/pull/775) (draft/unmerged)
- **Execution rule:** the seven PRs below are the immutable execution-time set. PRs opened after the
  freeze are outside this campaign unless they are the final reconciliation PR.

This audit records what was observed at campaign start. Mergeability and check results are
time-sensitive; every merge candidate must be updated onto the then-current `main`, re-reviewed, and
proved again at the exact expected head SHA before merge.

## Repository settings baseline

GitHub reported `main` as **not protected** and reported required-status-check enforcement as off.
The repository permits merge commits, squash merges, and rebase merges, and does not automatically
delete merged branches. This is an operational control gap, so the campaign supplies its own
expected-head guard, current-head check gate, and one-at-a-time merge discipline. No repository
setting will be weakened or changed by this campaign.

The repository's canonical `CI` workflow (`.github/workflows/ci.yml`, workflow ID `260164546`) is
currently `disabled_manually`. `AGENTS.md` identifies that workflow as the merge gate, but no frozen
or repaired PR head has a current `CI` result. CodeQL, Lighthouse, link, and Perf/QA checks do not
replace that missing gate—especially because some auxiliary jobs mask failures. Re-enabling a
manually disabled repository workflow is an owner-controlled settings action and was not inferred
from this campaign. This blocks every merge and therefore blocks deployment/release smoke.

## Immutable execution-time PR set

| PR                                                        | Title                                          | Author            | Draft | Frozen head SHA                            | Creation-base SHA | Initial GitHub state                                   | Initial disposition                                                                                                           |
| --------------------------------------------------------- | ---------------------------------------------- | ----------------- | ----- | ------------------------------------------ | ----------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| [#754](https://github.com/vctb12/GoldTickerLive/pull/754) | Bump production dependencies                   | `dependabot[bot]` | No    | `b818df12e8ddb943bd3275ebebcfe137c660dd3c` | `7a9d8…`          | clean/mergeable; prior-head checks green               | `PASS-WITH-FRESHEN` — rebase and re-run dependency/security proof                                                             |
| [#759](https://github.com/vctb12/GoldTickerLive/pull/759) | Unify freshness across tracker and calculators | `cursor[bot]`     | No    | `91fd56f6e709a32c4ff3062487baa91b518f60b3` | `ae950…`          | clean/mergeable; prior-head checks green               | `PASS-WITH-FIX` — confirm requested propagation, add caller-level proof, correct review record, then update and run full gate |
| [#767](https://github.com/vctb12/GoldTickerLive/pull/767) | Bump development dependencies                  | `dependabot[bot]` | No    | `675de500db79144b0be9210b408d8cba06c4c3a7` | `7a9d8…`          | clean/mergeable; prior-head checks green               | `BLOCKED-BY-ORDER` — land #754 first, then rebase and regenerate lockfile proof                                               |
| [#768](https://github.com/vctb12/GoldTickerLive/pull/768) | Bump CodeQL Action                             | `dependabot[bot]` | No    | `63b44c1b41d51538e7f353993571aac674651b17` | `7a9d8…`          | clean/mergeable; prior-head checks green               | `PASS-WITH-FRESHEN` — first candidate after current-head workflow proof                                                       |
| [#770](https://github.com/vctb12/GoldTickerLive/pull/770) | Add gated multi-metal tracker foundation       | `codex`           | Yes   | `d3126a03e887c1b97e7ea4fa71da32d78950947b` | `d60df31…`        | merge state initially unknown; prior-head checks green | `PASS-WITH-FIX` — repair known UX/parity issues, keep production pilot off, then rebase and prove                             |
| [#772](https://github.com/vctb12/GoldTickerLive/pull/772) | Add DataCore historical-truth foundation       | `codex`           | Yes   | `8559b09208e6a3872c0c68177de5621f9efb82ea` | `51db018…`        | clean/mergeable; prior-head checks green               | `PASS-WITH-REBASE` — highest-risk data/Supabase scope; rebase after #770 and run focused plus full proof                      |
| [#774](https://github.com/vctb12/GoldTickerLive/pull/774) | Rebase before `post_gold` push retries         | `cursor[bot]`     | Yes   | `45a88ca246f1d1e27ef34b2f09e8d01b40f57d42` | `010a763…`        | clean/mergeable; prior-head checks green               | `BLOCKED` — edits production-critical `post_gold.yml`, which this campaign must not modify or merge                           |

All seven creation bases predate the frozen `main`. A green check from a frozen head is evidence
about that old head only; it is not merge permission.

## Review and discussion baseline

- GitHub reported no submitted approval/change-request reviews and no unresolved inline review
  threads on the frozen PR set.
- #759 contains an owner comment requesting propagation of
  `hasLiveFailure: STATE.freshness.goldHasLiveFailure` into calculator ticker/spot-bar rendering.
  The branch contains a follow-up commit, but the exact behavior and regression tests still require
  local verification.
- Bugbot comments that report a usage limit are neutral automation state, not approval evidence.
- #774's own PR body identifies `post_gold.yml` as production-critical and requires owner review;
  the campaign brief independently forbids merging that surface.

## File overlap and dependency graph

| PR pair     | Shared path                         | Consequence                                                                                                                     |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| #754 ↔ #767 | `package.json`, `package-lock.json` | Hard serial order: production dependency update first, then rebase development dependencies and validate the combined lockfile. |
| #770 ↔ #772 | `docs/AGENT_MASTER_TRACKER.md`      | Semantic conflict risk: rebase #772 after #770 and preserve both tracker histories without duplicate active-state claims.       |

No other exact changed-path overlap was present at freeze time. Semantic overlap is still reviewed
even where path overlap is absent.

```text
#768 ──> #759 ──> #754 ──> #767 ──> #770 ──> #772 ──> final reconciliation
                              │                     │
                              └─ combined lockfile  └─ tracker/data-contract re-review

#774 ──> BLOCKED outside the merge conveyor (`post_gold.yml` hard stop)
```

## Known repair obligations

### #770 — multi-metal tracker

1. Prevent the gold-specific AED 24K/g strip from remaining visible when Silver or Platinum is
   selected.
2. Restore the missing Arabic equivalent of “Open advanced workspace.”
3. Make the fourth metal discoverable in the selector overflow and bring a focused/selected metal
   into view in LTR and RTL, while honoring reduced-motion preferences.
4. Keep `METALS_PILOT_ENABLED = false`; do not activate non-gold production data.

### #772 — DataCore

1. Treat provider provenance, retention, freshness, gaps, and correction lineage as integrity
   controls, not display details.
2. Keep database migration application and production activation owner-gated; source-controlled
   migrations may be reviewed, but this campaign performs no production database write.
3. Rebase after #770 and verify the combined tracker normalization/data-contract behavior.

## Initial findings

| Severity | File or page                                     | Issue                                                                                                                                        | Impact                                                                                                                                      | Exact fix                                                                                                                                                                                                                                               | Repeat pattern                        |
| -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| block    | GitHub Actions / `.github/workflows/ci.yml`      | The canonical merge-gate workflow is `disabled_manually`, so repaired PR heads never receive the required lint/test/validate/build evidence. | Merging would bypass the repository's stated gate and make current-head safety unverifiable.                                                | Owner must explicitly decide whether to re-enable CI. After it is enabled, update each candidate onto current `main`, require a green exact-head CI run, and restart the conveyor at #768. Do not substitute non-gating checks.                         | Protected merge-gate discipline.      |
| high     | GitHub repository settings / `main`              | Branch protection and required-status enforcement are absent.                                                                                | A stale or unchecked head could otherwise be merged, weakening release reliability.                                                         | For this campaign, compare the live PR head with the recorded expected SHA immediately before each merge, require current-head checks, and merge sequentially. Recommend owner-configured protection in final handoff; do not change settings silently. | Prior repository-governance finding.  |
| block    | `.github/workflows/post_gold.yml` in #774        | The PR changes a production-critical posting workflow that the campaign explicitly forbids modifying or merging.                             | A retry/rebase change could affect posting state, duplicate prevention, or production automation.                                           | Leave #774 unmerged and open with a formal blocked disposition; owner must run a separate workflow-specific review campaign if desired.                                                                                                                 | Protected-workflow guardrail.         |
| high     | #770 tracker UI                                  | Three known UX/EN–AR issues remain before the draft can be release-ready.                                                                    | Users can see a gold-specific unit/value while another metal is selected, Arabic loses parity, and the fourth option can be undiscoverable. | Implement the three enumerated repairs, add focused tests, run 360px EN/AR/RTL/reduced-motion browser proof, and keep the pilot off.                                                                                                                    | Multi-metal parity/freshness pattern. |
| high     | #772 data and Supabase surfaces                  | Large data-integrity scope is based on stale main and follows #770's related tracker foundation.                                             | Incorrect provenance, retention, or migration assumptions could misstate historical truth or create unsafe activation pressure.             | Rebase after #770, review migrations without applying them to production, run focused integrity/RLS tests plus the full gate, and keep activation owner-gated.                                                                                          | Data provenance before presentation.  |
| medium   | `package.json`, `package-lock.json` in #754/#767 | Two dependency PRs touch the same manifest and lockfile from the same stale creation base.                                                   | Independent merging can overwrite lockfile resolution or conceal combined advisories/regressions.                                           | Merge #754 first; rebase #767 onto that exact main; verify installed versions, lockfile diff, audit, tests, validate, and build.                                                                                                                        | Dependency ordering pattern.          |

## Review outcomes and repairs

### #768 — CodeQL Action

- **Package/content verdict:** pass. The diff changes only the `init` and `analyze` immutable pins
  from v4.37.7 to official stable v4.37.8 commit `db488ddef3bf6cb639b32c2e9a7c0a7ea8271d28`; the
  upstream commit signature is valid and the release documents no user-facing changes.
- **Workflow review:** YAML parses; triggers, permissions, language/build-mode matrix, upload
  categories, and all other steps are unchanged.
- **First refreshed head:** `891612de8a0f9732eed62744c39c54f7d7b82c0f` on base
  `82f0947f0a89900a5a602f552dd70ef2bcc38ff7`; all five GitHub checks passed, but scheduled data
  automation advanced `main` before completion.
- **Second refreshed head:** `c4cb80eef57f61f89807a12f60853b50fc3269c3` on base
  `558108ae53504de2793e883abf6e5727401a163b`; checks pending at this checkpoint.
- **Local proof on first refreshed head:** lint and build passed. Unit suite produced 1,847 passes,
  two skips, and three classified environment failures: two tests construct a POSIX-style Windows
  working directory before spawning `python3`, and one read-only provider audit was initially
  network-blocked but passed when rerun with access. `validate` reached repository validation clean
  but failed the pre-existing generated theme-preinit consistency check; build then regenerated the
  same 23 pages and passed. No generated output was retained.
- **Review-record repair:** PR body now uses What/Why/How/Proof/Risks and no longer relies on
  generic Dependabot prose alone.
- **Current disposition:** `BLOCKED-BY-MERGE-GATE`, not merged. The refreshed head's available
  CodeQL/Perf checks passed, but canonical CI is absent because that workflow is manually disabled;
  scheduled data commits also keep advancing `main`. The exact-head and current-CI gates were not
  satisfied.

### #759 — freshness trust

- **Implementation verdict:** pass. At original head `91fd56f6e7`, calculator state forwards
  `goldIsFresh`, `goldIsFallback`, and `goldHasLiveFailure` unchanged to its badge, ticker, and spot
  bar. The rejected `freshness.key !== 'live'` inference is absent.
- **Repair commit:** `8a82c61392` adds a fixed market-open, 45-minute, non-fallback browser fixture
  and proves the calculator badge, bottom ticker, and top spot bar all remain `delayed` rather than
  being recast as `cached` or `live`.
- **Focused proof:** 34/34 freshness unit tests passed; the new Chromium caller-level regression
  passed 1/1; ESLint and lint-staged passed. The existing four EN/AR/360px stale-snapshot Chromium
  scenarios also reached passing results in the campaign run.
- **Review-record repair:** removed the false statement that Cursor Bugbot reviewed the PR (its run
  reported a usage limit), replaced the body with honest current evidence, and posted proof in
  response to the owner correction comment.
- **Current disposition:** `BLOCKED-BY-MERGE-GATE`, not merged. It must still follow #768, update
  onto the resulting `main`, and run the full current-head gate after canonical CI is restored.

### #754 and #767 — dependency sequence

- **Package-content verdict:** pass for the intended releases; both PRs remain merge-blocked by
  stale bases, missing hard CI evidence, masked Playwright/link failures, and required serial order.
- **#754:** `lightweight-charts` 5.2.0 → 5.2.1 and `stripe` 22.4.0 → 22.5.0 only. Both releases are
  stable. Existing chart APIs remain supported; the repository does not call Stripe's new
  without-verification helpers and still uses signature-verified webhook construction.
- **#767:** `linkinator` 8.0.3 → 8.0.4 and `vite` 8.2.1 → 8.2.2, with expected Rolldown/PostCSS/
  Nanoid lock updates. Releases are stable and Node 24-compatible.
- **Advisory baseline:** `npm ci` on current package state reports eight high-severity advisories;
  the added #754 package nodes have no dependency-review alert. #767 reduces the count to seven by
  resolving the Nanoid advisory, while the unchanged `extract-zip` development-transitive advisory
  has no listed patched version.
- **Evidence caveat:** green Perf/QA masks eight Playwright failures via `|| true`; green link
  checks also contain a non-enforced checker path. Exact-current-main baseline comparison and hard
  commands are required after sequential updates.
- **Review-record repair:** both PR bodies now use What/Why/How/Proof/Risks and state the advisory,
  masked-check, stale-base, dependency-order, and manually-disabled-CI caveats explicitly.
- **Current disposition:** `BLOCKED-BY-MERGE-GATE`; neither dependency branch was updated or merged.
  #767 remains additionally blocked behind #754's combined lockfile state.

### #774 — production posting workflow

- **Technical finding:** the cited push race is real and the proposed helper uses fetch/rebase plus
  ordinary fast-forward push retries, not force. However no modified-workflow dry run or controlled
  concurrent-commit proof exists.
- **Governance finding:** the sole changed file is `.github/workflows/post_gold.yml`, an explicit
  campaign hard stop and production-critical surface.
- **Final campaign disposition:** `BLOCKED`; do not update, edit, mark ready, or merge. Keep it open
  as an owner-gated exception unless the owner separately authorizes a workflow-specific campaign.
- **Review-record repair:** the PR body now begins with the blocked/owner-gated disposition and uses
  What/Why/How/Proof/Risks without implying campaign authorization.

### #770 — gated multi-metal tracker

- **Repair commit:** `ea01bf50a3` (`fix: repair multi-metal mobile trust states`) hides the
  gold-only AED 24K/gram strip whenever a non-gold metal is selected, localizes the stateful
  advanced-workspace control and overflow hint in EN/AR, and reveals focused/selected tabs in LTR
  and RTL with reduced-motion-safe scrolling.
- **Scope integrity:** `METALS_PILOT_ENABLED` remains `false`; no protected price constants,
  provider source, production workflow, service worker, secret, dependency, billing, database, or
  non-gold history surface changed.
- **Focused proof:** 73/73 tracker/i18n/DOM tests passed; full lint and build passed. Manual in-app
  browser proof covered EN Silver, AR Silver/RTL, and deep-linked Palladium at 360 px. Before/after
  screenshots are retained under `docs/audits/evidence/2026-08-25_pr770/` on this campaign branch.
- **Broader proof caveat:** the full suite reported 1,867 passes, four classified
  baseline/environment failures, and one skip. `validate` passed the main validator and then stopped
  on the existing generated theme-preinit drift. The configured Playwright server could not start
  because `python3` is unavailable on this Windows environment; the new spec was linted, while exact
  states were exercised manually in the user's in-app browser.
- **GitHub proof:** the repaired exact head's available CodeQL, Lighthouse, link, and Perf/QA checks
  are green. Canonical CI is still absent.
- **Known separate baseline:** Arabic historical-resolution details originate as English strings in
  `src/lib/historical-data.js`. This predates the repair and remains an activation blocker rather
  than grounds to broaden #770 silently.
- **Current disposition:** `BLOCKED-BY-MERGE-GATE`, draft and not merged. The three campaign
  findings are repaired, but CI restoration, current-main update, and exact-head proof remain
  mandatory.

### #772 — DataCore historical truth

- **Original audit verdict:** blocked. The first draft could install append-only triggers before its
  next migration's backfill, exposed raw columns through broad grants, omitted correction wiring at
  the sync caller, hashed unrelated aggregate telemetry into identity, used unpaginated PostgREST
  reads, published/wrote before a blocking quality gate, hard-coded duplicate evidence, and served
  unresolved corrections from Supabase history/latest paths.
- **Repaired exact head:** `4801fd538357f5ad75d8568addaca4848ec62024`. Seven focused repair commits
  now cover correction-effective history/latest reads, safe migration ordering, restricted
  grants/RLS, canonical identity and cross-run lineage, tuple-keyset PostgREST reads, pre-mutation
  blocking gates, correction-target validation, truthful duplicate/rehydration metrics, and
  regenerated bootstrap provenance artifacts.
- **Local proof:** 61/61 focused DataCore history/migration/pipeline/API tests passed; lint and
  build passed; the full suite recorded 1,899 passes, four known environment/baseline failures, and
  one skip out of 1,904 tests. Validation cleared the substantive
  integrity/governance/DOM/shell/a11y/metadata stages and then stopped at the pre-existing stale
  `reports/seo/inventory.json` check. Prettier and `git diff --check` passed.
- **Database boundary:** no migration was applied and no production database was accessed. Node
  tests inspect SQL shape; the expanded 54-assertion pgTAP suite still requires execution against a
  disposable or staging Supabase database, followed by RLS/grant checks, advisors, schema reload,
  rollback, and real workflow continuity evidence.
- **Workflow boundary:** #772 changes the production-critical `gold-price-fetch.yml`. Even after
  source repair, owner-approved staging continuity and exact workflow evidence remain required
  before that draft can be considered merge-ready.
- **Review record:** the draft PR body and proof comment now describe the repaired contract and its
  remaining gates:
  [exact-head proof](https://github.com/vctb12/GoldTickerLive/pull/772#issuecomment-5413717095).
- **GitHub proof:** all five available exact-head CodeQL and Perf/QA checks passed at `4801fd5383`;
  canonical CI is still absent because that workflow remains manually disabled.
- **Current disposition:** `BLOCKED-BY-MERGE-GATE-AND-STAGING`, draft and not merged. The branch
  follows #770 and was deliberately not rebased onto a hypothetical combined `main`; executable
  PostgreSQL/RLS proof and canonical CI cannot be claimed in this campaign.

## Merge gates

For each candidate, in order:

1. Capture the expected head SHA.
2. Update/rebase onto the latest `main` without rewriting unrelated user work.
3. Re-review the complete diff and all discussions at the updated head.
4. Run the change-specific proof and the full repository gate where proportionate.
5. Confirm GitHub checks are current and green for that exact head.
6. Re-read the remote head SHA and merge only if it still equals the expected SHA.
7. Verify the resulting `main` SHA and production state before continuing.

Any red, missing, stale, cancelled, or inconclusive evidence blocks the merge. Draft status is
removed only after the corresponding repair and proof are complete.

No candidate satisfied step 5: canonical CI evidence is missing for every exact head because the
workflow is manually disabled. Consequently no expected-head merge command, deployment, production
smoke, or rollback action was performed.

## Rollback preparation

- Record each pre-merge `main`, merged PR head, and post-merge `main` SHA.
- If production smoke reveals a regression, stop the conveyor immediately.
- Create a focused revert branch and PR for the identified merge; do not push a direct revert to
  `main` and do not conceal the failed release.
- Re-run checks and production smoke after the revert lands before considering any later PR.

## Campaign log

| UTC time         | Event                                                | Evidence / result                                                                                                                                                                                                                                               |
| ---------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-25 14:40 | Frozen execution-time set                            | Seven PRs: #754, #759, #767, #768, #770, #772, #774; `main` `4da2484187`.                                                                                                                                                                                       |
| 2026-08-25 14:40 | Recorded repository controls                         | `main` unprotected; required checks not enforced; merge methods enabled. Campaign-level expected-head and sequential gates activated.                                                                                                                           |
| 2026-08-25 14:49 | Refreshed #768, cycle 1                              | GitHub update-branch produced `891612de8a`; all five checks later passed, but scheduled data commits advanced `main` before completion. No merge.                                                                                                               |
| 2026-08-25 15:05 | Repaired #759 proof                                  | Added caller-level delayed-state browser regression at `8a82c61392`; 34/34 focused unit and 1/1 new Chromium passed; body and owner-feedback record corrected.                                                                                                  |
| 2026-08-25 15:13 | Refreshed #768, cycle 2                              | GitHub update-branch produced `c4cb80eef5` on `main` `558108ae53`; current-head checks pending. No merge.                                                                                                                                                       |
| 2026-08-25 15:50 | Repaired #770                                        | Pushed `ea01bf50a3`; focused tests/lint/build and 360 px EN/AR/RTL browser states passed; pilot remains off. Available GitHub checks later passed.                                                                                                              |
| 2026-08-25 15:54 | Formalized dependency and protected-workflow records | Replaced #754/#767/#774 bodies with honest What/Why/How/Proof/Risks dispositions; #774 remains draft and owner-gated.                                                                                                                                           |
| 2026-08-25 15:56 | Confirmed campaign-wide merge block                  | GitHub API reported canonical `CI` workflow ID `260164546` as `disabled_manually`; no frozen/repaired head has that required gate.                                                                                                                              |
| 2026-08-25 16:16 | Deep DataCore repair/review                          | Correction, identity, migration, grants/RLS, pagination, no-write, duplicate-metric, and bootstrap-provenance defects assigned or repaired; production DB remained untouched.                                                                                   |
| 2026-08-25 16:47 | Published repaired #772 draft                        | Pushed exact head `4801fd5383`; 61/61 focused tests, lint, and build passed; full suite 1,899/4/1; validation stopped only at the stale SEO inventory baseline. All five available GitHub checks later passed; canonical CI and staging DB proof remain absent. |
| 2026-08-25 17:00 | Opened final reconciliation PR                       | Draft PR [#775](https://github.com/vctb12/GoldTickerLive/pull/775) records the blocked outcome, visual evidence, tracker status, owner gates, and resume order. It remains unmerged because canonical CI is absent.                                             |
