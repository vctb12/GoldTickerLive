# Revamp PR batch-review guide (Phases 46–64)

A single index of the **20 open revamp PRs** (#589–#607, #609, #610) so they can be reviewed and
merged efficiently. All 20 are green on CI (the only non-success anywhere is a benign `cancelled`
Lighthouse run on #596). None are merged yet; the last merged revamp PR was **#588** (Phase 41).

This guide is descriptive — it does not change any code.

## TL;DR

- **Every PR is independent** (each branched off `main`, none stacked) and mergeable in any order,
  **with one caveat**: four of them each add a distinct `false` flag to the same frozen block in
  `src/config/feature-flags.js`, so the **2nd, 3rd, and 4th of those will show a trivial merge
  conflict** — resolve by keeping all flags (see "Merge-conflict note" below).
- **Nothing changes user-facing behavior on merge** unless noted: pure libs, test-only locks, and
  flags that default **OFF**. The two behavior-affecting merges are #589 (CSS/asset fixes) and #590
  (freshness flap fix) — both intended improvements.
- **Highest-leverage batch to merge:** the metals view-model stack **#601–#606**. Merging it
  unblocks an end-to-end multi-metal orchestrator + page wiring (currently impossible to build/test
  because those modules aren't on `main`).

## Suggested merge order

1. **Ship-now, behavior-improving (merge first):** #590 (freshness flap fix), #589 (footer/favicon
   fixes + history-backfill mechanism).
2. **Test-only regression locks (zero risk):** #599, #609, #610.
3. **Pure libraries, unflagged, not yet wired (zero runtime effect):** #592, #598, #606.
4. **Flagged-OFF capabilities (dormant until you flip a flag):** #591, #594, #596, #600, #601–#605,
   #607. Merge the **metals set #601–#606 together**.

## The PRs

| PR   | Phase | What it adds                                                                                                      | Flag (default OFF)                    | Merges change behavior?      | Owner action to activate                                                                            |
| ---- | ----- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| #589 | 46    | Footer-heading + favicon-404 fixes; **history-backfill mechanism** (`monthly-baseline-merge.js` + CLI + template) | —                                     | **Yes** (CSS/asset fixes)    | Paste the **11 monthly gold averages** (Sep 2025–Jul 2026) + run the backfill CLI to extend history |
| #590 | 47    | Freshness/fallback **hysteresis** (Schmitt-trigger) — fixes the Live/Cached/Fallback badge flapping               | —                                     | **Yes** (flap fix)           | None                                                                                                |
| #591 | 48    | Data-source **health dashboard** view-model                                                                       | `DATASOURCE_HEALTH_DASHBOARD_ENABLED` | No                           | Flip flag + choose a mount surface                                                                  |
| #592 | 49    | **Price audit-trail** pure lib (step-by-step derivation, matches the live formula)                                | — (pure lib, unwired)                 | No                           | Optional: surface behind a "How is this calculated?" affordance                                     |
| #594 | 50    | **Stale-price guard** (age from provider timestamp, downgrade-only)                                               | `STALE_PRICE_GUARD_ENABLED`           | No                           | Flip flag + apply the 2-line clamp (snippet in `reports/PHASE-50-*.md`)                             |
| #596 | 52    | **FX-rate integrity** sanitizer (drops corrupt feed rates; pins AED to the peg)                                   | `FX_INTEGRITY_ENABLED`                | No                           | Flip flag + 1-line wire before `calculateAllPrices`                                                 |
| #598 | 53    | **Retail-premium model** (reference → illustrative retail band) pure lib                                          | — (pure lib, unwired)                 | No                           | Optional: supply per-country VAT; `ShopVsReferencePanel` can adopt it                               |
| #599 | 54    | **Karat-formula** regression test suite (all karats, coupling lock)                                               | — (test-only)                         | No                           | None                                                                                                |
| #600 | 55    | Calculator **localized numeric input** (Arabic/Persian numerals + separators) — dedup + flag-gated `readNumber`   | `LOCALIZED_NUMERAL_INPUT_ENABLED`     | No (byte-identical when OFF) | Review the UX + flip flag                                                                           |
| #601 | 56    | **Multi-metal comparison** view-model                                                                             | `METALS_PILOT_ENABLED` (existing)     | No                           | Non-gold spot feeds + flip pilot                                                                    |
| #602 | 57    | **Multi-metal feed adapter** (`data/<metal>_price.json` → spot map)                                               | — (pure)                              | No                           | Non-gold spot feeds                                                                                 |
| #603 | 58    | **Per-metal freshness** view-model (reuses the canonical policy)                                                  | — (pure)                              | No                           | Non-gold spot feeds                                                                                 |
| #604 | 59    | **Metal + grade selector** state / URL model                                                                      | — (pure)                              | No                           | Non-gold spot feeds                                                                                 |
| #605 | 60    | **Multi-metal comparison table** render (escaped, bilingual, a11y)                                                | — (renders only when pilot on)        | No                           | Non-gold spot feeds + flip pilot                                                                    |
| #606 | 61    | **Per-metal SEO / JSON-LD** generator (registry-driven)                                                           | — (pure, not feed-gated)              | No                           | Optional: metal pages can adopt it                                                                  |
| #607 | 62    | **Gold-vs-crypto snapshot** view-model (descriptive)                                                              | `CRYPTO_PILOT_ENABLED` (existing)     | No                           | Crypto spot feed (BTC/USD) + flip pilot                                                             |
| #609 | 63    | **Freshness-badge** metadata regression test                                                                      | — (test-only)                         | No                           | None                                                                                                |
| #610 | 64    | **Karat purity-map** regression test                                                                              | — (test-only)                         | No                           | None                                                                                                |

_(Phase 51 was intentionally skipped — cross-source validation is covered by your own PR #593.)_

## Merge-conflict note (the one thing to expect)

These four PRs each append **one distinct `: false` flag** to the same `Object.freeze({ … })` block
in `src/config/feature-flags.js`:

- #591 → `DATASOURCE_HEALTH_DASHBOARD_ENABLED`
- #594 → `STALE_PRICE_GUARD_ENABLED`
- #596 → `FX_INTEGRITY_ENABLED`
- #600 → `LOCALIZED_NUMERAL_INPUT_ENABLED`

The **first to merge is clean**; the rest will conflict textually on the closing `});` region even
though they're logically independent. **Resolution is trivial: keep every flag** (union of the added
lines). No other file is touched by more than one PR, so no other conflicts are expected.

## Owner-action backlog (gates that keep flagged work dormant)

- **Non-gold spot feeds** — `data/{silver,platinum,palladium}_price.json` in the gold-feed format →
  unlocks Theme B (#601–#605) once `METALS_PILOT_ENABLED` is on.
- **Crypto spot feed** — BTC/USD (opt. ETH/USD) → unlocks #607 once `CRYPTO_PILOT_ENABLED` is on.
- **11 monthly gold averages** — fills the history-backfill template shipped in #589.
- **French-content review** — Phase 41 batch (already merged as #588) awaits human sign-off.
- **Per-country VAT rates** (optional) — parameters for the #598 premium model.
- **Localized-numeral UX review** — before flipping #600's flag.
- **GitHub connector** — re-authorize if PR automation stalls (it dropped briefly this session).

## What merging unblocks

Once **#601–#606** are on `main`, an end-to-end **multi-metal orchestrator** (feed → comparison →
freshness → render) with a real integration test becomes buildable — today it can't be, because it
would need to import those unmerged modules. That is the single highest-value follow-up.
