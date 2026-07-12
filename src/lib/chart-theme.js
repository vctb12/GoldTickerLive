/**
 * chart-theme.js — shared, container-scoped chart theme reader.
 *
 * Charts must resolve their colors from the CSS context they actually render
 * in, not from the document root. The tracker's chart terminal
 * (`.tracker-chart-wrap`) is styled always-dark in BOTH site themes, so a
 * root-scoped read hands a light-theme palette (dark-brown text, parchment
 * grid) to a chart sitting on a near-black panel. Resolving the same token
 * names via `getComputedStyle(container)` lets each container decide:
 *
 *   - the tracker panel pins dark-legible values on the container
 *     (styles/pages/tracker-pro.css `.tracker-chart-wrap`), invariant across
 *     site themes because the panel itself never changes;
 *   - normally themed sections (e.g. the home chart) declare nothing, so the
 *     container inherits the root tokens and follows the site theme exactly
 *     as before.
 *
 * Consumed by src/components/chart.js (Lightweight Charts canvas) and
 * src/tracker/chart.js (SVG first-paint fallback) so both paint the exact
 * same palette for a given container.
 */

/**
 * Resolve the chart color set from a container element's computed style.
 *
 * @param {Element|null|undefined} containerEl  the element the chart renders
 *   inside (chart wrap/container). Falls back to the document root when
 *   omitted so callers without a container keep today's behavior.
 * @returns {{ text: string, grid: string, border: string, line: string,
 *   areaTop: string, areaBottom: string, fontFamily: string }}
 */
export function readChartTheme(containerEl) {
  const target = containerEl && containerEl.nodeType === 1 ? containerEl : document.documentElement;
  const styles = window.getComputedStyle(target);
  const pick = (token, fallback) => styles.getPropertyValue(token).trim() || fallback;
  return {
    text: pick('--text-secondary', '#6a6050'),
    grid: pick('--border-subtle', 'rgba(230,224,208,0.5)'),
    border: pick('--border-default', 'rgba(230,224,208,0.8)'),
    line: pick('--color-gold', '#c4902e'),
    areaTop: pick('--color-gold-glow', 'rgba(196,144,46,0.22)'),
    areaBottom: 'rgba(196,144,46,0.02)',
    fontFamily: pick('--font-main', "'Source Sans 3', system-ui, sans-serif"),
  };
}
