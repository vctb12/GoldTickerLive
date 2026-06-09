# Gold Ticker Live — GitHub Control Center Setup

```yaml plan-status
status: active
priority: P1
class: meta
owner: @vctb12
created: "2026-06-09"
last_updated: "2026-06-09"
next_action: "Extend REPOS_TO_STEAL_FROM.md as you evaluate repos; run Lighthouse after major UI PRs"
```

> **Goal:** Make `vctb12/GoldTickerLive` the control center for AI-driven, repeatable work — not a
> pile of copied repos. GitHub Actions runs quality gates; checked-in docs and prompts boot every
> session; external repos are studied or borrowed feature-by-feature.

---

## What this repo already had (2026-06-09 audit)

Most of the “first setup” from generic GitHub advice is **already shipped**. This plan documents the
canonical mapping so agents do not rebuild what exists.

| Prompt suggestion                     | GoldTickerLive reality                                                                                 | Status                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| `ci.yml` — lint, test, build          | `.github/workflows/ci.yml` — validate, quality, unit tests, build, Playwright smoke, link baseline     | ✅ Exists (Tier 1 merge gate)    |
| `lighthouse.yml` — perf/a11y/SEO scan | `.github/workflows/lighthouse.yml` — manual LHCI (`workflow_dispatch`)                                 | ✅ Exists (Tier 2 informational) |
| `link-check.yml` — broken links       | `.github/workflows/link-check.yml` + link steps inside `ci.yml`                                        | ✅ Added / documented            |
| `docs/PLAN.md` — roadmap              | Root [`PLAN.md`](../../PLAN.md) + [`docs/PLAN.md`](../PLAN.md) pointer                                 | ✅ Canonical at repo root        |
| `docs/ARCHITECTURE.md`                | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)                                                           | ✅ Exists                        |
| `prompts/master-rerun.md`             | [`prompts/master-rerun.md`](../../prompts/master-rerun.md) + `@.github/prompts/master-rerun.prompt.md` | ✅ Added                         |
| `.github/ISSUE_TEMPLATE/`             | bug, feature, polish, performance                                                                      | ✅ Extended                      |
| `REPOS_TO_STEAL_FROM.md`              | [`docs/REPOS_TO_STEAL_FROM.md`](../REPOS_TO_STEAL_FROM.md)                                             | ✅ Added                         |

**Beyond the starter trio:** additional workflows (deploy, CodeQL, gold fetch/post, newsletters,
uptime, bakeoff, etc.). Registry:
[`.github/workflows/README.md`](../../.github/workflows/README.md).

**GitHub Spark:** optional later — separate product path; not required for Claude Pro + Cursor Pro.

---

## Folder structure (control center)

```text
GoldTickerLive/
├── PLAN.md                          # Active task queue (agents: read first)
├── AGENTS.md                        # Cross-agent charter
├── prompts/
│   └── master-rerun.md              # Copy-paste session bootstrap (Claude/Cursor)
├── docs/
│   ├── PLAN.md                      # Pointer → ../../PLAN.md
│   ├── ARCHITECTURE.md              # System map
│   ├── REPOS_TO_STEAL_FROM.md       # External repo catalog (use/fork/study)
│   └── plans/
│       └── 2026-06-09_github-control-center-setup.md  # This file
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                   # Tier 1 — required merge gate
│   │   ├── lighthouse.yml           # Tier 2 — manual Lighthouse
│   │   ├── link-check.yml           # Tier 2 — focused link audit
│   │   └── README.md                # Workflow tier registry
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   ├── polish_report.md
│   │   └── performance_issue.md
│   └── prompts/                     # @-mention targets in Composer/Copilot
│       ├── master-rerun.prompt.md
│       └── session-pick-next-work.prompt.md
└── .cursor/rules/                   # Cursor-specific rules (mirror AGENTS.md guardrails)
```

---

## Three automation workflows (starter mental model)

### 1. `ci.yml` — merge gate

**Trigger:** every push to `main`, every PR, nightly schedule (03:00 UTC).

**Protects:** `npm run validate`, `npm run quality`, `npm test`, production build, sitemap coverage,
internal link baseline (`enforce-linkcheck.js`), Playwright smoke.

**Do not** weaken this to add experimental checks. Graduate checks here only after they are stable
in Tier 2.

