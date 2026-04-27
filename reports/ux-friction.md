# UX friction sweep (Track 1.4)

**Date:** 2026-04-27 · **Scope:** read-only audit of the four canonical user journeys. **Audit-only
— no copy or layout edits in this batch.**

The four flows surveyed:

1. **Price-check flow** — homepage → tracker, "what is the AED price for 24K right now?".
2. **Calculator flow** — calculator page, "I have 12g of 22K, what's it worth?".
3. **Shop-search flow** — shops page, "find a Dubai jeweller open today".
4. **Language-toggle flow** — switch EN ↔ AR from any of the above.

Findings below are surface-level (read-only) — they describe friction points to address in a
follow-up PR, not bugs in the current build.

---

## 1. Price-check flow (homepage → tracker)

What works:

- The "Live" pill is visible above the fold on the homepage hero.
- Clicking the spot bar takes the user to the tracker reliably.

Friction:

- The homepage hero leads with brand copy, not a price. A first-time user has to scroll one fold to
  see the big AED number. Consider promoting a large 24K AED-per-gram readout into the hero so the
  question is answered in 0 scrolls.
- The tracker's freshness label is accurate but technical ("spot-linked estimate · updated 4 min
  ago"). Newcomers don't know what "spot-linked" means in 4 words. A microcopy tooltip would help
  without changing layout.
- On 360 px, the karat strip wraps in a way that splits the 24K cell awkwardly between rows. Tracked
  separately under the responsive audit (`reports/responsive-audit.md`).

## 2. Calculator flow

What works:

- Inputs are clearly labelled and the result updates without a submit.
- The result panel correctly distinguishes "spot-based estimate" from retail.

Friction:

- The currency dropdown defaults to AED but the calculator shares its preference with the tracker
  only on the same browser session — first visit always shows AED regardless of the user's likely
  market. Not fixable without inferring locale.
- No copy explains _why_ the calculator's result is below a typical jewellery quote (making charges,
  retail premium). Adding a one-line "Why is this lower than my shop's price?" link to
  `content/spot-vs-retail-gold-price/` would close the trust gap.
- "Reset" is a small text link in a sea of buttons. On mobile it is easy to miss.

## 3. Shop-search flow

What works:

- The search box accepts both city names and shop names, with reasonable fuzzy matches.
- The result cards include enough info (name, neighbourhood, contact) to act on without a click.

Friction:

- Empty-state copy is generic ("No results found"). Surfacing a next-best suggestion ("Try Dubai or
  Abu Dhabi", or a link to the submission form) would reduce dead ends.
- The disclaimer that listings are informational (not endorsements) appears below the fold. Consider
  raising it to the top of the results panel where users can see it before they pick a shop.
- "Open today" filtering relies on the shop's `hours` JSON; missing data renders the chip in an
  ambiguous greyed state with no tooltip explaining why.

## 4. Language-toggle flow

What works:

- The toggle is visible in the nav and on every page surface.
- RTL mirroring works for headings, navigation, and most cards.

Friction:

- A handful of card components (e.g. the karat strip in the tracker) do not flip their left/right
  padding under RTL — visible asymmetry on AR with Latin price digits.
- The Arabic copy in some footer blocks reads as a literal translation ("احصل على معدلات حية" vs.
  natural "تابع الأسعار اللحظية"). A native pass on `src/config/translations.js` would help; this is
  tracked separately and is not a single-PR fix.
- Switching language while a result panel is open (calculator, shops) re-renders the panel but does
  **not** re-translate dynamic strings like "approximately AED 2,400" until the next user action. A
  small re-render hook on the language toggle would close this.

---

## Cross-cutting observations

- **Loading states** are mostly OK but inconsistent: tracker shows a skeleton, calculator shows a
  static placeholder, shops shows a spinner. Aligning on one loading idiom would reduce cognitive
  load between pages.
- **Error states** ("Unable to fetch prices…") use the same default copy on every page; tracker
  users would benefit from a degraded but _useful_ fallback ("Last known price: AED 271/g · 18 min
  ago").
- **Disclaimers** are consistent in wording across pages — good — but appear in slightly different
  visual treatments. Consolidating into a single component would tighten the trust-copy story
  without changing copy.

---

## What this audit does **not** cover

- Performance / Lighthouse — separate tracker `reports/perf-baseline-2026-04-25.md`.
- Accessibility — separate `reports/a11y-audit.md`.
- Token / CSS hygiene — separate `reports/token-audit.md`.

---

## Action log

- 2026-04-27 — Audit produced. Status: ✅ baseline captured; follow-up edits queued in
  `docs/REVAMP_PLAN.md` UX-friction row.
