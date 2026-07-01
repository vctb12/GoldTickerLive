# HTML count summary — baseline lock 2026-07-01

Generated for Phase 0 of [`docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md`](../../docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md).

## Totals

| Metric | Count |
| --- | ---: |
| All `*.html` (excl. `node_modules/`, `dist/`) | **390** |
| Prior baseline (`reports/baseline-2026-05/page-inventory.json`) | 659 |
| Delta since 2026-05 | **−269** |

## By bucket

| Bucket | Count | Indexable intent |
| --- | ---: | --- |
| `countries/` | 263 | Mixed — city hubs `noindex`; `gold-rate/` indexable |
| `content/` | 50 | Mostly indexable guides/landings |
| Root flagship | 18 | Indexable product pages |
| `admin/` | 16 | `noindex` / auth-gated |
| `ar/` mirrors | 7 | Indexable Arabic paths |
| `gold-price/` karat stubs | 4 | Candidate for noindex/redirect (Phase 4) |
| `chart/`, `methodology/` dirs | 2 | Path mirrors |
| **Phantom internal stubs** | **30** | `noindex,nofollow` — consolidation target (Phase 2) |

## Country breakdown (`countries/`)

| Type | Count |
| --- | ---: |
| `*/gold-rate/index.html` | 69 |
| `*/gold-shops/index.html` | 69 |
| City hub `countries/{cc}/{city}/index.html` | 96 |
| Country hub `countries/{cc}/index.html` | 21 |
| Other (e.g. `gold-price/`, `cities/`) | 8 |

## Phantom stub paths (30)

Internal directory guards — not user-facing product pages:

- `config/` (2), `data/` (1), `docs/` (1), `scripts/` (4), `server/` (8), `src/` (11), `styles/` (2), `supabase/` (1)

## Regeneration

```bash
node scripts/node/generate-baseline-inventory.js
# TODO Phase 0: point output to reports/baseline-2026-07/
```