### 2. `lighthouse.yml` — performance / a11y / SEO snapshot

**Trigger:** `workflow_dispatch`; PRs touching `**.html`, `styles/**`, `src/**`, or
`lighthouserc.json`.

**Use when:** major UI changes (homepage, tracker, nav). Config: root `lighthouserc.json` (4
canonical URLs). Uploads `.lighthouseci/` artifact.

**Related:** `perf-check.yml` (Playwright + image audit, non-blocking on every PR).

### 3. `link-check.yml` — focused link audit

**Trigger:** `workflow_dispatch`; PRs touching HTML/content/countries; nightly schedule (04:00 UTC).

**Use when:** content-only PRs where you want link signal without waiting for full E2E.

**Note:** `ci.yml` also runs link checks on every PR — this workflow is a lighter, path-filtered
rerun.

---

## Issue templates

| Template        | Label         | When to use                          |
| --------------- | ------------- | ------------------------------------ |
| Bug Report      | `bug`         | Broken feature or incorrect data     |
| Feature Request | `enhancement` | New capability                       |
| Polish / UX     | `polish`      | Visual, copy, RTL, interaction gaps  |
| Performance     | `performance` | Slow load, layout shift, bundle size |

Open via **Issues → New issue** on GitHub.

---

## Session workflow (3 modes for external repos)

| Mode               | When                            | Example                                      |
| ------------------ | ------------------------------- | -------------------------------------------- |
| **Use directly**   | OSS solves one narrow feature   | Borrow a chart pattern, not a full dashboard |
| **Fork and adapt** | Architecture is close           | Admin panel patterns, CI examples            |
| **Study only**     | UX / file structure inspiration | Premium finance dashboards                   |

Catalog: [`docs/REPOS_TO_STEAL_FROM.md`](../REPOS_TO_STEAL_FROM.md). **Always check LICENSE** before
copying code.

---

## Agent session bootstrap

Every Claude/Cursor session should start from checked-in instructions, not memory:

1. Read [`AGENTS.md`](../../AGENTS.md)
2. Read [`PLAN.md`](../../PLAN.md)
3. Run or paste [`prompts/master-rerun.md`](../../prompts/master-rerun.md)
4. Pick a scoped slice; verify with `npm test` / `npm run validate` / `npm run build` as applicable
5. Update `PLAN.md` in the same PR

**Cursor background-agent note:** rules in `.cursor/rules/` can be inconsistent across sessions —
treat `AGENTS.md`, `PLAN.md`, and the prompt body as the source of truth.

---

## Done checklist

- [x] Document existing vs missing GitHub setup (this file)
- [x] `docs/REPOS_TO_STEAL_FROM.md` starter catalog
- [x] `prompts/master-rerun.md` + `.github/prompts/master-rerun.prompt.md`
- [x] `docs/PLAN.md` pointer to root `PLAN.md`
- [x] Issue templates: polish + performance
- [x] Standalone `link-check.yml` workflow
- [x] Update `.github/workflows/README.md` tier table
- [x] `.github/labels.yml` + `sync-labels.yml` (`polish`, `performance` labels)
- [x] `lighthouserc.json` + PR path triggers on `lighthouse.yml`
- [x] README + `AGENTS.md` + `AI_PROMPT_LIBRARY.md` wired to control center
- [ ] Owner: review REPOS catalog quarterly; add rows only for one clear GTL problem each

---

## Rollback

| Change           | Rollback                                             |
| ---------------- | ---------------------------------------------------- |
| `link-check.yml` | Delete workflow file; link checks remain in `ci.yml` |
| Issue templates  | Revert `.github/ISSUE_TEMPLATE/*`                    |
| Docs only        | Revert this PR — no runtime impact                   |

---

## Risks

- **Duplicate automation:** `link-check.yml` overlaps `ci.yml` link steps by design; do not make
  both fail-hard on the same baseline without coordinating thresholds.
- **Repo clutter:** `REPOS_TO_STEAL_FROM.md` must stay curated — one row per clear problem, not
  “cool repos.”
- **Production workflows:** never touch `post_gold.yml`, `gold-price-fetch.yml`,
  `data/gold_price.json`, `sw.js`, `src/config/constants.js` in a docs/automation PR without owner
  approval.
