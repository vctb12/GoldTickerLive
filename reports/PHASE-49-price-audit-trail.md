# Phase 49 — Price calculation audit trail

**Theme A (trust / data integrity).** A pure, tested module that records the step-by-step derivation
of a displayed reference price, so any shown number is auditable back to live spot.

## What shipped

- **`src/lib/price-audit-trail.js`** — `buildPriceAuditTrail(input, options)` returns the ordered
  derivation of a per-gram reference estimate, plus `renderPriceAuditTrail(trail, options)` for a
  human-readable one-line-per-step render. Pure and side-effect-free.
- **`tests/price-audit-trail.test.js`** — 8 tests.

## The derivation (identical to the live pricing layer)

The module re-derives the **exact** number the pricing layer displays — it does not introduce a
second formula. Four ordered steps:

| #   | Step                      | Operation                                | Output unit |
| --- | ------------------------- | ---------------------------------------- | ----------- |
| 1   | Live spot price           | XAU/USD per troy ounce                   | USD/oz      |
| 2   | Convert ounce → gram      | `÷ 31.1035` (troy oz → gram)             | USD/g (24K) |
| 3   | Apply karat purity        | `× purity` (karat/24)                    | USD/g (nK)  |
| 4   | Convert to local currency | `× FX` — AED uses the fixed `3.6725` peg | AED/g (nK)  |

This is `(spot × purity) / TROY_OZ_GRAMS × fx`, matching `resolveMetalGramPrice`. A dedicated test
asserts equality against the live layer:

```
finalPerGram        === round4(resolveMetalGramPrice('gold','24',{gold:spot}).aedPerGram)
steps[2].output     === round4(resolveMetalGramPrice(...).usdPerGram)
```

## Guardrails honoured

- **Constants untouched.** `TROY_OZ_GRAMS = 31.1035` and `AED_PEG = 3.6725` are read from
  `CONSTANTS`; a test re-asserts both are unchanged. AED with no explicit `fxRate` defaults to the
  peg and the FX step is labelled `(fixed peg)`.
- **No fabricated numbers.** Invalid input (spot ≤ 0, purity ≤ 0 or > 1, non-AED with fxRate ≤ 0)
  returns `status: 'unavailable'` — never a made-up figure. The disclaimer is present even then.
- **Framing preserved.** Every trail carries the _"Spot-linked, bullion-equivalent reference
  estimate — not retail pricing and not financial advice"_ disclaimer (EN + AR).
- **Bilingual.** Labels, operations, and disclaimer localise for `lang: 'ar'`.

## Wiring

This is a library module only. It is **not yet wired into any page** — a future phase can surface
the trail behind a "How is this calculated?" affordance on the tracker/calculator. Shipping the
verified derivation engine first keeps the change small and reviewable.

## Verification

- `node --test tests/price-audit-trail.test.js` → 8/8 pass
- `npm test` → 1400/1400 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0 (pre-existing seo-governance staleness warning is unrelated to this
  pure-lib change)

## Owner action

None. No credentials, content review, or business decision required for this phase.
