---
mode: agent
description: F2b — Add historical-context banners to bakeoff docs (optional); no wiring changes.
related_instructions:
  - AGENTS.md
  - docs/plans/2026-06-09_platform-upgrade-program.md
---

# F2b — Archival doc clarity (optional)

## Goal

Bakeoff/migration docs still center **GoldPriceZ** as the old production path. Add a short banner so agents treat them as **historical context**, not current truth. Current primary: **gold-api.com** via `GOLD_PROVIDER_ORDER=gold_api_com,twelvedata_xauusd,fmp_gcusd`.

## Read first

- `docs/gold-price-provider-migration.md`
- `docs/gold-api-provider-evaluation.md`
- `docs/operator-inputs-gold-provider-bakeoff.md`
- `docs/data-source-methodology.md` (canonical current state)

## Rules

- Docs only — **no** workflow, `api.js`, or `data/gold_price.json` changes.
- Banner template (example):

  > **Historical context (2025–2026 bakeoff).** Production today uses gold-api.com as primary. This doc describes the migration from GoldPriceZ — see [`data-source-methodology.md`](../data-source-methodology.md).

## Plan → approval → implement

## Verify

`npm test`, `npm run lint` (if any incidental edits). Update F2b row in upgrade program registry.
