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

### 2. Moderate Vulnerability in Vite/esbuild
- **Severity**: Low (dev-only)
- **Details**: esbuild ≤0.24.2 allows cross-origin requests to dev server
- **Impact**: Only affects local development, no production risk
- **Fix**: Upgrade vite to ≥6.4.2 (breaking change — requires testing)

### 3. Missing .env.example File
- **Severity**: Medium
- **Issue**: No `.env.example` template in repository
- **Impact**: New developers don't know which env vars to set
- **Fix**: Created `/docs/environment-variables.md` with full documentation
- **Status**: ✅ Documented

### 4. Legacy Country Pages Coexist with New Hierarchical Pages
- **Severity**: Low
- **Files**: `countries/*.html` (15 files) alongside `{country}/gold-price/index.html`
- **Impact**: Potential duplicate content for SEO, confusion in navigation
- **Risk**: Removing old pages may break existing backlinks
- **Recommendation**: Add canonical tags pointing from old to new, or 301 redirects

### 5. No routeBuilder or routeValidator Utility
- **Severity**: Medium
- **Issue**: Internal links use hardcoded paths instead of a centralized route builder
- **Impact**: URL changes require find-and-replace across hundreds of files
- **Recommendation**: Create `utils/routeBuilder.js` as single source of truth for URL generation

## Resolved Issues

(None yet — this section will be updated as issues are fixed)
