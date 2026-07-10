# Cursor Automations Registry — Gold Ticker Live

> **Living record** of Cloud Automations you configure at
> [cursor.com/automations](https://cursor.com/automations). Update this file after each automation
> is created, tuned, or upgraded. Agents read this to know current modes and avoid duplicate work.

**Playbook:** [`CURSOR_AUTOMATIONS_PLAYBOOK.md`](./CURSOR_AUTOMATIONS_PLAYBOOK.md)  
**Policy:** [`.cursor/automation-policy.md`](../.cursor/automation-policy.md)  
**Prompts:** [`.github/prompts/cursor-automations/`](../.github/prompts/cursor-automations/)

---

## How to sync after you create an automation in Cursor

1. Open [Cursor Automations](https://cursor.com/automations) → select the automation.
2. Copy **Name**, **Triggers**, **Tools**, and note **last run quality** (good / noisy / quiet).
3. Update the matching row below (`status`, `mode`, `tuning notes`).
4. If you change Agent Instructions, paste from the repo prompt file — keep repo and Cursor in sync.
5. Commit this file so agents and future sessions see the live config.

---

## Review agents (GitHub PR triggers)

| Automation            | Cursor name (fill in) | Status                          | Mode       | Trigger             | Tools                   | Prompt file                             |
| --------------------- | --------------------- | ------------------------------- | ---------- | ------------------- | ----------------------- | --------------------------------------- |
| Gold Integrity        | _your name_           | `active` / `paused` / `planned` | `advisory` | PR opened + updated | GitHub, Slack, Memories | `gold-integrity-agent.prompt.md`        |
| Bilingual Consistency | _your name_           |                                 | `advisory` | PR opened + updated | GitHub, Memories        | `bilingual-consistency-agent.prompt.md` |
| SERP Structure        | _your name_           |                                 | `advisory` | PR opened + updated | GitHub, Memories        | `serp-structure-agent.prompt.md`        |

### Tuning log (Gold Integrity)

| Date       | Change                                             | Result                            |
| ---------- | -------------------------------------------------- | --------------------------------- |
| 2026-06-09 | Added scope boundaries vs Bilingual/SERP/pr-review | Fewer duplicate comments expected |
|            |                                                    |                                   |

### Tuning log (Bilingual)

| Date | Change | Result |
| ---- | ------ | ------ |
|      |        |        |

### Tuning log (SERP)

| Date | Change | Result |
| ---- | ------ | ------ |
|      |        |        |

---

## Growth agents (schedule triggers)

| Automation            | Cursor name (fill in) | Status | Mode                               | Schedule             | Tools            | Prompt file                            |
| --------------------- | --------------------- | ------ | ---------------------------------- | -------------------- | ---------------- | -------------------------------------- |
| SEO Expansion         | _your name_           |        | `proposal-only` → `draft-scaffold` | Weekly Mon 09:00 UTC | GitHub, Memories | `seo-expansion-agent.prompt.md`        |
| Market Insight Writer | _your name_           |        | `draft-only` → `draft-pr`          | Daily 05:00 UTC      | GitHub, Memories | `gold-market-insight-writer.prompt.md` |

### Mode upgrades (human gate)

| Automation            | Current mode    | Upgrade when                                                         | Next mode                                                  |
| --------------------- | --------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| SEO Expansion         | `proposal-only` | 5+ weekly runs with 3+ high-confidence ideas you would actually ship | `draft-scaffold` (briefs in issues, no auto-merge)         |
| Market Insight Writer | `draft-only`    | 10+ drafts you rated good; movement threshold feels right            | `draft-pr` (opens draft PR; still no auto-merge)           |
| SERP Structure        | PR only         | PR mode stable 2+ weeks                                              | Add weekly audit — `serp-structure-weekly-audit.prompt.md` |

---

## Overlap matrix (who owns what)

| Check                        | Gold Integrity | Bilingual | SERP | pr-review (chat) |
| ---------------------------- | -------------- | --------- | ---- | ---------------- |
| Karat / FX math              | ✓              |           |      | spot-check       |
| Freshness labels             | ✓              |           |      |                  |
| Reference vs retail          | ✓              | ✓         |      |                  |
| EN/AR meaning                | flag only      | ✓         |      |                  |
| Title / canonical / hreflang | flag only      |           | ✓    |                  |
| Security / secrets           |                |           |      | ✓                |
| A11y / mobile / RTL          |                |           |      | ✓                |
| CI / workflow safety         |                |           |      | ✓                |

---

## Slack routing

| Automation     | Slack when                                                          |
| -------------- | ------------------------------------------------------------------- |
| Gold Integrity | `BLOCK` or `High` risk only                                         |
| Bilingual      | Optional — `HIGH-RISK MISMATCH` only                                |
| SERP           | Optional — `BROKEN` only                                            |
| SEO Expansion  | Optional — weekly summary if `PROPOSE` with ≥1 high-confidence idea |
| Market Insight | Optional — when `PUBLISH` decision (not on `DO NOT PUBLISH`)        |

---

## Memory index (approved patterns)

Add rows as automations mature:

| Key                                        | Owner agent   | EN              | AR        | Notes |
| ------------------------------------------ | ------------- | --------------- | --------- | ----- |
| `spot_reference_vs_retail_confusion`       | Integrity     | reference price | سعر مرجعي |       |
| `arabic_term_for_reference_price_approved` | Bilingual     |                 |           |       |
| `country_page_title_pattern_approved`      | SERP          |                 |           |       |
| `rejected_page_idea`                       | SEO Expansion |                 |           |       |

---

## Optional: price feed for Insight Writer (future)

When ready, connect one of:

- Webhook from internal price monitor
- Scheduled read of `data/gold_price.json` via GitHub tool (current default)
- MCP data source (document name here): _______________

Do not connect live trading or advice APIs without owner review.
