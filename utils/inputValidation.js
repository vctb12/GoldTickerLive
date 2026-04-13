/**
 * utils/inputValidation.js
 * Shared input validation and sanitization utilities.
 * Used by order form, admin panel, and any user-facing input.
 */

/**
 * UAE phone number format: +971 XX XXX XXXX, 00971..., or 05X...
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidUAEPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // +971 5X XXX XXXX (13 chars), 00971 5X XXX XXXX (14 chars), 05X XXX XXXX (10 chars)
  return /^(\+971\d{9}|00971\d{9}|05\d{8})$/.test(cleaned);
}

/**
 * RFC-compliant email validation (simplified but effective).
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Validate a numeric input within a range.
 * @param {*} value
 * @param {number} min
 * @param {number} max
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateNumericRange(value, min, max) {
  const num = Number(value);
  if (isNaN(num)) return { valid: false, error: 'Value must be a number' };
  if (num < min) return { valid: false, error: `Value must be at least ${min}` };
  if (num > max) return { valid: false, error: `Value must be at most ${max}` };
  return { valid: true, value: num };
}

/**
 * Sanitize a string for safe display (prevent XSS in text content).
 * @param {string} str
 * @returns {string}
 */
export function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize a string for safe use in a URL parameter.
 * @param {string} str
 * @returns {string}
 */
export function sanitizeURLParam(str) {
  if (!str || typeof str !== 'string') return '';
  return encodeURIComponent(str.trim());
}

/**
 * Validate and sanitize a price alert threshold.
 * @param {*} price
 * @param {string} currency
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validatePriceAlert(price, currency) {
  const num = Number(price);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'Price must be a positive number' };
  }
  // Sanity check: gold price per gram shouldn't exceed reasonable bounds
  const MAX_PRICE_PER_GRAM = {
    USD: 500, AED: 2000, SAR: 2000, KWD: 200, QAR: 2000,
    BHD: 200, OMR: 200, EGP: 30000, INR: 50000,
  };
  const maxPrice = MAX_PRICE_PER_GRAM[currency] || 100000;
  if (num > maxPrice) {
    return { valid: false, error: `Price seems too high for ${currency}` };
  }
  return { valid: true, value: num };
}
