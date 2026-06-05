# Internal prompt: Realtime Homepage Gold Pricing

> **Use when:** Homepage or tracker shows `Stale · SecondaryProvider · Updated: X days ago`, or when asked to make gold prices update every second with live APIs and backup failover.  
> **Plan:** [`docs/plans/2026-06-05_realtime-home-pricing.md`](../../docs/plans/2026-06-05_realtime-home-pricing.md)  
> **Pricing integrity:** [`.github/instructions/gold-pricing.instructions.md`](../instructions/gold-pricing.instructions.md)  
> **Trust contract:** `src/lib/live-status.js#getLiveFreshness` — never weaken anti-mislabel guards.

---

## Mission

Restore homepage pricing trust by delivering **5-second live XAU/USD reference quotes** in the browser (quota-safe gold-api.com cadence), with honest freshness labels and a multi-tier provider failover chain. Freshness age labels still tick every 1 s in the UI. The user must never see a week-old price occupying the hero card without an explicit stale/fallback label — and the system must **recover to Live** automatically when APIs return.

---

## Context you must internalize

### What the site is

Gold Ticker Live — bilingual static site on GitHub Pages. Production has **no Express backend** on Pages; the browser fetches data directly. An optional Node backend exists for admin/dev but most users hit static hosting.

### Current pipeline (broken path)

1. `home.js` boots from `localStorage` via `cache.loadState()`.
2. `initRealtimeEngine()` seeds from `cache.getFallbackGoldPrice()` — **bug: prefers older fallback slot**.
3. `PrimaryQuoteProvider` calls `api.fetchGold()` → `/api/v1/prices/latest` (fails on Pages) → `/data/gold_price.json` (hourly cron).
4. On failure, `SecondaryQuoteProvider` serves `last_gold_price.json` or localStorage — **no age gate**.
5. Poll every **5 s**; freshness UI ticks every 1 s but price may be days old.

### Why "SecondaryProvider · 6 days ago" appears

- `formatProviderLabel('secondary-provider-cache')` → `"SecondaryProvider"`.
- `getLiveFreshness()` age > 75 min → `stale`.
- Engine failed over to secondary because primary could not return a fresh quote.
- localStorage held a 6-day-old `gold_price_fallback` entry that `getFallbackGoldPrice()` preferred over primary.

### What good looks like

```text
Status: Live · Source: Gold-API.com · Updated: a few seconds ago
```

Price animates every ~1 s when market is open. If gold-api.com fails, static JSON within the hour still shows delayed/cached honestly. Ancient cache is never the active quote.

---

## Non-negotiable guardrails (AGENTS.md §6)

1. **Reference ≠ retail** — hero is spot-linked reference only.
2. **Freshness labels stay visible** — do not hide stale/delayed/fallback pills to look cleaner.
3. **`getLiveFreshness()` is the single vocabulary** — `live | delayed | cached | stale | fallback | unavailable`.
4. **`isFallback === true` → never "Live"** — even if timestamp is 1 s ago.
5. **No API secrets in client bundle** — only use keyless CORS endpoints (gold-api.com free tier) or static files.
6. **AED peg stays 3.6725** — never dynamic.
7. **DOM-safety baseline** — no new `innerHTML` sinks.
8. **Bilingual parity** — new user-visible strings go in `translations.js` (this task should add none).
9. **Do not modify** `post_gold.yml`, `gold-price-fetch.yml`, `data/gold_price.json`, `sw.js`, `constants.js` AED peg without owner approval.

---

## Implementation spec

### A. Fix cache selection

**File:** `src/lib/cache.js`

- `getFallbackGoldPrice()` — return the entry with the **newer `updatedAt`** between `goldPrice` and `goldFallback` keys.
- Add `getFreshBootGoldPrice(maxAgeMs)` using `GOLD_MARKET.STALE_AFTER_MS` from `live-status.js` (75 min). Return `null` if older.

### B. Live API provider

**File:** `src/lib/quote-providers/gold-api-com-provider.js`

```text
GET https://api.gold-api.com/price/XAU
CORS: Access-Control-Allow-Origin: *
Response: { price: number, updatedAt: ISO string, symbol: "XAU" }
```

- `providerId: 'gold_api_com'`
- `providerPathSuccessful: true`
- `isFallback: false`
- `isFresh: true` when HTTP 200 and price passes sanity (1000–10000 USD/oz band, match Python adapter)
- Respect `signal` + `timeoutMs` from engine context
- Throw on network/parse/sanity failure so chain continues

### C. Chained primary provider

**Files:**

- `src/lib/quote-providers/chained-provider.js` — tries providers in order, throws last error if all fail
- `src/lib/quote-providers/create-providers.js` — exports:
  - `createPrimaryQuoteProvider()` → chain `[GoldApiComQuoteProvider, PrimaryQuoteProvider]`
  - `createSecondaryQuoteProvider()` → existing `SecondaryQuoteProvider` with age gate

