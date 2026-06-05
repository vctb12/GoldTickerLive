# Internal execution prompt — realtime multi-provider gold pricing (final pass)

> **Read this entire prompt before writing code.** Then implement in order. Do not skip
> verification.

---

## Mission

Ship a production-trustworthy realtime gold reference price on the homepage and tracker where:

1. Users never see a week-old price occupying the hero without an honest label.
2. Live paths refresh every **5 seconds** when the tab is visible.
3. At least **five independent fallback sources** are attempted before giving up.
4. Freshness labels use **`getLiveFreshness()` only** — never conflate engine SLA state
   (`freshness-policy.js` 10 s window) with UI vocabulary (`live-status.js` 30 min / 75 min).
5. First paint never flashes ancient localStorage prices.

---

## Root lessons (do not repeat)

| Mistake                                            | Correct approach                                                                                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `getFallbackGoldPrice()` returned older slot first | Always pick **newest** `updatedAt` between cache keys                                                                                         |
| `goldIsFresh = engine.state === 'live'`            | **Never.** Engine uses 10 s live budget; UI uses 30 min. Pass `isFresh: false` only when upstream explicitly stale/fallback; otherwise `null` |
| `loadState()` painted any cached price             | Gate first paint with `getFreshBootGoldPrice()` (≤ 75 min)                                                                                    |
| `last_gold_price.json` parsed wrong schema         | Support `price` + `posted_at_utc` AND legacy `gold.ounce_usd`                                                                                 |
| Single live API                                    | Chain multiple CORS-safe endpoints before static files                                                                                        |
| 1 s polling on gold-api.com                        | 5 s active poll (~720 req/hr/tab); UI age label still ticks 1 s                                                                               |

---

## Target provider waterfall (primary chain)

Try in order; first success wins. All must respect `signal` + `timeoutMs`.

| #   | Provider ID                | Source                                            | CORS        | Freshness expectation                         |
| --- | -------------------------- | ------------------------------------------------- | ----------- | --------------------------------------------- |
| 1   | `gold_api_com`             | `https://api.gold-api.com/price/XAU`              | ✅          | Seconds (live when age ≤ 30 min UI threshold) |
| 2   | `minted_metal`             | `https://mintedmetal.com/api/prices.json`         | ✅          | LBMA twice-daily → delayed/cached honestly    |
| 3   | `primary-provider`         | `/api/v1/prices/latest` → `/data/gold_price.json` | same-origin | Hourly cron file                              |
| 4   | `last-gold-price`          | `/data/last_gold_price.json`                      | same-origin | Recent committed snapshot (≤ 75 min)          |
| 5   | `secondary-provider-cache` | localStorage newest entry                         | local       | ≤ 75 min only; always `isFallback: true`      |

**No API keys in client bundle.** Keyed providers (TwelveData, FMP, GoldPriceZ) stay server-side
only.

---

## `goldIsFresh` bridge (canonical — use everywhere)

```javascript
export function resolveGoldIsFresh(quote) {
  if (quote?.isFallback === true || quote?.isFresh === false) return false;
  if (quote?.isFresh === true) return true;
  return null; // let getLiveFreshness() age thresholds decide
}
```

Never read `snapshot.freshness.state` for UI `isFresh`.

---

## First-paint gate (homepage + tracker)

```javascript
const boot = cache.getFreshBootGoldPrice();
if (boot) {
  goldPrice = boot.price;
  goldUpdatedAt = boot.updatedAt;
  renderHeroCard();
}
// Do NOT paint from loadState() without age gate
```

Fix `loadState()` to use `getFallbackGoldPrice()` (newest), not `goldPrice || goldFallback`.

---

## Files to create/modify

| File                                                  | Action                          |
| ----------------------------------------------------- | ------------------------------- |
| `src/lib/quote-freshness-bridge.js`                   | NEW — `resolveGoldIsFresh`      |
| `src/lib/quote-providers/minted-metal-provider.js`    | NEW                             |
| `src/lib/quote-providers/last-gold-price-provider.js` | NEW — primary-chain file reader |
| `src/lib/quote-providers/last-gold-price-parse.js`    | NEW — shared parse helper       |
| `src/lib/quote-providers/create-providers.js`         | 5-provider chain                |
| `src/lib/quote-providers/secondary-provider.js`       | localStorage only               |
| `src/lib/cache.js`                                    | `loadState` uses newest cache   |
| `src/pages/home.js`                                   | bridge + boot gate              |
| `src/pages/tracker-pro.js`                            | bridge                          |
| `src/lib/provider-labels.js`                          | new labels                      |
| `tests/quote-freshness-bridge.test.js`                | NEW                             |
| `tests/live-provider-chain.test.js`                   | NEW — chain order               |

---

## Verification (must run and report)

```bash
export JWT_SECRET="dev-secret-key-for-local-development-32chars"
export ADMIN_PASSWORD="admin-dev-password"
export ADMIN_ACCESS_PIN="123456"
rm -rf playwright-report test-results
npm test
npm run validate
```

Manual: `npm run dev` → hero shows **Live · Gold-API.com** within 10 s; block gold-api.com in
DevTools → falls through to minted_metal or static JSON with honest label.

---

## Done when

- [ ] 15 s old gold-api quote shows **Live**, not Stale
- [ ] 6-day localStorage does not paint hero on load
- [ ] Primary chain has ≥ 5 sources
- [ ] All tests green
- [ ] PR title says 5-second (not 1-second)
