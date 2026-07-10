# AGENTS.md

Canonical cross-agent charter for Gold Ticker Live. Every coding agent reads this file first.
Tool-specific mechanics: `CLAUDE.md`, `.github/copilot-instructions.md`. Topic rules:
`.cursor/rules/*.mdc`. Session bootstrap: `prompts/master-rerun.md`. Extended reference:
`docs/AGENTS_REFERENCE.md`.

## Project overview

Gold Ticker Live (`vctb12/GoldTickerLive`) is a bilingual (EN/AR) gold price and gold education
platform for GCC and Arab-world users. Production: https://goldtickerlive.com/ (GitHub Pages).

It publishes spot-linked **reference** prices, AED/local conversion, karat tables, a flagship
Tracker, calculators, country/city market pages, shops directory, and trust-oriented educational
content. Stack: static multi-page site (vanilla ES modules, Vite), optional Node/Express admin,
Python + GitHub Actions automation (including hourly X-post to `@GoldTickerLive`).

## Product promise

Protect user trust. Accuracy, clarity, and semantic consistency matter more than speed or content
volume. Reference pricing must never be confused with retail shop quotes. Stale or derived data must
be labelled honestly. EN and AR must not diverge in meaning.

## Non-negotiable rules

1. **Reference prices are not retail shop quotes.** Must not present a spot-linked reference price
   as a guaranteed in-store purchase price. When comparing reference and shop pricing, the
   distinction must remain explicit.
2. **Freshness labels must be exact and must remain visible.** Must not use `live`, `updated`,
   `cached`, or `delayed` loosely. If data is not truly live, must not call it live. Cached,
   fallback, estimated, or delayed values must show source, timestamp, and state. Must not remove
   methodology links, freshness pills, or reference-vs-retail disclaimers to “look cleaner.”
3. **EN/AR semantic parity.** Must not ship stronger promises or claims in one language.
   User-visible strings live in `src/config/translations.js`.
4. **Local pages must strengthen linking.** Country and city pages must connect to calculators,
   methodology, related country/market content — not fragment into orphans.
5. **Metadata and SEO are product quality.** Schema, canonicals, metadata, hreflang, and internal
   links are core integrity. Must flag missing, conflicting, or misleading implementations.
6. **Trust-first language.** Must not use hype, fake precision, clickbait, or exaggerated certainty.
   Must not imply financial advice unless the page is explicitly designed for that purpose.

## Terminology policy

Use these definitions consistently in code, copy, automations, and reviews.

- **Reference price** — spot-linked informational estimate. Not a guaranteed store quote. Example:
  hero XAU/USD-derived gram price with methodology link.
- **Retail quote** — seller/store price that may include making charges, premiums, taxes, spreads,
  and local adjustments. Example: a shop listing with “includes 5% making charge.”
- **Live** — use only when the displayed value is updated in real time or near-real time from the
  active source. Example: quote fetched within ~60s during market hours.
- **Updated** — use when data is refreshed periodically but not continuously. Example: hourly cron
  commit to `data/gold_price.json`.
- **Cached** — use when stored data from a prior fetch or processing cycle is shown. Example:
  service-worker or localStorage replay with “Cached · last updated …”
- **Delayed** — use when data intentionally lags the source by a known interval. Example: provider
  feed with documented lag.

Also use: `estimated`, `fallback`, `stale`, `unavailable`, `closed` per `docs/freshness-contract.md`
when applicable. Full glossary: `.cursor/rules/non-negotiable-rules.mdc`.

## Review priorities

When multiple issues exist, address in this order:

1. Price accuracy and karat math
2. Misleading trust/freshness language
3. EN/AR semantic mismatch
4. Broken canonicals, hreflang, schema, or metadata
5. Internal linking regressions
6. Lower-risk style or copy issues

## Action rules

- **Block or strongly flag** any change that can mislead users about price accuracy, freshness, or
  retail-vs-reference interpretation.
