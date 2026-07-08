/**
 * pwa/manifest-audit.js — pure web-app-manifest installability auditor (Phase 42).
 *
 * Given a parsed manifest object, report whether it satisfies the baseline installability criteria
 * (the Chromium/Android + iOS add-to-home-screen requirements) and which recommended fields are
 * missing. No I/O, no DOM — just validation, so it can run in CI against the committed `manifest.json`
 * and against any candidate manifest. It never mutates the input.
 *
 * `errors` block installability; `warnings` are recommended-but-optional hardening.
 */

const INSTALLABLE_DISPLAYS = new Set(['standalone', 'fullscreen', 'minimal-ui']);

/** Largest square icon edge (px) declared for a given purpose, 0 if none. `any`-sized icons count. */
function maxIconEdge(icons, purpose) {
  let max = 0;
  for (const icon of icons) {
    const purposes = String(icon.purpose || 'any').split(/\s+/);
    if (purpose && !purposes.includes(purpose)) continue;
    for (const token of String(icon.sizes || '').split(/\s+/)) {
      if (token === 'any') {
        max = Math.max(max, Infinity);
        continue;
      }
      const edge = Number(token.split('x')[0]);
      if (Number.isFinite(edge)) max = Math.max(max, edge);
    }
  }
  return max;
}

/**
 * Audit a manifest object for installability.
 * @param {object} manifest
 * @returns {{ installable: boolean, errors: string[], warnings: string[] }}
 */
export function auditManifest(manifest) {
  const errors = [];
  const warnings = [];
  const m = manifest || {};
  const icons = Array.isArray(m.icons) ? m.icons : [];

  // ── Hard requirements ──────────────────────────────────────────────────────
  if (!m.name && !m.short_name) errors.push('missing name and short_name');
  if (!m.start_url) errors.push('missing start_url');
  if (!INSTALLABLE_DISPLAYS.has(m.display)) {
    errors.push(`display must be one of ${[...INSTALLABLE_DISPLAYS].join(', ')}`);
  }
  const anyEdge = maxIconEdge(icons, null);
  if (anyEdge < 192) errors.push('needs an icon of at least 192px');
  if (anyEdge < 512) errors.push('needs an icon of at least 512px');

  // ── Recommended hardening ──────────────────────────────────────────────────
  if (maxIconEdge(icons, 'maskable') < 192) warnings.push('add a maskable icon (>=192px)');
  if (!m.theme_color) warnings.push('add theme_color');
  if (!m.background_color) warnings.push('add background_color');
  if (!m.id) warnings.push('add id for a stable app identity');
  if (!m.short_name) warnings.push('add short_name for the home-screen label');
  if (!Array.isArray(m.screenshots) || m.screenshots.length === 0) {
    warnings.push('add screenshots for a richer install dialog');
  }
  if (!Array.isArray(m.categories) || m.categories.length === 0) warnings.push('add categories');

  return { installable: errors.length === 0, errors, warnings };
}
