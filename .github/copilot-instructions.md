# GitHub Copilot Instructions — Gold Ticker Live

> **Read `AGENTS.md` first.** It is the canonical cross-agent charter. This file is Copilot-specific
> mechanics + a fast-onboarding pointer into the **AI-Agent Operating System** under `.github/` and
> `docs/`.

- Repo: `vctb12/GoldTickerLive` (legacy path `vctb12/Gold-Prices` may still appear in old comments)
- Production site: <https://goldtickerlive.com/> (custom domain — canonical)
- Old GitHub Pages base path: `/Gold-Prices/` — still relevant for `sw.js`, asset URLs, redirects,
  and historical sitemap entries. Do not silently rewrite these without checking impact.

## 1. Project Identity

Gold Ticker Live is a **bilingual (EN/AR) gold-price intelligence platform** — not a generic
static site. It serves UAE, GCC, the Arab world, and global reference pricing. Surfaces include:

- Live XAU/USD spot-linked pricing, AED + local-currency conversion
- Karat tables (24K, 22K, 21K, 18K, 14K, 9K)
- A flagship **Tracker** (live + historical + presets + compare + export + watchlist + alerts)
- Calculator, methodology, learn, insights, invest, shops, country/city/karat pages
- Node/Express admin backend, Supabase persistence, GitHub Actions automation
- Hourly **production** X-post workflow (`@GoldTickerLive`)
- PWA / service worker / GitHub Pages deployment

## 2. Core Product Principles

1. **Reference price ≠ retail price.** Spot-linked / bullion-equivalent estimates must never be
   shown as live jewelry shop prices.
2. **Freshness must be visible.** Cached, fallback, estimated, derived, delayed — all must carry a
   visible label with source + timestamp.
3. **AED peg is `1 USD = 3.6725 AED`.** Do not change without explicit owner approval.
4. **Arabic/RTL is first-class.** EN/AR parity, hreflang, mirrored layouts, RTL-aware tokens.
5. **Tracker is the flagship.** Treat it as the product spine, not a single page.
6. **Country pages must be real.** No thin duplicates, no fake local context.
7. **Shops data must be honest.** No fabricated verification. Use `verified` / `listed` /
   `market cluster` carefully.