- **Comment with exact fixes** for metadata, schema, hreflang, and internal-linking problems.
- **Suggest exact EN/AR rewrite pairs** for semantic mismatches — not vague “improve translation.”
- **Prefer minimal diffs** and implementation-ready fixes over large rewrites.
- **Save repeated issue patterns** into memory when tooling supports it.

## Content standards

- Must not use clickbait headlines or fake urgency (“prices crashing now”).
- Must not use fake precision (excess decimal places that imply false certainty).
- Must not use financial-advice tone unless the page is explicitly designed for that purpose (e.g.
  `invest.html` with appropriate disclaimers).
- Must not create generic filler SEO pages with thin duplicate intent.
- Must not blur reference estimates with retail/jewelry pricing in body copy or schema.

## Local page policy

- Country and city pages **must** support navigation and internal linking to parent country hubs,
  calculators, methodology, and related market content.
- Must not create orphan pages with no inbound links from nav, hubs, or related local pages.
- Must preserve taxonomy consistency (country → city → karat/market URL patterns).
- Local currency must use USD/gram × current FX — not USD → AED → local. FX must be timestamped.

## Bilingual policy

- EN and AR **must** match in meaning, not just topic.
- Must use approved glossary terms (reference price, retail quote, making charge, freshness labels).
- Must not use stronger certainty in one language (e.g. EN “guaranteed” vs AR neutral wording).
- Natural GCC/Arab commercial phrasing is preferred over literal translation.
- RTL layouts must work at 360px minimum. Every layout change requires RTL spot-check.

## Technical SEO policy

- Titles, metas, canonicals, hreflang, schema, breadcrumbs, and internal links are part of product
  quality — not optional SEO extras.
- Must not silently change canonical URLs, `robots.txt`, sitemap structure, `og:*` / `twitter:*`, or
  `CNAME`. Schema changes need a migration note.
- Schema must match visible content — must not mark up retail offers the page does not show.
- Important pages must have unique intent; must not cannibalize with duplicate metadata.
- Sitemap is generated — must not hand-edit `sitemap.xml`.

## Output expectations for agents

Every review, audit, or finding must include:

| Field              | Requirement                                             |
| ------------------ | ------------------------------------------------------- |
| **Severity**       | `block` / `high` / `medium` / `low`                     |
| **File or page**   | Exact path or URL                                       |
| **Issue**          | What is wrong, citing line when possible                |
| **Impact**         | Trust, pricing, SEO, bilingual, or UX risk              |
| **Exact fix**      | Implementation-ready change — not “consider improving”  |
| **Repeat pattern** | Note if this matches a prior memory pattern, when known |

PR bodies must use **What / Why / How / Proof / Risks**. Separate what you verified from what you
assumed.

## Core commands

```bash
export JWT_SECRET=<random 32+ char string>   # required for npm test / npm start
export ADMIN_PASSWORD=<any string>
export ADMIN_ACCESS_PIN=<6+ digit PIN>

npm install && npm run dev      # Vite HMR :5000 — no env vars needed
npm test                        # node:test under tests/
npm run lint && npm run validate && npm run build
npm start                       # Express admin :3000
```

`npm run validate` includes DOM-safety baseline (`scripts/node/check-unsafe-dom.js`) — adding
`innerHTML` sinks fails CI.

## Operational guardrails

- **Static multi-page architecture** — must not migrate to SPA/framework without explicit owner
  request.
- **DOM safety** — use `src/lib/safe-dom.js`; prefer `node.replaceChildren()` over `innerHTML = ''`.
- **No secrets in git** — GitHub Secrets only; never echo into logs.
- **PR-only** — must not commit directly to `main` or force-push.
- **Production-critical** — `post_gold.yml`, `gold-price-fetch.yml`, `data/gold_price.json`,
  `sw.js`, `src/config/constants.js` (AED peg `3.6725`, troy oz `31.1035`) need owner approval
  before change.
- **Pricing constants** — karat factors from `src/config/karats.js` only; must not inline elsewhere.
- **Dependencies** — must not add without explicit ask + advisory check.
- **Strings** — must not hard-code UI text outside `src/config/translations.js`.
- **Motion** — must respect `prefers-reduced-motion: reduce`.

## Workflow

