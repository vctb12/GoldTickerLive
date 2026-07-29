# UAE History Source Audit — 2026-07-29

**Audit UTC:** 2026-07-29T15:11:00.161Z

## Endpoint

| Field | Value |
|-------|-------|
| URL | https://freegoldapi.com/data/latest.json |
| HTTP status | 200 |
| CORS | * |
| Cache-Control | max-age=600 |
| Last-Modified | Mon, 23 Feb 2026 07:06:47 GMT |
| Fetch time | 79ms |

## Raw vs accepted (freegoldapi)

| Metric | Value |
|--------|-------|
| Raw records | 1769 |
| Accepted (repo normalizer) | 359 |
| Rejected pre-2019 | 1410 |
| Rejected bad source | 0 |
| Rejected bad price | 0 |

**Latest raw row:** `{"date":"2026-02-20","price":5059.2998046875,"source":"yahoo_finance"}`

## Unified history (baseline + accepted freegold)

| Metric | Value |
|--------|-------|
| Earliest | 2019-01-01 |
| Latest | 2026-02-20 |
| Age of latest (days) | 159 |
| Freshness | **stale** |
| Max consecutive-day gap | 32 |

### Source counts

- freegoldapi-reference: 358

### Granularity counts

- daily: 358

## 2025+ accepted freegold rows

- Count: 286
- First: 2025-01-02
- Last: 2026-02-20
- Sources: {"yahoo_finance":286}

## Range usability (anchored on latest unified record)

| Range | Observations | Daily | Monthly | Window | Ends near today? |
|-------|-------------|-------|---------|--------|------------------|
| 1M | 22 | 22 | 0 | 2026-01-21 → 2026-02-20 | no |
| 3M | 60 | 60 | 0 | 2025-11-24 → 2026-02-20 | no |
| 6M | 124 | 124 | 0 | 2025-08-25 → 2026-02-20 | no |
| 12M | 253 | 253 | 0 | 2025-02-20 → 2026-02-20 | no |

## Baseline provenance

- File: `src/data/historical-baseline.json`
- Rows: 80 (2019-01-01 → 2025-08-01)
- **Embedded monthly XAU/USD rows. Original upstream source not documented in git history; do not label as verified LBMA/public-domain without owner confirmation.**

## Conclusion

Historical daily reference ends months before audit date. Chart must show stale/delayed coverage — not present as current.
