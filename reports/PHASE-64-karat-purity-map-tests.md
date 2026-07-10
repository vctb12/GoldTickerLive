# Phase 64 — Karat purity-map regression lock (shippable-now)

A regression lock on `src/lib/karatPurity.js` — the pricing-critical karat-code→purity lookup, which
was **untested**. Immediately mergeable: test-only, no source change, no feed, no flag, no
dependency on any open PR.

## Why this

Continuing the shippable-now shift (19 tested PRs open and unmerged; more flagged-OFF-pending-feed
modules would just add to the pile). `karatPurity.js` derives `KARAT_PURITY_MAP` (karat code →
purity) from the canonical `KARATS` array — a lookup on the pricing hot path — yet had no test. This
locks it down.

## What it guards

`src/lib/karatPurity.js` is tiny but load-bearing:

```js
export { KARATS } from '../config/karats.js';
export const KARAT_PURITY_MAP = Object.fromEntries(KARATS.map((k) => [k.code, k.purity]));
```

The suite pins:

- **One entry per karat**, each purity **exactly `code / 24`** (24K = 1.0), every value in `(0, 1]`.
- **Single source of truth** — the re-exported `KARATS` is the _same reference_ as
  `config/karats.js` (a re-export, not a copy), so the map can't silently diverge from the canonical
  table.
- **No stray keys** beyond the canonical karat codes.

## What shipped

- **`tests/karatPurity.test.js`** — 4 tests importing the real modules.

Test-only — no source change; the module was already correct, this makes any future regression in
the purity lookup **loud**. Complements Phase 54's karat-formula lock (which pinned the pricing
math); this pins the code→purity map that feeds it. Peg / troy-oz / framing untouched.

## Verification

- `node --test tests/karatPurity.test.js` → 4/4 pass
- `npm test` → 1396/1396 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0

## ⚠️ Owner: 19 revamp PRs are open and unmerged

#589–#607 and #609 are all green. Reviewing/merging a batch — **especially the metals view-model
stack #601–#606** — unblocks the multi-metal orchestrator + real page wiring and reduces stack risk.
Also: please **re-authorize the GitHub connector** (it dropped briefly this session). Feeds still
needed: non-gold spot feeds (Theme B), crypto feed (Theme C); plus the 11 monthly gold averages for
the history backfill (#589) and the French-content review (Phase 41).
