/**
 * lib/datasource-health-dashboard.js — read-only data-source health view model (Phase 48).
 *
 * Turns the per-provider health snapshots (from `ProviderHealthMonitor.getSnapshot`) and the current
 * freshness state into a bilingual, display-ready model for an operator/observability panel. It is
 * PURE (no DOM, no fetch) and **defensively forward-compatible**: it reads each diagnostics field with
 * a fallback, so it works against both the pre-Phase-47 snapshot shape and the richer Phase-47 one
 * (timeoutCount / rateLimitedCount / consecutiveSuccesses / failureCount).
 *
 * The panel is gated behind `FEATURE_FLAGS.DATASOURCE_HEALTH_DASHBOARD_ENABLED` (OFF by default). It
 * shows NO user-facing price and touches none of the pricing math — it's a diagnostics surface only.
 */

import { isFeatureEnabled } from '../config/feature-flags.js';

const STATUS = {
  healthy: { key: 'healthy', en: 'Healthy', ar: 'سليم' },
  unhealthy: { key: 'unhealthy', en: 'Degraded', ar: 'متدهور' },
};

const DISCLAIMER = {
  en: 'Operational diagnostics only — provider health and latency, not a price or an investment signal.',
  ar: 'تشخيصات تشغيلية فقط — صحة المزوّد والكمون، وليست سعرًا ولا إشارة استثمارية.',
};

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

/** Whether the diagnostics panel should render at all. */
export function isDashboardEnabled() {
  return isFeatureEnabled('DATASOURCE_HEALTH_DASHBOARD_ENABLED');
}

function num(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function pct(rate) {
  // successRate is a 0..1 fraction; render as an integer percent.
  return Math.round(num(rate, 1) * 100);
}

/** Map one health snapshot into a display row (defensive against missing fields). */
function toRow(snapshot, lang) {
  const s = snapshot || {};
  const healthy = s.healthy !== false; // default optimistic if unknown
  const status = healthy ? STATUS.healthy : STATUS.unhealthy;
  return {
    providerId: s.providerId || 'unknown',
    healthy,
    statusKey: status.key,
    statusLabel: status[lang],
    attempts: num(s.attempts),
    successRatePct: pct(s.successRate),
    medianLatencyMs: num(s.medianLatencyMs),
    p95LatencyMs: num(s.p95LatencyMs),
    // Phase-47 diagnostics — default to 0 when running against an older snapshot shape.
    failureCount: num(s.failureCount),
    timeoutCount: num(s.timeoutCount),
    rateLimitedCount: num(s.rateLimitedCount),
    consecutiveFailures: num(s.consecutiveFailures),
    consecutiveSuccesses: num(s.consecutiveSuccesses),
    lastSuccessAt: s.lastSuccessAt ?? null,
    lastFailureAt: s.lastFailureAt ?? null,
  };
}

/**
 * Build the dashboard view model.
 *
 * @param {object} input
 * @param {Array<object>} input.providers  Health snapshots (getSnapshot results).
 * @param {{ state?: string }} [input.freshness]  Current freshness result.
 * @param {string} [input.activeProviderId]
 * @param {{ lang?: 'en'|'ar' }} [options]
 * @returns {{
 *   enabled: boolean, rows: object[], overall: object, freshness: object, disclaimer: string
 * }}
 */
export function buildDatasourceHealthModel(input = {}, options = {}) {
  const lang = pickLang(options.lang);
  const providers = Array.isArray(input.providers) ? input.providers : [];
  const rows = providers.map((snap) => toRow(snap, lang));

  return {
    enabled: isDashboardEnabled(),
    rows,
    overall: {
      providerCount: rows.length,
      allHealthy: rows.length > 0 && rows.every((r) => r.healthy),
      anyDegraded: rows.some((r) => !r.healthy),
      activeProviderId: input.activeProviderId || null,
    },
    freshness: {
      state: input.freshness?.state || 'unknown',
    },
    disclaimer: DISCLAIMER[lang],
  };
}

/**
 * Minimal, safe HTML for the panel (no user input interpolated — provider ids are internal). The
 * caller only mounts this when {@link isDashboardEnabled} is true.
 */
export function renderDatasourceHealthDashboard(model) {
  if (!model || !model.enabled) return '';
  const rows = model.rows
    .map(
      (r) => `<tr data-health="${r.statusKey}">
      <td>${escapeText(r.providerId)}</td>
      <td>${escapeText(r.statusLabel)}</td>
      <td>${r.successRatePct}%</td>
      <td>${r.medianLatencyMs}/${r.p95LatencyMs} ms</td>
      <td>${r.timeoutCount} / ${r.rateLimitedCount}</td>
    </tr>`
    )
    .join('');
  return `<section class="datasource-health" aria-label="Data source health">
    <table><thead><tr><th>Provider</th><th>Status</th><th>Success</th><th>Latency p50/p95</th><th>Timeouts/429</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p class="datasource-health__note">${escapeText(model.disclaimer)}</p>
  </section>`;
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
