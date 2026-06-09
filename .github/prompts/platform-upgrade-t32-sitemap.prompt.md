---
mode: agent
description: T3.2 — Resolve seo-audit sitemap gaps (28); index vs noindex per governance.
related_instructions:
  - AGENTS.md
  - docs/plans/2026-06-09_platform-upgrade-program.md
related_skills:
  - seo-governance
---

# T3.2 — Sitemap coverage cleanup

## Evidence

Run `npm run seo-audit` — reports ~28 pages not in sitemap (dashboard, legacy gold-price paths, some country/market pages, etc.).

## Goal

1. Export full gap list.
2. Classify each URL:
   - **Index** → add to `build/generateSitemap.js` / generator allowlist
   - **Noindex stub** → add `noindex` + document in `docs/SEO_CHECKLIST.md`
3. Re-run `seo-audit` until remaining gaps are intentional.

## Use

`@.github/prompts/seo-noindex-governance.prompt.md` for stub/karat pages.

## Constraints

- No mass page deletions.
- No silent canonical changes.
- Update upgrade program T3.2 row when done.

## Verify

`npm run seo-audit`, `npm run validate`, `npm test`.
