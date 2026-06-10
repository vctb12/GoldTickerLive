# Bullion Desk — Experience Redesign

```yaml
plan-status: active
priority: P0
class: A
owner: @vctb12
created: 2026-06-10
branch: claude/tender-rubin-ui6hvf
mandate: owner-approved full experience redesign (scope answer "full rewrite")
guardrails_reviewed: true
keeps:
  - static multi-page architecture (no SPA / framework migration)
  - freshness honesty + reference≠retail trust contract
  - EN/AR semantic parity (strings via src/config/translations.js)
  - DOM-safety baseline, prefers-reduced-motion
  - production-critical files untouched (data/gold_price.json, post_gold.yml, AED peg)
extends:
  - docs/plans/2026-06-09_realtime-tracker-motion-revamp-20-phase.md (Spot Terminal / Motion Universe)
```

## Why a new language

The site is already premium and mid-revamp, but the **dark-gradient + dual gold-radial-glow hero**
is the most generic, "template fintech" element on the property — exactly the aesthetic the brief
flags as AI-slop. The redesign breaks from it deliberately.

## Design language: "Bullion Desk" — editorial authority × terminal precision

| Axis   | Direction                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------ |
| Canvas | Light, paper-like, high-contrast editorial surface. Dark mode = "after-hours desk."                    |
| Gold   | Demoted to a **hairline foil accent** (rules, underlines, active states) — never a wash.               |
| Type   | System-serif **display** for Latin headlines; **Cairo** for Arabic/RTL; tabular **mono** for numerics. |
| Hero   | The **price is the hero** — a precision Spot Terminal instrument, not a marketing banner.              |
| Mobile | Native instrument: bottom command dock, sticky live price, swipeable karat chips, sheets.              |
| Motion | Built on existing Motion Universe tokens. Principled: state / attention / feedback / spatial.          |

## Phases

- **P0 — Foundation proof.** This plan doc + `design-lab.html` (internal, `noindex`) validating
  type, surfaces, light/dark, buttons, inputs/focus, cards, badges, freshness pills, motion
  primitives.
- **P1 — Tokens.** Additive, non-breaking: `--font-display`, `--font-numeric`, refined accent/rule
  tokens, editorial rhythm. `critical.css` aligned.
- **P2 — Shell.** Nav/header, footer, mobile drawer/bottom-dock restyle (sitewide inheritance).
- **P3 — Homepage.** Spot Terminal hero, editorial section rhythm, live karat strip, CTA + trust
  hierarchy.
- **P4 — Tracker.** Spot Terminal hero + price-motion + mobile command deck (program Phases 6–11),
  preserving frozen DOM/hash test contracts.
- **P5 — Rollout.** Calculator, compare, shops, countries, learn/insights +
  loading/empty/error/stale states + RTL spot-checks.
- **P6 — QA.** `npm test && npm run lint && npm run validate && npm run build`; reduced-motion +
  keyboard + 360px/RTL + light/dark matrix; before/after screenshots; QA report.

## Constraints on copy

Visual/layout/motion-led. New user-visible strings require EN+AR pairs in `translations.js`;
existing string ids and trust hooks (freshness slots, reference disclaimer, methodology link, ARIA)
are preserved.

## Status log

- 2026-06-10 — Plan created.
- 2026-06-10 — **P0 shipped**: `design-lab.html` proof page; **P1 shipped**: editorial display +
  numeric type tokens, foil/hairline accents (additive, non-breaking, RTL-safe).
- 2026-06-10 — **P3 (homepage) shipped**: hero converted from dark-glow banner to light editorial
  canvas + precision Spot Terminal (tabular-mono price, foil rules, theme-adaptive ink CTA); every
  white-on-dark rule recolored to ink-on-light; section headings adopt the display face for
  page-wide coherence. All DOM ids, ARIA, freshness/trust hooks, and i18n bindings preserved.
- Verified: `npm run lint` (clean), `npm test` (1113 pass / 0 fail), `npm run validate` (green),
  `npm run build` (green). Screenshots captured at 1440 light/dark + 390 mobile.

## Remaining (next sessions)

- **P2 — Shell** (nav/footer/mobile dock) to the new language — sitewide inheritance.
- **P4 — Tracker** Spot Terminal + price-motion + mobile command deck (program Phases 6–11).
- **P5 — Rollout** calculator/compare/shops/countries/learn/insights + state polish + RTL
  deep-check.
- Optional: self-hosted brand display face (currently a system-serif stack — zero-cost interim).
