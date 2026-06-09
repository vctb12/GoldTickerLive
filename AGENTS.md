# AGENTS.md

Canonical cross-agent charter for the Gold Ticker Live repository. Every coding agent — GitHub
Copilot (cloud agent, CLI, chat), OpenAI Codex, Claude Code, Cursor, Gemini CLI, Windsurf, Aider —
should read this file first. Agent-specific files (`CLAUDE.md`, `.github/copilot-instructions.md`)
are thin pointers back here plus tool-specific mechanics.

## Project overview

GoldTickerLive is a bilingual gold price and gold education platform for GCC and Arab-world users.
It provides spot-linked reference prices, local currency conversion, karat pricing, calculators,
country/city market pages, and trust-oriented educational content.

## Core objective

Protect user trust. Accuracy, clarity, and semantic consistency matter more than speed or content
volume.

## 1. What this repo is

Gold Ticker Live — a bilingual (EN / AR) static multi-page website publishing gold-price reference
data, calculators, country / city / market pages, and a shops directory. It ships to
`goldtickerlive.com` from GitHub Pages, with a Node/Express admin backend plus Python + GitHub
Actions automation (including an **hourly X-post workflow** that is live in production).

## 2. Core commands

```bash
# Required env vars — server/lib/auth.js throws at startup if any is missing
export JWT_SECRET=<random 32+ char string>
export ADMIN_PASSWORD=<any string>
export ADMIN_ACCESS_PIN=<6+ digit PIN>

npm install                  # install dependencies (node_modules not committed)
npm run dev                  # Vite dev server (HMR)
npm test                     # node:test suites under tests/*.test.js
npm run lint                 # ESLint (flat config in eslint.config.mjs)
npm run validate             # build integrity + DOM-safety + SEO-meta + sitemap-coverage + placeholder + analytics gates
npm run quality              # lint + prettier --check + stylelint
npm run build                # extract-baseline → normalize-shops → generateSitemap → vite build → dist/
npm run preview              # preview the production bundle
npm start                    # Node/Express admin backend on :3000
```

`npm run validate` includes `scripts/node/check-unsafe-dom.js`, which keeps a per-file baseline of
`innerHTML` / `outerHTML` / `insertAdjacentHTML` / `document.write` sinks. Adding a sink fails CI;
removing one should tighten the baseline in the same PR.

## 3. Repository map

| Path                   | What lives here                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                    | Entry HTML pages (`index.html`, `tracker.html`, `shops.html`, `calculator.html`, `invest.html`, …), `CNAME`, `robots.txt`, service worker.      |
| `src/`                 | ES modules: `src/pages/`, `src/components/`, `src/lib/`, `src/config/`, `src/tracker/`, `src/search/`.                                          |
| `styles/`              | `global.css` (tokens + primitives) and `styles/pages/*.css`.                                                                                    |
| `countries/`           | Pre-generated country / city / karat / market pages.                                                                                            |
| `content/`             | Guides, FAQ, order-gold, submit-shop, search, social, news, premium-watch, compare-countries, todays-best-rates, tools.                         |
| `admin/`               | Admin panel (Supabase GitHub OAuth).                                                                                                            |
| `server/`, `server.js` | Node/Express admin backend (JWT + bcrypt + Helmet + rate limiting + JSON file persistence).                                                     |
| `scripts/node/`        | Build, validation, audit, and enrichment scripts.                                                                                               |
| `scripts/python/`      | Automation: gold poster, spike detector, Supabase client, newsletter builder.                                                                   |
| `.github/workflows/`   | CI, deploy, codeql, semgrep, lighthouse, perf-check, hourly `post_gold.yml`, newsletters, uptime / health / spike alerts, `sync-db-to-git.yml`. |
| `tests/`               | node:test suites.                                                                                                                               |
| `docs/`                | Reference docs + the master plan (`docs/REVAMP_PLAN.md`) + proposal intake (`docs/plans/`).                                                     |

## 4. The Autonomy Contract

