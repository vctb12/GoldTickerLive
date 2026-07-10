# Master Improvement Program — Gold Ticker Live

> **One place** for rational improvement phases, Cursor Automation evolution, UI/UX ease-of-use
> work, and copy-paste session prompts. Read this before starting any multi-session program.

**Routing hub:**
[`plans/2026-06-01_master-operations-hub.md`](./plans/2026-06-01_master-operations-hub.md)  
**Active queue:** [`PLAN.md`](../PLAN.md)  
**Workbook (deep):**
[`GOLD_TICKER_LIVE_MASTER_WORKBOOK.md`](./GOLD_TICKER_LIVE_MASTER_WORKBOOK.md)  
**Cursor Automations:** [`CURSOR_AUTOMATIONS_PLAYBOOK.md`](./CURSOR_AUTOMATIONS_PLAYBOOK.md) ·
[`CURSOR_AUTOMATIONS_REGISTRY.md`](./CURSOR_AUTOMATIONS_REGISTRY.md)

---

## How to use this document

1. Pick **one phase slice** — not the whole program at once.
2. Paste the **session prompt** for that slice into a new Cursor chat (or use the linked
   `.prompt.md`).
3. Ship **one PR**; update `PLAN.md` and the relevant registry row.
4. Run verification from [`AGENTS.md`](../AGENTS.md) §2.

---

## Program map (consolidated)

| Track | Phase | Focus                                  | Status            | Primary doc / prompt                           |
| ----- | ----- | -------------------------------------- | ----------------- | ---------------------------------------------- |
| **A** | A1–A3 | Cursor review automations live + tuned | In progress       | `CURSOR_AUTOMATIONS_PLAYBOOK.md`               |
| **A** | A4    | SERP weekly audit schedule             | Planned           | `serp-structure-weekly-audit.prompt.md`        |
| **A** | A5–A6 | Growth agents proposal → draft         | Planned           | Registry mode gates                            |
| **B** | B1    | Nav + shell ease of use                | Up next           | `endless-ui-visual-sweep.prompt.md`            |
| **B** | B2    | Homepage terminal clarity              | Up next           | `ui-ux-ease-of-use-session.prompt.md`          |
| **B** | B3    | Tracker flagship polish                | Active (20-phase) | `tracker-flagship-revamp.prompt.md`            |
| **B** | B4    | Hover / motion rollout sitewide        | Backlog           | `REVAMP_PLAN.md` §22b                          |
| **C** | C1    | Cross-page deep links (WB-102)         | In progress       | `endless-integration-wiring.prompt.md`         |
| **C** | C2    | EN↔AR parity audit                     | Up next           | `bilingual-consistency-agent` + manual session |
| **D** | D1    | SEO noindex stub karat pages           | Up next           | `seo-noindex-governance.prompt.md`             |
| **D** | D2    | Country page cluster depth             | Backlog           | `country-pages-expansion.prompt.md`            |
| **E** | E1    | Trust / freshness sweep                | Backlog           | `endless-gold-product-trust.prompt.md`         |
| **E** | E2    | Calculator → shops handoff polish      | Partial           | WB-102                                         |
| **F** | F1    | Lint + CI hygiene                      | In progress       | This PR (ESLint clean)                         |
| **F** | F2    | Hex → design tokens                    | Backlog           | `endless-ui-visual-sweep.prompt.md`            |
| **G** | G1    | Insight Writer + price context         | Future            | Registry webhook section                       |
| **G** | G2    | SEO Expansion draft scaffolds          | Future            | `seo-expansion-draft-mode.prompt.md`           |

---

## Track A — Cursor Automations evolution

### A1 — Review agents live (you are here)

**Done when:** Gold Integrity, Bilingual, SERP run on PRs; registry filled in; Slack not noisy.

**Owner checklist:**

- [ ] Create automations in Cursor UI per playbook
- [ ] Fill [`CURSOR_AUTOMATIONS_REGISTRY.md`](./CURSOR_AUTOMATIONS_REGISTRY.md)
- [ ] Test one low-risk PR per agent
- [ ] Tune Gold Integrity if >5 trivial comments per PR

**Tuning session prompt:**
[`.github/prompts/cursor-automations/automation-tuning-session.prompt.md`](../.github/prompts/cursor-automations/automation-tuning-session.prompt.md)

### A2 — De-noise overlap (shipped in repo)

- Gold Integrity: scope boundaries vs Bilingual / SERP / `pr-review`
- `pr-review.prompt.md`: skips checks owned by automations
- Growth agents: registry mode gates before PR creation

### A3 — After 5–10 PR runs

Tune block criteria:

- Raise bar for `BLOCK` — only trust, math, or indexability regressions
- Add memories for repeated false positives
- Disable Slack on `COMMENT`-only runs

### A4 — SERP weekly audit (Week 2+)

**Trigger:** Weekly schedule (Sunday 08:00 UTC)  
**Prompt:** `serp-structure-weekly-audit.prompt.md`  
**Scope:** Top 10 country pages, calculator, methodology, homepage — metadata + hreflang + intent

### A5 — SEO Expansion upgrade

**Gate:** 5+ weekly runs with ideas you would actually execute  
**Mode:** `draft-scaffold` in registry  
**Prompt:** `seo-expansion-draft-mode.prompt.md`  
**Output:** GitHub issues with page briefs — no auto-merge

