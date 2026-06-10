---
mode: agent
description: T1.2 — Gap-fill historical archive only if freegoldapi layer is insufficient.
related_instructions:
  - AGENTS.md
  - docs/plans/2026-06-09_platform-upgrade-program.md
---

# T1.2 — Historical archive gap-fill

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)

## Context

Layer 2 already exists: `src/lib/freegoldapi.js` + merge in `src/lib/historical-data.js`. Label: `freegoldapi-reference` (derived).

## Your job

1. **Assess before coding** — run tracker Archive mode; export CSV/JSON via `src/lib/export.js`.
2. Document date range, granularity, and labels in PR.
3. **If sufficient:** close task in registry with evidence — **no code**.
4. **If gaps:** extend merge only; handle missing dates gracefully; keep "Historical baseline" labels.

## Read

- `src/lib/historical-data.js` (layer architecture comment block)
- `src/lib/freegoldapi.js`
- `src/data/historical-baseline.json`

## Verify

`npm test`; attach export sample or screenshot. Do not present monthly baseline as intraday live data.
