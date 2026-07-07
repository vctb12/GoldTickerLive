# Phase 27 — Shops directory (Track F · Yellow)

Audited the shops directory (`shops.html`, `src/pages/shops.js` — the live path — and
`styles/pages/shops.css`; the `src/pages/shops/*` modules are **dead code, not imported**, so no fix
landed there). Focus was **data honesty** (the sensitive area for a shop directory) plus concrete
a11y/visual bugs. Two real honesty overclaims and one visual bug fixed; the larger i18n/keyboard
gaps registered for scoped follow-ups.

## Data-honesty fixes (the priority)

1. **"Verified details" filter overstated vetting.** The filter labeled **"Verified details"**
   actually filters on `shop.phone || shop.website` (has contact info), not any verification — and
   all 27 listings are `verified:false`. Calling a "has contact info" control "Verified" implies
   vetting that hasn't happened. Renamed to **"With contact details"** (EN) / **"تتضمن بيانات
   تواصل"** (AR), across the checkbox label (`shops.html`) and the `verifiedOnly` /
   `verifiedFilterLabel` strings in both languages. The genuine `verifiedStatus`/`unverifiedStatus`
   card chips (gated on the real `shop.verified` flag) were left unchanged — they are honest.

2. **"Details confidence: 50%" was a constant placeholder on every listing.**
   `calculateConfidenceBadge` returned `shop.confidence || 50`, and no shop carries a
   `confidence`/`verified`/`contactQuality` field — so **every** card and modal showed an identical
   `Details confidence: 50%`, a precise-looking percentage that measured nothing. (A
   field-completeness heuristic was tried and rejected — the static data is uniform, so it just
   produced a different constant.) Now the badge returns `null` when there is no real per-shop
   `confidence`, and the card/modal **omit** it; a live-data `confidence` field still renders. The
   sibling "Contact quality" row is likewise gated on real contact channels (phone/website/email).
   The honest per-shop **details-availability** chip (from the real `shop.detailsAvailability`
   field) remains on both card and modal.
   - Also fixed the badge's colour mapping, which referenced **undefined** `--color-green` /
     `--color-red` → the defined `--color-up` / `--color-amber` / `--color-down`.

**Verified** (headless render of the built page): filter label reads "With contact details"; **0**
confidence-% badges appear across the 13 rendered cards (was one per card).

## Visual bug fixed

3. **Gold-foil hero accent line was clobbered.** `styles/pages/shops.css` defined
   `.shops-hero-inner::before` **twice** at equal specificity — a 2px `--rule-foil` top line and a
   full-panel dot texture. The second won, erasing the foil line. Promoted the dot texture to
   `::after` so both render.

## Registered follow-ups (scoped out of this Yellow phase)

- **Near-Me flow and resource/market chips are un-translated** (English-only status/result/error
  strings in `shops.js` ~2600–2710 and static chips in `shops.html`). A real bilingual gap, but
  sizable — belongs with the content-translation phase (Phase 41), not a directory-polish pass.
- **Shop cards open the modal on click but aren't keyboard-operable** (no `tabindex`/`role`/keydown
  on `.shop-card`). WCAG 2.1.1 — but **mitigated**: every card action is duplicated as an inline
  button, so the modal is supplementary. A dedicated "Details" button (rather than making the whole
  card a button, which would nest interactive children) is the clean fix — deferred.
- **Owner-judgment items:** JSON-LD types market-area clusters as `JewelryStore`; the hero "Popular
  markets" chips are the `featured` set relabeled; the "With contact details" filter yields zero
  results on the static build (all listings lack contacts) — consider hiding it until live data
  carries contacts.
- **Dead code:** `src/pages/shops/{actions,filters,helpers,modal,rendering}.js` are not imported —
  flagged so they aren't "fixed" by mistake; a cleanup pass could remove them.

## Verified clean

Modal a11y is correct (`role="dialog"` + `aria-modal` + `aria-labelledby="shops-modal-title"`, focus
trap on open, Escape + restore on close); all filter selects/checkboxes are `<label>`-wrapped; all
innerHTML shop-field interpolations are `esc()`-escaped (no XSS); no fake rating/review/stars fields
in the data; no duplicate ids.

## Gate

`npm run build` + `npm run validate` + `npm test` (1286 pass) + `npm run lint` — all green. Headless
render confirms the honesty fixes.
