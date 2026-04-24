/**
 * server/lib/site-url.js
 *
 * Validates and normalises the `SITE_URL` environment variable used to build
 * outbound redirect URLs (Stripe checkout success/cancel, newsletter verify
 * links, etc.).
 *
 * Why this exists:
 *   Interpolating `process.env.SITE_URL` straight into a `success_url` or a
 *   verification link is a classic foot-gun. If the variable is unset the
 *   URL becomes `undefined/pricing`; if a future refactor falls back to
 *   `req.headers.host` it becomes a host-header open-redirect vector. Both
 *   failure modes are load-bearing trust problems for a paid-subscription
 *   flow or an email verification link, so we centralise the check.
 *
 * Contract:
 *   - In production, SITE_URL must be set to an https:// URL whose origin is
 *     on the ALLOWED_ORIGINS list. A bad value logs a warning and falls back
 *     to the canonical apex (goldtickerlive.com) rather than silently
 *     producing a broken URL.
 *   - In development, SITE_URL defaults to http://localhost:3000 when unset.
 *   - `buildUrl(path)` returns a real `URL` object, so downstream callers get
 *     a WHATWG-validated, correctly-encoded string rather than template-
 *     literal concatenation.
 */

'use strict';

const CANONICAL_ORIGIN = 'https://goldtickerlive.com';

// Keep this list short and explicit. Add staging here when staging exists.
const ALLOWED_ORIGINS = Object.freeze([
  'https://goldtickerlive.com',
  'https://www.goldtickerlive.com', // tolerated for redirects; canonical still apex
]);

const IS_PROD = process.env.NODE_ENV === 'production';

function normaliseOrigin(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    // Strip trailing slash, query, hash — we only want the origin.
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

function resolveSiteOrigin() {
  const raw = process.env.SITE_URL;
  const normalised = normaliseOrigin(raw);

  if (IS_PROD) {
    if (!normalised) {
      console.warn(
        '[site-url] SITE_URL is missing or malformed in production; ' +
          `falling back to ${CANONICAL_ORIGIN}.`
      );
      return CANONICAL_ORIGIN;
    }
    if (!ALLOWED_ORIGINS.includes(normalised)) {
      console.warn(
        `[site-url] SITE_URL origin "${normalised}" is not in the allow-list; ` +
          `falling back to ${CANONICAL_ORIGIN}.`
      );
      return CANONICAL_ORIGIN;
    }
    return normalised;
  }

  // Development / test: permissive but still validated.
  return normalised || 'http://localhost:3000';
}

/**
 * Build an absolute URL against the resolved site origin.
 * @param {string} pathname - path with leading slash, may include query/hash
 * @returns {string} absolute URL string
 */
function buildUrl(pathname) {
  const origin = resolveSiteOrigin();
  // `new URL(pathname, origin)` gives us WHATWG-correct joining (handles
  // missing leading slash, percent-encoding, etc.) without us having to
  // hand-roll concatenation.
  return new URL(pathname || '/', origin).toString();
}

module.exports = {
  CANONICAL_ORIGIN,
  ALLOWED_ORIGINS,
  resolveSiteOrigin,
  buildUrl,
  // Exported for tests only.
  __normaliseOriginForTests: normaliseOrigin,
};
