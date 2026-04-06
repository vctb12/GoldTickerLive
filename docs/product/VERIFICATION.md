# Verification Checklist (Phase 6 QA Gate)

Use this checklist before merging any PR that affects user-facing pages.

## 1) Functional checks

- [ ] Primary buttons/CTAs work on target pages.
- [ ] Filters/search/sort controls update results correctly.
- [ ] Deep links and query-parameter state restore as expected.
- [ ] Local state persistence (where used) behaves correctly after refresh.
- [ ] Modal/dialog behavior works with click, Escape, and focus flow.

## 2) UX and accessibility checks

- [ ] Mobile layout verified at narrow width (>= 360px).
- [ ] Empty/loading/error states are visible and understandable.
- [ ] Keyboard tab order is usable and skip-link path is valid.
- [ ] Focus indicators are visible on interactive controls.
- [ ] Contrast and readable hierarchy are acceptable for core flows.

## 3) SEO and metadata checks

- [ ] Unique `<title>` and `<meta name="description">` on changed pages.
- [ ] Canonical URL is present and points to the intended final URL.
- [ ] Open Graph + Twitter metadata are present and aligned.
- [ ] Internal links resolve from actual file depth (no broken relatives).
- [ ] Structured data (if present) matches page reality.
- [ ] Sitemap/robots impact reviewed when adding new indexable pages.

## 4) Trust and product clarity checks

- [ ] Spot/reference values are clearly distinguished from retail/jewelry pricing.
- [ ] Estimated/derived/cached/fallback states are labelled where relevant.
- [ ] Freshness/review-date labels are visible and not misleading.
- [ ] Shops/market listings do not overstate verification status.
- [ ] Methodology/disclaimer links remain discoverable.

## 5) Performance and resilience checks

- [ ] `npm run build` passes.
- [ ] Service worker changes validated for cache version and fallback behavior.
- [ ] No accidental broad asset/cache growth from query-param caching.

## 6) Final report format (required)

Every implementation update should explicitly separate:

1. **What was verified**
2. **What was not verified**
3. **Remaining risks**

Do not claim “fixed” unless the relevant checks were actually run.
