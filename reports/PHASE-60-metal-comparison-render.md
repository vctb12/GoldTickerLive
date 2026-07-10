# Phase 60 — Multi-metal comparison table render (Theme B)

**Theme B (multi-metal).** The accessible UI artifact that turns the comparison model (Phase 56)
plus per-metal freshness (Phase 58) into a bilingual, escaped HTML table. **Code-complete, awaiting
owner feed credentials.**

## How it fits Theme B

- Phase 56 builds the comparison model, Phase 58 the per-metal freshness, Phase 59 the selection
  state.
- This phase renders the model as a real, accessible table — the visible surface those models feed.

It takes the **plain model object** as input (it does not import the model builders), so it renders
whatever honest states the model carries and stays independent of the other Theme B PRs' merge
order.

## What shipped

- **`src/lib/metal-comparison-render.js`** — pure, side-effect-free.
  - `renderMetalComparisonTableHtml(model, { lang?, freshnessByMetal? })` → an accessible table
    (`<caption>`, `scope="col"` / `scope="row"` headers, `data-metal` / `data-state` hooks, `dir`).
    - `ok` rows show the price (`USD · AED`); `pending-data` / `disabled` rows show **"awaiting
      data"** — never a fabricated number.
    - A freshness badge is shown only on `ok` rows when a state is supplied.
    - Returns `''` when the pilot is off / no rows (nothing mounts).
- **`tests/metal-comparison-render.test.js`** — 5 tests (off → empty; ok vs pending; freshness badge
  gating; **XSS-escaping** of all interpolated model text; Arabic + RTL).

## Safe by construction

Every interpolated value goes through `safe-dom`'s `escape`, so a hostile model string (`<script>…`)
is neutralised — a test asserts no raw `<script>` / `<img>` reaches the output. The result is a
fully-escaped trusted fragment.

## Fully wired, flagged OFF

Renders nothing until the model reports `pilotEnabled: true` (driven by `METALS_PILOT_ENABLED`,
Phase 56). Prices nothing — peg (3.6725), troy-oz (31.1035), and the reference-estimate framing are
untouched; gold's numbers are unchanged.

## Owner action (blocker)

Same as Phases 56–59: publish the non-gold spot feeds and flip `METALS_PILOT_ENABLED` to surface the
multi-metal table this renders.

## Verification

- `node --test tests/metal-comparison-render.test.js` → 5/5 pass
- `npm test` → 1397/1397 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0
