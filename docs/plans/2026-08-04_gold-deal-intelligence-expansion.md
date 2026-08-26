# Gold Ticker Live — Product Expansion and Deal Intelligence Plan

**Date:** 2026-08-04 (Asia/Dubai) **Status:** D1 MVP implemented on
`codex/gold-deal-intelligence-mvp`; Phase 2 not started **Canonical tracker:**
[`docs/AGENT_MASTER_TRACKER.md`](../AGENT_MASTER_TRACKER.md) **Evidence bundle:**
[`reports/screenshots/2026-08-04-product-expansion-audit/README.md`](../../reports/screenshots/2026-08-04-product-expansion-audit/README.md)

## Executive decision

The highest-leverage safe vertical slice is a local-first **Gold Deal Intelligence Lab**. Gold
Ticker Live already has trusted spot-linked reference pricing, karat math, country/FX conversion,
calculator output, methodology content, and a strong shared shell. The missing buyer moment is the
quote itself: users can calculate a reference value, but they cannot enter the actual seller offer
and see its disclosed components in one neutral comparison.

D1 adds a new static MPA surface, `deal-checker.html`, with a pure calculation core and no new
provider, dependency, secret, account, database, billing, legal/tax assertion, production workflow,
`sw.js`, or pricing-constant change. It keeps the existing canonical spot resolver and FX path,
exposes source/freshness/methodology, and uses only neutral labels: **below, within, or above your
configured benchmark**.

## Verified evidence and current inventory

| Evidence                                            | Finding                                                                                                     | Product implication                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `origin/main` at `ac13c41fa1`                       | Current main includes merged tracker reconciliation PR #723 and later automation commits                    | The canonical tracker is authoritative; stale active rows must not be revived  |
| GitHub snapshot 2026-08-04                          | Open PR #720; merged #716–#719, #721–#723                                                                   | No existing quote-decomposition PR is open; D1 is non-duplicative              |
| `index.html` / live homepage                        | Strong EN/AR hero, visible spot-linked reference disclosure, methodology link, calculator and market routes | Trust foundation is good; buyer intent still routes to a generic calculator    |
| `calculator.html` / `src/pages/calculator.js`       | Reference value, scrap, Zakat, buying power, unit conversion, share/export, freshness and tracker handoff   | Reuse shell, formatter, source contract, and links; do not fork pricing math   |
| `src/lib/spot-resolver.js` / `src/lib/api.js`       | Canonical gold snapshot plus existing FX fetch/cache fallback                                               | D1 can show exact source and timestamp without adding a provider               |
| `src/config/karats.js` / `src/config/constants.js`  | Existing purity factors, AED peg, and troy-ounce conversion                                                 | D1 imports constants; no inline formula constants                              |
| `src/components/site-shell.js`, nav and breadcrumbs | Shared shell supports theme, language, spot bar, footer, mobile navigation and page accents                 | Add one discoverable tool without crowding primary navigation                  |
| Live browser audit                                  | EN home and AR RTL home are visually coherent; mobile calculator was verified at 390×844                    | New page must preserve logical properties, reduced motion, and 360px usability |
| Live user journey                                   | “I’m buying jewellery” points to the generic calculator; no seller quote line-item workflow                 | Quote decomposition is the clearest next buyer utility                         |

The visual audit is evidence, not a claim that every requested viewport was captured on production:
the persistent browser session reliably verified the live desktop EN/AR home and a true 390×844
calculator viewport. The screenshot README records exact paths and limits.

## User journey diagnosis

### Current path

1. A buyer lands on a current-price hero and sees an honest spot-linked reference disclaimer.
2. The “buying jewellery” route opens the generic calculator.
3. The user can estimate metal value, but must manually subtract stones and separately reason about
   making charge, premium, VAT, discount, resale, and the shop’s actual quote.
4. The site has the right education, but the decision context is fragmented across calculator,
   methodology, market pages, and learn content.

### D1 path

1. The buyer opens **Deal Intelligence Lab** from the footer tool directory or a direct link.
2. They enter quote total, gross weight, karat, non-gold weight, and any disclosed components.
3. The existing canonical spot snapshot and selected FX rate are shown with source, timestamp, and
   freshness state.
