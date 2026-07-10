# Multi-Metal Go-Live Checklist (owner decision packet) — 2026-07-10

**Author:** Claude Code (autonomous cowork run, DP-6) · **Type:** docs-only, no code/workflow
changed **Purpose:** give the owner one ordered, verifiable sequence to take the **silver / platinum
/ palladium** expansion from "code-complete, awaiting owner feed credentials" to live — and to name
the single gated step that blocks it. Nothing here edits an owner-gated surface; it _describes_ the
change so the owner can approve/apply it.

> Guardrail reminder: the only production-critical, owner-gated edit in this whole sequence is to
> `.github/workflows/gold-price-fetch.yml` + `scripts/python/fetch_gold_price.py`. This agent did
> **not** touch either. The AED peg (3.6725) and the gold pricing path stay byte-identical.

---

## 1. What's already done (code-complete, in open PRs)

All client-side. All base on `main` (independent, not stacked). All were checks-passing when opened.

| PR   | Phase | What it adds (client-side)                                                                           |
| ---- | ----- | ---------------------------------------------------------------------------------------------------- |
| #602 | 57    | Multi-metal spot-feed **ingestion adapter** — normalizes per-metal quotes into the app's price model |
| #603 | 58    | **Per-metal freshness** view-model (each metal carries its own state/timestamp)                      |
| #601 | 56    | Multi-metal **comparison view-model**                                                                |
| #604 | 59    | **Metal + grade selection** state / URL model                                                        |
| #605 | 60    | Multi-metal **comparison table render**                                                              |
| #606 | 61    | Registry-driven **per-metal SEO / JSON-LD** view-model                                               |
| #607 | 62    | Gold-vs-crypto snapshot comparison (Theme C start) — separate track, see §6                          |

Supporting foundation already on `main`: `src/config/metals.js` (XAU/XAG/XPT/XPD symbols + fineness
grades), `src/lib/metal-pricing.js` (same formula as gold), and the pilot flag
`src/config/metals-flags.js` → `METALS_PILOT_ENABLED = false`. Tests: `tests/metals.test.js`,
`tests/metal-pricing.test.js` prove non-gold pricing is byte-identical to the gold path.

## 2. The ONE thing that blocks go-live (owner-gated)

The live price file **`data/gold_price.json` is single-metal today** — it carries
`raw_symbol: "XAU"` and `xau_usd_per_oz` only. The UI PRs can render silver/platinum/palladium, but
there is **no silver/platinum/palladium data to render** until the fetch pipeline produces it.

Producing it requires two owner-gated edits (NOT made here):

1. **`scripts/python/fetch_gold_price.py`** — currently fetches gold (XAU) only. It must also fetch
   XAG / XPT / XPD and write them into the data file (see §3 for the data-contract).
2. **`.github/workflows/gold-price-fetch.yml`** — the scheduled workflow that runs the script and
   commits the data file. Production-critical; edits are owner-gated.

**Prerequisite to even attempting the above:** confirm the configured providers actually return
XAG/XPT/XPD for the current keys. The provider chain (from the workflow env) is `GOLD_API_COM`,
`TWELVEDATA`, `FMP`, `GOLDPRICEZ`. **Owner action:** verify each key's plan includes
silver/platinum/ palladium spot, and that gold-api.com's `XAG`/`XPT`/`XPD` endpoints are in the
entitlement. If a provider doesn't cover a metal, that metal must fall back or stay off — never
fabricate a number.

## 3. Data-contract the fetch step must satisfy (so the client PRs light up)

