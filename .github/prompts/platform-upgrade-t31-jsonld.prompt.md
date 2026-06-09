---
mode: agent
description: T3.1 — Complete and validate JSON-LD via inject-schema.js (Path A).
related_instructions:
  - AGENTS.md
  - docs/SEO_CHECKLIST.md
  - docs/plans/2026-06-09_platform-upgrade-program.md
related_skills:
  - seo-governance
---

# T3.1 — JSON-LD structured data

## Current

`scripts/node/inject-schema.js` injects Organization, WebSite, BreadcrumbList, FAQPage, Dataset. Build runs `inject-schema.js`; validate runs `--check`.

## Goal

1. Inventory gaps per page type (home, tracker, calculator, FAQ, country, methodology).
2. Extend `inject-schema.js` (Path A — no `schema-dts` unless owner requests).
3. Per-country localized `BreadcrumbList` where missing.
4. Validate each type: [Google Rich Results Test](https://search.google.com/test/rich-results), [Schema Markup Validator](https://validator.schema.org/)

## Constraints

- No silent canonical URL changes.
- `npm run validate` must stay green.
- Invalid schema suppresses rich results — validate before merge.

## Verify

`npm run validate`, `inject-schema.js --check`, validator checklist in PR body.