When you receive a short or ambiguous prompt (e.g. _"revamp UI and UX"_, _"improve SEO"_, _"fix the
homepage"_), you are expected to:

1. **Explore.** Read the relevant files. Inspect related flows, styles, dependencies, UX surfaces.
   Check reputable sources and direct competitors when useful. Map what exists and what is missing.
2. **Expand.** Translate the vague prompt into a specific, dense, achievable spec with measurable
   outcomes. Don't hide behind narrow literalism.
3. **Plan.** For anything beyond a trivial edit, write `docs/plans/YYYY-MM-DD_<slug>.md` with
   impacted files, sequence, rollback points, and a done checklist. Open it as a draft PR so the
   user can redirect cheaply.
4. **Implement.** Make substantial, coherent improvements when the task justifies them. Don't pad
   diffs; don't produce cosmetic churn; **but also don't ship timid +11/−4 edits when the task
   clearly deserves broader work.** Keep existing working behavior unless the task changes it.
5. **Verify.** Tests, lint, build, preview screenshots, Lighthouse deltas, link audits — whichever
   fit. State explicitly what was verified vs. assumed. No fake completion claims. No fake test
   claims.
6. **Ship.** PR only, never direct to `main`, never force-push. PR body: **What / Why / How / Proof
   / Risks**.

Ambition is encouraged. Big coherent changes are welcome when justified. The guardrails in §6 exist
to prevent the bad kind of bold — not the good kind.

## 5. Worked example — handling _"revamp UI and UX"_

1. **Explore.** Open `index.html`, `tracker.html`, `shops.html`, `styles/global.css`,
   `src/components/nav.js`, `src/pages/home.js`. Run the site locally (`npm run dev`) and the
   preview (`npm run build && npm run preview`) on desktop + a mobile viewport. Pull up two or three
   credible competitor sites (bullion, commodity, fintech UI patterns) for a 30-minute scan. Note
   what looks dated: typography rhythm, card density, freshness-label visibility, mobile nav drawer
   behavior, tracker hero hierarchy, Arabic RTL parity issues.
2. **Expand.** Translate to concrete deliverables: "Tighten heading scale using `--text-*` tokens;
   consolidate `.card` / `.panel` variants; rebuild mobile nav drawer sections with `<details>`; add
   freshness pill to homepage hero; make karat strip scannable on 360 px; verify RTL for every
   changed surface." Measurable outcomes: Lighthouse performance ≥ current baseline; no new
   DOM-safety sink; `tests/nav-data.test.js` stays green; every visible copy change ships in EN +
   AR.
3. **Plan.** Write `docs/plans/2026-04-23_ui-ux-revamp.md` listing impacted files, the proposed
   commit sequence, rollback points (each section is a reversible commit), and a done checklist tied
   to the deliverables. Open a draft PR with just the plan so the owner can redirect before
   implementation cost is sunk.
4. **Implement.** Land the plan as a coherent multi-commit PR. Keep diffs focused per-concern —
   token update, then surface, then nav drawer, then hero — but don't split mechanically into
   trivial bits.
5. **Verify.** `npm run validate`, `npm test`, `npm run quality`, `npm run build`; attach
   before/after screenshots at desktop + 360 px for every touched surface; RTL spot-check;
   DOM-safety baseline delta.
6. **Ship.** PR body: What changed, why, how it's structured, what was verified, what wasn't, and
   the risks.

For a one-line bug fix, collapse steps 2–3 into a sentence in the PR body.

## 6. Product-trust guardrails

Non-negotiables. Each has a one-line _Why:_ so you can make good edge-case decisions. Cursor agents
load `.cursor/rules/non-negotiable-rules.mdc` (always applied) plus topic rules:
`pricing-trust.mdc`, `bilingual-content.mdc`, `seo-structure.mdc`.

### Product-trust non-negotiables

1. **Reference prices are not retail shop quotes.** Never present a spot-linked reference price as a
   guaranteed in-store purchase price. If content compares market/reference pricing and shop
   pricing, the distinction must remain explicit. _Why:_ the site's entire credibility rests on this
   distinction; retail quotes include making charges, premiums, and tax.
2. **Freshness labels must be exact.** The terms `live`, `updated`, `cached`, and `delayed` must not
   be used loosely. If data is not truly live, do not call it live. Cached, fallback, estimated,
   delayed, or derived values must be visibly labelled with source and timestamp. _Why:_ labelled
   stale data is honest; unlabelled stale data is a trust violation.
3. **Freshness labels, disclaimers, and methodology notes are product elements, not decoration.**
   _Why:_ removing them re-introduces the exact ambiguity guardrails 1–2 are guarding against.
4. **English and Arabic must match in meaning.** Semantic parity is required between EN and AR. One
   language must not make stronger promises or claims than the other. Natural phrasing is preferred
   over literal translation. User-visible strings live in `src/config/translations.js`. _Why:_ tests
   enforce it and half-landed copy is a visible bug.
5. **Country and city pages must strengthen internal linking.** Local pages should connect users to
   related country pages, calculators, methodology pages, and related market content. Avoid creating
   orphaned or weakly connected local pages. _Why:_ weak local pages hurt discovery and trust.
6. **Metadata and technical SEO are product quality.** Schema, canonicals, metadata, hreflang, and
   internal linking are part of core product integrity. Don't silently change canonical URLs,
   `robots.txt`, sitemap structure, `og:*` / `twitter:*` tags, or `CNAME`. Schema changes need a
   migration note. Agents must flag missing, conflicting, or misleading implementations. _Why:_
   measurable ranking regression risk and misleading metadata erode trust.
7. **Trust-first language is mandatory.** Avoid hype, fake precision, clickbait, or exaggerated
   certainty. Do not imply financial advice unless a page is explicitly designed for that purpose.
   _Why:_ overstated claims undermine the reference-pricing mission.

### Operational guardrails

8. **Static multi-page architecture stays static.** Don't migrate to an SPA / framework without an
   explicit request. _Why:_ SPA migration is a separate, owner-approved program.
9. **DOM-safety baseline doesn't regress.** Use helpers from `src/lib/safe-dom.js` (`escape`,
   `safeHref`, `safeTel`, `el`, `clear`); prefer `node.replaceChildren()` over
   `node.innerHTML = ''`. _Why:_ the baseline is the repo's only XSS regression guard, and CI blocks
   sink growth.