Full guardrails: see [`AGENTS.md` §6](../AGENTS.md#6-product-trust-guardrails).

## 3. Pricing Truth (one-screen summary)

- Formula: `price_per_gram_AED = (XAU/USD ÷ 31.1034768) × 3.6725 × karat_purity_factor`
- Karat factors: 24K=1.000, 22K=0.9167, 21K=0.875, 18K=0.750, 14K=0.5833, 9K=0.375
- Local-currency pages multiply USD/g by current FX, **not** by the AED peg
- Always label: `as of <UTC timestamp>`, source, and state (`live` / `cached` / `delayed` /
  `estimated` / `fallback`). Stale data without a label is a trust violation.
- Calculator output is **estimated**. Add making-charge / VAT disclaimers, never present as a shop
  quote.

Deep dive: [`.github/instructions/gold-pricing.instructions.md`](./instructions/gold-pricing.instructions.md)
and [`docs/data-source-methodology.md`](../docs/data-source-methodology.md).

## 4. Freshness & Data Source Labels

| State       | When                              | Required label                       |
| ----------- | --------------------------------- | ------------------------------------ |
| `live`      | Fetched within 60 s, healthy      | Source + timestamp                   |
| `cached`    | Served from cache / service worker| `Cached · last updated <time>`       |
| `delayed`   | Provider lag > threshold          | `Delayed · source <provider>`        |
| `estimated` | Derived from spot, not retail     | `Reference estimate · methodology`   |
| `fallback`  | Provider failed, prior snapshot   | `Fallback · last known <timestamp>`  |
| `closed`    | Market closed (where applicable)  | `Market closed · resumes <time>`     |

Never strip these labels to "look cleaner."

## 5. Arabic / RTL Requirements

- All user-visible strings go through `src/config/translations.js` — never hard-code English.
- Layouts must work with `dir="rtl"`. Test 360px width minimum.
- Mirror chevrons, arrows, progress bars; preserve number formatting.
- Numbers and currency use locale-aware formatters (already wired in `src/lib/formatter.js`).
- Copy must read like natural Arabic, not English-shaped Arabic.

## 6. Frontend / Mobile Expectations

- Mobile-first, premium **dark/gold financial dashboard** identity.
- Use canonical tokens from `styles/global.css` (`--color-*`, `--surface-*`, `--space-*`,
  `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--duration-*`). No drive-by hex/rem.
- Touch targets ≥ 44×44, sticky tracker controls must not overlap content.
- `prefers-reduced-motion: reduce` is respected globally — don't override.
- Tables → cards on small screens for tracker / shops / countries.
- Safe DOM only: `src/lib/safe-dom.js` (`escape`, `safeHref`, `safeTel`, `el`, `clear`). The
  unsafe-DOM baseline (`scripts/node/check-unsafe-dom.js`) must not regress.

Deep dive: [`.github/instructions/frontend-mobile.instructions.md`](./instructions/frontend-mobile.instructions.md).

## 7. SEO / Canonical Expectations

- `https://goldtickerlive.com/` is canonical. `/Gold-Prices/*` legacy URLs must redirect, never
  duplicate.
- Sitemap is generated — never hand-edit `sitemap.xml`; edit the generator
  (`scripts/node/generate-sitemap.js`, `build/generateSitemap.js`).
- `noindex` policy enforced by `scripts/node/seo-governance.js`. Adding a noindex page needs a
  matching governance entry.
- Every page needs: unique title, unique H1, meta description, OG + Twitter card, canonical,
  hreflang for EN/AR pairs.
- Country pages without real local context = thin duplicate. Do not ship.

Deep dive: [`.github/instructions/seo.instructions.md`](./instructions/seo.instructions.md) +
[`docs/SEO_STRATEGY.md`](../docs/SEO_STRATEGY.md).

## 8. Automation / GitHub Actions Expectations

- `post_gold.yml` runs **hourly in production**. Breakage is public within the hour. Test via
  `workflow_dispatch` with `dry_run: true` before changing logic.
- Never echo secrets. Never `set -x` on a job that touches `${{ secrets.* }}`.
- Provider smoke tests + bakeoff (`gold-provider-bakeoff.yml`, `pr-provider-smoke.yml`,
  `test-gold-providers.yml`) gate provider swaps.
- Sync state (`sync-db-to-git.yml`) must not commit secrets, only observability JSON.
- Workflow YAML uses `permissions:` minimization. Default-deny anything not needed.

Deep dive: [`.github/instructions/github-actions.instructions.md`](./instructions/github-actions.instructions.md)
+ [`docs/X_AUTOMATION_OBSERVABILITY.md`](../docs/X_AUTOMATION_OBSERVABILITY.md).

## 9. Security and Secrets

- This is a **public repo**. No real keys, tokens, service-role keys, webhook URLs, or PINs in
  files, examples, screenshots, logs, or PR bodies.
- `.env.example` documents env var **names only** — never real values.
- Supabase service-role key is server-side only. Never ship to the browser.
- Admin auth: JWT + bcrypt + Helmet + rate limiting (`server/lib/auth.js`,
  `server/middleware/*`). Don't bypass these.

Deep dive: [`.github/instructions/security.instructions.md`](./instructions/security.instructions.md).

## 10. Testing and Verification

Run what matches your change (from `AGENTS.md` §2):

```bash
npm test                  # node:test under tests/*.test.js
npm run lint              # ESLint flat config
npm run validate          # build integrity + DOM-safety + SEO meta + sitemap coverage + governance + analytics
npm run quality           # lint + prettier:check + stylelint
npm run build             # extract-baseline → normalize-shops → inject-schema → sitemap → vite build
npm run test:playwright   # optional E2E
```

**Before `npm test` / `npm run validate`**, delete `playwright-report/` and `test-results/` if
present — `tests/seo-sitewide.test.js` and `scripts/node/validate-build.js` scan HTML and the
Playwright report's inline scripts can produce false positives.

Honesty rule: state what you ran vs. what you assumed. No fake test claims.

## 11. The AI-Agent Operating System

Future agents should use the layered system, not re-read everything from scratch:

| Layer | Where | When to use |
|-------|-------|-------------|
| **Always-on** | `AGENTS.md`, this file, `CLAUDE.md` | Every session |
| **Path-scoped instructions** | `.github/instructions/*.instructions.md` | Touching files matching `applyTo` |
| **Skills** (workflows + checklists) | `.github/skills/<skill>/SKILL.md` | Multi-step tasks (audit, debug, review) |
| **Prompts** (paste-ready) | `.github/prompts/*.prompt.md` | Starting a focused task |
| **Specialist agents** | `.github/agents/*.md` | Spawning a sub-agent with a defined persona |
| **Central docs** | `docs/AI_AGENT_*.md` | Maps, libraries, playbooks, checklists |

Start here:

- [`docs/AI_AGENT_OPERATING_SYSTEM.md`](../docs/AI_AGENT_OPERATING_SYSTEM.md) — the map
- [`docs/AI_PROMPT_LIBRARY.md`](../docs/AI_PROMPT_LIBRARY.md) — pick a prompt
- [`docs/AGENT_SKILL_LIBRARY.md`](../docs/AGENT_SKILL_LIBRARY.md) — pick a skill
- [`docs/AI_AGENT_REVIEW_CHECKLISTS.md`](../docs/AI_AGENT_REVIEW_CHECKLISTS.md) — checklists
- [`docs/AI_RELEASE_READINESS_PLAYBOOK.md`](../docs/AI_RELEASE_READINESS_PLAYBOOK.md) — ship gate

## 12. Copilot-Specific Mechanics

- **`report_progress`** is the only way to commit + push. Don't use `git push` directly — the cloud
  agent is sandboxed.
- Call `report_progress` once **before** the first edit with a checklist, and again at meaningful
  milestones. Keep the checklist structure consistent across updates.
- **`parallel_validation`** must be called before finalizing. Address valid findings; re-run if
  significant changes follow.
- **GitHub MCP tools** (`list_workflow_runs`, `get_job_logs`, …) are available — use them for any
  CI / workflow / PR investigation. Don't claim you can't access logs.
- **`gh-advisory-database`** before adding any new dependency in a supported ecosystem.
- **`store_memory`** for durable repo-wide facts (verified commands, invariants) with citations.

## 13. Final Report Format

When you finish a task, include:

```md
## What
<one-line summary>

## Why
<the user-visible problem this solves>

## How
- <key change 1>
- <key change 2>
- <key change 3>

## Proof
- Ran: <commands and outcomes>
- Skipped: <commands and reason>
- Manual checks: <screenshots, viewports, RTL, etc.>

## Risks
- <known unknown 1>
- <follow-up task 1>
```

Templates for specific task types live in
[`docs/AI_AGENT_OPERATING_SYSTEM.md`](../docs/AI_AGENT_OPERATING_SYSTEM.md#final-report-templates).

## 14. Golden Rules (the 30-second card)

1. **Reference price is not retail price.**
2. **Freshness must be visible.**
3. **AED peg is 3.6725.**
4. **Arabic/RTL is first-class.**
5. **Secrets never enter the repo.**
6. **Production X posting is sensitive — dry-run first.**
7. **`goldtickerlive.com` is canonical; old `/Gold-Prices/` is a redirect surface.**
8. **Tracker is the flagship.**
9. **Country pages must not be thin clones.**
10. **Honest verification — say what you ran, say what you assumed.**
