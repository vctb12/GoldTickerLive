# ADR-0007 — RTL & mobile regression strategy

**Status:** Accepted (codifies shipped architecture) · **Date:** 2026-07-11

## Context

GTL is bilingual with a first-class Arabic/RTL experience. `AGENTS.md` requires RTL to work at
≥360px and every layout change to get an RTL spot-check. Historically the mobile no-overflow guard
(`tests/e2e/mobile-smoke.spec.js`) ran mostly in English/LTR, so an RTL-only bidi overflow could
regress silently on the highest-traffic Arabic pages.

## Decision

RTL/mobile layout integrity is a **CI invariant**, enforced by two complementary Playwright specs
run in the existing `Playwright smoke` job (`--project=chromium` vs the built `dist/`):

- `tests/e2e/rtl-mobile-overflow.spec.js` — the six core surfaces (home, tracker, calculator, shops,
  methodology, compare).
- `tests/e2e/rtl-mobile-public-surface-coverage.spec.js` — the remaining public families (learn,
  glossary, market, heatmap, portfolio, dubai landing, privacy, terms, 404) plus the global search
  overlay and the mobile nav drawer, in Arabic.

Each surface loads via its Arabic first-load path (`?lang=ar`) and asserts: settled RTL
(`dir=rtl`/`lang=ar`), shell mounted, **no document-level horizontal overflow** (a robust detector
that names the offending element and ignores approved `overflow-x` scroll containers + fixed
chrome), RTL-context a11y smoke (one `<main>`, one `<h1>`, no unnamed `<button>`), and no uncaught
page error. Widths: 390px broadly, 320px for data/interaction-dense surfaces.
`docs/testing/rtl-mobile-coverage.md` documents the matrix and exclusions.

## Alternatives considered

- **Full pixel visual-regression (screenshots)** — rejected for now: high maintenance/flakiness
  without dedicated infra; targeted structural assertions catch layout breakage reliably.
- **One giant spec** — rejected: split by scope (core vs remaining) keeps each reviewable and
  non-overlapping.
- **Naive `scrollWidth` only** — insufficient: it can't distinguish an intentional table/carousel
  scroll container from a real page overflow, hence the robust detector.

## Consequences

- Adding a public page family means adding a row to the `AR_SURFACES` matrix.
- `offline.html` is intentionally excluded (static SW fallback, no shell boot, bilingual-static,
  hardcoded `lang=en/dir=ltr`); country/city pages don't exist (2026-07-04 IA reset).
- Fonts are Vite-emitted to `dist/assets`, so CI renders real fonts (no fallback-metric drift).

## Invariants

- Every standard public surface stays overflow-free with correct `dir=rtl`/`lang=ar` at mobile width
  in Arabic. Exclusions are narrow and documented.

## Relevant files

`tests/e2e/rtl-mobile-overflow.spec.js`, `tests/e2e/rtl-mobile-public-surface-coverage.spec.js`,
`tests/e2e/mobile-smoke.spec.js`, `docs/testing/rtl-mobile-coverage.md`, `playwright.config.js`,
`.github/workflows/ci.yml` (Playwright smoke job).

## Verification mechanism

The specs run in CI on every PR/main push; locally via `npx playwright test --project=chromium`
against served `dist/`. Verified 6/6 (core) and 18/18 (+2 interaction) green, non-flaky under
`--repeat-each=2`.

## Supersession policy

If a visual-regression system is adopted, or the coverage/matrix strategy changes materially,
supersede this ADR. The specs + `rtl-mobile-coverage.md` are authoritative.
