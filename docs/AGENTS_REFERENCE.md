# AGENTS.md — extended reference

> Moved here to keep [`AGENTS.md`](../AGENTS.md) compact. Load on demand — not required at session
> start.

## Repository map

| Path                   | What lives here                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| `/`                    | Entry HTML pages, `CNAME`, `robots.txt`, service worker                |
| `src/`                 | ES modules: pages, components, lib, config, tracker, search            |
| `styles/`              | `global.css` tokens + `styles/pages/*.css`                             |
| `countries/`           | Pre-generated country / city / karat / market pages                    |
| `content/`             | Guides, FAQ, tools, news, compare-countries, etc.                      |
| `admin/`               | Admin panel (Supabase GitHub OAuth)                                    |
| `server/`, `server.js` | Node/Express admin backend                                             |
| `scripts/node/`        | Build, validation, audit scripts                                       |
| `scripts/python/`      | Gold poster, spike detector, Supabase client, newsletters              |
| `.github/workflows/`   | CI, deploy, hourly `post_gold.yml`, price fetch, alerts                |
| `tests/`               | node:test suites                                                       |
| `docs/`                | Architecture, plans (`docs/REVAMP_PLAN.md`), proposals (`docs/plans/`) |

## Autonomy Contract (full)

When you receive a short or ambiguous prompt:

1. **Explore** — read relevant files, map what exists and what is missing.
2. **Expand** — translate to a specific spec with measurable outcomes.
3. **Plan** — for non-trivial work, write `docs/plans/YYYY-MM-DD_<slug>.md`; open draft PR early.
4. **Implement** — coherent improvements; no cosmetic churn; no timid +11/−4 when task deserves
   more.
5. **Verify** — state what you ran vs. assumed. No fake test claims.
6. **Ship** — PR only; body: **What / Why / How / Proof / Risks**.

For a one-line bug fix, collapse plan into a sentence in the PR body.

## Worked example — _"revamp UI and UX"_

Explore `index.html`, `tracker.html`, `styles/global.css`, `src/components/nav.js`. Run
`npm run dev` and preview at desktop + 360 px. Expand to: tokenized heading scale, freshness pill on
hero, karat strip at 360 px, RTL verification. Plan in `docs/plans/`. Implement per-concern commits.
Verify `npm run validate`, `npm test`, `npm run build`, screenshots.

## Done criteria

- **Small fix:** tests + lint; bilingual parity if copy changed.
- **Feature:** add/update tests; `npm run validate` + `npm run build`; RTL spot-check.
- **Plan-driven revamp:** plan checklist ticked with evidence; no guardrail weakened without owner
  opt-in.

## Where plans and docs live

- **Workbook:** `docs/GOLD_TICKER_LIVE_MASTER_WORKBOOK.md` —
  `@.github/prompts/master-workbook-session.prompt.md`
- **Master plan:** `docs/REVAMP_PLAN.md` — update section you touched in same PR
- **Proposals:** `docs/plans/README.md`, `docs/plans/YYYY-MM-DD_<slug>.md`
- **Control center:** `PLAN.md`, `prompts/master-rerun.md`, `docs/REPOS_TO_STEAL_FROM.md`
- **Reference:** `docs/ARCHITECTURE.md`, `docs/DESIGN_TOKENS.md`, `docs/SEO_STRATEGY.md`,
  `docs/CURSOR_HANDOVER.md`

## Agent-specific mechanics

- **Copilot** — `.github/copilot-instructions.md`; use `report_progress`; GitHub MCP for CI.
- **Claude Code** — `CLAUDE.md` for subagents/skills.
- **Cursor** — `.cursor/rules/*.mdc`; start with `prompts/master-rerun.md`; automation prompts
  include rules preamble (`.github/prompts/_rules-preamble.md`).
- **Codex / Windsurf / Aider / Gemini CLI** — read `AGENTS.md` per [agents.md](https://agents.md)
  convention.

## Cursor Cloud environment

- Node.js 24 (`.nvmrc`). No Docker required for local dev.
- Env vars for `npm test` / `npm start`:

```bash
export JWT_SECRET="dev-secret-key-for-local-development-32chars"
export ADMIN_PASSWORD="admin-dev-password"
export ADMIN_ACCESS_PIN="123456"
```

| Service  | Command       | Port |
| -------- | ------------- | ---- |
| Vite dev | `npm run dev` | 5000 |
| Express  | `npm start`   | 3000 |

- `npm test` — ~745 tests; 1 pre-existing failure in `tests/analytics.test.js` (Node 24).
- Admin login: `POST /api/admin/auth/login` with `admin@goldprices.com` + `ADMIN_PASSWORD`.
