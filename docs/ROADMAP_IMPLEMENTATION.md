# Roadmap Implementation Guide

This document provides a comprehensive guide for implementing the Gold Prices platform roadmap features.

## Overview

The roadmap is divided into three phases:
- **Phase 1 (Near-term)**: Premium tier, email newsletter, portfolio tracker
- **Phase 2 (Medium-term)**: Interactive heatmap, crypto correlation, WhatsApp, Google Sheets, push notifications, multi-language
- **Phase 3 (Long-term)**: Developer API, white-label, payments, mobile app, AI analysis

## Phase 1: Foundation & Quick Wins (CURRENT)

### 1. Premium Tier ✅ IMPLEMENTED

**Status**: Infrastructure complete, pending Stripe account setup

**What's Built**:
- ✅ Subscription management module (`server/lib/subscriptions.js`)
- ✅ Stripe integration routes (`server/routes/stripe.js`)
- ✅ Pricing page UI (`pricing.html` + styles)
- ✅ Tier definitions (Free/Pro/API)
- ✅ Database schema (in `docs/SUPABASE_SCHEMA.md`)

**To Deploy**:
1. Create Stripe account at https://stripe.com
2. Create products and prices:
   - Pro Monthly: $4.99/month
   - Pro Annual: $49.99/year
   - API Monthly: $19.99/month
   - API Annual: $199.99/year
3. Add price IDs to environment variables
4. Install Stripe package: `npm install stripe`
5. Deploy Supabase schema (subscriptions + usage_tracking tables)
6. Test checkout flow in Stripe test mode
7. Configure webhook endpoint in Stripe dashboard
8. Update `pricing.html` to call real checkout API

**Environment Variables**:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_API_MONTHLY=price_...
STRIPE_PRICE_API_ANNUAL=price_...
```

---

### 2. Email Newsletter ✅ IMPLEMENTED

**Status**: Infrastructure complete, pending Resend account setup

**What's Built**:
- ✅ Newsletter subscription routes (`server/routes/newsletter.js`)
- ✅ Email template generator (`scripts/node/generate-newsletter.js`)
- ✅ Newsletter sender (`scripts/node/send-newsletter.js`)
- ✅ Daily automation workflow (`.github/workflows/daily-newsletter.yml`)
- ✅ Weekly automation workflow (`.github/workflows/weekly-newsletter.yml`)
- ✅ Database schema (newsletter_subscribers + newsletter_campaigns tables)

**To Deploy**:
1. Create Resend account at https://resend.com
2. Add and verify sender domain
3. Get API key
4. Install Resend package: `npm install resend`
5. Deploy Supabase schema (newsletter tables)
6. Add GitHub secrets (RESEND_API_KEY, RESEND_FROM_EMAIL)
7. Test newsletter generation: `node scripts/node/generate-newsletter.js`
8. Test newsletter sending: `node scripts/node/send-newsletter.js daily`
9. Enable GitHub Actions workflows

**Environment Variables**:
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=newsletter@goldprices.com
```

**Newsletter Schedule**:
- **Daily**: 7:00 AM Dubai time (03:00 UTC)
- **Weekly**: Sunday 6:00 PM Dubai time (14:00 UTC)

**Email Templates Include**:
- XAU/USD spot price with 24h change
- UAE (AED) prices for 24K, 22K, 21K, 18K
- Saudi Arabia (SAR) prices
- CTA button to live tracker
- Unsubscribe and preference management links

---

### 3. Portfolio Tracker 🔄 IN PROGRESS

**Status**: Database schema complete, UI pending

**What's Built**:
- ✅ Database schema (portfolios + holdings + snapshots tables)
- ⏳ Portfolio management UI
- ⏳ Portfolio calculator module
- ⏳ Authentication modal

**To Build**:

#### 3.1 Enable Supabase Auth
1. Enable Email provider in Supabase dashboard
2. Optionally enable social providers (Google, GitHub)
3. Configure email templates
4. Add redirect URLs

#### 3.2 Create Auth Modal Component
File: `src/components/auth-modal.js`
```javascript
// Sign in/sign up modal using Supabase Auth
// Email + password or social providers
// Auto-show when accessing protected features
```

#### 3.3 Build Portfolio Page
File: `portfolio.html`
Features:
- Portfolio list (create, rename, delete, set default)
- Holdings table (add gold/silver/platinum/palladium)
- Current value calculation
- Gain/loss display
- Performance chart
- Import/export CSV

