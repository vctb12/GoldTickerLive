# Plan: Realtime Homepage Gold Pricing (1-second live updates)

> **Status:** In progress  
> **Opened:** 2026-06-05  
> **Trigger:** Homepage showing `Stale · Source: SecondaryProvider · Updated: 6 days ago`  
> **Owner surface:** `index.html` / `src/pages/home.js` hero live card

---

## 1. Problem statement

Users on the homepage see a trust-breaking freshness strip:

```text
Status: Stale · Source: SecondaryProvider · Updated: 6 days ago
```

This violates AGENTS.md §6.2 (cached/stale values must be labelled — they are — but **serving
6-day-old data as the hero price is a product failure**, not an honest label).

### Root causes (confirmed in code review)

| #   | Cause                                                                                                                                                        | Evidence                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| R1  | **Primary provider only reads hourly static JSON** (`/data/gold_price.json`) or backend `/api/v1/prices/latest` — neither updates per-second on GitHub Pages | `src/lib/quote-providers/primary-provider.js` → `api.fetchGold()`         |
| R2  | **When primary fails, secondary serves ancient localStorage** with no age gate                                                                               | `secondary-provider.js` → `cache.getFallbackGoldPrice()`                  |
| R3  | **`getFallbackGoldPrice()` prefers the older `goldFallback` slot over `goldPrice`**                                                                          | `src/lib/cache.js:182-184` — returns fallback **before** primary          |
| R4  | **Boot path seeds realtime engine from any cached price**, even multi-day-old                                                                                | `home.js:994-1002` `seedFromCache()`                                      |
| R5  | **Poll interval is 5 s**, not 1 s                                                                                                                            | `src/lib/realtime-config.js` `activePollMs: 5000`                         |
| R6  | **No browser-side live API** despite `gold-api.com` supporting CORS (`Access-Control-Allow-Origin: *`)                                                       | Python adapters exist server-side only (`scripts/python/gold_providers/`) |

### What users expect

- Hero XAU/USD price refreshes **every second** while the tab is visible.
- Freshness label reads **Live** when the provider timestamp is < 10 s old.
- If live APIs fail, degrade honestly: cached → delayed → stale — never silently show week-old data
  as the active quote.

---

## 2. Target architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ Browser — homepage realtime pricing engine (1 s poll)       │
└───────────────────────────┬─────────────────────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │ ChainedQuoteProvider (primary)      │
         │  1. GoldApiComQuoteProvider         │  ← live, CORS, ~1 s cadence
         │  2. PrimaryQuoteProvider (static)   │  ← /data/gold_price.json hourly
         └──────────────────┬──────────────────┘
                            │ all fail
         ┌──────────────────▼──────────────────┐
         │ SecondaryQuoteProvider              │
         │  1. /data/last_gold_price.json      │  ← only if timestamp < 75 min
         │  2. localStorage cache              │  ← only if timestamp < 75 min
         └─────────────────────────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │ getLiveFreshness() — unchanged      │  trust contract preserved
         └─────────────────────────────────────┘
```

### Provider truth metadata

| Provider                   | `providerPathSuccessful` | `isFallback`          | Max "live" age                         |
| -------------------------- | ------------------------ | --------------------- | -------------------------------------- |
| `gold_api_com`             | `true`                   | `false`               | 10 s (`FRESHNESS_POLICY.liveMaxAgeMs`) |
| `goldpricez` / static file | `true`                   | `false` if `is_fresh` | file `is_fresh` flag + age             |
| Secondary cache            | `false`                  | `true`                | never "live"                           |

---

## 3. Implementation sequence

### Phase A — Cache correctness (fixes 6-day-old boot) ✅

1. Fix `getFallbackGoldPrice()` to return the **newest** of primary/fallback slots by `updatedAt`.
2. Add `getFreshBootGoldPrice(maxAgeMs)` — returns cache only if within `STALE_AFTER_MS` (75 min).
3. Gate `seedFromCache()` in `home.js` and `tracker-pro.js` through `getFreshBootGoldPrice()`.
4. Gate `SecondaryQuoteProvider` — reject snapshots older than 75 min.

**Rollback:** revert `cache.js` only; no provider changes.

### Phase B — Live API primary chain ✅

1. `src/lib/quote-providers/gold-api-com-provider.js` — browser fetch to
   `https://api.gold-api.com/price/XAU`.
