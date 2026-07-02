# HTML count summary — baseline lock 2026-07-01

Generated for Phase 0 of
[`docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md`](../../docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md).
Updated 2026-07-01 after Phase 2 (phantom stub consolidation) landed.

## Totals

| Metric                                                          |    Count |
| --------------------------------------------------------------- | -------: |
| All `*.html` tracked in git (excl. `node_modules/`, `dist/`)    |  **360** |
| Baseline lock (Phase 0, 2026-07-01)                             |      390 |
| Delta from Phase 2 (phantom stub consolidation)                 |  **−30** |
| Prior baseline (`reports/baseline-2026-05/page-inventory.json`) |      659 |
| Delta since 2026-05                                             | **−299** |

## By bucket

| Bucket                        |                                  Count | Indexable intent                                        |
| ----------------------------- | -------------------------------------: | ------------------------------------------------------- |
| `countries/`                  |                                    263 | Mixed — city hubs `noindex`; `gold-rate/` indexable     |
| `content/`                    |                                     50 | Mostly indexable guides/landings                        |
| Root flagship                 |                                     18 | Indexable product pages                                 |
| `admin/`                      |                                     16 | `noindex` / auth-gated                                  |
| `ar/` mirrors                 |                                      7 | Indexable Arabic paths                                  |
| `gold-price/` karat stubs     |                                      4 | Candidate for noindex/redirect (Phase 4)                |
| `chart/`, `methodology/` dirs |                                      2 | Path mirrors                                            |
| **Phantom internal stubs**    | **0 tracked** (30 generated on demand) | `noindex,nofollow` — consolidated in Phase 2, see below |

## Phase 2 — phantom stub consolidation (done)

The 30 near-duplicate `noindex,nofollow` "Not a public page" stubs under `config/`, `data/`,
`docs/`, `scripts/`, `server/`, `src/`, `styles/`, `supabase/` were removed from git and replaced
with one generator:
[`scripts/node/generate-internal-index-stubs.js`](../../scripts/node/generate-internal-index-stubs.js).

- The 30 paths and template now live in a single source-of-truth script (no more 30 hand-maintained
  copies to keep in sync).
- The generator runs via `predev`, the start of `build`, and the start of `validate` in
  `package.json`, so the stub pages always exist on disk (dev server, CI, and the production build
  all regenerate them) — the public URLs and their content are unchanged.
- The generated `index.html` files are gitignored (see `.gitignore`), so they no longer count
  against the repo's tracked HTML total.

## Country breakdown (`countries/`)

| Type                                        | Count |
| ------------------------------------------- | ----: |
| `*/gold-rate/index.html`                    |    69 |
| `*/gold-shops/index.html`                   |    69 |
| City hub `countries/{cc}/{city}/index.html` |    96 |
| Country hub `countries/{cc}/index.html`     |    21 |
| Other (e.g. `gold-price/`, `cities/`)       |     8 |

## Phantom stub paths (30)

Internal directory guards — not user-facing product pages:

- `config/` (2), `data/` (1), `docs/` (1), `scripts/` (4), `server/` (8), `src/` (11), `styles/`
  (2), `supabase/` (1)

## Regeneration

```bash
npm run baseline:inventory
# or: node scripts/node/generate-baseline-inventory.js
```

## Phase 0 lock (2026-07-02)

- `reports/baseline-2026-07/page-inventory.json` — **344** HTML files on disk (gitignored stubs
  excluded from walk)
- `reports/baseline-2026-07/click-inventory.json` — interactive element inventory
