# Experience Design Reconciliation — EXP-01

**Date:** 2026-08-11  
**Status:** DESIGN_DECISION_RECORDED  
**Evidence:** `docs/audits/2026-07-10_VISUAL_TRANSFORMATION_AUDIT.md`,
`docs/audits/2026-07-12_design-motion-overhaul-audit.md`, and `docs/DESIGN_TOKENS.md`.

## Production audit reconciliation

The existing system already has semantic light/dark tokens, self-hosted fonts, freshness states,
reduced-motion guards, and a dark tracker surface. Prior audits identify four experience debts:

1. Repeated bordered-card patterns flatten page identity.
2. The primary tool is buried beneath metadata and repeated trust copy.
3. Motion is mostly generic reveal behavior.
4. Arabic is structurally mirrored rather than compositionally considered.

The decision is consolidation and hierarchy, not a visual reset. Reference prices, freshness labels,
methodology links, retail disclaimers, and all pricing/data behavior remain protected.

## User-intent map

| Intent                   | EN requirement                                                                                   | AR / RTL parity                                                               | Accessibility note                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Know the reference price | Reference readout and exact freshness state first; retain methodology and spot-vs-retail context | Same claim strength and state wording; readout and copy follow RTL flow       | Named heading, truthful status semantics, and labels beyond color |
| Calculate or compare     | First useful control in the opening viewport; inputs, result, and next action distinct           | Same sequence and labels; Arabic numerals and labels must fit at 390px        | Associated labels, task-order keyboard flow, visible focus        |
| Learn / verify           | Editorial measure with one clear path to methodology or glossary                                 | Same claim and links; narrower reading measure allowed for Arabic             | Heading hierarchy, skip link, link purpose, readable line length  |
| Explore markets / shops  | Separate reference information from retail quote content                                         | Same distinction; map/list controls mirror direction without changing meaning | List equivalent for maps; no color-only map meaning               |

## Three visual direction mockups

### A — Bullion Brief

```text
┌──────────────────────────────────────────────────────────────┐
│ brand · nav                                  language/theme │
├───────────────────────┬──────────────────────────────────────┤
│ reference price       │ today’s context / freshness          │
│ methodology link      │ one primary task                     │
├───────────────────────┴──────────────────────────────────────┤
│ editorial explanation → compact data table                    │
└──────────────────────────────────────────────────────────────┘
```

Editorial and calm; strongest for education and trust. Risk: the tool action may remain too quiet.

### B — Market Desk (selected)

```text
┌──────────────────────────────────────────────────────────────┐
│ brand · market context · language/theme                      │
├──────────────────────────────────────────────────────────────┤
│ REFERENCE READOUT        freshness / source / methodology     │
│ [primary task] [secondary task]                              │
├──────────────────────────────┬───────────────────────────────┤
│ focused tool or chart         │ decision notes / definitions   │
├──────────────────────────────┴───────────────────────────────┤
│ related market links · retail distinction                     │
└──────────────────────────────────────────────────────────────┘
```

Price, state, task, and explanation share a clear sequence. It can absorb the tracker’s authority
while remaining compatible with light mode and content pages.

### C — Souk Atlas

```text
┌──────────────────────────────────────────────────────────────┐
│ regional context / market navigation                         │
├────────────────────────────┬─────────────────────────────────┤
│ market story / image        │ reference price + local context │
├────────────────────────────┴─────────────────────────────────┤
│ browse by intent: calculate · compare · learn · visit         │
└──────────────────────────────────────────────────────────────┘
```

Human and place-led, using existing market imagery. Risk: richness competes with the readout and
raises performance/accessibility pressure.

## Direction scoring and decision

Scores are 1–5; weighting: trust 30%, task speed 25%, EN/AR + RTL 20%, accessibility 15%, reuse /
performance 10%.

| Direction         | Trust | Task | EN/AR + RTL | A11y | Reuse/perf | Weighted | Decision             |
| ----------------- | ----: | ---: | ----------: | ---: | ---------: | -------: | -------------------- |
| A — Bullion Brief |     5 |    3 |           4 |    5 |          5 |     4.25 | Editorial reserve    |
| B — Market Desk   |     5 |    5 |           5 |    5 |          4 | **4.85** | **Selected**         |
| C — Souk Atlas    |     4 |    4 |           3 |    3 |          2 |     3.55 | Selective market use |

Market Desk wins because it gives the reference state and user task a repeatable order while
preserving the trust contract and avoiding a page-wide rewrite.

## Implementation guardrails

- No pricing formulas, constants, data files, server behavior, freshness semantics, or SEO changes.
- Never present a reference price as a guaranteed retail quote.
- Review EN and AR copy as pairs; check RTL at 390px minimum.
- Every interactive state needs keyboard focus, a non-color cue, and reduced-motion behavior.
- Visual regression, axe, and performance checks belong to the integrated stage.
