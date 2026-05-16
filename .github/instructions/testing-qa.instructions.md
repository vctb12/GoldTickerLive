---
applyTo: "tests/**,.github/workflows/**,package.json,playwright.config.*,vite.config.*,scripts/**"
---

# Testing / QA Instructions

What "verified" means in this repo. Read this before claiming a change is tested.

## 1. Test surfaces

| Surface              | Tool         | Where                                         |
| -------------------- | ------------ | --------------------------------------------- |
| Unit + integration   | node:test    | `tests/*.test.js` (run via `npm test`)        |
| Build + DOM safety   | node scripts | `scripts/node/validate-build.js`, `check-unsafe-dom.js` |
| SEO governance       | node script  | `scripts/node/seo-governance.js`              |
| SEO meta             | node script  | `scripts/node/check-seo-meta.js`              |
| Sitemap coverage     | node script  | `scripts/node/check-sw-coverage.js`           |
| Analytics inventory  | node script  | `scripts/node/export-analytics-inventory.js`  |
| Link health          | linkinator   | `npm run linkcheck`                           |
| Per-page audit       | node script  | `scripts/node/audit-pages.js`                 |
| Accessibility        | pa11y-ci     | `npm run a11y`                                |
| Performance          | Playwright + perf-check + Lighthouse | `npm run perf:ci`, `.github/workflows/lighthouse.yml` |
| End-to-end           | Playwright   | `npm run test:playwright`                     |

## 2. The core commands

```bash
npm test                  # node:test, --test-concurrency=1 (deterministic)
npm run lint              # ESLint flat config
npm run validate          # full gate (build integrity + DOM safety + SEO + sitemap + governance + analytics)
npm run quality           # lint + prettier:check + stylelint
npm run build             # production build
npm run test:playwright   # Playwright E2E
```

`npm run validate` is the single command that gates a release; it bundles ~8 sub-checks.

## 3. Pre-test hygiene

Before `npm test` or `npm run validate`:

```bash
rm -rf playwright-report test-results
```

`tests/seo-sitewide.test.js` and `scripts/node/validate-build.js` scan HTML files; the Playwright
HTML report contains inline scripts that produce false positives for unsafe-DOM / SEO checks.

## 4. Test isolation

- node:test runs **`--test-concurrency=1`** — tests must not assume concurrency.
- Repository tests use env-override env vars to point at tmp files (see
  `backend-supabase.instructions.md` §10).
- Use `node:test`'s `beforeEach` / `afterEach` to clean tmp state. Don't share global mutable state
  between files.

## 5. What needs a test

- New API route → success + auth-failure + validation-failure tests, minimum.
- New pricing formula or constant change → unit test against known fixtures.
- New repository / Supabase table → file-fallback round-trip test.
- New UI component that ships logic (validation, formatting) → unit test for the logic.
- Bug fix → regression test that fails on the old code.

What doesn't need a test:

- Pure CSS / token changes
- Copy / docs changes
- Workflow YAML changes (validated by GitHub itself + smoke-run)

## 6. Playwright

- Config: `playwright.config.js`. Don't change projects/baseURL without an owner discussion.
- E2E tests live under `tests/` with a `*.playwright.test.js` suffix (or `tests/e2e/` if added).
- Don't run Playwright against `goldtickerlive.com` production from CI; use the local build /
  preview.

## 7. Mobile + RTL smoke

A "tested mobile" claim requires:

- 360px, 390px, 430px width screenshots of changed surfaces (manual or Playwright)
- RTL spot-check at `<html lang="ar" dir="rtl">` for layouts that contain inline flex / grid

## 8. Workflow smoke tests

- Provider-related changes → `pr-provider-smoke.yml` must pass on the PR.
- Workflow logic changes → `workflow_dispatch` with `dry_run: true` before merging.

## 9. Honesty about verification

In every PR body, separate:

- **Ran**: command + outcome (PASS / FAIL / skipped)
- **Skipped**: why (not relevant / blocked / env not available)
- **Manual**: what you eyeballed (screenshots, RTL, viewports, console)
- **Assumed**: what you didn't verify

Never write "tests pass" without naming the command.

## 10. Common testing mistakes

- Asserting `npm test` passes when only one file ran (`node --test tests/foo.test.js` alone).
- Ignoring `playwright-report/` artefacts in `npm test` runs (false-positive failures).
- Tests that depend on system locale / timezone (always pin to UTC + `en-US` in tests).
- Hitting real Supabase / Stripe / Resend in unit tests.
- Snapshot tests on dynamic prices (use stubs or fixed fixtures).

## 11. Release-readiness flow

See [`docs/AI_RELEASE_READINESS_PLAYBOOK.md`](../../docs/AI_RELEASE_READINESS_PLAYBOOK.md) for the
full pre-merge gate. Quick version:

```bash
rm -rf playwright-report test-results
npm install
npm run lint
npm test
npm run validate
npm run build
```

If any of those fail, fix or document.
