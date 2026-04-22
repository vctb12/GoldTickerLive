/**
 * server/routes/newsletter.js
 *
 * Newsletter subscription and management endpoints.
 * Handles subscription, verification, unsubscribe, and preference management.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Resend will be installed separately: npm install resend
// For now, we'll structure the routes to be ready for integration

const RESEND_CONFIG = {
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
    const { email, preferences = {} } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Default preferences
    const defaultPreferences = {
      frequency: 'weekly',
      metals: ['gold'],
      countries: ['UAE'],
      digest_time: '07:00',
      language: 'en',
      ...preferences,
    };

    // TODO: Insert into Supabase newsletter_subscribers table
    /*
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .upsert({
        email: normalizedEmail,
        preferences: defaultPreferences,
        status: 'pending',
        verification_token: verificationToken,
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) throw error;
    */

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationToken);

    return res.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
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
    const { token } = req.params;

    // TODO: Update subscription status in Supabase
    /*
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'active',
        verified_at: new Date().toISOString(),
        verification_token: null,
      })
      .eq('verification_token', token)
      .select()
      .single();

    if (error || !data) {
      return res.status(400).send('Invalid or expired verification link');
    }
    */

    // Redirect to success page
    return res.redirect('/subscription/verified');
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.SITE_URL || 'http://localhost:3000'}/api/newsletter/verify/${token}`;

  // TODO: Send email via Resend
  /*
  const { Resend } = require('resend');
  const resend = new Resend(RESEND_CONFIG.apiKey);

  await resend.emails.send({
    from: `${RESEND_CONFIG.fromName} <${RESEND_CONFIG.fromEmail}>`,
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
