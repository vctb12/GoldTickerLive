# ADR-0003 — Theme & dark-mode with FOUC pre-init

**Status:** Accepted (codifies shipped architecture) · **Date:** 2026-07-11

## Context

A premium product needs a cohesive dark mode (designed, not inverted), a user toggle that persists,
respect for the OS preference, and — critically — **no flash of the wrong theme** (FOUC) on first
paint. On a static multi-page site every navigation is a fresh document load, which makes FOUC
especially visible.

## Decision

- Theme is expressed by a `data-theme` attribute on `<html>` (with a `data-theme-mode` for
  auto/light/dark intent). Dark values are a dedicated block in `styles/partials/tokens.css` plus a
  `@media (prefers-color-scheme: dark)` mirror, and `color-scheme` is set so native UA controls
  match.
- The user preference persists in `localStorage` (`user_prefs.theme` = auto | light | dark). The
  toggle lives in the shared nav (`src/components/nav.js`).
- A **render-blocking inline pre-init script** is injected into every page `<head>` at build time by
  `scripts/node/inject-theme-preinit.js` (marker `gtl-theme-preinit`). It sets `data-theme` before
  first paint, mirroring the nav's resolution logic, eliminating FOUC. Its presence is CI-checked.

## Alternatives considered

- **CSS `prefers-color-scheme` only** — rejected: no user override/persistence.
- **JS theme applied by the module bundle** — rejected: modules load after first paint → FOUC.
- **Invert light colours for dark** — rejected: muddy, poor chart/table contrast; dark is authored.

## Consequences

- The pre-init script is duplicated into each page at build; it must stay in sync with the nav's
  resolution logic (both are simple and centrally maintained; CI enforces presence).
- Dark-mode colours are maintained alongside light in the token file (ADR-0001).

## Invariants

- No flash of incorrect theme. `data-theme` is set before first paint.
- Dark mode meets WCAG AA for text/status/chart contrast (checked in the a11y gate).
- Preference persists and honours system preference in `auto`.

## Relevant files

`scripts/node/inject-theme-preinit.js` (+ `--check`), `styles/partials/tokens.css` (dark block +
media mirror), `src/components/nav.js` (toggle + resolution), `localStorage` key `user_prefs.theme`.

## Verification mechanism

`npm run validate` runs `inject-theme-preinit --check` (fails if a page lacks the pre-init) and the
a11y gate (dark-mode contrast). Theme toggle is covered by `tests/e2e/theme-toggle.spec.js`.

## Supersession policy

If theme resolution moves (e.g. to a service worker or a framework), or the pre-init mechanism
changes, supersede this ADR. The scripts + nav are authoritative.