4. The pure core reports fine gold, reference value, quote rate, disclosed components, residual,
   markup, reference-value share, break-even spot, and an optional resale scenario.
5. The tool labels the comparison against the user’s tolerance without rating the seller.
6. The buyer can save up to three offers locally, copy a URL state, export JSON, print, and continue
   to methodology, the buying guide, or the tracker.

## Opportunity portfolio

Scores are directional: **value** and **confidence** are 1–5, **effort** is 1–5 (higher means more
work), and **gate** identifies an owner decision rather than an implementation task. D1 is the
highest-scoring safe vertical slice, not a commitment to execute every idea.

|   # | Opportunity                        | User/job                          | Value | Confidence | Effort | Gate / disposition                              |
| --: | ---------------------------------- | --------------------------------- | ----: | ---------: | -----: | ----------------------------------------------- |
|   1 | Gold Deal Intelligence Lab         | Check a seller quote              |     5 |          5 |      3 | D1; safe local-first MVP                        |
|   2 | Three-offer comparison board       | Compare shops side by side        |     5 |          4 |      3 | D2; local only                                  |
|   3 | Quote line-item OCR                | Transcribe an invoice             |     4 |          3 |      5 | Owner privacy/security review; later            |
|   4 | Buyer checklist mode               | Know what to ask in a shop        |     4 |          5 |      2 | D3; existing education only                     |
|   5 | Karat and stone-weight explainer   | Understand fine gold              |     4 |          5 |      2 | D3; safe content/link pass                      |
|   6 | Break-even spot scenario           | Understand price sensitivity      |     4 |          4 |      2 | D1; informational only                          |
|   7 | Simple resale scenario             | Understand exit assumptions       |     4 |          4 |      2 | D1; not a buy/sell promise                      |
|   8 | Quote export/print sheet           | Take comparison offline           |     3 |          5 |      2 | D1; no server storage                           |
|   9 | URL state handoff                  | Resume/share a calculation        |     4 |          5 |      2 | D1; excludes shop label                         |
|  10 | Anonymous funnel events            | Measure tool completion           |     3 |          4 |      2 | D1 only existing event catalog; no quote values |
|  11 | Saved local offer labels           | Recognize saved quotes            |     3 |          5 |      1 | D1; local-only                                  |
|  12 | Price freshness audit card         | Know if source is delayed         |     4 |          5 |      2 | D1; existing contract                           |
|  13 | Country-specific tax presets       | Reduce manual entry               |     4 |          3 |      4 | Owner legal/tax review; do not assume           |
|  14 | Retail quote directory integration | Compare local shops               |     5 |          2 |      5 | Owner data/moderation gate                      |
|  15 | Public quote submissions           | Build a price corpus              |     4 |          2 |      5 | Owner privacy/moderation/legal gate             |
|  16 | Merchant dashboard                 | Manage shop quotes                |     4 |          2 |      5 | Owner auth/billing/multi-tenancy gate           |
|  17 | Alerts when benchmark moves        | Return to a saved comparison      |     3 |          3 |      5 | Owner notifications/workflow gate               |
|  18 | Cross-country quote normalization  | Compare different currencies      |     4 |          4 |      4 | Safe after D2 if no new provider                |
|  19 | Image-based weight capture         | Reduce manual scale entry         |     3 |          2 |      5 | Device/privacy review; later                    |
|  20 | Offline install mode               | Use in a shop with weak signal    |     3 |          3 |      4 | `sw.js` owner gate; do not start                |
|  21 | Portfolio-to-deal comparison       | Use holdings in a decision        |     3 |          3 |      4 | Safe only after privacy review                  |
|  22 | Descriptive market context         | Explain recent reference movement |     3 |          4 |      3 | Existing descriptive-only policy                |
|  23 | AI quote explanation               | Ask questions about a quote       |     3 |          2 |      5 | AI/data/privacy/legal owner gate                |
|  24 | Paid export history                | Keep a quote archive              |     2 |          2 |      5 | Billing/account owner gate                      |
|  25 | API quote ingestion                | Import POS/invoice data           |     3 |          2 |      5 | Provider/auth/security owner gate               |
|  26 | Community benchmark dataset        | Improve market context            |     4 |          2 |      5 | Moderation/data provenance gate                 |
|  27 | Making-charge trend report         | Compare labour pricing            |     3 |          3 |      4 | Needs verified retail data                      |
|  28 | Receipt redaction helper           | Share without personal data       |     3 |          3 |      4 | Privacy/security review                         |
|  29 | Buyer negotiation prompts          | Ask for missing line items        |     4 |          4 |      2 | D3; neutral education only                      |
|  30 | Multi-language quote glossary      | Reduce EN/AR terminology drift    |     4 |          5 |      2 | D3; translator review before expansion          |
|  31 | Web-share comparison card          | Share a safe summary              |     3 |          4 |      3 | D2; no PII and no price prediction              |
|  32 | Shop methodology badge             | Show source expectations          |     3 |          3 |      3 | Needs verified shop data; later                 |

