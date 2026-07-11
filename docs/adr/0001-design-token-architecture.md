# ADR-0001 — Canonical design-token architecture

**Status:** Accepted (codifies shipped architecture) · **Date:** 2026-07-11

## Context

A premium, cohesive multi-page product needs one source of truth for colour, spacing, type, radius,
shadow, and motion so surfaces don't drift into per-page styling. GTL is a static multi-page site
(vanilla ES modules + Vite) with many root HTML pages sharing a design language.

## Decision

Design tokens are CSS custom properties defined in two coordinated `:root` layers, imported once via
the CSS barrel:

- `styles/partials/tokens.css` — colour system (surfaces, text, brand gold, semantic/status
  colours), the dark-theme overrides, and movement colours. WCAG contrast pairings are annotated
  inline.
- `styles/design-system.css` — the `--gtl-*` primitive scale: fluid type (clamp), 4px-based spacing
  (`--gtl-1..10`), radii (`--gtl-r-*`), elevation, and motion tokens.

`styles/global.css` is the single barrel that `@import`s the partials in a fixed order (fonts →
price-display → shell → skeleton → tokens → base → layout → components → utilities). Pages consume
tokens; they do not hard-code hex/px for themable values. `docs/DESIGN_TOKENS.md` is the
human-readable reference.

## Alternatives considered

- **Inline `<style>` per page** — rejected: guarantees drift; the big pages are kept free of inline
  `<style>`.
- **A CSS framework (Tailwind/Bootstrap)** — rejected: heavier, less control over a restrained
  financial aesthetic, and a large migration for a working system.
- **Single mega token file** — rejected in favour of a colour/theme file plus a primitives file for
  separation of concerns.

## Consequences

- Theming (incl. dark mode, ADR-0003) and RTL adjustments happen centrally.
- New components must consume tokens; raw hex/px for themable properties is a review smell.
- Two token files mean contributors must know both layers (mitigated by `docs/DESIGN_TOKENS.md`).

## Invariants

- Themable colour/space/radius/shadow/motion values come from tokens, not inline literals.
- `styles/global.css` remains the ordered import barrel.

## Relevant files

`styles/partials/tokens.css`, `styles/design-system.css`, `styles/global.css`, `styles/partials/*`,
`docs/DESIGN_TOKENS.md`.

## Verification mechanism

`npm run validate` includes a basic-a11y gate that checks token contrast pairs (gold/body, dark-mode
status colours) meet WCAG AA and that `global.css` imports the core partials. Visual review covers
cohesion.

## Supersession policy

If the token architecture changes (e.g. tokens consolidated, a build step generates
`DESIGN_TOKENS.md`, or a framework is adopted), supersede this ADR with a new one and link it here.
Code is the source of truth; correct this ADR if it drifts.
