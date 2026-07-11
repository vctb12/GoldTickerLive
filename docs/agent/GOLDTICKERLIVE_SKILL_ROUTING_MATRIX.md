# GoldTickerLive — Skill Routing Matrix

**Created:** 2026-07-11 · **Owner:** Premium Product Revamp coordinator · **Status:** living
document

> Purpose: route the right skill to the right workstream **without** loading every skill in every
> session. Loading all skills wastes context, duplicates instructions, and inflates usage. Read this
> matrix first; load a skill's full instructions **only** when its trigger fires for the current
> wave. This document is the distilled memory of what each skill is for on _this_ repo.
>
> Governance note: the canonical phase tracker is
> [`docs/AGENT_MASTER_TRACKER.md`](../AGENT_MASTER_TRACKER.md). This matrix does **not** duplicate
> phase status — it only maps skills → workstreams. The master revamp plan is
> [`docs/revamp/2026-07-11_PREMIUM_PRODUCT_UI_UX_REVAMP.md`](../revamp/2026-07-11_PREMIUM_PRODUCT_UI_UX_REVAMP.md).

## How to use

1. Classify the task (see the wave map in the revamp plan).
2. Find the workstream row(s) below; load only the **Core** skill(s) for it.
3. Load a **Conditional** skill only when its explicit trigger is met.
4. Never invoke a skill merely to claim it was used — every invocation must produce a concrete
   improvement (implementation, test, a11y, perf, docs, UX, data-integrity, or reduced
   duplication/risk). Otherwise record it **Inactive** and move on.

## Status legend

- **Core** — used in most sessions touching this workstream.
- **Conditional** — used only when a specific trigger fires.
- **Inactive** — not relevant to the website revamp today; do not invoke to pad a report.

## Coordinator rule (single owner of execution)

Exactly **one** coordinator owns the master plan, workstream boundaries, dependency map, shared-file
locks, phase status, PR ordering, verification gates, and acceptance. Orchestration skills
(`agent-orchestration-*`, `agent-workflow-designer`, `subagent-driven-development`,
`dispatching-parallel-agents`) **advise** the coordinator; they must not spin up competing execution
models. Subagents may research/audit/test/implement **file-disjoint** scopes only.

---

## 1. Always-on execution & governance

| Skill                                              | Status      | Trigger on this repo                                   | Notes                                                                   |
| -------------------------------------------------- | ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `agents-md`                                        | Core        | Every session                                          | `AGENTS.md` is canonical; obey non-negotiable pricing/trust rules.      |
| `verification-before-completion`                   | Core        | Before marking any phase done                          | Gate: lint + test + validate + build, EN/AR, a11y, prod check.          |
| `using-git-worktrees`                              | Conditional | Only when running truly parallel file-disjoint edits   | Overkill for a single sequential slice.                                 |
| `writing-plans` / `executing-plans`                | Core        | Any non-trivial task                                   | Plans live in `docs/plans/` or `docs/revamp/`.                          |
| `subagent-driven-development`                      | Conditional | Task decomposes into many independent research threads | Prefer direct view/grep for single-file lookups.                        |
| `dispatching-parallel-agents`                      | Conditional | ≥3 file-disjoint scopes ready at once                  | Never let two agents edit the same shared file.                         |
| `finishing-a-development-branch`                   | Core        | Before opening a PR                                    | Ensure gates green + tracker updated.                                   |
| `requesting-code-review` / `receiving-code-review` | Core        | Every PR                                               | Pair with `pre-pr-review` skill (repo-local).                           |
| `address-github-comments`                          | Conditional | PR has review comments / CI failures                   | Investigate each event before acting.                                   |
| `architecture-decision-records`                    | Core        | Any material design/architecture choice                | Store under `docs/` ADR path; keeps future sessions from re-litigating. |
| `changelog-generator`                              | Conditional | User-visible shipped change                            | Repo already has `scripts/node/changelog.js` + `CHANGELOG.md`.          |
| `adversarial-reviewer`                             | Core        | Before shipping trust/pricing/i18n changes             | Try to _refute_ the change; default to skeptical.                       |
| `brainstorming`                                    | Conditional | Genuinely open design space                            | Not for reversible mechanics (see Autonomous Decision Rule).            |
| `agent-memory-systems` / `agent-memory-mcp`        | Conditional | Durable repo-wide fact worth persisting                | Store conventions/invariants with citations, not session state.         |

## 2. Repo-local skills (highest priority — purpose-built for GoldTickerLive)

