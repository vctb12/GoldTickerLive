# Gold Ticker Live — Cursor Automation Policy

> Stable definition of “good” for all Cursor Automations on `vctb12/GoldTickerLive`. Read this
> before creating or tuning any automation. Canonical charter: [`AGENTS.md`](../AGENTS.md).

---

## Non-negotiables

1. **Reference prices are not retail shop quotes.** Spot-linked estimates, calculator output, and
   country-page reference tables must never be labeled or implied as guaranteed store prices.
2. **Freshness language is precise.** “Live,” “updated,” “cached,” “delayed,” “fallback,”
   “estimated,” and “closed” each have defined meaning — never use them loosely or interchangeably.
3. **Arabic and English must match in meaning, not just topic.** One language must not promise more
   certainty, urgency, or commercial commitment than the other.
4. **Country and city pages strengthen internal linking, not fragment it.** New or edited pages must
   link into existing clusters (country → city → karat → calculator → methodology).
5. **Schema, canonicals, metadata, and hreflang are product quality, not SEO garnish.** Broken or
   conflicting metadata on important pages is a blocking defect.

---

## Repo anchors (read when relevant)

| Area                        | Canonical file                                      |
| --------------------------- | --------------------------------------------------- |
| Charter                     | `AGENTS.md`                                         |
| Pricing formulas            | `src/config/constants.js`, `src/config/karats.js`   |
| User-visible strings        | `src/config/translations.js`                        |
| Pricing rules               | `.github/instructions/gold-pricing.instructions.md` |
| SEO rules                   | `.github/instructions/seo.instructions.md`          |
| Automation governance       | `.cursor/rules/automation-governance.mdc`           |
| Cursor Automations setup    | `docs/CURSOR_AUTOMATIONS_PLAYBOOK.md`               |
| GitHub Actions (not Cursor) | `docs/AUTOMATIONS.md`                               |

---

## Production-critical files — human review required

Do **not** let any automation auto-merge changes to:

- `post_gold.yml` — hourly X posting
- `gold-price-fetch.yml` — live price data
- `data/gold_price.json` — committed price state
- `sw.js` — service worker (PWA cache)
- `src/config/constants.js` — AED peg (`3.6725`), troy ounce constant

Automations may **flag** changes to these files; they must not silently approve or auto-fix them.

---

## Automation roles

| Type       | Automations                                           | Default mode                    |
| ---------- | ----------------------------------------------------- | ------------------------------- |
| **Review** | Gold Integrity, Bilingual Consistency, SERP Structure | Advisory on PR open/update      |
| **Growth** | SEO Expansion, Gold Market Insight Writer             | Proposal/draft only on schedule |

Review agents must know when to say **APPROVE**, **PASS**, or **HEALTHY** with no findings. Growth
agents must know when to say **no worthwhile ideas** or **DO NOT PUBLISH**.

---

## Memory categories

Store short, reusable patterns — not session noise:

- `pricing_logic_regression`
- `freshness_wording_mistake`
- `en_ar_terminology_decision`
- `metadata_mistake_pattern`
- `approved_title_pattern`
- `rejected_page_idea`
- `repeated_content_angle_to_avoid`

Example keys: `spot_reference_vs_retail_confusion`, `live_vs_updated_label_mismatch`,
`country_page_title_pattern_approved`, `arabic_term_for_reference_price_approved`.

---

## Launch order

1. Gold Integrity Agent
2. Bilingual Consistency Agent
3. SERP Structure Agent
4. SEO Expansion Agent (proposal-only)
5. Gold Market Insight Writer (draft-only)

Full setup: [`docs/CURSOR_AUTOMATIONS_PLAYBOOK.md`](../docs/CURSOR_AUTOMATIONS_PLAYBOOK.md).
