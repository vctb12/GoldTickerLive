/**
 * components/nav/helpers.js - Navigation helper functions
 * Extracts URL resolution and matching logic from nav.js
 */

/**
 * Resolve href depth: strip leading `../` then prepend the correct number
 * of `../` segments for the page's actual depth from the site root.
 */
export function resolveHref(href, depth) {
  if (typeof href !== 'string' || href === '') return '#';

  // Full URLs and non-http schemes pass through untouched
  if (
    href.startsWith('/') ||
    href.startsWith('//') ||
    href.startsWith('#') ||
    href.startsWith('?') ||
    /^[a-z][a-z0-9+.-]*:/i.test(href)
  ) {
    return href;
  }

  const d = Math.max(0, Number.isFinite(depth) ? Math.floor(depth) : 0);

  if (href.startsWith('./')) {
    const stripped = href.replace(/^\.\//, '');
    return d === 0 ? stripped : '../'.repeat(d) + stripped;
  }

  const stripped = href.replace(/^\.\.\//, '');
  return d === 0 ? stripped : '../'.repeat(d) + stripped;
}

/**
 * Return true if the given href's base path matches the current page URL.
 */
export function isPageMatch(href) {
  if (typeof href !== 'string' || href === '') return false;
  if (href.startsWith('#') || href.startsWith('?')) return false;
  if (href.startsWith('//') || /^[a-z][a-z0-9+.-]*:\/\//i.test(href)) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;

  const loc = location.pathname || '/';
  const base = href.split('#')[0].split('?')[0];
  if (!base) return false;

  let norm = base.replace(/^\.\.\//, '').replace(/^\.\//, '');
  if (!norm.startsWith('/')) norm = '/' + norm;

  const cmp = norm.replace(/\/index\.html$/, '/');

  if (cmp === '/') return loc === '/' || loc === '/index.html';
  if (loc === cmp) return true;

  if (cmp.endsWith('/') && loc.startsWith(cmp)) return true;

  return false;
}

/**
 * True if any item in the group matches the current page.
 */
export function groupIsActive(items) {
  return items.some((item) => isPageMatch(item.href));
}

/**
 * Escape a string for safe inclusion in HTML.
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
