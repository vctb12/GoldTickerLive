# Full Repo & Site Audit — 2026-09-21

**Auditor:** Claude Code · **Base:** `origin/main` @ `0b5b69e314` · **Branch:**
`claude/vibrant-darwin-6g0u9k`

Every result below was produced by actually running the command named. Where something could not be
verified, it says so explicitly instead of being scored. Nothing here is inferred from reading code
alone unless labelled **(static read)**.

---

## 1. Verdict

The repository is in **good** health. Every gate in `AGENTS.md` → core commands passes on the
audited tree. The audit found **one user-facing content defect** (now fixed), **one dependency
advisory** (now fixed), **one repo-hygiene defect** (now fixed), and **one blocked PR** whose
failure was a stale test guard rather than a real regression (now unblocked). The remaining open
items are either owner-gated by policy or have no upstream fix.

No finding in this audit touched price accuracy, karat math, or the AED peg.

---

## 2. Verified gate results

Run on the audited branch, in this order, all from a clean `npm ci`:

| Gate                        | Result                                       |
| --------------------------- | -------------------------------------------- |
| `npm ci`                    | ✅ clean install, lockfile consistent        |
| `npm test`                  | ✅ **1860 pass / 0 fail / 0 skipped**        |
| `npm run lint` (eslint)     | ✅ clean                                     |
| `npm run format:check`      | ✅ clean                                     |
| `npm run style` (stylelint) | ✅ clean                                     |
| `npm run content-lint`      | ✅ 0 errors, 1 warning (see 4.4)             |
| `npm run validate`          | ✅ all 20 sub-checks pass                    |
| `npm run build`             | ✅ built in 4.46s                            |
| `npm run check-links`       | ✅ 69 HTML files, all internal links resolve |
| `npm run seo-audit`         | ✅ 60 pages, **0 pages with issues**         |
| `npm run check-freshness`   | ✅ freshness metadata check passed           |
| `npm run check-unsafe-dom`  | ✅ no new unsafe DOM sinks, baseline tight   |
| `npm run check-shell-guard` | ✅ passed (17 top-level HTML files)          |
| `check-production-secrets`  | ✅ passed, 213 files scanned                 |
| `npm run i18n:leaked-scan`  | ✅ 0 leaked keys across 5 pages × EN/AR      |

### Could not be verified in this environment

