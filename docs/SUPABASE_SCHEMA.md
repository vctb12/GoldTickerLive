# Supabase Database Schema

This document contains all SQL migrations for the Gold Prices platform roadmap features.

## Premium Subscriptions

```sql
-- ============================================================================
-- Subscriptions Table
-- ============================================================================
-- Stores user subscription information for premium tiers (Pro, API)

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'api')),
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')) DEFAULT 'active',

  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,

  -- Subscription dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Index for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own subscription
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only authenticated users can insert (via service role in practice)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Usage Tracking Table
-- ============================================================================
-- Tracks usage for rate-limited features (alerts, API calls, etc.)

CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('alert', 'api_call', 'portfolio', 'export')),
  count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, resource_type, period_start)
);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Email Newsletter

```sql
-- ============================================================================
-- Newsletter Subscribers Table
-- ============================================================================
-- Stores email newsletter subscriptions with preferences

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,

  -- User preferences
  preferences JSONB DEFAULT '{
    "frequency": "weekly",
    "metals": ["gold"],
    "countries": ["UAE"],
    "digest_time": "07:00",
    "language": "en"
  }'::jsonb,

  -- Subscription status
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced')) DEFAULT 'pending',
  verification_token TEXT,
  verified_at TIMESTAMPTZ,

  -- Tracking
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,

  -- Analytics
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX idx_newsletter_preferences ON newsletter_subscribers USING GIN(preferences);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (pending verification)
CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Users can update their own subscription by email
CREATE POLICY "Users can update own subscription"
  ON newsletter_subscribers FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Newsletter Campaigns Table
-- ============================================================================
-- Tracks sent newsletter campaigns

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('daily', 'weekly', 'special')),
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT,

  -- Stats
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,

  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_newsletter_campaigns_type ON newsletter_campaigns(campaign_type);
CREATE INDEX idx_newsletter_campaigns_sent_at ON newsletter_campaigns(sent_at);
```

## Portfolio Tracker

```sql
-- ============================================================================
-- Portfolios Table
-- ============================================================================
-- User gold/metal portfolios

CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  description TEXT,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own portfolios"
  ON portfolios FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Holdings Table
-- ============================================================================
-- Individual gold/metal holdings within portfolios

CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,

  -- Metal details
  metal TEXT NOT NULL CHECK (metal IN ('gold', 'silver', 'platinum', 'palladium')) DEFAULT 'gold',
  karat TEXT, -- e.g., '24K', '22K', '925' for silver

  -- Weight and purchase info
  weight_grams NUMERIC(12, 4) NOT NULL CHECK (weight_grams > 0),
  purchase_price_per_gram NUMERIC(12, 4),
  purchase_date DATE,
  purchase_currency TEXT DEFAULT 'USD',

  -- Optional details
  form TEXT, -- 'bar', 'coin', 'jewelry', 'bullion'
  notes TEXT,
  image_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_holdings_portfolio_id ON holdings(portfolio_id);
CREATE INDEX idx_holdings_metal ON holdings(metal);
CREATE INDEX idx_holdings_purchase_date ON holdings(purchase_date);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

-- Users can manage holdings in their own portfolios
CREATE POLICY "Users can manage own holdings"
  ON holdings FOR ALL
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER update_holdings_updated_at
  BEFORE UPDATE ON holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- Portfolio Snapshots Table (Optional - for historical tracking)
-- ============================================================================
-- Daily snapshots of portfolio values for performance tracking

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,

  snapshot_date DATE NOT NULL,
  total_value_usd NUMERIC(12, 2),
  total_cost_basis_usd NUMERIC(12, 2),
  unrealized_gain_loss NUMERIC(12, 2),

  -- Metal breakdown
  metals_breakdown JSONB, -- { "gold": { "grams": 100, "value": 5000 }, ... }

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(portfolio_id, snapshot_date)
);

CREATE INDEX idx_portfolio_snapshots_portfolio_date ON portfolio_snapshots(portfolio_id, snapshot_date);

ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own portfolio snapshots"
  ON portfolio_snapshots FOR SELECT
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );
```

## Price Alerts Enhancement

```sql
-- ============================================================================
-- Price Alerts Table (Enhanced)
-- ============================================================================
-- Extends existing alerts with advanced features for Pro/API tiers

CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Alert configuration
  metal TEXT NOT NULL DEFAULT 'gold',
  country_code TEXT NOT NULL,
  karat TEXT,

  -- Alert condition
  condition_type TEXT NOT NULL CHECK (condition_type IN ('above', 'below', 'change_percent', 'portfolio_value')),
  target_value NUMERIC(12, 4) NOT NULL,

  -- Advanced features (Pro/API tiers)
  is_recurring BOOLEAN DEFAULT false,
  notification_channels JSONB DEFAULT '["browser"]'::jsonb, -- ['browser', 'email', 'webhook', 'whatsapp']
  webhook_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  triggered_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active);
CREATE INDEX idx_price_alerts_metal_country ON price_alerts(metal, country_code);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
  ON price_alerts FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER update_price_alerts_updated_at
  BEFORE UPDATE ON price_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## API Keys (for API tier)

```sql
-- ============================================================================
-- API Keys Table
-- ============================================================================
-- API keys for API tier subscribers

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  key_hash TEXT UNIQUE NOT NULL, -- SHA256 hash of the key
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., 'gp_12345678')
  name TEXT NOT NULL DEFAULT 'API Key',

  -- Permissions
  scopes JSONB DEFAULT '["read:prices", "read:historical"]'::jsonb,

  -- Rate limiting
  rate_limit_per_day INTEGER DEFAULT 500,
  rate_limit_per_second INTEGER DEFAULT 10,

  -- Usage stats
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id);

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- API Usage Logs (for analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,

  -- Rate limiting info
  rate_limit_remaining INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own API usage"
  ON api_usage_logs FOR SELECT
  USING (auth.uid() = user_id);
```

## Migration Instructions

1. Run these SQL commands in your Supabase SQL Editor in order
2. Each section is independent and can be run separately
3. Update `.env` with Supabase credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
4. For production, consider adding:
   - Additional indexes based on query patterns
   - Backup policies
   - Data retention policies (especially for usage_logs)

## Notes

- All tables use UUID primary keys for better distribution
- Row Level Security (RLS) is enabled on all tables
- Timestamps are always in UTC
- JSON fields use JSONB for better performance
- Indexes are created for common query patterns
