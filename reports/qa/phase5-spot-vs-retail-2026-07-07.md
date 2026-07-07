# Phase 5 — Spot-vs-retail hardening (Track B)

Verifies and hardens the spot-linked-reference vs retail-quote separation across every price
surface, per the non-negotiable "reference ≠ retail" rule and EN/AR parity.

## Audit result — separation is already strong

Every price surface already carries explicit spot-vs-retail framing:

| Surface       | Framing present                                                                                                                                        | Bilingual?                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| index (home)  | `#trust-banner-copy` "spot-linked reference estimates, not final retail…"                                                                              | ✅ id, localized by `home.js`       |
| tracker       | multiple ("bullion estimates — not retail or jewelry quotes", method "Retail vs bullion")                                                              | ✅ translations.js keys             |
| calculator    | `#calc-trust-note` built in JS with "not final retail jewelry quotes"                                                                                  | ✅ `calculator.js:1052` (EN/AR)     |
| compare       | `.compare-trust-note` "Spot-linked reference estimates — not final retail quotes."                                                                     | ❌ **sentence was EN-only** → fixed |
| heatmap       | `.heatmap-trust-note` "Spot-linked reference estimates — not final retail quotes."                                                                     | ❌ **sentence was EN-only** → fixed |
| portfolio     | reference-valuation framing (making charges called out)                                                                                                | ✅                                  |
| shops         | `#shops-price-disclaimer` "spot-based estimates, not actual shop prices; retail quotes include making charges…" + "Why shop prices differ from spot →" | ✅ `shops.js` localized             |
| country pages | market-intel VAT/making-charge/retail-estimate panels                                                                                                  | ✅                                  |

## The one real gap fixed — EN/AR parity on the compare + heatmap trust note

On `compare.html` and `heatmap.html`, the trust sentence sat as a bare text node inside
`<p class="*-trust-note">`, and each page's `applyLang()` localized the neighbouring methodology
link but **not** the sentence. So in Arabic (`?lang=ar`) the most prominent spot-vs-retail statement
on those two pages **stayed in English** — a violation of the non-negotiable EN/AR parity rule on
exactly the kind of trust copy that must not diverge.

**Fix (mirrors the proven pattern already used for `*-sub`, `*-h1`, etc.):**

- Wrapped the sentence in `<span id="compare-trust-text">` / `<span id="heatmap-trust-text">`.
- Added a `trustNote` key to both the EN and AR dictionaries in `src/pages/compare.js` and
  `src/pages/heatmap.js`.
- Added `set('…-trust-text', dict.trustNote)` inside each `applyLang()`.

AR copy: **«تقديرات مرجعية مرتبطة بالسعر الفوري — وليست أسعار تجزئة نهائية.»** — semantic parity
with the EN, matching the site's existing AR reference/retail vocabulary.

## Not changed (intentionally)

- Calculator density / preset copy — owned by **PR #535**; not touched.
- Heatmap legend/keyboard/table polish — **Phase 25**; the spot/retail _lens toggle_ — **Phase 31**.
- Methodology deep-link enrichment — **Phase 7**.

## Verification

`npm run validate`, `npm test`, `npm run build` all green; the two pages render the Arabic trust
note under `?lang=ar` (verified against the built bundle).
