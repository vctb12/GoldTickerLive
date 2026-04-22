/**
 * server/routes/stripe.js
 *
 * Stripe payment integration routes for subscription management.
 * Handles checkout session creation, webhooks, and customer portal access.
 */

const express = require('express');
const router = express.Router();

// Stripe SDK will be installed separately: npm install stripe
// For now, we'll structure the routes to be ready for integration

const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  prices: {
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    proAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
    apiMonthly: process.env.STRIPE_PRICE_API_MONTHLY || '',
    apiAnnual: process.env.STRIPE_PRICE_API_ANNUAL || '',
  },
};

function getMissingStripePriceConfig() {
  const requiredPrices = {
    STRIPE_PRICE_PRO_MONTHLY: STRIPE_CONFIG.prices.proMonthly,
    STRIPE_PRICE_PRO_ANNUAL: STRIPE_CONFIG.prices.proAnnual,
    STRIPE_PRICE_API_MONTHLY: STRIPE_CONFIG.prices.apiMonthly,
    STRIPE_PRICE_API_ANNUAL: STRIPE_CONFIG.prices.apiAnnual,
  };

  return Object.keys(requiredPrices).filter((key) => !requiredPrices[key]);
}

/**
 * POST /api/stripe/create-checkout
 * Create a Stripe Checkout session for subscription
 *
 * Body: { tier: 'pro'|'api', interval: 'month'|'year', userId: string }
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { tier, interval = 'month', userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    if (!['pro', 'api'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    if (!['month', 'year'].includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval' });
    }

    const missingPriceConfig = getMissingStripePriceConfig();
    if (missingPriceConfig.length > 0) {
      return res.status(500).json({
        error: 'Stripe price configuration is missing',
        missing: missingPriceConfig,
      });
    }

    // Determine price ID
    const priceKey =
      tier === 'pro'
        ? interval === 'month'
          ? 'proMonthly'
          : 'proAnnual'
        : interval === 'month'
          ? 'apiMonthly'
          : 'apiAnnual';

    const priceId = STRIPE_CONFIG.prices[priceKey];

    // TODO: Initialize Stripe and create checkout session
    /*
    const stripe = require('stripe')(STRIPE_CONFIG.secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.SITE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
      client_reference_id: userId,
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          userId,
          tier,
        },
      },
    });

    return res.json({ sessionId: session.id, url: session.url });
    */

    // Placeholder response until Stripe is installed
    return res.status(501).json({
      error: 'Stripe integration pending - install stripe package first',
      config: { tier, interval, priceId },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * POST /api/stripe/create-portal
 * Create a Stripe Customer Portal session for managing subscription
 *
 * Body: { userId: string }
 */
router.post('/create-portal', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // TODO: Get customer ID from database and create portal session
    /*
    const subscriptions = require('../lib/subscriptions');
    const subscription = await subscriptions.getUserSubscription(userId);

    if (!subscription.stripeCustomerId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    const stripe = require('stripe')(STRIPE_CONFIG.secretKey);
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.SITE_URL}/account`,
    });

    return res.json({ url: session.url });
    */

    return res.status(501).json({
      error: 'Stripe integration pending - install stripe package first',
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 *
 * Events handled:
 * - checkout.session.completed: New subscription created
 * - customer.subscription.updated: Subscription changed
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Payment succeeded
 * - invoice.payment_failed: Payment failed
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // `_sig` captured for the future webhook verification flow below.
    // Prefixed to signal intentional unused binding until Stripe SDK is wired up.
    const _sig = req.headers['stripe-signature'];

    // TODO: Verify webhook signature and handle events
    /*
    const stripe = require('stripe')(STRIPE_CONFIG.secretKey);
    const subscriptions = require('../lib/subscriptions');

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        _sig,
        STRIPE_CONFIG.webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const tier = session.metadata.tier;

        // Create subscription record
        await subscriptions.createSubscription({
          userId,
          tier,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          status: 'active',
          currentPeriodEnd: new Date(session.subscription.current_period_end * 1000),
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await subscriptions.updateSubscription(subscription.id, {
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await subscriptions.updateSubscription(subscription.id, {
          status: 'canceled',
          canceledAt: new Date(),
        });
        break;
      }

      case 'invoice.payment_succeeded':
        console.log('Payment succeeded for', event.data.object.customer);
        break;

      case 'invoice.payment_failed':
        console.log('Payment failed for', event.data.object.customer);
        // TODO: Send email notification to user
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
    */

    return res.status(501).json({
      error: 'Stripe webhook handler pending - install stripe package first',
    });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * GET /api/stripe/config
 * Get Stripe publishable key for client-side
 */
router.get('/config', (_req, res) => {
  res.json({
    publishableKey: STRIPE_CONFIG.publishableKey,
  });
});

module.exports = router;
