# Phase 25 — World heatmap polish, in-place (Track F · Green)

Audited the world heatmap (`heatmap.html`, `src/pages/heatmap.js`, `src/pages/heatmap/*`,
`styles/pages/heatmap.css`). The heatmap is **best-practice built** — Phase 19 axe found it fully
clean in both themes, and the deep audit confirms an exemplary accessible interactive map. This
phase ships two real latent-trap CSS cleanups and, on discovering the mismatched-fallback pattern
recurs across the codebase, contributes a **systematic token-fallback audit** registered for a
dedicated cleanup. (The optional spot/retail lens toggle is Phase 31 — deliberately not built here.)

## Fixes shipped

Two dead-and-mismatched `var(--token, <literal>)` fallbacks in `styles/pages/heatmap.css` — the
token is defined, so the literal never applies, but it mismatches the token's real value (a trap if
the token were ever removed):

1. `.heatmap-legend-swatch` `border-radius: var(--radius-xs, 3px)` → `var(--radius-xs)` —
   `--radius-xs` is **4px**, not 3px.
2. legend range label `letter-spacing: var(--tracking-wide, 0.04em)` → `var(--tracking-wide)` —
   `--tracking-wide` is **0.025em**, not 0.04em.

Same cleanup as Phase 24's `.compare-chart-key`.

## Verified best-practice — no change needed

The interactive map is genuinely exemplary and was left untouched:

- **Accessible SVG map:** the `<svg>` is `role="group"` + `aria-label`; each of the 28 country
  shapes/markers is `role="button"` + `tabindex="0"` + a value-bearing `aria-label`
  (`"<country> — retail est: <value>"`) + `aria-pressed` reflecting selection. All 28 codes are in
  `VALID_CODES`, so **every focusable region is genuinely interactive** (no dead buttons).
- **Correct keyboard handling:** the `keydown` handler responds to **both Enter and Space** and
  calls `preventDefault()` (so Space doesn't scroll) — a spot commonly gotten wrong.
- **Touch targets:** tiny countries get enlarged invisible `≥20px` hit circles (`aria-hidden`).
- **Non-visual alternatives:** a text color legend (Lower / Higher / No data), a shared edu
  color-key section, **and a full "All tracked markets" data-table fallback** — so the map's
  information is available without seeing colour (WCAG 1.4.1 satisfied; not colour-only).
- Decorative geometry (ocean, graticule, backdrop, hit proxies) is all `aria-hidden`. No duplicate
  ids, no empty interactive elements. All referenced tokens are defined.

## Registered follow-up — codebase-wide `var()` fallback hygiene

While fixing the two heatmap fallbacks, a scripted audit of `styles/**/*.css` (cross-checked against
tokens defined in CSS **and** JS `setProperty`) surfaced a recurring, systematic pattern worth a
dedicated pass:

- **8 references to genuinely undefined tokens** (silently relying on their fallback literal, like
  the homepage `--color-gray-900` bug). Two are **already fixed in-flight** — `--color-gray-900`
  (`home.css`, Phase 21 / PR #558) and `--toast-offset-base` (`tracker-pro.css`, Phase 22 / PR
  #559). The remaining six: `--transition-interactive` ×3 (`pages/insights.css`), `--bg-warn-subtle`
  / `--border-warn` (`admin.css`, English-only surface), `--surface-hover`, `--space-2-5`,
  `--bar-width` (`partials/utilities.css` — some may be intentionally runtime-set; verify before
  touching).
- **Mismatched-but-dead fallbacks** where the literal ≠ the token's defined value (e.g.
  `--radius-lg, 18px` where the token is 16px in `alert-manager.css`). A precise count needs a
  resolving comparator — a naive string scan over-reports because many fallbacks are hardcoded
  equivalents of `calc()` tokens (`--space-4, 1rem`) or differ only in rgb formatting.

Recommendation: a dedicated token-fallback-hygiene change (Phase 17 design-token territory / a Phase
30 regression item) — define the 6 missing tokens (or inline where intentional) and normalise
mismatched fallbacks. Out of scope for this heatmap-only Green phase.

## Gate

`npm run build` + `npm run validate` + `npm test` (1286 pass) + `npm run lint` — all green.
