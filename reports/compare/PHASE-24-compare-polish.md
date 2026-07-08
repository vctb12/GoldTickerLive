# Phase 24 — Compare tool polish, in-place (Track F · Green)

Audited the country comparison tool (`compare.html`, `src/pages/compare.js`,
`styles/pages/compare.css`). The tool is already well-built — but the audit found one **live
table-structure bug** that misaligns the comparison table on every initial load. Fixed and verified,
plus one CSS correctness cleanup.

## Bug fixed — off-by-one colspan on "unavailable" rows (WCAG 1.3.1)

The comparison table has **8 columns** (`COLUMNS`: country, currency, local, USD, VAT, making,
retail, vs-UAE). When a country's data is unavailable, the row is rendered as:

- `<th scope="row">` (country) — 1 column
- `<td>` (currency) — 1 column
- `<td colspan="COLUMNS.length - 1">` (the "unavailable" message)

That is `1 + 1 + 7 = 9` columns in an **8-column** table — the "unavailable" cell overran the table
by one column, breaking row/column alignment and the table's semantic structure (screen readers get
misaligned column associations; visually the cell overhangs). The colspan must be
`COLUMNS.length - 2` (country `<th>` and currency `<td>` already occupy the first two columns), i.e.
**6**.

This is not an edge case: in the **offline / pre-data-fetch state the entire table renders as
unavailable rows**, so the misalignment was visible on every initial page load until live data
resolved.

**Fix:** `colspan: String(COLUMNS.length - 1)` → `String(COLUMNS.length - 2)` in `renderTable()`
(`src/pages/compare.js`).

**Verified** with a headless render (Playwright) that sums every body row's `colspan` and compares
to the header column count:

| Metric              | Before (implied)     | After (measured)                       |
| ------------------- | -------------------- | -------------------------------------- |
| Header columns      | 8                    | 8                                      |
| Rows rendered       | 4                    | 4 (all "unavailable" in offline state) |
| Rows whose span ≠ 8 | 4 (all overran by 1) | **0**                                  |

## Correctness cleanup

- `styles/pages/compare.css` `.compare-chart-key::before` used
  `border-radius: var(--radius-xs, 3px)`, but `--radius-xs` is defined as **4px** — the `3px`
  fallback was both dead (the token always wins) and mismatched (a trap if the token were ever
  removed). Changed to `var(--radius-xs)`.

## Verified clean — no change needed

The interactive compare tool is otherwise solid: the table is a real `<table>` with
`<th scope="col">` column headers, `<th scope="row">` country headers, **dynamic `aria-sort`**
(recomputed per render from sort state) driven by proper `<button>` sort controls; the karat group
and country picker carry correct `role`/`aria-label`/`<label>`; no duplicate ids; no empty
interactive elements; the swipe hint is i18n-managed with correctly-mirrored RTL arrows (verified in
Phase 20). `--weight-normal` and `--radius-xs` are both defined tokens (no undefined-token bugs like
the homepage/tracker had).

## Registered follow-up — edu-hub colour-contrast (not fixed here)

Phase 19 flagged the **static educational hub** at the bottom of the compare page (`.edu-table` /
`.edu-card-title`, styled by the shared `styles/components/edu.css`) at ~4.36:1 vs the 4.5:1 AA
target. This is the shared `edu-*` component (also on the portfolio page) and the affected colour
resolves through shared brand tokens (`--color-warning` `#a0671c`, `--color-gold-dark`) used in
**both themes** — exactly the token-level, both-theme change deferred in Phase 19. Precise data for
the eventual remediation: on the edu tinted surface `#fef5e7`, a text colour of ≈`#946017` reaches
4.93:1 (and 5.32:1 on white) while staying visually close. Left for the dedicated contrast pass, not
rushed into this Green in-place phase.

## Gate

`npm run build` + `npm run validate` + `npm test` (1286 pass, incl. `compare-core.test.js`) +
`npm run lint` — all green. Headless render confirms the table column structure is now consistent.
