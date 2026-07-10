# Cursor Automations Playbook — Gold Ticker Live

> Ready-to-use implementation guide for five Cursor Automations on `vctb12/GoldTickerLive`. GitHub
> Actions automation (price fetch, X-post, deploy) lives in [`AUTOMATIONS.md`](./AUTOMATIONS.md) —
> this document is **Cursor Cloud Automations** only.

**Policy (read first):** [`.cursor/automation-policy.md`](../.cursor/automation-policy.md)  
**Your live config:** [`CURSOR_AUTOMATIONS_REGISTRY.md`](./CURSOR_AUTOMATIONS_REGISTRY.md) — update
after creating automations in Cursor  
**Master program:** [`MASTER_IMPROVEMENT_PROGRAM.md`](./MASTER_IMPROVEMENT_PROGRAM.md) — all
phases + future prompts  
**Charter:** [`AGENTS.md`](../AGENTS.md)  
**Prompt files (copy-paste):**
[`.github/prompts/cursor-automations/README.md`](../.github/prompts/cursor-automations/README.md)

---

## Overview

| #   | Automation                  | Type   | First trigger                | Tools                   |
| --- | --------------------------- | ------ | ---------------------------- | ----------------------- |
| 1   | Gold Integrity Agent        | Review | GitHub PR opened / updated   | GitHub, Slack, Memories |
| 2   | Bilingual Consistency Agent | Review | GitHub PR opened / updated   | GitHub, Memories        |
| 3   | SERP Structure Agent        | Review | GitHub PR opened / updated   | GitHub, Memories        |
| 4   | SEO Expansion Agent         | Growth | Weekly schedule              | GitHub, Memories        |
| 5   | Gold Market Insight Writer  | Growth | Daily schedule (UAE morning) | GitHub, Memories        |

**Build order:** 1 → 2 → 3 → 4 → 5. Launch review agents before growth agents.

**Cursor builder:** https://cursor.com/automations

---

## Before you create any automation

### 1. Read the automation policy

[`.cursor/automation-policy.md`](../.cursor/automation-policy.md) defines what “good” means for this
repo. Pin it mentally (or in Cursor project context) before pasting prompts.

### 2. General setup (same for all five)