10. **No secrets in git.** Use GitHub Secrets only; never echo them into logs or workflow outputs.
    _Why:_ this is a public repo.
11. **PR-only workflow.** No direct commits to `main`, no force-push. _Why:_ `main` is protected and
    the live site deploys from it.
12. **The hourly `post_gold.yml` Actions workflow is production.** Any change to it needs a plan
    entry and must not break the `scripts/python/utils/*` import layout. _Why:_ it auto-posts to a
    public channel every hour — breakage is public within the hour.
13. **Honesty about verification.** Separate what you ran from what you assumed. Don't claim tests
    pass that you didn't run. _Why:_ the one rule that makes every other claim in a PR body legible.

### Terminology policy

Use consistently in code, copy, automations, and reviews — see
`.cursor/rules/non-negotiable-rules.mdc` for full definitions.

| Term                | Use when                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Reference price** | Market-linked or spot-linked informational estimate — not a final retail jewelry quote      |
| **Retail quote**    | Final or near-final store/seller price (may include making charges, premiums, tax, spreads) |
| **Live**            | Value updated in real time or near-real time from the active source                         |
| **Updated**         | Data refreshed periodically but not continuously                                            |
| **Cached**          | Stored data from a prior fetch or processing cycle                                          |
| **Delayed**         | Data intentionally lags the source by a known or expected interval                          |

### Review priorities

When multiple issues exist, address in this order: (1) price accuracy and karat math, (2) misleading
trust/freshness language, (3) EN/AR semantic mismatch, (4) broken
canonicals/hreflang/schema/metadata, (5) internal linking regressions, (6) lower-risk style or copy.

### Action rules

- Block or strongly flag changes that mislead on price accuracy, freshness, or retail-vs-reference
  interpretation.
- Comment on SEO, schema, metadata, and internal linking with exact fixes.
- Suggest exact EN/AR rewrite pairs for mismatches.
- Prefer minimal diffs and implementation-ready fixes.

## 7. Style & conventions

- **JS:** vanilla ES modules; no new frameworks; `camelCase`; prefer narrow, focused modules under
  `src/lib/`.
- **CSS:** use canonical tokens from `styles/global.css` (`--color-*`, `--surface-*`, `--space-*`,
  `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--duration-*`). Don't hand-pick hex or raw
  rem where a token exists.
- **Strings:** every user-visible string in `src/config/translations.js` — never hard-code UI text.
- **Motion:** every animation respects `prefers-reduced-motion: reduce` (there is a global reset in
  `styles/global.css`).
- **Dependencies:** check the GitHub Advisory DB before adding anything new; don't bump versions as
  drive-by changes.
- **Python imports:** entrypoints in `scripts/python/` add `scripts/python/` to `sys.path`;
  relative-import `utils.*` via that path.
- **Safe DOM:** `src/lib/safe-dom.js` is the only sanctioned home for new `innerHTML`-style writes.

## 8. Done criteria

- **Small fix / copy change:** tests + lint pass locally; PR body lists what you verified; bilingual
  parity if the copy is user-visible.
- **Feature / component change:** add / update tests where there is an existing test pattern;
  `npm run validate` and `npm run build` green; before/after screenshot for visible surfaces; RTL
  spot-check for layouts.