2. `src/lib/quote-providers/chained-provider.js` — ordered failover wrapper.
3. `src/lib/quote-providers/create-providers.js` — shared factory for home + tracker.
4. Update `provider-labels.js` — human labels for `gold_api_com`, `live-primary`.

**Rollback:** point factory back to `PrimaryQuoteProvider` only.

### Phase C — 1-second polling ✅

1. `REALTIME_POLLING_DEFAULTS.activePollMs = 1000`
2. `hiddenPollMs = 5000` (battery-friendly background tab)
3. Tighter backoff floor: `[1000, 2000, 5000, …]`

**Rollback:** restore `realtime-config.js` defaults.

### Phase D — Tests & verification

| Test file                                | What it proves                         |
| ---------------------------------------- | -------------------------------------- |
| `tests/cache-gold-newest.test.js`        | Newest cache wins; stale boot rejected |
| `tests/gold-api-com-provider.test.js`    | Parses live API JSON; handles errors   |
| `tests/chained-quote-provider.test.js`   | Failover order                         |
| `tests/secondary-provider-stale.test.js` | Rejects 6-day-old cache                |
| Existing `provider-failover.test.js`     | Still green                            |

**Commands:**

```bash
export JWT_SECRET="dev-secret-key-for-local-development-32chars"
export ADMIN_PASSWORD="admin-dev-password"
export ADMIN_ACCESS_PIN="123456"
rm -rf playwright-report test-results
npm test -- tests/cache-gold-newest.test.js tests/gold-api-com-provider.test.js tests/chained-quote-provider.test.js tests/secondary-provider-stale.test.js tests/provider-failover.test.js
npm run lint
npm run validate
```

---

## 4. Out of scope (future PRs)

| Item                                  | Why deferred                                                            |
| ------------------------------------- | ----------------------------------------------------------------------- |
| SSE `/api/v1/prices/stream`           | Requires server long-lived worker — see `docs/realtime-architecture.md` |
| TwelveData / FMP browser keys         | API keys must not ship in public client bundle                          |
| `gold-price-fetch.yml` cadence change | Production-critical; hourly cron is separate from browser live path     |
| Service worker strategy change        | `sw.js` already network-first for `/data/gold_price.json`               |

---

## 5. Done checklist

- [x] Homepage hero shows **Live** with `gold_api_com` source when market open and API healthy
- [x] Poll interval = 1 s visible tab (verify in `?debugFreshness=1` SLA panel)
- [x] 6-day-old localStorage no longer boots as active quote
- [x] `getFallbackGoldPrice()` returns newest entry
- [x] Secondary provider rejects stale snapshots
- [x] EN/AR freshness labels unchanged (no new user-visible strings)
- [x] `npm test` green on touched suites (10 focused tests)
- [x] `npm run validate` green
- [x] Tracker (`tracker-pro.js`) uses same provider factory

---

## 6. Risks

| Risk                             | Mitigation                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| gold-api.com rate limits / quota | Static file + cache fallbacks; exponential backoff                                  |
| CORS policy change upstream      | Chained provider falls through to static JSON                                       |
| 1 s polling battery impact       | `hiddenPollMs: 5000`; jitter; existing visibility handler                           |
| Mislabeling stale as live        | `getLiveFreshness()` guards unchanged; `providerPathSuccessful: false` on secondary |

---

## 7. Internal agent prompt

See
[`.github/prompts/realtime-home-pricing.prompt.md`](../.github/prompts/realtime-home-pricing.prompt.md)
for the full handoff prompt used by Cursor / Copilot agents continuing this work.
