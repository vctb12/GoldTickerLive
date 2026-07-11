# ADR-0004 — Shared shell (nav/footer) injection

**Status:** Accepted (codifies shipped architecture) · **Date:** 2026-07-11

## Context

Sixteen+ root HTML pages must share one header/nav, mobile drawer, global search, language + theme
toggles, ticker, and footer. Duplicating that markup into every `.html` file guarantees drift and
makes shell changes a multi-file chore.

## Decision

The shell is **JS-injected at runtime**, not hard-coded per page. Root HTML pages contain **no**
`<nav>`/`<header>`/`<footer>` markup; each page's module entry calls `mountSharedShell()` in
`src/components/site-shell.js`, which assembles:

- `src/components/nav.js` — desktop nav + mobile drawer + global search + language/theme toggles
- `src/components/footer.js`, `ticker.js`, `spotBar.js`, with data from `nav-data.js`
- `src/search/searchEngine.js` + `searchIndex.js` behind the search UI

A guard, `scripts/node/check-shell-guard.js`, fails CI if a canonical page hard-codes shell markup
(e.g. a literal `site-nav`), keeping the single-source contract enforced.

## Alternatives considered

- **Duplicated static shell markup per page** — rejected: drift, N-file edits, and the reason this
  decision exists.
- **Server-side includes / templating build step that bakes shell into HTML** — viable but the
  project is a client-hydrated MPA; runtime injection keeps one code path and enables the
  theme/lang/search behaviour that is JS-driven anyway.
- **SPA/framework** — rejected: `AGENTS.md` forbids SPA migration without explicit owner request.

## Consequences

- The shell is a shared, high-collision surface; changes to `nav.js`/`site-shell.js` affect every
  page and must stay single-owner (see `AGENTS.md` / revamp execution rules).
- Shell content appears after hydration; tests wait for `.site-nav` + `<main>` before asserting (see
  ADR-0007). Static HTML has no nav for no-JS crawlers — SEO relies on the content + injected
  metadata/schema, not shell links.

## Invariants

- Root pages do not hard-code shell markup; `check-shell-guard` stays green.
- Nav/search/drawer keep keyboard access, focus handling, and RTL behaviour.

## Relevant files

`src/components/site-shell.js`, `nav.js`, `footer.js`, `ticker.js`, `spotBar.js`, `nav-data.js`,
`src/search/*`, `scripts/node/check-shell-guard.js`.

## Verification mechanism

`npm run validate` runs `check-shell-guard.js`. Shell behaviour is covered by
`tests/e2e/nav-smoke.spec.js`, `mobile-smoke.spec.js`, and the RTL specs (ADR-0007), including the
search overlay and mobile drawer in Arabic.

## Supersession policy

If the shell moves to a build-time include or a framework, supersede this ADR. `site-shell.js` + the
guard are authoritative.
