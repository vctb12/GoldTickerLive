/**
 * server/lib/admin/rate-limiters.js - Extract rate limiting logic
 * Separates rate limiting configuration from route handlers
 */

const rateLimit = require('express-rate-limit');

// Login rate limiter tracking failed attempts per IP
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const loginAttempts = new Map();

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now - record.firstAttemptAt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(ip);
    } else if (record.count >= LOGIN_MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((LOGIN_WINDOW_MS - (now - record.firstAttemptAt)) / 1000);
      res.set('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.',
      });
    }
  }
  next();
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    record.count += 1;
  }
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// PIN verification rate limiter
const PIN_MAX_ATTEMPTS = 5;
const PIN_WINDOW_MS = 15 * 60 * 1000;
const pinAttempts = new Map();

function recordFailedPinAttempt(ip) {
  const now = Date.now();
  const record = pinAttempts.get(ip);
  if (!record || now - record.firstAttemptAt > PIN_WINDOW_MS) {
    pinAttempts.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    record.count += 1;
  }
}

function clearPinAttempts(ip) {
  pinAttempts.delete(ip);
}

function getPinAttemptCount(ip) {
  const record = pinAttempts.get(ip);
  return record ? record.count : 0;
}

function isPinRateLimited(ip) {
  const now = Date.now();
  const record = pinAttempts.get(ip);

  if (!record) return { limited: false };

  if (now - record.firstAttemptAt > PIN_WINDOW_MS) {
    pinAttempts.delete(ip);
    return { limited: false };
  }

  if (record.count >= PIN_MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((PIN_WINDOW_MS - (now - record.firstAttemptAt)) / 1000);
    return { limited: true, retryAfterSec };
  }

  return { limited: false };
}

// Admin routes rate limiter
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

module.exports = {
  loginRateLimiter,
  recordFailedLogin,
  clearLoginAttempts,
  adminRateLimiter,
  recordFailedPinAttempt,
  clearPinAttempts,
  getPinAttemptCount,
  isPinRateLimited,
  PIN_MAX_ATTEMPTS,
};
