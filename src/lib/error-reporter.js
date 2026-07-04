/**
 * src/lib/error-reporter.js — site-wide runtime error reporting.
 *
 * Installs `error` and `unhandledrejection` listeners on `window` and
 * forwards a redacted, rate-limited signal to the governed analytics
 * `error` event (schema `{ type, where }` in src/lib/analytics.js).
 *
 * Safety guarantees:
 *   - No message text, stack traces, query strings, or user data are sent —
 *     only a coarse error type plus a script-path/line bucket.
 *   - Deduplicated and capped per page load so an error loop cannot flood
 *     GA4 with events.
 *   - Idempotent: calling installErrorReporter() twice is a no-op.
 *   - Never throws; all reporting failures are swallowed.
 *   - Resource-load failures (broken <img>/<script>) do not bubble to
 *     window-level `error` listeners, so they are excluded by design.
 */

import { track, EVENTS } from './analytics.js';
import { SITE } from '../config/site.js';

const MAX_REPORTS_PER_PAGE = 5;

let installed = false;
let reported = 0;
let seen = new Set();

/**
 * Reduce an error source to a short, PII-free bucket like
 * `"/src/pages/tracker-pro.js:42"`. Cross-origin or unknown sources
 * collapse to the current page path.
 * @param {string|undefined} filename
 * @param {number|undefined} lineno
 * @returns {string}
 */
export function sourceBucket(filename, lineno) {
  let path = '';
  if (typeof filename === 'string' && filename) {
    try {
      path = new URL(filename, SITE.url).pathname;
    } catch {
      path = '';
    }
  }
  if (!path) {
    try {
      path = typeof location !== 'undefined' ? location.pathname : 'unknown';
    } catch {
      path = 'unknown';
    }
  }
  const line = Number.isFinite(lineno) && lineno > 0 ? `:${lineno}` : '';
  // Keep the bucket short — GA4 param values are limited to 100 chars.
  return `${path}${line}`.slice(0, 100);
}

function report(type, where) {
  if (reported >= MAX_REPORTS_PER_PAGE) return;
  const key = `${type}|${where}`;
  if (seen.has(key)) return;
  seen.add(key);
  reported += 1;
  try {
    track(EVENTS.ERROR, { type, where });
  } catch {
    // Reporting must never break the page.
  }
}

/**
 * Install the global error listeners. Safe to call from any page bootstrap;
 * repeat calls are no-ops.
 * @param {Window} [win]  Injectable for tests; defaults to the real window.
 * @returns {boolean}  true if listeners were installed by this call.
 */
export function installErrorReporter(win) {
  const target = win || (typeof window !== 'undefined' ? window : undefined);
  if (!target || typeof target.addEventListener !== 'function' || installed) return false;
  installed = true;

  target.addEventListener('error', (event) => {
    // Resource errors target the failing element, not window; ignore them.
    if (event && event.target && event.target !== target && !event.error) return;
    report('uncaught', sourceBucket(event?.filename, event?.lineno));
  });

  target.addEventListener('unhandledrejection', () => {
    // Rejection reasons can embed user data in messages — send location only.
    report('unhandledrejection', sourceBucket(undefined, undefined));
  });

  return true;
}

/** Test-only: reset module state so install/dedupe logic can be re-exercised. */
export function _resetForTests() {
  installed = false;
  reported = 0;
  seen = new Set();
}
