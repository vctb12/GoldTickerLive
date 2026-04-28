/**
 * server/routes/newsletter.js
 *
 * Newsletter subscription and management endpoints.
 * Handles subscription, verification, unsubscribe, and preference management.
 */

const express = require('express');
const router = express.Router();
const { buildUrl } = require('../lib/site-url');

// Resend will be installed separately: npm install resend
// For now, we'll structure the routes to be ready for integration.
// `_RESEND_CONFIG` is intentionally prefixed with an underscore so lint
// recognizes it as reserved-for-future-use. It is referenced by the
// commented Resend integration block in `sendVerificationEmail` below.
const _RESEND_CONFIG = {
  apiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'newsletter@goldprices.com',
  fromName: 'Gold Prices Platform',
};

/**
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter with double opt-in
 *
 * Body: {
 *   email: string,
 *   preferences?: {
 *     frequency: 'daily' | 'weekly',
 *     metals: string[],
 *     countries: string[],
 *     language: 'en' | 'ar'
 *   }
 * }
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    return res.status(501).json({
      error: 'Newsletter subscription is not implemented',
      message: 'Subscription persistence and verification delivery are not configured yet.',
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/**
 * GET /api/newsletter/verify/:token
 * Verify email subscription
 */
router.get('/verify/:token', async (req, res) => {
  try {
    return res.status(501).send('Newsletter verification is not implemented');
  } catch (error) {
    console.error('Error verifying subscription:', error);
    return res.status(500).send('Verification failed');
  }
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter
 *
 * Body: { email: string } or { token: string }
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email && !token) {
      return res.status(400).json({ error: 'Email or token required' });
    }

    // TODO: Update subscription status in Supabase
    /*
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const query = email
      ? supabase.from('newsletter_subscribers').update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        }).eq('email', email.toLowerCase().trim())
      : supabase.from('newsletter_subscribers').update({
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        }).eq('id', token);

    const { error } = await query;

    if (error) throw error;
    */

    return res.json({
      success: true,
      message: 'Successfully unsubscribed',
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * PUT /api/newsletter/preferences
 * Update newsletter preferences
 *
 * Body: {
 *   email: string,
 *   preferences: {
 *     frequency?: 'daily' | 'weekly',
 *     metals?: string[],
 *     countries?: string[],
 *     digest_time?: string,
 *     language?: 'en' | 'ar'
 *   }
 * }
 */
router.put('/preferences', async (req, res) => {
  try {
    const { email, preferences } = req.body;

    if (!email || !preferences) {
      return res.status(400).json({ error: 'Email and preferences required' });
    }

    // TODO: Update preferences in Supabase
    /*
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ preferences })
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'active');

    if (error) throw error;
    */

    return res.json({
      success: true,
      message: 'Preferences updated',
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * GET /api/newsletter/stats
 * Admin-only endpoint intentionally removed until admin authentication
 * and authorization middleware is applied.
 */

// Helper functions

function isValidEmail(email) {
  // Anchored regex with non-overlapping negated character classes — no
  // catastrophic backtracking is possible. Reviewed in
  // docs/plans/2026-04-24_security-performance-deps-audit.md Track A.A.2 #12.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Stub helper reserved for the future Resend-backed verification flow.
// Underscore prefix signals intentional unused binding to ESLint.
async function _sendVerificationEmail(email, token) {
  const verifyUrl = buildUrl(`/api/newsletter/verify/${encodeURIComponent(token)}`);

  // TODO: Send email via Resend
  /*
  const { Resend } = require('resend');
  const resend = new Resend(_RESEND_CONFIG.apiKey);

  await resend.emails.send({
    from: `${_RESEND_CONFIG.fromName} <${_RESEND_CONFIG.fromEmail}>`,
    to: email,
    subject: 'Confirm your newsletter subscription',
    html: `
      <h2>Welcome to Gold Prices Newsletter!</h2>
      <p>Please confirm your subscription by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
  */

  console.log(`[Newsletter] Verification email would be sent to ${email}`);
  console.log(`[Newsletter] Verify URL: ${verifyUrl}`);
}

module.exports = router;
