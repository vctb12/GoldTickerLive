# Home FAQ schema import repair handoff

- Task selected: Repair the homepage's missing imports for the existing FAQ schema helpers.
- Why selected: `npm run lint` reproduced two `no-undef` errors in a public-page entry module; the
  fix is low-risk and non-owner-gated.
- Branch: `codex/initial-safe-phase`
- Commit: `4f5266a6d0` (implementation commit)
- Pull request: [#716](https://github.com/vctb12/GoldTickerLive/pull/716) (ready for review)
- Main files changed: `src/pages/home.js`, `docs/plans/2026-07-30_home-faq-schema-import.md`,
  `docs/agent-handoffs/2026-07-30_home-faq-schema-import.md`, and `docs/AGENT_MASTER_TRACKER.md`
- Verification results:
  - `npm run lint` — passed.
  - `node --test --test-concurrency=1 tests/seo-runtime-helpers.test.js` — passed, 9/9 tests.
  - `npm run build` — passed; emitted existing analytics-script and historical-baseline warnings;
    generated tracked artifacts were restored and are not in the PR diff.
  - `npm run check-unsafe-dom` — passed; no new unsafe DOM sinks.
  - `git diff --check` — passed.
  - `npx.cmd playwright test tests/e2e/lang-toggle.spec.js` — attempted; the configured `python3`
    server was unavailable, and the equivalent Vite server then exposed missing local Chromium,
    Firefox, and WebKit executables, so no Playwright test body ran.
  - In-app browser — passed EN → AR → EN: the locale-switched page had exactly one
    `methodology-faq-schema` FAQPage with three questions, `inLanguage` matched the locale, and no
    browser console errors. The initial EN HTML has the existing visible FAQ microdata; its runtime
    FAQ JSON-LD is inserted by the existing locale-switch path.
  - GitHub Actions for the validated head — Link Check, CodeQL Advanced, Lighthouse CI, and Perf &
    QA Checks passed. Cursor Bugbot did not run because its usage limit was reached.
  - Baseline failures excluded from this repair: full `npm test` had the unrelated redirect sweep
    and network-dependent UAE history audit failures; `npm run validate` exposed existing generated
    theme-preinit drift and a stale SEO report.
- Current status: implementation complete; PR #716 is verified and open for owner review. No merge
  was performed.
- Remaining risk: the focused repair is green, but the repository retains the baseline full-suite,
  validation, and local Playwright-environment limitations listed above.
- Owner decisions required: None.
- Recommended next safe task: After PR #716 is merged or closed, reconcile the tracker stale
  open-phase rows from a fresh `main` checkout before starting another feature phase. Do not begin
  that broad reconciliation as part of this PR finalization.
- Follow-up prompt:
  `After PR #716 is merged or closed, start from a fresh main branch. Re-read AGENTS.md, PLAN.md, PROGRESS.md, and docs/AGENT_MASTER_TRACKER.md; reconcile stale tracker rows against current GitHub/main reality, record the evidence, then select the next non-owner-gated PR-sized task without merging.`