#### 3.4 Create Portfolio Calculator
File: `src/lib/portfolio-calculator.js`
Functions:
- `calculateHoldingValue(holding, currentPrice)` - Current market value
- `calculateUnrealizedGain(holding, currentPrice)` - Profit/loss
- `calculatePortfolioValue(portfolio, prices)` - Total portfolio value
- `calculatePortfolioMetrics(portfolio)` - Stats and breakdown

#### 3.5 Implement Row-Level Security
Ensure RLS policies are enabled on all portfolio tables:
```sql
-- Users can only access their own portfolios
CREATE POLICY "Users manage own portfolios" ON portfolios
  FOR ALL USING (auth.uid() = user_id);

-- Users can only access holdings in their portfolios
CREATE POLICY "Users manage own holdings" ON holdings
  FOR ALL USING (
    portfolio_id IN (SELECT id FROM portfolios WHERE user_id = auth.uid())
  );
```

---

## Phase 2: Data & Social (4-6 months)

### 4. Multi-Source Price Aggregation

**Goal**: Cross-validate prices from multiple sources (Kitco, LBMA)

**Implementation**:
1. Create `src/lib/price-aggregator.js`
2. Add Kitco API integration
3. Add LBMA fix prices
4. Implement weighted average algorithm
5. Add outlier detection (±2% variance flagging)
6. Create "Price Sources" transparency modal

**API Endpoints**:
- Kitco: https://www.kitco.com/market-data (check their API docs)
- LBMA: http://www.lbma.org.uk/prices-and-data/precious-metal-prices

---

### 5. Silver/Platinum/Palladium Expansion

**Goal**: Expand beyond gold to full precious metals platform

**Database Changes**:
```sql
-- Extend holdings table (already supports metal column)
-- Add metal-specific configs
```

**Implementation**:
1. Update `src/config/constants.js` with METALS config
2. Generalize `price-calculator.js` to `metal-price-calculator.js`
3. Add metal selector to tracker UI
4. Create metal landing pages (silver.html, platinum.html, palladium.html)
5. Generate metal-specific country pages
6. Update translations for new metals

---

### 6. Instagram & LinkedIn Automation

**Implementation**:
1. Set up Facebook Developer App for Instagram
2. Set up LinkedIn Company Page + Developer App
3. Create visual content generator using Puppeteer
4. Build posting scripts (`scripts/node/post-instagram.js`, `post-linkedin.js`)
5. Add GitHub Actions workflows

**Required Packages**:
```bash
npm install puppeteer
```

**Environment Variables**:
```bash
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_ORGANIZATION_ID=
```

---

## Phase 3: Platform Evolution (12+ months)

### Premium API for Developers

**Endpoints to Build**:
```
GET /api/v1/spot?metal=gold
GET /api/v1/price/:country/:karat
GET /api/v1/historical?from=YYYY-MM-DD&to=YYYY-MM-DD
GET /api/v1/markets
```

**Rate Limiting**:
- Free: 100 req/day, 1 req/sec
- Basic ($29/mo): 10k req/day, 10 req/sec
- Pro ($99/mo): 100k req/day, 100 req/sec

**Implementation**:
1. Create separate API server (or add routes to main server)
2. Add Redis for rate limiting
3. Create API key generation system (see `api_keys` table in schema)
4. Build developer portal page
5. Generate OpenAPI/Swagger docs

---

## Database Migration Workflow

All database schemas are documented in `docs/SUPABASE_SCHEMA.md`.

**To Deploy**:

1. **Development**: Run SQL in Supabase SQL Editor (Development Project)
2. **Test**: Export schema, run in test project
3. **Production**: Create migration file, review, apply

**Migration Checklist**:
- [ ] Backup production database
- [ ] Test migration in development
- [ ] Review RLS policies
- [ ] Check index performance
- [ ] Monitor query performance after migration
- [ ] Verify application connectivity

---

## Package Installation Guide

**Required Packages** (not yet installed):

```bash
# Stripe integration
npm install stripe

# Resend email service
npm install resend

# Social media automation (future)
npm install puppeteer

# Supabase client (if not already installed)
npm install @supabase/supabase-js
```

**Optional Packages**:

```bash
# Redis for rate limiting (production only)
npm install redis ioredis

# OpenAPI documentation generator
npm install swagger-ui-express swagger-jsdoc
```

---

## Testing Strategy