The client ingestion adapter (#602) expects per-metal spot in USD/oz. The safest additive shape
keeps the existing gold fields untouched (zero risk to the live gold path) and adds a `metals` map:

```jsonc
{
  "schema_version": 2, // bump; client must treat missing `metals` as gold-only
  "raw_symbol": "XAU", // unchanged
  "xau_usd_per_oz": 4123.0, // unchanged — gold path stays byte-identical
  "aed_peg": 3.6725, // unchanged, fixed
  "metals": {
    "gold": {
      "symbol": "XAU",
      "usd_per_oz": 4123.0,
      "timestamp_utc": "…",
      "is_fresh": true,
      "is_fallback": false,
      "provider": "gold_api_com",
    },
    "silver": {
      "symbol": "XAG",
      "usd_per_oz": 51.2,
      "timestamp_utc": "…",
      "is_fresh": true,
      "is_fallback": false,
      "provider": "gold_api_com",
    },
    "platinum": {
      "symbol": "XPT",
      "usd_per_oz": 1012.0,
      "timestamp_utc": "…",
      "is_fresh": false,
      "is_fallback": true,
      "provider": "…",
    },
    "palladium": {
      "symbol": "XPD",
      "usd_per_oz": 1230.0,
      "timestamp_utc": "…",
      "is_fresh": true,
      "is_fallback": false,
      "provider": "…",
    },
  },
}
```

Rules the fetch step must honor (mirror the existing gold rules):

- Each metal carries its **own** freshness (`is_fresh`, `timestamp_utc`, `max_freshness_seconds`)
  and `is_fallback` — the per-metal freshness view-model (#603) surfaces these labels. Never show
  one metal's freshness for another.
- A metal with **no live quote** must be emitted as `is_fallback: true` (last good value) or omitted
  — never invented. The UI already has cached/fallback labels for this.
- AED for every metal is derived with the **same**
  `aed_per_gram = usd_per_oz / 31.1035 * purity * 3.6725` used for gold. No new peg, no new
  constant.

## 4. Ordered merge / enable sequence (owner)

1. **Confirm provider entitlement** for XAG/XPT/XPD (§2 prerequisite). If any metal is uncovered,
   decide: fallback-only or exclude. Record the decision.
2. **Merge the client PRs behind the OFF flag first — zero user-visible change** (safe to do now,
   even before data exists), in this order so each rebases cleanly: #602 → #603 → #601 → #604 → #605
   → #606. They render nothing while `METALS_PILOT_ENABLED = false` and `data.metals` is absent.
3. **Land the fetch change** (owner-gated): update `fetch_gold_price.py` to emit the §3 `metals`
   map; update `gold-price-fetch.yml` only if new secrets/args are needed. Verify one scheduled run
   writes a valid multi-metal `data/gold_price.json` with correct per-metal freshness.
4. **Flip the flag** `METALS_PILOT_ENABLED = true` in `src/config/metals-flags.js` (one-line PR).
5. **Verify live** (§5), then announce.

Rationale for order: steps 2 (client, OFF) and 3 (data) are independent and reversible; the flag
flip (4) is the single switch that makes it user-visible, so it goes last and is trivially
revertible.

## 5. Go-live verification (must all pass before/after the flag flip)

- [ ] `npm test` green (metals pricing byte-identical to gold; peg 3.6725 asserted — see DP-3 #621).
- [ ] `data/gold_price.json` contains `metals` with 4 keys; each has its own freshness + provider.
- [ ] Each metal's AED derives via 3.6725 and 31.1035 (spot-check silver:
      `usd_per_oz/31.1035*1.0*3.6725`).
- [ ] Spot is labeled **reference/estimate**, not retail, for every metal (DP-5 guard #623 pattern).
- [ ] Every metal surface shows freshness state + source + UTC timestamp (no un-labeled numbers).
- [ ] A metal with no live quote shows Cached/Fallback — never a fabricated live value.
- [ ] EN/AR parity + RTL intact on the new metal UI (DP-4/#622 pattern).
- [ ] Lighthouse/CLS within budget on the pages that gained the comparison table.

## 6. Adjacent, separately-gated items (do NOT auto-bundle)

- **#607 gold-vs-crypto snapshot** — needs a crypto price source + strict "correlation ≠ causation,
  not investment advice" framing. Separate data source; keep behind its own pilot; not part of the
  metals go-live.
- **#593 secondary-provider cross-validation (live lane)** — flag-gated client wiring; going live
  means enabling cross-validation in the production `gold-price-fetch.yml` (owner-gated).
  Independent of metals; own decision.

## 7. What this packet did NOT do (honesty)

- Did **not** edit `fetch_gold_price.py`, `gold-price-fetch.yml`, `sw.js`, secrets, or the flag.
- Did **not** verify provider entitlement for XAG/XPT/XPD (requires the owner's provider dashboards
  / keys — unavailable to this agent).
- The §3 JSON shape is a **recommendation** consistent with the existing client adapter (#602) and
  data file; the owner/implementer should reconcile field names against #602's adapter before
  coding.