### A6 — Market Insight Writer upgrade

**Gate:** 10+ `PUBLISH` drafts you approved manually  
**Mode:** `draft-pr` in registry  
**Optional:** Webhook/MCP to `data/gold_price.json` or price spike workflow  
**Still:** Human review via `docs/AI_CONTENT_AUTOMATION.md`

---

## Track B — UI / UX ease of use

**North star:** Feel like a **live reference terminal** — numbers first, honest labels, obvious next
step, effortless on 360px RTL.

### B1 — Navigation clarity

- Slim drawer sections; search always reachable
- Active page obvious in nav
- Language toggle preserves page context

**Session:** `@.github/prompts/endless-ui-visual-sweep.prompt.md` — one page per run, nav first.

### B2 — Homepage ease of use (ongoing)

Recent improvements:

- Karat strip: scroll-snap, edge fade on mobile, focus ring on CTA
- Action rail: 2-col → 1-col on small screens (existing)

**Next slices:**

- [ ] Karat strip: visible “swipe for more karats” hint (EN+AR) when overflow
- [ ] Hero CTA hierarchy: primary = Tracker, secondary = Calculator
- [ ] Quick convert widget: default country from geo or last selection
- [ ] Freshness bar always visible above fold on mobile

**Session:** `@.github/prompts/cursor-automations/ui-ux-ease-of-use-session.prompt.md`

### B3 — Tracker terminal (20-phase program)

See
[`plans/2026-06-09_realtime-tracker-motion-revamp-20-phase.md`](./plans/2026-06-09_realtime-tracker-motion-revamp-20-phase.md)

### B4 — Visual system

- Replace hardcoded hex with tokens (565 instances — phased)
- Card density consistency
- Dark mode parity

---

## Track C — Integration wiring

| Item                            | Prompt                                 |
| ------------------------------- | -------------------------------------- |
| WB-102 cross-page deep links    | `endless-integration-wiring.prompt.md` |
| Calculator → shops `?country=`  | Shipped partial — spot-check AR        |
| Related guides on country pages | `country-pages-expansion.prompt.md`    |

---

## Track D — SEO & content growth

| Item                    | Prompt                                  |
| ----------------------- | --------------------------------------- |
| Stub karat noindex plan | `seo-noindex-governance.prompt.md`      |
| Weekly SERP audit       | `serp-structure-weekly-audit.prompt.md` |
| Country expansion       | `country-pages-expansion.prompt.md`     |
| Organic proposals       | `seo-expansion-agent` (scheduled)       |

---

## Track E — Product trust

| Item                     | Prompt                                 |
| ------------------------ | -------------------------------------- |
| Freshness label sweep    | `endless-gold-product-trust.prompt.md` |
| Shops data honesty       | `shops-data-honesty.prompt.md`         |
| Reference vs retail copy | `gold-integrity-agent` + learn content |

---

## Track F — Engineering hygiene

| Item                              | Notes                                                        |
| --------------------------------- | ------------------------------------------------------------ |
| ESLint errors                     | Fixed `motion-boot.js`, `canonicalize-country-gold-price.js` |
| `npm test` + `validate` + `build` | Required per PR                                              |
| DOM-safety baseline               | No new innerHTML sinks                                       |

---

## Track G — Future (post-quality gate)

1. **Insight Writer webhook** — optional MCP; document in registry
2. **SEO draft scaffolds** — issue templates from expansion agent
3. **Automation PR auto-comment rollup** — single bot comment merging three review agents (manual
   setup)
4. **PWA offline karat strip** — cached prices with `cached` label
5. **Voice/search shortcut** — nav search improvements

---

## Copy-paste session prompts (quick index)

| Use when                     | File                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| Don't know what to do        | `session-pick-next-work.prompt.md`                         |
| Bootstrap any session        | `prompts/master-rerun.md`                                  |
| Tune automations after runs  | `cursor-automations/automation-tuning-session.prompt.md`   |
| Homepage / ease of use slice | `cursor-automations/ui-ux-ease-of-use-session.prompt.md`   |
| Weekly SEO health            | `cursor-automations/serp-structure-weekly-audit.prompt.md` |
| SEO page scaffolds (gated)   | `cursor-automations/seo-expansion-draft-mode.prompt.md`    |
| One UI page polish           | `endless-ui-visual-sweep.prompt.md`                        |
| Trust / pricing              | `endless-gold-product-trust.prompt.md`                     |
| Full PR review (chat)        | `pr-review.prompt.md`                                      |

---

## Session prompt — Meta: pick next slice

```md
Read AGENTS.md, PLAN.md, and docs/MASTER_IMPROVEMENT_PROGRAM.md.

Pick exactly ONE slice from the program map that is:

- not blocked in PLAN.md
- not duplicated by an open PR
- completable in one PR

Implement it with verification (npm test, npm run validate, npm run build as applicable). Update
PLAN.md. Return What / Why / How / Proof / Risks.
```

---

## Changelog

| Date       | Change                                                                      |
| ---------- | --------------------------------------------------------------------------- |
| 2026-06-09 | Initial master program + registry + phase-2 prompts + UX karat-strip polish |
