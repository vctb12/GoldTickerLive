# Freshness Contract

## Canonical states

- `live`
- `cached`
- `delayed`
- `estimated`
- `fallback`
- `closed`

The user-visible label layer (`getLiveFreshness` / `getFXFreshness` in `src/lib/live-status.js`)
additionally emits two age/availability states that carry the cautionary (`fallback`-tone) styling:

- `stale` — data older than the stale threshold (gold: 75 min; FX: 26 h).
- `unavailable` — timestamp missing or unparseable.

## Mandatory UI disclosure

Every freshness-capable block must show:

1. State label
2. Source label
3. UTC timestamp

## Trust invariants

- Reference estimates are never shown as retail shop quotes.
- If market is closed, state must be `closed` even with recent data.
- Cached/fallback states must remain visible and never be restyled as live.
- AED conversion default remains `1 USD = 3.6725 AED`.

## Surfaces covered

- Homepage hero trust addons
- Tracker hero trust addons + education panels
- Calculator trust addons

## State machine (engines, thresholds, surfaces)

Two freshness engines plus one canonical classifier coexist (kept separate on purpose — merging them
is a bigger refactor that needs a visual review of every label surface):

| Engine                                                    | States it emits                                            | Live threshold                                                                                                    | Degradation ladder                                                                                   | Surfaces                                                                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `freshness-policy.js` `evaluateFreshnessState` (realtime) | `live cached delayed estimated fallback closed`            | age ≤ 5 s AND provider path successful AND provider healthy                                                       | ≤ 60 s `cached` → ≤ 300 s `delayed` → `estimated`; unhealthy path → `fallback`/`estimated`           | Realtime pricing engine panels on home + tracker (`realtime-pricing-engine.js` recomputes `ageMs` per tick)  |
| `live-status.js` `getLiveFreshness` (hourly JSON)         | `live delayed cached stale fallback unavailable`           | age ≤ 30 min (age path); upstream `isFresh:true` path borrows the 5 s/60 s/300 s budgets, hard-stales past 75 min | > 30 min `delayed` → > 75 min `stale`; `isFallback` → `fallback`; local fetch failure → `cached`     | Hero, shared ticker, spot bar, freshness badges, compare/heatmap/portfolio/calculator badges                 |
| `spot-resolver.js` `classifyFreshness` (canonical)        | `live delayed cached fallback unavailable` (never `stale`) | verifiable timestamp age ≤ `max_freshness_seconds` (payload value, default 900 s)                                 | ≤ 2× budget `delayed` → `cached`; `cache-fallback` source → `cached`; upstream fallback → `fallback` | `snapshot.freshness` on every `getCanonicalSpot` consumer (market, dubai, invest, shops chip, nav pill seed) |
| `live-status.js` `getFXFreshness` (FX)                    | `live cached stale unavailable`                            | age ≤ 26 h                                                                                                        | > 26 h `stale`; cache failure inside the window → `cached`                                           | Non-AED conversion labels (AED never depends on FX — fixed 3.6725 peg)                                       |

The market-closed overlay (`applyMarketClosedOverlay`) is applied by presentation surfaces on top of
all of the above: when the market is closed the surfaced state reads `closed` regardless of age.

### Frozen-flag fix (Midas phase 7)

The committed `data/gold_price.json` carries `freshness_seconds` and `is_fresh` **stamped at
pipeline write time**; neither ages client-side. `classifyFreshness` previously compared that frozen
`freshness_seconds` against `max_freshness_seconds`, so the committed file classified `live` forever
on the canonical-snapshot path. It is now **age-aware**: the effective age is recomputed from the
payload timestamp (`timestamp_utc` / `fetched_at_utc`, normalized to `updatedAt`) against `now`,
taking the worse of (recomputed age, frozen commit-time age). Consequences:

- No verifiable timestamp → never `live` (degrades to `delayed`/`cached` by the frozen tier).
- Payload timestamps in the far future (beyond a 5-minute clock-skew tolerance, mirrored in
  `live-status.js getAgeMs`) are unverifiable → never `live`, never a negative age.
- The snapshot exposes `upstreamFresh` (the raw pipeline `is_fresh` tri-state) so consumers that
  bridge into `getLiveFreshness({ isFresh })` pass upstream truth instead of the age-dependent
  classification (see `home.js seedCanonicalPrice`).

Locked by `tests/midas-freshness-machine.test.js`: state enumeration per engine, exact threshold
boundaries (at vs +1 ms), clock skew, tab-asleep re-evaluation, offline→online recovery, partial
gold/FX degradation, and a fuzzed unreachability proof (≥ 300 random stale-age/flag combos per
engine can never label `live`).