| Gate                        | Why                                                                                                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run i18n:parity-scan`  | Playwright browser binary mismatch after the #837 bump to `@playwright/test` 1.63.0. CI installs browsers via `playwright install --with-deps`, so CI is unaffected; this is a local-sandbox limitation, **not** a repo defect. |
| `npm run a11y` (pa11y-ci)   | Needs a Chrome download. Note: **no workflow runs pa11y** — it is a local-only tool.                                                                                                                                            |
| `npm run image-audit`       | Requires `data/asset-report.json`, produced by the CI "Audit assets" step.                                                                                                                                                      |
| GitHub code-scanning alerts | The GitHub MCP server exposes **no code-scanning endpoint**. See §5.                                                                                                                                                            |

---

## 3. Findings fixed in this audit

### 3.1 — Duplicated Arabic paragraph on `methodology.html` · **severity: high** · FIXED

`methodology.html` carried **two consecutive `data-lang-block="ar"` paragraphs against a single EN
paragraph** (114 EN vs 115 AR). Two distinct problems:

1. Arabic readers saw a **visibly duplicated paragraph**. English readers did not.
2. The stale second copy asserted something the English never said — _"follow how the global spot
   price flows through each step"_ — which is a **semantic divergence between EN and AR**, i.e. a
   breach of non-negotiable rule 3 (EN/AR semantic parity), not merely cosmetic duplication.

**Fix:** removed the stale copy. The retained AR paragraph is a faithful sentence-for-sentence match
of the EN. `content-lint` goes from 1 error to 0.

This is a **live production defect** — it is in committed HTML on `main`, not in a draft.

### 3.2 — PR #759 blocked by a stale static guard · **severity: medium** · FIXED

PR #759 ("keep freshness labels age-aware") had been open since 2026-08-18 with `Validate & Build`
red. The failure was **not** in the product change.

`tests/market-closed-overlay-coverage.test.js` is a static guard that required the literal
`!getMarketStatus().isOpen` expression to appear inside `src/pages/calculator.js`. #759 correctly
refactored that branch **down one level** into a new `src/pages/calculator/freshness.js`, which
still calls `applyMarketClosedOverlay()`. The overlay was never dropped — the guard was simply
asserting an implementation detail that had legitimately moved.

**Fix:** the guard now asserts the _delegation_ rather than the inline expression — that
`calculator.js` imports and calls `getCalculatorFreshness()` and renders
`freshness.badge.${freshness.state}`; that `calculator/freshness.js` imports and calls
`applyMarketClosedOverlay()`; and that the EN+AR `freshness.badge.closed` pair exists in the shared
dictionary (the bilingual label moved there when the note started using `tGlobal`). Guard intent —
"the overlay cannot be silently dropped" — is preserved, and it now also covers the new module.

### 3.3 — `npm test` litters the working tree · **severity: low** · FIXED

`tests/uae-history-source-audit.test.js` spawns `scripts/node/audit-uae-history-source.js`, which
writes `reports/uae-history-source-audit-<TODAY>.{json,md}` on **every run**. Those files were
neither git-ignored nor prettier-ignored, so a plain `npm test` left untracked files behind that
then **failed `npm run format:check`** and risked being swept into unrelated commits.

**Fix:** the dated pattern is now git- and prettier-ignored. The committed `2026-07-29` baseline the
test actually reads stays tracked (gitignore does not affect already-tracked files).

### 3.4 — brace-expansion advisories · **severity: high (advisory)** · FIXED

`npm audit fix --package-lock-only` resolved the two high-severity `brace-expansion` DoS advisories
(CVE-2026-14257 plus its mitigation bypass). These are the two alerts GitHub reports on the default
branch. Vulnerability count: **7 → 6**.

---

## 4. Open findings (not fixed — with reasons)

### 4.1 — 6 high advisories under `pa11y-ci` · **accept and monitor**

The remaining six advisories are transitive (`extract-zip`, `puppeteer`, `@puppeteer/browsers`,
`puppeteer-core`, `pa11y`) beneath `pa11y-ci`.

**Do not run `npm audit fix --force` on these.** npm's suggested remediation is `pa11y-ci@3.1.0`,
which is a **downgrade** from the installed `4.1.1` — and `4.1.1` is the current latest published
release (verified via `npm view pa11y-ci version`). There is no upstream fix. Forcing it would roll
the accessibility tooling back two major versions to silence an advisory in a tool that **no
workflow even runs**.

Risk is genuinely low: dev-only dependency, never shipped to users, not executed in CI. Options for
the owner are (a) accept and monitor upstream, or (b) replace the a11y runner with one not built on
puppeteer. Added to the Owner-Gated Decision Queue.

### 4.2 — PR #851 (`post_gold.yml` push-race fix) · **owner decision required**

The change is correct and is the same pattern as the merged #850. It is not merged because
`.github/workflows/post_gold.yml` is a **deny-listed surface** in `.claude/settings.json` — agents
may not change the X-post production workflow without an explicit owner decision. Detail is in the
comment on the PR.

### 4.3 — English-only pre-JS placeholder on `methodology.html` · **severity: low**

`<p id="method-52w-context">` ships the static text _"Loading live reference values…"_ with no
`data-lang-block` pair. `src/pages/methodology-live.js` → `renderHistoricalContext(lang)` replaces
it bilingually at runtime, so the English is visible to Arabic readers only **before JS runs**, or
permanently **if JS fails**.

**Deliberately not fixed.** The element is targeted by `getElementById` and overwritten via
`textContent`; splitting it into the usual EN/AR block pair would break the live renderer. The
correct fix is to have the renderer own the placeholder too (render the loading string from
`tGlobal` on init), which is a behavioural change to a live trust surface and therefore out of scope
for an audit pass. Recommended as a small follow-up phase.

### 4.4 — `AFFILIATE_PLACEHOLDER` in `learn.html` · **owner content decision**

`content-lint` WARN (warnings never fail the run). It is a comment, not visible text, and
monetization is already owner-gated in the tracker. No action.

### 4.5 — `audit-pages` warning noise · **severity: informational**

`npm run audit-pages` reports 65 metadata issues across 33 pages and **exits 0**. Every affected
page is a non-public surface: `admin/**`, generated internal directory stubs (`src/**/index.html`,
`scripts/**/index.html`, `styles/**/index.html`), `404.html`, and `docs/design` mockups.

Verified benign: those stubs carry `noindex`, `offline.html` carries `noindex`, and the sitemap
contains **zero** stub URLs (`npm run seo-audit` → "All pages found in sitemap, all sitemap URLs
have matching files", 0 pages with issues). The risk is not SEO — it is that a permanently-noisy
advisory trains reviewers to ignore it. Recommend scoping `audit-pages` to public pages so its
output means something.

---

## 5. Security posture

| Surface                         | State                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| CodeQL (js/ts, python, actions) | ✅ Green on `main` @ `0b5b69e314`; analysis uploaded successfully for all 3 languages. |
| GitHub secret scanning          | ⚠️ **Not available** — GitHub Advanced Security is **not enabled** on this repository. |
| Code-scanning alert list        | ❓ **Not verifiable here** — the GitHub MCP server exposes no code-scanning endpoint.  |
| Dependabot alerts (default br.) | 2 high, both `brace-expansion` — resolved by §3.4.                                     |
| `npm audit`                     | 6 high remaining, all dev-only under `pa11y-ci` — see §4.1.                            |
| Tracked secrets                 | ✅ No `.env`, `.pem`, or `.key` tracked. Only `.env.example` and documentation.        |
| `check-production-secrets`      | ✅ Passed, 213 files.                                                                  |
| Unsafe DOM sinks                | ✅ Baseline tight, no new sinks.                                                       |
| Inline analytics / CSP          | ✅ `externalize-analytics:check` — no inline analytics; CSP can drop `unsafe-inline`.  |

**Action for the owner:** the open CodeQL alert list in the Security tab could not be enumerated
from this session. CodeQL _runs_ are green, which means no analysis failures, but green runs do not
prove zero open alerts. Please eyeball
`https://github.com/vctb12/GoldTickerLive/security/code-scanning` directly. Enabling GitHub Advanced
Security would also turn on secret scanning + push protection, which this repo currently lacks.

---

## 6. PR queue outcome

Open PRs went from **7 → 2**.

| PR   | Outcome                                                                          |
| ---- | -------------------------------------------------------------------------------- |
| #831 | Merged — js-yaml 4.3.1 → 4.3.2, full CI green                                    |
| #837 | Merged — dev-dependencies group (7 updates), full CI green                       |
| #848 | Merged — monitoring retry + 35-min fallback age tolerance, full CI green         |
| #850 | Merged — promoted out of draft after local YAML + `bash -n` validation, CI green |
| #821 | Closed — superseded by the merged #848                                           |
| #759 | Open — superseded by this branch; close on merge                                 |
| #851 | Open — owner-gated (`post_gold.yml` deny-listed)                                 |

---

## 7. Recommended next steps

1. **Owner:** decide on #851 and on the `pa11y-ci` advisory chain (§4.1, §4.2).
2. **Owner:** review the code-scanning alert list and consider enabling Advanced Security (§5).
3. **Small follow-up phase:** move the `method-52w-context` loading string into the renderer so it
   is bilingual before JS settles (§4.3).
4. **Small follow-up phase:** scope `audit-pages` to public surfaces so its warnings carry signal
   (§4.5).
