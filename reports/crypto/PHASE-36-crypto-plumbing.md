# Phase 36 — Crypto price-history plumbing (Yellow · no UI)

Plumbing only, exactly as scoped ("no UI"). Adds the client-side foundation so a future
gold-vs-crypto correlation view (Phase 37) can pull BTC/ETH history through the **same**
`historical-data.js` pipeline the gold chart already uses — with zero new charting code and zero
change to gold.

## Shipped

- **`src/config/crypto-assets.js`** — registry: `btc` (`BTC/USD`, primary) and `eth` (`ETH/USD`),
  bilingual names, display decimals. `CRYPTO_PILOT_ENABLED = false` — the master switch, off until a
  real feed and a UI phase exist. Helpers `cryptoKeys()`, `getCryptoAsset()`.
- **`src/lib/crypto-history.js`** — `normalizeCryptoPoint()` / `normalizeCryptoHistory()` turn raw
  crypto points (`{date|time, price|close|value}`, ISO/epoch/Date accepted) into the **exact
  `{ date, price, granularity, source, asset }` records** that `historical-data.js` consumes. Series
  are sorted ascending, de-duplicated per date (last write wins), and non-positive/unparseable
  points dropped.
- Both modules are **unimported** → tree-shaken out. No UI, no live fetch, no behaviour change.

## Why this shape

The gold chart's `toChartData(records)` is asset-generic (`{date, price}` → `{time, value}`), and
`filterByRange` works on any dated records. By emitting crypto history in the identical record
shape, Phase 37 can chart gold and BTC on the same axis and compute a rolling correlation using the
existing utilities — no parallel charting stack.

## Tests — `tests/crypto-history.test.js` (5)

Pilot ships OFF; registry has BTC(primary)/ETH with pair symbols; `normalizeCryptoPoint` rejects
junk (zero/negative price, bad date, unknown asset) and accepts valid points;
`normalizeCryptoHistory` sorts, de-dupes, and drops bad points; and **the normalized records flow
through the real `toChartData` unchanged**.

## Owner-gated dependency (recommend-only)

Live crypto history needs a price feed — e.g. an owner-added workflow writing `data/crypto/btc.json`
(and eth), mirroring the gold pipeline. No such fetch is added here (owner-gated territory), and the
`BTC/USD` / `ETH/USD` symbols in the registry match the common feed conventions.

## Honesty framing (carried to Phase 37)

Crypto is for **descriptive comparison only** — correlation, not causation, never a prediction or
investment signal. The pilot flag keeps all of it off until that framing ships with the UI.

## Constraints honoured

Gold history untouched; $0 / no dependency; pilot OFF; no owner-gated files modified; no UI.

## Gate

`npm run build` + `npm run validate` + `npm test` (1291 pass, +5) + `npm run lint` — all green.
