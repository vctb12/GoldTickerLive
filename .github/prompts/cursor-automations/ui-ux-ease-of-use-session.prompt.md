---
mode: agent
description: One PR-sized UI/UX ease-of-use improvement — homepage, tracker, calculator, nav, or country pages.
related_skills:
  - mobile-ux-review
  - frontend-design-system
related_instructions:
  - .github/instructions/frontend-mobile.instructions.md
  - AGENTS.md
---

# Session: UI / UX ease of use

Read `docs/MASTER_IMPROVEMENT_PROGRAM.md` Track B and `AGENTS.md` guardrails.

## Goal

Make Gold Ticker Live **easier to use** on mobile (360px) and desktop — one coherent slice per PR.

## Pick one surface

| Surface | Examples |
| ------- | -------- |
| Homepage | karat strip, action rail, hero CTAs, freshness visibility |
| Tracker | mode tabs, quote readability, error retry |
| Calculator | result clarity, shops handoff, unit toggles |
| Nav | drawer sections, search, language toggle |
| Country page | local price scanability, cross-links |

## Rules

- Use design tokens from `styles/global.css` — no new hex colors
- All copy via `src/config/translations.js` (EN + AR)
- RTL at 360px required
- Freshness labels stay visible — never hide for aesthetics
- Reference price ≠ retail — never blur in UI copy
- `src/lib/safe-dom.js` for DOM writes
- Smallest correct diff

## Verification

- `npm run validate`, `npm test`, `npm run build`
- Note RTL spot-check
- Screenshot path or describe before/after

## Return format

**What / Why / How / Proof / Risks** + list files touched
