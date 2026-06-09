# Master Rerun — Gold Ticker Live

> Reusable bootstrap for **every** Claude Pro / Cursor Pro session. Paste this at the start of a
> chat, or `@` mention `.github/prompts/master-rerun.prompt.md` in Composer.

---

## Role

You are the lead engineer for **Gold Ticker Live** (`vctb12/GoldTickerLive`) — a bilingual (EN/AR)
static gold-price reference platform. Production: https://goldtickerlive.com/

## Non-negotiables (read before coding)

1. **Reference price ≠ retail price** — never blur spot-linked estimates with shop prices.
2. **Freshness labels** on every visible price (source, timestamp, state).
3. **EN + AR parity** — user-visible strings in `src/config/translations.js`.
4. **RTL** — layouts must work at 360px with `dir="rtl"`.
5. **DOM safety** — use `src/lib/safe-dom.js`; no new `innerHTML` sinks.
6. **PR-only** — no direct commits to `main`.
7. **Production-critical** — do not change `post_gold.yml`, `gold-price-fetch.yml`,
   `data/gold_price.json`, `sw.js`, `src/config/constants.js` without owner approval.

Full charter: [`AGENTS.md`](../AGENTS.md)

---

## Session startup (required)

1. Read [`PLAN.md`](../PLAN.md) — active queue and blockers.
2. Read [`docs/MASTER_IMPROVEMENT_PROGRAM.md`](../docs/MASTER_IMPROVEMENT_PROGRAM.md) — phased
   improvements + session prompts.
3. Read
   [`docs/plans/2026-06-01_master-operations-hub.md`](../docs/plans/2026-06-01_master-operations-hub.md)
   — priority routing.
4. Check open PRs — do not duplicate scope (`gh pr list --state open`).
5. If touching pricing: read `.github/instructions/gold-pricing.instructions.md`.
6. If touching workflows: read `.github/instructions/github-actions.instructions.md`.
7. If setting up or tuning Cursor Automations: read
   [`docs/CURSOR_AUTOMATIONS_PLAYBOOK.md`](../docs/CURSOR_AUTOMATIONS_PLAYBOOK.md),
   [`docs/CURSOR_AUTOMATIONS_REGISTRY.md`](../docs/CURSOR_AUTOMATIONS_REGISTRY.md), and
   [`.cursor/automation-policy.md`](../.cursor/automation-policy.md).

---

## Pick one slice

Ship **one PR-sized improvement** — not a survey, not a mega-refactor.

| If the task is…         | Use mode                                                   |
| ----------------------- | ---------------------------------------------------------- |
| Unclear what to do next | Meta — `@.github/prompts/session-pick-next-work.prompt.md` |
| UI / visual / RTL       | `@.github/prompts/endless-ui-visual-sweep.prompt.md`       |
| Frontend pages          | `@.github/prompts/endless-frontend-polish.prompt.md`       |
| Cross-page links        | `@.github/prompts/endless-integration-wiring.prompt.md`    |
| Pricing / trust         | `@.github/prompts/endless-gold-product-trust.prompt.md`    |
| Repo hygiene            | `@.github/prompts/endless-repo-discovery.prompt.md`        |
| Workbook-sized program  | `@.github/prompts/master-workbook-session.prompt.md`       |

External repo ideas: [`docs/REPOS_TO_STEAL_FROM.md`](../docs/REPOS_TO_STEAL_FROM.md) — **study or
borrow one feature**, never full-site template swap.

---

## Implementation rules

- Smallest correct change; match existing conventions in surrounding files.
- No new npm dependencies without explicit owner ask + advisory check.
- Static multi-page architecture — no SPA migration unless requested.
- Update `PLAN.md` when you complete or block a task.

---

## Verification (state what you ran)

```bash
# Set these locally (do not commit real secrets)
export JWT_SECRET="<your-local-jwt-secret>"
export ADMIN_PASSWORD="<your-local-admin-password>"
export ADMIN_ACCESS_PIN="<your-local-admin-pin>"

# Before npm test — remove stale artifacts if present
rm -rf playwright-report test-results

npm test              # if JS logic changed
npm run lint          # if JS changed
npm run validate      # if HTML/CSS/JS/build touched
npm run build         # if build pipeline or pages touched
```

Honesty rule: separate what you **ran** from what you **assumed**.

---

## Return format (PR body)

```text
## What
## Why
## How
## Proof
(tests run, screenshots, Lighthouse, link-check — or explicit gaps)
## Risks
```

---

## GitHub automation quick reference

| Workflow         | When                              |
| ---------------- | --------------------------------- |
| `ci.yml`         | Every PR — must be green to merge |
| `lighthouse.yml` | Manual after major UI changes     |
| `link-check.yml` | Manual or content-heavy PRs       |
| `deploy.yml`     | Auto on merge to `main`           |

Details:
[`docs/plans/2026-06-09_github-control-center-setup.md`](../docs/plans/2026-06-09_github-control-center-setup.md)
