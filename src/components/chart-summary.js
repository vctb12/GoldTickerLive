/**
 * components/chart-summary.js — accessible series summary for canvas charts.
 *
 * A Lightweight Charts canvas is invisible to assistive technology: the page
 * wrapper may carry an aria-label (tracker's `.tracker-chart-wrap` does), but
 * the DATA the chart shows has no text equivalent. This module derives a
 * deterministic summary from the EXACT series array the chart renders (same
 * points, same values — no separate calculation path) and maintains it as a
 * visually-hidden `.sr-only` paragraph inside the chart container, so screen
 * readers can browse what the chart shows: period, points, direction, change,
 * high, low.
 *
 * Deliberately NOT a live region — chart data refreshes on a timer and a
 * `role="status"` here would spam announcements. It also does not add
 * `role="img"`/`aria-label` to the container: the chart area contains
 * interactive content (scroll/scale surface, attribution link) that an image
 * role would hide, and the tracker already labels its wrapper.
 *
 * Numbers/dates go through the shared formatter conventions (`formatNumber`,
 * ar-AE/en-AE dates) and all strings live in `translations.js`. Nothing is
 * invented: an empty/short series produces the explicit "no data" sentence,
 * never placeholder values. `computeSeriesSummary` is pure and unit-testable
 * without a DOM.
 */

import { TRANSLATIONS } from '../config/translations.js';
import { translate } from '../lib/i18n.js';
import { formatNumber } from '../lib/formatter.js';

/**
 * Convert a Lightweight-Charts time value ('YYYY-MM-DD' string or unix
 * seconds) to a Date, or null when unparseable.
 * @param {string|number} time
 * @returns {Date|null}
 */
function timeToDate(time) {
  const date =
    typeof time === 'string' ? new Date(`${time}T00:00:00Z`) : new Date(Number(time) * 1000);
  return Number.isFinite(date.getTime()) ? date : null;
}

/**
 * Derive summary statistics from a rendered chart series.
 * Pure: no DOM, no locale — formatting happens separately.
 *
 * @param {Array<{ time: string|number, value: number }>} points
 *   The series in Lightweight Charts format, ascending by time (the same
 *   array handed to `series.setData()`).
 * @returns {{
 *   points: number,
 *   firstValue: number, lastValue: number,
 *   change: number, pctChange: number,
 *   high: number, low: number,
 *   firstDate: Date, lastDate: Date,
 * } | null}  null when fewer than 2 valid points exist.
 */
export function computeSeriesSummary(points) {
  if (!Array.isArray(points)) return null;
  const valid = points.filter(
    (p) => p && Number.isFinite(Number(p.value)) && Number(p.value) > 0 && timeToDate(p.time)
  );
  if (valid.length < 2) return null;

  const first = valid[0];
  const last = valid[valid.length - 1];
  let high = -Infinity;
  let low = Infinity;
  for (const p of valid) {
    const v = Number(p.value);
    if (v > high) high = v;
    if (v < low) low = v;
  }
  const firstValue = Number(first.value);
  const lastValue = Number(last.value);
  const change = lastValue - firstValue;
  const pctChange = firstValue !== 0 ? (change / firstValue) * 100 : 0;

  return {
    points: valid.length,
    firstValue,
    lastValue,
    change,
    pctChange,
    high,
    low,
    firstDate: timeToDate(first.time),
    lastDate: timeToDate(last.time),
    // Numeric (unix-second) endpoints mean an intraday series: its dates must
    // be formatted in local time to match what the chart axis displays.
    // 'YYYY-MM-DD' business-day strings stay UTC-pinned.
    intraday: typeof first.time === 'number' || typeof last.time === 'number',
  };
}

/** Mirrors the formatter.js timestamp convention (ar-AE / en-AE). */
function localeFor(lang) {
  return lang === 'ar' ? 'ar-AE' : 'en-AE';
}

function formatSummaryDate(date, lang, intraday = false) {
  try {
    return date.toLocaleDateString(localeFor(lang), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      // Business-day ('YYYY-MM-DD') points are calendar dates — pin to UTC so
      // the label can't shift a day in western timezones. Intraday points are
      // real instants — format in local time so the summary matches the dates
      // the chart's time axis shows the user.
      ...(intraday ? {} : { timeZone: 'UTC' }),
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

const NUM_2DP = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

/**
 * Build the full localized summary sentence for a computed series summary.
 *
 * @param {ReturnType<typeof computeSeriesSummary>} summary
 * @param {'en'|'ar'} lang
 * @param {{ unitKey?: string|null }} [opts]
 *   `unitKey` — translation key of a trailing unit-disclosure sentence (e.g.
 *   'chart.summary.unitUsdOz'). Pass null/omit for series whose unit is not
 *   known to this module (custom-injected data) so the summary never claims a
 *   unit it cannot verify.
 * @returns {string}
 */
export function formatChartSummaryText(summary, lang = 'en', opts = {}) {
  if (!summary) return translate(TRANSLATIONS, lang, 'chart.summary.noData');
  const vars = {
    from: formatSummaryDate(summary.firstDate, lang, summary.intraday),
    to: formatSummaryDate(summary.lastDate, lang, summary.intraday),
    points: formatNumber(summary.points, lang),
    change: formatNumber(Math.abs(summary.change), lang, NUM_2DP),
    pct: formatNumber(Math.abs(summary.pctChange), lang, NUM_2DP),
    latest: formatNumber(summary.lastValue, lang, NUM_2DP),
    high: formatNumber(summary.high, lang, NUM_2DP),
    low: formatNumber(summary.low, lang, NUM_2DP),
  };
  // A change that displays as 0.00 must not be announced as movement.
  const isFlat = Math.abs(summary.change) < 0.005;
  let body;
  if (isFlat) {
    body = translate(TRANSLATIONS, lang, 'chart.summary.textFlat', { vars });
  } else {
    vars.direction =
      summary.change > 0
        ? translate(TRANSLATIONS, lang, 'chart.summary.up')
        : translate(TRANSLATIONS, lang, 'chart.summary.down');
    body = translate(TRANSLATIONS, lang, 'chart.summary.text', { vars });
  }
  return opts.unitKey ? `${body} ${translate(TRANSLATIONS, lang, opts.unitKey)}` : body;
}

/**
 * Create/refresh the visually-hidden summary paragraph inside a chart
 * container. Idempotent — safe to call on every render. Text-only DOM writes.
 *
 * @param {HTMLElement|null} container  The chart mount node.
 * @param {Array<{ time: string|number, value: number }>|null} points
 *   The exact series rendered, or null/empty when the chart has no data.
 * @param {'en'|'ar'} lang
 * @param {{ unitKey?: string|null }} [opts]  See formatChartSummaryText().
 */
export function updateChartSummary(container, points, lang = 'en', opts = {}) {
  if (!container) return;
  let srNode = container.querySelector(':scope > .chart-sr-summary');
  if (!srNode) {
    srNode = (container.ownerDocument || document).createElement('p');
    srNode.className = 'sr-only chart-sr-summary';
    container.appendChild(srNode);
  }
  srNode.textContent = formatChartSummaryText(computeSeriesSummary(points), lang, opts);
  srNode.setAttribute('lang', lang);
  srNode.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}
