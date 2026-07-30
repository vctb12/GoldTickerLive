# Phase 41 — Breadcrumb acronym humanizer

**Date:** 2026-07-30

**Status:** In progress on `codex/phase-41-breadcrumb-humanizer`

## Verified current behavior

`scripts/node/inject-schema.js` humanizes each URL segment by capitalizing its first character. For
the valid UAE shorthand route segment `/uae`, that produces `Uae` in `BreadcrumbList` JSON-LD. The
repository's redirect map and search index both preserve UAE-specific routes, so the acronym is a
user- and search-facing label rather than an unreachable code path.

## Problem and impact

The generated breadcrumb label uses title-case for an established acronym. This is a low-risk
SEO/content-integrity defect: structured data can expose `Uae` instead of the canonical `UAE`,
weakening brand and locale terminology consistency without changing the URL or page content.

## Scope

- Add a small acronym override map to the existing breadcrumb humanizer.
- Add a deterministic regression test for `/uae`, including canonical URL preservation.
- Export the existing pure helper for direct unit coverage.
- Re-run the schema injector through the normal build gate and review generated output for
  unintended changes.

## Non-goals

- No URL, redirect, canonical, sitemap, or page-taxonomy changes.
- No pricing, freshness, provider, workflow, or protected-file changes.
- No broad copy rewrite or new translation strings.
- No change to visible runtime breadcrumb rendering.

## Risk and compatibility

Low. The change affects only the display name of matching structured-data breadcrumb items. Other
path segments retain the current humanization behavior. The existing canonical URL logic remains
unchanged.

## Verification plan

- Reproduce the pre-fix `/uae` helper output and assert the regression test fails before the fix.
- Run the focused breadcrumb test, lint, unit suite, validate, and build.
- Run SEO governance and schema checks as applicable.
- Inspect generated `BreadcrumbList` output and the full diff for generated artifact drift.
- Confirm the selected change does not alter EN/AR visible strings, RTL layout, accessibility
  behavior, pricing math, or dependencies.

## Rollback

Revert the focused commit. The prior title-case behavior is restored and no runtime data or
production workflow is affected.
