/**
 * scripts/node/send-newsletter.js
 *
 * Send newsletter to active subscribers via Resend API.
 * Handles batching, personalization, and error tracking.
 */

const { generateDailyDigest, generateWeeklyRecap } = require('./generate-newsletter');

// Resend SDK (to be installed: npm install resend)
// const { Resend } = require('resend');

const RESEND_CONFIG = {
  apiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'newsletter@goldtickerlive.com',
  fromName: 'Gold Ticker Live',
  batchSize: 1000, // Resend's batch limit
};

async function getActiveSubscribers(_preferences = {}) {
  // TODO: Fetch from Supabase
  /*
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let query = supabase
    .from('newsletter_subscribers')
    .select('email, preferences')
    .eq('status', 'active');

  // Filter by frequency
  if (preferences.frequency) {
    query = query.contains('preferences', { frequency: preferences.frequency });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching subscribers:', error);
    return [];
  }

  return data;
  */

  // Placeholder
  return [];
}

async function sendBatch(emails, subject, _html, _text) {
  if (emails.length === 0) return { sent: 0, failed: 0 };

  // TODO: Send via Resend batch API
  /*
  const resend = new Resend(RESEND_CONFIG.apiKey);

  const emailsToSend = emails.map(email => ({
    from: `${RESEND_CONFIG.fromName} <${RESEND_CONFIG.fromEmail}>`,
    to: email,
    subject,
    html: _html.replace(/\{\{email\}\}/g, email),
    text: _text.replace(/\{\{email\}\}/g, email),
    tags: {
      category: 'newsletter',
      batch: new Date().toISOString(),
    },
  }));

  try {
    const result = await resend.batch.send(emailsToSend);
    return {
      sent: result.data?.length || 0,
      failed: 0,
    };
  } catch (error) {
    console.error('Batch send error:', error);
    return {
      sent: 0,
      failed: emails.length,
    };
  }
  */

  // Placeholder
  console.log(`[Newsletter] Would send to ${emails.length} subscribers`);
  console.log(`[Newsletter] Subject: ${subject}`);
  return { sent: emails.length, failed: 0 };
}

async function recordCampaign(type, subject, stats) {
  // TODO: Insert into Supabase newsletter_campaigns table
  /*
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await supabase.from('newsletter_campaigns').insert({
    campaign_type: type,
    subject,
    content_html: stats.html,
    sent_count: stats.sent,
    sent_at: new Date().toISOString(),
  });
  */

  console.log(
    `[Newsletter] Campaign recorded: ${type} - ${stats.sent} sent, ${stats.failed} failed`
  );
}

async function sendNewsletter(type = 'daily') {
  try {
    console.log(`[Newsletter] Starting ${type} newsletter send...`);

    // Get active subscribers
    const subscribers = await getActiveSubscribers({ frequency: type });

    if (subscribers.length === 0) {
      console.log('[Newsletter] No active subscribers found');
      return;
    }

    console.log(`[Newsletter] Found ${subscribers.length} active subscribers`);

    // Generate content
    const content = type === 'weekly' ? await generateWeeklyRecap() : await generateDailyDigest();

    console.log(`[Newsletter] Generated content: ${content.subject}`);

    // Send in batches
    let totalSent = 0;
    let totalFailed = 0;

    for (let i = 0; i < subscribers.length; i += RESEND_CONFIG.batchSize) {
      const batch = subscribers.slice(i, i + RESEND_CONFIG.batchSize);
      const emails = batch.map((s) => s.email);

      console.log(`[Newsletter] Sending batch ${Math.floor(i / RESEND_CONFIG.batchSize) + 1}...`);

      const { sent, failed } = await sendBatch(emails, content.subject, content.html, content.text);

      totalSent += sent;
      totalFailed += failed;

      // Rate limiting - wait 1 second between batches
      if (i + RESEND_CONFIG.batchSize < subscribers.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Record campaign
    await recordCampaign(type, content.subject, {
      html: content.html,
      sent: totalSent,
      failed: totalFailed,
    });

    console.log(`[Newsletter] Completed: ${totalSent} sent, ${totalFailed} failed`);
  } catch (error) {
    console.error('[Newsletter] Error sending newsletter:', error);
    process.exit(1);
  }
}

// CLI usage
if (require.main === module) {
  const type = process.argv[2] || 'daily';

  if (!['daily', 'weekly'].includes(type)) {
    console.error('Usage: node send-newsletter.js [daily|weekly]');
    process.exit(1);
  }

  sendNewsletter(type);
}

module.exports = { sendNewsletter };
