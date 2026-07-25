'use strict';

/**
 * Regression coverage for server/lib/subscriptions.js.
 *
 * Entitlements are covered in billing.test.js; this file pins the
 * subscription facade that maps actions → limits and cancel behaviour —
 * permission / quota blast radius for alerts, portfolio, and API usage.
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-subscriptions-32chars!';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-1234';
process.env.API_KEY_HASH_SALT = process.env.API_KEY_HASH_SALT || 'test-api-key-hash-salt';
process.env.API_KEY_HASH_ITERATIONS = process.env.API_KEY_HASH_ITERATIONS || '2';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const billingRepoPath = path.resolve(__dirname, '../server/lib/billing-repository');
const supabaseClientPath = path.resolve(__dirname, '../server/lib/supabase-client');
const entitlementsPath = path.resolve(__dirname, '../server/lib/entitlements');
const subscriptionsPath = path.resolve(__dirname, '../server/lib/subscriptions');

let tmpDir;
let prevBilling;
let prevUrl;
let prevKey;
let subscriptions;
let billingRepo;

function clearModules() {
  for (const p of [subscriptionsPath, entitlementsPath, billingRepoPath, supabaseClientPath]) {
    try {
      delete require.cache[require.resolve(p)];
    } catch {
      /* ignore */
    }
  }
}

function reload(filePath) {
  clearModules();
  process.env.BILLING_DATA_FILE = filePath;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  billingRepo = require(billingRepoPath);
  subscriptions = require(subscriptionsPath);
}

before(() => {
  prevBilling = process.env.BILLING_DATA_FILE;
  prevUrl = process.env.SUPABASE_URL;
  prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-subscriptions-'));
  reload(path.join(tmpDir, 'billing.json'));
});

after(() => {
  clearModules();
  if (prevBilling === undefined) delete process.env.BILLING_DATA_FILE;
  else process.env.BILLING_DATA_FILE = prevBilling;
  if (prevUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = prevUrl;
  if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  reload(path.join(tmpDir, `billing-${Date.now()}-${Math.random().toString(16).slice(2)}.json`));
});

describe('subscriptions facade', () => {
  test('getUserSubscription returns free tier for missing userId', async () => {
    const sub = await subscriptions.getUserSubscription(null);
    assert.equal(sub.tier, 'free');
    assert.equal(sub.status, 'active');
    assert.equal(sub.expiresAt, null);
    assert.equal(sub.features.alertLimit, 3);
    assert.equal(sub.features.portfolioLimit, 1);
    assert.equal(sub.features.apiCallsPerDay, 100);
  });

  test('hasFeatureAccess reflects free-tier boolean flags', async () => {
    assert.equal(await subscriptions.hasFeatureAccess(null, 'apiAccess'), true);
    assert.equal(await subscriptions.hasFeatureAccess(null, 'webPush'), false);
    assert.equal(await subscriptions.hasFeatureAccess(null, 'webhookSupport'), false);
    assert.equal(await subscriptions.hasFeatureAccess(null, 'adsEnabled'), true);
  });

  test('getFeatureLimit returns numeric free-tier limits', async () => {
    assert.equal(await subscriptions.getFeatureLimit(null, 'alertLimit'), 3);
    assert.equal(await subscriptions.getFeatureLimit(null, 'savedCalcLimit'), 5);
    assert.equal(await subscriptions.getFeatureLimit(null, 'portfolioLimit'), 1);
    assert.equal(await subscriptions.getFeatureLimit(null, 'missingFlag'), 0);
  });

  test('checkUsageLimit maps known actions to free-tier caps', async () => {
    const alert = await subscriptions.checkUsageLimit(null, 'create_alert');
    assert.equal(alert.allowed, true);
    assert.equal(alert.limit, 3);
    assert.equal(alert.current, 0);

    const portfolio = await subscriptions.checkUsageLimit(null, 'create_portfolio');
    assert.equal(portfolio.limit, 1);

    const api = await subscriptions.checkUsageLimit(null, 'api_call');
    assert.equal(api.limit, 100);

    const calc = await subscriptions.checkUsageLimit(null, 'save_calculation');
    assert.equal(calc.limit, 5);
  });

  test('checkUsageLimit allows unknown actions without a hard cap', async () => {
    const result = await subscriptions.checkUsageLimit(null, 'unknown_action');
    assert.equal(result.allowed, true);
    assert.equal(result.limit, Infinity);
    assert.equal(result.current, 0);
  });

  test('pro subscription raises limits used by checkUsageLimit', async () => {
    await billingRepo.createSubscription({
      userId: 'user-pro-limits',
      stripeCustomerId: 'cus_test_pro',
      stripeSubscriptionId: 'sub_test_pro',
      tier: 'pro',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
    });

    const alert = await subscriptions.checkUsageLimit('user-pro-limits', 'create_alert');
    assert.equal(alert.limit, 50);

    const portfolio = await subscriptions.checkUsageLimit('user-pro-limits', 'create_portfolio');
    assert.equal(portfolio.limit, 10);

    assert.equal(await subscriptions.hasFeatureAccess('user-pro-limits', 'webPush'), true);
    assert.equal(await subscriptions.hasFeatureAccess('user-pro-limits', 'adsEnabled'), false);

    const sub = await subscriptions.getUserSubscription('user-pro-limits');
    assert.equal(sub.tier, 'pro');
    assert.equal(sub.status, 'active');
  });

  test('cancelSubscription returns not_found when user has no active sub', async () => {
    const result = await subscriptions.cancelSubscription('user-no-sub');
    assert.equal(result.status, 'not_found');
    assert.equal(result.userId, 'user-no-sub');
  });

  test('cancelSubscription marks an active subscription canceled', async () => {
    await billingRepo.createSubscription({
      userId: 'user-cancel',
      stripeCustomerId: 'cus_test_cancel',
      stripeSubscriptionId: 'sub_test_cancel',
      tier: 'api',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
    });

    const result = await subscriptions.cancelSubscription('user-cancel');
    assert.equal(result.status, 'canceled');
    assert.equal(result.userId, 'user-cancel');
    assert.ok(result.canceledAt);

    const after = await billingRepo.getActiveSubscription('user-cancel');
    assert.equal(after, null);
  });

  test('TIER_FEATURES prices and names stay stable', () => {
    assert.equal(subscriptions.TIER_FEATURES.free.price, 0);
    assert.equal(subscriptions.TIER_FEATURES.pro.priceMonthly, 4.99);
    assert.equal(subscriptions.TIER_FEATURES.api.priceMonthly, 19.99);
    assert.equal(subscriptions.SUBSCRIPTION_TIERS.PRO, 'pro');
  });
});
