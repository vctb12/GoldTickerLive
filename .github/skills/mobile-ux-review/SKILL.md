---
name: mobile-ux-review
description: Use for mobile-first redesigns, tracker UX work, homepage/calculator/shops polish, Arabic/RTL mobile review.
when_to_use:
  - A page feels cramped, slow, or unusable on a real phone
  - You're shipping a redesign and need a mobile-first audit
  - Arabic/RTL parity check across changed surfaces
  - Mobile keyboard / input / sticky-control regressions reported
related_files:
  - styles/global.css
  - styles/pages/**
  - index.html, tracker.html, calculator.html, shops.html, methodology.html
  - src/components/nav.js, src/components/footer.js, src/components/ticker.js
related_prompts:
  - .github/prompts/mobile-ux-audit.prompt.md
  - .github/prompts/tracker-flagship-revamp.prompt.md
  - .github/prompts/accessibility-audit.prompt.md
---

# Skill: Mobile UX Review

Use this to systematically improve mobile UX without breaking Arabic/RTL parity or accessibility.

## Inputs to gather

- Which pages are in scope (homepage, tracker, calculator, shops, methodology, country pages)
- Target viewports (default: 360, 390, 430, 768)
- Whether RTL/Arabic parity is part of the scope (default: yes)
- Performance baseline (current Lighthouse mobile scores from `docs/performance-baseline.json`)

## Workflow

1. **Establish baseline.** Take "before" screenshots at each target viewport, EN + AR.
2. **Apply page-specific checklist** (below).
3. **Apply cross-cutting checklists**: tokens, RTL mobile, accessibility.
4. **Implement changes** in coherent commits — token first, then surface, then page.
5. **Take "after" screenshots** at same viewports.
6. **Run** `npm run lint`, `npm run validate`, `npm test`. Optionally `npm run a11y`.
7. **Report** with screenshot pairs + Lighthouse delta.

## Checklists in this skill

- [`checklists/homepage.md`](./checklists/homepage.md)
- [`checklists/tracker.md`](./checklists/tracker.md)
- [`checklists/calculator.md`](./checklists/calculator.md)
- [`checklists/shops.md`](./checklists/shops.md)
- [`checklists/rtl-mobile.md`](./checklists/rtl-mobile.md)

## Common mistakes

- Polishing desktop and shipping; mobile regresses.
- Adding sticky bars that overlap the chart on 360px.
- Translating English-shaped copy as Arabic (run it past a native speaker or simplify).
- Forgetting `inputmode` on numeric inputs.
- Reducing font sizes to "fit" mobile (use truncation + tooltips, not font shrinks).
- Removing the freshness pill to "declutter" — that's a trust violation.

## Final report template

```md
# Mobile UX Review — <scope>

## Pages
- <page>: before / after screenshots at 360 / 390 / 430 / RTL-360

## Changes
- Token: <e.g. consolidated card padding into --space-card>
- Component: <e.g. nav drawer rebuilt with <details>>
- Page: <e.g. tracker hero rebalanced; karat strip scannable at 360px>

## Verification
- `npm run lint` PASS
- `npm test` PASS
- `npm run validate` PASS
- Lighthouse mobile: <before>/<after> for LCP, CLS, TBT
- RTL: verified at <viewports>

## Follow-ups
- <e.g. consider rebuilding calculator inputs as bottom-sheet on mobile>
```
