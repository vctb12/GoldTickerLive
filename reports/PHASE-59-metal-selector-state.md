# Phase 59 — Metal + grade selection state / URL model (Theme B)

**Theme B (multi-metal).** The state layer that remembers which metal and purity grade the user is
viewing and round-trips it through the URL — validated against the metals registry so a stale or
hand-edited URL can never select something that doesn't exist. **Code-complete, awaiting owner feed
credentials.**

## How it fits Theme B

Phases 56–58 price, ingest, and time-stamp each metal. To _drive_ a multi-metal view (tracker /
comparison / calculator), the UI needs a selection state — which metal, which grade — that survives
reloads and deep links. `calculator/url-state.js` already does this for the calculator; this module
is its metals analogue, but registry-validated rather than hard-coded allow-lists.

## What shipped

- **`src/lib/metal-selector-state.js`** — pure, side-effect-free.
  - `normalizeMetalSelection({ metal, grade })` → clamps to a valid pair: unknown metal → **gold**;
    a grade not offered by the chosen metal → that metal's **default grade**.
  - `serializeMetalSelection(selection)` → query string, **omitting defaults** so gold at its
    default grade yields a clean `''` (e.g. `?metal=silver&grade=925`).
  - `parseMetalSelection(search)` → a validated selection (garbage → gold default).
  - `reconcileGradeForMetal(metalKey, currentGrade)` → on a metal switch, keep the grade if the new
    metal offers it, else fall back to its default (gold `22` → silver `999`; silver `999` →
    platinum keeps `999`).
- **`tests/metal-selector-state.test.js`** — 6 tests (defaults; invalid metal/grade clamping; valid
  non-gold; serialize omits defaults; parse ↔ serialize round-trip incl. garbage; grade reconcile).

## Registry-validated (no drift)

Every selection is checked against `metals.js` (`metalKeys`, each metal's `purities` /
`defaultPurity`), so adding or renaming a metal/grade in the registry automatically updates what the
selector accepts — there is no second allow-list to keep in sync.

## Fully wired, flagged OFF

Pure state logic; it selects _what to show_ and prices nothing. The multi-metal view it drives stays
gated by `METALS_PILOT_ENABLED` (Phase 56). Peg (3.6725), troy-oz (31.1035), and the
reference-estimate framing are untouched; gold's numbers are unchanged.

## Owner action (blocker)

Same as Phases 56–58: publish the non-gold spot feeds and flip `METALS_PILOT_ENABLED` to surface the
multi-metal view this state model drives.

## Verification

- `node --test tests/metal-selector-state.test.js` → 6/6 pass
- `npm test` → 1398/1398 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0