### D. Harden secondary provider

**File:** `src/lib/quote-providers/secondary-provider.js`

- After loading snapshot, if `ageMs > STALE_AFTER_MS`, treat as unavailable (throw)
- Keep `forcedState: 'fallback'`, `providerPathSuccessful: false`

### E. Polling cadence

**File:** `src/lib/realtime-config.js`

```javascript
activePollMs: 5000,
hiddenPollMs: 20000,
fetchTimeoutMs: 4000,
jitterMs: 100,
backoffMs: [1000, 2000, 5000, 10000, 30000],
```

### F. Wire surfaces

**Files:** `src/pages/home.js`, `src/pages/tracker-pro.js`

- Import `createPrimaryQuoteProvider`, `createSecondaryQuoteProvider` from factory
- Replace direct `new PrimaryQuoteProvider()` / `new SecondaryQuoteProvider()`
- `seedFromCache` only when `getFreshBootGoldPrice()` returns non-null

### G. Provider labels

**File:** `src/lib/provider-labels.js`

```javascript
gold_api_com: 'Gold-API.com',
'live-primary': 'Live',
```

---

## Verification protocol

### Automated

```bash
export JWT_SECRET="dev-secret-key-for-local-development-32chars"
export ADMIN_PASSWORD="admin-dev-password"
export ADMIN_ACCESS_PIN="123456"
rm -rf playwright-report test-results
npm test -- tests/cache-gold-newest.test.js \
  tests/gold-api-com-provider.test.js \
  tests/chained-quote-provider.test.js \
  tests/secondary-provider-stale.test.js \
  tests/provider-failover.test.js \
  tests/realtime-fallback-integration.test.js
npm run lint
npm run validate
```

### Manual (dev server)

```bash
npm run dev
# Open http://localhost:5000/?debugFreshness=1
```

Checklist:

- [ ] Hero price updates ~every 5 s (watch last digit of XAU/USD)
- [ ] Freshness strip: `Live` + `Gold-API.com` + relative age < 10 s
- [ ] SLA debug panel: `p50RefreshIntervalMs` ≈ 1000 ms
- [ ] DevTools → Application → Local Storage: clear `gold_price_*` keys, hard refresh — should recover to Live within 2 s
- [ ] RTL: `?lang=ar` — freshness strip still readable at 360 px
- [ ] Network throttle: block `api.gold-api.com` — should fall back to static JSON with honest delayed/cached label (not 6-day stale)

### What to report in PR

- What / Why / How / Proof / Risks
- Exact commands run vs assumed
- Screenshot of hero with Live label (desktop + 360 px)
- Note gold-api.com quota risk and static-file fallback

---

## Failure modes & responses

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Still "SecondaryProvider" | Primary chain not wired | Confirm factory used in `initRealtimeEngine` |
| "Stale · 6 days ago" after fix | Old localStorage | Clear cache keys; verify `getFreshBootGoldPrice` gate |
| "Live" but price frozen | Timestamp updates but price doesn't | Provider returning same price is OK; verify poll interval |
| CORS error in console | gold-api.com policy change | Add next CORS-friendly backup; static JSON remains |
| Rate limit 429 | Too many tabs / quota | Backoff; fall back to static file; label delayed |

---

## Files touched (expected)

| File | Change |
|------|--------|
| `src/lib/cache.js` | Newest cache selection + `getFreshBootGoldPrice` |
| `src/lib/realtime-config.js` | 1 s polling |
| `src/lib/quote-providers/gold-api-com-provider.js` | New |
| `src/lib/quote-providers/chained-provider.js` | New |
| `src/lib/quote-providers/create-providers.js` | New |
| `src/lib/quote-providers/secondary-provider.js` | Age gate |
| `src/lib/provider-labels.js` | Labels |
| `src/pages/home.js` | Factory + boot gate |
| `src/pages/tracker-pro.js` | Factory + boot gate |
| `tests/*.test.js` | New suites |
| `docs/plans/2026-06-05_realtime-home-pricing.md` | This plan |

---

## Do not do

- Do not claim sub-second WebSocket streaming without server work.
- Do not ship TwelveData/FMP keys in client JS.
- Do not change `DELAYED_AFTER_MS` / `STALE_AFTER_MS` without updating `docs/realtime-baseline-audit.md`.
- Do not remove freshness labels from hero for aesthetics.
- Do not merge if `tests/realtime-fallback-integration.test.js` fails — P1 trust regression.

---

## Success sentence

When complete, a user opening `goldtickerlive.com` during market hours sees the hero XAU/USD price and karat strip refresh every second from `gold-api.com`, labelled **Live** with an honest relative timestamp — and if every live path fails, the UI shows the newest hourly static quote or a clear unavailable state, never a week-old ghost price from localStorage.