1. Read `PLAN.md` and open PRs — do not duplicate scope.
2. For non-trivial work: plan in `docs/plans/YYYY-MM-DD_<slug>.md`.
3. Smallest correct change; match surrounding conventions.
4. Verify applicable commands; state what you skipped.
5. Ship one PR with honest Proof section.

## Agent run-book (quick mechanics)

- Install: `npm install`
- Dev server: `npm run dev` (Vite on `:5000`)
- Full verification gate: `npm run lint && npm test && npm run validate && npm run build`
- Single test file: `node --test --test-concurrency=1 tests/<file>.test.js`
- Server env var names required for auth-bound tests/startup: `JWT_SECRET`, `ADMIN_PASSWORD`,
  `ADMIN_ACCESS_PIN` (names only; never commit values).
- Supabase wiring:
  - Browser/public data uses `src/config/supabase.js` (anon key + RLS-protected reads).
  - Server/admin uses `server/lib/supabase-client.js` (`SUPABASE_URL` +
    `SUPABASE_SERVICE_ROLE_KEY`).
- GitHub Actions wiring:
  - `gold-price-fetch.yml` refreshes `data/gold_price.json`.
  - `post_gold.yml` posts to X with duplicate/staleness guards and commits state files.
  - `ci.yml` is the merge gate for validate/lint/test/build.

Automation prompts under `.github/prompts/` include a rules preamble — copy from
`.github/prompts/_rules-preamble.md` when authoring new prompts.

## Key paths

| Need               | Where                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| UI strings         | `src/config/translations.js`                                                       |
| Karats / constants | `src/config/karats.js`, `src/config/constants.js`                                  |
| Pricing logic      | `src/lib/price-calculator.js`, `.github/instructions/gold-pricing.instructions.md` |
| Freshness contract | `docs/freshness-contract.md`, `src/lib/live-status.js`                             |
| Terminology        | `docs/TERMINOLOGY_GLOSSARY.md`, `.cursor/rules/non-negotiable-rules.mdc`           |
| Agent governance   | `scripts/node/check-agent-governance.js` (runs in `npm run validate`)              |
| SEO governance     | `scripts/node/seo-governance.js`, `.github/instructions/seo.instructions.md`       |
| Active queue       | `PLAN.md`                                                                          |
| Deep reference     | `docs/AGENTS_REFERENCE.md`, `docs/ARCHITECTURE.md`, `docs/REVAMP_PLAN.md`          |
| Cursor Cloud env   | `docs/AGENTS_REFERENCE.md` (Node 24, env vars, ports)                              |

## Overnight autonomous agent — scope & guardrails

Unattended/overnight agent runs (and any Codex/secondary reviewer) operate under a hard, minimal
mandate. Tooling: `scripts/agent-night-run.sh` (SAFE runner — no permission bypass, never `main`,
logs to `logs/agent-night/`), `scripts/agent-status.sh` (read-only snapshot),
`.claude/settings.json` (allow safe work / deny dangerous work), `.github/codex/prompts/review.md`
(reviewer prompt).

**Must NOT** (blocking): merge; deploy; push to `main`; force-push; add/edit `.env`, secrets, API
keys, tokens, or credential files; edit `.github/workflows/gold-price-fetch.yml`, `post_gold.yml`,
or `sw.js`; change the AED/USD peg **3.6725**, troy **31.1034768 g**, karat factors, or the
price/karat/FX formulas and source-priority logic; add paid APIs / recurring infra / new
dependencies without an explicit owner ask + advisory check.

**Must** (each run): work on an isolated `cowork/**`, `claude/**`, or `agent/**` branch; take the
next `not-started`, non-owner-gated phase from `docs/AGENT_MASTER_TRACKER.md`; make the smallest
correct change; run applicable checks (`lint` / `test` / `build` / `validate`); update the tracker
before and after; open **one PR per phase and stop** (never merge). Leave an owner-facing note in
`docs/agent-handoffs/`. Owner-gated items go to the tracker's Owner-Gated Decision Queue, not into
the diff. Full reviewer checklist: `.github/codex/prompts/review.md`.
