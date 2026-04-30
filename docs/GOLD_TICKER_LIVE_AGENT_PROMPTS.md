# Gold Ticker Live — Agent Prompt Library

> **Version:** v2.0.0 — Last updated: 2026-04-30
> **Brand:** Gold Ticker Live (compact: GTL)
> **Domain:** [https://goldtickerlive.com/](https://goldtickerlive.com/)
> **GitHub repo:** `vctb12/Gold-Prices` (Pages historical URL: `vctb12.github.io/Gold-Prices/`)
> **Some `Gold Prices` and `/Gold-Prices/` references in this repo are intentional carve-outs.** See [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs) before sweeping any rename.

This file is the canonical, repo-aware operating manual for every coding agent that touches the
**Gold Ticker Live** codebase — GitHub Copilot Agent (cloud, CLI, IDE chat), Claude Code, Codex,
Cursor, Gemini CLI, Windsurf, Aider. It exists to make sessions short, deep, and safe: every
prompt below is copy-paste-ready, references real files and real commands in this repo, and is
structured so a future agent can paste a single section into a fresh task box and ship useful
work without reading the rest of the file.

The library is opinionated by design. It tells agents *what* to inspect, *what* to change, *what
to leave alone*, *which checks to run*, and *what to put in the final report*. It enforces a
session protocol (§2), a quick picker (§3), a 7-part schema for every prompt, an explicit list
of carve-outs (§50), a final-report template (§51), and a manual follow-up reporting bar (§52).

If you only have time to read three things before starting work, read [§2 Required Session
Protocol](#2-required-session-protocol), [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs),
and [§51 Expected Final-Report Format](#51-expected-final-report-format).

---

## Table of Contents

- [1. How to Use This Prompt Library](#1-how-to-use-this-prompt-library)
- [2. Required Session Protocol](#2-required-session-protocol)
- [3. Prompt Index / Quick Picker](#3-prompt-index--quick-picker)
- [4. Universal New Session Starter Prompt](#4-universal-new-session-starter-prompt)
- [5. Repo Synergy and Consistency Audit Prompts](#5-repo-synergy-and-consistency-audit-prompts)
  - [5a. Cross-Surface Brand Consistency Audit](#5a-cross-surface-brand-consistency-audit)
  - [5b. SEO Surface Alignment Audit](#5b-seo-surface-alignment-audit)
  - [5c. Generated-vs-Source Drift Audit](#5c-generated-vs-source-drift-audit)
- [6. After Pull / After Merge Prompt](#6-after-pull--after-merge-prompt)
- [7. Before New PR Prompt](#7-before-new-pr-prompt)
- [8. Full UI/UX Revamp Prompt](#8-full-uiux-revamp-prompt)
- [9. Live Tracker Upgrade Prompt](#9-live-tracker-upgrade-prompt)
- [10. SEO and Indexing Prompt](#10-seo-and-indexing-prompt)
- [11. PWA / Service Worker / Performance Prompt](#11-pwa--service-worker--performance-prompt)
- [12. Arabic / RTL Quality Prompt](#12-arabic--rtl-quality-prompt)
- [13. Shops Directory Prompt](#13-shops-directory-prompt)
- [14. Calculator and Tools Prompt](#14-calculator-and-tools-prompt)
- [15. Data Reliability and Methodology Prompt](#15-data-reliability-and-methodology-prompt)
- [16. Docs and Governance Prompt](#16-docs-and-governance-prompt)
- [17. Rebrand Maintenance Prompt](#17-rebrand-maintenance-prompt)
- [18. Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt)
- [19. Large PR Execution Prompt](#19-large-pr-execution-prompt)
- [20. Final Verification and Deploy Safety Prompt](#20-final-verification-and-deploy-safety-prompt)
- **Specialized Prompts**
  - [21. Homepage Hero & Above-the-Fold](#21-homepage-hero--above-the-fold)
  - [22. Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
  - [23. Content Guide Library](#23-content-guide-library)
  - [24. FAQ + Structured Data](#24-faq--structured-data)
  - [25. Site Search](#25-site-search)
  - [26. Admin Panel UX](#26-admin-panel-ux)
  - [27. Newsletter & Alert System](#27-newsletter--alert-system)
  - [28. X/Twitter Automation Polish](#28-xtwitter-automation-polish)
  - [29. Pricing & Invest Pages](#29-pricing--invest-pages)
  - [30. Chart Component](#30-chart-component)
  - [31. Footer, Internal Links & Breadcrumbs](#31-footer-internal-links--breadcrumbs)
  - [32. Compare Countries & Today's Best Rates](#32-compare-countries--todays-best-rates)
  - [33. Social Sharing & Embed Widget](#33-social-sharing--embed-widget)
  - [34. Submit Shop & Order Gold Flows](#34-submit-shop--order-gold-flows)
  - [35. Dark Mode & Theme System](#35-dark-mode--theme-system)
  - [36. Analytics Events Standardization](#36-analytics-events-standardization)
  - [37. GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening)
  - [38. Pre-deploy, Changelog & Release](#38-pre-deploy-changelog--release)
  - [39. E2E & Coverage](#39-e2e--coverage)
  - [40. Dependency Audit & Advisory Check](#40-dependency-audit--advisory-check)
  - [41. Placeholder & Stub Page Completion](#41-placeholder--stub-page-completion)
  - [42. Mobile-First Layout Audit](#42-mobile-first-layout-audit)
  - [43. RSS Feed & News](#43-rss-feed--news)
  - [44. Supabase Data Sync](#44-supabase-data-sync)
  - [45. 404 / Error Pages & Redirect Hygiene](#45-404--error-pages--redirect-hygiene)
  - [46. Image Audit & Asset Optimization](#46-image-audit--asset-optimization)
  - [47. Repo Cleanup and Architecture](#47-repo-cleanup-and-architecture)
  - [48. Monetization and Growth](#48-monetization-and-growth)
- [49. Validation Commands Reference](#49-validation-commands-reference)
- [50. Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- [51. Expected Final-Report Format](#51-expected-final-report-format)
- [52. Manual Follow-Up Reporting Expectations](#52-manual-follow-up-reporting-expectations)
- [53. Appendix — Repo-Specific Reminders](#53-appendix--repo-specific-reminders)
- [54. Changelog of this Prompt Library](#54-changelog-of-this-prompt-library)

---

## 1. How to Use This Prompt Library

This file is operational, not aspirational. Treat it like a runbook.

1. **Pick the prompt that matches the work.** Use the [§3 Quick Picker](#3-prompt-index--quick-picker)
   when the task description is short or ambiguous. Don't merge two prompts into one mega-task —
   agents produce better diffs when scope is clear.
2. **Always start with [§4 Universal New Session Starter Prompt](#4-universal-new-session-starter-prompt).**
   Even if you already know which specialized prompt you need, paste §4 first to enforce the
   session protocol (branch check, doc reads, plan before edits). Then chain the specialized
   prompt as the second message of the session.
3. **Paste the prompt verbatim** into the Copilot Agent task box (or the chat panel of your
   editor). The prompts are written in second person and assume the agent has tools to read
   files, run commands, and open a PR.
4. **Let the agent inspect first.** Every prompt opens with an `INSPECT FIRST` block — don't
   skip it. The repo's guardrails (price math, freshness labels, deployment base path, hourly
   X-post workflow, DOM-safety baseline) are non-obvious if the agent only reads a few files.
5. **Work in focused commits.** Each prompt asks the agent to keep commits scoped (tokens vs.
   layout vs. SEO vs. docs). Reviewers and rollbacks are dramatically easier this way. The
   minimum bar for non-trivial work is **≥ 3 themed commits** per PR.
6. **Verify before finishing.** Each prompt ends with the verification commands that exist in
   `package.json` (`npm run validate`, `npm test`, `npm run quality`, `npm run build`). The agent
   must state what it ran vs. what it inferred — see [§51](#51-expected-final-report-format).
7. **Don't break deployment.** The site ships from `main` to GitHub Pages on the custom domain
   `goldtickerlive.com`. Never silently change `CNAME`, `vite.config.js` `base` (currently `'/'`),
   the service-worker scope, canonical URLs, or the `countries/**/gold-prices/` URL paths. See
   [§50](#50-safety-rules-and-carve-outs).
8. **Bilingual is non-negotiable.** Any user-visible string lives in `src/config/translations.js`
   and ships in EN + AR. RTL layout must work for every surface that gets touched.
9. **Open a draft PR early.** For multi-step work, publish the plan as a draft PR first so the
   owner can redirect cheaply.

### When to chain prompts

- **Broad UX work →** [§4 Universal Starter](#4-universal-new-session-starter-prompt) → [§8 Full
  UI/UX Revamp](#8-full-uiux-revamp-prompt) → [§19 Large PR Execution](#19-large-pr-execution-prompt)
  → [§20 Final Verification](#20-final-verification-and-deploy-safety-prompt).
- **Tracker work →** [§4](#4-universal-new-session-starter-prompt) → [§9 Live Tracker
  Upgrade](#9-live-tracker-upgrade-prompt) → [§30 Chart Component](#30-chart-component)
  (if charts are touched) → [§20](#20-final-verification-and-deploy-safety-prompt).
- **SEO work →** [§4](#4-universal-new-session-starter-prompt) → [§5b SEO Alignment
  Audit](#5b-seo-surface-alignment-audit) → [§10 SEO and Indexing](#10-seo-and-indexing-prompt) →
  [§24 FAQ + Structured Data](#24-faq--structured-data) → [§20](#20-final-verification-and-deploy-safety-prompt).
- **Brand consistency work →** [§4](#4-universal-new-session-starter-prompt) → [§5a Brand
  Consistency Audit](#5a-cross-surface-brand-consistency-audit) → [§17 Rebrand
  Maintenance](#17-rebrand-maintenance-prompt) → [§20](#20-final-verification-and-deploy-safety-prompt).
- **After git pull on a long-running branch →** [§6 After Pull / After Merge](#6-after-pull--after-merge-prompt)
  → resume the prompt you were in the middle of.

### How to recover a stalled agent

If the agent is going in circles, hand-wringing, or producing tiny edits when the task needs
broad work, paste **[§19 Large PR Execution Prompt](#19-large-pr-execution-prompt)** verbatim
into the same session. It re-orients the agent toward small, sequenced, themed commits.

If the agent is making sweeping rewrites that break carve-outs, paste
**[§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)** verbatim, then ask it to
revert the carve-out violations specifically.

### How to scope a session

Each session should produce **one PR**. If the work spans more than one of the §§8–48 prompts,
either:
- Use [§19 Large PR Execution Prompt](#19-large-pr-execution-prompt) and explicitly enumerate
  which sub-prompts are in scope, in execution order; or
- Open multiple sequential sessions, each driven by one specialized prompt, each producing one
  PR. Prefer this when the scopes are independent.

### How to read the safety rules

[§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs) is the most important section
of this file. Every prompt cites it. Every final report must list which carve-outs were
preserved. If an agent ever proposes to change anything listed under "do NOT change without
explicit instruction" in §50, **stop, ask the owner, and document the request**. Do not silently
override.

---

## 2. Required Session Protocol

Every Copilot Agent session that touches this repo must follow this protocol, in order. The
[§4 Universal Starter Prompt](#4-universal-new-session-starter-prompt) encodes it, but every
other prompt assumes the agent has already done these steps.

1. **Branch check.** Run `git branch --show-current` and `git status --short`. Confirm you are
   on a feature branch (not `main`). Confirm the working tree is clean before editing.
2. **History scan.** Run `git log --oneline -20` and `git diff main..HEAD --stat` (after fetching
   `main` if the clone is shallow). Note which files have moved recently — those are the most
   likely to surprise.
3. **Read the canon.** Open these files in this order:
   - `README.md`
   - `AGENTS.md`
   - `.github/copilot-instructions.md`
   - `docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md` *(this file)*
   - `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`
   - `docs/REVAMP_PLAN.md`
4. **Find the active plan.** List `docs/plans/` and read the most recent `YYYY-MM-DD_*.md` plan.
   If your task corresponds to a plan, your work updates it; if not, write a new plan to
   `docs/plans/YYYY-MM-DD_<slug>.md` before any non-trivial edit and open a draft PR.
5. **Inspect surfaces.** Use [§3 Quick Picker](#3-prompt-index--quick-picker) to identify which
   files are in scope. Open every one, plus their tests in `tests/`, plus any generator script
   in `scripts/node/`.
6. **Search before editing.** Run the relevant ripgrep audits from
   [§49 Validation Commands Reference](#49-validation-commands-reference) **before** writing any
   change. Brand-touching work runs the rebrand sweep. Metadata-touching work runs the SEO
   sweep. DOM-touching work runs the `innerHTML/outerHTML/insertAdjacentHTML` sweep against
   `src/`.
7. **Write a plan.** As the first message of the session, post a short repo-aware plan. List the
   files you intend to change, the commit themes you intend to ship, the carve-outs you intend
   to preserve, and the verification commands you intend to run. Refuse to start editing until
   the plan exists.
8. **Edit generators before generated files.** If a generator under `scripts/node/` produces the
   file you want to change (sitemap, JSON-LD, placeholder pages, normalized shops, RSS), edit
   the **generator** first, then re-run it, then commit both. Never hand-edit a generated file
   without also updating its generator in the same commit.
9. **Run the relevant checks.** From [§49](#49-validation-commands-reference), run at minimum:
   `npm run lint`, `npm test`, `npm run validate`, `npm run build`. Run extended checks
   (`seo-audit`, `check-links`, `image-audit`, `pre-deploy`) when the surface area calls for it.
10. **Produce the final report.** End the session with the [§51 Final-Report
    Format](#51-expected-final-report-format) verbatim, filled in. Cite §50 carve-outs preserved
    and §52 manual follow-up required.

> Skipping any of steps 1, 3, 7, or 10 is a protocol violation and grounds for the reviewer to
> request that the PR be redone.

---

## 3. Prompt Index / Quick Picker

Find the situation, follow the row.

| Situation | Use prompt § | Primary files | Primary checks |
|---|---|---|---|
| Starting a new session | [§4](#4-universal-new-session-starter-prompt) | `README.md`, `AGENTS.md`, `.github/copilot-instructions.md`, this file, `docs/REVAMP_PLAN.md` | `git status`, `git branch`, `npm test` |
| After `git pull` on a long-running branch | [§6](#6-after-pull--after-merge-prompt) | recently-changed files, `package-lock.json`, `sw.js` | `npm ci`, `npm run validate`, `npm test` |
| Before opening a PR | [§7](#7-before-new-pr-prompt) | `git diff --stat`, `CNAME`, `vite.config.js`, `manifest.json`, workflows | `git diff`, `npm run validate`, `npm run build` |
| Brand / rebrand consistency check | [§5a](#5a-cross-surface-brand-consistency-audit), [§17](#17-rebrand-maintenance-prompt) | `manifest.json`, `package.json`, `src/seo/*`, `src/config/translations.js`, README/docs | rebrand ripgrep sweep, `npm run validate` |
| SEO / indexing alignment | [§5b](#5b-seo-surface-alignment-audit), [§10](#10-seo-and-indexing-prompt) | `src/seo/*`, `scripts/node/inject-schema.js`, `scripts/node/generate-sitemap.js`, `robots.txt`, `sitemap.xml` | `npm run seo-audit`, `node scripts/node/check-seo-meta.js`, `node scripts/node/check-sitemap-coverage.js` |
| Generated vs source drift | [§5c](#5c-generated-vs-source-drift-audit), [§18](#18-generated-files-and-source-generator-prompt) | `scripts/node/inject-schema.js`, `scripts/node/generate-sitemap.js`, `countries/**/*.html` | `node scripts/node/inject-schema.js --check`, `npm run generate-sitemap`, `git status` |
| Full UI/UX revamp | [§8](#8-full-uiux-revamp-prompt) | `index.html`, `tracker.html`, `styles/global.css`, `styles/pages/*`, `src/components/nav.js`, `src/components/footer.js`, `src/pages/home.js` | `npm run validate`, `npm run build`, manual screenshots |
| Live tracker upgrade | [§9](#9-live-tracker-upgrade-prompt) | `tracker.html`, `src/tracker/*`, `src/lib/live-status.js`, `src/lib/api.js`, `src/lib/cache.js` | `npm test`, `npm run validate`, manual at 360px and 1440px |
| SEO / indexing | [§10](#10-seo-and-indexing-prompt) | `src/seo/*`, `inject-schema.js`, `generate-sitemap.js`, `robots.txt`, `countries/**` | `npm run seo-audit`, `npm run validate` |
| PWA / SW / performance | [§11](#11-pwa--service-worker--performance-prompt) | `manifest.json`, `sw.js`, `offline.html`, `tests/sw-exclusions.test.js`, Lighthouse | `npm test`, `npm run perf:ci`, `npm run image-audit` |
| Arabic / RTL parity | [§12](#12-arabic--rtl-quality-prompt) | `src/config/translations.js`, `src/lib/i18n.js`, every touched HTML/CSS surface | `npm run validate`, manual RTL spot-check |
| Shops directory | [§13](#13-shops-directory-prompt) | `shops.html`, `src/pages/shops/*`, `data/shops*.json`, `scripts/node/normalize-shops.js` | `npm run normalize-shops`, `npm test`, `npm run validate` |
| Calculator / tools | [§14](#14-calculator-and-tools-prompt) | `calculator.html`, `src/pages/calculator/*`, `src/lib/price-calculator.js` | `npm test` (`tests/price-calculator.test.js`), `npm run validate` |
| Data reliability / methodology | [§15](#15-data-reliability-and-methodology-prompt) | `src/lib/api.js`, `src/lib/cache.js`, `src/lib/live-status.js`, `methodology.html` | `npm test`, `npm run validate` |
| Docs / governance pass | [§16](#16-docs-and-governance-prompt) | `docs/**`, `README.md`, `AGENTS.md`, `.github/copilot-instructions.md` | `npm run format:check`, link audits |
| Generated files / source generators | [§18](#18-generated-files-and-source-generator-prompt) | every `scripts/node/*` generator | per-script `--check`, `npm run validate` |
| Large multi-area PR | [§19](#19-large-pr-execution-prompt) | varies | `npm run validate`, `npm run quality`, `npm run build` |
| Final verification before deploy | [§20](#20-final-verification-and-deploy-safety-prompt) | full repo | `npm run pre-deploy`, full check matrix |
| Homepage hero polish | [§21](#21-homepage-hero--above-the-fold) | `index.html`, `src/pages/home.js`, `styles/pages/home.css` | `npm run validate`, manual 360/1440 |
| Country / city deep dive | [§22](#22-country--city-pages-deep-dive) | `countries/**`, `scripts/node/generate-placeholders.js`, `scripts/node/enrich-placeholder-pages.js` | `npm run enrich-placeholders`, `npm run validate` |
| Content guide writing | [§23](#23-content-guide-library) | `content/**`, `learn.html`, `insights.html` | `npm run check-links`, `npm run validate` |
| FAQ / structured data | [§24](#24-faq--structured-data) | `scripts/node/inject-schema.js`, FAQ surfaces | `node scripts/node/inject-schema.js --check`, `npm run seo-audit` |
| Site search | [§25](#25-site-search) | `src/search/*`, `src/lib/search.js` | `npm test`, `npm run validate` |
| Admin panel | [§26](#26-admin-panel-ux) | `admin/**`, `server/**`, `tests/admin-static.test.js` | `npm test`, `npm start` smoke |
| Newsletter / alerts | [§27](#27-newsletter--alert-system) | `scripts/node/generate-newsletter.js`, `scripts/node/send-newsletter.js`, `.github/workflows/daily-newsletter.yml` | dry-run send, workflow lint |
| X / Twitter automation | [§28](#28-xtwitter-automation-polish) | `scripts/node/tweet-gold-price.js`, `scripts/python/gold_poster.py`, `.github/workflows/post_gold.yml`, `src/social/postTemplates.js` | python dry-run, workflow lint |
| Pricing / Invest | [§29](#29-pricing--invest-pages) | `pricing.html`, `invest.html`, `src/pages/*` | `npm run validate` |
| Chart component | [§30](#30-chart-component) | `src/components/chart.js`, `src/pages/tracker-chart-loader.js` | `npm test`, manual tracker check |
| Footer / internal links / breadcrumbs | [§31](#31-footer-internal-links--breadcrumbs) | `src/components/footer.js`, `src/components/internalLinks.js`, `src/components/breadcrumbs.js` | `npm run check-links`, `npm run validate` |
| Compare countries / today's best rates | [§32](#32-compare-countries--todays-best-rates) | `content/compare-countries/*`, `content/todays-best-rates/*` | `npm run validate` |
| Social sharing / embed widget | [§33](#33-social-sharing--embed-widget) | `src/social/*`, `embed/**`, `src/seo/seoHead.js` | `npm run validate`, manual share preview |
| Submit shop / order gold | [§34](#34-submit-shop--order-gold-flows) | `src/pages/submit-shop.js`, `content/order-gold/*`, `server/routes/submissions.js` | `npm test`, manual submission |
| Dark mode / theming | [§35](#35-dark-mode--theme-system) | `styles/global.css`, `src/components/nav.js` (`_applyTheme`) | manual theme cycle, `npm run style` |
| Analytics events | [§36](#36-analytics-events-standardization) | analytics call sites across `src/` | `rg "gtag\|dataLayer"`, `npm run validate` |
| GitHub Actions hardening | [§37](#37-github-actions-workflow-hardening) | `.github/workflows/*`, `.github/workflows/README.md` | workflow lint, SHA pin audit |
| Pre-deploy / changelog / release | [§38](#38-pre-deploy-changelog--release) | `scripts/node/pre-deploy-check.js`, `scripts/node/changelog.js`, `scripts/node/package-release.js` | `npm run pre-deploy`, `npm run changelog` |
| E2E / coverage | [§39](#39-e2e--coverage) | `tests/e2e/**`, `playwright.config.js` | `npx playwright test`, `npm run test:coverage` |
| Dependency audit | [§40](#40-dependency-audit--advisory-check) | `package.json`, `package-lock.json` | `npm audit`, `npm outdated`, GitHub Advisory DB |
| Placeholder / stub completion | [§41](#41-placeholder--stub-page-completion) | `scripts/node/enrich-placeholder-pages.js`, stub pages | `npm run enrich-placeholders -- --check`, `npm run validate` |
| Mobile-first audit | [§42](#42-mobile-first-layout-audit) | every page CSS | manual 320/360/414, `npm run style` |
| RSS / news | [§43](#43-rss-feed--news) | `scripts/node/generate-rss.js`, `content/news/*` | RSS validator, `npm run validate` |
| Supabase data sync | [§44](#44-supabase-data-sync) | `src/config/supabase.js`, `.github/workflows/sync-db-to-git.yml`, `docs/SUPABASE_*.md` | dry-run sync, `npm test` |
| 404 / redirects | [§45](#45-404--error-pages--redirect-hygiene) | `404.html`, `_redirects`, `src/pages/not-found.js` | `npm run check-links`, manual 404 |
| Image audit | [§46](#46-image-audit--asset-optimization) | `assets/**`, `scripts/node/image-audit.js` | `npm run image-audit`, Lighthouse |
| Repo cleanup | [§47](#47-repo-cleanup-and-architecture) | dead code, dead docs | `rg`, `npm run validate` |
| Monetization / growth | [§48](#48-monetization-and-growth) | `src/components/adSlot.js`, `AD_CONFIG` in `src/config/constants.js` | manual, `npm run validate` |

---

## 4. Universal New Session Starter Prompt

**Purpose:**
Force every Copilot Agent session to start with the [§2 Required Session
Protocol](#2-required-session-protocol) before any code edit. This prompt prevents the most
common failure mode — agents that start editing files before they understand the repo's
deployment, SEO, bilingual, and DOM-safety guardrails. Pasting this prompt verbatim is the
cheapest insurance against shallow PRs and carve-out violations.

**When to use:**
- The very first message of every session, regardless of which specialized prompt follows.
- When resuming a stalled session and the agent has lost context.
- When onboarding a new agent (Codex, Cursor, Gemini, Claude Code) that has not seen this repo
  before.
- When the task description from the owner is short ("fix the homepage", "improve SEO") and
  needs to be expanded into a real plan.
- After `git pull` on a long-running branch, immediately followed by [§6](#6-after-pull--after-merge-prompt).

**Copy-paste prompt:**

```text
You are GitHub Copilot Agent working in the repository vctb12/Gold-Prices (production domain
https://goldtickerlive.com/, canonical product brand "Gold Ticker Live"). This is a bilingual
EN/AR static multi-page site built with vanilla ES modules and Vite — NO React, NO Next, NO
SPA, NO heavy framework. Read this entire prompt before doing anything.

REQUIRED SESSION PROTOCOL — DO NOT SKIP

1. Run `git branch --show-current` and `git status --short`. Confirm you are on a feature
   branch (not `main`) and the tree is clean.
2. Run `git log --oneline -20`. Note recent activity. If the clone might be shallow, run
   `git fetch --unshallow origin` (retry up to 3× on transient failure) and
   `git fetch origin main:refs/remotes/origin/main`. Then run `git diff main..HEAD --stat`.
3. Read these files end-to-end, in this order:
   - `README.md`
   - `AGENTS.md`
   - `.github/copilot-instructions.md`
   - `docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md`  ← THIS PROMPT LIBRARY
   - `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`
   - `docs/REVAMP_PLAN.md`
4. List `docs/plans/` and read the most recent `YYYY-MM-DD_*.md`. If your task corresponds to
   one of those plans, your work updates it. Otherwise, write a new plan at
   `docs/plans/YYYY-MM-DD_<slug>.md` before any non-trivial edit, open a draft PR with just
   the plan, and let the owner redirect cheaply.
5. Identify the surfaces in scope using §3 Quick Picker of the prompt library. Read every
   surface file and its tests. Do NOT start editing yet.
6. Run the relevant ripgrep audits from §49 Validation Commands Reference of the prompt
   library BEFORE editing:
   - rebrand sweep if you might touch brand/SEO/manifest surfaces.
   - SEO sweep if you might touch metadata.
   - innerHTML/outerHTML/insertAdjacentHTML sweep against `src/` if you might touch DOM code.
7. Post a written, repo-aware plan as your first response. Include:
   - the prompt library section(s) you are working from
   - the files you intend to change
   - the commit themes you intend to ship (≥ 3 themed commits for non-trivial work)
   - the carve-outs from §50 you must preserve
   - the verification commands you will run from §49
   - any manual follow-up that will need to happen outside this repo (cite §52)
8. Edit source generators BEFORE generated files. The repo's generators live under
   `scripts/node/` (notably `inject-schema.js`, `generate-sitemap.js`,
   `enrich-placeholder-pages.js`, `generate-placeholders.js`, `normalize-shops.js`,
   `generate-rss.js`, `generate-newsletter.js`). If you must change a generated file, change
   the generator in the same commit and re-run it.
9. Run at least: `npm run lint`, `npm test`, `npm run validate`, `npm run build`. Run extended
   checks (`npm run seo-audit`, `npm run check-links`, `npm run image-audit`,
   `npm run pre-deploy`) when the surface calls for it.
10. End the session with the §51 Final-Report Format filled in. Cite §50 carve-outs preserved
    and §52 manual follow-up required.

HARD RULES

- Refuse shallow PRs. If the task naturally decomposes into 5+ files of substantive change,
  produce 5+ files of substantive change — not a 3-line cosmetic edit.
- Never break `/Gold-Prices/` deployment compatibility. The site historically deploys to
  `vctb12.github.io/Gold-Prices/` as a fallback to the custom domain `goldtickerlive.com`.
  `vite.config.js` `base` is currently `'/'`; do not silently change it.
- Never touch `CNAME` (`goldtickerlive.com`), `manifest.json` `start_url`/`scope`,
  `vite.config.js` `base`, `.github/workflows/post_gold.yml`, `_headers`, `_redirects`,
  service-worker scope, or canonical URLs without an explicit owner instruction.
- Never change pricing math (`price_per_gram = (XAU/USD ÷ 31.1035) × purity × FX`), the AED
  peg constant `3.6725`, the troy-ounce constant `31.1035`, karat purity values, the FX
  source, the `STALE_AFTER_MS = 12 minutes` threshold, or the `FX_STALE_AFTER_MS = 26 hours`
  threshold without an explicit owner instruction.
- Every user-visible string change ships in EN + AR via `src/config/translations.js`.
- DOM-safety baseline (per `scripts/node/check-unsafe-dom.js`) is 0 sinks in
  `src/tracker/render.js`. Do not add `innerHTML`, `outerHTML`, or `insertAdjacentHTML` calls;
  use `el()` / `replaceChildren()` from `src/lib/safe-dom.js`.
- Bump `sw.js` `CACHE_NAME` (currently `'goldtickerlive-v16'`) when shipping a meaningful
  asset/HTML change. Never rename the prefix; just bump the integer suffix.
- Do not echo secrets. Do not commit secrets. The repo is public.
- PR-only workflow. No direct commits to `main`. No force-push.

BEFORE YOU EDIT

Stop. Have you done steps 1–7? If not, do them now. Post your plan. Wait for confirmation if
the task requires owner judgment (price math change, dependency add, deployment-sensitive
edit, schema rename, large feature). Otherwise begin in step 8.
```

**Files / surfaces Copilot should inspect:**
- `README.md`, `AGENTS.md`, `.github/copilot-instructions.md`
- `docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md` (this file)
- `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`, `docs/REVAMP_PLAN.md`
- `docs/plans/` (most recent file)
- `package.json` (real `scripts.*` entries)
- `src/config/constants.js` (real values for `AED_PEG`, `TROY_OZ_GRAMS`, `GOLD_REFRESH_MS`, `BASE_PATH`, `CACHE_KEYS`)
- `manifest.json`, `sw.js`, `vite.config.js`, `CNAME`

**Required checks:**
- `git branch --show-current`
- `git status --short`
- `git log --oneline -20`
- `git diff main..HEAD --stat` (after fetch)
- `npm test` (sanity)
- Whatever ripgrep sweep from [§49](#49-validation-commands-reference) corresponds to the task scope.

**Expected final report:**
- Plan posted as the first message of the session.
- Confirmation that all required reads (§2 step 3) were completed.
- Carve-outs from [§50](#50-safety-rules-and-carve-outs) explicitly listed.
- Verification commands from [§49](#49-validation-commands-reference) explicitly enumerated.
- Final session report per [§51](#51-expected-final-report-format) at the end.

**Safety notes:**
- Cite [§50](#50-safety-rules-and-carve-outs) for every carve-out.
- The hourly `.github/workflows/post_gold.yml` is production. Never break the
  `scripts/python/utils/*` import path. Never change cadence without owner approval.
- Do not alter the DOM-safety baseline in `src/tracker/render.js`.

**Failure modes to watch for:**
- Agent skips reading `AGENTS.md` and `.github/copilot-instructions.md`, then proposes changes
  that violate documented carve-outs.
- Agent edits a generated `countries/**/*.html` file directly without re-running its generator.
- Agent silently bumps `vite.config.js` `base` or `manifest.json` `start_url`/`scope`.
- Agent translates English strings into Arabic literally instead of via
  `src/config/translations.js`.
- Agent ships a one-commit "change 3 lines" PR for a task that calls for substantive work.
- Agent assumes a script (`npm run typecheck`, `npm run e2e`) exists when it does not — always
  cross-check against the real `scripts.*` map in `package.json`.
- Agent claims tests pass without running them. The §51 report must distinguish ran vs.
  inferred.

**Cross-references:**
- → [§2 Required Session Protocol](#2-required-session-protocol)
- → [§3 Quick Picker](#3-prompt-index--quick-picker)
- → [§49 Validation Commands Reference](#49-validation-commands-reference)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§51 Expected Final-Report Format](#51-expected-final-report-format)
- → [§52 Manual Follow-Up Reporting Expectations](#52-manual-follow-up-reporting-expectations)

---

## 5. Repo Synergy and Consistency Audit Prompts

This section bundles three sibling audit prompts. They are short to run, high-leverage, and
should be paired with the matching specialized prompt whenever you ship work in that surface:

- **§5a Cross-Surface Brand Consistency Audit** — pair with [§17 Rebrand Maintenance](#17-rebrand-maintenance-prompt).
- **§5b SEO Surface Alignment Audit** — pair with [§10 SEO and Indexing](#10-seo-and-indexing-prompt).
- **§5c Generated-vs-Source Drift Audit** — pair with [§18 Generated Files and Source
  Generator Prompt](#18-generated-files-and-source-generator-prompt).

Each is a stand-alone session. Run any of them weekly even if no feature work is in flight —
they catch drift before it ships.

---

### 5a. Cross-Surface Brand Consistency Audit

**Purpose:**
Verify that every brand-bearing surface in the repo agrees on **"Gold Ticker Live"** as the
canonical brand and `goldtickerlive.com` as the canonical domain — without breaking the
intentional carve-outs (`/Gold-Prices/` deployment paths, `gold_prices` schema names,
`countries/**/gold-prices/` SEO paths, `@GoldTickerLive` handle, historical changelog
references). The audit produces a classified report of every match: `Fix now`, `Intentional
carve-out`, or `Manual owner decision`.

**When to use:**
- Before publishing any marketing/SEO change.
- After a large PR that touches `src/seo/*`, `manifest.json`, `package.json`, README, or
  translations.
- Quarterly, as a standalone hygiene session.
- When onboarding a new agent that will work on brand-touching surfaces.

**Copy-paste prompt:**

```text
You are running a cross-surface brand consistency audit on the Gold Ticker Live repo
(canonical brand "Gold Ticker Live", canonical domain https://goldtickerlive.com/, GitHub
repo vctb12/Gold-Prices). Some references to "Gold Prices" / "/Gold-Prices/" / "gold_prices"
are INTENTIONAL CARVE-OUTS. Your job is to find every brand reference and classify it, NOT
to blindly rewrite.

INSPECT FIRST
1. Read the §50 Safety Rules and Carve-Outs of the prompt library
   (docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md). Memorize the deployment, SEO, data, and
   identity carve-outs.
2. Read `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md` and any
   `docs/REBRAND_VERIFICATION_REPORT.md` / `docs/GOLD_TICKER_LIVE_REBRAND_VERIFICATION.md`
   that exists.
3. Open these brand-bearing surfaces:
   - `manifest.json` (name, short_name, description)
   - `package.json` (name, description, repository.url, homepage)
   - `index.html`, `tracker.html`, `calculator.html`, `shops.html`, `learn.html`,
     `insights.html`, `methodology.html`, `invest.html`, `pricing.html`, `404.html`,
     `offline.html` (`<title>`, `<meta name="description">`, `<meta property="og:title">`,
     `<meta name="application-name">`, `<meta name="apple-mobile-web-app-title">`)
   - `src/config/translations.js` (any literal "Gold Prices" / "Gold Ticker Live" / brand
     phrases — these MUST be in translation entries, not hard-coded)
   - `src/config/constants.js` (`SITE_NAME`, `SITE_URL`, brand-bearing constants)
   - `src/seo/seoHead.js`, `src/seo/metadataGenerator.js` (brand strings)
   - `src/components/footer.js`, `src/components/nav.js`, `src/components/nav-data.js`
   - `scripts/node/inject-schema.js` (`"name"`, `"publisher"`, `"@type": "Organization"`,
     logo URLs)
   - `scripts/node/generate-sitemap.js` (base URL)
   - `scripts/node/generate-rss.js`, `scripts/node/generate-newsletter.js` (brand strings)
   - `scripts/node/tweet-gold-price.js`, `src/social/postTemplates.js`,
     `scripts/python/gold_poster.py` (brand strings, X handle)
   - `robots.txt`, `sitemap.xml` (host)
   - `CNAME` (must be `goldtickerlive.com`)
   - `.github/workflows/*.yml` (workflow names referring to brand)
   - `README.md`, every doc under `docs/**`
   - `countries/**/*.html` and `content/**/*.html` (brand strings in titles, headings, OG
     metadata — many are generated; classify accordingly)

WORK
- Run all five rebrand/consistency ripgrep sweeps from §49 of the prompt library.
- For every match, classify it into ONE of:
  * Fix now: brand reference that should now read "Gold Ticker Live" or
    "goldtickerlive.com". Update it. Prefer editing source generators over generated files —
    if `countries/**/*.html` or `content/**/*.html` shows a hit, fix the generator
    (`scripts/node/inject-schema.js`, `scripts/node/enrich-placeholder-pages.js`,
    `scripts/node/generate-placeholders.js`) before the output.
  * Intentional carve-out: do not touch. Document in the final report. Carve-outs include
    `/Gold-Prices/` deployment paths, `vctb12.github.io/Gold-Prices/` URL, `gold_prices`
    DB/JSON keys, `countries/**/gold-prices/` SEO route paths, the SEO topic phrases listed
    in §50, the `@GoldTickerLive` X handle, and historical references inside `CHANGELOG.md`,
    `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`,
    `docs/REBRAND_VERIFICATION_REPORT.md`.
  * Manual owner decision: ambiguous (e.g. a marketing slogan that mentions "gold prices"
    generically). Flag with a question for the owner; do not silently change.
- Produce a markdown classification table in your final report with columns: file:line,
  match snippet, classification, action taken.

CONSTRAINTS
- Do not rename the GitHub repo. The repo is still `vctb12/Gold-Prices`.
- Do not change `CNAME`.
- Do not change `vite.config.js` `base` (currently `'/'`).
- Do not change `manifest.json` `start_url` or `scope`.
- Do not change `gold_prices` schema names or `data/gold_price.json` filenames.
- Do not edit `CHANGELOG.md` or `docs/GOLD_TICKER_LIVE_REBRAND_*.md` historical entries.
- Every user-visible string change ships in EN + AR via `src/config/translations.js`.

VERIFY
- Run all five §49 rebrand sweeps and capture before/after counts.
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run build` (sanity, optional unless you touched HTML/JS/CSS)

DELIVERABLE
- One PR titled `audit(brand): cross-surface brand consistency sweep`.
- Classification table in the PR body.
- §51 final report at session end.
```

**Files / surfaces Copilot should inspect:**
- `manifest.json`, `package.json`, `CNAME`, `robots.txt`, `sitemap.xml`
- `src/config/{constants,translations}.js`
- `src/seo/seoHead.js`, `src/seo/metadataGenerator.js`
- `src/components/{nav,nav-data,footer,internalLinks}.js`
- `scripts/node/{inject-schema,generate-sitemap,generate-rss,generate-newsletter,tweet-gold-price}.js`
- `src/social/postTemplates.js`, `scripts/python/gold_poster.py`
- All HTML at repo root (`index.html`, `tracker.html`, `calculator.html`, `shops.html`,
  `learn.html`, `insights.html`, `methodology.html`, `invest.html`, `pricing.html`, `404.html`,
  `offline.html`)
- `countries/**/*.html`, `content/**/*.html` (classify whether each match comes from a
  generator)
- `README.md`, `docs/**/*.md`, `.github/workflows/*.yml`

**Required checks:**
- All five rebrand/consistency ripgrep sweeps from [§49](#49-validation-commands-reference).
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run build`

**Expected final report:**
- Classification table (file:line | match | classification | action).
- Total counts before/after for each ripgrep sweep.
- List of generators edited and which generated files were re-emitted as a result.
- §51 final report with `Carve-outs preserved:` enumerating each touched carve-out.

**Safety notes:**
- The carve-outs listed in [§50](#50-safety-rules-and-carve-outs) are NOT bugs. Document them
  in the final report; do not silently rewrite them.
- `.github/workflows/post_gold.yml` is production. Brand strings inside it that affect post
  output go through `src/social/postTemplates.js` or `scripts/python/gold_poster.py`; do not
  hand-edit the workflow file's `run:` block.

**Failure modes to watch for:**
- Agent silently rewrites every `gold_prices` to `gold_ticker_live`, breaking the
  `data/gold_price.json` filename, the JSON-LD product schema, and the Supabase table.
- Agent rewrites `/Gold-Prices/` paths in archived workflow files or historical docs.
- Agent edits `countries/**/*.html` directly instead of fixing the generator.
- Agent assumes "Gold Prices" in `CHANGELOG.md` is a bug and rewrites historical entries.
- Agent edits the `@GoldTickerLive` handle to "@gold_ticker_live" or similar, breaking the
  live X automation.
- Agent updates `manifest.json` `name` to a different string than what's already shipped to
  installed PWAs without bumping `sw.js` `CACHE_NAME`.

**Cross-references:**
- → [§17 Rebrand Maintenance Prompt](#17-rebrand-maintenance-prompt) (deeper variant with
  classification logic and worked example)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§49 Validation Commands Reference](#49-validation-commands-reference) (rebrand ripgrep
  sweeps)

---

### 5b. SEO Surface Alignment Audit

**Purpose:**
Verify that every SEO-bearing surface for a given page agrees: the `<title>`, the
`<meta name="description">`, the `<link rel="canonical">`, the `hreflang` pairs, the OG and
Twitter card metadata, the JSON-LD inserted by `scripts/node/inject-schema.js`, the breadcrumb
schema, the sitemap entry, the internal links pointing at the page, and the visible H1 should
all describe the same page. Drift between these surfaces silently kills indexing.

**When to use:**
- After [§10 SEO and Indexing](#10-seo-and-indexing-prompt) work.
- After bulk page generation via `scripts/node/generate-placeholders.js` or
  `scripts/node/enrich-placeholder-pages.js`.
- After a layout change that may have moved schema injection points.
- Quarterly as standalone hygiene.

**Copy-paste prompt:**

```text
You are running an SEO surface alignment audit on Gold Ticker Live. Your job is to verify
that the title / description / canonical / hreflang / OG / Twitter / JSON-LD / breadcrumb /
sitemap / internal links / visible H1 for every page agree with each other and with the
intended SEO topic of the page.

INSPECT FIRST
1. Read `docs/SEO_STRATEGY.md`, `docs/SEO_CHECKLIST.md`, `docs/SEO_SITEMAP_GUIDE.md`.
2. Read `src/seo/seoHead.js` and `src/seo/metadataGenerator.js`.
3. Read `scripts/node/inject-schema.js`, `scripts/node/check-seo-meta.js`,
   `scripts/node/check-sitemap-coverage.js`, `scripts/node/seo-audit.js`,
   `scripts/node/inventory-seo.js`, `scripts/node/generate-sitemap.js`.
4. Read `robots.txt`, `sitemap.xml`.
5. Open at least 6 representative pages and read them top to bottom:
   - `index.html`
   - `tracker.html`
   - `calculator.html`
   - `shops.html`
   - one country page under `countries/<country>/gold-prices/index.html`
   - one city page under `countries/<country>/<city>/gold-prices/index.html`
6. For each page, list all 12 SEO surfaces in a table:
   visible H1, `<title>`, `<meta description>`, `<link rel="canonical">`, `hreflang en`,
   `hreflang ar`, `og:title`, `og:description`, `og:url`, `twitter:title`,
   `twitter:description`, JSON-LD `@type`/`name`/`url`, breadcrumb JSON-LD, sitemap entry,
   inbound internal-link anchor text.

WORK
- Identify drift. Common drift patterns:
  * `<title>` says "Gold Prices in Dubai" but `og:title` says "Gold Prices Today".
  * Canonical points at `https://goldtickerlive.com/x` but sitemap omits the page.
  * JSON-LD `name` is stale after a rename.
  * `hreflang ar` points at a 404.
  * Breadcrumb schema position 2 disagrees with the visible breadcrumb.
  * Multiple pages share the same canonical (canonical loop / wrong canonical).
  * Missing `hreflang` pair on bilingual pages.
  * `og:image` is a stale path or missing dimensions.
- Fix at the SOURCE (generator) level when the page is generated. Specifically:
  * Country/city pages → `scripts/node/generate-placeholders.js` and
    `scripts/node/enrich-placeholder-pages.js`.
  * JSON-LD → `scripts/node/inject-schema.js`.
  * Sitemap → `scripts/node/generate-sitemap.js`.
  * Per-page `<head>` metadata → `src/seo/seoHead.js` / `src/seo/metadataGenerator.js`.
- Preserve the SEO carve-outs from §50: `countries/**/gold-prices/` URL paths, the SEO
  topic phrases ("Gold Prices Today", "How Gold Prices Work", "Why UAE Gold Prices Differ",
  "Gold Prices in Dubai", "Gold Prices in <City>"), `Disallow: /admin/` and
  `Disallow: /api/` in `robots.txt`.

CONSTRAINTS
- Do not change canonical URL paths of existing indexed pages without an explicit owner
  redirect plan.
- Do not change `robots.txt` `Disallow:` directives.
- Do not silently move JSON-LD `@type` values (Article ↔ NewsArticle ↔ FAQPage ↔
  BreadcrumbList) — match the existing `inject-schema.js` policy.
- Do not change `hreflang` to a single language; the site is bilingual EN + AR.

VERIFY
- `npm run seo-audit`
- `node scripts/node/check-seo-meta.js`
- `node scripts/node/check-sitemap-coverage.js`
- `node scripts/node/inject-schema.js --check`
- `npm run validate`
- `npm run check-links` (or `npm run linkcheck` if defined)
- Manual: open the 6 representative pages in a browser, view source, confirm the 12-surface
  table is consistent.

DELIVERABLE
- One PR titled `audit(seo): surface alignment audit`.
- A 12-surface table for each audited page.
- An issue summary listing every drift, fixed or flagged.
- §51 final report at session end.
```

**Files / surfaces Copilot should inspect:**
- `src/seo/seoHead.js`, `src/seo/metadataGenerator.js`
- `scripts/node/inject-schema.js`, `scripts/node/generate-sitemap.js`,
  `scripts/node/check-seo-meta.js`, `scripts/node/check-sitemap-coverage.js`,
  `scripts/node/seo-audit.js`, `scripts/node/inventory-seo.js`
- `robots.txt`, `sitemap.xml`, `CNAME`
- `index.html`, `tracker.html`, `calculator.html`, `shops.html`, `learn.html`, `insights.html`,
  `methodology.html`, `invest.html`, `pricing.html`
- `countries/**/*.html`, `content/**/*.html`
- `docs/SEO_STRATEGY.md`, `docs/SEO_CHECKLIST.md`, `docs/SEO_SITEMAP_GUIDE.md`

**Required checks:**
- `npm run seo-audit`
- `node scripts/node/check-seo-meta.js`
- `node scripts/node/check-sitemap-coverage.js`
- `node scripts/node/inject-schema.js --check`
- `npm run validate`
- `npm run check-links`

**Expected final report:**
- 12-surface table for each audited page.
- Drift summary: counts (titles drifting, canonicals drifting, hreflang missing, schema
  stale, etc.).
- List of generators edited and outputs re-emitted.
- §51 final report.

**Safety notes:**
- Canonical URL paths under `countries/**/gold-prices/` are SEO-load-bearing. Do not change
  them without redirects.
- `robots.txt` `Disallow: /admin/` and `Disallow: /api/` are required carve-outs.
- The site is bilingual; `hreflang` pairs must remain bidirectional.

**Failure modes to watch for:**
- Agent fixes `<title>` on a generated page directly without updating
  `enrich-placeholder-pages.js` — fix is reverted on next regeneration.
- Agent adds a canonical pointing at the dev domain.
- Agent removes `hreflang` because "the page only has English content" without checking
  `src/config/translations.js`.
- Agent introduces a canonical loop by pointing two pages at each other.
- Agent silently changes `og:image` paths that are referenced elsewhere (newsletter, embed).
- Agent ships SEO changes without re-running `npm run generate-sitemap` and re-injecting
  schema.

**Cross-references:**
- → [§10 SEO and Indexing Prompt](#10-seo-and-indexing-prompt)
- → [§18 Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt)
- → [§24 FAQ + Structured Data](#24-faq--structured-data)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

### 5c. Generated-vs-Source Drift Audit

**Purpose:**
Detect drift between source generators (`scripts/node/*`) and the files they produce
(`countries/**/*.html`, `content/**/*.html`, `data/shops.json`, `sitemap.xml`,
JSON-LD blocks injected into HTML, `feed.xml`, newsletter HTML). The repo's build pipeline
(`npm run build`) runs `extract-baseline → normalize-shops → inject-schema →
generateSitemap → vite build`. Any agent that edited a generated file directly without
updating the generator has shipped a time-bomb that silently regenerates away.

**When to use:**
- After any session that may have hand-edited generated files.
- Before opening any PR that touches `countries/**`, `content/**`, `data/shops*.json`, or
  `sitemap.xml`.
- After any change to `scripts/node/inject-schema.js`,
  `scripts/node/generate-sitemap.js`, `scripts/node/enrich-placeholder-pages.js`,
  `scripts/node/generate-placeholders.js`, `scripts/node/normalize-shops.js`,
  `scripts/node/generate-rss.js`, `scripts/node/generate-newsletter.js`.
- Quarterly hygiene.

**Copy-paste prompt:**

```text
You are running a generated-vs-source drift audit on Gold Ticker Live. Your job is to
verify that every generator under `scripts/node/` is in sync with its output, and that no
generated file has been hand-edited without a matching update to its generator.

INSPECT FIRST
1. Read `docs/AUTOMATIONS.md`.
2. Read each generator end-to-end:
   - `scripts/node/inject-schema.js` (NOT idempotent — adds JSON-LD, `mtime`-based dates;
     re-runs may shift output)
   - `scripts/node/generate-sitemap.js` and `scripts/node/check-sitemap-coverage.js`
   - `scripts/node/enrich-placeholder-pages.js` and
     `scripts/node/generate-placeholders.js`
   - `scripts/node/normalize-shops.js`
   - `scripts/node/generate-rss.js`
   - `scripts/node/generate-newsletter.js`
   - `scripts/node/extract-baseline.js`
3. Read `package.json` `scripts.build` to understand the canonical generator order.
4. Read `data/shops*.json` and `data/gold_price.json` shape.

WORK
- Run each generator with its `--check` flag if supported, or in dry-run mode if exposed.
  At minimum: `node scripts/node/inject-schema.js --check`,
  `node scripts/node/enrich-placeholder-pages.js --check`,
  `node scripts/node/inventory-seo.js --check`,
  `node scripts/node/externalize-analytics.js --check`,
  `node scripts/node/check-sitemap-coverage.js`,
  `node scripts/node/check-seo-meta.js`.
- Re-run any generator that does NOT have a `--check` flag against a clean working tree
  and `git diff --stat` to surface drift.
- For every drift found, decide:
  * If the generator is correct and the generated file is stale: re-run the generator,
    commit the regen.
  * If the generated file was hand-edited intentionally: update the generator to produce
    that output, then re-run, then commit both.
  * If the generator is wrong: fix the generator, re-run, commit.
- Inspect `inject-schema.js` carefully — its mtime-based dates are NOT idempotent; running
  it on a clean tree will produce diffs whenever an HTML file's mtime has shifted. Document
  this and prefer running it as part of `npm run build`, not standalone, unless you are
  intentionally refreshing schema dates.

CONSTRAINTS
- Do not delete a generated file just because it shows drift — first verify the generator
  still wants to produce it.
- Do not commit `dist/` or other build artifacts.
- Do not modify the canonical generator order in `package.json` `scripts.build`.

VERIFY
- `npm run validate` (which itself runs `inject-schema.js --check`,
  `enrich-placeholder-pages.js --check`, `inventory-seo.js --check`,
  `externalize-analytics.js --check`)
- `npm run build` on a clean tree, then `git diff --stat` — diffs in `countries/**`,
  `content/**`, or `sitemap.xml` after a clean build are exactly the drift you are
  hunting.
- `npm test`

DELIVERABLE
- One PR titled `audit(generators): generated-vs-source drift sweep`.
- A drift summary listing each generator and the files it had to re-emit (or zero diffs
  if all in sync).
- §51 final report.
```

**Files / surfaces Copilot should inspect:**
- Every generator under `scripts/node/` (see list in the Copy-paste prompt).
- `package.json` `scripts.build`
- `data/shops*.json`, `data/gold_price.json`
- `countries/**/*.html`, `content/**/*.html`
- `sitemap.xml`, `feed.xml` (if generated)
- `docs/AUTOMATIONS.md`

**Required checks:**
- `npm run validate`
- `npm run build` followed by `git status --short` and `git diff --stat`
- `node scripts/node/inject-schema.js --check`
- `node scripts/node/check-sitemap-coverage.js`
- `node scripts/node/check-seo-meta.js`
- `npm test`

**Expected final report:**
- Drift table: generator | files that drifted | resolution.
- Whether `inject-schema.js` mtime drift was treated as "real" or "expected" with reasoning.
- Confirmation that `dist/` was not committed.
- §51 final report.

**Safety notes:**
- `scripts/node/inject-schema.js` is NOT idempotent. Treat its drift carefully — running it
  on a clean tree will produce diffs when source HTML mtimes shift. Only commit those diffs
  when you intend to refresh schema dates.
- The build pipeline order is canonical:
  `extract-baseline → normalize-shops → inject-schema → generateSitemap → vite build`.
  Do not reorder.
- Generated `countries/**/*.html` and `content/**/*.html` may be hand-edited only when the
  same commit also updates the generator; otherwise the next regen reverts the change.

**Failure modes to watch for:**
- Agent commits regenerated `countries/**/*.html` from `inject-schema.js` mtime drift,
  shipping a noisy diff that has no real meaning.
- Agent fixes a country-page H1 directly without updating
  `enrich-placeholder-pages.js` — fix vanishes on next regen.
- Agent runs generators in the wrong order (e.g. `vite build` before `inject-schema.js`)
  and misses schema injection.
- Agent commits `dist/`.
- Agent renames a generator file and breaks `package.json` `scripts.build`.
- Agent adds a `--check` flag to a generator without keeping the existing emit behavior
  intact.

**Cross-references:**
- → [§18 Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt)
- → [§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
- → [§41 Placeholder & Stub Page Completion](#41-placeholder--stub-page-completion)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 6. After Pull / After Merge Prompt

**Purpose:**
Force the agent to do a structured sanity pass after `git pull` or after merging `main` into
a long-running feature branch. Long-running branches in this repo silently accumulate drift in
generated files, dependency lockfiles, service-worker cache versions, and translation entries.
This prompt catches that drift before the agent resumes feature work on a stale base.

**When to use:**
- Immediately after `git pull` on any branch.
- After `git merge main` on a long-running feature branch.
- After resolving merge conflicts.
- When tests start failing for no apparent reason at the start of a session.

**Copy-paste prompt:**

```text
You just ran `git pull` (or merged `main` into your feature branch) on the Gold Ticker Live
repo. Before resuming feature work, run this structured sanity pass.

INSPECT FIRST
1. Run `git status --short`. Resolve any merge markers before doing anything else.
2. Run `git log --oneline -30`. Note the most recent commits on `main` since you last
   touched the branch.
3. Run `git diff HEAD@{1}..HEAD --stat` to see what `pull`/`merge` actually changed locally.
4. Read the most recent commit messages on `main` for files that overlap with your branch.
5. Read these surfaces if they show in `git diff --stat`:
   - `package.json`, `package-lock.json` → dependency drift
   - `sw.js` → CACHE_NAME bump
   - `manifest.json`, `vite.config.js`, `CNAME` → deployment-sensitive
   - `src/config/translations.js` → translation entries you depend on may have shifted
   - `src/config/constants.js` → constants you depend on may have shifted
   - `scripts/node/*` → generators may have new behavior
   - `tests/*` → tests you relied on may have moved
   - `docs/REVAMP_PLAN.md`, `docs/plans/*` → plan documents may have updated

WORK
- If `package.json` or `package-lock.json` changed: run `npm ci` (NOT `npm install`) to
  align node_modules with the lockfile. If `npm ci` fails due to peer-dep drift, surface
  the error and stop.
- If generators under `scripts/node/` changed: run `npm run validate` to detect generator
  output drift. If drift exists, run the relevant generator (`npm run generate-sitemap`,
  `npm run inject-schema`, `npm run enrich-placeholders`, `npm run normalize-shops`) and
  commit a single `chore(regen): regenerate after merge` commit BEFORE resuming feature
  work.
- If `sw.js` `CACHE_NAME` changed on `main`: confirm your branch did not also bump it; if
  both did, take `main`'s value and bump again past it (e.g. `goldtickerlive-v17`).
- If `src/config/translations.js` changed: confirm any new keys your branch references
  still exist in EN + AR.
- If `tests/sw-exclusions.test.js` changed: re-read it and confirm `/admin/*` and `/api/*`
  exclusions are still enforced.
- Run `npm test` and `npm run validate`. If either fails, fix BEFORE resuming feature
  work — do not stack new edits on top of a broken base.

CONSTRAINTS
- Do not silently revert merge changes. If a `main` change conflicts with your branch's
  intent, surface it; do not paper over it.
- Do not run `git reset --hard` to "fix" a confusing merge state.
- Do not commit `dist/` or `node_modules/`.
- Do not skip the regen commit if generators drifted; future regens will produce noisy
  diffs in your feature PR otherwise.

VERIFY
- `git status --short` (clean)
- `npm ci` (if lockfile changed)
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run build` (sanity, optional)

DELIVERABLE
- A `chore(regen): regenerate after merge` commit if any generator drifted.
- A short "post-merge note" in the session log listing what changed on `main` and what
  you re-ran.
- §51 final report when session ends.
```

**Files / surfaces Copilot should inspect:**
- `git status`, `git log`, `git diff HEAD@{1}..HEAD --stat`
- `package.json`, `package-lock.json`
- `sw.js` (CACHE_NAME)
- `manifest.json`, `vite.config.js`, `CNAME`
- `src/config/translations.js`, `src/config/constants.js`
- Every changed `scripts/node/*` file
- Every changed `tests/*` file
- `docs/REVAMP_PLAN.md`, `docs/plans/*`

**Required checks:**
- `git status --short` (must be clean before resuming)
- `npm ci` if lockfile changed
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run build` (optional sanity)

**Expected final report:**
- List of files that changed via the pull/merge.
- Whether `npm ci` was needed.
- Whether any generators were re-run, and the regen commit SHA.
- Whether SW `CACHE_NAME` needed bumping.
- §51 final report.

**Safety notes:**
- Cite [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs) for every
  deployment-sensitive file you re-checked.
- If `main` introduced a price math change, AED peg change, or freshness threshold change,
  do NOT silently inherit it on a feature branch unrelated to data — flag it and ask the
  owner.
- The DOM-safety baseline may have shifted. Re-run `node scripts/node/check-unsafe-dom.js`
  and confirm 0 sinks in `src/tracker/render.js`.

**Failure modes to watch for:**
- Agent skips `npm ci` after a lockfile change and ships a PR that builds locally but
  fails CI.
- Agent forgets to bump `sw.js` `CACHE_NAME` past the value on `main`, shipping a PR with
  a regressed cache version.
- Agent stacks feature edits on top of unresolved merge markers.
- Agent commits regenerated files mixed with feature edits in the same commit, making the
  PR un-reviewable.
- Agent assumes `npm install` is equivalent to `npm ci` — it is not when the goal is
  reproducibility.

**Cross-references:**
- → [§5c Generated-vs-Source Drift Audit](#5c-generated-vs-source-drift-audit)
- → [§7 Before New PR Prompt](#7-before-new-pr-prompt)
- → [§40 Dependency Audit & Advisory Check](#40-dependency-audit--advisory-check)

---

## 7. Before New PR Prompt

**Purpose:**
The last gate before opening a PR. Force the agent to do a structured pre-PR review against
the deployment-sensitive carve-outs, the generator regen rules, and the commit-shape
expectations. Catches the worst PR-hygiene failures: accidental `CNAME` edits, missing
sitemap regen, monolithic mega-commits, and skipped tests.

**When to use:**
- Immediately before calling `report_progress` for the final commit of a session.
- Immediately before `create_pull_request`.
- After running [§19 Large PR Execution](#19-large-pr-execution-prompt).
- After [§6 After Pull / After Merge](#6-after-pull--after-merge-prompt) when the
  resumed feature work is now complete.

**Copy-paste prompt:**

```text
You are about to open a PR on Gold Ticker Live. Before you do, run this pre-PR gate.

INSPECT FIRST
1. Run `git branch --show-current`. Confirm the branch name describes the change.
2. Run `git status --short`. Tree must be clean.
3. Run `git log --oneline origin/main..HEAD`. Each commit must be single-purpose,
   themed, and not exceed ~400 lines unless it is intentionally a generator regen.
4. Run `git diff --stat origin/main..HEAD` and `git diff --name-only origin/main..HEAD`.
   Walk through every file. For each, decide:
   - Is it a deployment-sensitive carve-out (CNAME, vite.config.js base, manifest.json
     start_url/scope, .github/workflows/*, _headers, _redirects)? If yes — was the change
     intentional and explicit? If no — revert.
   - Is it a generated file (countries/**/*.html, content/**/*.html, sitemap.xml,
     data/shops*.json)? If yes — was its source generator (scripts/node/*) updated in the
     same commit? If no — re-run the generator now.
   - Is it a translation file (src/config/translations.js)? If yes — does every new key
     have BOTH en and ar entries?
   - Is it a CSS file? If yes — does it use design tokens from styles/global.css instead
     of raw hex/rem values?
   - Is it a service-worker file (sw.js)? If yes — was CACHE_NAME bumped?
5. Read each commit message. Confirm `Conventional Commits`-style themes (`feat`, `fix`,
   `docs`, `chore`, `refactor`, `test`, `perf`, `style`).

WORK
- Re-run `npm run validate` from a clean tree. If it fails, fix before opening the PR.
- Re-run `npm test`. If it fails, fix before opening the PR.
- Re-run `npm run lint`. If it fails, fix before opening the PR.
- Re-run `npm run build`. If it fails, fix before opening the PR.
- Re-run `npm run quality` (lint + format:check + style). If `format:check` fails, run
  `npm run format` and commit the result as a `chore(format): prettier auto-fix` commit.
- If you touched any DOM code: re-run `node scripts/node/check-unsafe-dom.js` and confirm
  no new innerHTML/outerHTML/insertAdjacentHTML sinks were introduced.
- If you touched any SEO surface: re-run `npm run seo-audit` and
  `node scripts/node/check-seo-meta.js`.
- If you touched any sitemap-relevant page: confirm `node scripts/node/check-sitemap-
  coverage.js` passes.
- If you touched workflows under `.github/workflows/*`: confirm action SHA pins are
  present and `.github/workflows/README.md` SHA pin reference table is updated if
  applicable.

CONSTRAINTS
- Do not force-push.
- Do not push to `main` directly.
- Do not skip tests.
- Do not bundle generator regen in the same commit as feature work — they belong in
  separate themed commits.
- Do not include `dist/` or `node_modules/` in the diff.
- Do not include any secret in the diff.

VERIFY
- `git status --short` (clean)
- `git log --oneline origin/main..HEAD`
- `git diff --stat origin/main..HEAD`
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run quality`
- Spot-check: did you accidentally edit `CNAME`, `vite.config.js`, `manifest.json`,
  `sw.js`, `_headers`, or any workflow without an intentional reason?

DELIVERABLE
- PR body with What / Why / How / Proof / Risks sections.
- The §51 Session Final Report inside the PR body.
- Cite §50 carve-outs preserved.
- Cite §52 manual follow-up required.
- Open the PR as draft if the work is iterative.
```

**Files / surfaces Copilot should inspect:**
- `git status`, `git log`, `git diff --stat`, `git diff --name-only`
- `CNAME`, `vite.config.js`, `manifest.json`, `sw.js`, `_headers`, `_redirects`
- `.github/workflows/*.yml`
- Every changed file from `git diff --name-only origin/main..HEAD`

**Required checks:**
- `git status --short`
- `git log --oneline origin/main..HEAD`
- `git diff --stat origin/main..HEAD`
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run quality`
- `node scripts/node/check-unsafe-dom.js` (if DOM touched)
- `npm run seo-audit` and `node scripts/node/check-seo-meta.js` (if SEO touched)
- `node scripts/node/check-sitemap-coverage.js` (if sitemap-relevant)

**Expected final report:**
- Branch name, commit count, line count by area.
- Confirmation that no deployment-sensitive carve-out was changed.
- Confirmation that every generated file in the diff has a matching generator update.
- Test / lint / validate / build status.
- §51 final report inside the PR body.

**Safety notes:**
- Never let the PR body claim "tests pass" if you didn't actually run them.
- The DOM-safety baseline must not regress.
- The SW `CACHE_NAME` should be bumped exactly once per feature; if it was bumped on
  `main` since you started, take `main`'s value and bump past it.

**Failure modes to watch for:**
- Agent ships a PR that includes accidental whitespace edits in `CNAME` or `manifest.json`.
- Agent ships a 1500-line PR as a single commit, making review and rollback hard.
- Agent skips `npm run quality` and ships a PR that fails CI on `format:check`.
- Agent ships a PR that introduces a new innerHTML sink.
- Agent ships a PR that bumps `sw.js` `CACHE_NAME` to a value lower than `main`'s.
- Agent ships a PR with edited generated files but no generator updates.

**Cross-references:**
- → [§19 Large PR Execution Prompt](#19-large-pr-execution-prompt)
- → [§20 Final Verification and Deploy Safety Prompt](#20-final-verification-and-deploy-safety-prompt)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§51 Expected Final-Report Format](#51-expected-final-report-format)

---
