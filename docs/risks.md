# Risks Log

## Active Risks

### 1. AdSense Integration Incomplete

- **Risk**: Ad revenue is zero until real publisher ID is configured
- **Mitigation**: Placeholder code is in place (`components/adSlot.js`), ready to activate
- **Owner**: Site owner needs to provide AdSense publisher ID
- **Impact**: Low (monetization only, no UX impact)

### 2. Supabase Credentials in Client-Side Code

- **Risk**: Supabase URL and anon key are in committed files (`config/supabase.js`)
- **Mitigation**: Supabase anon key is designed for client-side use with Row Level Security (RLS).
  Only verified shops and settings are readable by anon role.
- **Impact**: Low — this is the intended Supabase architecture

### 3. Vite/esbuild Moderate Vulnerability

- **Risk**: esbuild <=0.24.2 dev server allows cross-origin requests
- **Mitigation**: Only affects local development, not production. Fix requires breaking vite
  upgrade.
- **Impact**: None in production

### 4. GitHub Pages Cannot Set HTTP Headers

- **Risk**: Security headers (CSP, HSTS) cannot be set server-side on GitHub Pages
- **Mitigation**: Added meta-equivalent headers where supported (`X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`)
- **Impact**: Medium — `Content-Security-Policy` and `Strict-Transport-Security` meta equivalents
  are limited

### 5. Dual Routing Structure (Legacy + Hierarchical)

- **Risk**: SEO duplicate content from both `/countries/uae.html` and `/uae/gold-price/` existing
- **Mitigation**: .htaccess redirects cover some paths; canonical tags are present on 97% of pages
- **Impact**: Medium — search engines may split link equity between old and new URLs

## Resolved Risks

(Updated as risks are mitigated)
