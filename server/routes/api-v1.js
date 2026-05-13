'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { atomicWriteJSON } = require('../lib/fs-atomic');
const { getRuntimeEnvSnapshot, validateServerEnv } = require('../lib/env-validation');
const { successResponse, errorResponse } = require('../lib/api-response');

const router = express.Router();
const ROOT = path.resolve(__dirname, '../..');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const GOLD_PRICE_FILE = path.join(ROOT, 'data', 'gold_price.json');
const PROVIDER_STATE_FILE = path.join(ROOT, 'data', 'provider_state.json');
const PRICE_HISTORY_FILE = path.join(ROOT, 'src', 'data', 'historical-baseline.json');
const EVENTS_FILE = path.join(ROOT, 'data', 'analytics-events.json');
const LEADS_FILE = path.join(ROOT, 'data', 'leads.json');

const PACKAGE_VERSION = (() => {
  try {
    return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
})();

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readJsonArray(filePath) {
  if (!fileExists(filePath)) return [];
  const parsed = readJsonFile(filePath);
  return Array.isArray(parsed) ? parsed : [];
}

function writeJsonArray(filePath, entries) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  atomicWriteJSON(filePath, entries);
}

function buildSystemStatus() {
  const envValidation = validateServerEnv(process.env, console);
  const envSnapshot = getRuntimeEnvSnapshot(process.env);
  const goldPrice = readJsonFile(GOLD_PRICE_FILE);
  const providerState = readJsonFile(PROVIDER_STATE_FILE);

  return {
    status: 'ok',
    version: PACKAGE_VERSION,
    environment: envSnapshot.mode,
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      dataFileAvailable: fileExists(GOLD_PRICE_FILE),
      providerStateFileAvailable: fileExists(PROVIDER_STATE_FILE),
      supabaseConfigured: envSnapshot.supabaseConfigured,
      newsletterConfigured: envSnapshot.newsletterConfigured,
      stripeConfigured: envSnapshot.stripeConfigured,
    },
    providers: {
      latestSource: goldPrice?.provider || goldPrice?.source || null,
      latestTimestampUtc: goldPrice?.timestamp_utc || goldPrice?.fetched_at_utc || null,
      state: providerState || {},
    },
    warnings: envValidation.warnings,
  };
}

function computeFreshnessLabel(pricePayload) {
  if (!pricePayload || typeof pricePayload !== 'object') return 'unknown';
  if (pricePayload.is_fresh === true) return 'fresh';
  if (pricePayload.is_fresh === false) return 'stale';
  if (pricePayload.is_fallback === true) return 'fallback';
  return 'unknown';
}

function parseLimit(input, fallback = 120, max = 1000) {
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

const eventsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse(
    'RATE_LIMITED',
    'Too many events from this address. Please try again later.'
  ),
});

const leadsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse(
    'RATE_LIMITED',
    'Too many leads from this address. Please try again later.'
  ),
});

router.get('/health', (_req, res) => {
  const status = buildSystemStatus();
  res.json(
    successResponse(status, {
      source: 'backend',
      freshness: 'live',
    })
  );
});

router.get('/status', (_req, res) => {
  const status = buildSystemStatus();
  res.json(
    successResponse(status, {
      source: 'backend',
      freshness: 'live',
    })
  );
});

router.get('/config/public', (_req, res) => {
  const envSnapshot = getRuntimeEnvSnapshot(process.env);
  const data = {
    version: PACKAGE_VERSION,
    apiVersion: 'v1',
    environment: envSnapshot.mode,
    storageBackend: envSnapshot.storageBackend,
    features: {
      supabase: envSnapshot.supabaseConfigured,
      newsletter: envSnapshot.newsletterConfigured,
      stripe: envSnapshot.stripeConfigured,
      adminPin: envSnapshot.adminPinConfigured,
    },
  };
  res.json(successResponse(data, { source: 'backend-config', freshness: 'current' }));
});

