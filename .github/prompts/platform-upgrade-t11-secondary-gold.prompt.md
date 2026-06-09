---
mode: agent
description: T1.1 — Client-side secondary gold source + cross-validation threshold; extend quote-providers only.
related_instructions:
  - AGENTS.md
  - .github/instructions/gold-pricing.instructions.md
  - docs/plans/2026-06-09_platform-upgrade-program.md
related_skills:
  - pricing-data-integrity
---

# T1.1 — Secondary gold + cross-validation

## Goal

Reduce single-source fragility on the **client live lane** by adding a lazy secondary spot check. If primary vs secondary diverge beyond a configurable threshold, show the correct freshness label (delayed/estimated — never unlabeled live).

## Read first

- `src/lib/quote-providers/create-providers.js`
- `src/lib/api.js` (read only — extend, do not rewrite)
- `src/lib/live-status.js` / freshness vocabulary
- `src/lib/quote-providers/fetch-utils.js` (`isSaneGoldSpotUsd`)

## Constraints

- **Do not** change `gold-price-fetch.yml`, `post_gold.yml`, or `data/gold_price.json` wiring.
- **Do not** change `GOLD_PROVIDER_ORDER` in production workflows.
- Secondary sources are **reference/derived** unless proven live — label honestly.
- Lazy fetch — not on every 5s poll.

## Candidates

- `freegoldapi.com` (no key, CORS) — reference only
- Existing adapters in `src/lib/quote-providers/`

## Plan template

1. Add threshold config (e.g. % or USD/oz) in `constants.js` or narrow provider config module.
2. Add secondary fetch + compare in quote-provider chain or thin wrapper.
3. Map divergence to freshness state in existing vocabulary.
4. Tests: threshold boundary, label mapping, simulate primary failure via `setSimulateGoldFail`.
5. Debug panel: optional toggle to force divergence display.

## Verify

`npm test`, `npm run validate`, `?debug=true` manual check. Bilingual strings in `translations.js` if UI copy added.

## PR body

What / Why / How / Proof / Risks / rollback path.
