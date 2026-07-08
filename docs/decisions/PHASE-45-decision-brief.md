# Phase 45 — Decision Brief: White-label, AI, and React Native

_Docs-only. The capstone of the strategic-exploration phases (43–45). It records three
recommendations for the owner to accept or reject, each grounded in a spike or module already built
(Phases 42–44) and each measured against the project's hard constraints — above all **$0-to-run and
no new recurring costs.**_

## The deciding lens

Every recommendation below is filtered through the non-negotiables:

- **$0-to-run, no new recurring costs.** No newsletter automation, WhatsApp Business API, or Stripe.
- **Trust framing.** Every price surface is a spot-linked, bullion-equivalent **reference
  estimate**, never retail; never a forecast or financial advice.
- **Owner-gated boundaries.** `sw.js`, the price/post workflows, and Supabase RLS/billing are not
  touched autonomously.

When a strategic option can only work by breaking one of these, the recommendation is to **defer**,
not to bend the rule.

---

## Decision 1 — White-label

**Recommendation: keep it a design spike; do NOT productise now.**

- **Evidence:** Phase 44 (`src/branding/brand-config.js`, PR #581) shows the _design_ cost is small
  — a six-token colour set per brand plus a `--brand-*` skin layer that never touches the live
  theme. The spike ships behind `WHITE_LABEL_ENABLED = false` and is inert.
- **Why defer productisation:** turning a skin into a product needs tenant identity, a per-tenant
  config store, an auth boundary, support, and — the blocker — **billing**. Billing is a new
  recurring cost and a Stripe-class dependency, both explicitly forbidden. There is no $0 path to a
  real multi-tenant product.
- **Revisit if:** a specific partner commits to a revenue model the owner is willing to run billing
  for. At that point the spike's token layer is the cheap part; the tenancy/billing/support system
  is the real project and needs its own plan.

## Decision 2 — AI features

**Recommendation: descriptive, template-based only. No LLM, no predictions — permanently, not just
for now.**

- **Evidence:** Phase 43 (`src/analysis/market-analysis.js`, PR #580) plus the existing backend
  `server/services/ai-drafts.js` already deliver useful "AI-flavoured" output — market summaries,
  drafts — with **pure string templates over real data**. Phase 43 bakes the honesty contract into a
  CI guard (`assertDescriptiveOnly` rejects forecast/advice/invented-cause language).
- **Why not LLM/predictions:**
  - **Cost:** hosted LLM inference is a per-call recurring cost — a direct $0 violation.
  - **Trust:** a price site that _predicts_ gold or gives buy/sell signals stops being a reference
    tool and becomes de-facto financial advice. That is squarely against the trust framing and a
    real liability.
  - **Correlation ≠ causation** (see the Phase 37 gold-crypto work) is enforced in code for exactly
    this reason.
- **What "AI" means here going forward:** descriptive analysis, summarisation, and drafting from
  first-party data via templates — always disclosed, always human-reviewed before publication (Phase
  41 content policy), never a forecast.
- **Revisit if:** never for predictions. If generative drafting is ever wanted at higher quality, it
  must be an **offline, human-in-the-loop editorial tool** (not a live per-request cost) and still
  never publish forecasts.

## Decision 3 — React Native / native mobile app

**Recommendation: stay PWA-only. Keep React Native parked.**

- **Evidence:** Phase 42 (PWA hardening, PR #579) confirms the installable-app path is essentially
  free and already in place — a valid manifest (installable, maskable icon, `id`), a reusable
  install-prompt controller, and an offline story via the existing service worker. The "mobile app"
  deliverable is satisfied by the PWA.
- **Why not React Native:**
  - **Cost & overhead:** app-store accounts, native build/signing pipelines, store review cycles,
    and a second codebase to maintain in parallel with the web app. None of that is $0, and it
    multiplies maintenance.
  - **No feature gap:** the site is a data-reference tool; it needs no native capability (no camera,
    push-critical, or background-service requirement) that a PWA can't cover.
- **Revisit if:** a native-only capability becomes core (e.g. rich OS-level price alerts that the
  web push story genuinely cannot serve) **and** there is budget for store fees and dual
  maintenance.

---

## Summary

| Question     | Recommendation                               | Primary reason                                   | Built evidence     |
| ------------ | -------------------------------------------- | ------------------------------------------------ | ------------------ |
| White-label  | Design spike only; defer productisation      | Billing/tenancy = new recurring cost, forbidden  | Phase 44 / PR #581 |
| AI features  | Descriptive templates only; no LLM/forecasts | LLM = recurring cost; predictions = trust breach | Phase 43 / PR #580 |
| React Native | Stay PWA-only; RN parked                     | App-store + dual-codebase cost; no feature gap   | Phase 42 / PR #579 |

**Through-line:** in all three cases the _exploration_ is cheap and worth keeping (a token layer, a
template engine, an installable PWA), while the _productised_ version breaks the $0 rule or the
trust framing. The recommendation each time is to keep the cheap, honest capability and defer the
expensive commitment until a concrete trigger — with a named revisit condition — makes it worth
reopening.

## Related decision records

- Phase 37 — correlation is descriptive, never predictive (`reports/crypto/PHASE-37-*`).
- Phase 41 — no machine-translated/agent-drafted content is indexed until human-reviewed
  (`docs/i18n/content-translation-policy.md`).
- Phase 42 / 43 / 44 — the spikes/modules this brief draws on.
