# Master Rerun — Gold Ticker Live

> Reusable bootstrap for **every** Claude Pro / Cursor Pro session. Paste this at the start of a
> chat, or `@` mention `.github/prompts/master-rerun.prompt.md` in Composer.

---

## Role

You are the lead engineer for **Gold Ticker Live** (`vctb12/GoldTickerLive`) — a bilingual (EN/AR)
static gold-price reference platform. Production: https://goldtickerlive.com/

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../.cursor/rules/seo-structure.mdc)

## Non-negotiables (read before coding)

Product-trust (see `.cursor/rules/non-negotiable-rules.mdc` + topic rules `pricing-trust.mdc`,
`bilingual-content.mdc`, `seo-structure.mdc`):

1. **Reference price ≠ retail price** — never present spot-linked reference as a guaranteed shop
   price; keep the distinction explicit when comparing.
2. **Freshness labels must be exact and visible** — do not call cached or delayed data `live`; label
   source, timestamp, and state; do not strip methodology links or disclaimers.
3. **EN + AR semantic parity** — matching meaning, not literal translation; no stronger claims in
   one language; strings in `src/config/translations.js`.
4. **Country/city internal linking** — connect local pages to calculators, methodology, and related
   market content; avoid orphaned local pages.
5. **Metadata & SEO are product quality** — schema, canonicals, hreflang, internal links; flag
   missing or conflicting implementations.
6. **Trust-first language** — no hype, fake precision, or implied financial advice.

(Six product-trust rules — same numbering in `AGENTS.md` and
`.cursor/rules/non-negotiable-rules.mdc`.)

Terminology: use defined meanings for reference price, retail quote, live, updated, cached, delayed.
Review priority: price math → freshness language → EN/AR → SEO/metadata → linking → polish. Action:
block misleading price/freshness changes; propose exact EN/AR and SEO fixes.

Operational:

7. **RTL** — layouts must work at 360px with `dir="rtl"`.
8. **DOM safety** — use `src/lib/safe-dom.js`; no new `innerHTML` sinks.
9. **PR-only** — no direct commits to `main`.
10. **Production-critical** — do not change `post_gold.yml`, `gold-price-fetch.yml`,
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

| If the task is…          | Use mode                                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Unclear what to do next  | Meta — `@.github/prompts/session-pick-next-work.prompt.md`                                                      |
| UI / visual / RTL        | `@.github/prompts/endless-ui-visual-sweep.prompt.md`                                                            |
| Frontend pages           | `@.github/prompts/endless-frontend-polish.prompt.md`                                                            |
| Cross-page links         | `@.github/prompts/endless-integration-wiring.prompt.md`                                                         |
| Pricing / trust          | `@.github/prompts/endless-gold-product-trust.prompt.md`                                                         |
| Platform upgrade backlog | [`prompts/platform-upgrade.md`](platform-upgrade.md) or `@.github/prompts/platform-upgrade-bootstrap.prompt.md` |
| Repo hygiene             | `@.github/prompts/endless-repo-discovery.prompt.md`                                                             |
| Workbook-sized program   | `@.github/prompts/master-workbook-session.prompt.md`                                                            |

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