router.get('/prices/latest', (_req, res) => {
  const pricePayload = readJsonFile(GOLD_PRICE_FILE);
  if (!pricePayload) {
    return res
      .status(503)
      .json(errorResponse('PRICE_DATA_UNAVAILABLE', 'Price data file is unavailable or invalid.'));
  }

  const data = {
    xauUsdPerOz: pricePayload.xau_usd_per_oz ?? pricePayload?.gold?.ounce_usd ?? null,
    usdPerGram24k: pricePayload.usd_per_gram_24k ?? null,
    aedPerGram24k: pricePayload.aed_per_gram_24k ?? pricePayload?.gold?.gram_aed ?? null,
    karatsAedPerGram: pricePayload.karats_aed_per_gram || null,
    timestampUtc: pricePayload.timestamp_utc || null,
    fetchedAtUtc: pricePayload.fetched_at_utc || null,
    provider: pricePayload.provider || pricePayload.source || null,
    isFresh: typeof pricePayload.is_fresh === 'boolean' ? pricePayload.is_fresh : null,
    isFallback: typeof pricePayload.is_fallback === 'boolean' ? pricePayload.is_fallback : null,
  };

  return res.json(
    successResponse(data, {
      source: data.provider || 'gold_price_file',
      freshness: computeFreshnessLabel(pricePayload),
    })
  );
});

router.get('/prices/history', (req, res) => {
  const history = readJsonFile(PRICE_HISTORY_FILE);
  if (!Array.isArray(history)) {
    return res
      .status(503)
      .json(errorResponse('PRICE_HISTORY_UNAVAILABLE', 'Historical price dataset is unavailable.'));
  }
  const limit = parseLimit(req.query.limit, 120, 1000);
  const points = history.slice(-limit);
  return res.json(
    successResponse(
      {
        total: history.length,
        returned: points.length,
        points,
      },
      {
        source: 'historical-baseline',
        freshness: 'reference',
      }
    )
  );
});

router.get('/providers/status', (_req, res) => {
  const state = readJsonFile(PROVIDER_STATE_FILE);
  const latest = readJsonFile(GOLD_PRICE_FILE);
  return res.json(
    successResponse(
      {
        providerStateFileAvailable: fileExists(PROVIDER_STATE_FILE),
        providerState: state || {},
        latestProvider: latest?.provider || latest?.source || null,
        latestTimestampUtc: latest?.timestamp_utc || latest?.fetched_at_utc || null,
      },
      {
        source: 'provider-state',
        freshness: state ? 'current' : 'unknown',
      }
    )
  );
});

router.post('/events', eventsRateLimiter, (req, res) => {
  const eventName = typeof req.body?.event === 'string' ? req.body.event.trim().slice(0, 80) : '';
  if (!eventName) {
    return res.status(400).json(errorResponse('VALIDATION_ERROR', 'event is required.'));
  }

  const entry = {
    id: `evt_${crypto.randomBytes(8).toString('hex')}`,
    event: eventName,
    page: typeof req.body?.page === 'string' ? req.body.page.trim().slice(0, 200) : null,
    ts: typeof req.body?.ts === 'number' ? req.body.ts : Date.now(),
    properties:
      req.body?.properties && typeof req.body.properties === 'object' ? req.body.properties : {},
    createdAt: new Date().toISOString(),
  };

  const events = readJsonArray(EVENTS_FILE);
  events.push(entry);
  writeJsonArray(EVENTS_FILE, events.slice(-5000));

  return res
    .status(202)
    .json(
      successResponse(
        { id: entry.id, accepted: true },
        { source: 'events-ingest', freshness: 'current' }
      )
    );
});

router.post('/leads', leadsRateLimiter, (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json(errorResponse('VALIDATION_ERROR', 'A valid email is required.'));
  }

  const lead = {
    id: `lead_${crypto.randomBytes(8).toString('hex')}`,
    email,
    name: typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : null,
    message: typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 1200) : null,
    source: typeof req.body?.source === 'string' ? req.body.source.trim().slice(0, 120) : 'public',
    createdAt: new Date().toISOString(),
  };

  const leads = readJsonArray(LEADS_FILE);
  leads.push(lead);
  writeJsonArray(LEADS_FILE, leads.slice(-5000));

  return res.status(201).json(
    successResponse(
      {
        id: lead.id,
        accepted: true,
      },
      {
        source: 'leads-ingest',
        freshness: 'current',
      }
    )
  );
});

module.exports = router;
