/**
 * Public Submissions Routes
 *
 * Unauthenticated endpoints for public users to submit shop listings for
 * editorial review.  Submissions are stored in `data/pending_shops.json`
 * and surfaced in the admin queue — they are never auto-published.
 */

'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const router = express.Router();
const pendingShopsRepo = require('../repositories/pending-shops.repository');

// ---------------------------------------------------------------------------
// Rate limiter — tighter than the global limit because these are public writes
// ---------------------------------------------------------------------------
const submitRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 submissions per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions from this address. Please try again later.',
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Allowed country codes. Mirrors the select options on the submit-shop form. */
const ALLOWED_COUNTRY_CODES = new Set([
  'AE',
  'SA',
  'KW',
  'QA',
  'BH',
  'OM',
  'EG',
  'JO',
  'MA',
  'IN',
  'PK',
  'TR',
]);

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}$/;
const URL_RE = /^https?:\/\//i;

function sanitize(val, maxLen = 200) {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/\s+/g, ' ').slice(0, maxLen);
}

// ---------------------------------------------------------------------------
// POST /api/submit-shop
// ---------------------------------------------------------------------------
router.post('/submit-shop', submitRateLimiter, (req, res) => {
  // Honeypot — bots fill in the hidden company_website field; humans leave it blank.
  const honeypot = req.body.company_website;
  if (honeypot && typeof honeypot === 'string' && honeypot.trim()) {
    // Silently succeed so bots get no feedback about the guard.
    return res.status(201).json({ success: true, id: null });
  }

  // ── Required fields ──────────────────────────────────────────────────────
  const shopName = sanitize(req.body.shop_name, 120);
  const city = sanitize(req.body.city, 100);
  const countryCode = sanitize(req.body.country_code, 2).toUpperCase();
  const contactEmail = sanitize(req.body.contact_email, 160);

  const errors = [];
  if (!shopName) errors.push('shop_name is required');
  if (!city) errors.push('city is required');
  if (!ALLOWED_COUNTRY_CODES.has(countryCode)) errors.push('country_code is invalid');
  if (!contactEmail || !EMAIL_RE.test(contactEmail))
    errors.push('contact_email must be a valid email address');

  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join('; ') });
  }

  // ── Optional fields ──────────────────────────────────────────────────────
  const ownerName = sanitize(req.body.owner_name, 120) || null;
  const contactPhone = sanitize(req.body.contact_phone, 60) || null;
  const market = sanitize(req.body.market, 140) || null;
  const specialty = sanitize(req.body.specialty, 180) || null;
  const notes = sanitize(req.body.notes, 1200) || null;

  // Validate website if provided
  const rawWebsite = sanitize(req.body.website, 200);
  let website = null;
  if (rawWebsite) {
    const normalized = /^https?:\/\//i.test(rawWebsite) ? rawWebsite : `https://${rawWebsite}`;
    if (URL_RE.test(normalized)) {
      website = normalized;
    }
  }

  // ── Persist ──────────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const submission = {
    id: `psub_${crypto.randomBytes(12).toString('hex')}`,
    status: 'pending',
    shop_name: shopName,
    owner_name: ownerName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    country_code: countryCode,
    city,
    market,
    website,
    specialty,
    notes,
    source: 'public-submit-shop',
    ip_hash: null, // not logging raw IP — privacy-safe placeholder
    submitted_at: now,
    reviewed_at: null,
    reviewed_by: null,
    rejection_reason: null,
  };

  try {
    pendingShopsRepo.insert(submission);
    return res.status(201).json({ success: true, id: submission.id });
  } catch (err) {
    console.error('[submissions] Failed to save pending submission:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Could not save submission. Please try again later.',
    });
  }
});

module.exports = router;
