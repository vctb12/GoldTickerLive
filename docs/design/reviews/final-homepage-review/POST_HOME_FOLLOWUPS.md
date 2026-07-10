# Post‑homepage follow‑ups (do NOT implement in #642)

Scoped backlog surfaced during the final homepage review. None of these belong in PR #642; they are
the recommended next steps after the homepage ships.

## A. Deferred owner decisions (resolve at/after visual approval)

1. **Dark mode** — no dark variant shipped in #642. Site‑wide dark theming is its own PR (a nav
   theme‑toggle control already exists but has no dark styling wired here). Recommend as a dedicated
   theming PR after the homepage.
2. **"Major Gold Markets" licensed photo section** — kept in #642 (`screens/sec_markets_photo_*`).
   Pick one: (a) keep + restyle to the editorial system, (b) retire (the Gulf editorial section now
   covers this need), or (c) move to a deeper market page. Do not delete the licensed assets until
   decided.
3. **Site‑wide footer** — kept as the current light footer in #642. Dark/multi‑column footer is a
   separate site‑wide follow‑up (it also resolves the footer contrast items below).

## B. Pre‑existing accessibility debt (NOT #642 regressions)

Confirmed pre‑existing on `main` (failing selectors are styled in files this PR did not change):

- **Contrast** on `#trust-*-sub` (trust‑strip sub‑labels) and `#hfb-text` (freshness bar) — raise
  text to ≥4.5:1.
- **Contrast** on `.footer-col-heading` / `.footer-copy` — rolls into the footer redesign (A.3).
- **`scrollable-region-focusable`** on `.trust-inner` (mobile horizontal scroller) — add
  `tabindex="0"` so keyboard users can scroll it.

Recommend a small "homepage a11y contrast + focus" PR bundling these (they touch shared/trust/footer
CSS, so keep them out of the redesign PR to avoid cross‑page scope creep).

## C. Engineering debt observed

- **Karat strip dual selection state:** two variables drive the ladder — `homeTrackerKarat`
  (cross‑page handoff) and `_selectedKarat` (dial). Pointer clicks keep them in sync; a
  keyboard‑only path can move one without the other. Worth unifying into a single source of truth in
  a focused refactor (out of scope for the a11y fix already landed).
- **`vite preview` vs static hosting:** `vite preview`'s SPA fallback mis‑serves `/data/*.json` and
  `/src/*` (returns `index.html`), which breaks the canonical fetch locally and misleads QA.
  Consider documenting "serve `dist/` (or repo root) with a plain static server for faithful QA" in
  the contributor docs.

## D. Suggested next‑PR sequence (after #642 approval)

1. Homepage a11y contrast + focus (B) — small, safe, high‑value.
2. Owner decision on the photo section (A.2) — then implement the chosen option.
3. Site‑wide dark mode (A.1) + dark/multi‑column footer (A.3) — larger theming effort, likely two
   PRs.
4. Karat selection‑state unification (C) — internal cleanup.

## E. Not in scope (explicitly not touched)

No other pages, no dark mode, no footer redesign, no changes to pricing constants, workflows, or the
service worker.
