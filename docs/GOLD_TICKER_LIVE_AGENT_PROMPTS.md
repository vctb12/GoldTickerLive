# Gold Ticker Live — Agent Prompt Library

> **Version:** v2.0.0 — Last updated: 2026-04-30 **Brand:** Gold Ticker Live (compact: GTL)
> **Domain:** [https://goldtickerlive.com/](https://goldtickerlive.com/) **GitHub repo:**
> `vctb12/Gold-Prices` (Pages historical URL: `vctb12.github.io/Gold-Prices/`) **Some `Gold Prices`
> and `/Gold-Prices/` references in this repo are intentional carve-outs.** See
> [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs) before sweeping any rename.

This file is the canonical, repo-aware operating manual for every coding agent that touches the
**Gold Ticker Live** codebase — GitHub Copilot Agent (cloud, CLI, IDE chat), Claude Code, Codex,
Cursor, Gemini CLI, Windsurf, Aider. It exists to make sessions short, deep, and safe: every prompt
below is copy-paste-ready, references real files and real commands in this repo, and is structured
so a future agent can paste a single section into a fresh task box and ship useful work without
reading the rest of the file.

The library is opinionated by design. It tells agents _what_ to inspect, _what_ to change, _what to
leave alone_, _which checks to run_, and _what to put in the final report_. It enforces a session
protocol (§2), a quick picker (§3), a 7-part schema for every prompt, an explicit list of carve-outs
(§50), a final-report template (§51), and a manual follow-up reporting bar (§52).

If you only have time to read three things before starting work, read
[§2 Required Session Protocol](#2-required-session-protocol),
[§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs), and
[§51 Expected Final-Report Format](#51-expected-final-report-format).

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

1. **Pick the prompt that matches the work.** Use the
   [§3 Quick Picker](#3-prompt-index--quick-picker) when the task description is short or ambiguous.
   Don't merge two prompts into one mega-task — agents produce better diffs when scope is clear.
2. **Always start with
   [§4 Universal New Session Starter Prompt](#4-universal-new-session-starter-prompt).** Even if you
   already know which specialized prompt you need, paste §4 first to enforce the session protocol
   (branch check, doc reads, plan before edits). Then chain the specialized prompt as the second
   message of the session.
3. **Paste the prompt verbatim** into the Copilot Agent task box (or the chat panel of your editor).
   The prompts are written in second person and assume the agent has tools to read files, run
   commands, and open a PR.
4. **Let the agent inspect first.** Every prompt opens with an `INSPECT FIRST` block — don't skip
   it. The repo's guardrails (price math, freshness labels, deployment base path, hourly X-post
   workflow, DOM-safety baseline) are non-obvious if the agent only reads a few files.
5. **Work in focused commits.** Each prompt asks the agent to keep commits scoped (tokens vs. layout
   vs. SEO vs. docs). Reviewers and rollbacks are dramatically easier this way. The minimum bar for
   non-trivial work is **≥ 3 themed commits** per PR.
6. **Verify before finishing.** Each prompt ends with the verification commands that exist in
   `package.json` (`npm run validate`, `npm test`, `npm run quality`, `npm run build`). The agent
   must state what it ran vs. what it inferred — see [§51](#51-expected-final-report-format).
7. **Don't break deployment.** The site ships from `main` to GitHub Pages on the custom domain
   `goldtickerlive.com`. Never silently change `CNAME`, `vite.config.js` `base` (currently `'/'`),
   the service-worker scope, canonical URLs, or the `countries/**/gold-prices/` URL paths. See
   [§50](#50-safety-rules-and-carve-outs).
8. **Bilingual is non-negotiable.** Any user-visible string lives in `src/config/translations.js`
   and ships in EN + AR. RTL layout must work for every surface that gets touched.
9. **Open a draft PR early.** For multi-step work, publish the plan as a draft PR first so the owner
   can redirect cheaply.

### When to chain prompts

- **Broad UX work →** [§4 Universal Starter](#4-universal-new-session-starter-prompt) →
  [§8 Full UI/UX Revamp](#8-full-uiux-revamp-prompt) →
  [§19 Large PR Execution](#19-large-pr-execution-prompt) →
  [§20 Final Verification](#20-final-verification-and-deploy-safety-prompt).
- **Tracker work →** [§4](#4-universal-new-session-starter-prompt) →
  [§9 Live Tracker Upgrade](#9-live-tracker-upgrade-prompt) →
  [§30 Chart Component](#30-chart-component) (if charts are touched) →
  [§20](#20-final-verification-and-deploy-safety-prompt).
- **SEO work →** [§4](#4-universal-new-session-starter-prompt) →
  [§5b SEO Alignment Audit](#5b-seo-surface-alignment-audit) →
  [§10 SEO and Indexing](#10-seo-and-indexing-prompt) →
  [§24 FAQ + Structured Data](#24-faq--structured-data) →
  [§20](#20-final-verification-and-deploy-safety-prompt).
- **Brand consistency work →** [§4](#4-universal-new-session-starter-prompt) →
  [§5a Brand Consistency Audit](#5a-cross-surface-brand-consistency-audit) →
  [§17 Rebrand Maintenance](#17-rebrand-maintenance-prompt) →
  [§20](#20-final-verification-and-deploy-safety-prompt).
- **After git pull on a long-running branch →**
  [§6 After Pull / After Merge](#6-after-pull--after-merge-prompt) → resume the prompt you were in
  the middle of.

### How to recover a stalled agent

If the agent is going in circles, hand-wringing, or producing tiny edits when the task needs broad
work, paste **[§19 Large PR Execution Prompt](#19-large-pr-execution-prompt)** verbatim into the
same session. It re-orients the agent toward small, sequenced, themed commits.

If the agent is making sweeping rewrites that break carve-outs, paste
**[§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)** verbatim, then ask it to
revert the carve-out violations specifically.

### How to scope a session

Each session should produce **one PR**. If the work spans more than one of the §§8–48 prompts,
either:

- Use [§19 Large PR Execution Prompt](#19-large-pr-execution-prompt) and explicitly enumerate which
  sub-prompts are in scope, in execution order; or
- Open multiple sequential sessions, each driven by one specialized prompt, each producing one PR.
  Prefer this when the scopes are independent.

### How to read the safety rules

[§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs) is the most important section of
this file. Every prompt cites it. Every final report must list which carve-outs were preserved. If
an agent ever proposes to change anything listed under "do NOT change without explicit instruction"
in §50, **stop, ask the owner, and document the request**. Do not silently override.

---

## 2. Required Session Protocol

Every Copilot Agent session that touches this repo must follow this protocol, in order. The
[§4 Universal Starter Prompt](#4-universal-new-session-starter-prompt) encodes it, but every other
prompt assumes the agent has already done these steps.

1. **Branch check.** Run `git branch --show-current` and `git status --short`. Confirm you are on a
   feature branch (not `main`). Confirm the working tree is clean before editing.
2. **History scan.** Run `git log --oneline -20` and `git diff main..HEAD --stat` (after fetching
   `main` if the clone is shallow). Note which files have moved recently — those are the most likely
   to surprise.
3. **Read the canon.** Open these files in this order:
   - `README.md`
   - `AGENTS.md`
   - `.github/copilot-instructions.md`
   - `docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md` _(this file)_
   - `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`
   - `docs/REVAMP_PLAN.md`
4. **Find the active plan.** List `docs/plans/` and read the most recent `YYYY-MM-DD_*.md` plan. If
   your task corresponds to a plan, your work updates it; if not, write a new plan to
   `docs/plans/YYYY-MM-DD_<slug>.md` before any non-trivial edit and open a draft PR.
5. **Inspect surfaces.** Use [§3 Quick Picker](#3-prompt-index--quick-picker) to identify which
   files are in scope. Open every one, plus their tests in `tests/`, plus any generator script in
   `scripts/node/`.
6. **Search before editing.** Run the relevant ripgrep audits from
   [§49 Validation Commands Reference](#49-validation-commands-reference) **before** writing any
   change. Brand-touching work runs the rebrand sweep. Metadata-touching work runs the SEO sweep.
   DOM-touching work runs the `innerHTML/outerHTML/insertAdjacentHTML` sweep against `src/`.
7. **Write a plan.** As the first message of the session, post a short repo-aware plan. List the
   files you intend to change, the commit themes you intend to ship, the carve-outs you intend to
   preserve, and the verification commands you intend to run. Refuse to start editing until the plan
   exists.
8. **Edit generators before generated files.** If a generator under `scripts/node/` produces the
   file you want to change (sitemap, JSON-LD, placeholder pages, normalized shops, RSS), edit the
   **generator** first, then re-run it, then commit both. Never hand-edit a generated file without
   also updating its generator in the same commit.
9. **Run the relevant checks.** From [§49](#49-validation-commands-reference), run at minimum:
   `npm run lint`, `npm test`, `npm run validate`, `npm run build`. Run extended checks
   (`seo-audit`, `check-links`, `image-audit`, `pre-deploy`) when the surface area calls for it.
10. **Produce the final report.** End the session with the
    [§51 Final-Report Format](#51-expected-final-report-format) verbatim, filled in. Cite §50
    carve-outs preserved and §52 manual follow-up required.

> Skipping any of steps 1, 3, 7, or 10 is a protocol violation and grounds for the reviewer to
> request that the PR be redone.

---

## 3. Prompt Index / Quick Picker

Find the situation, follow the row.

| Situation                                 | Use prompt §                                                                                       | Primary files                                                                                                                                 | Primary checks                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Starting a new session                    | [§4](#4-universal-new-session-starter-prompt)                                                      | `README.md`, `AGENTS.md`, `.github/copilot-instructions.md`, this file, `docs/REVAMP_PLAN.md`                                                 | `git status`, `git branch`, `npm test`                                                                    |
| After `git pull` on a long-running branch | [§6](#6-after-pull--after-merge-prompt)                                                            | recently-changed files, `package-lock.json`, `sw.js`                                                                                          | `npm ci`, `npm run validate`, `npm test`                                                                  |
| Before opening a PR                       | [§7](#7-before-new-pr-prompt)                                                                      | `git diff --stat`, `CNAME`, `vite.config.js`, `manifest.json`, workflows                                                                      | `git diff`, `npm run validate`, `npm run build`                                                           |
| Brand / rebrand consistency check         | [§5a](#5a-cross-surface-brand-consistency-audit), [§17](#17-rebrand-maintenance-prompt)            | `manifest.json`, `package.json`, `src/seo/*`, `src/config/translations.js`, README/docs                                                       | rebrand ripgrep sweep, `npm run validate`                                                                 |
| SEO / indexing alignment                  | [§5b](#5b-seo-surface-alignment-audit), [§10](#10-seo-and-indexing-prompt)                         | `src/seo/*`, `scripts/node/inject-schema.js`, `scripts/node/generate-sitemap.js`, `robots.txt`, `sitemap.xml`                                 | `npm run seo-audit`, `node scripts/node/check-seo-meta.js`, `node scripts/node/check-sitemap-coverage.js` |
| Generated vs source drift                 | [§5c](#5c-generated-vs-source-drift-audit), [§18](#18-generated-files-and-source-generator-prompt) | `scripts/node/inject-schema.js`, `scripts/node/generate-sitemap.js`, `countries/**/*.html`                                                    | `node scripts/node/inject-schema.js --check`, `npm run generate-sitemap`, `git status`                    |
| Full UI/UX revamp                         | [§8](#8-full-uiux-revamp-prompt)                                                                   | `index.html`, `tracker.html`, `styles/global.css`, `styles/pages/*`, `src/components/nav.js`, `src/components/footer.js`, `src/pages/home.js` | `npm run validate`, `npm run build`, manual screenshots                                                   |
| Live tracker upgrade                      | [§9](#9-live-tracker-upgrade-prompt)                                                               | `tracker.html`, `src/tracker/*`, `src/lib/live-status.js`, `src/lib/api.js`, `src/lib/cache.js`                                               | `npm test`, `npm run validate`, manual at 360px and 1440px                                                |
| SEO / indexing                            | [§10](#10-seo-and-indexing-prompt)                                                                 | `src/seo/*`, `inject-schema.js`, `generate-sitemap.js`, `robots.txt`, `countries/**`                                                          | `npm run seo-audit`, `npm run validate`                                                                   |
| PWA / SW / performance                    | [§11](#11-pwa--service-worker--performance-prompt)                                                 | `manifest.json`, `sw.js`, `offline.html`, `tests/sw-exclusions.test.js`, Lighthouse                                                           | `npm test`, `npm run perf:ci`, `npm run image-audit`                                                      |
| Arabic / RTL parity                       | [§12](#12-arabic--rtl-quality-prompt)                                                              | `src/config/translations.js`, `src/lib/i18n.js`, every touched HTML/CSS surface                                                               | `npm run validate`, manual RTL spot-check                                                                 |
| Shops directory                           | [§13](#13-shops-directory-prompt)                                                                  | `shops.html`, `src/pages/shops/*`, `data/shops*.json`, `scripts/node/normalize-shops.js`                                                      | `npm run normalize-shops`, `npm test`, `npm run validate`                                                 |
| Calculator / tools                        | [§14](#14-calculator-and-tools-prompt)                                                             | `calculator.html`, `src/pages/calculator/*`, `src/lib/price-calculator.js`                                                                    | `npm test` (`tests/price-calculator.test.js`), `npm run validate`                                         |
| Data reliability / methodology            | [§15](#15-data-reliability-and-methodology-prompt)                                                 | `src/lib/api.js`, `src/lib/cache.js`, `src/lib/live-status.js`, `methodology.html`                                                            | `npm test`, `npm run validate`                                                                            |
| Docs / governance pass                    | [§16](#16-docs-and-governance-prompt)                                                              | `docs/**`, `README.md`, `AGENTS.md`, `.github/copilot-instructions.md`                                                                        | `npm run format:check`, link audits                                                                       |
| Generated files / source generators       | [§18](#18-generated-files-and-source-generator-prompt)                                             | every `scripts/node/*` generator                                                                                                              | per-script `--check`, `npm run validate`                                                                  |
| Large multi-area PR                       | [§19](#19-large-pr-execution-prompt)                                                               | varies                                                                                                                                        | `npm run validate`, `npm run quality`, `npm run build`                                                    |
| Final verification before deploy          | [§20](#20-final-verification-and-deploy-safety-prompt)                                             | full repo                                                                                                                                     | `npm run pre-deploy`, full check matrix                                                                   |
| Homepage hero polish                      | [§21](#21-homepage-hero--above-the-fold)                                                           | `index.html`, `src/pages/home.js`, `styles/pages/home.css`                                                                                    | `npm run validate`, manual 360/1440                                                                       |
| Country / city deep dive                  | [§22](#22-country--city-pages-deep-dive)                                                           | `countries/**`, `scripts/node/generate-placeholders.js`, `scripts/node/enrich-placeholder-pages.js`                                           | `npm run enrich-placeholders`, `npm run validate`                                                         |
| Content guide writing                     | [§23](#23-content-guide-library)                                                                   | `content/**`, `learn.html`, `insights.html`                                                                                                   | `npm run check-links`, `npm run validate`                                                                 |
| FAQ / structured data                     | [§24](#24-faq--structured-data)                                                                    | `scripts/node/inject-schema.js`, FAQ surfaces                                                                                                 | `node scripts/node/inject-schema.js --check`, `npm run seo-audit`                                         |
| Site search                               | [§25](#25-site-search)                                                                             | `src/search/*`, `src/lib/search.js`                                                                                                           | `npm test`, `npm run validate`                                                                            |
| Admin panel                               | [§26](#26-admin-panel-ux)                                                                          | `admin/**`, `server/**`, `tests/admin-static.test.js`                                                                                         | `npm test`, `npm start` smoke                                                                             |
| Newsletter / alerts                       | [§27](#27-newsletter--alert-system)                                                                | `scripts/node/generate-newsletter.js`, `scripts/node/send-newsletter.js`, `.github/workflows/daily-newsletter.yml`                            | dry-run send, workflow lint                                                                               |
| X / Twitter automation                    | [§28](#28-xtwitter-automation-polish)                                                              | `scripts/node/tweet-gold-price.js`, `scripts/python/gold_poster.py`, `.github/workflows/post_gold.yml`, `src/social/postTemplates.js`         | python dry-run, workflow lint                                                                             |
| Pricing / Invest                          | [§29](#29-pricing--invest-pages)                                                                   | `pricing.html`, `invest.html`, `src/pages/*`                                                                                                  | `npm run validate`                                                                                        |
| Chart component                           | [§30](#30-chart-component)                                                                         | `src/components/chart.js`, `src/pages/tracker-chart-loader.js`                                                                                | `npm test`, manual tracker check                                                                          |
| Footer / internal links / breadcrumbs     | [§31](#31-footer-internal-links--breadcrumbs)                                                      | `src/components/footer.js`, `src/components/internalLinks.js`, `src/components/breadcrumbs.js`                                                | `npm run check-links`, `npm run validate`                                                                 |
| Compare countries / today's best rates    | [§32](#32-compare-countries--todays-best-rates)                                                    | `content/compare-countries/*`, `content/todays-best-rates/*`                                                                                  | `npm run validate`                                                                                        |
| Social sharing / embed widget             | [§33](#33-social-sharing--embed-widget)                                                            | `src/social/*`, `embed/**`, `src/seo/seoHead.js`                                                                                              | `npm run validate`, manual share preview                                                                  |
| Submit shop / order gold                  | [§34](#34-submit-shop--order-gold-flows)                                                           | `src/pages/submit-shop.js`, `content/order-gold/*`, `server/routes/submissions.js`                                                            | `npm test`, manual submission                                                                             |
| Dark mode / theming                       | [§35](#35-dark-mode--theme-system)                                                                 | `styles/global.css`, `src/components/nav.js` (`_applyTheme`)                                                                                  | manual theme cycle, `npm run style`                                                                       |
| Analytics events                          | [§36](#36-analytics-events-standardization)                                                        | analytics call sites across `src/`                                                                                                            | `rg "gtag\|dataLayer"`, `npm run validate`                                                                |
| GitHub Actions hardening                  | [§37](#37-github-actions-workflow-hardening)                                                       | `.github/workflows/*`, `.github/workflows/README.md`                                                                                          | workflow lint, SHA pin audit                                                                              |
| Pre-deploy / changelog / release          | [§38](#38-pre-deploy-changelog--release)                                                           | `scripts/node/pre-deploy-check.js`, `scripts/node/changelog.js`, `scripts/node/package-release.js`                                            | `npm run pre-deploy`, `npm run changelog`                                                                 |
| E2E / coverage                            | [§39](#39-e2e--coverage)                                                                           | `tests/e2e/**`, `playwright.config.js`                                                                                                        | `npx playwright test`, `npm run test:coverage`                                                            |
| Dependency audit                          | [§40](#40-dependency-audit--advisory-check)                                                        | `package.json`, `package-lock.json`                                                                                                           | `npm audit`, `npm outdated`, GitHub Advisory DB                                                           |
| Placeholder / stub completion             | [§41](#41-placeholder--stub-page-completion)                                                       | `scripts/node/enrich-placeholder-pages.js`, stub pages                                                                                        | `npm run enrich-placeholders -- --check`, `npm run validate`                                              |
| Mobile-first audit                        | [§42](#42-mobile-first-layout-audit)                                                               | every page CSS                                                                                                                                | manual 320/360/414, `npm run style`                                                                       |
| RSS / news                                | [§43](#43-rss-feed--news)                                                                          | `scripts/node/generate-rss.js`, `content/news/*`                                                                                              | RSS validator, `npm run validate`                                                                         |
| Supabase data sync                        | [§44](#44-supabase-data-sync)                                                                      | `src/config/supabase.js`, `.github/workflows/sync-db-to-git.yml`, `docs/SUPABASE_*.md`                                                        | dry-run sync, `npm test`                                                                                  |
| 404 / redirects                           | [§45](#45-404--error-pages--redirect-hygiene)                                                      | `404.html`, `_redirects`, `src/pages/not-found.js`                                                                                            | `npm run check-links`, manual 404                                                                         |
| Image audit                               | [§46](#46-image-audit--asset-optimization)                                                         | `assets/**`, `scripts/node/image-audit.js`                                                                                                    | `npm run image-audit`, Lighthouse                                                                         |
| Repo cleanup                              | [§47](#47-repo-cleanup-and-architecture)                                                           | dead code, dead docs                                                                                                                          | `rg`, `npm run validate`                                                                                  |
| Monetization / growth                     | [§48](#48-monetization-and-growth)                                                                 | `src/components/adSlot.js`, `AD_CONFIG` in `src/config/constants.js`                                                                          | manual, `npm run validate`                                                                                |

---

## 4. Universal New Session Starter Prompt

**Purpose:** Force every Copilot Agent session to start with the
[§2 Required Session Protocol](#2-required-session-protocol) before any code edit. This prompt
prevents the most common failure mode — agents that start editing files before they understand the
repo's deployment, SEO, bilingual, and DOM-safety guardrails. Pasting this prompt verbatim is the
cheapest insurance against shallow PRs and carve-out violations.

**When to use:**

- The very first message of every session, regardless of which specialized prompt follows.
- When resuming a stalled session and the agent has lost context.
- When onboarding a new agent (Codex, Cursor, Gemini, Claude Code) that has not seen this repo
  before.
- When the task description from the owner is short ("fix the homepage", "improve SEO") and needs to
  be expanded into a real plan.
- After `git pull` on a long-running branch, immediately followed by
  [§6](#6-after-pull--after-merge-prompt).

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
  source, the `STALE_AFTER_MS = 75 minutes` threshold (`DELAYED_AFTER_MS = 30 minutes`), or the
  `FX_STALE_AFTER_MS = 26 hours` threshold without an explicit owner instruction.
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
- `src/config/constants.js` (real values for `AED_PEG`, `TROY_OZ_GRAMS`, `GOLD_REFRESH_MS`,
  `BASE_PATH`, `CACHE_KEYS`)
- `manifest.json`, `sw.js`, `vite.config.js`, `CNAME`

**Required checks:**

- `git branch --show-current`
- `git status --short`
- `git log --oneline -20`
- `git diff main..HEAD --stat` (after fetch)
- `npm test` (sanity)
- Whatever ripgrep sweep from [§49](#49-validation-commands-reference) corresponds to the task
  scope.

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

- Agent skips reading `AGENTS.md` and `.github/copilot-instructions.md`, then proposes changes that
  violate documented carve-outs.
- Agent edits a generated `countries/**/*.html` file directly without re-running its generator.
- Agent silently bumps `vite.config.js` `base` or `manifest.json` `start_url`/`scope`.
- Agent translates English strings into Arabic literally instead of via
  `src/config/translations.js`.
- Agent ships a one-commit "change 3 lines" PR for a task that calls for substantive work.
- Agent assumes a script (`npm run typecheck`, `npm run e2e`) exists when it does not — always
  cross-check against the real `scripts.*` map in `package.json`.
- Agent claims tests pass without running them. The §51 report must distinguish ran vs. inferred.

**Cross-references:**

- → [§2 Required Session Protocol](#2-required-session-protocol)
- → [§3 Quick Picker](#3-prompt-index--quick-picker)
- → [§49 Validation Commands Reference](#49-validation-commands-reference)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§51 Expected Final-Report Format](#51-expected-final-report-format)
- → [§52 Manual Follow-Up Reporting Expectations](#52-manual-follow-up-reporting-expectations)

---

## 5. Repo Synergy and Consistency Audit Prompts

This section bundles three sibling audit prompts. They are short to run, high-leverage, and should
be paired with the matching specialized prompt whenever you ship work in that surface:

- **§5a Cross-Surface Brand Consistency Audit** — pair with
  [§17 Rebrand Maintenance](#17-rebrand-maintenance-prompt).
- **§5b SEO Surface Alignment Audit** — pair with
  [§10 SEO and Indexing](#10-seo-and-indexing-prompt).
- **§5c Generated-vs-Source Drift Audit** — pair with
  [§18 Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt).

Each is a stand-alone session. Run any of them weekly even if no feature work is in flight — they
catch drift before it ships.

---

### 5a. Cross-Surface Brand Consistency Audit

**Purpose:** Verify that every brand-bearing surface in the repo agrees on **"Gold Ticker Live"** as
the canonical brand and `goldtickerlive.com` as the canonical domain — without breaking the
intentional carve-outs (`/Gold-Prices/` deployment paths, `gold_prices` schema names,
`countries/**/gold-prices/` SEO paths, `@GoldTickerLive` handle, historical changelog references).
The audit produces a classified report of every match: `Fix now`, `Intentional carve-out`, or
`Manual owner decision`.

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
- `countries/**/*.html`, `content/**/*.html` (classify whether each match comes from a generator)
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

- The carve-outs listed in [§50](#50-safety-rules-and-carve-outs) are NOT bugs. Document them in the
  final report; do not silently rewrite them.
- `.github/workflows/post_gold.yml` is production. Brand strings inside it that affect post output
  go through `src/social/postTemplates.js` or `scripts/python/gold_poster.py`; do not hand-edit the
  workflow file's `run:` block.

**Failure modes to watch for:**

- Agent silently rewrites every `gold_prices` to `gold_ticker_live`, breaking the
  `data/gold_price.json` filename, the JSON-LD product schema, and the Supabase table.
- Agent rewrites `/Gold-Prices/` paths in archived workflow files or historical docs.
- Agent edits `countries/**/*.html` directly instead of fixing the generator.
- Agent assumes "Gold Prices" in `CHANGELOG.md` is a bug and rewrites historical entries.
- Agent edits the `@GoldTickerLive` handle to "@gold_ticker_live" or similar, breaking the live X
  automation.
- Agent updates `manifest.json` `name` to a different string than what's already shipped to
  installed PWAs without bumping `sw.js` `CACHE_NAME`.

**Cross-references:**

- → [§17 Rebrand Maintenance Prompt](#17-rebrand-maintenance-prompt) (deeper variant with
  classification logic and worked example)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§49 Validation Commands Reference](#49-validation-commands-reference) (rebrand ripgrep sweeps)

---

### 5b. SEO Surface Alignment Audit

**Purpose:** Verify that every SEO-bearing surface for a given page agrees: the `<title>`, the
`<meta name="description">`, the `<link rel="canonical">`, the `hreflang` pairs, the OG and Twitter
card metadata, the JSON-LD inserted by `scripts/node/inject-schema.js`, the breadcrumb schema, the
sitemap entry, the internal links pointing at the page, and the visible H1 should all describe the
same page. Drift between these surfaces silently kills indexing.

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
- Drift summary: counts (titles drifting, canonicals drifting, hreflang missing, schema stale,
  etc.).
- List of generators edited and outputs re-emitted.
- §51 final report.

**Safety notes:**

- Canonical URL paths under `countries/**/gold-prices/` are SEO-load-bearing. Do not change them
  without redirects.
- `robots.txt` `Disallow: /admin/` and `Disallow: /api/` are required carve-outs.
- The site is bilingual; `hreflang` pairs must remain bidirectional.

**Failure modes to watch for:**

- Agent fixes `<title>` on a generated page directly without updating `enrich-placeholder-pages.js`
  — fix is reverted on next regeneration.
- Agent adds a canonical pointing at the dev domain.
- Agent removes `hreflang` because "the page only has English content" without checking
  `src/config/translations.js`.
- Agent introduces a canonical loop by pointing two pages at each other.
- Agent silently changes `og:image` paths that are referenced elsewhere (newsletter, embed).
- Agent ships SEO changes without re-running `npm run generate-sitemap` and re-injecting schema.

**Cross-references:**

- → [§10 SEO and Indexing Prompt](#10-seo-and-indexing-prompt)
- →
  [§18 Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt)
- → [§24 FAQ + Structured Data](#24-faq--structured-data)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

### 5c. Generated-vs-Source Drift Audit

**Purpose:** Detect drift between source generators (`scripts/node/*`) and the files they produce
(`countries/**/*.html`, `content/**/*.html`, `data/shops.json`, `sitemap.xml`, JSON-LD blocks
injected into HTML, `feed.xml`, newsletter HTML). The repo's build pipeline (`npm run build`) runs
`extract-baseline → normalize-shops → inject-schema → generateSitemap → vite build`. Any agent that
edited a generated file directly without updating the generator has shipped a time-bomb that
silently regenerates away.

**When to use:**

- After any session that may have hand-edited generated files.
- Before opening any PR that touches `countries/**`, `content/**`, `data/shops*.json`, or
  `sitemap.xml`.
- After any change to `scripts/node/inject-schema.js`, `scripts/node/generate-sitemap.js`,
  `scripts/node/enrich-placeholder-pages.js`, `scripts/node/generate-placeholders.js`,
  `scripts/node/normalize-shops.js`, `scripts/node/generate-rss.js`,
  `scripts/node/generate-newsletter.js`.
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

- `scripts/node/inject-schema.js` is NOT idempotent. Treat its drift carefully — running it on a
  clean tree will produce diffs when source HTML mtimes shift. Only commit those diffs when you
  intend to refresh schema dates.
- The build pipeline order is canonical:
  `extract-baseline → normalize-shops → inject-schema → generateSitemap → vite build`. Do not
  reorder.
- Generated `countries/**/*.html` and `content/**/*.html` may be hand-edited only when the same
  commit also updates the generator; otherwise the next regen reverts the change.

**Failure modes to watch for:**

- Agent commits regenerated `countries/**/*.html` from `inject-schema.js` mtime drift, shipping a
  noisy diff that has no real meaning.
- Agent fixes a country-page H1 directly without updating `enrich-placeholder-pages.js` — fix
  vanishes on next regen.
- Agent runs generators in the wrong order (e.g. `vite build` before `inject-schema.js`) and misses
  schema injection.
- Agent commits `dist/`.
- Agent renames a generator file and breaks `package.json` `scripts.build`.
- Agent adds a `--check` flag to a generator without keeping the existing emit behavior intact.

**Cross-references:**

- →
  [§18 Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt)
- → [§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
- → [§41 Placeholder & Stub Page Completion](#41-placeholder--stub-page-completion)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 6. After Pull / After Merge Prompt

**Purpose:** Force the agent to do a structured sanity pass after `git pull` or after merging `main`
into a long-running feature branch. Long-running branches in this repo silently accumulate drift in
generated files, dependency lockfiles, service-worker cache versions, and translation entries. This
prompt catches that drift before the agent resumes feature work on a stale base.

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
- If `main` introduced a price math change, AED peg change, or freshness threshold change, do NOT
  silently inherit it on a feature branch unrelated to data — flag it and ask the owner.
- The DOM-safety baseline may have shifted. Re-run `node scripts/node/check-unsafe-dom.js` and
  confirm 0 sinks in `src/tracker/render.js`.

**Failure modes to watch for:**

- Agent skips `npm ci` after a lockfile change and ships a PR that builds locally but fails CI.
- Agent forgets to bump `sw.js` `CACHE_NAME` past the value on `main`, shipping a PR with a
  regressed cache version.
- Agent stacks feature edits on top of unresolved merge markers.
- Agent commits regenerated files mixed with feature edits in the same commit, making the PR
  un-reviewable.
- Agent assumes `npm install` is equivalent to `npm ci` — it is not when the goal is
  reproducibility.

**Cross-references:**

- → [§5c Generated-vs-Source Drift Audit](#5c-generated-vs-source-drift-audit)
- → [§7 Before New PR Prompt](#7-before-new-pr-prompt)
- → [§40 Dependency Audit & Advisory Check](#40-dependency-audit--advisory-check)

---

## 7. Before New PR Prompt

**Purpose:** The last gate before opening a PR. Force the agent to do a structured pre-PR review
against the deployment-sensitive carve-outs, the generator regen rules, and the commit-shape
expectations. Catches the worst PR-hygiene failures: accidental `CNAME` edits, missing sitemap
regen, monolithic mega-commits, and skipped tests.

**When to use:**

- Immediately before calling `report_progress` for the final commit of a session.
- Immediately before `create_pull_request`.
- After running [§19 Large PR Execution](#19-large-pr-execution-prompt).
- After [§6 After Pull / After Merge](#6-after-pull--after-merge-prompt) when the resumed feature
  work is now complete.

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
- The SW `CACHE_NAME` should be bumped exactly once per feature; if it was bumped on `main` since
  you started, take `main`'s value and bump past it.

**Failure modes to watch for:**

- Agent ships a PR that includes accidental whitespace edits in `CNAME` or `manifest.json`.
- Agent ships a 1500-line PR as a single commit, making review and rollback hard.
- Agent skips `npm run quality` and ships a PR that fails CI on `format:check`.
- Agent ships a PR that introduces a new innerHTML sink.
- Agent ships a PR that bumps `sw.js` `CACHE_NAME` to a value lower than `main`'s.
- Agent ships a PR with edited generated files but no generator updates.

**Cross-references:**

- → [§19 Large PR Execution Prompt](#19-large-pr-execution-prompt)
- →
  [§20 Final Verification and Deploy Safety Prompt](#20-final-verification-and-deploy-safety-prompt)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§51 Expected Final-Report Format](#51-expected-final-report-format)

---

## 8. Full UI/UX Revamp Prompt

> **2026-06-01:** For the phased audit remediation (first paint → empty pages → consistency →
> nav/layout → performance), prefer
> [`docs/plans/2026-06-01_ui-ux-audit-remediation-program.md`](plans/2026-06-01_ui-ux-audit-remediation-program.md)
> and `@.github/prompts/ui-ux-audit-phase1-first-paint.prompt.md` through phase 5. The prompt below
> remains a broad revamp catch-all.

**Purpose:** Drive a sitewide UI/UX revamp that makes Gold Ticker Live feel like a serious, premium,
trustworthy live-gold-price platform — not a generic info site. Improve global polish, navigation,
hero flow, card hierarchy, CTA clarity, mobile layout, RTL behavior, trust signals, and visual
rhythm without breaking deployment, SEO, bilingual parity, or DOM safety.

**When to use:**

- The owner asks for a "revamp", "polish pass", "design refresh", or "make it look more premium".
- A round-N polish sprint is planned (see `docs/REVAMP_PLAN.md`).
- A design-token rationalization is in flight.
- After a brand consistency sweep ([§5a](#5a-cross-surface-brand-consistency-audit)) reveals that
  the visual system has drifted.
- Quarterly design-system hygiene.

**Copy-paste prompt:**

```text
You are working on the Gold Ticker Live repo (custom domain: goldtickerlive.com). This is a
bilingual EN/AR static multi-page site (no React, no Next, no SPA). All design tokens live
in `styles/global.css` and `styles/pages/*.css`. All user-visible strings live in
`src/config/translations.js`.

GOAL
Run a sitewide UI/UX revamp that makes the product feel like a serious, premium,
trustworthy live-gold-price platform — not a generic info page. Improve global polish,
navigation, hero flow, card hierarchy, CTA clarity, mobile layout, RTL behavior, trust
signals, and visual rhythm.

INSPECT FIRST
1. Read every entry HTML page at the repo root: `index.html`, `tracker.html`,
   `calculator.html`, `shops.html`, `learn.html`, `insights.html`, `methodology.html`,
   `invest.html`, `pricing.html`, `offline.html`, `404.html`.
2. Read `styles/global.css` (canonical design tokens + primitives). Memorize the token
   namespaces: `--color-*`, `--surface-*`, `--space-*`, `--text-*`, `--radius-*`,
   `--shadow-*`, `--ease-*`, `--duration-*`, `--text-secondary`, `--surface-primary`.
3. Read every file under `styles/pages/` (e.g. `home.css`, `tracker-pro.css`,
   `calculator.css`, `shops.css`, `invest.css`).
4. Read `src/components/nav.js`, `src/components/nav-data.js`, `src/components/footer.js`,
   `src/components/internalLinks.js`, `src/components/breadcrumbs.js`,
   `src/components/ticker.js`, `src/components/spotBar.js`, `src/components/adSlot.js`.
5. Read `src/pages/home.js`, `src/tracker/render.js`, `src/tracker/dom-builders.js`,
   `src/tracker/ui-shell.js`.
6. Read `src/config/translations.js` so every copy change you make ships in EN + AR.
7. Read `docs/DESIGN_TOKENS.md`, `docs/ACCESSIBILITY.md`, `docs/REVAMP_PLAN.md`.
8. Walk each surface mentally at desktop (1440px) and mobile (360px, 414px), in BOTH EN
   and AR. List every surface that looks weak: cramped cards, weak hierarchy, unclear
   CTAs, ambiguous freshness, mis-mirrored RTL chevrons, low-contrast trust signals.

WORK — TOKENS
- Use existing tokens. Never hand-pick raw hex or rems where a token exists.
- If you need a new token, add it to `styles/global.css` once and reference it everywhere;
  do not introduce one-off colors or spacing values.
- Audit every `var(--color-*, #xxx)` fallback override; if the fallback hex disagrees with
  the canonical token, remove the fallback.

WORK — LAYOUT
- Tighten heading scale and spacing rhythm across home, tracker, calculator, shops,
  content guides.
- Improve hero flow on `index.html`: clear value proposition, freshness pill near the
  live price, obvious primary CTA to the tracker.
- Strengthen card primitives: cards must look consistent across home, tracker, shops,
  and country pages. Consolidate `.card` / `.panel` variants where they overlap.
- Mobile pass at 360px and 414px: no horizontal scroll, no overlapping sticky elements,
  tap targets ≥ 44px (per the existing accessibility convention).

WORK — NAVIGATION
- Improve nav active states, mobile drawer hierarchy, language/theme toggle clarity.
  Keep the nav data-driven via `src/components/nav-data.js`.
- The mobile drawer uses `.nav-drawer-bottom` containing both `#nav-theme-toggle-drawer`
  and `#nav-lang-toggle-mobile`; `_cycleTheme()` is shared between desktop and drawer.
  Do not fork them.
- Footer hierarchy: group links by intent (Track, Calculate, Find a Shop, Learn,
  Methodology, About). Avoid a flat 30-link footer.

WORK — RTL
- For every surface you touch, verify RTL: mirror chevrons/arrows, verify alignment,
  confirm Arabic copy reads naturally (not literal English structure).
- The tracker localizes welcome strip via `_localizeWelcomeStrip()` in `src/tracker/
  render.js`; market badge has explicit aria-label via
  `tracker.marketOpenAriaLabel`/`tracker.marketClosedAriaLabel`.

WORK — TRUST SIGNALS
- Add visible trust signals where they strengthen the page (source label, last-updated
  pill, methodology link, "spot estimate vs retail" disclaimer near every price).
- Freshness keys come from `getLiveFreshness()` (the canonical 6-key model): 'live'
  (≤30 min, no failure), 'delayed' (>30 min, ≤75 min), 'cached' (within window,
  hasLiveFailure), 'stale' (>75 min / upstream-stale), 'fallback' (upstream fallback),
  'unavailable' (no updatedAt) — plus 'closed' from `getFreshnessModel()` when the market
  is closed. Render every state visibly with color-blind-accessible affordance (icon
  ::before, not color-only).

WORK — MOTION
- Respect `prefers-reduced-motion: reduce` for any new motion. Per-class guards are
  preferred over global resets — see existing pattern in `styles/pages/shops.css`,
  `styles/pages/calculator.css`, `styles/pages/invest.css`.
- Do not introduce parallax, background video, or animated gold particles. Lightweight
  posture is a carve-out.

CONSTRAINTS
- No new dependencies, no framework migration, no new build system, no CSS framework.
- Don't change `CNAME`, `vite.config.js` `base` (currently `'/'`), service-worker scope,
  canonical URLs, or the `countries/**/gold-prices/` URL paths.
- Don't touch the AED peg constant (`3.6725`), the troy-ounce constant (`31.1035`),
  karat purity values, freshness thresholds (`STALE_AFTER_MS = 75*60*1000`,
  `FX_STALE_AFTER_MS = 26*60*60*1000`), or pricing math.
- Every user-visible string change ships in EN + AR via `src/config/translations.js`.
- Do not introduce new innerHTML/outerHTML/insertAdjacentHTML sinks — use `el()` /
  `replaceChildren()` from `src/lib/safe-dom.js`.
- Bump `sw.js` `CACHE_NAME` (currently `'goldtickerlive-v16'`) since visible asset/HTML
  output is changing.

VERIFY
- `npm run validate` (build integrity + DOM-safety + SEO meta + sitemap + placeholder +
  analytics gates)
- `npm test`
- `npm run quality` (lint + format:check + style)
- `npm run build`
- Manual: skim home / tracker / shops / a country page at 360px, 414px, and 1440px in
  both EN and AR.

DELIVERABLE
- Multiple themed commits: `feat(tokens): ...`, `feat(layout): ...`, `feat(nav): ...`,
  `feat(tracker-ui): ...`, `feat(rtl): ...`, `chore(sw): bump CACHE_NAME to ...`,
  `docs: update REVAMP_PLAN`.
- Before/after screenshots at 360px and 1440px, EN and AR, for every visibly changed
  surface, in the PR body.
- §51 final report with carve-outs preserved.
```

**Files / surfaces Copilot should inspect:**

- HTML at root: `index.html`, `tracker.html`, `calculator.html`, `shops.html`, `learn.html`,
  `insights.html`, `methodology.html`, `invest.html`, `pricing.html`, `offline.html`, `404.html`
- `styles/global.css`, every file under `styles/pages/`, `styles/order.css`
- `src/components/{nav,nav-data,footer,internalLinks,breadcrumbs,ticker,spotBar,adSlot}.js`
- `src/components/nav/{dropdown-builders,helpers}.js`
- `src/pages/home.js`, `src/pages/tracker-pro.js`
- `src/tracker/{render,dom-builders,ui-shell,events,formatting,modes,state,wire}.js`
- `src/config/translations.js`, `src/config/constants.js`
- `docs/DESIGN_TOKENS.md`, `docs/ACCESSIBILITY.md`, `docs/REVAMP_PLAN.md`

**Required checks:**

- `npm run validate`
- `npm test`
- `npm run quality`
- `npm run build`
- `node scripts/node/check-unsafe-dom.js`
- Manual screenshots at 360 / 414 / 1440 in EN and AR

**Expected final report:**

- Files changed, grouped by area (tokens / layout / nav / tracker / rtl / sw).
- SW `CACHE_NAME` bump value.
- Carve-outs preserved (cite [§50](#50-safety-rules-and-carve-outs)).
- Before/after screenshots attached.
- Lighthouse delta if available (cite [§42](#42-mobile-first-layout-audit) /
  [§11](#11-pwa--service-worker--performance-prompt) for perf coverage).
- §51 final report.

**Safety notes:**

- No framework migration. No new charting library.
- DOM-safety baseline must not regress.
- The hourly `.github/workflows/post_gold.yml` is production. UI work must not touch
  `scripts/python/utils/*` or `src/social/postTemplates.js` unless intentional.
- Translation parity is enforced by `tests/home-translations.test.js` and
  `tests/seo-metadata.test.js` — both must stay green.

**Failure modes to watch for:**

- Agent introduces a new color in raw hex instead of via a token.
- Agent ships a copy change in EN only, breaking EN/AR parity.
- Agent restructures the mobile drawer and breaks the shared `_cycleTheme()` / `_applyTheme()`
  pattern.
- Agent removes the freshness pill because "it looks busy", losing a trust signal.
- Agent adds parallax / scroll-jacking, regressing performance.
- Agent forgets to bump `sw.js` `CACHE_NAME`, shipping cached old CSS to returning users.
- Agent fixes a generated country/city page directly without updating `enrich-placeholder-pages.js`.

**Cross-references:**

- → [§9 Live Tracker Upgrade](#9-live-tracker-upgrade-prompt)
- → [§11 PWA / Service Worker / Performance](#11-pwa--service-worker--performance-prompt)
- → [§12 Arabic / RTL Quality](#12-arabic--rtl-quality-prompt)
- → [§19 Large PR Execution](#19-large-pr-execution-prompt)
- → [§35 Dark Mode & Theme System](#35-dark-mode--theme-system)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 9. Live Tracker Upgrade Prompt

**Purpose:** Make the live tracker (`tracker.html`) feel like the product's centerpiece — clear
price hierarchy, unambiguous freshness, trustworthy data labels, scannable karats, fast first paint,
easy filters, no broken empty/loading/error states. The tracker is what most users land on; if it
feels uncertain, the whole product feels uncertain.

**When to use:**

- Tracker UX feedback ("it's confusing", "freshness is unclear", "mobile is cramped").
- After a data-source change or freshness threshold change.
- After a chart-component upgrade ([§30](#30-chart-component)).
- Before a marketing push that drives traffic to the tracker.

**Copy-paste prompt:**

```text
You are upgrading the live tracker at `tracker.html` for Gold Ticker Live. The tracker is
the centerpiece of the product. Your job is to improve clarity, trust, and mobile usability
without changing pricing math, AED peg logic, karat logic, or FX logic.

INSPECT FIRST
1. Read `tracker.html`.
2. Read every file in `src/tracker/`: `render.js`, `state.js`, `dom-builders.js`,
   `events.js`, `formatting.js`, `modes.js`, `ui-shell.js`, `wire.js`.
3. Read `src/lib/api.js`, `src/lib/cache.js`, `src/lib/live-status.js`,
   `src/lib/price-calculator.js`, `src/lib/formatter.js`, `src/lib/freshness-pulse.js`,
   `src/lib/historical-data.js`.
4. Read `src/config/constants.js` (`AED_PEG = 3.6725`, `TROY_OZ_GRAMS = 31.1035`,
   `GOLD_REFRESH_MS = 90000`, `CACHE_KEYS`, `STALE_AFTER_MS = 75*60*1000`,
   `FX_STALE_AFTER_MS = 26*60*60*1000`).
5. Read `src/config/karats.js` (purity values).
6. Read `src/config/translations.js` (`tracker.*` keys, including `welcome.*`,
   `pagination.*`, `marketOpenAriaLabel`, `marketClosedAriaLabel`).
7. Read `styles/pages/tracker-pro.css`.
8. Read `tests/live-status.test.js`, `tests/price-calculator.test.js`,
   `tests/freshness-coverage.test.js`, `tests/historical.test.js`.
9. Read `docs/tracker-state.md` and `docs/methodology.md`.

WORK — FRESHNESS STATES
- Render every freshness key visibly: `live`, `delayed`, `cached`, `stale`, `fallback`, `unavailable` (plus `closed`).
  Use a color-blind-accessible affordance (icon ::before, not color-only).
- The home/tracker freshness key is set on `data-freshness-key` and (where used)
  `data-freshness-age`. The home freshness timer ticks every 1s
  (`src/pages/home.js:161-190`). Match that cadence on the tracker hero only if the
  tracker hero already implements it; do NOT introduce a per-second tick globally.
- Always show a human-readable "Updated <relative>" label. Use `tx()` from
  `src/lib/i18n.js` for all such strings.

WORK — DATA SOURCE LABELS
- Always show the source ("derived from XAU/USD spot via …") near the price card. Use
  safe wording from §50: "spot-based estimate", "reference price", "before retail
  premiums", "before making charges", "may differ from shop prices".
- Never imply the price is the retail/shop price.

WORK — KARATS, CURRENCIES, UNITS
- Karat strip must be scannable at 360px: 24K / 22K / 21K / 18K (use existing values
  from `src/config/karats.js`; do NOT change purity).
- Currency switching: AED is pegged at `3.6725` to USD; FX comes from
  `https://open.er-api.com/v6/latest/USD`. Show currency code clearly. Show "AED peg"
  hint near AED.
- Unit switching: per-gram / per-ounce / per-tola. Show the formula link
  ("How is this calculated?" → methodology page).

WORK — STATES
- Loading: skeleton or spinner with calm wording, not "loading…" alone.
- Empty: explain what happened ("Live data temporarily unavailable. Showing the most
  recent cached price.") and offer a retry.
- Error: human-readable, not a stack trace. Suggest the methodology page.
- Cached/stale: visibly badged. Never silently serve stale data without a label.
- Mobile filters: ≥44px tap targets, single-column, sticky header that does not overlap
  content.

WORK — PAGINATION
- Pagination labels go through `tx()` (`tracker.pagination.prev`, `next`, `prevLabel`,
  `nextLabel`, `page`). Enforced by `tests/home-translations.test.js`. Do NOT bypass.

WORK — TITLE
- `renderAll()` updates `document.title` with the live XAU/USD price. Preserve this; it
  is a lightweight live-status signal in the browser tab.

CONSTRAINTS — DO NOT TOUCH
- Pricing formula: `price_per_gram = (XAU/USD ÷ 31.1035) × purity × FX`. Locked.
- AED peg `3.6725`. Locked.
- Troy ounce `31.1035`. Locked.
- Karat purity table. Locked.
- FX source `open.er-api.com/v6/latest/USD`. Locked.
- `STALE_AFTER_MS = 75 minutes` (`DELAYED_AFTER_MS = 30 minutes`) and `FX_STALE_AFTER_MS = 26 hours`. Locked.
- `GOLD_REFRESH_MS = 90000`. Locked unless you have an owner instruction.
- `CACHE_KEYS` (e.g. `gold_price_cache`, `gold_price_history`). Locked.
- DOM-safety baseline in `src/tracker/render.js` must remain at 0 sinks per
  `scripts/node/check-unsafe-dom.js`.

VERIFY
- `npm test` (must include `tests/live-status.test.js`,
  `tests/price-calculator.test.js`, `tests/freshness-coverage.test.js`,
  `tests/home-translations.test.js`)
- `npm run validate`
- `npm run quality`
- `npm run build`
- Manual: cycle live → cached → stale states by mocking the API. Verify each renders
  with the right badge.
- Manual: 360px and 1440px in EN and AR.

DELIVERABLE
- Themed commits: `feat(tracker-states): ...`, `feat(tracker-i18n): ...`,
  `feat(tracker-mobile): ...`, `chore(sw): bump CACHE_NAME`, `docs(tracker-state): ...`.
- §51 final report citing the 6 freshness keys verified.
```

**Files / surfaces Copilot should inspect:**

- `tracker.html`
- `src/tracker/{render,state,dom-builders,events,formatting,modes,ui-shell,wire}.js`
- `src/lib/{api,cache,live-status,price-calculator,formatter,freshness-pulse,historical-data,export}.js`
- `src/config/{constants,karats,translations}.js`
- `src/components/chart.js`, `src/pages/tracker-chart-loader.js`
- `styles/pages/tracker-pro.css`
- `tests/live-status.test.js`, `tests/price-calculator.test.js`, `tests/freshness-coverage.test.js`,
  `tests/historical.test.js`, `tests/home-translations.test.js`
- `docs/tracker-state.md`, `docs/methodology.md`

**Required checks:**

- `npm test`
- `npm run validate`
- `npm run quality`
- `npm run build`
- `node scripts/node/check-unsafe-dom.js`
- Manual freshness-state walk (mock API to force live/cached/stale/unavailable).

**Expected final report:**

- 6 freshness keys (live/delayed/cached/stale/fallback/unavailable, + closed) verified with screenshots.
- Confirmation that pricing math, AED peg, troy ounce, karat values, FX source, and freshness
  thresholds were not touched.
- SW `CACHE_NAME` bump value.
- §51 final report.

**Safety notes:**

- The tracker is the most-trafficked page. Regressions here are user-visible immediately.
- Pricing math is sacrosanct. If you propose any change there, stop and ask the owner.
- The home freshness timer is per-second; do not generalize that cadence to the tracker unless the
  tracker already does it.
- Tests `tests/home-translations.test.js` REQUIRED_KEYS list must stay green; pagination labels must
  use `tx()`.

**Failure modes to watch for:**

- Agent silently changes `STALE_AFTER_MS` to "make stale states show less often".
- Agent adds an `innerHTML` call in `src/tracker/render.js`, regressing the DOM-safety baseline.
- Agent hardcodes "Updated 5 minutes ago" instead of using a relative-time helper.
- Agent shows the spot price as the "shop price", violating the trust language carve-out.
- Agent introduces a chart library as a dependency. Charts use `src/components/chart.js` which
  lazy-loads TradingView Lightweight Charts from jsDelivr CDN — keep that posture.
- Agent breaks `tests/home-translations.test.js` by inlining English pagination strings.

**Cross-references:**

- → [§15 Data Reliability and Methodology](#15-data-reliability-and-methodology-prompt)
- → [§30 Chart Component](#30-chart-component)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§12 Arabic / RTL Quality](#12-arabic--rtl-quality-prompt)

---

## 10. SEO and Indexing Prompt

**Purpose:** Strengthen indexing, internal-link density, and discoverability across home, tracker,
calculator, shops, methodology, learn/insights guides, country/city pages, and content clusters —
without breaking the SEO carve-outs (`countries/**/gold-prices/` URL paths and the topic phrases
listed in [§50](#50-safety-rules-and-carve-outs)).

**When to use:**

- The owner asks for "improve SEO", "more traffic", "fix indexing", "better titles".
- After a content burst that adds many pages.
- After [§5b SEO Surface Alignment Audit](#5b-seo-surface-alignment-audit) reveals drift.
- Quarterly indexing hygiene.

**Copy-paste prompt:**

```text
You are running an SEO and indexing upgrade on Gold Ticker Live. The site is bilingual
(EN + AR), static, multi-page, and serves from the custom domain
https://goldtickerlive.com/. The repo also retains compatibility with the historical
GitHub Pages path `vctb12.github.io/Gold-Prices/`.

INSPECT FIRST
1. Read `docs/SEO_STRATEGY.md`, `docs/SEO_CHECKLIST.md`, `docs/SEO_SITEMAP_GUIDE.md`.
2. Read `src/seo/seoHead.js`, `src/seo/metadataGenerator.js`.
3. Read `scripts/node/inject-schema.js` end-to-end. NOTE: it is idempotent (Round 16) and
   should re-run cleanly after the first normalization pass.
4. Read `scripts/node/generate-sitemap.js`, `scripts/node/check-sitemap-coverage.js`,
   `scripts/node/check-seo-meta.js`, `scripts/node/seo-audit.js`,
   `scripts/node/inventory-seo.js`.
5. Read `robots.txt` (must keep `Disallow: /admin/` and `Disallow: /api/`).
6. Read `sitemap.xml` and `feed.xml` (if present).
7. Read `src/components/internalLinks.js` and `src/components/breadcrumbs.js`.
8. Read at least one full chain of pages:
   - `index.html` → `tracker.html` → `countries/<country>/gold-prices/index.html` →
     `countries/<country>/<city>/gold-prices/index.html`.
9. Read `src/config/translations.js` for SEO-bearing strings (`tracker.title`,
   `tracker.description`, `home.title`, etc.).

WORK — TITLES & DESCRIPTIONS
- Every page must have a unique, intent-aligned `<title>` and `<meta description>`.
- Preserve the carve-out topic phrases ("Gold Prices Today", "How Gold Prices Work",
  "Why UAE Gold Prices Differ", "Gold Prices in Dubai", "Gold Prices in <City>").
- Use real numerics in titles where helpful ("Gold Price in Dubai — 24K AED 285/g").
- No keyword stuffing. No clickbait.

WORK — CANONICALS & HREFLANG
- Every page has `<link rel="canonical">` pointing at its own
  `https://goldtickerlive.com/...` URL. No canonical loops. No canonical pointing at
  the dev domain.
- Every bilingual page has `hreflang en` and `hreflang ar` pairs that resolve.
- The /admin/ and /api/ paths stay disallowed in robots.

WORK — JSON-LD
- Use `scripts/node/inject-schema.js` as the single source for JSON-LD. Schema types in
  the repo include `Organization`, `WebSite`, `WebPage`, `Article`, `FAQPage`,
  `BreadcrumbList`, `Product` (gold), and `LocalBusiness` (shop pages).
- Do not hand-write JSON-LD inside HTML files; route the addition through the generator.
- Preserve the existing `Article` mtime-date logic.

WORK — SITEMAP & ROBOTS
- Re-run `npm run generate-sitemap`. Confirm `node scripts/node/check-sitemap-coverage.js`
  passes (every published page has a sitemap entry; no orphans).
- Confirm `robots.txt` references the canonical sitemap URL.

WORK — INTERNAL LINKING
- Every country page links to: tracker, calculator, methodology, the country's cities,
  and a "compare countries" hub.
- Every city page links to: parent country, neighboring cities (if defined), shops in
  that city, the relevant content guide.
- Every guide links to tracker / calculator / a relevant country page.
- Avoid orphan pages.

WORK — OG / TWITTER CARDS
- Each page has `og:title`, `og:description`, `og:url`, `og:image`, `og:type`,
  `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- `og:image` paths must exist; `npm run image-audit` should not warn on them.
- The `@GoldTickerLive` X handle is a carve-out — keep it.

WORK — STRUCTURED DATA HYGIENE
- Breadcrumb schema must match the visible breadcrumb component
  (`src/components/breadcrumbs.js`).
- FAQ schema must match the visible FAQ; do not inject FAQ schema for pages without
  visible FAQs.

CONSTRAINTS
- Do not change `countries/**/gold-prices/` URL paths.
- Do not change the SEO topic phrases listed in §50.
- Do not change `robots.txt` `Disallow:` directives.
- Do not change `CNAME`.
- Do not change canonical URLs of indexed pages without a redirect plan.
- Edit generators (`scripts/node/inject-schema.js`,
  `scripts/node/generate-sitemap.js`, `scripts/node/enrich-placeholder-pages.js`,
  `scripts/node/generate-placeholders.js`) BEFORE generated files.

VERIFY
- `npm run seo-audit`
- `node scripts/node/check-seo-meta.js`
- `node scripts/node/check-sitemap-coverage.js`
- `node scripts/node/inject-schema.js --check`
- `npm run validate`
- `npm run check-links` (or `npm run linkcheck`)
- Manual: open 6 representative pages, view source, confirm 12-surface alignment table
  (see §5b).

DELIVERABLE
- Themed commits: `seo(meta): tighten titles/descriptions`,
  `seo(canonical): repair drift`, `seo(schema): inject FAQ on …`,
  `seo(internal-links): wire compare hub`, `seo(sitemap): regen after meta changes`.
- §51 final report listing pages touched, schema types added/removed, and ripgrep audit
  before/after counts.
```

**Files / surfaces Copilot should inspect:**

- `src/seo/{seoHead,metadataGenerator}.js`
- `scripts/node/{inject-schema,generate-sitemap,check-sitemap-coverage,check-seo-meta,seo-audit,inventory-seo,enrich-placeholder-pages,generate-placeholders}.js`
- `robots.txt`, `sitemap.xml`, `feed.xml`, `CNAME`
- `index.html`, `tracker.html`, `calculator.html`, `shops.html`, `learn.html`, `insights.html`,
  `methodology.html`, `invest.html`, `pricing.html`, `404.html`
- `countries/**/*.html`, `content/**/*.html`
- `src/components/{internalLinks,breadcrumbs,footer}.js`
- `src/config/translations.js`
- `tests/seo-metadata.test.js`, `tests/seo-sitewide.test.js`, `tests/sitemap-parity.test.js`,
  `tests/inventory-seo.test.js`

**Required checks:**

- `npm run seo-audit`
- `node scripts/node/check-seo-meta.js`
- `node scripts/node/check-sitemap-coverage.js`
- `node scripts/node/inject-schema.js --check`
- `npm run validate`
- `npm run check-links`
- `npm test` (must include `tests/seo-*.test.js`, `tests/sitemap-parity.test.js`,
  `tests/inventory-seo.test.js`)

**Expected final report:**

- Pages touched, grouped (home, tracker, calculator, country/city, content guides).
- Schema types added/removed/repaired.
- Sitemap coverage delta.
- Internal-link graph delta (count of new internal links added).
- Carve-out preservation: confirm SEO topic phrases and `countries/**/gold-prices/` paths intact.
- §51 final report.

**Safety notes:**

- `scripts/node/inject-schema.js` is NOT idempotent. Treat its mtime drift as expected noise unless
  you intend to refresh dates.
- Canonical loops can be silently devastating; spot-check at least 6 pages.
- Bilingual `hreflang` must remain bidirectional. If you remove the AR pair on a page, verify the
  page no longer has Arabic content.
- Do not introduce schema for content the page does not visibly contain.

**Failure modes to watch for:**

- Agent rewrites every title to a single keyword phrase, losing intent variation.
- Agent adds canonical pointing at the dev/Replit domain.
- Agent injects FAQ JSON-LD for pages without visible FAQs.
- Agent edits a `countries/**/*.html` `<title>` directly without updating
  `enrich-placeholder-pages.js`.
- Agent regenerates sitemap without re-running `inject-schema.js`, leaving JSON-LD stale.
- Agent removes `Disallow: /admin/` from `robots.txt`.

**Cross-references:**

- → [§5b SEO Surface Alignment Audit](#5b-seo-surface-alignment-audit)
- →
  [§18 Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt)
- → [§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
- → [§24 FAQ + Structured Data](#24-faq--structured-data)
- → [§31 Footer, Internal Links & Breadcrumbs](#31-footer-internal-links--breadcrumbs)

---

## 11. PWA / Service Worker / Performance Prompt

**Purpose:** Treat the site as a PWA-grade product: correct manifest, safe and versioned
service-worker caching, fast first paint, low CLS, lazy-loaded heavy assets, and a polished offline
page. Performance and PWA discipline are inseparable here because the SW is the cache layer for both
online and offline experiences.

**When to use:**

- After a layout/asset change that should ship a new SW cache version.
- When Lighthouse PWA / Performance scores regress.
- When the offline page UX is poor.
- Before a marketing push (faster site = better conversion).
- Quarterly perf hygiene.

**Copy-paste prompt:**

```text
You are running a PWA + service-worker + performance pass on Gold Ticker Live. The site
ships as a static multi-page PWA from `goldtickerlive.com`.

INSPECT FIRST
1. Read `manifest.json`. Current values:
   - `name`: "Gold Ticker Live — Live Gold Price Tracker"
   - `short_name`: "Gold Ticker Live"
   - `start_url`: "/"
   - `scope`: "/"
   - `display`: "standalone"
   - `theme_color`: "#d4a017"
   - `background_color`: "#0f0e0a"
   These are CARVE-OUTS — do not change `start_url`, `scope`, or any field that breaks
   currently-installed PWAs without an owner instruction.
2. Read `sw.js`. Current `CACHE_NAME`: `'goldtickerlive-v16'`. The SW excludes
   `/admin/*` and `/api/*` (enforced by `tests/sw-exclusions.test.js`). The SW uses
   `RUNTIME_CACHE` for runtime fetches and `CACHE_NAME` for the precached app shell.
3. Read `offline.html`. Confirm it loads without network and has bilingual copy.
4. Read `vite.config.js` (`base: '/'`, `outDir: 'dist'`). Excluded dirs:
   `dist`, `node_modules`, `.git`, `countries`, `admin`, `embed`.
5. Read `tests/sw-exclusions.test.js` and any other SW-related tests.
6. Read `docs/PERFORMANCE.md`.
7. Read `scripts/node/image-audit.js` and `scripts/node/check-sw-coverage.js`.
8. Walk Lighthouse expectations: LCP < 2.5s, CLS < 0.1, TBT < 200ms on mid-tier mobile.

WORK — MANIFEST
- Confirm icons exist at every declared `src` (`favicon.svg`,
  `assets/favicon-192x192.png`, etc.).
- Confirm `theme_color` matches the brand palette.
- Do NOT change `start_url` or `scope`.

WORK — SERVICE WORKER
- Bump `CACHE_NAME` (e.g. `'goldtickerlive-v17'`) when shipping any user-visible
  asset/HTML change. Never rename the prefix.
- Old caches are deleted on `activate` via the existing cleanup loop; verify any new
  cache name you introduce is included in the `currentCaches` Set.
- Keep `/admin/*` and `/api/*` excluded. `tests/sw-exclusions.test.js` must stay green.
- Audit precache list: confirm every precached asset still exists; remove dead entries.
- Confirm SW does not precache HTML for `/admin/*`.

WORK — OFFLINE PAGE
- `offline.html` must load with no network and show bilingual copy and a clear "Try
  again" CTA. The page should not depend on JS that requires network.
- Add a clear note: "Live prices require a network connection. The most recent cached
  price will appear when you reconnect."

WORK — PERFORMANCE
- Lazy-load images below the fold (`loading="lazy"`).
- Specify `width`/`height` on every `<img>` to avoid CLS.
- Avoid `@import` in CSS; prefer `<link>` to load CSS in parallel.
- Do not introduce blocking 3rd-party scripts. Analytics already externalized
  (`scripts/node/externalize-analytics.js`); keep it that way.
- Audit `src/components/chart.js`: charts must remain lazy-loaded via
  `src/pages/tracker-chart-loader.js` (TradingView Lightweight Charts via jsDelivr CDN
  +esm).
- Run `npm run image-audit`. Address any unoptimized images.

WORK — REDUCED MOTION
- Every animation respects `prefers-reduced-motion: reduce`. Per-class guards exist in
  `styles/pages/shops.css`, `styles/pages/calculator.css`, `styles/pages/invest.css`,
  `styles/pages/tracker-pro.css`. Add new ones for any new animation.

CONSTRAINTS
- Do not change `localStorage` / `CACHE_KEYS` from `src/config/constants.js` without a
  back-compat plan.
- Do not change the SW cache prefix (`goldtickerlive-`).
- Do not change `manifest.json` `start_url` or `scope`.
- Do not change `vite.config.js` `base`.
- Do not introduce a heavy charting library or framework.
- Keep DOM safety baseline at 0 sinks in `src/tracker/render.js`.

VERIFY
- `npm test` (must include `tests/sw-exclusions.test.js`)
- `npm run validate` (includes `node scripts/node/check-sw-coverage.js`)
- `npm run image-audit`
- `npm run perf:ci` (optional)
- `npm run a11y` (optional, if `pa11y-ci` configured)
- `npm run build` then manual offline check
- Manual: Lighthouse on home / tracker / a country page; capture Performance, PWA,
  Accessibility, SEO, Best Practices.

DELIVERABLE
- Themed commits: `chore(sw): bump CACHE_NAME to ...`,
  `feat(offline): improve offline.html copy + CTA`,
  `perf(images): lazy-load + dimensions`,
  `perf(css): split critical / non-critical`.
- Lighthouse before/after table in PR body.
- §51 final report.
```

**Files / surfaces Copilot should inspect:**

- `manifest.json`, `sw.js`, `offline.html`
- `vite.config.js`
- `tests/sw-exclusions.test.js`
- `scripts/node/image-audit.js`, `scripts/node/check-sw-coverage.js`
- `docs/PERFORMANCE.md`
- `src/components/chart.js`, `src/pages/tracker-chart-loader.js`
- All HTML at root (for `<img>` audit)

**Required checks:**

- `npm test`
- `npm run validate`
- `npm run image-audit`
- `npm run perf:ci`
- `npm run a11y` (if configured)
- `npm run build`
- Manual Lighthouse runs on home / tracker / country page.
- Manual offline mode check.

**Expected final report:**

- New `CACHE_NAME` value.
- Lighthouse before/after table (Perf / PWA / A11y / SEO / Best Practices).
- Image audit before/after.
- Confirmation that SW exclusions still cover `/admin/*` and `/api/*`.
- Carve-outs preserved.
- §51 final report.

**Safety notes:**

- Bumping `CACHE_NAME` without removing old caches will break offline experience. Verify the
  activate cleanup loop covers every cache name you introduced.
- Do not change `localStorage` keys; they are user state. Migration is a separate decision.
- Reduced-motion guards must be per-class, not only the global `*` rule, for predictable fallback
  states.
- `manifest.json` changes can break installed PWAs. The `start_url` and `scope` carve-outs exist for
  that reason.

**Failure modes to watch for:**

- Agent bumps `CACHE_NAME` but forgets to add the new value to the `currentCaches` Set, causing the
  new cache to be deleted on activate.
- Agent precaches HTML for `/admin/*`.
- Agent introduces a chart library, regressing bundle size.
- Agent removes `loading="lazy"` because "modern browsers default to it" — they don't for
  above-the-fold images.
- Agent silently changes `start_url` from `/` to `/index.html`, breaking installed PWAs.
- Agent ships a CSS animation without a `prefers-reduced-motion` guard.

**Cross-references:**

- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)
- → [§46 Image Audit & Asset Optimization](#46-image-audit--asset-optimization)
- → [§37 GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening) (Lighthouse
  workflow)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 12. Arabic / RTL Quality Prompt

**Purpose:** Make the Arabic side of Gold Ticker Live feel like a first-class product, not a
translated afterthought. Drive idiomatic UAE/GCC Arabic copy, true RTL layout (mirrored chevrons,
correct alignment, correct currency/date formatting), and EN+AR parity for every visible string.
Bilingual parity is enforced by tests (`tests/home-translations.test.js`,
`tests/seo-metadata.test.js`); this prompt drives quality, not just compliance.

**When to use:**

- Arabic copy reads like a literal English translation.
- RTL layout breaks on a specific surface (chevrons, badges, breadcrumbs).
- A new feature shipped without AR strings.
- After [§8 Full UI/UX Revamp](#8-full-uiux-revamp-prompt), as a parity pass.
- Before a UAE/GCC marketing push.

**Copy-paste prompt:**

```text
You are running an Arabic / RTL quality pass on Gold Ticker Live. The site is bilingual
EN + AR, written for UAE/GCC users primarily, with broader Arab-world reach.

INSPECT FIRST
1. Read `src/config/translations.js` end-to-end. Note the structure: every visible
   string has an `en` and `ar` value. Pagination labels live under `tracker.pagination.*`
   and are enforced by `tests/home-translations.test.js` REQUIRED_KEYS list.
2. Read `src/lib/i18n.js` (`tx()` helper). Confirm every visible string in JS goes
   through it.
3. Read `src/components/nav.js` (`_localizeWelcomeStrip()` pattern), `src/components/
   footer.js`, `src/tracker/render.js` (`_localizeWelcomeStrip()`).
4. Walk every page in AR: `index.html`, `tracker.html`, `calculator.html`, `shops.html`,
   `learn.html`, `insights.html`, `methodology.html`, `invest.html`, `pricing.html`,
   `404.html`, `offline.html`. List awkward translations.
5. Walk one country page and one city page in AR.
6. Read `tests/home-translations.test.js` and `tests/seo-metadata.test.js` to understand
   parity expectations.
7. Read `styles/global.css` for RTL CSS patterns (logical properties, dir-aware spacing).

WORK — COPY QUALITY
- Improve Arabic copy where it reads literally. Prefer modern, clear Arabic suitable for
  UAE/GCC users. Examples of safe wording:
  * "السعر تقديري مبني على سعر الذهب العالمي" (spot-based estimate)
  * "قد يختلف سعر المحلات بسبب المصنعية والضريبة والهامش" (shop price differs)
  * "آخر تحديث" (last updated)
  * "مصدر السعر" (source)
  * "سعر مرجعي" (reference price)
  * "بيانات مخزنة مؤقتاً" (cached data)
  * "السعر غير متاح حالياً" (price unavailable)
- Avoid overly formal classical Arabic when a clearer modern phrase exists.
- Avoid machine-style direct translations (e.g. don't translate "Track gold prices" as
  "تتبع أسعار الذهب" if "تابع أسعار الذهب الآن" reads better).
- Keep financial terms understandable.
- Brand "Gold Ticker Live" is a Latin-script brand. In Arabic copy, it stays as
  "Gold Ticker Live" (or appears with an Arabic gloss "(الذهب المباشر)" only where
  context requires). Do not transliterate the brand inconsistently.

WORK — RTL LAYOUT
- Mirror chevrons (`›` becomes `‹`, `→` becomes `←`). Use logical CSS where possible
  (`margin-inline-start`, `padding-inline-end`).
- Verify the mobile drawer in AR: the `.nav-drawer-bottom` wrapper still groups
  `#nav-theme-toggle-drawer` and `#nav-lang-toggle-mobile` correctly.
- Verify breadcrumbs in AR: position-1 link is rightmost in RTL.
- Verify cards/grids do not flip text inside (only the layout should mirror).
- Numbers: keep western Arabic numerals (1234) by default; they are more legible for
  prices. Do not auto-convert to ٠١٢٣٤٥٦٧٨٩ unless the design system explicitly says so.

WORK — FORMATTING
- Currency: AED, USD, EUR, GBP, SAR, etc. Always show ISO code; symbol-only is
  ambiguous in Arabic context.
- Dates: "آخر تحديث منذ 5 دقائق" pattern via `src/lib/formatter.js` relative-time helper.
- Decimals: Arabic locale uses comma as decimal separator in some standards; keep dot
  for consistency with the global product unless owner says otherwise.

WORK — PARITY
- Every new key in `src/config/translations.js` must have BOTH `en` and `ar` entries.
- Every new visible string in HTML/JS must go through `tx()`.
- `tests/home-translations.test.js` REQUIRED_KEYS list and `tests/seo-metadata.test.js`
  must stay green.

CONSTRAINTS
- Do not transliterate the brand "Gold Ticker Live" inconsistently.
- Do not change the bilingual contract (every page is EN + AR with `hreflang` pairs).
- Do not change `dir="rtl"` toggling logic; it lives in shared infra.
- Do not introduce a 3rd language without an owner instruction.

VERIFY
- `npm test` (must include `tests/home-translations.test.js`,
  `tests/seo-metadata.test.js`)
- `npm run validate`
- Manual: walk each touched page in AR at 360px and 1440px. Confirm chevrons mirror,
  breadcrumb order is correct, cards don't flip, numbers are legible.
- Manual: cycle EN ↔ AR via the language toggle and confirm `_cycleTheme()` and
  language state are independent.

DELIVERABLE
- Themed commits: `i18n(ar): rewrite home hero copy`,
  `i18n(ar): tracker freshness states`, `style(rtl): mirror chevrons`,
  `i18n(parity): add missing AR keys`.
- AR before/after screenshot pairs in PR body.
- §51 final report.
```

**Files / surfaces Copilot should inspect:**

- `src/config/translations.js`
- `src/lib/i18n.js`, `src/lib/formatter.js`
- `src/components/{nav,footer}.js`, `src/tracker/render.js`
- All HTML at root + sample country/city pages
- `tests/home-translations.test.js`, `tests/seo-metadata.test.js`
- `styles/global.css` (RTL patterns)

**Required checks:**

- `npm test`
- `npm run validate`
- Manual AR walkthrough at 360 / 414 / 1440.
- Manual RTL chevron mirroring spot-check.

**Expected final report:**

- Pages where AR copy was improved.
- New AR translation keys added.
- RTL layout fixes shipped.
- Parity tests confirmed green.
- §51 final report.

**Safety notes:**

- Cite [§50](#50-safety-rules-and-carve-outs) for the bilingual contract.
- Do not change tracker pagination string keys; they are referenced by tests.
- Brand transliteration: "Gold Ticker Live" stays in Latin script in AR copy.

**Failure modes to watch for:**

- Agent translates English idioms literally ("Track" → "تَتبَّع" instead of "تابع").
- Agent flips numbers to ٠١٢٣٤٥٦٧٨٩ without owner approval, hurting price legibility.
- Agent uses `margin-left` / `padding-right` instead of logical `margin-inline-start` /
  `padding-inline-end`, breaking RTL.
- Agent adds an AR string in JS without going through `tx()`, breaking the parity test.
- Agent transliterates the brand inconsistently across pages.
- Agent removes a long-existing AR string because it "looks redundant" in EN.

**Cross-references:**

- → [§8 Full UI/UX Revamp](#8-full-uiux-revamp-prompt)
- → [§10 SEO and Indexing](#10-seo-and-indexing-prompt) (`hreflang`)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 13. Shops Directory Prompt

**Purpose:** Improve the shops directory (`shops.html` and city/country shop pages) so it feels like
a useful local UAE/GCC resource: clear filters, scannable shop cards, honest disclosure language
("informational, not endorsements"), trustworthy contact info, and a sane mobile layout. The data
shape is gated by `scripts/node/normalize-shops.js`; never hand-edit `data/shops.json` without that
gate.

**When to use:**

- Shop data is updated (new submissions approved, schema migration).
- Filters / search are weak or missing.
- Mobile cards are cramped or break at 360px.
- The "submit shop" flow ([§34](#34-submit-shop--order-gold-flows)) has shipped a new field that the
  directory needs to render.

**Copy-paste prompt:**

```text
You are upgrading the shops directory on Gold Ticker Live. The directory is a public,
informational, non-endorsing list of gold/jewelry shops, primarily in UAE and GCC. The
data is normalized by `scripts/node/normalize-shops.js` before any read.

INSPECT FIRST
1. Read `shops.html`.
2. Read `src/pages/shops.js` and every file under `src/pages/shops/`:
   `actions.js`, `filters.js`, `helpers.js`, `modal.js`, `rendering.js`.
3. Read `data/shops*.json` (current shape, expected fields).
4. Read `scripts/node/normalize-shops.js` (data shape gate; runs as part of
   `npm run build`).
5. Read `tests/shop-manager.test.js`, `tests/repositories.test.js`.
6. Read `styles/pages/shops.css`.
7. Read `src/config/translations.js` (`shops.*` keys).
8. Read `server/repositories/pending-shops.repository.js` and
   `server/routes/admin/index.js` for the admin-side approval flow context. Pending
   submissions live at `data/pending_shops.json`.
9. Read `docs/ADMIN_GUIDE.md` for the approval flow.

WORK — DATA SHAPE
- All shop reads go through `normalize-shops.js` first. If a new field is needed, add
  it to the normalizer's expected schema and to the JSON files in the same commit.
- Validate every shop entry has: `id`, `name`, `city`, `country`, `karatRange`,
  `services`, `disclosureNotes` (or whatever the canonical fields are at the time of
  the audit).
- Never silently drop a malformed shop; surface it via a normalizer warning.

WORK — UI
- Shop card: name, city, country flag, karat range, key services, "view details" CTA,
  and a clear "Listings are informational. We do not endorse, verify pricing, or take
  bookings on behalf of these shops." disclosure (use `tx()` for this).
- Filters: city, country, services, sort (alphabetical, by city). All ≥44px tap
  targets, mobile-friendly.
- Modal: opens on "view details", focus-trapped, keyboard-dismissable.
- Empty state: "No shops match these filters. Try clearing filters or selecting a
  different city."
- Skeleton/loading state for the initial load.

WORK — TRUST
- Make the disclosure unmissable on every shop page.
- If a shop entry has no verified phone/website, do not silently render a half-card —
  show only the verified fields and a "Listing under review" badge.
- Do not render fake "ratings" or "reviews".

WORK — SEO
- Shops directory page must have: unique title, meta description, JSON-LD
  `LocalBusiness` schema for individual shop pages (via `inject-schema.js`), and
  internal links to relevant city/country pages.
- Cite [§5b SEO Surface Alignment Audit](#5b-seo-surface-alignment-audit) before
  shipping.

CONSTRAINTS
- Do not hand-edit `data/shops.json` or `data/pending_shops.json` without running
  `normalize-shops.js`.
- Do not invent shop data. If sample data is needed for tests, it goes under
  `tests/fixtures/`, not `data/`.
- Do not introduce paid endorsement language. Keep the "informational" posture.
- Do not bypass the admin approval flow for new shops; submissions go through
  `POST /api/submit-shop` (server/routes/submissions.js).

VERIFY
- `npm run normalize-shops` (or it runs as part of `npm run build`)
- `npm test` (must include `tests/shop-manager.test.js`, `tests/repositories.test.js`)
- `npm run validate`
- Manual: open shops.html at 360px and 1440px; cycle filters; open a modal; tab
  through.
- Manual: open a shop's detail card in AR.

DELIVERABLE
- Themed commits: `feat(shops-filters): ...`, `feat(shops-modal): ...`,
  `data(shops): normalize after audit`, `seo(shops): inject LocalBusiness schema`.
- §51 final report.
```

**Files / surfaces Copilot should inspect:**

- `shops.html`
- `src/pages/shops.js`, `src/pages/shops/{actions,filters,helpers,modal,rendering}.js`
- `data/shops*.json`, `data/pending_shops.json`
- `scripts/node/normalize-shops.js`
- `server/repositories/pending-shops.repository.js`, `server/routes/admin/index.js`,
  `server/routes/submissions.js`
- `tests/shop-manager.test.js`, `tests/repositories.test.js`
- `styles/pages/shops.css`
- `src/config/translations.js`
- `docs/ADMIN_GUIDE.md`

**Required checks:**

- `npm run normalize-shops`
- `npm test`
- `npm run validate`
- Manual filter/modal walkthrough at 360 / 1440 in EN and AR.

**Expected final report:**

- New/changed shop fields and the normalizer commit.
- Filter and modal UX changes.
- Disclosure language updated where needed.
- §51 final report.

**Safety notes:**

- The "informational, not endorsement" posture is non-negotiable.
- Do not introduce paid placement without an owner instruction and a clear "sponsored" label.
- Never invent shops. Sample data for tests goes under `tests/fixtures/`.
- Modal must be focus-trapped and keyboard-dismissable for accessibility.

**Failure modes to watch for:**

- Agent edits `data/shops.json` directly without re-running `normalize-shops.js`, shipping invalid
  shape that the next build catches.
- Agent removes the disclosure language because "it clutters the card".
- Agent adds a "rating" field that is not backed by real data.
- Agent renders a half-card when fields are missing instead of degrading gracefully.
- Agent breaks modal focus-trap or keyboard dismissal.
- Agent adds inline shop submission UI on the directory page, bypassing `POST /api/submit-shop` and
  the admin approval flow.

**Cross-references:**

- → [§34 Submit Shop & Order Gold Flows](#34-submit-shop--order-gold-flows)
- → [§26 Admin Panel UX](#26-admin-panel-ux)
- → [§10 SEO and Indexing](#10-seo-and-indexing-prompt)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 14. Calculator and Tools Prompt

**Purpose:** Make the calculator at `calculator.html` and the broader tools suite (weight converter,
zakat, investment-return) feel useful and trustworthy. Clear inputs, clear results, honest
disclaimers (spot vs retail, making charges, VAT), and zero broken formulas.

**When to use:**

- Owner asks to improve calculator clarity or add a tool.
- A formula bug is reported.
- A tool needs better mobile usability.
- After [§9 Live Tracker Upgrade](#9-live-tracker-upgrade-prompt) has refreshed price presentation,
  to keep tools consistent.

**Copy-paste prompt:**

```text
You are upgrading the calculator and tool suite on Gold Ticker Live. The flagship tool
is the gold calculator at `calculator.html`. Other tools may include weight converter,
zakat calculator, and investment-return calculator. The calculator's pricing math comes
from `src/lib/price-calculator.js`; you do NOT change formulas without an explicit owner
instruction.

INSPECT FIRST
1. Read `calculator.html`.
2. Read `src/pages/calculator.js` and every file under `src/pages/calculator/`:
   `utils.js`, `value-calculator.js`.
3. Read `src/lib/price-calculator.js` (formulas live here).
4. Read `src/lib/formatter.js` (currency/unit formatting).
5. Read `src/config/{constants,karats,translations}.js`.
6. Read `tests/price-calculator.test.js`, `tests/pricing-engine.test.js`,
   `tests/formatter.test.js`, `tests/input-validation.test.js`.
7. Read `styles/pages/calculator.css`.
8. If other tool pages exist (weight, zakat, return), read them under `content/tools/*`
   or `src/pages/*` (verify which path the repo uses).
9. Read `methodology.html` for the canonical disclosure language to mirror.

WORK — INPUTS
- Karat selector: 24K / 22K / 21K / 18K (use `src/config/karats.js`; do not change
  purity values).
- Unit selector: gram / ounce / tola.
- Weight input: numeric, validated (≥ 0, ≤ a sane upper bound). Show units inline.
- Currency selector: AED, USD, and any FX-supported currency. AED uses the fixed peg
  `3.6725`.
- Optional toggles: VAT, making charge, dealer premium. Each labeled clearly.

WORK — RESULTS
- Show: spot-based estimate at the chosen karat, total estimate, and a clear
  "spot estimate vs retail" disclaimer.
- Show: methodology link and a "How is this calculated?" expander that includes the
  exact formula text from `methodology.html`.
- Show: last-updated source label (mirror the tracker's freshness state).

WORK — DISCLAIMER
- Always render: "Spot-based estimate. Shop prices may differ due to making charges,
  VAT, and dealer premium." Use `tx()`.

WORK — MOBILE
- Inputs at ≥44px tap targets.
- Result card stays visible without scrolling on 360px when inputs are above the fold.
- AR + RTL parity verified.

WORK — OTHER TOOLS (if scope includes them)
- Weight converter: g / oz / tola (use the same constants).
- Zakat calculator: clearly state the assumption (current spot, weight in grams,
  haul threshold). Do not make religious claims; cite the methodology page.
- Investment-return calculator: show input weight, purchase price, current spot price,
  and computed delta. Clearly disclaim that "past performance does not guarantee
  future returns".

CONSTRAINTS — DO NOT TOUCH
- Pricing formula in `src/lib/price-calculator.js`.
- AED peg `3.6725`.
- Troy ounce `31.1035`.
- Karat purity values.
- FX source.
- Currency code list (without owner approval).
- VAT default rates (without owner approval).

VERIFY
- `npm test` (must include `tests/price-calculator.test.js`,
  `tests/pricing-engine.test.js`, `tests/formatter.test.js`,
  `tests/input-validation.test.js`)
- `npm run validate`
- `npm run quality`
- Manual: enter edge values (0, very large, decimals), confirm validation messages and
  result correctness.
- Manual: cycle EN ↔ AR.

DELIVERABLE
- Themed commits: `feat(calculator-inputs): ...`, `feat(calculator-result): ...`,
  `feat(tools-zakat): ...`, `feat(tools-return): ...`, `i18n(calculator): ...`.
- §51 final report.
```

**Files / surfaces Copilot should inspect:**

- `calculator.html`, `src/pages/calculator.js`, `src/pages/calculator/{utils,value-calculator}.js`
- `src/lib/{price-calculator,formatter}.js`
- `src/config/{constants,karats,translations}.js`
- `tests/{price-calculator,pricing-engine,formatter,input-validation}.test.js`
- `styles/pages/calculator.css`
- `methodology.html`
- Tool surfaces under `content/tools/*` or wherever the repo currently hosts them _(verify exists)_

**Required checks:**

- `npm test` (focused: price-calculator, pricing-engine, formatter, input-validation)
- `npm run validate`
- `npm run quality`
- Manual edge-value walkthrough.
- Manual EN/AR + 360/1440.

**Expected final report:**

- Inputs / outputs / disclaimers improved.
- Edge-value test cases added.
- Confirmation that pricing math, peg, troy ounce, karat values were not changed.
- §51 final report.

**Safety notes:**

- Pricing math is sacrosanct. The calculator is downstream of `price-calculator.js`.
- The "spot estimate vs retail" disclaimer is the trust line of the tool. Do not hide or shrink it.
- VAT / making charge / dealer premium toggles default OFF unless the owner says otherwise.

**Failure modes to watch for:**

- Agent adjusts a karat purity value to "round it nicer".
- Agent removes the disclaimer because it's "redundant".
- Agent silently adds a non-existent currency (e.g. INR without FX support).
- Agent rounds prices in a way that contradicts `formatter.js` rules.
- Agent introduces VAT default of 5% without owner approval.
- Agent ships a tool page without AR translations.

**Cross-references:**

- → [§9 Live Tracker Upgrade](#9-live-tracker-upgrade-prompt)
- → [§15 Data Reliability and Methodology](#15-data-reliability-and-methodology-prompt)
- → [§29 Pricing & Invest Pages](#29-pricing--invest-pages)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 15. Data Reliability and Methodology Prompt

**Purpose:** Strengthen the layer between the upstream gold + FX sources and the rendered price card
— clear source labeling, robust caching, sane fallbacks, visible freshness, honest stale states, and
a methodology page that auditors and skeptics can read and respect. This is the trust spine of the
product.

**When to use:**

- A data-source change is needed (new gold API, new FX source).
- Stale/cached states are unclear or invisible.
- Methodology page is out of sync with code.
- Circuit breaker / failure copy is rough.
- After incidents where users saw bad data without a label.

**Copy-paste prompt:**

```text
You are upgrading the data reliability and methodology layer of Gold Ticker Live. This
is the trust spine of the product. Your job is to make every piece of data the user sees
honestly labeled with its source, freshness, and limitations.

INSPECT FIRST
1. Read `src/lib/api.js` (gold + FX fetchers, timeouts, fallbacks).
2. Read `src/lib/cache.js` (`CACHE_KEYS` from `src/config/constants.js`).
3. Read `src/lib/live-status.js` (`STALE_AFTER_MS = 75 minutes` /
   `DELAYED_AFTER_MS = 30 minutes` for gold, `FX_STALE_AFTER_MS = 26 hours` for FX).
4. Read `src/lib/price-calculator.js` and `src/lib/formatter.js`.
5. Read `src/config/constants.js` (`API_GOLD_URL = '/data/gold_price.json'`,
   `API_FX_URL = 'https://open.er-api.com/v6/latest/USD'`, `AED_PEG = 3.6725`,
   `TROY_OZ_GRAMS = 31.1035`, `GOLD_REFRESH_MS = 90000`,
   `GOLD_FETCH_TIMEOUT = 8000`, `FX_FETCH_TIMEOUT = 8000`, `HISTORY_DAYS = 90`).
6. Read `tests/live-status.test.js`, `tests/circuit-breaker.test.js`,
   `tests/historical.test.js`, `tests/price-calculator.test.js`.
7. Read `methodology.html`. Compare against the constants above. Identify drift.
8. Read `docs/methodology.md`, `docs/tracker-state.md`, `docs/LIMITATIONS.md`.
9. Read the data files: `data/gold_price.json` shape, history files, fallback files.
10. Read `.github/workflows/gold-price-fetch.yml` (if it produces `data/gold_price.json`).

WORK — SOURCE LABELS
- Every price card shows the source ("XAU/USD spot via <source>") and the FX source
  ("FX via open.er-api.com").
- Every cached/stale render is visibly labeled. The canonical keys are `live`, `delayed`,
  `cached`, `stale`, `fallback`, `unavailable` (per `getLiveFreshness()` in
  `src/lib/live-status.js`), plus `closed` from `getFreshnessModel()`.

WORK — FRESHNESS
- `STALE_AFTER_MS = 75 * 60 * 1000` (`DELAYED_AFTER_MS = 30 * 60 * 1000`) for gold prices. Do not change.
- `FX_STALE_AFTER_MS = 26 * 60 * 60 * 1000` for FX (one day + margin). Do not change.
- `GOLD_REFRESH_MS = 90000` (90s polling). Do not change without owner approval.
- Show a relative-time label ("Updated 3 min ago"). Use `src/lib/formatter.js`.

WORK — FALLBACK & CACHE
- On API failure, fall back to the most recent cached value AND label it visibly.
- On both API failure AND no cache, render the `unavailable` state with helpful copy
  ("Live prices temporarily unavailable. Check back shortly.") — never `NaN`,
  `undefined`, `null`, or a stack trace.
- The cache keys are: `gold_price_cache`, `gold_price_fallback`, `fx_rates_cache`,
  `fx_rates_fallback`, `gold_day_open`, `gold_price_history`, `user_prefs`,
  `gold_price_alerts`. Do not rename without a migration plan.

WORK — CIRCUIT BREAKER
- Read `src/lib/api.js` for the circuit-breaker pattern. After N consecutive failures,
  the breaker opens and we serve cache. Confirm `tests/circuit-breaker.test.js`
  reflects the current threshold and verify the user-visible copy when the breaker is
  open.

WORK — METHODOLOGY PAGE
- `methodology.html` must clearly explain:
  * Formula: `price_per_gram = (XAU/USD ÷ 31.1035) × purity × FX`.
  * AED peg: `3.6725` (link to authoritative source if owner wants).
  * Troy ounce: `31.1035` grams.
  * Karat purities: 24K=99.9%, 22K=91.6%, 21K=87.5%, 18K=75% (verify against
    `src/config/karats.js`).
  * Sources for spot and FX, with cadence.
  * Cache and freshness behavior.
  * Limitations: prices are reference / spot-based; do not include making charges, VAT,
    dealer premium, or shop-specific markups.
- Bilingual EN + AR.

WORK — DOCS
- Update `docs/methodology.md`, `docs/tracker-state.md`, `docs/LIMITATIONS.md` to match
  code reality. The docs are the audit trail.

CONSTRAINTS — DO NOT TOUCH (without owner instruction)
- Pricing formula.
- `AED_PEG = 3.6725`.
- `TROY_OZ_GRAMS = 31.1035`.
- Karat purity values.
- FX source.
- `STALE_AFTER_MS`, `FX_STALE_AFTER_MS`, `GOLD_REFRESH_MS`.
- `CACHE_KEYS` (would invalidate user state).

VERIFY
- `npm test` (must include `tests/live-status.test.js`,
  `tests/circuit-breaker.test.js`, `tests/historical.test.js`,
  `tests/price-calculator.test.js`)
- `npm run validate`
- `npm run quality`
- Manual: simulate API failure, confirm fallback render and label.
- Manual: simulate stale > 75 min, confirm `stale` badge.
- Manual: methodology.html in EN + AR, confirm formulas match constants.

DELIVERABLE
- Themed commits: `feat(data-states): visible cached/stale labels`,
  `feat(data-fallback): clearer unavailable copy`,
  `docs(methodology): align with code`, `docs(limitations): audit & update`.
- §51 final report including a "carve-outs preserved" line for each constant above.
```

**Files / surfaces Copilot should inspect:**

- `src/lib/{api,cache,live-status,price-calculator,formatter,historical-data,site-settings}.js`
- `src/config/{constants,karats}.js`
- `methodology.html`
- `docs/methodology.md`, `docs/tracker-state.md`, `docs/LIMITATIONS.md`
- `data/gold_price.json` (shape)
- `tests/{live-status,circuit-breaker,historical,price-calculator}.test.js`
- `.github/workflows/gold-price-fetch.yml`

**Required checks:**

- `npm test`
- `npm run validate`
- `npm run quality`
- Manual API-failure / stale-state simulation.
- Manual methodology.html EN + AR walk.

**Expected final report:**

- States with visible labels confirmed (live / cached / stale / unavailable).
- Methodology / tracker-state / limitations docs reconciled with code.
- Constants explicitly listed as preserved.
- §51 final report.

**Safety notes:**

- This prompt is the most carve-out-heavy in the file. Every constant listed is load-bearing for
  trust.
- Stale data without a visible label is the worst trust violation in the product.
- The methodology page is what skeptical users read first; keep it factual.

**Failure modes to watch for:**

- Agent shortens `STALE_AFTER_MS` to "make stale states show less often".
- Agent renames a `CACHE_KEYS` entry, invalidating user prefs and alerts on next deploy.
- Agent removes the `unavailable` state copy and lets the UI render `NaN`.
- Agent rewrites `methodology.html` formulas in slightly different prose, drifting from code.
- Agent removes the circuit-breaker label even though `circuit-breaker.test.js` expects it.
- Agent changes the FX source without updating methodology or tests.

**Cross-references:**

- → [§9 Live Tracker Upgrade](#9-live-tracker-upgrade-prompt)
- → [§14 Calculator and Tools](#14-calculator-and-tools-prompt)
- → [§30 Chart Component](#30-chart-component) (historical data)
- → [§44 Supabase Data Sync](#44-supabase-data-sync)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 16. Docs and Governance Prompt

**Purpose:** Keep docs (`docs/**`, `README.md`, `AGENTS.md`, `.github/copilot-instructions.md`, this
prompt library) in sync with code reality. Govern the agent instruction surface so it stays
practical — not so loose that agents make reckless changes, and not so restrictive that agents
freeze and ship trivial PRs. Periodic reconciliation of the four canonical files is the goal.

**When to use:**

- Docs are stale relative to code (e.g. environment variables doc disagrees with
  `server/lib/auth.js`).
- Agent sessions consistently get stuck because docs over-restrict.
- New features ship without doc updates.
- Quarterly governance hygiene.
- After a large refactor that moved major modules.

**Copy-paste prompt:**

```text
You are running a docs and governance pass on Gold Ticker Live. Your job is to make the
docs reflect code reality and to keep agent instructions actionable, not paralyzing.

INSPECT FIRST
1. Read the four canonical agent files:
   - `AGENTS.md`
   - `.github/copilot-instructions.md`
   - `docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md` (this library)
   - `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`
2. Read every doc under `docs/`. Note which docs are stale.
3. Read `README.md`.
4. Read `docs/REVAMP_PLAN.md` and every plan under `docs/plans/`.
5. Spot-check code-vs-doc agreement on:
   - `docs/environment-variables.md` vs the env vars actually read by `server/lib/
     auth.js`, `src/config/supabase.js`, `scripts/python/post_gold_price.py`.
   - `docs/SUPABASE_SCHEMA.md` vs the actual Supabase queries in `server/` and
     `src/config/supabase.js`.
   - `docs/methodology.md` vs `src/config/constants.js`.
   - `docs/tracker-state.md` vs `src/lib/live-status.js`.
   - `docs/AUTOMATIONS.md` vs `.github/workflows/*`.
   - `docs/DEPENDENCIES.md` vs `package.json`.
   - `docs/DESIGN_TOKENS.md` vs `styles/global.css`.

WORK — RECONCILE
- For each stale doc, update it to match code reality. If a doc and code conflict,
  the code wins (unless the conflict is a known bug — in that case, log it).
- For each plan in `docs/plans/` that is older than 90 days and not referenced by an
  open PR or by `docs/REVAMP_PLAN.md`, archive it with a "DONE" or "ABANDONED" note;
  do not silently delete.

WORK — AGENT INSTRUCTIONS
- This prompt library (`docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md`) is the canon for
  agents. `AGENTS.md` and `.github/copilot-instructions.md` should point at it, not
  duplicate it.
- Avoid over-restrictive language that causes agents to freeze. Replace "do not
  change anything without owner approval" with the specific carve-out list from §50.
- Keep §50 (Safety Rules and Carve-Outs) as the single source of truth for what
  agents may not change without instruction.
- Keep the §51 final-report format as the single source of truth for end-of-session
  reporting.

WORK — PRACTICAL GOVERNANCE
- Make sure every doc file has a "Last reviewed" date or a reasonable freshness
  signal at the top.
- Make sure cross-references between docs work (no broken anchors).
- Make sure every public command (`npm run *`) referenced by docs exists in
  `package.json`.

CONSTRAINTS
- Do not delete historical docs. `CHANGELOG.md`, `docs/GOLD_TICKER_LIVE_REBRAND_*.md`
  are historical record; preserve them.
- Do not relax §50 carve-outs without an owner instruction.
- Do not change `AGENTS.md` to remove the protocol — it codifies the same
  expectations as this library.

VERIFY
- `npm run check-links` (catches broken markdown anchors)
- Manual: read each updated doc top to bottom.
- Verify each `npm run *` reference in docs against `package.json`.

DELIVERABLE
- Themed commits: `docs(env): align with auth.js`, `docs(supabase-schema): refresh`,
  `docs(automations): add new workflows`, `docs(plans): archive completed`.
- §51 final report listing reconciled docs and archived plans.
```

**Files / surfaces Copilot should inspect:**

- `AGENTS.md`, `.github/copilot-instructions.md`, this library,
  `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`
- All `docs/**/*.md`, `docs/plans/**/*.md`
- `README.md`
- `package.json` `scripts.*`
- Code surfaces being doc-cited (`server/lib/auth.js`, `src/config/supabase.js`,
  `src/config/constants.js`, `src/lib/live-status.js`, `styles/global.css`, `.github/workflows/*`)

**Required checks:**

- `npm run check-links`
- Manual doc-to-code agreement spot checks.

**Expected final report:**

- Docs updated, grouped (env, supabase, methodology, tracker, automations, design tokens).
- Plans archived (with reasons).
- Anchor / link check result.
- §51 final report.

**Safety notes:**

- Do not soften §50 carve-outs.
- Do not delete historical docs; archive instead.
- Do not edit `CHANGELOG.md` retroactively.

**Failure modes to watch for:**

- Agent makes the prompt library shorter to "reduce friction", losing carve-outs.
- Agent rewrites `docs/methodology.md` without verifying constants in `src/config/ constants.js`.
- Agent deletes a plan from `docs/plans/` that is still referenced by an open PR.
- Agent introduces a doc that recommends a script (`npm run typecheck`) that doesn't exist.
- Agent loosens carve-outs in this very file as part of a "doc cleanup".

**Cross-references:**

- → [§17 Rebrand Maintenance](#17-rebrand-maintenance-prompt)
- → [§47 Repo Cleanup and Architecture](#47-repo-cleanup-and-architecture)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§54 Changelog of this Prompt Library](#54-changelog-of-this-prompt-library)

---

## 17. Rebrand Maintenance Prompt

**Purpose:** Sweep every `Gold Prices` / `GoldPrices` / `Gold-Prices` / `gold_prices` / `goldprices`
/ `goldtickerlive` / `GoldTickerLive` reference in the repo and **classify** each match into one of
three buckets: `Fix now`, `Intentional carve-out`, `Manual owner decision`. Repair the `Fix now`
bucket via source generators where possible. Document the carve-outs. Surface owner decisions.

**When to use:**

- Quarterly rebrand hygiene.
- After a content burst or generator change that may have re-introduced old strings.
- When [§5a Cross-Surface Brand Consistency Audit](#5a-cross-surface-brand-consistency-audit) flags
  a high count.
- Before any marketing push.

**Copy-paste prompt:**

```text
You are running a rebrand maintenance sweep on Gold Ticker Live. The canonical brand is
"Gold Ticker Live" (compact: "GTL") and the canonical domain is
https://goldtickerlive.com/. The GitHub repo is `vctb12/Gold-Prices` (NOT renamed).

Some references to the old brand are intentional carve-outs. Your job is to FIND every
match, CLASSIFY it, and only then act.

INSPECT FIRST
1. Read §50 Safety Rules and Carve-Outs of this prompt library. Memorize the
   deployment, SEO, data, and identity carve-outs.
2. Read `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md` and any rebrand verification report
   under `docs/`.
3. Open the repo's brand-bearing surfaces (see §5a INSPECT FIRST list).

WORK — SWEEP
Run all five rebrand/consistency ripgrep sweeps from §49.

Variants to find:
- `Gold Prices`, `Gold Price`, `Gold-Prices`, `GoldPrices`, `GoldTickerLive`
- `gold-prices`, `gold_prices`, `goldprices`, `goldtickerlive`
- `Gold Price Tracker`, `Gold Prices UAE`, `GoldPrices.app`

WORK — CLASSIFY
For each match, classify into ONE of three buckets:

A) Fix now (canonical brand should now be "Gold Ticker Live"):
   - User-visible strings in HTML/JS/CSS/translations that say "Gold Prices" as the
     product name.
   - `<title>`, `<meta>`, `og:*`, `twitter:*` brand tags pointing at the wrong name.
   - JSON-LD `name` / `publisher` referring to the wrong brand.
   - Footer copy, nav, README marketing copy referring to the wrong brand.

B) Intentional carve-out (do NOT touch):
   - `/Gold-Prices/` paths required for GitHub Pages project-path deployment
     compatibility.
   - `github.com/vctb12/Gold-Prices` URLs (repo not renamed).
   - `vctb12.github.io/Gold-Prices/` historical/current Pages URL.
   - `gold_prices` schema/table names in `data/gold_price.json`,
     `data/pending_shops.json`, Supabase tables.
   - `data/gold_price.json` filename.
   - `countries/**/gold-prices/` URL paths (SEO carve-out).
   - SEO topic phrases: "Gold Prices Today", "How Gold Prices Work",
     "Why UAE Gold Prices Differ", "Gold Prices in Dubai", "Gold Prices in <City>".
   - `@GoldTickerLive` X handle.
   - Historical references in `CHANGELOG.md`,
     `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`,
     `docs/REBRAND_VERIFICATION_REPORT.md` and similar.

C) Manual owner decision (ambiguous):
   - Marketing slogans that reference "gold prices" generically.
   - Domain references in archived workflow files.
   - Old logo paths.
   - Any reference in an external integration where rename has side effects (Discord
     webhook names, Telegram bot username).

WORK — REPAIR
- For bucket A, prefer fixing the GENERATOR over the generated output:
  * `countries/**/*.html` matches → fix in `scripts/node/enrich-placeholder-pages.js`,
    `scripts/node/generate-placeholders.js`, `scripts/node/inject-schema.js`.
  * `content/**/*.html` matches → fix in their generator if they have one, else hand-
    edit and document the source.
  * `src/seo/seoHead.js` / `src/seo/metadataGenerator.js` matches → fix at source.
  * `manifest.json`, `package.json`, `src/config/translations.js` matches → fix at
    source.
- After generator fixes, re-run the relevant generator and commit the regen as a
  separate themed commit.
- For bucket B, do not touch. Document.
- For bucket C, surface a question for the owner; do not silently change.

WORKED EXAMPLE — CLASSIFICATION TABLE

| File:Line | Match | Bucket | Action |
|---|---|---|---|
| `manifest.json:2` | `"name": "Gold Prices Tracker"` | A | Edit `manifest.json` to "Gold Ticker Live — Live Gold Price Tracker"; bump SW `CACHE_NAME` |
| `package.json:2` | `"name": "gold-prices"` | A | Edit to `"gold-ticker-live"` (only the npm package identity, NOT the GitHub repo) |
| `vite.config.js:60` | `base: '/'` | B | Carve-out — `'/'` is correct for the custom domain; do not change to `'/Gold-Prices/'` |
| `CHANGELOG.md:42` | `- Renamed from Gold Prices to Gold Ticker Live` | B | Historical record; do not touch |
| `countries/uae/dubai/gold-prices/index.html:1` | path `/gold-prices/` | B | SEO carve-out; do not change route path |
| `data/gold_price.json` (filename) | `gold_price.json` | B | Schema carve-out; do not rename |
| `src/config/translations.js:120` | `home.heroTitle.en: "Gold Prices Today"` | B | SEO topic phrase carve-out; keep |
| `README.md:3` | `# Gold Prices` | A | Edit to `# Gold Ticker Live` |
| `src/social/postTemplates.js:14` | `Track #GoldPrices` | C | Hashtag — surface to owner; may be intentional for reach |

CONSTRAINTS
- Do not rename the GitHub repo.
- Do not change `CNAME`.
- Do not change `vite.config.js` `base` (currently `'/'`).
- Do not change `gold_price.json` filename or `gold_prices` schema names.
- Do not change `countries/**/gold-prices/` URL paths.
- Do not change `@GoldTickerLive` X handle.
- Do not edit historical docs / changelog entries retroactively.

VERIFY
- All five §49 rebrand sweeps with before/after counts.
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run build` (sanity)
- Manual: spot-check 5 brand surfaces (manifest, footer, JSON-LD on home, OG tags on
  tracker, README first paragraph).

DELIVERABLE
- Themed commits: `rebrand(generators): fix country/city pages at source`,
  `rebrand(meta): manifest + JSON-LD + OG`, `rebrand(docs): README + nav copy`,
  `chore(regen): regenerate after rebrand fixes`.
- A classification table in the PR body listing every match.
- A list of bucket-C items surfaced for owner decision.
- §51 final report with carve-outs preserved.
```

**Files / surfaces Copilot should inspect:**

- Same as [§5a Cross-Surface Brand Consistency Audit](#5a-cross-surface-brand-consistency-audit)
- Plus historical docs that must NOT be edited: `CHANGELOG.md`,
  `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`, `docs/REBRAND_VERIFICATION_REPORT.md`, archived plans.

**Required checks:**

- All five §49 rebrand sweeps with before/after counts.
- `npm run validate`
- `npm test`
- `npm run lint`
- `npm run build`

**Expected final report:**

- Classification table (file:line | match | bucket | action).
- Counts: bucket A fixed, bucket B preserved, bucket C surfaced.
- Generators edited and regen commits produced.
- §51 final report with carve-outs preserved.

**Safety notes:**

- Bucket B is non-negotiable. Document every preserved carve-out.
- Bucket C must NEVER be silently fixed; the agent surfaces these to the owner.
- Generator-first repair: never hand-edit a generated file when the generator can produce the
  correct string.

**Failure modes to watch for:**

- Agent silently rewrites `gold_prices` schema name, breaking Supabase joins.
- Agent renames `data/gold_price.json` to `data/gold_ticker_live.json`, breaking `API_GOLD_URL`.
- Agent edits `countries/dubai/gold-prices/` to `countries/dubai/gold-ticker-live/`, breaking SEO
  routes.
- Agent edits `@GoldTickerLive` to `@gold_ticker_live` in social templates, breaking the live X
  automation.
- Agent edits historical changelog entries to "fix" old brand mentions.
- Agent rewrites `vite.config.js` `base` to `'/Gold-Prices/'` in misguided consistency.

**Cross-references:**

- → [§5a Cross-Surface Brand Consistency Audit](#5a-cross-surface-brand-consistency-audit)
- →
  [§18 Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 18. Generated Files and Source Generator Prompt

**Purpose:** Make every change to a generated file go through its source generator. Per-generator,
this prompt covers when to run, what is produced, whether the output is committed, and the cardinal
rule "edit the generator before the generated file; never hand-edit a generated file unless you also
update the generator in the same commit."

**When to use:**

- Any edit to `countries/**/*.html`, `content/**/*.html`, `data/shops*.json`, `sitemap.xml`, JSON-LD
  blocks in HTML, `feed.xml`, or newsletter HTML.
- Drift detected by [§5c Generated-vs-Source Drift Audit](#5c-generated-vs-source-drift-audit).
- Any change to a `scripts/node/*` generator.
- Before opening a PR that touches any generator's output.

**Copy-paste prompt:**

```text
You are working with generated files on Gold Ticker Live. The repo's build pipeline runs:
`extract-baseline → normalize-shops → inject-schema → generateSitemap → vite build`.
Each step is a generator. Your job is to edit the generator, NOT the output.

INSPECT FIRST
1. Read `package.json` `scripts.build`. Memorize the canonical generator order.
2. Read each generator end-to-end:
   - `scripts/node/extract-baseline.js` — extracts a baseline of HTML files for diff
     auditing.
   - `scripts/node/normalize-shops.js` — gates the shape of `data/shops*.json`.
   - `scripts/node/inject-schema.js` — injects JSON-LD into HTML files. NOT
     idempotent (uses `fs.stat` mtime for Article dates). Re-runs may produce diffs
     when source HTML mtimes shift.
   - `scripts/node/generate-sitemap.js` — emits `sitemap.xml`.
   - `scripts/node/check-sitemap-coverage.js` — gates sitemap-vs-pages parity.
   - `scripts/node/enrich-placeholder-pages.js` — fills placeholder copy on stub
     country/city pages.
   - `scripts/node/generate-placeholders.js` — creates new placeholder pages from
     country/city data.
   - `scripts/node/generate-rss.js` — emits `feed.xml` (verify exists).
   - `scripts/node/generate-newsletter.js` — emits newsletter HTML.
   - `scripts/node/check-seo-meta.js`, `scripts/node/seo-audit.js`,
     `scripts/node/inventory-seo.js` — checkers, not emitters.
   - `scripts/node/check-unsafe-dom.js` — DOM-safety baseline gate.
   - `scripts/node/check-sw-coverage.js` — SW precache coverage gate.
3. Read `docs/AUTOMATIONS.md`.
4. Read `tests/` for any test that asserts generator output stability.

WORK — RULE
The cardinal rule: **edit the generator BEFORE the generated file. Never hand-edit a
generated file unless you also update its generator in the SAME commit.**

WORK — PER GENERATOR

`scripts/node/inject-schema.js` (CJS, NOT idempotent)
- When to run: as part of `npm run build`, or manually after a content/SEO change that
  affects schema.
- Output: in-place rewrites of HTML files at the repo root, in `countries/**/*.html`,
  `content/**/*.html`, etc. Article schema dates use `fs.stat` mtime → YYYY-MM-DD.
- Committed: yes (the schema-injected HTML is committed to the repo).
- Drift behavior: re-runs may produce diffs when source HTML mtimes shift, even with
  no semantic change. Treat such diffs as expected; do not commit unless you intend to
  refresh schema dates.
- `--check` flag: yes; runs without writing, exits non-zero on drift.

`scripts/node/generate-sitemap.js`
- When to run: after adding/removing pages, or after country/city placeholder
  regeneration.
- Output: `sitemap.xml`.
- Committed: yes.
- Drift behavior: deterministic given the same set of pages.
- Pair with: `scripts/node/check-sitemap-coverage.js` (gate; ensures every page has a
  sitemap entry and no orphans).

`scripts/node/enrich-placeholder-pages.js`
- When to run: when placeholder country/city pages need richer copy.
- Output: in-place rewrites of stub pages with enriched HTML.
- Committed: yes.
- Drift behavior: deterministic given input data; re-runs after data changes will
  produce diffs.
- `--check` flag: yes (verify in source); runs without writing.

`scripts/node/generate-placeholders.js`
- When to run: when adding a new country or city to coverage.
- Output: new HTML files under `countries/**/`.
- Committed: yes.
- Drift behavior: idempotent for existing pages; emits new files for new entries.

`scripts/node/normalize-shops.js`
- When to run: after editing `data/shops.json` or `data/pending_shops.json`.
- Output: in-place normalization of the JSON data files (canonical shape).
- Committed: yes.
- Drift behavior: deterministic; re-runs surface invalid entries via warnings.

`scripts/node/generate-rss.js` (verify exists)
- When to run: after content/news updates.
- Output: `feed.xml` (verify path).
- Committed: yes.

`scripts/node/generate-newsletter.js`
- When to run: scheduled via `.github/workflows/daily-newsletter.yml` and
  `weekly-newsletter.yml`.
- Output: newsletter HTML for the day/week.
- Committed: typically not — output is sent via the send script.

`scripts/node/extract-baseline.js`
- When to run: as the first step of `npm run build`.
- Output: a baseline file used by `check-unsafe-dom.js` and similar checkers.
- Committed: typically yes for the unsafe-DOM baseline.

WORK — DOM-SAFETY BASELINE
- `scripts/node/check-unsafe-dom.js` keeps a per-file baseline of innerHTML / outerHTML
  / insertAdjacentHTML / document.write sinks.
- Adding a sink fails CI.
- Removing a sink should tighten the baseline in the same PR.

CONSTRAINTS
- Do not commit `dist/`.
- Do not reorder the canonical generator chain.
- Do not bypass `normalize-shops.js` by hand-editing `data/shops*.json`.
- Do not hand-edit JSON-LD in HTML; route additions through `inject-schema.js`.
- Do not commit `inject-schema.js` mtime-only diffs unless intentional.

VERIFY
- `npm run validate` (runs `inject-schema.js --check`,
  `enrich-placeholder-pages.js --check`, `inventory-seo.js --check`,
  `externalize-analytics.js --check`)
- `npm run build` on a clean tree, then `git diff --stat` to surface drift
- `npm test`
- `node scripts/node/check-sitemap-coverage.js`
- `node scripts/node/check-seo-meta.js`
- `node scripts/node/check-unsafe-dom.js`

DELIVERABLE
- A clear separation between generator-edit commits and regen commits in the PR.
- Per-generator notes in the PR body when behavior changed.
- §51 final report listing generators touched and outputs re-emitted.
```

**Files / surfaces Copilot should inspect:**

- Every `scripts/node/*` generator listed in the prompt.
- `package.json` `scripts.build`
- `docs/AUTOMATIONS.md`
- All generated outputs: `countries/**/*.html`, `content/**/*.html`, `data/shops*.json`,
  `sitemap.xml`, `feed.xml`, JSON-LD blocks.
- `tests/` files asserting generator output stability.

**Required checks:**

- `npm run validate`
- `npm run build` then `git diff --stat`
- `npm test`
- Each generator's `--check` mode where supported.

**Expected final report:**

- Generators edited and the regen commits produced.
- Confirmation that no generated file was edited in isolation.
- Drift-vs-baseline summary.
- §51 final report.

**Safety notes:**

- `inject-schema.js` mtime drift is a known repo trap; treat as expected unless intentional.
- The build pipeline order is canonical; do not reorder.
- Generators that are also gates (`check-*`) should remain side-effect-free.

**Failure modes to watch for:**

- Agent commits noisy `inject-schema.js` mtime diffs alongside feature work.
- Agent adds a new generator without wiring it into `package.json` `scripts.build`.
- Agent edits `data/shops.json` directly, bypassing `normalize-shops.js`.
- Agent introduces a new innerHTML sink in a generator's output, regressing the baseline.
- Agent orders `vite build` before `inject-schema.js`, losing schema injection.
- Agent commits `dist/`.

**Cross-references:**

- → [§5c Generated-vs-Source Drift Audit](#5c-generated-vs-source-drift-audit)
- → [§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
- → [§24 FAQ + Structured Data](#24-faq--structured-data)
- → [§41 Placeholder & Stub Page Completion](#41-placeholder--stub-page-completion)
- → [§43 RSS Feed & News](#43-rss-feed--news)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 19. Large PR Execution Prompt

**Purpose:** When the task naturally spans 5+ files of substantive change, force the agent to plan
and execute as a sequence of themed commits — not one monolithic mega-diff. This is the prompt to
paste when an agent is producing tiny shallow PRs for what should be broad work, or producing one
giant unreviewable PR for what should be a sequence.

**When to use:**

- Owner says "revamp X", "polish the whole site", "improve SEO across the platform".
- A multi-area sprint is in flight.
- The agent has produced a 1500-line single-commit PR and the reviewer wants it re-shaped.
- After [§4 Universal Starter](#4-universal-new-session-starter-prompt), when the task scope clearly
  exceeds one specialized prompt.

**Copy-paste prompt:**

```text
You are executing a LARGE PR on Gold Ticker Live. "Large" means: 5+ files of
substantive change, or work that spans 2+ specialized prompts in this library. Your job
is to ship a sequence of themed, single-purpose commits — NOT one monolithic mega-diff,
and NOT a series of tiny cosmetic edits.

INSPECT FIRST
1. Read §4 Universal Starter and complete the §2 Required Session Protocol.
2. Identify which specialized prompts (§§8–48) this work touches. Enumerate them in
   your plan.
3. Read `docs/REVAMP_PLAN.md` to find the active track this PR contributes to.
4. Read the most recent plan in `docs/plans/`. If your work is large and there is no
   plan, write one before editing: `docs/plans/YYYY-MM-DD_<slug>.md`. Open a draft
   PR with just the plan first.

WORK — PLAN FIRST
- Decompose the work into BUCKETS. Each bucket maps to a themed commit. Suggested
  themes (Conventional Commits style):
  * `docs`        — plan, README, doc updates
  * `tokens`      — design token additions / consolidations
  * `layout`      — global layout primitives, card hierarchy
  * `nav`         — nav, drawer, footer
  * `tracker`     — tracker UX (states, filters, hero)
  * `calculator`  — calculator UX
  * `shops`       — shops directory UX / data
  * `seo`         — titles, descriptions, canonicals, schema
  * `pwa`         — manifest, service worker, offline
  * `generated`   — regenerated outputs (separate from generator edits)
  * `a11y`        — accessibility fixes
  * `perf`        — lazy-load, image dimensions, bundle size
  * `i18n`        — translation parity, AR copy quality, RTL fixes
  * `cleanup`     — dead code, dead docs
  * `verification`— final checks, screenshots, deploy gate

- Each bucket = one or two commits. Aim for ≤ 400 lines per commit unless the commit
  is intentionally a generator regen.

- Bucket order should be: docs → tokens → layout → nav → page-level (tracker,
  calculator, shops) → seo → pwa → i18n → a11y → perf → generated → cleanup →
  verification.

WORK — EXECUTE BUCKETS
- Implement bucket 1, run validation, commit, push.
- Implement bucket 2, run validation, commit, push.
- Repeat until all buckets are shipped.
- After each commit, run AT MINIMUM `npm test` and `npm run validate`. Run the full
  matrix from §49 before opening the PR for review.

WORK — WORKED-EXAMPLE COMMIT SEQUENCE (UI/UX revamp)

1. `docs(plan): add 2026-04-30 ux-revamp plan`
   files: `docs/plans/2026-04-30_ux-revamp.md`
2. `feat(tokens): consolidate surface + text aliases`
   files: `styles/global.css`
3. `feat(layout): tighten card primitives + spacing rhythm`
   files: `styles/global.css`, `styles/pages/home.css`,
   `styles/pages/shops.css`
4. `feat(nav): mobile drawer hierarchy + active states`
   files: `src/components/nav.js`, `src/components/nav-data.js`,
   `styles/global.css`
5. `feat(tracker-ui): freshness pill + state badges`
   files: `src/tracker/render.js`, `src/tracker/dom-builders.js`,
   `styles/pages/tracker-pro.css`, `src/config/translations.js`
6. `feat(calculator-ui): result card + disclaimer hierarchy`
   files: `src/pages/calculator.js`, `styles/pages/calculator.css`,
   `src/config/translations.js`
7. `seo(meta): tighten home + tracker titles/descriptions`
   files: `src/seo/seoHead.js`, `index.html`, `tracker.html`
8. `i18n(ar): rewrite hero + tracker freshness copy`
   files: `src/config/translations.js`
9. `style(rtl): mirror chevrons + breadcrumb order`
   files: `styles/global.css`, `src/components/breadcrumbs.js`
10. `chore(sw): bump CACHE_NAME to goldtickerlive-v17`
    files: `sw.js`
11. `chore(regen): regenerate sitemap + schema after meta changes`
    files: `sitemap.xml`, generated HTML
12. `docs: update REVAMP_PLAN with shipped items`
    files: `docs/REVAMP_PLAN.md`

CONSTRAINTS
- No tiny shallow PRs. If the task is broad, ship broad work in themed commits.
- No monolithic mega-commit. ≤ 400 lines per commit unless intentionally a regen.
- No mixing of generator edits and regen output in the same commit.
- No skipping of validation after each commit.
- No force-push.
- No commits to `main`.

VERIFY
- After each bucket: `npm test`, `npm run validate`.
- Before opening PR: `npm run lint`, `npm run quality`, `npm run build`,
  `node scripts/node/check-unsafe-dom.js`, `npm run seo-audit` (if SEO touched),
  `npm run image-audit` (if images touched), `npm run pre-deploy` (if available).

DELIVERABLE
- 8–15 themed commits.
- PR body with What / Why / How / Proof / Risks.
- Bucket-by-bucket section in the PR body.
- §51 Session Final Report inside the PR body.
```

**Files / surfaces Copilot should inspect:**

- Varies by scope. Use [§3 Quick Picker](#3-prompt-index--quick-picker) to enumerate files for each
  bucket.
- Always: `docs/REVAMP_PLAN.md`, `docs/plans/`, the relevant specialized prompts' `INSPECT FIRST`
  lists.

**Required checks:**

- After each bucket: `npm test`, `npm run validate`.
- Before PR: full §49 matrix.
- Per-bucket sanity (e.g. `node scripts/node/check-seo-meta.js` for seo bucket,
  `npm run image-audit` for perf bucket).

**Expected final report:**

- 8–15 themed commits.
- Bucket-by-bucket summary in the PR body.
- §51 Session Final Report.
- Carve-outs preserved enumerated.
- Manual follow-up listed (cite [§52](#52-manual-follow-up-reporting-expectations)).

**Safety notes:**

- The bucket order matters — generator regens come AFTER the generator edits, in separate commits.
- SW `CACHE_NAME` bump goes in its own `chore(sw): ...` commit.
- Generator regen commits should be diff-only (no logic), so reviewers can skim them fast.

**Failure modes to watch for:**

- Agent ships one giant commit with 1500 lines across 30 files — un-reviewable.
- Agent ships 30 trivial 3-line commits, none of which advance the work.
- Agent mixes generator edits and regen output in the same commit, masking the generator change.
- Agent skips validation between buckets and ships a PR that fails CI on bucket 4.
- Agent reorders the bucket sequence, regenerating before the generator edits, and produces an empty
  regen.
- Agent skips the `docs(plan)` bucket and starts editing without a plan.

**Cross-references:**

- → [§4 Universal New Session Starter Prompt](#4-universal-new-session-starter-prompt)
- → [§7 Before New PR Prompt](#7-before-new-pr-prompt)
- →
  [§20 Final Verification and Deploy Safety Prompt](#20-final-verification-and-deploy-safety-prompt)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 20. Final Verification and Deploy Safety Prompt

**Purpose:** The final gate before merge. Produce a deploy-readiness verdict. Run every relevant
check from [§49](#49-validation-commands-reference). Confirm every carve-out from
[§50](#50-safety-rules-and-carve-outs) is preserved. Surface every manual follow-up from
[§52](#52-manual-follow-up-reporting-expectations). End with a clear
`Safe to deploy: yes/no — <reasoning>` line.

**When to use:**

- Immediately before merging a PR.
- Before any time-sensitive deploy (release, marketing push, demo).
- After a hot-fix that touched deployment-sensitive paths.
- As the final command of any session driven by
  [§19 Large PR Execution](#19-large-pr-execution-prompt).

**Copy-paste prompt:**

```text
You are running the final verification and deploy-safety pass on Gold Ticker Live.
Your job is to produce a deploy-readiness verdict.

INSPECT FIRST
1. Read the PR body. Note the buckets shipped and the surfaces touched.
2. Read §50 Safety Rules and Carve-Outs of this prompt library. Walk every carve-out
   against the PR's diff.
3. Read §52 Manual Follow-Up Reporting Expectations. Identify any work that must
   happen outside this repo.

WORK — RUN THE FULL CHECK MATRIX
- `git status --short` (clean)
- `git branch --show-current`
- `git log --oneline origin/main..HEAD` (themed, single-purpose commits)
- `git diff --stat origin/main..HEAD` (no surprise files)
- `npm ci` (lockfile aligned)
- `npm run lint`
- `npm test`
- `npm run validate`
- `npm run quality`
- `npm run build`
- `npm run seo-audit` (if SEO touched)
- `npm run check-links` (if links/internal nav touched)
- `npm run image-audit` (if images touched)
- `npm run perf:ci` (if perf-relevant; verify exists)
- `npm run a11y` (if a11y-relevant; verify exists)
- `npm run pre-deploy` (verify exists; runs the pre-deploy go/no-go check matrix)

WORK — RUN THE RIPGREP AUDITS
- All five rebrand/consistency sweeps from §49. Capture before/after counts.
- innerHTML/outerHTML/insertAdjacentHTML sweep on `src/`. Confirm DOM-safety baseline
  not regressed.
- TODO/FIXME/HACK sweep. List anything new introduced by this PR.

WORK — DEPLOYMENT-SENSITIVE SPOT CHECKS
For each of these, confirm no unintended change:
- `CNAME` (must read `goldtickerlive.com`)
- `vite.config.js` `base` (must read `'/'`)
- `manifest.json` `start_url`, `scope`, `name`, `short_name`
- `sw.js` `CACHE_NAME` (bumped if user-visible assets changed)
- `.github/workflows/post_gold.yml` (untouched unless intentional)
- `.github/workflows/deploy.yml` (untouched unless intentional)
- `_headers`, `_redirects`
- `robots.txt` (`Disallow: /admin/`, `Disallow: /api/` intact)

WORK — DATA-SAFETY SPOT CHECKS
- `src/config/constants.js` (`AED_PEG = 3.6725`, `TROY_OZ_GRAMS = 31.1035`,
  `STALE_AFTER_MS`, `FX_STALE_AFTER_MS`, `GOLD_REFRESH_MS = 90000`, `CACHE_KEYS`)
  unchanged.
- `src/config/karats.js` purity values unchanged.
- `src/lib/price-calculator.js` formulas unchanged.

WORK — PRODUCE THE VERDICT
End your response with the §51 Session Final Report and the explicit final line:

  Safe to deploy: <yes/no> — <one-paragraph reasoning>

If `no`, list the blockers and the fix path.

CONSTRAINTS
- Do not merge. The verdict is advisory; merge is owner-driven.
- Do not skip a check because "it didn't apply this time"; mark it `skipped (reason)`.
- Do not silently fix issues you discover here; surface them and fix in a follow-up
  commit if they block the verdict.

DELIVERABLE
- A complete §51 Session Final Report.
- Explicit `Safe to deploy:` verdict.
- List of remaining manual follow-up items (cite §52).
```

**Files / surfaces Copilot should inspect:**

- The full PR diff.
- All deployment-sensitive paths listed in the prompt.
- All data-safety paths listed in the prompt.
- The PR body and each commit message.

**Required checks:**

- The full §49 matrix where applicable.
- All five rebrand/consistency ripgrep sweeps.
- innerHTML/outerHTML/insertAdjacentHTML sweep.
- Spot checks of deployment- and data-sensitive files.

**Expected final report:**

- §51 Session Final Report.
- Explicit `Safe to deploy: yes/no — <reasoning>` line.
- Carve-outs preserved.
- Manual follow-up listed.

**Safety notes:**

- This is the gate. If anything fails, the verdict is `no`.
- Skipped checks must be justified, not silently dropped.
- The verdict is advisory. The owner merges.

**Failure modes to watch for:**

- Agent declares `Safe to deploy: yes` without running the matrix.
- Agent silently fixes issues it found during the gate, blurring the audit trail.
- Agent skips the rebrand sweep because "no brand changes were intended" — sweeps catch unintended
  changes.
- Agent says "tests pass" without actually running them.
- Agent ignores a SW `CACHE_NAME` regression.
- Agent ignores a `manifest.json` `start_url` change because it "looks harmless".

**Cross-references:**

- → [§7 Before New PR Prompt](#7-before-new-pr-prompt)
- → [§19 Large PR Execution Prompt](#19-large-pr-execution-prompt)
- → [§38 Pre-deploy, Changelog & Release](#38-pre-deploy-changelog--release)
- → [§49 Validation Commands Reference](#49-validation-commands-reference)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§51 Expected Final-Report Format](#51-expected-final-report-format)
- → [§52 Manual Follow-Up Reporting Expectations](#52-manual-follow-up-reporting-expectations)

---

# Specialized Prompts

The remaining prompts (§§21–48) are specialized — narrow scope, high focus. Pair them with
[§4 Universal Starter](#4-universal-new-session-starter-prompt) at the start of any session, with
[§7 Before New PR Prompt](#7-before-new-pr-prompt) before opening the PR, and with
[§20 Final Verification](#20-final-verification-and-deploy-safety-prompt) before merge.

---

## 21. Homepage Hero & Above-the-Fold

**Purpose:** The homepage hero is the single biggest first-impression surface on
`goldtickerlive.com`. Visitors decide in under five seconds whether the site is trustworthy. This
prompt makes the above-the-fold answer three questions at a glance — _what is this, is it live, what
should I do next_ — without changing pricing math, freshness thresholds, or the karat purity table.

**When to use:**

- The homepage hero feels generic, hype-y, or unclear about live vs. cached state.
- Mobile (360 px) above-the-fold is cramped, freshness pill is invisible, or CTAs are wrong.
- Country search, karat strip unit toggle, or copy-row affordance is broken or unlabeled.
- A new owner-approved hero variant needs to land cleanly without breaking translations.

**Copy-paste prompt:**

```text
You are upgrading the homepage hero and above-the-fold experience on Gold Ticker Live. The
homepage is the highest-leverage surface — visitors decide in five seconds whether the site
is trustworthy. The hero must answer: what is this, is it live, what should I do next.

INSPECT FIRST
1. Read `index.html` end-to-end. Note every section in DOM order: hero, freshness pill,
   `#hlc-updated`, karat strip (`#karat-strip`, `#karat-strip-updated`), `#country-search`,
   `.country-tiles`, hero CTAs.
2. Read `src/pages/home.js` — focus on `renderHeroCard`, `renderKaratStrip`,
   `startFreshnessTimer` (ticks every 1s, sets `data-freshness-key` and `data-freshness-age`
   on `#hlc-updated` and `#karat-strip-updated`), `initCountrySearch` (`#country-search` input,
   `.country-tile--filtered` class, ArrowDown/Up/Escape keyboard nav), `KARAT_STRIP_UNIT_MULT`,
   `karatStripUnit` localStorage in `user_prefs`.
3. Read `styles/pages/home.css` — hero card, freshness pill `::before` pseudo-elements
   (⚠ / ✕ for stale / unavailable, color-blind accessible), `.country-search-input`,
   `.country-search-empty`, `.kstrip-unit-toggle`.
4. Read `src/lib/live-status.js` — `STALE_AFTER_MS = 75 * 60 * 1000`, freshness states
   `live | delayed | cached | stale | fallback | unavailable` (+ `closed`).
5. Read translations `home.*`, `home.karatStripLabelGram/Tola/Oz`, `gold.freshness.label`,
   `gold.badge`, `aed.badge` in `src/config/translations.js`.

WORK — hero
- Make the hero answer in one glance: "Live UAE & GCC gold prices, derived from XAU/USD spot."
  No corporate fluff, no hype, no "best price guaranteed" wording.
- The freshness pill (`#hlc-updated`) must be visible above the fold on 360 px width. Use the
  existing `data-freshness-key` states (`live`, `cached`, `stale`, `unavailable`) and the
  CSS `::before` icons. Do not move the threshold (75 min; delayed at 30 min) without owner approval.
- Primary CTA → tracker. Secondary CTA → calculator. Tertiary text link → methodology.
  All three labels live in translations.
- The hero AED + USD price card must surface its source line (e.g. "Spot · derived from
  XAU/USD · AED at 3.6725 peg").

WORK — karat strip
- Verify the unit toggle (g / tola / oz) persists via `karatStripUnit` in `user_prefs`
  localStorage. Default is grams. Active state is unambiguous.
- Each karat row has a copy button that copies a deterministic share string (use the
  existing handler; do not invent a new format).
- Karat rows align cleanly at 360 px — no overflow, no truncated numerals.

WORK — country search
- `#country-search` filters `.country-tiles` via `.country-tile--filtered`. Verify
  ArrowDown/Up/Escape keyboard navigation still works and `applyLangToPage()` covers AR.
- Empty state (`.country-search-empty`) reads naturally in EN + AR with the typed query.
- Tap-target on each country tile ≥ 44 × 44 px on mobile.

WORK — freshness timer hygiene
- Confirm the tick in `startFreshnessTimer` only writes when the rendered string changes
  (avoid layout thrash and aria-live spam).
- `aria-live="polite"` only on the freshness pill region — not on the price numerals.

CONSTRAINTS
- Do not change `STALE_AFTER_MS`, `AED_PEG`, or `GOLD_REFRESH_MS`.
- Do not change the karat purity table, the troy-ounce constant, or `KARAT_STRIP_UNIT_MULT`.
- Every user-visible string EN + AR via `src/config/translations.js`.
- Do not introduce a new freshness state name without updating `src/lib/live-status.js`,
  the CSS selectors keyed on `data-freshness-key`, and the freshness tests.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: throttle the network and confirm cached / stale / unavailable pills render.
- Manual: tab through the hero — every interactive element is reachable and labeled.
- Manual: 360 px and 1440 px in EN + AR; copy a karat row in each language.

DELIVERABLE
PR with focused commits (hero, freshness pill, karat strip, country search, RTL, tests).
Update `docs/tracker-state.md` if you clarified any freshness copy.
```

**Files / surfaces to inspect:**

- `index.html` (hero block, `#hlc-updated`, `#karat-strip`, `#country-search`).
- `src/pages/home.js` (`renderHeroCard`, `renderKaratStrip`, `startFreshnessTimer`,
  `initCountrySearch`).
- `styles/pages/home.css` (`data-freshness-key` selectors, `.country-search-*`).
- `src/lib/live-status.js` (`STALE_AFTER_MS`, freshness key derivation).
- `src/config/translations.js` (`home.*`, `gold.freshness.*`, `gold.badge`, `aed.badge`).
- `tests/home-translations.test.js` (translation key gates).

**Required checks:**

- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- `node scripts/node/check-unsafe-dom.js` — DOM-safety baseline must not regress.
- Manual 360 px / 1440 px / EN / AR sweep; throttled network for cached/stale/unavailable.

**Expected final report:**

- Hero copy diff (EN + AR).
- Freshness pill verified across all six keys with screenshots.
- Karat strip: unit toggle persistence verified; copy button works in EN + AR.
- Country search keyboard nav verified.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Pricing math, AED peg, freshness thresholds are immutable here. See
  [§50](#50-safety-rules-and-carve-outs).
- `aria-live` regions on price numerals announce too often — keep them on the pill only.

**Failure modes to watch for:**

- Agent moves `STALE_AFTER_MS` to "make the demo look fresh".
- Agent introduces a fifth freshness state without updating CSS, tests, and translations.
- Agent rewrites the karat-strip share string and breaks the analytics event payload.
- Agent silently removes the source line from the hero card to clean up the design.
- Agent drops EN/AR parity for the empty-search state.
- Agent makes the freshness pill an icon-only element with no aria-label.

**Cross-references:**

- → [§9 Live Tracker Upgrade Prompt](#9-live-tracker-upgrade-prompt)
- → [§12 Arabic / RTL Quality Prompt](#12-arabic--rtl-quality-prompt)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 22. Country & City Pages Deep Dive

**Purpose:** Country and city pages under `countries/**/gold-prices/` are the SEO long-tail and the
second-largest source of organic traffic after the homepage. They must be substantive,
locally-credible, and consistent with the tracker's freshness model — without becoming
template-stamped boilerplate that Google demotes.

**When to use:**

- A new country or city page is being added.
- An audit of existing pages reveals duplicated copy, weak intros, missing breadcrumbs, or stale
  schema.
- A generator change requires regenerating the country/city HTML output.
- Internal linking between country pages, city pages, the tracker, and the calculator is sparse or
  one-directional.

**Copy-paste prompt:**

```text
You are upgrading the country and city pages on Gold Ticker Live. These pages live under
`countries/**/gold-prices/` and `countries/**/<city>/` and are the SEO backbone of the site.
The URL path `countries/**/gold-prices/` is a SEO carve-out — never rename it.

INSPECT FIRST
1. List `countries/` top-level directories and a representative sample of city subpages
   (e.g. `countries/uae/gold-prices/index.html`, `countries/uae/dubai/gold-prices/index.html`).
2. Read `scripts/node/enrich-placeholder-pages.js` and `scripts/node/generate-placeholders.js` —
   these are the generators that emit country/city HTML.
3. Read `scripts/node/inject-schema.js` — it injects JSON-LD by rewriting source HTML; Article
   schema dates come from `fs.stat` mtime truncated to YYYY-MM-DD. Idempotent as of Round 16.
4. Read `scripts/node/generate-sitemap.js` and `scripts/node/check-sitemap-coverage.js`.
5. Read `src/seo/seoHead.js` and `src/seo/metadataGenerator.js` — title / description /
   canonical / hreflang / OG / Twitter card patterns.
6. Read `src/components/breadcrumbs.js` and `src/components/internalLinks.js` — country/city
   breadcrumbs and the related-pages linker.
7. Read translations `country.*`, `city.*`, `seo.*` in `src/config/translations.js`.

WORK — page substance
- Each country page must have a unique, locally-credible intro paragraph (EN + AR).
  No "lorem", no copy-pasted boilerplate across countries.
- Each city page must reference at least one local landmark or market (e.g. Gold Souk,
  Deira, Sharjah Central Market) and inherit the country freshness model.
- Every page surfaces the live tracker (or its current cached/stale state) — never a
  hardcoded price snapshot.

WORK — SEO surfaces
- Title pattern: "Gold Prices in <City> Today — Live <Karats> Rates · Gold Ticker Live".
- Description: ~155 chars, mentions the city, the karats (24K/22K/21K/18K), AED + USD,
  and "updated every 90 seconds". Do not stuff keywords.
- Canonical: absolute, https, no trailing slash mismatch, matches the served URL.
- `hreflang` pair: `en` ↔ `ar` for the same city.
- JSON-LD: `WebPage` + `BreadcrumbList`. Keep `@id`s deterministic so re-running
  `inject-schema.js` produces a stable diff.
- OG and Twitter: branded image, locale-aware title, no truncation.

WORK — internal linking
- Country page → its cities (grid).
- City page → its country, two sibling cities, the tracker, the calculator, methodology.
- Tracker, calculator, methodology pages → at least one country and one city.
- No orphaned pages — every country/city HTML is reachable in ≤ 2 clicks from the homepage.

WORK — generators
- If you change page substance, change the generator first, then regenerate.
- If you regenerate, commit the generator change and the generated diff in the same commit
  with a clear message ("regenerate countries/* after generator change").
- Run `node scripts/node/inject-schema.js --check` before commit; it must report 0 changes.

CONSTRAINTS
- Never rename the `countries/**/gold-prices/` path segment.
- Never blanket-rewrite SEO topic phrases ("Gold Prices in <City>", "Gold Prices Today").
- Bilingual EN + AR for every visible string.
- Do not edit a country/city HTML file by hand if a generator emits it.
- Do not change `STALE_AFTER_MS` to make every page show "live".

VERIFY
- `npm run validate`, `npm run seo-audit`, `node scripts/node/check-sitemap-coverage.js`,
  `npm test`, `npm run build`.
- `node scripts/node/inject-schema.js --check` → 0 modifications expected.
- Manual: pick 3 cities, verify EN + AR, breadcrumbs, internal links, freshness pill,
  canonical, hreflang, JSON-LD.

DELIVERABLE
PR with focused commits: generator change, regenerated HTML, schema, sitemap, breadcrumbs,
translations. Update `docs/SEO_STRATEGY.md` if you changed a pattern.
```

**Files / surfaces to inspect:**

- `countries/**/gold-prices/index.html` (sample), city subpages.
- `scripts/node/enrich-placeholder-pages.js`, `scripts/node/generate-placeholders.js`.
- `scripts/node/inject-schema.js`, `scripts/node/generate-sitemap.js`,
  `scripts/node/check-sitemap-coverage.js`, `scripts/node/check-seo-meta.js`.
- `src/seo/seoHead.js`, `src/seo/metadataGenerator.js`.
- `src/components/breadcrumbs.js`, `src/components/internalLinks.js`.
- `sitemap.xml`, `robots.txt`.

**Required checks:**

- `npm run validate`, `npm run seo-audit`, `npm test`, `npm run build`.
- `node scripts/node/inject-schema.js --check` (idempotency gate).
- `node scripts/node/check-sitemap-coverage.js` (no orphans, no stale entries).
- `npm run check-links` (verify no broken internal anchors).

**Expected final report:**

- Country/city pages touched (count + list).
- Generator changes vs. regenerated output diff stats.
- SEO surface deltas (titles, descriptions, canonicals, hreflang, JSON-LD counts).
- Sitemap coverage delta.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- `countries/**/gold-prices/` is an SEO carve-out — see [§50](#50-safety-rules-and-carve-outs).
- `inject-schema.js` is idempotent as of Round 16 but mtime-driven dates can drift; re-run with
  `--check` and commit only deterministic diffs.

**Failure modes to watch for:**

- Agent edits a country/city HTML by hand without updating the generator.
- Agent renames `gold-prices` to `prices` to "clean up the URL" — breaks SEO indexing.
- Agent stuffs keywords into the description ("Gold Prices Gold Prices Today Gold").
- Agent writes city intros that are obvious template variants of each other.
- Agent forgets the AR translation; `hreflang` then points at a half-translated page.
- Agent breaks JSON-LD `@id` determinism and `inject-schema.js` produces churn.

**Cross-references:**

- → [§10 SEO and Indexing Prompt](#10-seo-and-indexing-prompt)
- → [§17 Rebrand Maintenance Prompt](#17-rebrand-maintenance-prompt)
- →
  [§18 Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt)
- → [§31 Footer, Internal Links & Breadcrumbs](#31-footer-internal-links--breadcrumbs)

---

## 23. Content Guide Library

**Purpose:** Long-form guides under `content/guides/` and `content/learn/` build topical authority
and serve users who want to understand gold pricing rather than just look at a number. This prompt
keeps the guide library coherent, well-linked, and bilingual without devolving into SEO spam.

**When to use:**

- Adding a new guide ("How Gold Prices Work", "Why UAE Gold Prices Differ", karat primers, zakat /
  investment / Eid-buying guides).
- Auditing existing guides for stale numbers, broken links, weak intros, or missing AR.
- Internal-linking guides into country, city, calculator, and tracker pages.

**Copy-paste prompt:**

```text
You are upgrading the long-form guide library on Gold Ticker Live. Guides live under
`content/guides/` and `content/learn/`. They build topical authority and answer real user
questions — they are not SEO filler. Preserve the topic phrases "How Gold Prices Work",
"Why UAE Gold Prices Differ" and similar (SEO carve-outs, see §50).

INSPECT FIRST
1. List `content/guides/` and `content/learn/` directories. Read 3–5 representative guides
   end-to-end (the most-trafficked or most-recent first).
2. Read `src/config/translations.js` `guide.*`, `learn.*`, `seo.*`.
3. Read `src/seo/seoHead.js` to understand how guide metadata is computed.
4. Read `src/components/internalLinks.js` and `src/components/breadcrumbs.js`.
5. Read `scripts/node/inject-schema.js` (Article schema dates come from mtime; commit clean).

WORK — guide quality
- Every guide opens with a 2–3 sentence answer. Do not hide the answer below 800 words of
  preamble. Google's "answer first" rule applies.
- Every numeric example uses live or recent values (e.g. "at 3.6725 AED/USD") and includes
  a "values shown for illustration only" disclaimer.
- Every guide ends with two internal links: one to a country/city page, one to the tracker
  or calculator.
- Bilingual EN + AR. AR is idiomatic, not literal — see §12.

WORK — schema + metadata
- Article schema with author, datePublished, dateModified (mtime), mainEntityOfPage.
- Title: descriptive, ~60 chars, contains the topic phrase exactly once.
- Description: ~155 chars, summary of the answer, not a teaser.
- Canonical absolute https.
- Breadcrumbs: Home → Guides → <Guide title>.

WORK — internal linking
- Add the guide to the guides index.
- Add a "Related guides" block at the end of each guide (3 siblings).
- Link from country and city pages where relevant.

CONSTRAINTS
- No fake stats, no invented expert quotes, no "studies show" without a source.
- Bilingual.
- Do not change SEO topic phrases.
- Do not edit a guide HTML by hand if a generator emits it (very few guides are generated;
  most are authored).

VERIFY
- `npm run validate`, `npm run seo-audit`, `npm run check-links`, `npm test`, `npm run build`.
- `node scripts/node/inject-schema.js --check` after edits.

DELIVERABLE
PR with focused commits: content, schema, internal links, translations. Update guides index.
```

**Files / surfaces to inspect:**

- `content/guides/**/*.html`, `content/learn/**/*.html`, guide indexes.
- `src/config/translations.js` (`guide.*`, `learn.*`).
- `src/seo/seoHead.js`, `src/components/breadcrumbs.js`, `src/components/internalLinks.js`.

**Required checks:**

- `npm run validate`, `npm run seo-audit`, `npm run check-links`, `npm test`, `npm run build`.
- `node scripts/node/inject-schema.js --check`.

**Expected final report:**

- Guides added / edited (with word-count deltas).
- AR translation status per guide.
- Internal links added (count + targets).
- Schema and metadata deltas.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- SEO topic phrases are carve-outs. See [§50](#50-safety-rules-and-carve-outs).
- "values shown for illustration only" disclaimer is mandatory in any guide that uses a numeric
  example — preserves trust during stale-data periods.

**Failure modes to watch for:**

- Agent invents statistics or expert quotes ("according to Reuters…").
- Agent buries the answer behind a 600-word intro ("Gold has been valuable since…").
- Agent hardcodes a price in the body without the disclaimer.
- Agent ships English-only and adds a half-translated AR file.
- Agent forgets to update the guides index.

**Cross-references:**

- → [§10 SEO and Indexing Prompt](#10-seo-and-indexing-prompt)
- → [§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
- → [§24 FAQ + Structured Data](#24-faq--structured-data)
- → [§43 RSS Feed & News](#43-rss-feed--news)

---

## 24. FAQ + Structured Data

**Purpose:** FAQ blocks and FAQPage JSON-LD give Google rich-result eligibility and answer common
user questions inline. This prompt makes the FAQ honest, bilingual, schema-compliant, and free of
marketing fluff.

**When to use:**

- Adding or auditing FAQ blocks on the homepage, methodology, calculator, country/city, or guide
  pages.
- A schema audit reveals invalid FAQPage JSON-LD or duplicate questions across pages.
- A user-reported question deserves a permanent answer.

**Copy-paste prompt:**

```text
You are upgrading FAQ content and FAQPage JSON-LD on Gold Ticker Live. Honest, useful
answers — no marketing. Schema must validate. Bilingual EN + AR.

INSPECT FIRST
1. Find existing FAQ blocks: `rg -n 'class="faq"' index.html tracker.html calculator.html
   methodology.html shops.html invest.html content/ countries/`.
2. Read `scripts/node/inject-schema.js` for FAQPage emission patterns.
3. Read translations `faq.*` in `src/config/translations.js`.
4. Note which questions are duplicated across pages (Google penalizes duplicate FAQ schema).

WORK — content
- Answers are concrete, ≤ 80 words, and reference the actual product behavior (e.g.
  "Prices update every 90 seconds; see methodology for the source.").
- No "best price guaranteed" or "trusted by millions" claims.
- Bilingual; AR is idiomatic.

WORK — schema
- Each page emits FAQPage only for the FAQ that is uniquely on that page.
- No two pages emit the same Question text in FAQPage JSON-LD.
- `acceptedAnswer.text` matches the rendered HTML answer (Google validates).

WORK — accessibility
- Use `<details>` / `<summary>` or an ARIA disclosure pattern. Tap target ≥ 44 px.
- Each question is a heading-level element (`h3` typically) so screen readers can list them.

CONSTRAINTS
- Don't duplicate FAQs across pages.
- Bilingual.
- Don't invent answers — if the answer is unknown, omit the question.
- Don't add a question that the methodology doc contradicts.

VERIFY
- `npm run validate`, `npm run seo-audit`, `node scripts/node/inject-schema.js --check`.
- Validate JSON-LD with a schema validator (Rich Results test) — manual.
- `npm test`, `npm run build`.

DELIVERABLE
PR with focused commits: content, schema, translations, accessibility.
```

**Files / surfaces to inspect:**

- `index.html`, `tracker.html`, `calculator.html`, `methodology.html`, `shops.html`, `invest.html`,
  `content/**/*.html`, `countries/**/*.html`.
- `scripts/node/inject-schema.js` (FAQPage emission).
- `src/config/translations.js` (`faq.*`).

**Required checks:**

- `npm run validate`, `npm run seo-audit`, `node scripts/node/inject-schema.js --check`, `npm test`,
  `npm run build`.

**Expected final report:**

- FAQs added / edited per page.
- Duplicate-question count before / after.
- Schema validation status.
- AR coverage.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- FAQPage JSON-LD that contradicts the methodology page is a trust violation and a Google
  rich-results disqualifier.

**Failure modes to watch for:**

- Same question copy-pasted on 3 pages with 3 different answers.
- Marketing-speak answers ("we offer the best…").
- Schema `acceptedAnswer.text` and rendered HTML drift.
- AR translations are literal English ("ما هو أفضل سعر؟" for "What is the best price?").
- `<details>` without a tap-target-friendly summary.

**Cross-references:**

- → [§10 SEO and Indexing Prompt](#10-seo-and-indexing-prompt)
- → [§15 Data Reliability and Methodology Prompt](#15-data-reliability-and-methodology-prompt)
- → [§23 Content Guide Library](#23-content-guide-library)
- → [§31 Footer, Internal Links & Breadcrumbs](#31-footer-internal-links--breadcrumbs)

---

## 25. Site Search

**Purpose:** On-site search helps users navigate the country/city/guide/tracker matrix. Gold Ticker
Live keeps it lightweight (no Algolia, no Elasticsearch) — a prebuilt index plus a small client.
This prompt keeps the index fresh, the UI accessible, and the result ranking reasonable.

**When to use:**

- Adding new country/city/guide pages (the index needs to include them).
- Search returns nothing for obvious queries ("dubai", "22k", "calculator").
- Search UI has a11y issues (no aria-live, no keyboard nav, no escape-to-close).

**Copy-paste prompt:**

```text
You are upgrading the on-site search on Gold Ticker Live. Lightweight, fast, bilingual,
keyboard-friendly. No external search service.

INSPECT FIRST
1. Read `src/lib/search.js` and `src/search/**` — the index builder and the runtime client.
2. Read translations `search.*`.
3. Find the index artifact (a JSON file under `assets/` or `dist/` — verify path).
4. Read the search UI: input, results dropdown, empty state, result-card pattern.

WORK — index
- Index titles, descriptions, and key headings from country/city/guide pages and the static
  pages (tracker, calculator, methodology, shops, learn, insights).
- AR titles indexed alongside EN titles. Search "دبي" returns Dubai pages.
- Index regenerates as a build step (or via a script — verify exists).

WORK — UI
- Input has a clear label and `aria-controls` pointing at the results region.
- Results region has `role="listbox"` and `aria-live="polite"`.
- ArrowDown/Up navigates results, Enter activates, Escape closes.
- Empty state uses the typed query: "No results for 'X' — try …".

WORK — ranking
- Title matches outrank description matches.
- Country/city pages outrank generic guides for city queries.
- Tracker / calculator outrank country pages for tool queries.

CONSTRAINTS
- No external search service.
- Bilingual.
- Index size stays reasonable (< ~500 KB gzipped). Trim if needed.

VERIFY
- `npm run validate`, `npm test`, `npm run build`.
- Manual: search 5 queries (city, country, karat, tool, AR) and verify ranking.

DELIVERABLE
PR with focused commits: index builder, runtime client, UI, translations, tests.
```

**Files / surfaces to inspect:**

- `src/lib/search.js`, `src/search/**`.
- `src/config/translations.js` (`search.*`).
- The committed index artifact (verify path).

**Required checks:**

- `npm run validate`, `npm test`, `npm run build`.
- Manual queries: city, country, karat, tool, AR.

**Expected final report:**

- Index size delta.
- Pages included / excluded.
- a11y verification.
- Ranking sanity check (5 queries).
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Don't add an external service — see lightweight-posture carve-out in
  [§50](#50-safety-rules-and-carve-outs).
- Search index can leak draft pages — exclude `admin/`, `_drafts/`, anything under `private/`.

**Failure modes to watch for:**

- Index includes admin pages.
- AR titles missing from the index.
- Results dropdown traps focus on Escape.
- Ranking puts methodology above the tracker for the query "tracker".
- Index regen forgotten after adding new pages — search returns "no results".

**Cross-references:**

- → [§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
- → [§31 Footer, Internal Links & Breadcrumbs](#31-footer-internal-links--breadcrumbs)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)

---

## 26. Admin Panel UX

**Purpose:** The `admin/` panel manages content (pending shops, settings, etc.) and is gated by
Supabase GitHub OAuth. It's not user-facing but it is operator-facing — broken admin = broken ops.
This prompt keeps the admin panel functional, secure-by-default, and excluded from public indexing.

**When to use:**

- Admin login flow, pending-shops review, or settings editor is broken or confusing.
- A new admin tool needs to be added.
- Security review (RLS, auth, exclusion from sitemap/SW) is due.

**Copy-paste prompt:**

```text
You are upgrading the admin panel on Gold Ticker Live. Operator-facing, Supabase-OAuth-gated,
not in the public sitemap, not in the service-worker scope.

INSPECT FIRST
1. Read `admin/**/*.html` and any `admin/*.js` modules.
2. Read `server/lib/auth.js`, `server/routes/admin/index.js`,
   `server/repositories/pending-shops.repository.js`,
   `server/routes/submissions.js`.
3. Confirm `data/pending_shops.json` is the source of truth (atomicWriteJSON).
4. Read `docs/ADMIN_SETUP.md` and `docs/SUPABASE_SETUP.md`.
5. Read `tests/sw-exclusions.test.js` — `/admin/*` and `/api/*` must be SW-excluded.
6. Confirm `robots.txt` has `Disallow: /admin/` and `Disallow: /api/`.

WORK — UX
- Login screen explains what the admin can do, who to contact for access.
- Pending-shops list: each entry shows the submitter, timestamp, location, evidence;
  approve/reject is one click with a confirmation.
- Settings editor: every field has a label and a description; destructive actions confirm.
- Admin nav is distinct from public nav (different bg, "ADMIN" label).

WORK — security
- All admin routes require auth; auth check is centralized.
- JWT secret + admin password + access PIN env vars are validated at server boot
  (see `server/lib/auth.js`).
- RLS on Supabase tables enforces "admin can read all, public can read public".
- Admin pages have `<meta name="robots" content="noindex,nofollow">`.

CONSTRAINTS
- `/admin/*` excluded from sitemap, SW, public search.
- Don't expose secrets in client-side JS.
- Don't widen RLS. Don't disable auth "for testing".

VERIFY
- `npm run validate`, `npm test` (sw-exclusions, repositories tests),
  `npm run lint`, `npm run build`.
- Manual: login as admin, approve a test submission, log out.

DELIVERABLE
PR with focused commits: UI, server routes, auth, RLS, docs.
```

**Files / surfaces to inspect:**

- `admin/**`.
- `server/lib/auth.js`, `server/routes/admin/index.js`,
  `server/repositories/pending-shops.repository.js`, `server/routes/submissions.js`.
- `docs/ADMIN_SETUP.md`, `docs/ADMIN_GUIDE.md`, `docs/SUPABASE_SETUP.md`, `docs/SUPABASE_SCHEMA.md`.
- `tests/sw-exclusions.test.js`, `tests/repositories.test.js`.
- `robots.txt`.

**Required checks:**

- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual auth flow, manual approve/reject flow.

**Expected final report:**

- Admin surfaces touched.
- Auth path verified.
- SW + sitemap + robots exclusion confirmed.
- RLS state described.
- Manual follow-up (Supabase RLS / OAuth) flagged per
  [§52](#52-manual-follow-up-reporting-expectations).
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Auth env vars (`JWT_SECRET`, `ADMIN_PASSWORD`, `ADMIN_ACCESS_PIN`) must be present at boot — see
  `server/lib/auth.js`. Don't ship code that throws on missing vars without docs updates.
- Supabase RLS changes are manual follow-up — see
  [§52](#52-manual-follow-up-reporting-expectations).

**Failure modes to watch for:**

- Admin page accidentally indexed (missing `noindex`, present in sitemap).
- Admin route added without auth middleware.
- Secret echoed in workflow logs or client JS.
- SW caches `/admin/*` and serves stale auth pages.
- `data/pending_shops.json` written non-atomically and corrupted on concurrent writes.

**Cross-references:**

- → [§37 GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening)
- → [§44 Supabase Data Sync](#44-supabase-data-sync)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§52 Manual Follow-Up Reporting Expectations](#52-manual-follow-up-reporting-expectations)

---

## 27. Newsletter & Alert System

**Purpose:** Newsletter and price-spike alert systems are growth + retention surfaces. They run from
GitHub Actions cron jobs, hit a JSON subscriber list, and post via email / Discord / Telegram. This
prompt keeps them reliable, double-opt-in safe, and unsubscribe-honest.

**When to use:**

- Subscriber flow is broken or confusing on the public form.
- Newsletter generator emits stale/duplicate content.
- Spike-alert thresholds need tuning (do not change without owner approval).
- A new alert channel (email / Discord / Telegram) is being added.

**Copy-paste prompt:**

```text
You are upgrading the newsletter and alert system on Gold Ticker Live. Cron-driven,
JSON-list-backed, multi-channel. Double-opt-in honest. Unsubscribe always works.

INSPECT FIRST
1. Read `scripts/node/generate-newsletter.js` and `scripts/node/send-newsletter.js`.
2. Read `scripts/node/price-spike-alert.js`, `scripts/node/notify-discord.js`,
   `scripts/node/notify-telegram.js`.
3. Read the relevant workflows in `.github/workflows/` (newsletter, alerts).
4. Read the public subscribe form (likely `content/newsletter/`, `content/submit-*`).
5. Read translations `newsletter.*`, `alerts.*` in `src/config/translations.js`.

WORK — subscribe flow
- Form clearly states: what you'll get, how often, how to unsubscribe.
- Double-opt-in: confirmation email/link before adding to the list.
- Unsubscribe link in every newsletter; one-click works without login.

WORK — generator
- Newsletter content includes: live price snapshot (with timestamp + source label),
  one guide link, one tracker link. No invented news.
- AR newsletter is a separate generator path, not a Google-translated EN.

WORK — alerts
- Spike threshold lives in a config (verify path); do not change without owner approval.
- Discord/Telegram payloads include source + timestamp.
- Rate-limit per channel — never more than 1 alert per 15 min.

CONSTRAINTS
- Don't store secrets in repo; use GitHub Secrets.
- Don't mass-email; respect rate limits.
- Don't change spike thresholds without owner approval.
- Bilingual.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual: run the newsletter generator with `--dry-run` (verify exists) and inspect output.

DELIVERABLE
PR with focused commits: subscribe form, generator, send pipeline, alerts, translations.
```

**Files / surfaces to inspect:**

- `scripts/node/generate-newsletter.js`, `scripts/node/send-newsletter.js`,
  `scripts/node/price-spike-alert.js`, `scripts/node/notify-discord.js`,
  `scripts/node/notify-telegram.js`.
- `.github/workflows/*newsletter*.yml`, `.github/workflows/*alert*.yml` (verify exists).
- Subscribe form HTML (`content/newsletter/` or similar — verify path).
- `src/config/translations.js` (`newsletter.*`, `alerts.*`).

**Required checks:**

- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Dry-run generator if supported.

**Expected final report:**

- Subscribe flow status (double-opt-in, unsubscribe).
- Generator output sample (EN + AR).
- Alert channels verified.
- Manual follow-up: GitHub Secrets / Discord webhook / Telegram bot tokens — see
  [§52](#52-manual-follow-up-reporting-expectations).
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Subscriber list is sensitive; treat the file like PII. Don't log emails.
- Spike thresholds are owner-tunable carve-outs — see [§50](#50-safety-rules-and-carve-outs).

**Failure modes to watch for:**

- Single-opt-in (privacy + spam risk).
- Unsubscribe link 404s or requires login.
- AR newsletter is a literal translation of EN.
- Discord webhook posted in workflow logs.
- Spike alert fires every minute due to a missing rate limit.
- Subscriber list committed to git.

**Cross-references:**

- → [§28 X/Twitter Automation Polish](#28-xtwitter-automation-polish)
- → [§37 GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening)
- → [§43 RSS Feed & News](#43-rss-feed--news)
- → [§52 Manual Follow-Up Reporting Expectations](#52-manual-follow-up-reporting-expectations)

---

## 28. X/Twitter Automation Polish

**Purpose:** The hourly X-post workflow (`.github/workflows/post_gold.yml`) is live in production
and auto-posts gold prices every hour to `@GoldTickerLive`. It must never break the
`scripts/python/utils/*` import path or the cron cadence without owner approval.

**When to use:**

- Tweet template needs polish (wording, AR variant, hashtags).
- Workflow logs show failures (rate limit, auth, format).
- A new X-post variant (e.g. spike alerts on X) is being added.

**Copy-paste prompt:**

```text
You are polishing the X/Twitter automation on Gold Ticker Live. The hourly workflow
`.github/workflows/post_gold.yml` is LIVE IN PRODUCTION. Breakage is public within the hour.

INSPECT FIRST
1. Read `.github/workflows/post_gold.yml` end-to-end. Confirm cron cadence and secrets list.
2. Read `scripts/python/**` — note the entrypoint that adds `scripts/python/` to `sys.path`
   and relative-imports `utils.*` via that path.
3. Read `scripts/node/tweet-gold-price.js` (verify exists).
4. Read `src/social/postTemplates.js` (post templates EN + AR).
5. Read `docs/twitter_bot_architecture.md` and `docs/AUTOMATIONS.md`.

WORK — templates
- EN and AR variants. AR is idiomatic, not literal.
- Each post includes: live price (AED + USD), karat (24K), source label, timestamp.
- Hashtags: minimal, on-topic (`#GoldPrice`, `#UAE`, `#Gold`); no spam.
- 280-char limit honored (URL counts).

WORK — workflow
- Pinned action SHAs (see `.github/workflows/README.md` table).
- Secrets via GitHub Secrets only; never echoed.
- Failure path posts to monitoring (Discord/Telegram) so silent breakage gets surfaced.

CONSTRAINTS
- Do not change cron cadence without owner approval.
- Do not break `scripts/python/utils/*` import layout.
- `@GoldTickerLive` handle is intact (identity carve-out).
- No marketing fluff in the post template.

VERIFY
- `npm run lint`, `npm test`, `npm run build`.
- Workflow lint: `actionlint .github/workflows/post_gold.yml` (verify installed).
- Dry-run the post script if supported.

DELIVERABLE
PR with focused commits: template, workflow, secrets handling, docs.
```

**Files / surfaces to inspect:**

- `.github/workflows/post_gold.yml`, `.github/workflows/README.md`.
- `scripts/python/**`, `scripts/node/tweet-gold-price.js` (verify exists).
- `src/social/postTemplates.js`.
- `docs/twitter_bot_architecture.md`, `docs/AUTOMATIONS.md`.

**Required checks:**

- `npm run lint`, `npm test`, `npm run build`.
- `actionlint` (verify installed).

**Expected final report:**

- Template diff (EN + AR).
- Workflow diff (cron, permissions, secrets, action SHAs).
- Dry-run output.
- Manual follow-up: X API tokens, monitoring channels — see
  [§52](#52-manual-follow-up-reporting-expectations).
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Cron cadence + python import layout + `@GoldTickerLive` handle are carve-outs — see
  [§50](#50-safety-rules-and-carve-outs).
- Production workflow: any error is public within an hour.

**Failure modes to watch for:**

- Agent renames a `scripts/python/utils/` module and breaks the import path.
- Agent prints the API token via `echo` in a workflow `run:` step.
- AR template is an autotranslated EN — reads weird.
- Cron changed from hourly to every-15-min "for visibility" — rate-limited fast.
- Action `uses:` reverts to a tag instead of a pinned SHA.

**Cross-references:**

- → [§27 Newsletter & Alert System](#27-newsletter--alert-system)
- → [§37 GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§52 Manual Follow-Up Reporting Expectations](#52-manual-follow-up-reporting-expectations)

---

## 29. Pricing & Invest Pages

**Purpose:** `pricing.html` and `invest.html` are conversion-leaning pages — they explain costs,
investment context, and what a buyer should think about. They must not become hype-y or make
investment guarantees. This prompt keeps them honest, useful, and bilingual.

**When to use:**

- Pricing page is unclear, cluttered, or missing the spot-vs-retail explanation.
- Invest page makes claims that could be read as financial advice.
- Either page lacks AR or has weak structured data.

**Copy-paste prompt:**

```text
You are upgrading `pricing.html` and `invest.html` on Gold Ticker Live. Honest, useful,
bilingual. No hype, no guarantees, no "best investment" claims.

INSPECT FIRST
1. Read `pricing.html` and `invest.html` end-to-end.
2. Read `styles/pages/pricing.css` and `styles/pages/invest.css`.
3. Read translations `pricing.*`, `invest.*`.
4. Read `docs/methodology.md` and `docs/LIMITATIONS.md`.

WORK — pricing
- Explain spot vs retail vs jeweler vs making charge in plain language with an example.
- Show the AED peg and the troy-ounce constant with the formula:
  `price_per_gram = (XAU/USD ÷ 31.1035) × purity × 3.6725`.
- Link to the calculator and methodology.

WORK — invest
- Plain-language pros/cons of physical, ETF, futures.
- Disclaimer: "Educational only — not financial advice." Bilingual.
- No "guaranteed returns", no "best time to buy" claims.

WORK — schema + SEO
- Title + description per [§10](#10-seo-and-indexing-prompt).
- WebPage + (optionally) Article schema; FAQPage if there is a unique FAQ.

CONSTRAINTS
- Do not change pricing math or peg.
- Bilingual.
- No financial-advice wording.
- "Educational only" disclaimer present and visible.

VERIFY
- `npm run validate`, `npm run seo-audit`, `npm test`, `npm run build`.

DELIVERABLE
PR with focused commits: content, schema, translations, layout.
```

**Files / surfaces to inspect:**

- `pricing.html`, `invest.html`.
- `styles/pages/pricing.css`, `styles/pages/invest.css`.
- `src/config/translations.js` (`pricing.*`, `invest.*`).
- `docs/methodology.md`, `docs/LIMITATIONS.md`.

**Required checks:**

- `npm run validate`, `npm run seo-audit`, `npm test`, `npm run build`.

**Expected final report:**

- Content diffs.
- Disclaimer presence.
- Schema/SEO status.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Financial-advice wording is a legal + trust risk; "educational only" disclaimer is mandatory.
- Pricing math, peg, troy-ounce constant are immutable — see [§50](#50-safety-rules-and-carve-outs).

**Failure modes to watch for:**

- "Best investment of 2026" hero copy.
- Disclaimer hidden in the footer in 10 px gray.
- AR page is a Google translation.
- Pricing example uses a stale hardcoded AED peg.
- Schema duplicated from another page.

**Cross-references:**

- → [§14 Calculator and Tools Prompt](#14-calculator-and-tools-prompt)
- → [§15 Data Reliability and Methodology Prompt](#15-data-reliability-and-methodology-prompt)
- → [§48 Monetization and Growth](#48-monetization-and-growth)

---

## 30. Chart Component

**Purpose:** `src/components/chart.js` lazy-loads TradingView Lightweight Charts from a jsDelivr CDN
and renders the historical price chart on the tracker. This prompt keeps it lightweight, accessible,
and resilient when the CDN is slow or unreachable.

**When to use:**

- Chart fails to render or shows broken state on slow networks.
- Range pills (24H–ALL) lose `aria-pressed` sync.
- Chart needs a new range, new overlay, or improved fallback.

**Copy-paste prompt:**

```text
You are upgrading the chart component on Gold Ticker Live. Lazy CDN-loaded TradingView
Lightweight Charts. Accessible, resilient, no heavy bundle.

INSPECT FIRST
1. Read `src/components/chart.js` (CDN +esm import).
2. Read `src/pages/tracker-chart-loader.js` (lazy install path).
3. Read `src/tracker/events.js` and `src/pages/tracker-pro.js` for range pills,
   `aria-pressed` sync, persisted state.
4. Read `src/lib/historical-data.js` (data source for the chart).
5. Read translations `tracker.range.*`, `tracker.chart.*`.

WORK — render
- Range pills (24H, 7D, 30D, 1Y, ALL) have `aria-pressed`, persisted to user_prefs.
- Container has `role="group"` and `aria-label="Chart time range"`.
- Reduced-motion users get a non-animated chart (or static SVG fallback).

WORK — resilience
- CDN failure shows a clear message ("Chart unavailable — try again later") + retry.
- Empty data shows "No data for this range" not a blank canvas.
- Chart never blocks above-the-fold render — lazy install only after intersection.

WORK — accessibility
- Chart has a textual data table fallback for screen readers.
- Range pills have ≥ 44 px tap targets.
- No keyboard trap inside the chart canvas.

CONSTRAINTS
- No heavy charting dependency added to the bundle (lightweight posture).
- Don't ship a non-CDN copy of TradingView (license + size).
- Bilingual.

VERIFY
- `npm run validate`, `npm test`, `npm run build`, `npm run a11y`.
- Manual: throttle CDN, verify fallback. Reduced-motion on.

DELIVERABLE
PR with focused commits: chart, range pills, fallback, accessibility, translations.
```

**Files / surfaces to inspect:**

- `src/components/chart.js`, `src/pages/tracker-chart-loader.js`.
- `src/tracker/events.js`, `src/pages/tracker-pro.js`.
- `src/lib/historical-data.js`.
- `src/config/translations.js` (`tracker.range.*`, `tracker.chart.*`).

**Required checks:**

- `npm run validate`, `npm test`, `npm run build`, `npm run a11y`.

**Expected final report:**

- Chart load behavior (cold / warm / CDN fail).
- a11y verification (range pills, fallback table, reduced-motion).
- Bundle size delta.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- CDN dependency is a known carve-out for chart only; do not extend it elsewhere.

**Failure modes to watch for:**

- CDN fail = silent blank canvas.
- `aria-pressed` desync between click handler and persisted state.
- Reduced-motion users get an animated chart anyway.
- Chart canvas traps tab focus.
- No data table fallback for screen readers.

**Cross-references:**

- → [§9 Live Tracker Upgrade Prompt](#9-live-tracker-upgrade-prompt)
- → [§11 PWA / Service Worker / Performance Prompt](#11-pwa--service-worker--performance-prompt)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)

---

## 31. Footer, Internal Links & Breadcrumbs

**Purpose:** The footer, internal-links block, and breadcrumbs are the connective tissue of the
site. They drive SEO link equity, help users discover related content, and anchor every page in the
site hierarchy. This prompt keeps them consistent, deduplicated, and accessible.

**When to use:**

- Footer link groups are inconsistent across pages.
- Internal-links block on country/city/guide pages is missing or one-directional.
- Breadcrumbs don't match canonical URL structure.

**Copy-paste prompt:**

```text
You are upgrading the footer, internal links, and breadcrumbs across Gold Ticker Live.
Consistency, accessibility, SEO link equity.

INSPECT FIRST
1. Read `src/components/footer.js`, `src/components/internalLinks.js`,
   `src/components/breadcrumbs.js`.
2. Read `src/config/translations.js` `footer.*`, `breadcrumbs.*`, `internalLinks.*`.
3. Sample 5 page types: home, tracker, calculator, country, city, guide. Verify the
   footer is identical (rendered from the component, not duplicated HTML).
4. Read `scripts/node/inject-schema.js` for BreadcrumbList JSON-LD emission.

WORK — footer
- Single source: one component, used by every page.
- Groups: Product, Markets, Tools, Legal — each ≤ 6 links.
- Lang switcher present, theme switcher optional; both have visible labels and aria-labels.
- Bottom row: brand mark, copyright, methodology link, privacy link.

WORK — internal links
- Country page: links to its cities + sibling countries + tracker + calculator.
- City page: links to its country + 2 sibling cities + tracker + calculator + methodology.
- Guide: links to 3 related guides + 1 country/city + tracker.
- Tracker / calculator / methodology: link to at least one country and one city.

WORK — breadcrumbs
- Render `BreadcrumbList` JSON-LD per [§24](#24-faq--structured-data).
- Visible breadcrumb component matches JSON-LD exactly.
- ARIA: `nav[aria-label="Breadcrumb"]` with ordered list semantics.

CONSTRAINTS
- One footer component, no duplicates.
- Bilingual.
- Don't break canonical URL structure.

VERIFY
- `npm run validate`, `npm run seo-audit`, `npm run check-links`, `npm test`, `npm run build`.
- `node scripts/node/inject-schema.js --check`.

DELIVERABLE
PR with focused commits: footer, internal links, breadcrumbs, translations, schema.
```

**Files / surfaces to inspect:**

- `src/components/footer.js`, `src/components/internalLinks.js`, `src/components/breadcrumbs.js`.
- `src/config/translations.js` (`footer.*`, `breadcrumbs.*`, `internalLinks.*`).
- `scripts/node/inject-schema.js` (BreadcrumbList).

**Required checks:**

- `npm run validate`, `npm run seo-audit`, `npm run check-links`, `npm test`, `npm run build`.
- `node scripts/node/inject-schema.js --check`.

**Expected final report:**

- Footer rendered from one component (verified).
- Internal-links matrix (page type → outbound count).
- Breadcrumb a11y verified.
- Sitemap / link audit deltas.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Don't change canonical URL structure — see [§50](#50-safety-rules-and-carve-outs).

**Failure modes to watch for:**

- Footer hand-edited on one page, drifted from the component.
- Breadcrumb visible text and JSON-LD disagree.
- Internal-links block linked to a 404 city.
- Lang switcher in footer has no aria-label.
- Privacy link missing or 404.

**Cross-references:**

- → [§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
- → [§24 FAQ + Structured Data](#24-faq--structured-data)
- → [§32 Compare Countries & Today's Best Rates](#32-compare-countries--todays-best-rates)

---

## 32. Compare Countries & Today's Best Rates

**Purpose:** The compare-countries and today's-best-rates pages turn the country/city corpus into a
decision tool. They're high-engagement, high-bounce-risk pages — they must load fast, sort sensibly,
and label freshness honestly.

**When to use:**

- Compare table is slow, broken, or sorts incorrectly.
- "Best rates" page mixes stale and live data without labels.
- A new comparison axis (e.g. 22K specifically) is being added.

**Copy-paste prompt:**

```text
You are upgrading the compare-countries and today's-best-rates pages. Decision tools,
honest about freshness.

INSPECT FIRST
1. Find the pages: `content/compare-countries/`, `content/todays-best-rates/`
   (verify paths). Read their HTML and any associated JS.
2. Read translations `compare.*`, `bestRates.*`.
3. Read `src/lib/api.js`, `src/lib/cache.js` to understand the data the comparison reads from.

WORK — UX
- Sortable columns (24K AED, 22K AED, freshness).
- Each row labels its freshness state (live/cached/stale/unavailable).
- Empty/error states ("Data unavailable for X") are clear, bilingual.
- Mobile: cards instead of a table at < 640 px.

WORK — performance
- Render only visible rows; lazy-load the rest.
- No layout shift after data hydrates.

WORK — schema
- ItemList JSON-LD with country names + URLs.

CONSTRAINTS
- Bilingual.
- Honest freshness — don't claim "live" if the row is cached.
- Don't change pricing math.

VERIFY
- `npm run validate`, `npm run seo-audit`, `npm test`, `npm run build`,
  `node scripts/node/inject-schema.js --check`.

DELIVERABLE
PR with focused commits: UX, perf, schema, translations.
```

**Files / surfaces to inspect:**

- `content/compare-countries/`, `content/todays-best-rates/` (verify paths).
- `src/lib/api.js`, `src/lib/cache.js`.
- `src/config/translations.js` (`compare.*`, `bestRates.*`).

**Required checks:**

- `npm run validate`, `npm run seo-audit`, `npm test`, `npm run build`,
  `node scripts/node/inject-schema.js --check`.

**Expected final report:**

- Sort behavior verified.
- Freshness labels per row.
- Mobile card view verified.
- Schema status.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Freshness honesty is a trust carve-out — see [§50](#50-safety-rules-and-carve-outs).

**Failure modes to watch for:**

- Table sorts on stale data without labeling it stale.
- Mobile renders a 7-col table that overflows.
- Layout shift when data arrives.
- ItemList schema duplicates BreadcrumbList.

**Cross-references:**

- → [§9 Live Tracker Upgrade Prompt](#9-live-tracker-upgrade-prompt)
- → [§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)

---

## 33. Social Sharing & Embed Widget

**Purpose:** Social-share buttons and an embed widget extend Gold Ticker Live beyond the site
itself. Shares need clean OG/Twitter cards; embeds need a tiny script that renders a live price
without taking down the host page. This prompt keeps both polished and safe.

**When to use:**

- Share buttons miss platforms or use stale OG data.
- Embed widget renders heavy or breaks the host page's CSP.
- A new share target (e.g. WhatsApp) is being added.

**Copy-paste prompt:**

```text
You are upgrading social sharing and the embed widget on Gold Ticker Live. Lightweight,
CSP-safe, branded.

INSPECT FIRST
1. Find share buttons: `rg -n 'share|twitter|whatsapp|facebook' src/pages/ src/components/`.
2. Find the embed widget: likely `content/embed/` or `src/components/embed.js`
   (verify path).
3. Read OG/Twitter card emission in `src/seo/seoHead.js`.
4. Read translations `share.*`, `embed.*`.

WORK — share
- Buttons: X/Twitter, WhatsApp, Telegram, Copy link.
- Each opens an `https://*` intent URL with a pre-filled message that includes price
  + AED/USD + source + canonical URL. Bilingual.
- Buttons have aria-labels.

WORK — OG/Twitter cards
- Branded OG image, locale-aware title, description ≤ 200 chars.
- Twitter `summary_large_image` card.
- Card emission consistent across pages.

WORK — embed
- Tiny script (≤ 5 KB gzipped) renders a price card on a host page.
- No external CSS imports — inline + scoped.
- Works under strict CSP (`script-src 'self' goldtickerlive.com`).
- Branded with a "Powered by Gold Ticker Live" link.

CONSTRAINTS
- No tracking pixels in the embed.
- Bilingual (host page lang detected or via attribute).

VERIFY
- `npm run validate`, `npm run seo-audit`, `npm test`, `npm run build`.
- Manual: paste embed snippet in a sandbox host; verify CSP behavior.

DELIVERABLE
PR with focused commits: share, OG/Twitter, embed, translations.
```

**Files / surfaces to inspect:**

- `src/components/embed.js` (verify path), `content/embed/` (verify path).
- `src/seo/seoHead.js`.
- `src/config/translations.js` (`share.*`, `embed.*`).

**Required checks:**

- `npm run validate`, `npm run seo-audit`, `npm test`, `npm run build`.

**Expected final report:**

- Share targets covered.
- OG/Twitter card sample verified.
- Embed bundle size + CSP behavior.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Lightweight posture — embed must not pull external CSS or trackers.

**Failure modes to watch for:**

- Embed pulls jQuery from CDN.
- Share message hardcodes a price (instantly stale).
- OG image 404s.
- WhatsApp share URL malformed.

**Cross-references:**

- → [§10 SEO and Indexing Prompt](#10-seo-and-indexing-prompt)
- → [§28 X/Twitter Automation Polish](#28-xtwitter-automation-polish)
- → [§31 Footer, Internal Links & Breadcrumbs](#31-footer-internal-links--breadcrumbs)

---

## 34. Submit Shop & Order Gold Flows

**Purpose:** The submit-shop form (public) and order-gold flow are user-facing entry points that
feed the admin panel and external partners. They must validate inputs, double-opt-in for contact,
and keep submission data behind atomic writes.

**When to use:**

- Submission form rejects valid inputs or accepts invalid ones.
- Pending shops queue grows but admin approve flow is broken.
- Order-gold flow needs polish or a partner-handoff change.

**Copy-paste prompt:**

```text
You are upgrading the submit-shop and order-gold flows on Gold Ticker Live. Public-facing,
atomic-write-backed, admin-reviewed.

INSPECT FIRST
1. Read the submit-shop form HTML and JS.
2. Read `server/routes/submissions.js` (`POST /api/submit-shop`).
3. Read `server/repositories/pending-shops.repository.js` (atomic writes to
   `data/pending_shops.json`).
4. Read `server/routes/admin/index.js` for the `/api/admin/pending-shops` review routes.
5. Read translations `submitShop.*`, `order.*`.

WORK — submit-shop
- Required fields: shop name, city, country, contact (email or phone). Optional: hours,
  evidence (photo URL).
- Client + server validation (length, email/phone shape, URL safety).
- Honeypot field for spam.
- Success page explains "we'll review and contact you" with bilingual messaging.

WORK — order-gold
- Clear "this is a referral, not a checkout" disclaimer.
- Partner handoff via an `https://` link with UTM params (track via analytics).
- Bilingual EN + AR.

WORK — admin review
- List view: submitter, timestamp, location, evidence link, approve/reject.
- Approve appends to `data/shops.json` (or the equivalent canonical store) with
  `normalize-shops.js` re-run.
- Reject removes from `pending_shops.json`.

CONSTRAINTS
- Atomic writes on the JSON store.
- Bilingual.
- Don't accept arbitrary URLs without safe-parse.

VERIFY
- `npm run validate`, `npm test` (`tests/repositories.test.js`, `tests/server*`),
  `npm run lint`, `npm run build`.
- Manual: submit a test shop end-to-end through admin.

DELIVERABLE
PR with focused commits: form, server routes, repository, admin UI, translations.
```

**Files / surfaces to inspect:**

- Submit-shop form HTML + JS (verify path, often `content/submit-shop/`).
- `server/routes/submissions.js`, `server/repositories/pending-shops.repository.js`,
  `server/routes/admin/index.js`.
- `data/pending_shops.json` (test fixture, never edit by hand).
- `src/config/translations.js` (`submitShop.*`, `order.*`).

**Required checks:**

- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Manual end-to-end submission + admin approval.

**Expected final report:**

- Validation matrix (client + server).
- Spam mitigation in place.
- Partner handoff verified.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Atomic writes on `data/pending_shops.json` are required to avoid corruption under concurrent
  submissions.
- Don't expose admin endpoints to public.

**Failure modes to watch for:**

- Server accepts a shop name with `<script>` tags (no escaping).
- Honeypot missing — pending list fills with spam.
- Approve button doesn't actually move the entry to `shops.json`.
- AR copy reads as a literal translation.
- Partner link opens in same tab without `rel="noopener"`.

**Cross-references:**

- → [§13 Shops Directory Prompt](#13-shops-directory-prompt)
- → [§26 Admin Panel UX](#26-admin-panel-ux)
- → [§44 Supabase Data Sync](#44-supabase-data-sync)

---

## 35. Dark Mode & Theme System

**Purpose:** Dark mode is a major preference signal in 2026 and a baseline expectation for a
data-display product. The theme system must respect OS preference, persist user choice, and not
flash light-mode on first paint.

**When to use:**

- Theme toggle is missing, broken, or out-of-sync with OS preference.
- FOUC (flash of unstyled content) on theme load.
- Color tokens don't have dark-mode equivalents.

**Copy-paste prompt:**

```text
You are upgrading the theme system on Gold Ticker Live. Three states: light, dark, system.
No FOUC, persisted, RTL-safe.

INSPECT FIRST
1. Read `styles/global.css` token definitions (`--surface-primary`, `--surface-secondary`,
   `--text-primary`, `--text-secondary`, `--border-subtle`, `--color-accent`, etc.).
2. Read `src/components/nav.js` `_cycleTheme()`, `_applyTheme()` (theme buttons in both
   desktop and drawer).
3. Look for an early inline theme-init script in `<head>` of every page (prevents FOUC).
4. Read translations `theme.*`.

WORK — system
- Three states: `light`, `dark`, `system`. Default = `system`.
- Persist to `user_prefs.theme` in localStorage.
- Inline `<script>` in `<head>` reads `localStorage` and OS preference, sets
  `data-theme` on `<html>` BEFORE first paint.
- Listen to OS theme-change events when in `system`.

WORK — tokens
- Every color used in CSS comes from a token. Light + dark variants of every token live
  in `styles/global.css`.
- Removed legacy `var(--color-surface, #fff)` fallbacks (Round 15).

WORK — toggle UI
- Desktop button cycles light → dark → system.
- Drawer button mirrored. Both update on `_applyTheme()`.
- Tap target ≥ 44 px. aria-label changes per state.

CONSTRAINTS
- No FOUC.
- All animations respect `prefers-reduced-motion: reduce`.
- Bilingual (theme labels in EN + AR).

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`, `npm run a11y`.
- Manual: cycle theme on home, tracker, calculator. Reload — no FOUC.

DELIVERABLE
PR with focused commits: tokens, init script, toggle, translations, tests.
```

**Files / surfaces to inspect:**

- `styles/global.css` (tokens), `styles/pages/*.css` (theme overrides).
- `src/components/nav.js` (`_cycleTheme`, `_applyTheme`).
- Inline theme-init script (verify in `<head>` of `index.html`, etc.).
- `src/config/translations.js` (`theme.*`).

**Required checks:**

- `npm run validate`, `npm test`, `npm run lint`, `npm run build`, `npm run a11y`.

**Expected final report:**

- Theme cycle verified (light/dark/system).
- FOUC absent on cold load.
- Token coverage (no hardcoded hex outside `styles/global.css`).
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Don't change localStorage key (`user_prefs`) — see [§50](#50-safety-rules-and-carve-outs).

**Failure modes to watch for:**

- FOUC on first paint.
- Drawer button drifts from desktop button.
- Tokens used in JS via `getComputedStyle` and not re-fetched on theme change.
- Hardcoded `#fff` / `#000` outside the token system.
- AR drawer toggle missing.

**Cross-references:**

- → [§8 Full UI/UX Revamp Prompt](#8-full-uiux-revamp-prompt)
- → [§12 Arabic / RTL Quality Prompt](#12-arabic--rtl-quality-prompt)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)

---

## 36. Analytics Events Standardization

**Purpose:** `src/lib/analytics.js` exports `EVENTS` (frozen constants) and `track(name, params)`.
Consistent event names + payloads make funnel analysis possible. Drift breaks dashboards.

**When to use:**

- New event needs to be added.
- Existing call sites pass mismatched payloads.
- Non-module scripts need access to event names (`window.GP_EVENTS`).

**Copy-paste prompt:**

```text
You are standardizing analytics events on Gold Ticker Live. `src/lib/analytics.js` is the
single source of truth. `window.GP_EVENTS` mirrors constants for non-module scripts via
`assets/analytics.js`.

INSPECT FIRST
1. Read `src/lib/analytics.js` (`EVENTS` frozen, `track(name, params)`).
2. Read `assets/analytics.js` (`window.GP_EVENTS` mirror).
3. Find call sites: `src/tracker/events.js`, `src/pages/tracker-pro.js`,
   `src/pages/calculator.js`, `src/pages/home.js`, `src/components/nav.js`,
   `src/components/footer.js`.
4. Read `docs/ANALYTICS_EVENTS.md`.

WORK — events
- Add new event constants to `EVENTS` (frozen; freeze after add).
- Mirror to `window.GP_EVENTS`.
- Document each event in `docs/ANALYTICS_EVENTS.md` (name, when, payload schema).

WORK — call sites
- Every `track()` call uses an `EVENTS.*` constant — no string literals.
- Payload follows the documented schema.

WORK — privacy
- No PII in payloads (no email, no phone, no precise location).
- Aggregate or hash where needed.

CONSTRAINTS
- Don't rename existing event constants — analytics dashboards reference them.
- No PII.
- Bilingual labels are not events; events stay in canonical English snake_case.

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- `rg "track\(['\"]" src/` — every match should be an `EVENTS.*` reference.

DELIVERABLE
PR with focused commits: events, mirror, call sites, docs.
```

**Files / surfaces to inspect:**

- `src/lib/analytics.js`, `assets/analytics.js`.
- Call sites listed above.
- `docs/ANALYTICS_EVENTS.md`.

**Required checks:**

- `npm run validate`, `npm test`, `npm run lint`, `npm run build`.
- Ripgrep audit for string-literal `track()` calls.

**Expected final report:**

- Events added/changed.
- Call-site coverage.
- Schema doc updated.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Renaming an event breaks dashboards — never do it without owner approval and a doc note.

**Failure modes to watch for:**

- New `track('something', …)` with a string literal instead of `EVENTS.SOMETHING`.
- PII in payloads.
- `window.GP_EVENTS` and `EVENTS` drift.
- Doc not updated for new event.

**Cross-references:**

- → [§16 Docs and Governance Prompt](#16-docs-and-governance-prompt)
- → [§37 GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 37. GitHub Actions Workflow Hardening

**Purpose:** The repo has 13 workflows including the production hourly X-post (`post_gold.yml`),
deploy, CI, lighthouse, perf, semgrep, codeql, sync-db-to-git, uptime, alerts. Hardening means
SHA-pinned actions, minimal `permissions:`, no echoed secrets, fast feedback.

**When to use:**

- Adding a new workflow.
- An action's tag was bumped without updating the SHA pin.
- A workflow leaks logs or runs longer than necessary.

**Copy-paste prompt:**

```text
You are hardening GitHub Actions workflows on Gold Ticker Live. SHA-pinned, minimal
permissions, no secret echoes, fast.

INSPECT FIRST
1. Read `.github/workflows/README.md` — central SHA-pin reference table.
2. Read every `.github/workflows/*.yml`. Confirm:
   - All `uses:` refs are full commit SHAs with a `# vX` comment.
   - `permissions:` block is minimal (default-deny, opt-in).
   - No `echo $SECRET` or `run: echo "${{ secrets.* }}"` patterns.
   - Concurrency groups present where useful.
3. Note `.github/workflows/post_gold.yml` is LIVE; `tests/sw-exclusions.test.js`
   gating must stay green.

WORK — pinning
- Every action pinned to a full 40-char SHA.
- README table updated when a SHA is bumped.

WORK — permissions
- `contents: read` by default; `contents: write` only when committing.
- `id-token: write` only when needed.

WORK — secrets
- Never echoed.
- Used via `${{ secrets.X }}` directly in `with:` or env, not in `run:` shell expressions.

WORK — performance
- Cache `node_modules` via setup-node `cache: 'npm'`.
- Concurrency group `cancel-in-progress: true` for PR builds.
- Skip CI on `[skip ci]` commit prefix where appropriate (data sync).

CONSTRAINTS
- Don't change `post_gold.yml` cadence without owner approval.
- Don't pin to a tag.
- Don't echo secrets.

VERIFY
- `actionlint .github/workflows/` (verify installed).
- Re-run all CI jobs on a no-op commit; confirm pass.

DELIVERABLE
PR with focused commits: pinning, permissions, secrets, perf, README table.
```

**Files / surfaces to inspect:**

- `.github/workflows/*.yml` (all 13).
- `.github/workflows/README.md` (SHA table).
- `tests/sw-exclusions.test.js`.

**Required checks:**

- `actionlint` (verify installed).
- Workflow re-run on a no-op commit.

**Expected final report:**

- SHA pins audited (count + any drift).
- Permissions audit per workflow.
- Secret echo audit.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- `post_gold.yml` is production — see [§50](#50-safety-rules-and-carve-outs).

**Failure modes to watch for:**

- A `uses:` got bumped to a tag.
- `permissions: write-all` left over from copy-paste.
- `run: echo "${{ secrets.GH_TOKEN }}"` left in for "debugging".
- Concurrency group missing → duplicate deploys.
- README SHA table drifted from workflow files.

**Cross-references:**

- → [§28 X/Twitter Automation Polish](#28-xtwitter-automation-polish)
- → [§38 Pre-deploy, Changelog & Release](#38-pre-deploy-changelog--release)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 38. Pre-deploy, Changelog & Release

**Purpose:** `npm run pre-deploy` runs 11 go/no-go checks; `pre-deploy:fast` skips tests; the
changelog script keeps `CHANGELOG.md` aligned with merged PRs; `release:package` bundles a release
artifact. This prompt keeps the release pipeline reliable and documented.

**When to use:**

- Pre-deploy fails and the failure mode is unclear.
- Changelog has drifted from PR history.
- A new go/no-go check needs to be added.

**Copy-paste prompt:**

```text
You are working on the pre-deploy / changelog / release pipeline on Gold Ticker Live.
`scripts/node/*.js` are CJS (root `package.json` is `"type":"commonjs"`).

INSPECT FIRST
1. Read `scripts/node/pre-deploy-check.js` (11 checks; always exits 1 on failures).
2. Read `scripts/node/changelog.js` and `package.json` `changelog`/`changelog:write`.
3. Read `scripts/node/package-release.js`.
4. Read `package.json` scripts (`pre-deploy`, `pre-deploy:fast`, `pre-deploy:ci`,
   `changelog`, `release:package`).

WORK — pre-deploy
- Each of the 11 checks has a clear pass/fail message.
- New checks added with the existing function-per-check pattern.
- `--ci` mode skips interactive prompts; `--skip-tests` shaves time.

WORK — changelog
- Generated from PR titles since the last tag.
- Manual edits preserved between regenerations.
- AR not required for changelog (developer-facing).

WORK — release
- `release:package` produces a deterministic artifact (no timestamps in zipped files).
- Artifact name includes version + git short-sha.

CONSTRAINTS
- CJS only in `scripts/node/`.
- Don't break `pre-deploy:ci`.
- Don't change exit-code conventions (always 1 on failures).

VERIFY
- `npm run pre-deploy:fast` (locally — must complete).
- `npm run changelog` (must produce a clean diff or no-op).
- `npm test`, `npm run lint`.

DELIVERABLE
PR with focused commits: checks, changelog, release packaging, docs.
```

**Files / surfaces to inspect:**

- `scripts/node/pre-deploy-check.js`, `scripts/node/changelog.js`,
  `scripts/node/package-release.js`.
- `package.json` scripts.
- `CHANGELOG.md`.

**Required checks:**

- `npm run pre-deploy:fast`, `npm run changelog`, `npm test`, `npm run lint`.

**Expected final report:**

- Checks added / fixed.
- Changelog status.
- Release artifact name + size.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- CJS in `scripts/node/` (root is `"type":"commonjs"`); ESM `import` syntax fails at runtime.

**Failure modes to watch for:**

- A check returns 0 on failure ("oops, exit code reversed").
- ESM `import` statement added to a `scripts/node/*.js`.
- Changelog overwrites manual edits.
- Release artifact filename non-deterministic.

**Cross-references:**

- → [§7 Before New PR Prompt](#7-before-new-pr-prompt)
- →
  [§20 Final Verification and Deploy Safety Prompt](#20-final-verification-and-deploy-safety-prompt)
- → [§37 GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening)

---

## 39. E2E & Coverage

**Purpose:** Playwright E2E tests cover the user-facing flows the unit tests can't reach (theme
cycle, country search, calculator round-trip, freshness pill on throttled networks). This prompt
keeps the suite useful, fast, and CI-stable.

**When to use:**

- Adding a new user flow worth E2E coverage.
- Existing E2E tests are flaky.
- Coverage gaps surface in a regression.

**Copy-paste prompt:**

```text
You are upgrading the E2E suite on Gold Ticker Live. Playwright. Fast, deterministic,
CI-stable. Coverage where it matters; not coverage theater.

INSPECT FIRST
1. Read `playwright.config.js`.
2. Read existing E2E specs (verify location: `tests/e2e/` or `e2e/`).
3. Read `package.json` `test:playwright` and `test:coverage`.
4. Read the relevant CI workflow that runs Playwright.

WORK — coverage
- Cover: home → tracker, home → calculator → result, country → city, theme cycle,
  AR toggle, freshness pill state.
- Each test asserts visible behavior, not internal state.

WORK — determinism
- Network: stub gold price APIs to a fixture so tests don't depend on live data.
- Time: freeze `Date.now` in the page where freshness state matters.
- Retries: at most 1 retry; flaky tests get marked or fixed.

WORK — speed
- Parallel workers tuned to CI cores.
- Reuse browser context where safe.

CONSTRAINTS
- Don't test against the live API.
- Don't add Playwright-specific brittleness ("sleep 2000").

VERIFY
- `npm run test:playwright` (locally, then CI).
- `npm run test:coverage` (verify thresholds defined).

DELIVERABLE
PR with focused commits: specs, fixtures, config, CI.
```

**Files / surfaces to inspect:**

- `playwright.config.js`, `tests/e2e/` or `e2e/` (verify path).
- `package.json` (`test:playwright`, `test:coverage`).
- CI workflow (`.github/workflows/*.yml`).

**Required checks:**

- `npm run test:playwright`, `npm run test:coverage`.

**Expected final report:**

- Specs added / changed.
- Coverage delta.
- Flake rate over the last N runs.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Don't test against live APIs.
- Don't bypass auth in admin E2E tests.

**Failure modes to watch for:**

- `await page.waitForTimeout(5000)` instead of an assertion.
- Tests that hit the real gold API and break in CI.
- Coverage threshold lowered to make CI pass.
- Specs that share global state.

**Cross-references:**

- → [§7 Before New PR Prompt](#7-before-new-pr-prompt)
- → [§37 GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)

---

## 40. Dependency Audit & Advisory Check

**Purpose:** The lightweight posture (no React, no Next, no charting libs) means few deps, but each
one matters. This prompt keeps the dep list tight, vetted against the GitHub Advisory DB, and
removed where unused.

**When to use:**

- Quarterly dep refresh.
- Dependabot PR needs review.
- A new dep is being considered.

**Copy-paste prompt:**

```text
You are auditing dependencies on Gold Ticker Live. Lightweight posture: every dep earns
its place. GitHub Advisory DB consulted before any add.

INSPECT FIRST
1. Read `package.json` and `package-lock.json`.
2. Read `docs/DEPENDENCIES.md`.
3. Run `npm outdated` and `npm audit` (capture).
4. For each non-trivial dep, run a GH Advisory check.

WORK — audit
- Mark each dep as: kept (used + safe), upgrade (safe + tested), remove (unused),
  replace (lighter alternative).
- Run `npm audit fix` only on minor/patch within compat. Major bumps are owner-approved.

WORK — adds
- Before adding, justify in `docs/DEPENDENCIES.md`: why, what it replaces, bundle delta.
- Run GH Advisory check.

WORK — removes
- `rg "from ['\"]<dep>['\"]|require\\(['\"]<dep>['\"]\\)" src/ scripts/` to confirm unused.

CONSTRAINTS
- No new framework (React, Next, Vue, Svelte).
- No heavy charting lib (chart.js, d3 full bundle).
- No CSS framework (Tailwind, Bootstrap).
- jQuery banned.

VERIFY
- `npm install`, `npm test`, `npm run lint`, `npm run build`.
- `npm audit` post-change.

DELIVERABLE
PR with focused commits: kept / upgraded / removed / replaced. Update `docs/DEPENDENCIES.md`.
```

**Files / surfaces to inspect:**

- `package.json`, `package-lock.json`.
- `docs/DEPENDENCIES.md`.

**Required checks:**

- `npm install`, `npm test`, `npm run lint`, `npm run build`, `npm audit`.

**Expected final report:**

- Deps audited (kept / upgraded / removed / replaced).
- Advisory results.
- Bundle size delta.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Lightweight-posture carve-out — see [§50](#50-safety-rules-and-carve-outs).
- Major bumps need owner approval.

**Failure modes to watch for:**

- A "small" dep pulls 200 transitive deps.
- Major bump silently included.
- `npm audit fix --force` left in CI.
- Advisory ignored ("low severity, fine").

**Cross-references:**

- → [§16 Docs and Governance Prompt](#16-docs-and-governance-prompt)
- → [§37 GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)

---

## 41. Placeholder & Stub Page Completion

**Purpose:** Some country/city pages are placeholders awaiting enrichment. Stub pages exist for
reserved URLs. This prompt completes them in a controlled way without breaking SEO or the generator
pipeline.

**When to use:**

- A placeholder page is now ready for full content.
- A stub URL needs to either complete or be removed.
- The placeholder generator is producing weak output.

**Copy-paste prompt:**

```text
You are completing placeholder/stub pages on Gold Ticker Live. Don't break URLs; don't
ship thin content; don't leak "coming soon" past the launch date.

INSPECT FIRST
1. Read `scripts/node/enrich-placeholder-pages.js` and `scripts/node/generate-placeholders.js`.
2. List placeholder pages: `rg -l "coming soon|placeholder|stub" countries/ content/`.
3. Read `styles/pages/stub.css`.
4. Read `src/seo/seoHead.js` placeholder branch.

WORK — completion
- Replace placeholder content with substantive content per [§22](#22-country--city-pages-deep-dive)
  or [§23](#23-content-guide-library).
- Re-run the generator if the page is generator-emitted.
- Update sitemap, schema, internal links.

WORK — removal
- If a stub URL won't be completed, return 410 (preferred) or redirect via `_redirects`.
- Drop from sitemap.

CONSTRAINTS
- Don't leave "coming soon" indexed.
- SEO carve-outs preserved.
- Bilingual.

VERIFY
- `npm run validate`, `npm run seo-audit`,
  `node scripts/node/check-sitemap-coverage.js`, `npm test`, `npm run build`.

DELIVERABLE
PR with focused commits: content, generator, sitemap, redirects.
```

**Files / surfaces to inspect:**

- `scripts/node/enrich-placeholder-pages.js`, `scripts/node/generate-placeholders.js`.
- `styles/pages/stub.css`.
- Placeholder pages identified by ripgrep.
- `_redirects` (verify exists).

**Required checks:**

- `npm run validate`, `npm run seo-audit`, `node scripts/node/check-sitemap-coverage.js`,
  `npm test`, `npm run build`.

**Expected final report:**

- Pages completed / removed.
- Generator changes.
- Sitemap delta.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- 410 vs 301 vs 404 — see [§45](#45-404--error-pages--redirect-hygiene).

**Failure modes to watch for:**

- Placeholder content shipped indexed for months.
- Stub removed but sitemap still references it.
- Generator regenerated and overwrote completed page.

**Cross-references:**

- → [§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive)
- →
  [§18 Generated Files and Source Generator Prompt](#18-generated-files-and-source-generator-prompt)
- → [§45 404 / Error Pages & Redirect Hygiene](#45-404--error-pages--redirect-hygiene)

---

## 42. Mobile-First Layout Audit

**Purpose:** 60–80 % of traffic is mobile. Every surface must work cleanly at 320–414 px. This
prompt audits layout hygiene at small widths, with RTL parity.

**When to use:**

- A layout regression on mobile is reported.
- New page/component being shipped — verify mobile before merge.
- Quarterly mobile audit.

**Copy-paste prompt:**

```text
You are auditing mobile-first layout on Gold Ticker Live. Every surface clean at 320–414 px,
EN + AR.

INSPECT FIRST
1. Sample pages: home, tracker, calculator, shops, methodology, country, city, guide,
   FAQ, admin (operator-facing).
2. Read `styles/global.css` breakpoints (verify there is no per-page breakpoint drift).
3. Read `tests/sw-exclusions.test.js` and accessibility tests.

WORK — layout
- No horizontal scroll at 320 px.
- Tap targets ≥ 44 × 44 px (WCAG 2.5.5) — verified per Round 15.
- Forms: full-width inputs, labels above (not placeholder-as-label).

WORK — RTL
- Mirror chevrons / arrows / progress indicators.
- Number formatting + AED/USD positioning.
- Drawer slides in from the right in AR.

WORK — performance on mobile
- Hero LCP ≤ 2.5 s on a throttled 3G profile.
- No CLS > 0.1.

CONSTRAINTS
- Don't add desktop-only fancy effects that break mobile.
- All animations respect `prefers-reduced-motion: reduce` (Round 15 guards).

VERIFY
- `npm run validate`, `npm run a11y`, `npm run perf:ci`,
  `npm test`, `npm run build`.
- Manual: 320, 360, 414 px in EN + AR.

DELIVERABLE
PR with focused commits: layout, RTL, perf, a11y.
```

**Files / surfaces to inspect:**

- `styles/global.css`, `styles/pages/*.css`.
- Sample pages above.

**Required checks:**

- `npm run validate`, `npm run a11y`, `npm run perf:ci`, `npm test`, `npm run build`.

**Expected final report:**

- Pages tested at 320 / 360 / 414 px in EN + AR.
- Issues found / fixed.
- LCP / CLS deltas.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- 44 px tap target carve-out — see [§50](#50-safety-rules-and-carve-outs).

**Failure modes to watch for:**

- New CSS rule with a hardcoded width forcing horizontal scroll.
- AR drawer slides in from the wrong side.
- Reduced-motion users get an animation anyway.
- A button shrinks to 32 px on mobile.

**Cross-references:**

- → [§8 Full UI/UX Revamp Prompt](#8-full-uiux-revamp-prompt)
- → [§12 Arabic / RTL Quality Prompt](#12-arabic--rtl-quality-prompt)
- → [§35 Dark Mode & Theme System](#35-dark-mode--theme-system)

---

## 43. RSS Feed & News

**Purpose:** The RSS feed (`generate-rss.js`) gives aggregators and power users a low-cost way to
follow guides + alerts. News-style updates need careful framing — Gold Ticker Live is not a news
site; it summarizes its own content.

**When to use:**

- RSS feed is stale or invalid.
- A new content type should be included in the feed.
- News framing is too clickbait-y.

**Copy-paste prompt:**

```text
You are upgrading the RSS feed on Gold Ticker Live. Generated from guides + selected
alerts. Standards-compliant. Honest framing.

INSPECT FIRST
1. Read `scripts/node/generate-rss.js`.
2. Read `feed.xml` (or wherever the output lives — verify path).
3. Read translations `news.*` if present.

WORK — feed
- Title, description, link, language (EN). Optional AR feed.
- Items: title, link, pubDate (mtime), description (≤ 250 chars), guid (deterministic).
- Self-link via `atom:link`.

WORK — news framing
- Items are summaries of OWN content + price-spike alerts.
- No claims about external news outlets.

CONSTRAINTS
- Don't break the feed XML structure.
- Don't include admin or stub pages.

VERIFY
- `npm run validate`, `npm test`, `npm run build`.
- Validate the feed: `xmllint --noout feed.xml` (verify installed).
- Submit to a feed validator — manual.

DELIVERABLE
PR with focused commits: generator, content, validation.
```

**Files / surfaces to inspect:**

- `scripts/node/generate-rss.js`, `feed.xml` (verify path).
- `src/config/translations.js` (`news.*` if present).

**Required checks:**

- `npm run validate`, `npm test`, `npm run build`.
- `xmllint` if installed.

**Expected final report:**

- Feed item count.
- Validation status.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Never include admin items.

**Failure modes to watch for:**

- Invalid RSS XML.
- Items duplicated each run.
- Admin pages leaked.
- News framing reads as fake reporting.

**Cross-references:**

- → [§23 Content Guide Library](#23-content-guide-library)
- → [§27 Newsletter & Alert System](#27-newsletter--alert-system)

---

## 44. Supabase Data Sync

**Purpose:** Supabase backs admin auth (GitHub OAuth) and any Supabase-stored content (verify schema
in `docs/SUPABASE_SCHEMA.md`). The `sync-db-to-git.yml` workflow keeps a JSON snapshot of key tables
in the repo. This prompt keeps RLS, schema, and sync honest.

**When to use:**

- A schema change is needed (column add, table add).
- RLS policies need review.
- Sync workflow output drifts from the live DB.

**Copy-paste prompt:**

```text
You are working on Supabase integration on Gold Ticker Live. Auth + selected content tables.
RLS strict. Sync honest.

INSPECT FIRST
1. Read `docs/SUPABASE_SETUP.md` and `docs/SUPABASE_SCHEMA.md`.
2. Read `.github/workflows/sync-db-to-git.yml`.
3. Read `server/lib/auth.js` and any `server/lib/supabase*.js`.
4. List Supabase-synced JSON files in `data/`.

WORK — schema
- Schema additions in a `migrations/` SQL file (verify exists; manual apply).
- RLS: default deny; admin role for management; public for read-only safe tables.
- gold_prices table name preserved (carve-out).

WORK — sync
- Workflow runs on a schedule and on manual dispatch.
- JSON snapshots committed atomically.
- No secrets echoed.

CONSTRAINTS
- `gold_prices` table name preserved.
- RLS never widened without explicit approval.
- Migrations applied manually — flag in the final report (manual follow-up).

VERIFY
- `npm test` (`tests/repositories.test.js`, `tests/server*`).
- Manual: dispatch the sync workflow on a test branch.

DELIVERABLE
PR with focused commits: schema, RLS notes, sync, docs. Flag manual follow-up per [§52](#52-manual-follow-up-reporting-expectations).
```

**Files / surfaces to inspect:**

- `docs/SUPABASE_SETUP.md`, `docs/SUPABASE_SCHEMA.md`.
- `.github/workflows/sync-db-to-git.yml`.
- `server/lib/auth.js`, `server/lib/supabase*.js` (verify exists).
- `migrations/**` (verify exists).
- `data/*.json` (synced files).

**Required checks:**

- `npm test`, `npm run lint`, `npm run build`.
- Manual sync workflow dispatch.

**Expected final report:**

- Schema diff.
- RLS audit.
- Sync output diff.
- Manual follow-up: SQL apply, RLS update, secrets — see
  [§52](#52-manual-follow-up-reporting-expectations).
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- `gold_prices` carve-out — see [§50](#50-safety-rules-and-carve-outs).

**Failure modes to watch for:**

- RLS widened to "anon read all".
- Migration committed but never applied.
- Sync workflow leaks secrets in logs.
- `gold_prices` renamed.

**Cross-references:**

- → [§26 Admin Panel UX](#26-admin-panel-ux)
- → [§37 GitHub Actions Workflow Hardening](#37-github-actions-workflow-hardening)
- → [§52 Manual Follow-Up Reporting Expectations](#52-manual-follow-up-reporting-expectations)

---

## 45. 404 / Error Pages & Redirect Hygiene

**Purpose:** 404, 410, and redirect handling shape SEO health and user trust. A drift here leaks
soft-404s and broken links into Google. This prompt keeps `404.html`, `_redirects`, `_headers`, and
the offline page coherent.

**When to use:**

- A URL was retired without a redirect.
- 404 page is generic / unbranded / EN-only.
- Offline page renders broken outside SW scope.

**Copy-paste prompt:**

```text
You are upgrading 404 / error pages and redirect hygiene on Gold Ticker Live. Honest,
branded, bilingual, SEO-clean.

INSPECT FIRST
1. Read `404.html` and `offline.html`.
2. Read `_redirects` and `_headers` (verify exists for the host).
3. Read `robots.txt` and `sitemap.xml`.
4. Read `src/pages/not-found.js` (404 enrichment script).

WORK — 404
- Branded layout, bilingual, search box, popular links (tracker, calculator, methodology,
  shops, country index).
- Server returns 404 status (not 200 with a 404 body — that's a soft-404).
- Page itself is `noindex`.

WORK — 410
- Permanently removed pages return 410 via `_redirects` rule (preferred over 404).
- Drop from sitemap.

WORK — redirects
- Old paths → new paths, 301.
- No redirect chains > 1 hop.
- No redirects to off-domain.

WORK — offline
- `offline.html` is bilingual, references the cached state, links to the homepage.
- Asset references are absolute (works without network).

CONSTRAINTS
- Don't redirect canonicals.
- Don't soft-404.
- Bilingual.

VERIFY
- `npm run validate`, `npm run check-links`, `npm test`, `npm run build`.
- Manual: hit a known-deleted URL, confirm 410.

DELIVERABLE
PR with focused commits: 404, 410, redirects, offline, sitemap.
```

**Files / surfaces to inspect:**

- `404.html`, `offline.html`, `src/pages/not-found.js`.
- `_redirects`, `_headers` (verify exists for host).
- `robots.txt`, `sitemap.xml`.

**Required checks:**

- `npm run validate`, `npm run check-links`, `npm test`, `npm run build`.

**Expected final report:**

- 404 / 410 / 301 audit.
- Soft-404 count (should be 0).
- Sitemap delta.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Don't redirect away from canonicals.
- Don't break the SW scope by relocating `offline.html`.

**Failure modes to watch for:**

- 404 page returns 200 status.
- Redirect chains: A → B → C.
- Off-domain redirect.
- Offline page broken outside SW.

**Cross-references:**

- → [§10 SEO and Indexing Prompt](#10-seo-and-indexing-prompt)
- → [§11 PWA / Service Worker / Performance Prompt](#11-pwa--service-worker--performance-prompt)
- → [§41 Placeholder & Stub Page Completion](#41-placeholder--stub-page-completion)

---

## 46. Image Audit & Asset Optimization

**Purpose:** Images move bytes, drive LCP, and need alt text. The image-audit script
(`image-audit.js`) is the entry point. This prompt keeps the asset budget honest.

**When to use:**

- LCP regresses.
- New images added without dimensions or alt.
- Quarterly asset budget review.

**Copy-paste prompt:**

```text
You are auditing images and assets on Gold Ticker Live. Modern formats, fixed dimensions,
honest alt text, sane budget.

INSPECT FIRST
1. Read `scripts/node/image-audit.js`.
2. Run `npm run image-audit` (capture report).
3. List `assets/img/**` (verify path).
4. Sample HTML pages for `<img>` and `<picture>` usage.

WORK — formats
- Prefer AVIF + WebP with PNG/JPG fallback via `<picture>`.
- Lossy where possible; lossless only for logos/UI marks.

WORK — sizing
- `width` and `height` set on every `<img>` to prevent CLS.
- `srcset` for hero / above-the-fold.
- `loading="lazy"` for below-the-fold.
- `decoding="async"` everywhere.

WORK — alt text
- Decorative images: `alt=""`.
- Informative images: bilingual alt via translations or page-local strings.

CONSTRAINTS
- No images > 200 KB without explicit reason in the audit doc.
- No external image hosts.

VERIFY
- `npm run image-audit`, `npm run perf:ci`, `npm run a11y`, `npm test`, `npm run build`.

DELIVERABLE
PR with focused commits: format, sizing, alt, budget. Update `scripts/node/image-audit.js`
thresholds if owner-approved.
```

**Files / surfaces to inspect:**

- `scripts/node/image-audit.js`.
- `assets/img/**` (verify path).
- HTML pages with `<img>` / `<picture>`.

**Required checks:**

- `npm run image-audit`, `npm run perf:ci`, `npm run a11y`, `npm test`, `npm run build`.

**Expected final report:**

- Image budget delta.
- LCP delta.
- alt-coverage status.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- No external image hosts (lightweight + privacy).

**Failure modes to watch for:**

- A 4 MB hero PNG.
- `<img>` without `width`/`height` → CLS spike.
- Decorative image with verbose alt.
- AR alt missing.

**Cross-references:**

- → [§11 PWA / Service Worker / Performance Prompt](#11-pwa--service-worker--performance-prompt)
- → [§42 Mobile-First Layout Audit](#42-mobile-first-layout-audit)

---

## 47. Repo Cleanup and Architecture

**Purpose:** Periodic cleanup keeps the repo navigable: dead modules removed, dual-import-style
inconsistencies resolved, doc placement consistent, archive/`_archive` clearly delineated from live
code. This prompt prevents architectural sprawl without rewriting working code.

**When to use:**

- A new contributor reports the repo is hard to navigate.
- Multiple modules duplicate the same logic.
- Archive/dead-code accumulates.

**Copy-paste prompt:**

```text
You are cleaning up the repo on Gold Ticker Live. Surgical, not architectural rewrite.
Reduce sprawl; don't break working code.

INSPECT FIRST
1. Read `AGENTS.md` repository map.
2. List top-level directories. Note any duplication.
3. `rg -l "deprecated|legacy|TODO: remove" src/ scripts/`.
4. Read `docs/ARCHITECTURE.md`.

WORK — dead code
- Remove modules with 0 imports verified by ripgrep.
- Move historical content to `_archive/` if not yet archived.

WORK — consistency
- Root `package.json` `"type":"commonjs"`; `src/package.json` `"type":"module"`. Don't
  flip either without an owner-approved migration.
- ESLint flat config (`eslint.config.mjs`) — keep one config source.

WORK — docs alignment
- `docs/ARCHITECTURE.md` reflects current top-level layout.
- `AGENTS.md` repository map matches.

CONSTRAINTS
- Don't change CJS/ESM split.
- Don't move files that workflows reference.
- Bilingual not relevant here (developer-facing).

VERIFY
- `npm run validate`, `npm test`, `npm run lint`, `npm run quality`, `npm run build`.
- `rg "<removed module>" .` → 0 hits.

DELIVERABLE
PR with focused commits: removals, archives, doc updates.
```

**Files / surfaces to inspect:**

- `AGENTS.md`, `docs/ARCHITECTURE.md`.
- Top-level dirs.
- `eslint.config.mjs`, `package.json`, `src/package.json`.

**Required checks:**

- `npm run validate`, `npm test`, `npm run lint`, `npm run quality`, `npm run build`.

**Expected final report:**

- Removals list.
- Archive moves.
- Doc updates.
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- CJS / ESM split is a carve-out.
- Workflows that reference moved files break silently — search workflows before any move.

**Failure modes to watch for:**

- Workflow references a moved script.
- A "dead" module is actually loaded dynamically.
- ESLint config silently removed.

**Cross-references:**

- → [§16 Docs and Governance Prompt](#16-docs-and-governance-prompt)
- → [§40 Dependency Audit & Advisory Check](#40-dependency-audit--advisory-check)

---

## 48. Monetization and Growth

**Purpose:** Growth + monetization (newsletter, partner referrals, ad slots, premium watch) need to
respect trust posture. No deceptive ads, no popovers blocking content, no fake scarcity. This prompt
keeps growth tactics aligned with the product's credibility.

**When to use:**

- Owner-approved monetization experiment.
- Ad slot is being added or moved.
- Premium-watch / partner referral flow needs polish.

**Copy-paste prompt:**

```text
You are working on monetization and growth on Gold Ticker Live. Owner-approved tactics
only. Trust posture preserved.

INSPECT FIRST
1. Read `src/config/constants.js` `AD_CONFIG` and any premium-watch config.
2. Read content/premium-watch (verify path), content/order-gold (verify path).
3. Read `docs/REVAMP_PLAN.md` monetization section.

WORK — ads
- Ad slots labeled "Ad" / "إعلان" visibly.
- No sticky / interstitial ads.
- Ads excluded from above-the-fold and from admin/auth-gated pages.
- Lazy-loaded.

WORK — partner referrals
- Disclosed in copy: "We may earn a referral fee when you order through this link."
- UTMs preserved end-to-end.

WORK — premium watch / alerts
- Pricing page is honest about what's included (see [§29](#29-pricing--invest-pages)).
- Feature gates do not break the public free experience.

CONSTRAINTS
- No deceptive UI.
- No fake scarcity ("Only 3 left!").
- Bilingual.

VERIFY
- `npm run validate`, `npm run a11y`, `npm run perf:ci`, `npm test`, `npm run build`.

DELIVERABLE
PR with focused commits: ad slots, referrals, premium, docs.
```

**Files / surfaces to inspect:**

- `src/config/constants.js` (`AD_CONFIG`).
- `content/premium-watch/`, `content/order-gold/` (verify paths).
- `docs/REVAMP_PLAN.md`.

**Required checks:**

- `npm run validate`, `npm run a11y`, `npm run perf:ci`, `npm test`, `npm run build`.

**Expected final report:**

- Ad slots placement diff.
- Referral disclosure presence.
- Premium gating audit.
- Manual follow-up: AdSense, partner contracts — see
  [§52](#52-manual-follow-up-reporting-expectations).
- 7-part report per [§51](#51-expected-final-report-format).

**Safety notes:**

- Trust carve-outs (no fake scarcity, no deceptive UI) — see [§50](#50-safety-rules-and-carve-outs).

**Failure modes to watch for:**

- Sticky bottom ad blocks the calculator CTA.
- Affiliate links missing disclosure.
- Premium gate accidentally hides freshness pill.

**Cross-references:**

- → [§29 Pricing & Invest Pages](#29-pricing--invest-pages)
- → [§50 Safety Rules and Carve-Outs](#50-safety-rules-and-carve-outs)
- → [§52 Manual Follow-Up Reporting Expectations](#52-manual-follow-up-reporting-expectations)

---

# Reference Sections

The remaining sections are references — cite them from prompts and use them as checklists in your
final report. They are not copy-paste prompts.

---

## 49. Validation Commands Reference

This is the canonical list of commands a Copilot Agent session may run on this repo. Commands marked
**(verify exists)** are not currently in `package.json` or are environment- dependent — confirm
before invoking.

### Git status / diff (always cheap; run liberally)

```bash
git status --short
git branch --show-current
git diff --stat
git diff --name-only
git log --oneline -20
```

Use at session start (Required Session Protocol [§2](#2-required-session-protocol)) and before
opening a PR ([§7](#7-before-new-pr-prompt)).

### Core npm scripts (must exist; in `package.json`)

```bash
npm install
npm test
npm run lint
npm run validate
npm run quality
npm run build
```

`validate` is the integrated gate (build integrity, DOM-safety, SEO meta, sitemap coverage,
placeholder, analytics). `quality` runs lint + format check + stylelint. Run before any final
report.

### Extended npm scripts (verify per repo state)

```bash
npm run seo-audit
npm run check-links
npm run linkcheck
npm run linkcheck:dist
npm run image-audit
npm run a11y
npm run perf:ci
npm run audit-pages
npm run check-unsafe-dom
npm run preview
npm run pre-deploy
npm run pre-deploy:fast
npm run pre-deploy:ci  # (verify exists)
npm run changelog
npm run changelog:write
npm run release:package
npm run security
npm run test:coverage
npm run test:playwright
npm run test:watch
```

`pre-deploy` runs 11 go/no-go checks (always exits 1 on failures). `pre-deploy:fast` adds
`--skip-tests`. `pre-deploy:ci` is non-interactive. Use these from
[§20 Final Verification](#20-final-verification-and-deploy-safety-prompt) and
[§38 Pre-deploy, Changelog & Release](#38-pre-deploy-changelog--release).

### Direct generator / checker scripts (CJS — `node` from repo root)

```bash
node scripts/node/check-unsafe-dom.js
node scripts/node/inject-schema.js
node scripts/node/inject-schema.js --check
node scripts/node/generate-sitemap.js
node scripts/node/check-sitemap-coverage.js
node scripts/node/check-seo-meta.js
node scripts/node/inventory-seo.js
node scripts/node/seo-audit.js
node scripts/node/normalize-shops.js
node scripts/node/audit-pages.js
node scripts/node/image-audit.js
node scripts/node/enrich-placeholder-pages.js
node scripts/node/generate-placeholders.js
node scripts/node/generate-rss.js
node scripts/node/generate-newsletter.js
node scripts/node/send-newsletter.js
node scripts/node/tweet-gold-price.js
node scripts/node/notify-discord.js
node scripts/node/notify-telegram.js
node scripts/node/price-spike-alert.js
node scripts/node/uptime-check.js
node scripts/node/pre-deploy-check.js
node scripts/node/changelog.js
node scripts/node/package-release.js
```

`inject-schema.js --check` is the idempotency gate after Round 16 — must report 0 modifications on a
clean tree. Use from [§18 Generated Files](#18-generated-files-and-source-generator-prompt) and
[§22 Country & City Pages Deep Dive](#22-country--city-pages-deep-dive).

### Rebrand / consistency ripgrep sweeps

```bash
rg -n --hidden \
  --glob '!node_modules' --glob '!dist' --glob '!coverage' --glob '!.git' \
  "GoldPrices|GoldTickerLive|GoldPrices\.app|Gold-Prices|gold_prices|gold-prices|goldprices|goldtickerlive" .

rg -n --hidden \
  --glob '!node_modules' --glob '!dist' --glob '!coverage' --glob '!.git' \
  "Gold Prices|Gold Price Tracker|Gold Prices Platform|Gold Prices UAE|Gold Price " .

rg -n --hidden \
  --glob '!node_modules' --glob '!dist' --glob '!coverage' --glob '!.git' \
  "SITE_NAME|site_name|brandName|application-name|apple-mobile-web-app-title|og:title|twitter:title" .

rg -n --hidden \
  --glob '!node_modules' --glob '!dist' --glob '!coverage' --glob '!.git' \
  "canonical|hreflang|JSON-LD|@type|sitemap|robots" .

rg -n --hidden \
  --glob '!node_modules' --glob '!dist' --glob '!coverage' --glob '!.git' \
  "TODO|FIXME|HACK|temporary|placeholder|stub|coming soon" .

rg -n --hidden \
  --glob '!node_modules' --glob '!dist' --glob '!coverage' --glob '!.git' \
  "innerHTML|outerHTML|insertAdjacentHTML" src/
```

Run the brand and SEO sweeps before any cross-cutting work; classify each match per
[§17 Rebrand Maintenance](#17-rebrand-maintenance-prompt). The DOM-safety sweep gates the unsafe-dom
baseline.

### Workflow lint (verify installed)

```bash
actionlint .github/workflows/
```

Verify before any workflow change ([§37](#37-github-actions-workflow-hardening)).

### Markdown / XML lint (verify installed)

```bash
markdownlint docs/
xmllint --noout sitemap.xml
xmllint --noout feed.xml
```

Use from [§16 Docs and Governance](#16-docs-and-governance-prompt) and
[§43 RSS Feed & News](#43-rss-feed--news).

---

## 50. Safety Rules and Carve-Outs

This section is the source of truth for what NOT to change. Every prompt cross-references back here.
When the agent reports preserved carve-outs in
[§51 Final-Report Format](#51-expected-final-report-format), cite the bullet from this section.

### Inspection & editing discipline

- Inspect before editing. Never blindly replace text.
- For every match, decide: brand identity, SEO keyword phrase, route path, DB schema, historical
  changelog, or backward-compat key.
- Edit source generators BEFORE generated outputs.
- Regenerate generated files only when generator logic changed.
- Avoid shallow changes when the task requires broad repo awareness.
- Document intentionally unchanged references in the final report.
- Document any manual steps that must happen outside the repo
  ([§52](#52-manual-follow-up-reporting-expectations)).

### Deployment carve-outs (do NOT change without explicit instruction)

- `/Gold-Prices/` paths required for GitHub Pages project-path deployment compatibility.
- `github.com/vctb12/Gold-Prices` references until the GitHub repo is actually renamed.
- `vctb12.github.io/Gold-Prices/` historical/current Pages URL.
- `CNAME` (`goldtickerlive.com`).
- `vite.config.js` `base` (currently `'/'`).
- `manifest.json` `start_url` (`'/'`) and `scope` (`'/'`).
- `manifest.json` `name="Gold Ticker Live — Live Gold Price Tracker"` and
  `short_name="Gold Ticker Live"`.
- `.github/workflows/*` deploy/cron triggers.
- `_headers`, `_redirects` (where present).

### SEO carve-outs (preserve)

- URL paths under `countries/**/gold-prices/`.
- SEO topic phrases: "Gold Prices Today", "How Gold Prices Work", "Why UAE Gold Prices Differ",
  "Gold Prices in Dubai", "Gold Prices in <City>", and similar topic / keyword phrasing.
- Existing canonical URLs of indexed pages.
- `robots.txt` `Disallow: /admin/` and `Disallow: /api/`.
- `sitemap.xml` deterministic ordering and `<lastmod>` derivation.
- `hreflang` EN ↔ AR pairing on every bilingual surface.

### Data / schema / state carve-outs

- `gold_prices` database/table names — do not rename without a proper migration request.
- localStorage / cache keys — `user_prefs`, `gold_price_alerts`, `karatStripUnit`, `theme`, etc. —
  do not change without a migration plan.
- Service-worker cache name — bump version (e.g. `goldtickerlive-v16` → `v17`), do NOT rename the
  prefix; coordinate with `tests/sw-exclusions.test.js`.
- Gold pricing formula `price_per_gram = (XAU/USD ÷ 31.1035) × purity × 3.6725` — do not change
  unless explicitly asked.
- AED peg `3.6725` — do not change unless explicitly asked.
- `TROY_OZ_GRAMS = 31.1035` — do not change.
- Karat purity table (24K=0.999, 22K=0.916, 21K=0.875, 18K=0.750) — do not change.
- FX logic — do not change unless explicitly asked.
- `STALE_AFTER_MS = 75 * 60 * 1000` and `FX_STALE_AFTER_MS = 26 * 60 * 60 * 1000` — do not change
  without owner approval.
- `GOLD_REFRESH_MS = 90 * 1000` — do not change without owner approval.

### Identity carve-outs

- `@GoldTickerLive` X/Twitter handle — leave intact.
- Historical changelog / rebrand-notes references to old names — leave intact as historical record.
- Email/contact addresses — verify they exist before changing.

### Quality carve-outs (preserve)

- Arabic / RTL parity for every user-visible string.
- Mobile-first behavior at 320–414 px.
- Trust language around live / cached / fallback / derived data (freshness states: `live`, `cached`,
  `stale`, `unavailable`).
- Lightweight, no-heavy-dependency posture (no React, no Next, no charting libs except the
  lazy-loaded TradingView Lightweight Charts CDN, no CSS frameworks, no jQuery).
- DOM-safety baseline (per `scripts/node/check-unsafe-dom.js` — 0 sinks in `src/tracker/render.js`;
  total baseline must not increase).
- WCAG 2.5.5 tap target ≥ 44 × 44 px (Round 15).
- All animations respect `prefers-reduced-motion: reduce` (per-class guards Round 15
  - global `*` rule in `styles/global.css`).
- SEO intent while improving brand consistency.
- `<details>` / disclosure semantics for FAQ.
- Single source for nav, footer, breadcrumbs (one component each).

### Workflow carve-outs

- `.github/workflows/post_gold.yml` is live in production — never break the `scripts/python/utils/*`
  import path; never change cadence without owner approval.
- `tests/sw-exclusions.test.js` must stay green — `/admin/*` and `/api/*` excluded from SW.
- Pin third-party actions to commit SHAs; keep `.github/workflows/README.md` table in sync.
- Never echo secrets in workflow `run:` steps.
- `pre-deploy:ci` is the canonical non-interactive gate.

### Reporting

- Run [§49](#49-validation-commands-reference) checks before final response.
- Produce the [§51](#51-expected-final-report-format) final report.
- Cite this section (§50) when listing preserved carve-outs.
- Flag manual follow-up per [§52](#52-manual-follow-up-reporting-expectations).

---

## 51. Expected Final-Report Format

Every Copilot Agent session driven by any prompt in this library must produce the following report
at the end of the task. Copy this template into the agent's final message; fill every line.

```
### Session Final Report — <date> — <branch>

- Branch: <name> (base: main)
- Files changed: <count>
  - by area: docs (<n>), src (<n>), scripts (<n>), countries (<n>), content (<n>), workflows (<n>), config (<n>)
- Summary of changes:
  - <bulleted, by area, one line each>
- Generators touched: <yes/no — list>
- Generated files regenerated: <yes/no — list>
- Commands run:
  - git status --short → <result>
  - npm ci / npm install → <result>
  - npm test → <pass/fail count>
  - npm run lint → <result>
  - npm run validate → <result>
  - npm run quality → <result>
  - npm run build → <result>
  - npm run seo-audit → <result, if relevant>
  - npm run check-links → <result, if relevant>
  - node scripts/node/check-unsafe-dom.js → <result, if relevant>
  - node scripts/node/inject-schema.js --check → <result, if relevant>
  - rebrand ripgrep sweep → <before count → after count, classified>
- Skipped checks (and why): <list>
- Carve-outs preserved: <bulleted, cite §50>
- Manual follow-up required (outside repo): <bulleted, cite §52>
- PR shape: <commit count, themes, draft vs ready>
- Safe to deploy: <yes/no> — <one-paragraph reasoning>
```

**Rules for the report:**

1. **Be honest about what was run.** If you didn't run a check, say so under "Skipped checks". Do
   not paraphrase a check as run when you only inferred its likely result.
2. **Quote real numbers.** "39 tests passed" not "tests passed". "Rebrand sweep: 412 matches before,
   38 intentional carve-outs after" not "rebrand looks clean".
3. **Cite §50 carve-outs by their bullet text** so the owner can scan the list.
4. **Manual follow-up is mandatory** if any item from
   [§52](#52-manual-follow-up-reporting-expectations) applies — never silently absorb a manual step.
5. **`Safe to deploy: yes` is a strong claim.** Say `no` if the verification matrix is incomplete or
   if `pre-deploy:ci` was not run.

---

## 52. Manual Follow-Up Reporting Expectations

Some changes require manual action outside the repo. The agent must surface every such step in the
[§51](#51-expected-final-report-format) "Manual follow-up required" bullet list. Never silently
accept a state that requires owner action without flagging it.

### Always-manual surfaces

- **GitHub repository rename** (`vctb12/Gold-Prices` → anything else) — requires GitHub admin
  action; agents do not perform this. If a session would benefit from a rename, flag it; do not
  attempt.
- **DNS / `CNAME` changes** — requires DNS provider action.
- **GitHub Pages settings** (custom domain, HTTPS toggle) — requires repo admin.
- **GitHub Secrets** — never commit; flag the secret name + owner action ("set `X_API_TOKEN` in repo
  secrets").
- **Supabase RLS / SQL migrations** — flag migration file path + apply step. See
  [§44](#44-supabase-data-sync) and [§26](#26-admin-panel-ux).
- **Supabase OAuth provider config** — manual.
- **AdSense / monetization account config** — manual. See [§48](#48-monetization-and-growth).
- **X / Twitter API tokens** — manual. See [§28](#28-xtwitter-automation-polish).
- **Discord / Telegram webhook URLs** — manual. See [§27](#27-newsletter--alert-system).
- **Formspree / form-relay endpoint config** — manual.
- **Email provider config** (newsletter sending) — manual.
- **Analytics provider account / property setup** — manual. See
  [§36](#36-analytics-events-standardization).
- **Submitting `sitemap.xml` to Google Search Console / Bing Webmaster** — manual.
- **Schema change apply on the live Supabase project** — manual.

### Format

Use the form: `<owner action> — <reason / link>`. Examples:

- `Set X_API_TOKEN, X_API_SECRET, X_BEARER_TOKEN in repo secrets — required by post_gold.yml.`
- `Apply migrations/2026-04-30-add-shop-evidence-url.sql to Supabase — adds shop_evidence_url column.`
- `Submit sitemap.xml in Google Search Console for goldtickerlive.com — required after sitemap structure change.`
- `Update Discord webhook URL in DISCORD_WEBHOOK secret — old webhook revoked.`

The agent should err on the side of over-reporting manual steps. A flag the owner ignores is cheap;
a missed step is expensive.

---

## 53. Appendix — Repo-Specific Reminders

A condensed reference of the constants, paths, and patterns the rest of this library assumes. Verify
against the live repo at session start; if any value drifted, use the current value and flag the
change.

### Identity

- Brand: **Gold Ticker Live**.
- Domain: **https://goldtickerlive.com/** (custom domain via `CNAME`).
- GitHub repo: **`vctb12/Gold-Prices`** (until renamed; see
  [§52](#52-manual-follow-up-reporting-expectations)).
- GitHub Pages historical URL: `https://vctb12.github.io/Gold-Prices/`.
- X/Twitter handle: `@GoldTickerLive`.

### Constants (`src/config/constants.js`)

- `AED_PEG = 3.6725`.
- `TROY_OZ_GRAMS = 31.1035`.
- `GOLD_REFRESH_MS = 90 * 1000` (90 s).
- `STALE_AFTER_MS = 75 * 60 * 1000` (75 min; `DELAYED_AFTER_MS = 30 * 60 * 1000`).
- `FX_STALE_AFTER_MS = 26 * 60 * 60 * 1000` (26 h).
- `BASE_PATH = '/'` (custom domain).
- `CACHE_KEYS.alerts = 'gold_price_alerts'`.

### Karat purities (`src/config/karats.js`)

- 24K = 0.999
- 22K = 0.916
- 21K = 0.875
- 18K = 0.750

### Pricing formula

```
price_per_gram_AED = (XAU_USD ÷ 31.1035) × purity × 3.6725
```

### Manifest (`manifest.json`)

- `name = "Gold Ticker Live — Live Gold Price Tracker"`.
- `short_name = "Gold Ticker Live"`.
- `start_url = "/"`.
- `scope = "/"`.

### Service worker (`sw.js`)

- `CACHE_NAME = 'goldtickerlive-v16'` — bump version on cache logic changes; do not rename the
  prefix.
- `/admin/*` and `/api/*` excluded — gated by `tests/sw-exclusions.test.js`.

### Module type split

- Root `package.json`: `"type": "commonjs"`. `scripts/node/*.js` use CJS `require`.
- `src/package.json`: `"type": "module"`. `src/**/*.js` use ESM `import`.

### Tests

- 39 test files (verify via `ls tests/*.test.js | wc -l`).
- Runner: `node --test --test-concurrency=1 tests/*.test.js`.
- Concurrency 1 to avoid `data/*.json` race.

### Workflows (`.github/workflows/`)

- 13 workflows; SHA-pinned actions; central reference table at `.github/workflows/README.md`.
- Production: `post_gold.yml` (hourly X-post). Do not break import path `scripts/python/utils/*`.
- Sync: `sync-db-to-git.yml` (Supabase JSON snapshot).
- Tests: `ci.yml`, `codeql.yml`, `semgrep.yml`, `lighthouse.yml`, `perf-check.yml`.
- Alerts/uptime: `price-spike-alert*.yml`, `uptime-check*.yml`.

### Generators (CJS in `scripts/node/`)

- `inject-schema.js` (idempotent as of Round 16; mtime-driven dates).
- `generate-sitemap.js`, `check-sitemap-coverage.js`.
- `enrich-placeholder-pages.js`, `generate-placeholders.js`.
- `normalize-shops.js` (atomic JSON gate).
- `generate-rss.js`, `generate-newsletter.js`, `send-newsletter.js`.
- `tweet-gold-price.js`, `notify-discord.js`, `notify-telegram.js`, `price-spike-alert.js`,
  `uptime-check.js`.
- `pre-deploy-check.js` (11 checks, exits 1 on failure).
- `changelog.js`, `package-release.js`.
- `check-unsafe-dom.js` (DOM-safety baseline).

### Carve-out cross-references

- Deployment paths: [§50](#50-safety-rules-and-carve-outs) → Deployment carve-outs.
- SEO phrases & paths: [§50](#50-safety-rules-and-carve-outs) → SEO carve-outs.
- Pricing math, peg, karats, troy-ounce: [§50](#50-safety-rules-and-carve-outs) → Data carve-outs.
- `@GoldTickerLive` handle: [§50](#50-safety-rules-and-carve-outs) → Identity carve-outs.
- 44 px tap target, RTL, reduced-motion, lightweight posture: [§50](#50-safety-rules-and-carve-outs)
  → Quality carve-outs.

### Style tokens (`styles/global.css`)

- Surfaces: `--surface-primary`, `--surface-secondary`, `--surface-tertiary`.
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`.
- Borders: `--border-subtle`.
- Accents: `--color-accent`, `--color-accent-strong`, `--color-surface-raised`,
  `--color-gold-alpha`, `--color-amber`, `--color-danger`.
- Spacing: `--space-*`. Typography: `--text-*`. Radii: `--radius-*`. Shadows: `--shadow-*`. Easing:
  `--ease-*`. Duration: `--duration-*`.

### Documentation map

- `AGENTS.md` — cross-agent charter.
- `CLAUDE.md` — Claude-specific mechanics (points to AGENTS.md).
- `.github/copilot-instructions.md` — Copilot-specific mechanics (points to AGENTS.md and this
  file).
- `docs/REVAMP_PLAN.md` — master revamp plan.
- `docs/plans/` — proposal intake.
- `docs/ARCHITECTURE.md`, `docs/DESIGN_TOKENS.md`, `docs/ACCESSIBILITY.md`, `docs/PERFORMANCE.md`,
  `docs/SEO_STRATEGY.md`, `docs/SEO_CHECKLIST.md`, `docs/EDIT_GUIDE.md`, `docs/AUTOMATIONS.md`,
  `docs/environment-variables.md`, `docs/tracker-state.md`, `docs/methodology.md`,
  `docs/LIMITATIONS.md`, `docs/DEPENDENCIES.md`, `docs/CONTRIBUTING.md`, `docs/ADMIN_SETUP.md`,
  `docs/ADMIN_GUIDE.md`, `docs/SUPABASE_SETUP.md`, `docs/SUPABASE_SCHEMA.md`,
  `docs/twitter_bot_architecture.md`, `docs/ANALYTICS_EVENTS.md` (verify each).
- `docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md`, `docs/GOLD_TICKER_LIVE_REBRAND_VERIFICATION.md`.

---

## 54. Changelog of this Prompt Library

### v2.0.0 — 2026-04-30

- Restructured the file into 54 sections with a strict 7-part schema for every prompt (Purpose /
  When to use / Copy-paste prompt / Files-to-inspect / Required checks / Expected final report /
  Safety notes / Failure modes / Cross-references).
- Added meta-layer sections: Required Session Protocol (§2), Prompt Index / Quick Picker (§3),
  Universal New Session Starter (§4), Repo Synergy & Consistency Audit Prompts (§5 with three
  sub-prompts), After Pull / After Merge (§6), Before New PR (§7), Docs and Governance (§16),
  Generated Files and Source Generator (§18), Final Verification and Deploy Safety (§20), Validation
  Commands Reference (§49), Safety Rules and Carve-Outs (§50), Expected Final-Report Format (§51),
  Manual Follow-Up Reporting Expectations (§52), Appendix — Repo-Specific Reminders (§53), and this
  changelog (§54).
- Migrated all 40 v1 prompts (P1–P40) into the new schema with no substance dropped:
  - v1 P1 → §8 Full UI/UX Revamp
  - v1 P2 → §9 Live Tracker Upgrade
  - v1 P3 → §10 SEO and Indexing
  - v1 P4 → §13 Shops Directory
  - v1 P5 → §14 Calculator and Tools
  - v1 P6 → §15 Data Reliability and Methodology
  - v1 P7 → §11 PWA / Service Worker / Performance (merged with v1 P21)
  - v1 P8 → §12 Arabic / RTL Quality
  - v1 P9 → §47 Repo Cleanup and Architecture
  - v1 P10 → §48 Monetization and Growth
  - v1 P11 → §19 Large PR Execution
  - v1 P12 → §17 Rebrand Maintenance (with classification table)
  - v1 P13 → §21 Homepage Hero & Above-the-Fold
  - v1 P14 → §22 Country & City Pages Deep Dive
  - v1 P15 → §23 Content Guide Library
  - v1 P16 → §24 FAQ + Structured Data
  - v1 P17 → §25 Site Search
  - v1 P18 → §26 Admin Panel UX
  - v1 P19 → §27 Newsletter & Alert System
  - v1 P20 → §28 X/Twitter Automation Polish
  - v1 P21 → §11 PWA (merged with v1 P7)
  - v1 P22 → §29 Pricing & Invest Pages
  - v1 P23 → §14 Calculator (merged into Calculator and Tools)
  - v1 P24 → §30 Chart Component
  - v1 P25 → §31 Footer, Internal Links & Breadcrumbs
  - v1 P26 → §32 Compare Countries & Today's Best Rates
  - v1 P27 → §33 Social Sharing & Embed Widget
  - v1 P28 → §34 Submit Shop & Order Gold Flows
  - v1 P29 → §35 Dark Mode & Theme System
  - v1 P30 → §36 Analytics Events Standardization
  - v1 P31 → §37 GitHub Actions Workflow Hardening
  - v1 P32 → §38 Pre-deploy, Changelog & Release
  - v1 P33 → §39 E2E & Coverage
  - v1 P34 → §40 Dependency Audit & Advisory Check
  - v1 P35 → §41 Placeholder & Stub Page Completion
  - v1 P36 → §42 Mobile-First Layout Audit
  - v1 P37 → §43 RSS Feed & News
  - v1 P38 → §44 Supabase Data Sync
  - v1 P39 → §45 404 / Error Pages & Redirect Hygiene
  - v1 P40 → §46 Image Audit & Asset Optimization
- Anchored every prompt against real repo facts (constants, manifest values, SW cache name,
  generator paths, workflow names, test files).
- Added Failure modes to watch for and Cross-references to every prompt.
- Added explicit carve-out cross-references in every prompt.
- Reorganized the Specialized Prompts (§§21–48) so meta-layer prompts (§§4–20) come first.

### v1 — pre-2026-04-30

- Original 40-prompt library with simpler INSPECT / WORK / CONSTRAINTS / VERIFY layout.
- Preserved in git history on this branch's earlier commits and at base commit `36138c9c`
  (`docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md`).