| Step | Action                                                                          |
| ---- | ------------------------------------------------------------------------------- |
| 1    | Open [Cursor Automations](https://cursor.com/automations) → **New Automation**  |
| 2    | Name = single job only (see each section below)                                 |
| 3    | **One trigger** on day one (add a second trigger only after first run is clean) |
| 4    | Enable **Memories** on every automation                                         |
| 5    | Add **GitHub** for all five; **Slack** only where noted                         |
| 6    | Paste the **Agent Instructions** from the prompt file linked in each section    |
| 7    | Test on narrow scope (one PR or one manual schedule run)                        |
| 8    | Tune prompt if too noisy or too quiet                                           |

### 3. Review vs growth split

| Review agents (strict, corrective) | Growth agents (exploratory, disciplined) |
| ---------------------------------- | ---------------------------------------- |
| Gold Integrity                     | SEO Expansion                            |
| Bilingual Consistency              | Gold Market Insight Writer               |
| SERP Structure                     |                                          |

Review agents: GitHub PR triggers. Growth agents: schedule triggers, proposal/draft only at launch.

---

## Launch plan

| Phase | Automations                            | Mode                                       |
| ----- | -------------------------------------- | ------------------------------------------ |
| **1** | Gold Integrity + Bilingual Consistency | Advisory; Slack for high-risk only         |
| **2** | SERP Structure                         | PR review + optional weekly audit later    |
| **3** | SEO Expansion                          | Proposal-only; no page creation            |
| **4** | Gold Market Insight Writer             | Draft-only; no auto-PR for first 5–10 runs |

Do **not** activate all five on day one.

---

## Memory strategy

Enable **Memories** on every automation. Store short, reusable patterns:

| Category                | Example memory key                         |
| ----------------------- | ------------------------------------------ |
| Pricing regressions     | `pricing_logic_regression`                 |
| Freshness wording       | `live_vs_updated_label_mismatch`           |
| EN/AR terms             | `arabic_term_for_reference_price_approved` |
| Metadata mistakes       | `country_page_title_pattern_approved`      |
| Rejected ideas          | `rejected_page_idea`                       |
| Content angles to avoid | `repeated_content_angle_to_avoid`          |

### Weekly maintenance checklist

1. Which automation produces the best signal?
2. Which is too noisy?
3. Which output format needs tightening?
4. Which memories are genuinely useful?
5. Which should stay advisory only?
6. Which is ready to draft PRs or patches?

---

# Automation 1 — Gold Integrity Agent

> **Most important.** Core safeguard for pricing trust, calculators, freshness language, and search
> integrity.

### Cursor field values

| Field                  | Value                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**               | `Gold Integrity Agent`                                                                                                                                |
| **Description**        | Protects pricing trust, calculator accuracy, freshness labels, and SEO integrity on PRs                                                               |
| **Trigger**            | GitHub → **Pull request opened**; add **Pull request updated** after first clean run                                                                  |
| **Repository**         | `vctb12/GoldTickerLive`                                                                                                                               |
| **Tools**              | GitHub ✓ · Slack ✓ (high-risk only) · Memories ✓                                                                                                      |
| **Agent Instructions** | Copy from [`.github/prompts/cursor-automations/gold-integrity-agent.prompt.md`](../.github/prompts/cursor-automations/gold-integrity-agent.prompt.md) |
| **Slack**              | Notify on `BLOCK` or `High` risk only — not every PR comment                                                                                          |

### Test checklist

- [ ] Connect GitHub to `vctb12/GoldTickerLive`
- [ ] Open a **past or low-risk PR** that touches `translations.js`, a country page, or calculator
      logic
- [ ] Confirm output uses the template (`Decision`, `Risk level`, `Findings`, …)
- [ ] Confirm it flags reference-vs-retail blur if you inject test wording (manual dry run)
- [ ] Confirm it **blocks** (or escalates) changes to `src/config/constants.js` without approving
      silently
- [ ] Confirm Slack fires only on high-risk, not on clean `APPROVE`
- [ ] Save one memory entry from a real finding

### First-run success criteria

| Good                                                | Bad                                                    |
| --------------------------------------------------- | ------------------------------------------------------ |
| Catches risky freshness wording or karat math       | Nitpicks harmless CSS class renames                    |
| Returns `APPROVE` with no findings on docs-only PRs | Blocks every PR regardless of scope                    |
| File-specific findings with exact fix text          | Vague “check pricing” comments                         |
| Escalates production-critical file touches          | Approves changes to `post_gold.yml` without human flag |

---

# Automation 2 — Bilingual Consistency Agent

> Semantic EN/AR parity — meaning alignment, not literal translation.

### Cursor field values

| Field                  | Value                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**               | `Bilingual Consistency Agent`                                                                                                                                       |
| **Description**        | Audits semantic English/Arabic parity on user-visible copy changes                                                                                                  |
| **Trigger**            | GitHub → **Pull request opened**; add **Pull request updated** after first clean run                                                                                |
| **Repository**         | `vctb12/GoldTickerLive`                                                                                                                                             |
| **Tools**              | GitHub ✓ · Memories ✓ · Slack ✗ (optional later)                                                                                                                    |
| **Agent Instructions** | Copy from [`.github/prompts/cursor-automations/bilingual-consistency-agent.prompt.md`](../.github/prompts/cursor-automations/bilingual-consistency-agent.prompt.md) |

### Test checklist

- [ ] Run against a PR that changes `src/config/translations.js`
- [ ] Run against a PR that changes **no** user-visible copy → expect `PASS` + one-line note
- [ ] Verify it flags confidence mismatch (e.g. EN “live” vs AR implying “updated”)
- [ ] Verify suggested rewrites include **both** EN and AR
- [ ] Add one glossary memory (e.g. `reference price` / `سعر مرجعي`)

### First-run success criteria

| Good                                      | Bad                                 |
| ----------------------------------------- | ----------------------------------- |
| Flags meaning drift, not spelling         | Demands literal word-for-word match |
| Natural Arabic suggestions                | English-shaped Arabic               |
| `PASS` when PR is backend-only            | Invented issues on non-copy PRs     |
| Terminology table in output when relevant | Ignores calculator or metadata copy |

---

# Automation 3 — SERP Structure Agent

> Protects titles, metadata, canonicals, hreflang, schema, and search intent.

### Cursor field values

| Field                  | Value                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**               | `SERP Structure Agent`                                                                                                                                |
| **Description**        | Protects SEO structure — titles, canonicals, hreflang, schema, intent                                                                                 |
| **Trigger**            | GitHub → **Pull request opened** / **updated**                                                                                                        |
| **Repository**         | `vctb12/GoldTickerLive`                                                                                                                               |
| **Tools**              | GitHub ✓ · Memories ✓                                                                                                                                 |
| **Agent Instructions** | Copy from [`.github/prompts/cursor-automations/serp-structure-agent.prompt.md`](../.github/prompts/cursor-automations/serp-structure-agent.prompt.md) |
| **Phase 2**            | Add weekly schedule audit (top country pages, calculator, methodology) after PR mode is stable                                                        |

### Test checklist

- [ ] Run on PR touching `countries/` HTML or page metadata
- [ ] Run on PR touching only `tests/` → expect `HEALTHY` + one-line note
- [ ] Confirm duplicate-title detection on related pages
- [ ] Confirm canonical/hreflang issues include exact tag fix
- [ ] Confirm it does not recommend hand-editing `sitemap.xml`

### First-run success criteria

| Good                                           | Bad                                        |
| ---------------------------------------------- | ------------------------------------------ |
| Exact `<title>` / `link rel="canonical"` fixes | Generic “improve SEO” advice               |
| Intent conflict table when two pages overlap   | Schema recommendations unsupported by body |
| `HEALTHY` on non-SEO PRs                       | False positives on every HTML tweak        |

---

# Automation 4 — SEO Expansion Agent

> Finds the next best page opportunities — **proposal-only** at launch.

### Cursor field values

| Field                  | Value                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**               | `SEO Expansion Agent`                                                                                                                               |
| **Description**        | Weekly organic growth proposals — quality over volume                                                                                               |
| **Trigger**            | Schedule → **Weekly** (e.g. Monday 09:00 UTC / 13:00 Dubai)                                                                                         |
| **Repository**         | `vctb12/GoldTickerLive`                                                                                                                             |
| **Tools**              | GitHub ✓ · Memories ✓ · Slack ✗ (optional summary channel later)                                                                                    |
| **Agent Instructions** | Copy from [`.github/prompts/cursor-automations/seo-expansion-agent.prompt.md`](../.github/prompts/cursor-automations/seo-expansion-agent.prompt.md) |
| **Mode**               | Proposal-only — no auto page creation or PRs until quality proven                                                                                   |

### Test checklist

- [ ] Run manually once before enabling schedule
- [ ] Confirm output includes `NO WORTHWHILE IDEAS THIS RUN` when appropriate
- [ ] Confirm each proposed page has slug, intent, outline, internal links
- [ ] Confirm rejected fluff (duplicate city pages, generic guides) is absent
- [ ] Confirm EN+AR recommendation for user-facing pages
- [ ] Memory records proposed and rejected topics

### First-run success criteria

| Good                                       | Bad                                  |
| ------------------------------------------ | ------------------------------------ |
| 3–5 high-intent ideas with cluster context | 20 thin page ideas                   |
| Quick wins / strategic / cluster buckets   | Financial advice tone                |
| Honest “no ideas” run                      | Forced pages every week              |
| Internal link plan in/out                  | Reference price framed as shop quote |

---

# Automation 5 — Gold Market Insight Writer

> Drafts market commentary when movement justifies it — **draft-only** at launch.

### Cursor field values

| Field                  | Value                                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Name**               | `Gold Market Insight Writer`                                                                                                                                      |
| **Description**        | Daily draft market commentary when price movement warrants publication                                                                                            |
| **Trigger**            | Schedule → **Daily** at **05:00 UTC** (09:00 UAE / Gulf morning)                                                                                                  |
| **Repository**         | `vctb12/GoldTickerLive`                                                                                                                                           |
| **Tools**              | GitHub ✓ · Memories ✓ · Slack ✗ (optional alert on `PUBLISH` later)                                                                                               |
| **Agent Instructions** | Copy from [`.github/prompts/cursor-automations/gold-market-insight-writer.prompt.md`](../.github/prompts/cursor-automations/gold-market-insight-writer.prompt.md) |
| **Mode**               | Draft-only — review first 5–10 outputs manually before any auto-PR                                                                                                |

### Test checklist

- [ ] Run manually; inspect `data/gold_price.json` timestamp and spot in output
- [ ] Confirm `DO NOT PUBLISH` on flat/small move days
- [ ] Confirm draft includes EN + AR title, summary, body, disclaimers
- [ ] Confirm no buy/sell advice or price predictions
- [ ] Confirm memory avoids repeating last week’s angle
- [ ] Cross-check with [`docs/AI_CONTENT_AUTOMATION.md`](./AI_CONTENT_AUTOMATION.md) — no
      auto-publish path

### First-run success criteria

| Good                                             | Bad                                      |
| ------------------------------------------------ | ---------------------------------------- |
| Correct `DO NOT PUBLISH` on quiet days           | Forces daily article regardless of move  |
| Data snapshot with timestamp and state label     | Hype or clickbait headline               |
| Reference vs retail distinction in body          | Fabricated news or certainty             |
| Internal links to tracker/calculator/methodology | Single-language draft for public content |

---

## Operating method summary

```text
PR opened/updated
       │
       ├── Gold Integrity Agent      → APPROVE | COMMENT | BLOCK
       ├── Bilingual Consistency     → PASS | NEEDS REVISION | HIGH-RISK MISMATCH
       └── SERP Structure Agent      → HEALTHY | WATCH | BROKEN

Schedule (weekly/daily)
       │
       ├── SEO Expansion Agent       → PROPOSE | NO WORTHWHILE IDEAS
       └── Market Insight Writer     → PUBLISH | DO NOT PUBLISH
```

Every automation must support a **do nothing** outcome. That is a feature, not a failure.

---

## Relationship to existing repo tooling

| System                                 | Purpose                         | This playbook                                         |
| -------------------------------------- | ------------------------------- | ----------------------------------------------------- |
| GitHub Actions (`docs/AUTOMATIONS.md`) | Price fetch, X-post, deploy, CI | Complementary — do not duplicate                      |
| `.github/prompts/pr-review.prompt.md`  | Interactive PR review in chat   | Overlaps Integrity + SERP — automations are always-on |
| `.cursor/agents/gold-trust-auditor.md` | Subagent for pricing surfaces   | Integrity Agent superset for PR automation            |
| `docs/AI_CONTENT_AUTOMATION.md`        | Admin draft pipeline            | Insight Writer feeds human review, not auto-publish   |

---

## Quick start (minimum viable)

If you only set up **three** automations first:

1. **Gold Integrity Agent** — PR trigger
2. **Bilingual Consistency Agent** — PR trigger
3. **SERP Structure Agent** — PR trigger

Add growth agents after review signal quality is stable.

---

## Changelog

| Date       | Change                                                   |
| ---------- | -------------------------------------------------------- |
| 2026-06-09 | Initial playbook + five prompt files + automation policy |