- **Plan-driven revamp:** the plan file's done checklist is ticked with evidence (screenshot, test
  name, Lighthouse number); no guardrail in §6 is weakened without the owner opting in.
- Never claim "done" or "fixed" you didn't verify.

## 9. Where the plan lives

- **Master workbook (canonical for agents):** `docs/GOLD_TICKER_LIVE_MASTER_WORKBOOK.md` — product
  vision, evidence-backed gaps, numbered WB sessions, discovery scanners, verification. Session log:
  `docs/workbook/WORKBOOK_SESSION_REGISTRY.md`. Composer:
  `@.github/prompts/master-workbook-session.prompt.md`.
- **Master plan:** `docs/REVAMP_PLAN.md` — tracks in progress, decisions, production tracks, issues,
  backlog. Update the specific section you touched in the same PR.
- **Proposal intake:** `docs/plans/` — raw captures from prompts, plus `docs/plans/README.md`
  (priority matrix). New plans follow `docs/plans/YYYY-MM-DD_<slug>.md`.
- **Reference docs:** `docs/ARCHITECTURE.md`, `docs/DESIGN_TOKENS.md`, `docs/ACCESSIBILITY.md`,
  `docs/PERFORMANCE.md`, `docs/SEO_STRATEGY.md`, `docs/SEO_CHECKLIST.md`, `docs/EDIT_GUIDE.md`,
  `docs/AUTOMATIONS.md`, `docs/environment-variables.md`, `docs/tracker-state.md`. Agent rules don't
  live in `docs/`; this file owns them.
- **GitHub control center:** `PLAN.md` (active queue), `prompts/master-rerun.md` (session
  bootstrap), `docs/REPOS_TO_STEAL_FROM.md` (external repo catalog),
  `docs/plans/2026-06-09_github-control-center-setup.md` (CI + issue template map). Quality gates:
  `.github/workflows/ci.yml`, `lighthouse.yml`, `link-check.yml`.

## 10. Agent-specific notes

- **GitHub Copilot** — cloud agent / CLI / chat read `.github/copilot-instructions.md`, which points
  back here. Use `report_progress` to commit + push; use the GitHub MCP tools for CI investigation;
  never use `git push` directly.
- **Claude Code** — prefers `CLAUDE.md`, which points here and adds Claude-only mechanics
  (subagents, skills).
- **Cursor** — modular rules in `.cursor/rules/*.mdc` (migrated from legacy `.cursorrules`). MCP
  config lives in `.cursor/mcp.json`. Full handover reference: `docs/CURSOR_HANDOVER.md`. **Start
  every session** with `prompts/master-rerun.md` or `@.github/prompts/master-rerun.prompt.md` (rules
  can be inconsistent in background agents — checked-in docs win). For domain-specific tasks,
  @-mention the relevant `.github/instructions/*.instructions.md` file. Use Composer for multi-file
  changes following the Autonomy Contract (§4 above).
- **Codex / Windsurf / Aider / Gemini CLI** — read this file directly per the
  [`AGENTS.md`](https://agents.md) convention (stewarded by the Agentic AI Foundation). No
  vendor-specific branches in this file.

## Cursor Cloud specific instructions

### Environment

- Node.js 24 is required (`.nvmrc`). The update script handles `nvm install 24` automatically.
- No Docker, databases, or external services are needed for local development. The backend uses JSON
  file persistence in `data/`.

### Required env vars for running tests or the backend

```bash
export JWT_SECRET="dev-secret-key-for-local-development-32chars"
export ADMIN_PASSWORD="admin-dev-password"
export ADMIN_ACCESS_PIN="123456"
```

These must be set before `npm test` or `npm start`. The Vite dev server (`npm run dev`) does not
require them.

### Running services

| Service             | Command       | Port | Notes                         |
| ------------------- | ------------- | ---- | ----------------------------- |
| Frontend (Vite HMR) | `npm run dev` | 5000 | No env vars needed            |
| Backend (Express)   | `npm start`   | 3000 | Requires all 3 env vars above |

### Key commands (see §2 above for full list)

- `npm test` — 745 tests; 1 pre-existing failure in `tests/analytics.test.js` (Node 24 `navigator`
  getter issue)
- `npm run lint` — ESLint flat config
- `npm run build` — full production build pipeline
- `npm run validate` — CI-equivalent integrity checks

### Admin API login for testing

```
POST http://localhost:3000/api/admin/auth/login
{"email": "admin@goldprices.com", "password": "<ADMIN_PASSWORD env var value>"}
```

Returns a JWT token for authenticated endpoints at `/api/admin/*`.
