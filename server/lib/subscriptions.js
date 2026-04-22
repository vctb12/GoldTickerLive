/**
 * server/lib/subscriptions.js
 *
 * Subscription management logic for premium tiers.
 * Handles subscription creation, updates, cancellations, and tier checking.
 *
 * Tiers:
 * - free: AdSense ads, basic features, 100 API calls/day (future)
 * - pro: Ad-free, advanced alerts, priority support, unlimited exports ($4.99/month)
 * - api: Pro features + API access (500 calls/day), webhook support ($19.99/month)
 */

const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  API: 'api',
};

const TIER_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      adsEnabled: true,
      maxAlerts: 3,
      exportFormats: ['csv'],
      apiCallsPerDay: 100,
      prioritySupport: false,
      advancedAlerts: false,
      portfolioLimit: 1,
    },
  },
  pro: {
    name: 'Pro',
    priceMonthly: 4.99,
    priceAnnual: 49.99,
    features: {
      adsEnabled: false,
      maxAlerts: 50,
      exportFormats: ['csv', 'json', 'excel'],
      apiCallsPerDay: 100,
      prioritySupport: true,
      advancedAlerts: true,
      portfolioLimit: 10,
      pushNotifications: true,
      emailDigest: true,
    },
  },
  api: {
    name: 'API',
    priceMonthly: 19.99,
    priceAnnual: 199.99,
    features: {
      adsEnabled: false,
      maxAlerts: 100,
      exportFormats: ['csv', 'json', 'excel'],
      apiCallsPerDay: 500,
      prioritySupport: true,
      advancedAlerts: true,
      portfolioLimit: 50,
      pushNotifications: true,
      emailDigest: true,
      apiAccess: true,
      webhookSupport: true,
    },
  },
};

/**
 * Get subscription tier for a user
 * @param {string} userId - User ID from Supabase auth
 * @returns {Promise<{tier: string, features: object, status: string, expiresAt: Date|null}>}
 */
async function getUserSubscription(userId) {
  if (!userId) {
    return {
      tier: SUBSCRIPTION_TIERS.FREE,
      features: TIER_FEATURES.free.features,
      status: 'active',
      expiresAt: null,
    };
  }

  // TODO: Query Supabase subscriptions table
  // For now, return free tier
  return {
    tier: SUBSCRIPTION_TIERS.FREE,
    features: TIER_FEATURES.free.features,
    status: 'active',
    expiresAt: null,
  };
}

/**
 * Check if user has access to a specific feature
 * @param {string} userId - User ID
 * @param {string} feature - Feature name (e.g., 'advancedAlerts', 'apiAccess')
 * @returns {Promise<boolean>}
 */
async function hasFeatureAccess(userId, feature) {
  const subscription = await getUserSubscription(userId);
  return subscription.features[feature] === true;
}

/**
 * Get feature limit for a user
 * @param {string} userId - User ID
 * @param {string} feature - Feature name (e.g., 'maxAlerts', 'apiCallsPerDay')
 * @returns {Promise<number>}
 */
async function getFeatureLimit(userId, feature) {
  const subscription = await getUserSubscription(userId);
  return subscription.features[feature] || 0;
}

/**
 * Check if user can perform action based on usage limits
 * @param {string} userId - User ID
 * @param {string} action - Action type (e.g., 'create_alert', 'api_call')
 * @returns {Promise<{allowed: boolean, limit: number, current: number}>}
 */
async function checkUsageLimit(userId, action) {
  const subscription = await getUserSubscription(userId);

  // Map actions to feature limits
  const limitMap = {
    create_alert: 'maxAlerts',
    create_portfolio: 'portfolioLimit',
    api_call: 'apiCallsPerDay',
  };

  const limitKey = limitMap[action];
  if (!limitKey) {
    return { allowed: true, limit: Infinity, current: 0 };
  }

  const limit = subscription.features[limitKey];

  // TODO: Query actual usage from database
  const currentUsage = 0;

  return {
    allowed: currentUsage < limit,
    limit,
    current: currentUsage,
  };
}

/**
 * Create or update subscription record
 * @param {object} params - Subscription parameters
 * @returns {Promise<object>}
 */
async function createSubscription(params) {
  const {
    userId,
    tier,
    stripeCustomerId,
    stripeSubscriptionId,
    status = 'active',
    currentPeriodEnd,
  } = params;

  // TODO: Insert into Supabase subscriptions table
  return {
    id: 'temp-id',
    userId,
    tier,
    stripeCustomerId,
    stripeSubscriptionId,
    status,
    currentPeriodEnd,
    createdAt: new Date(),
  };
}

/**
 * Update subscription status (for webhook handling)
 * @param {string} stripeSubscriptionId - Stripe subscription ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>}
 */
async function updateSubscription(stripeSubscriptionId, updates) {
  // TODO: Update Supabase subscriptions table
  return {
    stripeSubscriptionId,
    ...updates,
    updatedAt: new Date(),
  };
}

/**
 * Cancel subscription
 * @param {string} userId - User ID
 * @returns {Promise<object>}
 */
async function cancelSubscription(userId) {
  // TODO: Update subscription status to 'canceled' in Supabase
  // Keep access until current period ends
  return {
    userId,
    status: 'canceled',
    canceledAt: new Date(),
  };
}

module.exports = {
  SUBSCRIPTION_TIERS,
  TIER_FEATURES,
  getUserSubscription,
  hasFeatureAccess,
  getFeatureLimit,
  checkUsageLimit,
  createSubscription,
  updateSubscription,
  cancelSubscription,
};