| Skill                                | Status      | Trigger                                                 | Notes                                                                     |
| ------------------------------------ | ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| `audit-reverify`                     | Core        | Before executing any batch of fixes from an older audit | **Prevents no-op PRs.** Used this session: confirmed DP-4b already fixed. |
| `pre-pr-review`                      | Core        | Before opening any PR                                   | Runs verification suite + adversarial diff review; go/no-go.              |
| `pricing-data-integrity` (skill lib) | Core        | Any price surface, freshness label, provider change     | Peg 3.6725, spot≠retail, freshness contract.                              |
| `mobile-ux-review`                   | Core        | Any layout/RTL/mobile change                            | 360–430px, EN+AR checklists under `.github/skills/`.                      |
| `seo-governance`                     | Core        | Canonical / hreflang / sitemap / schema / noindex       | `npm run seo:governance`; never hand-edit sitemap.                        |
| `gold-ticker-live-audit`             | Core        | PR review / release gate                                | Whole-product audit lens.                                                 |
| `github-actions-debug`               | Conditional | CI / workflow failure                                   | Use GitHub MCP `get_job_logs` etc.                                        |
| `backend-admin-supabase`             | Conditional | Touching `server/` or Supabase                          | Pair with `security-review`.                                              |
| `dataviz`                            | Core        | Any chart/table/stat-tile work                          | Shared chart tokens; no rainbow, no red/green-only, provide table view.   |
| `verify` / `run`                     | Core        | Confirming a change works in the real app               | Build + serve `dist/` + Chromium (`executablePath` = pre-installed).      |

## 3. Design-system & visual-product

| Skill                                               | Status      | Trigger                                         | Notes                                                             |
| --------------------------------------------------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `brand-guidelines`                                  | Core        | Any visual identity / token change              | Restrained gold; parchment light / graphite dark already defined. |
| `theme-factory`                                     | Conditional | New theme variant or token architecture change  | Tokens already in `styles/partials/tokens.css`.                   |
| `apple-hig-expert`                                  | Conditional | Interaction/affordance polish                   | Inspiration, not imitation.                                       |
| `site-architecture`                                 | Conditional | IA / nav grouping / route changes               | Shell is JS-injected (`src/components/nav.js`).                   |
| `a11y-audit`                                        | Core        | Throughout implementation (not just at the end) | Combine automated (`pa11y`, `axe`) + manual.                      |
| `copywriting` / `copy-editing` / `content-strategy` | Conditional | Editorial copy, methodology, learn              | EN/AR semantic parity; strings in `translations.js`.              |
| `canvas-design` / `web-artifacts-builder`           | Conditional | Standalone mockup/prototype artifact            | Must be labelled prototype, isolated from prod.                   |
| `image`                                             | Conditional | Editorial/OG imagery with real product value    | No stock-finance filler; no gold-bar clichés.                     |
| `3d-ui` / `3d-web-experience` / `algorithmic-art`   | Inactive    | Only after perf + a11y review proves value      | Do **not** add 3D/generative art decoratively.                    |
| `learn`                                             | Conditional | Learn-hub pedagogy                              | Repo has `src/learn-hub/`.                                        |

## 4. Frontend, testing & browser-quality

| Skill                                                                     | Status      | Trigger                                    | Notes                                                 |
| ------------------------------------------------------------------------- | ----------- | ------------------------------------------ | ----------------------------------------------------- |
| `webapp-testing` / `browser-automation`                                   | Core        | Any interactive component change           | Playwright configured; pre-installed Chromium.        |
| `test-driven-development`                                                 | Core        | New logic/util                             | `node --test` suite (~1400 tests) is the safety net.  |
| `systematic-debugging`                                                    | Conditional | A real defect is reproduced                | Reproduce → isolate → fix → lock with a test.         |
| `browserstack`                                                            | Conditional | Real-device Safari/WebKit matrix needed    | Only if BrowserStack creds present.                   |
| `ci-cd-pipeline-builder`                                                  | Conditional | CI workflow change (owner-gated surfaces!) | `ci.yml` is the merge gate.                           |
| `api-test-suite-builder` / `api-design-reviewer` / `api-endpoint-builder` | Conditional | Public API / admin endpoints               | Server under `server/`.                               |
| `ab-test-setup` / `ab-testing`                                            | Conditional | Only after baseline analytics exist        | Do not launch tests without success metrics.          |
| `analytics-tracking` / `analytics`                                        | Conditional | Event taxonomy work                        | `docs/analytics-event-map.md`, 38 events inventoried. |

## 5. Backend / APIs / data / infra

