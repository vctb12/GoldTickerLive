# Issues Found During Audit

Generated: 2026-04-13

## Active Issues

### 1. AdSense Placeholder Publisher ID

- **Severity**: Low
- **File**: `components/adSlot.js:10`
- **Issue**: `AD_PUBLISHER_ID = 'ca-pub-XXXXXXXXXX'` is a placeholder
- **Impact**: Ad slots render but show no ads (zero revenue)
- **Fix**: Replace with real Google AdSense publisher ID
- **Blocked by**: Requires site owner action (AdSense account setup)

### 4. Legacy Country Pages Coexist with New Hierarchical Pages

- **Severity**: Low
- **Files**: `countries/*.html` (15 files) alongside `{country}/gold-price/index.html`
- **Impact**: Potential duplicate content for SEO, confusion in navigation
- **Risk**: Removing old pages may break existing backlinks
- **Recommendation**: Add canonical tags pointing from old to new, or 301 redirects

## Resolved Issues

### 2. ~~Moderate Vulnerability in Vite/esbuild~~ ✅ Resolved

- **Status**: ✅ Resolved — Vite upgraded to ^8.0.8, 0 vulnerabilities

### 3. ~~Missing .env.example File~~ ✅ Resolved

- **Status**: ✅ Resolved — `.env.example` created in repo root

### 5. ~~No routeBuilder or routeValidator Utility~~ ✅ Resolved

- **Status**: ✅ Fixed
- **Resolution**: `utils/routeBuilder.js` and `utils/routeValidator.js` now exist as the single
  source of truth for URL generation and validation. Tests in `tests/route-utils.test.js`.

### 6. ~~sync-db-to-git.yml Uses Wrong Secret Name~~ ✅ Resolved

- **Severity**: High
- **File**: `.github/workflows/sync-db-to-git.yml`
- **Issue**: Used `SUPABASE_SERVICE_KEY` but all other workflows use `SUPABASE_SERVICE_ROLE_KEY`
- **Status**: ✅ Resolved — secret name corrected and output format fixed to ES module
