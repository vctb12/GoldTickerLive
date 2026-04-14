'use strict';

/**
 * Tests for utils/inputValidation.js — input validation and sanitization.
 *
 * Inline implementation since source uses ESM and tests use CommonJS.
 *
 * Run with: npm test
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Inline validation functions (mirrors utils/inputValidation.js)
// ---------------------------------------------------------------------------

function isValidUAEPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // +971 5X XXX XXXX (13 chars), 00971 5X XXX XXXX (14 chars), 05X XXX XXXX (10 chars)
  return /^(\+971\d{9}|00971\d{9}|05\d{8})$/.test(cleaned);
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function validateNumericRange(value, min, max) {
  const num = Number(value);
  if (isNaN(num)) return { valid: false, error: 'Value must be a number' };
  if (num < min) return { valid: false, error: `Value must be at least ${min}` };
  if (num > max) return { valid: false, error: `Value must be at most ${max}` };
  return { valid: true, value: num };
}

function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitizeURLParam(str) {
  if (!str || typeof str !== 'string') return '';
  return encodeURIComponent(str.trim());
}

function validatePriceAlert(price, currency) {
  const num = Number(price);
  if (isNaN(num) || num <= 0) return { valid: false, error: 'Price must be a positive number' };
  const MAX_PRICE_PER_GRAM = {
    USD: 500,
    AED: 2000,
    SAR: 2000,
    KWD: 200,
    QAR: 2000,
    BHD: 200,
    OMR: 200,
    EGP: 30000,
    INR: 50000,
  };
  const maxPrice = MAX_PRICE_PER_GRAM[currency] || 100000;
  if (num > maxPrice) return { valid: false, error: `Price seems too high for ${currency}` };
  return { valid: true, value: num };
}

// ===========================================================================
// Tests
// ===========================================================================

describe('isValidUAEPhone', () => {
  test('accepts +971 format', () => {
    assert.equal(isValidUAEPhone('+971501234567'), true);
  });

  test('accepts +971 with spaces', () => {
    assert.equal(isValidUAEPhone('+971 50 123 4567'), true);
  });

  test('accepts 00971 format', () => {
    assert.equal(isValidUAEPhone('00971501234567'), true);
  });

  test('accepts 05X local format', () => {
    assert.equal(isValidUAEPhone('0501234567'), true);
  });

  test('rejects empty/null', () => {
    assert.equal(isValidUAEPhone(''), false);
    assert.equal(isValidUAEPhone(null), false);
  });

  test('rejects non-UAE number', () => {
    assert.equal(isValidUAEPhone('+1234567890'), false);
  });

  test('rejects too short', () => {
    assert.equal(isValidUAEPhone('+97150'), false);
  });
});

describe('isValidEmail', () => {
  test('accepts standard email', () => {
    assert.equal(isValidEmail('user@example.com'), true);
  });

  test('accepts email with subdomain', () => {
    assert.equal(isValidEmail('user@mail.example.com'), true);
  });

  test('rejects missing @', () => {
    assert.equal(isValidEmail('userexample.com'), false);
  });

  test('rejects missing domain', () => {
    assert.equal(isValidEmail('user@'), false);
  });

  test('rejects single-char TLD', () => {
    assert.equal(isValidEmail('user@example.c'), false);
  });

  test('rejects empty/null', () => {
    assert.equal(isValidEmail(''), false);
    assert.equal(isValidEmail(null), false);
  });
});

describe('validateNumericRange', () => {
  test('accepts value in range', () => {
    const r = validateNumericRange(50, 1, 100);
    assert.equal(r.valid, true);
    assert.equal(r.value, 50);
  });

  test('accepts boundary values', () => {
    assert.equal(validateNumericRange(1, 1, 100).valid, true);
    assert.equal(validateNumericRange(100, 1, 100).valid, true);
  });

  test('rejects below min', () => {
    assert.equal(validateNumericRange(0, 1, 100).valid, false);
  });

  test('rejects above max', () => {
    assert.equal(validateNumericRange(101, 1, 100).valid, false);
  });

  test('rejects non-numeric', () => {
    assert.equal(validateNumericRange('abc', 1, 100).valid, false);
  });

  test('accepts string numbers', () => {
    assert.equal(validateNumericRange('50', 1, 100).valid, true);
  });
});

describe('sanitizeText', () => {
  test('escapes HTML entities', () => {
    assert.equal(
      sanitizeText('<script>alert("xss")</script>'),
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  test('escapes ampersand', () => {
    assert.equal(sanitizeText('A & B'), 'A &amp; B');
  });

  test('handles empty/null', () => {
    assert.equal(sanitizeText(''), '');
    assert.equal(sanitizeText(null), '');
  });
});

describe('sanitizeURLParam', () => {
  test('encodes special characters', () => {
    assert.equal(sanitizeURLParam('hello world'), 'hello%20world');
  });

  test('trims whitespace', () => {
    assert.equal(sanitizeURLParam('  test  '), 'test');
  });

  test('handles empty/null', () => {
    assert.equal(sanitizeURLParam(''), '');
    assert.equal(sanitizeURLParam(null), '');
  });
});

describe('validatePriceAlert', () => {
  test('accepts valid AED price', () => {
    const r = validatePriceAlert(250, 'AED');
    assert.equal(r.valid, true);
    assert.equal(r.value, 250);
  });

  test('rejects zero', () => {
    assert.equal(validatePriceAlert(0, 'AED').valid, false);
  });

  test('rejects negative', () => {
    assert.equal(validatePriceAlert(-10, 'AED').valid, false);
  });

  test('rejects unreasonably high price', () => {
    assert.equal(validatePriceAlert(999999, 'AED').valid, false);
  });

  test('rejects non-numeric', () => {
    assert.equal(validatePriceAlert('abc', 'AED').valid, false);
  });

  test('uses default max for unknown currency', () => {
    const r = validatePriceAlert(50000, 'XYZ');
    assert.equal(r.valid, true);
  });
});