| Skill                                                                       | Status      | Trigger                                                  | Notes                                                 |
| --------------------------------------------------------------------------- | ----------- | -------------------------------------------------------- | ----------------------------------------------------- |
| `backend-dev-guidelines` / `backend-architect`                              | Conditional | Server/data-layer change                                 | Static-MPA-first; no SPA migration without owner ask. |
| `auth-implementation-patterns`                                              | Conditional | Real auth surface (owner-gated)                          | Supabase RLS/signup is owner-gated.                   |
| `aws-serverless` / `aws-solution-architect`                                 | Inactive    | Only with a justified ADR                                | Do not introduce AWS **and** Azure together.          |
| `azure-cloud-architect` / `agent-framework-azure-ai-py`                     | Inactive    | Only if Azure AI selected in ADR                         | Hosting is GitHub Pages today.                        |
| `capacity-planner`                                                          | Conditional | Data-heavy charts/alerts/API/AI added                    | Model load before shipping heavy features.            |
| `chaos-engineering`                                                         | Inactive    | Only after stable provider abstraction                   | Premature today.                                      |
| `mcp-builder`                                                               | Inactive    | Only if an MCP product provides value                    | Not justified now.                                    |
| `alpha-vantage-automation` / `agentql-automation` / `apify-lead-generation` | Inactive    | Evaluate provider only w/ license+freshness+rights check | Must not auto-become authoritative metals provider.   |

## 6. SEO / acquisition / conversion / growth

| Skill                                                                                                                                                                                                                                                                                                                                                                                                   | Status      | Trigger                                              | Notes                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `seo-audit` / `schema` / `aeo` / `ai-seo`                                                                                                                                                                                                                                                                                                                                                               | Conditional | SEO/AEO wave                                         | Schema must match visible content; no misrepresentation.     |
| `programmatic-seo`                                                                                                                                                                                                                                                                                                                                                                                      | Conditional | Country/market page expansion                        | Genuine utility only — no doorway/thin pages.                |
| `content-strategy` / `product-marketing` / `marketing-*` / `cro` / `pricing` / `offers`                                                                                                                                                                                                                                                                                                                 | Conditional | Conversion/positioning wave                          | No dark patterns, no fake scarcity.                          |
| `customer-research` / `competitor-profiling` / `competitors`                                                                                                                                                                                                                                                                                                                                            | Conditional | Positioning research                                 | Inspiration not imitation.                                   |
| `onboarding` / `signup` / `popups` / `emails` / `social` / `video` / `ads` / `ad-creative` / `lead-magnets` / `free-tools` / `launch` / `public-relations` / `community-marketing` / `co-marketing` / `directory-submissions` / `sales-enablement` / `revops` / `prospecting` / `aso` / `app-store-optimization` / `campaign-analytics` / `marketing-plan` / `marketing-ideas` / `marketing-psychology` | Inactive    | Growth waves (5/7) — after core quality is protected | Do not hijack the engineering mission; no aggressive popups. |

## 7. AI product features (Wave 6 — gated)

| Skill                                      | Status         | Trigger                             | Notes                                                         |
| ------------------------------------------ | -------------- | ----------------------------------- | ------------------------------------------------------------- |
| `agent-evaluation` / `advanced-evaluation` | Conditional    | Before any AI feature is prod-ready | Build eval cases first (price retrieval, refusal, injection). |
| `agentic-actions-auditor`                  | Conditional    | AI tool-permission review           | Deterministic pricing tools; never invent prices.             |
| Paid-AI provider integration               | Inactive/Gated | Owner decision (recurring cost)     | AI stays informational-only; no advice/predictions.           |

## 8. Conditional creative & automation

| Skill                                                     | Status      | Trigger                                     | Notes                            |
| --------------------------------------------------------- | ----------- | ------------------------------------------- | -------------------------------- |
| `abyssale-automation` / `ad-creative` / `video` / `image` | Inactive    | Real creative-asset need with product value | Not for decorative noise.        |
| `slack-gif-creator`                                       | Inactive    | Never for the website revamp                | Only a real internal-comms need. |
| `internal-comms`                                          | Conditional | Structured release/stakeholder update       | Not product code.                |

---

## Conflict resolution (preferred skill when overlap)

- **Pricing vs generic backend:** `pricing-data-integrity` wins over `backend-dev-guidelines` for
  any number a user sees.
- **Repo-local audit vs generic audit:** `gold-ticker-live-audit` / `audit-reverify` win over
  generic `seo-audit`/`a11y-audit` for scoping; generic skills supply depth within scope.
- **Charts:** `dataviz` owns chart color/mark/interaction rules; page skills defer to it.
- **i18n/RTL:** `mobile-ux-review` + AGENTS.md bilingual policy win; content skills supply copy.
- **Multiple orchestrators:** the single coordinator wins; others advise only.

## Session log (which skill was last used where)

| Date       | Skill            | Where / why                                                                                                           |
| ---------- | ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| 2026-07-11 | `audit-reverify` | Verified DP-4b (tracker `?lang=` first-load) is **already fixed** in `src/tracker/state.js:110` — avoided a no-op PR. |
| 2026-07-11 | `verify`/`run`   | Built `dist/`, served it, rendered EN/AR pages in pre-installed Chromium for real console/overflow evidence.          |
| 2026-07-11 | `agents-md`      | Re-read charter; confirmed invariants before any edit.                                                                |