## Architecture decision

Use a new page, `deal-checker.html`, because the job is a different intent from generic value,
scrap, Zakat, and buying-power calculations. Keep it in the static MPA and reuse:

- `src/lib/price-calculator.js`, `src/config/karats.js`, and `src/config/constants.js` as the
  existing pricing vocabulary; D1’s component decomposition is isolated in
  `src/pages/deal-checker/deal-checker-core.js`.
- `getCanonicalSpot()` and `api.fetchFX()` for source truth and exact freshness/fallback labels.
- `formatCurrency`, `formatNumber`, and `formatTimestamp` for locale-safe display.
- `mountSharedShell`, `injectBreadcrumbs`, nav data, and existing theme/RTL behavior.
- `safe-dom.js`; dynamic result rows use DOM nodes and text, with no new `innerHTML` sink.
- Existing analytics event names, with quote values and shop labels excluded from payloads.

The core is pure and accepts a context snapshot. Unknown making, premium, or tax fields remain
unknown; they are not silently treated as zero. The core returns neutral `below`, `within`, or
`above` states relative to the user tolerance and never emits a seller-quality judgment.

## D1 MVP boundary

### Included

- EN/AR UI, RTL direction, logical CSS, mobile-first layout, dark theme inheritance, keyboard and
  screen-reader labels, `aria-live` status/error regions, and reduced-motion rules.
- Currency, purchase type, quote total, gross weight, karat, stone/non-gold weight, making charge
  modes, premium modes, VAT/tax modes, discount modes, optional buyback, tolerance, shop label, and
  quote timestamp.
- Fine gold, reference value, per-gross-gram values, implied quote rate, disclosed breakdown,
  residual, markup, markup/gram concept, actual gold share, break-even spot, and simple resale.
- Source, timestamp, freshness, currency, methodology, formulas, reference-vs-retail disclosure,
  validation, partial source failure, URL state, local saved offers, export, print, and copy link.
- Navigation/footer discoverability, breadcrumbs, canonical/hreflang metadata, JSON-LD, unit tests,
  and a Playwright spec for future CI execution.

### Explicitly excluded

Paid APIs, new secrets, production workflow changes, `sw.js`, provider priority, pricing constants,
Supabase/DB writes, authentication, billing, KYC, public submissions, merchant accounts, legal or
jurisdiction-specific tax advice, forecasts, AI advice, and any Phase 2 feature.

## 24-phase expansion roadmap

