/**
 * server/lib/admin/validation.js - Extract validation helpers from admin routes
 * Reduces complexity by separating input validation logic
 */

/**
 * Sanitise a string: trim, collapse whitespace, limit length.
 * Returns undefined for non-string values.
 */
function sanitizeString(val, maxLen = 500) {
  if (val === undefined || val === null) return undefined;
  if (typeof val !== 'string') return undefined;
  const cleaned = val.trim().replace(/\s+/g, ' ').slice(0, maxLen);
  return cleaned || undefined;
}

/**
 * Validate integer query param (returns parsed int or default).
 */
function parseIntParam(val, defaultVal, min = 1, max = 1000) {
  if (val === undefined || val === null) return defaultVal;
  const n = parseInt(val, 10);
  if (isNaN(n) || n < min) return defaultVal;
  return Math.min(n, max);
}

/**
 * Validate shop data fields.
 * Returns sanitised object or throws ValidationError.
 */
function validateShopInput(body) {
  const cleaned = {};
  const stringFields = [
    'name',
    'city',
    'country',
    'phone',
    'email',
    'website',
    'address',
    'hours',
    'type',
    'status',
    'description',
  ];
  const booleanFields = ['verified', 'featured'];
  const numberFields = ['latitude', 'longitude'];

  for (const field of stringFields) {
    if (body[field] !== undefined) {
      const val = sanitizeString(body[field]);
      if (val !== undefined) cleaned[field] = val;
    }
  }

  for (const field of booleanFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] === 'boolean') {
        cleaned[field] = body[field];
      } else if (body[field] === 'true' || body[field] === 'false') {
        cleaned[field] = body[field] === 'true';
      }
    }
  }

  for (const field of numberFields) {
    if (body[field] !== undefined) {
      const num = Number(body[field]);
      if (!isNaN(num) && isFinite(num)) {
        cleaned[field] = num;
      }
    }
  }

  return cleaned;
}

/**
 * Validate user creation/update input
 */
function validateUserInput(body) {
  const cleaned = {};

  if (body.email !== undefined) {
    cleaned.email = sanitizeString(body.email, 254);
  }

  if (body.name !== undefined) {
    cleaned.name = sanitizeString(body.name, 200);
  }

  if (body.role !== undefined) {
    const allowedRoles = ['viewer', 'editor', 'admin'];
    const role = sanitizeString(body.role, 20);
    if (!allowedRoles.includes(role)) {
      throw new Error(`Role must be one of: ${allowedRoles.join(', ')}`);
    }
    cleaned.role = role;
  }

  if (body.password !== undefined) {
    if (typeof body.password !== 'string' || body.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    cleaned.password = body.password;
  }

  return cleaned;
}

module.exports = {
  sanitizeString,
  parseIntParam,
  validateShopInput,
  validateUserInput,
};
