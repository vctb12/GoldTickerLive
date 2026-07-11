# ADR-0002 — Typography & bilingual (EN/AR) font strategy

**Status:** Accepted (codifies shipped architecture) · **Date:** 2026-07-11

## Context

GTL is bilingual English/Arabic with heavy numeric/tabular content (prices, karat tables). It needs:
a clean Latin UI face with tabular figures, an editorial display face for headings, and a
high-quality Arabic face for RTL — without shipping many heavy families or leaking user data to a
font CDN.

## Decision

Self-host a three-face system (no Google Fonts; a `strip-google-fonts` step enforces this), declared
in `styles/partials/fonts.css`:

- **Source Sans 3** — Latin UI text and tabular figures (data/tables).
- **Playfair Display** — Latin editorial display (headings only).
- **Cairo** — Arabic text, and the display face in RTL (Playfair has no Arabic coverage), so Arabic
  headings use Cairo rather than a mismatched fallback.

Critical subsets are `<link rel="preload">`ed per page; fonts are subset and emitted by Vite into
hashed `/assets/*.woff2`. The type scale lives in `design-system.css` (ADR-0001).

## Alternatives considered

- **Google Fonts CDN** — rejected: third-party request, privacy, and a runtime dependency;
  self-hosting is faster and private.
- **System font stack only** — rejected: loses the premium editorial identity and consistent Arabic
  rendering.
- **One family for both scripts** — rejected: no single high-quality family served EN display +
  Arabic well; Cairo covers Arabic + display-in-RTL, Playfair covers Latin display.

## Consequences

- RTL swaps the display face to Cairo; headings stay coherent across languages.
- Font files are versioned assets; adding weights increases payload (kept minimal).
- Because fonts are Vite-emitted to `/assets`, they render in CI e2e too (no fallback-metric
  surprises).

## Invariants

- No external font CDN. Latin UI uses tabular figures for prices/tables. Arabic uses Cairo.
- EN/AR must not diverge in meaning or visual weight (see `AGENTS.md` bilingual policy).

## Relevant files

`styles/partials/fonts.css`, `styles/design-system.css` (type scale), the self-host/strip scripts
under `scripts/node/`, `assets/*.woff2`.

## Verification mechanism

Build emits hashed woff2 into `dist/assets`; RTL rendering (incl. Arabic display face) is exercised
by the RTL mobile specs (ADR-0007). `npm run build` + visual review.

## Supersession policy

If a face is added/replaced or the self-host approach changes, supersede this ADR. Code/`fonts.css`
is authoritative.
