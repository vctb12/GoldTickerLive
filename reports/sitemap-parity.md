# Sitemap-parity audit (W-9)

**Date:** 2026-04-27 · **Scope:** read-only diagnostic.

The repo currently ships **two** sitemap generators. They serve different needs and emit divergent
URL spaces. This document records the divergence so future drift is auditable; consolidation is
**deferred** as flagged in the §22b backlog.

---

## The two generators

| #   | Path                               | Purpose                                                                                                                                                                                                                                       | Where it runs                                         |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `build/generateSitemap.js`         | **Canonical**. Emits explicit URLs from `src/config/countries.js` + `src/config/karats.js` + a hardcoded `staticPages` list. Includes virtual route paths (e.g. `/uae/gold-price/`) that exist only as Vite-routed pages, not physical files. | `npm run build`                                       |
| 2   | `scripts/node/generate-sitemap.js` | Auxiliary FS walker. Walks every `*.html` and `index.html` directory under repo root and emits a `<loc>` per file. Cannot see virtual routes. Refreshes `<lastmod>` from `mtime`.                                                             | `npm run generate-sitemap` (CI calls after the build) |

---

## Divergence at a glance

A snapshot run on 2026-04-27 produced these counts:

- `build/generateSitemap.js` → ~1,100 URLs (route-aliased paths, e.g.
  `/uae/dubai/gold-rate/22-karat/`).
- `scripts/node/generate-sitemap.js` → ~440 URLs (physical files, e.g.
  `/countries/uae/dubai/gold-rate/22-karat/`).

Neither set is a subset of the other:

- The build script emits **route-aliased** URLs without the `/countries/` prefix that map to the
  materialised pages via `src/lib/page-hydrator.js`'s prefix-stripping logic. Those URLs are correct
  in production (the static hosting layer rewrites them).
- The FS walker emits the **physical** `/countries/<slug>/.../index.html` paths, which 200 OK
  directly without rewriting.

These are two different valid SEO views. The deployed `sitemap.xml` is the output of the **build**
script; the FS-walker output is overwritten by the build pipeline and only used as a `<lastmod>`
refresh probe.

---

## Drift guard

`tests/sitemap-parity.test.js` enforces the cheap invariants that catch real-world regressions:

1. Both scripts still execute.
2. Both scripts still emit a non-empty URL set (≥ 50 URLs each).
3. The canonical sitemap retains the project's required top-level pages (`/`, `/tracker.html`,
   `/shops.html`, `/calculator.html`, `/methodology.html`, `/learn.html`, `/insights.html`,
   `/invest.html`, `/privacy.html`, `/terms.html`).

Adding a new entry HTML at repo root without registering it in
`build/generateSitemap.js#staticPages` will fail invariant (3).

---

## Why consolidation is deferred

Reconciling the two URL spaces requires either:

- (a) Migrating the materialised `countries/<slug>/` files to the route-aliased layout the build
  script already encodes — a directory rename of every country page, with redirect maintenance.
- (b) Rewriting the build script to mirror the physical FS layout and letting the rewriting layer
  handle the route aliases — but that loses the ability to surface routes that don't exist as
  physical files.

Both paths touch SEO-canonical URLs in production. The §22b backlog tracks this as a separate
sequenced effort. The drift test above is the cheapest intervention available today.

---

## Action log

- 2026-04-27 — Test added (`tests/sitemap-parity.test.js`); this report written. Status: ✅ guard
  live, consolidation still deferred.