| Phase | Name                           | Dependency                      | Safe autonomous scope                                          | Owner gate                         |
| ----- | ------------------------------ | ------------------------------- | -------------------------------------------------------------- | ---------------------------------- |
| D1    | Deal Intelligence MVP          | Existing shell/source contracts | Current PR: local quote decomposition                          | No                                 |
| D2    | Three-offer compare board      | D1                              | Local comparison, same snapshot/freshness language             | No                                 |
| D3    | Buyer education handoff        | D1                              | Internal links, checklist, glossary parity                     | No, translator review for new copy |
| D4    | Cross-country normalization    | D2                              | Reuse existing FX/country config only                          | No if no new provider              |
| D5    | Browser matrix stability       | D1                              | Chromium/WebKit/Firefox test stability                         | No                                 |
| D6    | Accessibility audit expansion  | D1                              | Axe, keyboard, focus, 360px/RTL checks                         | No                                 |
| D7    | Print/share QA                 | D1                              | Visual and payload regression tests                            | No                                 |
| D8    | Local export schema versioning | D1                              | Backward-compatible JSON version                               | No                                 |
| D9    | Quote-input presets            | D1                              | Non-legal presets from existing constants only                 | Owner review for any tax preset    |
| D10   | Calculator handoff             | D1                              | Link calculator result into deal inputs without duplicate math | No                                 |
| D11   | Methodology deep links         | D3                              | Formula-specific links and glossary terms                      | No                                 |
| D12   | Local privacy hardening        | D1                              | Storage expiry/clear controls, no server data                  | No                                 |
| D13   | Analytics measurement review   | D1                              | Completion/error definitions using existing catalog            | Analytics consent owner            |
| D14   | Retail data quality design     | D3                              | Schema and moderation brief only                               | Owner data/moderation gate         |
| D15   | Receipt redaction design       | D3                              | Threat model and UX spec only                                  | Privacy/security owner             |
| D16   | Quote OCR prototype            | D15                             | Local prototype only, no upload                                | Privacy/security owner             |
| D17   | Verified shop quote ingestion  | D14                             | Data contract only                                             | Provider/moderation/auth owner     |
| D18   | Merchant workspace             | D17                             | No implementation until auth/billing decision                  | Auth/billing owner                 |
| D19   | Benchmark alerts               | D2                              | Design and event model only                                    | Notifications/workflow owner       |
| D20   | Offline installability         | D1                              | Audit and acceptance spec only                                 | `sw.js`/PWA owner                  |
| D21   | Public quote corpus            | D14                             | Governance and consent spec only                               | Legal/moderation/data owner        |
| D22   | AI explanation study           | D3                              | Prompt/evaluation brief only; no production AI                 | AI/privacy/legal owner             |
| D23   | Paid archive/export            | D8                              | Pricing and entitlements brief only                            | Billing owner                      |
| D24   | Expansion review               | D1–D23                          | Re-score using measured completion and trust signals           | Owner roadmap decision             |

## Measurement definitions

The product question is whether a buyer can reach a trustworthy, understandable comparison, not
whether a quote is “good.” Candidate definitions use the existing event catalog and never send quote
amounts, shop labels, invoice text, or personal data:

- **D1 completion rate:** sessions with `tool_use(deal_checker)` and a valid calculation divided by
  sessions that loaded the page.
- **Disclosure completeness:** valid calculations with no unknown making/premium/tax field divided
  by valid calculations.
- **Source trust visibility:** valid calculations where source, freshness, and timestamp nodes are
  visible in the viewport; browser test proxy in D1, analytics review in D13.
- **Share/export intent:** `share_click` or `export_click` per valid calculation, without recording
  payload contents.
- **Error recovery:** source or validation error followed by a valid calculation in the same
  session.
- **EN/AR parity:** the same core input/output fixtures and no stronger certainty in Arabic.

## Owner decisions required before later phases

1. Whether any quote or shop data may ever leave the browser; D1 assumes no.
2. Whether analytics consent and/or Supabase writes may be expanded; D1 uses existing best-effort
   events only and sends no quote values.
3. Whether verified retail data, shop submissions, merchant auth, or paid history is a product
   direction; these are not implied by D1.
4. Whether `sw.js`, live provider changes, tax presets, or jurisdiction-specific claims are
   approved; D1 makes none of those changes.
5. Translator review before adding more Arabic copy beyond the D1 parity set.

## Rollback and stop conditions

Rollback is one PR revert: remove the new page/controller/core/style/test/doc additions and the
small nav/breadcrumb/translation registrations. Existing calculator and source paths remain
unchanged. Stop and return to owner review if a future phase requires a new provider, production
workflow, secret, database write, authentication, billing, tax/legal claim, retail dataset, or
change to `sw.js`, freshness semantics, provider priority, or pricing constants.