### Unit Tests
- Add tests for subscription logic: `tests/subscriptions.test.js`
- Add tests for newsletter generation: `tests/newsletter.test.js`
- Add tests for portfolio calculations: `tests/portfolio-calculator.test.js`

### Integration Tests
- Test Stripe webhook handling
- Test newsletter sending flow
- Test portfolio CRUD operations

### E2E Tests (Playwright)
- User signup flow
- Subscription checkout flow
- Portfolio creation and management

---

## Deployment Checklist

### Pre-Production
- [ ] Install all required npm packages
- [ ] Deploy Supabase database schema
- [ ] Configure environment variables
- [ ] Test all API endpoints
- [ ] Run test suite (`npm test`)
- [ ] Verify GitHub Actions workflows
- [ ] Test payment flow in Stripe test mode
- [ ] Test email delivery in Resend test mode

### Production
- [ ] Switch Stripe to live mode
- [ ] Verify Resend sender domain
- [ ] Enable production environment variables
- [ ] Monitor error logs
- [ ] Set up uptime monitoring
- [ ] Configure backup strategy
- [ ] Enable rate limiting
- [ ] Review security headers

---

## Monitoring & Analytics

**Key Metrics to Track**:

### Premium Tier
- Conversion rate (free → pro)
- Churn rate
- MRR (Monthly Recurring Revenue)
- Trial-to-paid conversion

### Newsletter
- Subscriber growth rate
- Open rate (target: >25%)
- Click-through rate
- Unsubscribe rate

### Portfolio
- Active users with portfolios
- Average holdings per portfolio
- Feature engagement

**Tools**:
- Stripe Dashboard (payments & subscriptions)
- Resend Analytics (email metrics)
- Supabase Dashboard (database performance)
- Google Analytics (user behavior)

---

## Support & Documentation

### User Documentation
- Create `/docs/pricing-faq.md` for subscription questions
- Create `/docs/newsletter-guide.md` for newsletter preferences
- Create `/docs/portfolio-guide.md` for portfolio tracker

### Developer Documentation
- API reference (when API tier is live)
- Webhook documentation
- Integration examples

---

## Cost Projections

### Monthly Costs (Estimated)

**Current (Free Tier)**:
- Supabase Free: $0
- GitHub Actions: $0 (within free tier)
- GitHub Pages: $0

**Phase 1 (With Roadmap Features)**:
- Supabase Pro: $25/mo (when hitting DB limits)
- Resend: $0-20/mo (0-10k emails/mo free)
- Stripe: 2.9% + $0.30 per transaction
- Total: ~$25-50/mo + transaction fees

**Phase 2 (Scaling)**:
- Supabase: $25-100/mo
- Resend: $20-80/mo
- Cloudflare/CDN: $0-20/mo
- Total: ~$100-200/mo

**Phase 3 (Production)**:
- Infrastructure: $200-500/mo
- APIs (Kitco, data providers): $100-300/mo
- Total: ~$300-800/mo

**Revenue Goal**: Premium subscriptions should cover infrastructure costs by month 3-6.

---

## Next Immediate Actions

1. **Deploy Supabase Schema** (30 min)
   - Run SQL from `docs/SUPABASE_SCHEMA.md`
   - Verify all tables created
   - Test RLS policies

2. **Set Up Stripe Account** (1 hour)
   - Create account
   - Create products/prices
   - Test checkout in test mode
   - Configure webhook

3. **Set Up Resend Account** (1 hour)
   - Create account
   - Verify domain
   - Test email sending
   - Add GitHub secrets

4. **Build Portfolio UI** (4-6 hours)
   - Create `portfolio.html`
   - Build auth modal component
   - Implement portfolio calculator
   - Test CRUD operations

5. **End-to-End Testing** (2 hours)
   - Test subscription flow
   - Test newsletter generation
   - Test portfolio creation
   - Fix any issues

6. **Launch Phase 1** (1 day)
   - Deploy to production
   - Monitor logs
   - Gather user feedback
   - Iterate

---

## Questions? Issues?

- **Architecture**: See `docs/ARCHITECTURE.md`
- **Database**: See `docs/SUPABASE_SCHEMA.md`
- **Contributing**: See `docs/CONTRIBUTING.md`
- **Support**: Open an issue on GitHub

---

**Last Updated**: 2026-04-22
**Status**: Phase 1 - 67% Complete (8/12 tasks)
**Next Milestone**: Complete Portfolio Tracker UI
