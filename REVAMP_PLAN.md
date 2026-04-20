# Revamp Plan — 30 Phases

This document enumerates the 30 phased changes for the full-site revamp and 404 elimination. Each
phase is intended to be a single commit in the big PR `revamp/404-hardening`.

Phases (commit message prefix `phx/NN:`):

1. phx/01: Run initial link-check and add `reports/links-initial.json` (scan output).
2. phx/02: Add `404.html` and user-friendly fallback page.
3. phx/03: Improve server fallback handling in `server.js` to serve `404.html` when missing.
4. phx/04: Add Netlify `_redirects` entries for SPA and common legacy paths.
5. phx/05: Integrate link-check into CI (`.github/workflows/ci.yml`).
6. phx/06: Standardize `nav` links in `src/components/nav-data.js` (root-safe paths).
7. phx/07: Harden `resolveHref` and `isPageMatch` in `src/components/nav.js`.
8. phx/08: Generate missing `index.html` placeholders for country pages (script).
9. phx/09: Fix top-level pages and authoritative links (index, shops, tracker, learn).
10. phx/10: Repair missing `content/tools/*` and `content/guides/*` pages or add redirects.
11. phx/11: Add `_headers` or server redirect table for admin and legacy paths.
12. phx/12: Add Playwright smoke tests for main nav and country index pages.
13. phx/13: Add tests for JS-driven links (search, tracker deep-links).
14. phx/14: Asset audit — confirm all `img`, `script`, and `link` assets exist.
15. phx/15: Add sitemap fixes and ensure `build/generateSitemap.js` includes all pages.
16. phx/16: Add canonical and hreflang meta fixes for SEO consistency.
17. phx/17: Accessibility fixes on navigation, focus management, ARIA.
18. phx/18: Mobile UX fixes — drawer and bottom nav behavior and deep-linking.
19. phx/19: Add `scripts/node/generate-placeholders.js` to create missing minimal pages.
20. phx/20: Add `scripts/node/fix-links.js` helper to rewrite broken `../` hrefs.
21. phx/21: Add monitoring hooks — log 404s server-side to `data/404-logs.json` (dev mode).
22. phx/22: Add scheduled CI job to run link-check nightly and upload reports.
23. phx/23: Run lint/format across site and apply `eslint --fix` + `prettier --write`.
24. phx/24: Add `husky` + `lint-staged` enforcement for pre-commit checks.
25. phx/25: Add performance optimizations (defer noncritical scripts, lazy images).
26. phx/26: Ensure service worker and `offline.html` handle missing cached assets gracefully.
27. phx/27: Update docs: `README.md`, `docs/ADMIN_GUIDE.md`, developer onboarding steps.
28. phx/28: Security and dependency audit, pin vulnerable packages and add Dependabot.
29. phx/29: Add release/deploy automation with canary rollout and rollback steps.
30. phx/30: PR polish, consolidate reports, and add final changelog for the revamp.

Estimated: Each phase is designed to be small; overall effort ~ several days to a few weeks.
