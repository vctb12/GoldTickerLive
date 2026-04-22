/**
 * assets/analytics.js — External analytics loader.
 *
 * Consolidates the Google Tag (GA4) loader + init and the Microsoft
 * Clarity loader into a single external script so that the site's
 * Content-Security-Policy can drop `'unsafe-inline'` from `script-src`.
 *
 * Loaded with `defer` from every public HTML page via the codemod at
 * `scripts/node/externalize-analytics.js`.
 */

(function () {
  'use strict';

  // Respect Do-Not-Track and local opt-out stored under 'gp_no_analytics'.
  try {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    if (localStorage.getItem('gp_no_analytics') === '1') return;
  } catch (_e) {
    // localStorage may be unavailable in sandboxed contexts; continue.
  }

  // ── Google Analytics 4 (gtag.js) ─────────────────────────────────────────
  const GA_ID = 'G-K3GNY9M8TE';
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });

  // Inject the gtag loader if it isn't already present.
  try {
    const gaSrc = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    const exists = Array.prototype.some.call(document.getElementsByTagName('script'), function (s) {
      return s.src && s.src.indexOf('googletagmanager.com/gtag/js') !== -1;
    });
    if (!exists) {
      const s = document.createElement('script');
      s.async = true;
      s.src = gaSrc;
      document.head.appendChild(s);
    }
  } catch (_e) {
    // non-fatal
  }

  // ── Microsoft Clarity ────────────────────────────────────────────────────
  (function (c, l, a, r, i) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    const t = l.createElement(r);
    t.async = 1;
    t.src = 'https://www.clarity.ms/tag/' + i;
    const y = l.getElementsByTagName(r)[0];
    if (y && y.parentNode) y.parentNode.insertBefore(t, y);
    else l.head.appendChild(t);
  })(window, document, 'clarity', 'script', 'w4e0nhdxt5');
})();
