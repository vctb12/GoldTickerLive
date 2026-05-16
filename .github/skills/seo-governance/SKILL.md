---
name: seo-governance
description: Use for SEO, sitemap, canonical, robots, noindex, country / city / karat pages, content hubs, and structured data.
when_to_use:
  - SEO audit or strategy change
  - Adding / removing / consolidating pages
  - Sitemap or robots changes
  - Country / city / karat / content hub expansion
  - Custom-domain vs. legacy GitHub Pages cleanup
related_files:
  - scripts/node/seo-governance.js
  - scripts/node/generate-sitemap.js
  - build/generateSitemap.js
  - scripts/node/inject-schema.js
  - scripts/node/check-seo-meta.js
  - robots.txt, sitemap.xml, CNAME
related_prompts:
  - .github/prompts/seo-noindex-governance.prompt.md
  - .github/prompts/country-pages-expansion.prompt.md
---

# Skill: SEO Governance

Keeps Gold Ticker Live's SEO surface coherent: one canonical domain, generated sitemap, enforced
noindex policy, no thin duplicates.

## Inputs to gather

- Scope (which page set is in play)
- Whether canonical / robots / sitemap structure is changing
- Whether new pages are being added (and if they're real / thin)
- Current Search Console signals (if available)

## Workflow

1. **Inventory** the affected URLs. For each: title, H1, meta description, canonical, hreflang,
   index/noindex.
2. **Decide indexation policy** for new pages: thin → `noindex`; real local context → index +
   sitemap.
3. **Update governance allowlist** in `scripts/node/seo-governance.js` for any `noindex` change.
4. **Edit page templates** (or pages directly) — never hand-edit `sitemap.xml`.
5. **Re-run build** (`npm run build`) so sitemap regenerates.
6. **Run** `npm run seo:governance:check`, `npm run validate`, `npm run audit-pages`.
7. **Verify** with `npm run linkcheck` that internal links resolve.

## Checklists in this skill

- [`checklists/canonical.md`](./checklists/canonical.md)
- [`checklists/sitemap.md`](./checklists/sitemap.md)
- [`checklists/noindex.md`](./checklists/noindex.md)
- [`checklists/country-pages.md`](./checklists/country-pages.md)
- [`checklists/content-pages.md`](./checklists/content-pages.md)

## Common mistakes

- Hand-editing `sitemap.xml` (next build wipes it).
- Per-karat city page indexed when it should be `noindex`.
- Canonical pointing to `vctb12.github.io/Gold-Prices/*` instead of `goldtickerlive.com/*`.
- Forgetting hreflang on EN/AR pairs.
- Adding a `noindex` page without updating the governance allowlist (CI fails).
- Keyword-stuffing meta descriptions ("gold gold gold dubai today best rate").

See [`.github/instructions/seo.instructions.md`](../../instructions/seo.instructions.md).
