/**
 * UAE Historical Karat Chart — multi-series homepage component.
 *
 * Renders four karat series (24K/22K/21K/18K) in AED/gram using lightweight-charts.
 * Supports line/area modes, range controls, legend toggles, summary strip, and table.
 */

import { readChartTheme } from '../lib/chart-theme.js';
import { TRANSLATIONS } from '../config/translations-runtime.js';
import { translate } from '../lib/i18n.js';
import { formatDate } from '../lib/formatter.js';
import { clear, el, setText } from '../lib/safe-dom.js';
import {
  UAE_HISTORY_KARATS,
  UAE_HISTORY_RANGES,
  filterUaeHistoryByRange,
  computeUaeHistorySummary,
  computeCoverageMeta,
  describeRangeResolution,
  classifyCoverageFreshness,
  toChartSeriesData,
  toTableRows,
  buildChartSrSummary,
  loadUaeKaratHistory,
  formatAedPerGramWithUnit,
  findPointByDate,
} from '../lib/uae-historical-karat-data.js';

/** Series line styles for non-color differentiation. */
const SERIES_LINE_STYLES = Object.freeze({
  24: 0, // solid
  22: 2, // dashed
  21: 1, // dotted
  18: 3, // large dashed
});

/** Legend swatch shape classes per karat. */
const SERIES_SHAPE_CLASS = Object.freeze({
  24: 'uae-hist-chart__legend-swatch--circle',
  22: 'uae-hist-chart__legend-swatch--square',
  21: 'uae-hist-chart__legend-swatch--diamond',
  18: 'uae-hist-chart__legend-swatch--triangle',
});

const DEFAULT_RANGE = '6M';
const DEFAULT_MODE = 'line';
const TABLE_INITIAL_ROWS = 20;
const CHART_HEIGHT = 360;

function t(lang, key, vars) {
  return translate(TRANSLATIONS, lang, key, vars ? { vars } : {});
}

function formatHistoryDate(dateKey, lang) {
  if (!dateKey) return '—';
  return formatDate(`${dateKey}T00:00:00Z`, lang);
}

function readSeriesColors(container) {
  const styles = window.getComputedStyle(container);
  const pick = (token, fallback) => styles.getPropertyValue(token).trim() || fallback;
  return {
    24: {
      line: pick('--uae-hist-series-24', '#a855f7'),
      areaTop: pick('--uae-hist-series-24-area-top', 'rgba(168, 85, 247, 0.25)'),
      areaBottom: pick('--uae-hist-series-24-area-bottom', 'rgba(168, 85, 247, 0.02)'),
    },
    22: {
      line: pick('--uae-hist-series-22', '#10b981'),
      areaTop: pick('--uae-hist-series-22-area-top', 'rgba(16, 185, 129, 0.22)'),
      areaBottom: pick('--uae-hist-series-22-area-bottom', 'rgba(16, 185, 129, 0.02)'),
    },
    21: {
      line: pick('--uae-hist-series-21', '#ef4444'),
      areaTop: pick('--uae-hist-series-21-area-top', 'rgba(239, 68, 68, 0.2)'),
      areaBottom: pick('--uae-hist-series-21-area-bottom', 'rgba(239, 68, 68, 0.02)'),
    },
    18: {
      line: pick('--uae-hist-series-18', '#3b82f6'),
      areaTop: pick('--uae-hist-series-18-area-top', 'rgba(59, 130, 246, 0.2)'),
      areaBottom: pick('--uae-hist-series-18-area-bottom', 'rgba(59, 130, 246, 0.02)'),
    },
  };
}

export class UaeHistoricalKaratChart {
  /**
   * @param {object} options
   * @param {string} options.rootId - Root mount element id
   * @param {string} [options.lang='en']
   * @param {(event: string, payload?: object) => void} [options.onAnalytics]
   */
  constructor({ rootId, lang = 'en', onAnalytics } = {}) {
    this.rootId = rootId;
    this.lang = lang;
    this.onAnalytics = onAnalytics || (() => {});
    this.range = DEFAULT_RANGE;
    this.mode = DEFAULT_MODE;
    this.visibleKarats = new Set(UAE_HISTORY_KARATS);
    this.allPoints = [];
    this.filteredPoints = [];
    this.coverage = null;
    this.rangeCoverage = null;
    this.rangeResolution = null;
    this.tableExpanded = false;
    this._chart = null;
    this._seriesMap = new Map();
    this._seriesColors = null;
    this._LW = null;
    this._ready = false;
    this._loading = true;
    this._error = null;
    this._shellReady = false;
    this._controlsBound = false;
    this._resizeObserver = null;
    this._themeObserver = null;
    this._crosshairUnsub = null;
    this._crosshairHandler = null;
    this._themeContainer = null;
    this._keyboardIndex = -1;
  }

  /** Mount UI shell and lazy-load data + chart library. */
  async init() {
    const root = document.getElementById(this.rootId);
    if (!root) return;

    if (!this._shellReady) {
      this._renderShell(root);
      this._bindControls(root);
      this._shellReady = true;
    }

    this._loading = true;
    this._error = null;
    this._renderState();

    try {
      const { points, coverage } = await loadUaeKaratHistory();
      this.allPoints = points;
      this.coverage = coverage;
      this._loading = false;

      if (!points.length) {
        this._error = 'no-data';
        this._renderState();
        return;
      }

      await this._loadChartLibrary();
      this._initChart();
      this._applyRange(this.range);
    } catch (err) {
      console.warn('[UaeHistoricalKaratChart] init failed:', err?.message);
      this._loading = false;
      this._error = 'load-error';
      this._renderState();
    }
  }

  _renderShell(root) {
    clear(root);
    root.className = 'uae-hist-chart';

    const badgeRow = el('div', { class: 'uae-hist-chart__badge-row' });
    const badge = el('span', { class: 'uae-hist-chart__badge', id: 'uae-hist-badge' });
    const freshnessBadge = el('span', {
      class: 'uae-hist-chart__freshness-badge',
      id: 'uae-hist-freshness-badge',
    });
    badgeRow.appendChild(badge);
    badgeRow.appendChild(freshnessBadge);

    const coverage = el('p', { class: 'uae-hist-chart__coverage', id: 'uae-hist-coverage' });
    const rangeSubtitle = el('p', {
      class: 'uae-hist-chart__range-subtitle',
      id: 'uae-hist-range-subtitle',
    });
    const source = el('p', { class: 'uae-hist-chart__source', id: 'uae-hist-source' });
    const summary = el('div', { class: 'uae-hist-chart__summary', id: 'uae-hist-summary', 'aria-live': 'polite' });
    const controls = el('div', { class: 'uae-hist-chart__controls' });
    const modeGroup = el('div', {
      class: 'uae-hist-chart__mode-group ds-segmented',
      role: 'group',
      id: 'uae-hist-mode-group',
    });
    const rangeGroup = el('div', {
      class: 'uae-hist-chart__range-group ds-segmented',
      role: 'group',
      id: 'uae-hist-range-group',
    });
    const chartWrap = el('div', { class: 'uae-hist-chart__canvas-wrap', id: 'uae-hist-canvas-wrap' });
    const chartContainer = el('div', {
      class: 'uae-hist-chart__canvas',
      id: 'uae-hist-canvas',
      role: 'img',
      tabindex: '0',
      'aria-labelledby': 'home-chart-title uae-hist-sr-summary',
    });
    const tooltip = el('div', {
      class: 'uae-hist-chart__tooltip',
      id: 'uae-hist-tooltip',
      role: 'status',
      'aria-live': 'polite',
      hidden: '',
    });
    const srSummary = el('p', { class: 'sr-only chart-sr-summary', id: 'uae-hist-sr-summary' });
    const legend = el('div', { class: 'uae-hist-chart__legend', id: 'uae-hist-legend', role: 'group' });
    const tableWrap = el('div', { class: 'uae-hist-chart__table-wrap', id: 'uae-hist-table-wrap' });
    const tableActions = el('div', { class: 'uae-hist-chart__table-actions', id: 'uae-hist-table-actions' });

    chartWrap.appendChild(chartContainer);
    chartWrap.appendChild(tooltip);
    chartWrap.appendChild(srSummary);
    controls.appendChild(rangeGroup);
    controls.appendChild(modeGroup);

    root.appendChild(badgeRow);
    root.appendChild(coverage);
    root.appendChild(rangeSubtitle);
    root.appendChild(controls);
    root.appendChild(summary);
    root.appendChild(chartWrap);
    root.appendChild(legend);
    root.appendChild(tableWrap);
    root.appendChild(tableActions);
    root.appendChild(source);

    this._populateRangeButtons(rangeGroup);
    this._populateModeButtons(modeGroup);
    this._populateLegend(legend);
    this._localizeShell({ badge });
  }

  _localizeShell({ badge }) {
    setText(badge, t(this.lang, 'home.uaeHist.badge'));
    const sourceEl = document.getElementById('uae-hist-source');
    if (sourceEl) setText(sourceEl, t(this.lang, 'home.uaeHist.sourceNote'));
  }

  _populateRangeButtons(group) {
    clear(group);
    const label = t(this.lang, 'home.uaeHist.rangeGroupLabel');
    group.setAttribute('aria-label', label);

    for (const key of Object.keys(UAE_HISTORY_RANGES)) {
      const btn = el('button', {
        type: 'button',
        class: `uae-hist-chart__range-btn ds-segmented__btn${key === this.range ? ' is-active' : ''}`,
        'data-range': key,
        'aria-pressed': key === this.range ? 'true' : 'false',
      });
      setText(btn, t(this.lang, `home.uaeHist.range${key}`));
      group.appendChild(btn);
    }
  }

  _populateModeButtons(group) {
    clear(group);
    const label = t(this.lang, 'home.uaeHist.modeGroupLabel');
    group.setAttribute('aria-label', label);

    for (const mode of ['line', 'area']) {
      const btn = el('button', {
        type: 'button',
        class: `uae-hist-chart__mode-btn ds-segmented__btn${mode === this.mode ? ' is-active' : ''}`,
        'data-mode': mode,
        'aria-pressed': mode === this.mode ? 'true' : 'false',
        title: t(this.lang, `home.uaeHist.mode${mode === 'line' ? 'Line' : 'Area'}`),
      });
      setText(btn, t(this.lang, `home.uaeHist.mode${mode === 'line' ? 'Line' : 'Area'}`));
      group.appendChild(btn);
    }
  }

  _populateLegend(legend) {
    clear(legend);
    const label = t(this.lang, 'home.uaeHist.legendLabel');
    legend.setAttribute('aria-label', label);

    for (const code of UAE_HISTORY_KARATS) {
      const visible = this.visibleKarats.has(code);
      const btn = el('button', {
        type: 'button',
        class: `uae-hist-chart__legend-btn${visible ? '' : ' is-muted'}`,
        'data-karat': code,
        'aria-pressed': visible ? 'true' : 'false',
      });
      const swatch = el('span', {
        class: `uae-hist-chart__legend-swatch ${SERIES_SHAPE_CLASS[code]}`,
        'data-karat': code,
        'aria-hidden': 'true',
      });
      const text = el('span', { class: 'uae-hist-chart__legend-label' });
      setText(text, t(this.lang, `home.uaeHist.karat${code}`));
      btn.appendChild(swatch);
      btn.appendChild(text);
      legend.appendChild(btn);
    }

    const showAll = el('button', {
      type: 'button',
      class: 'uae-hist-chart__legend-show-all',
      id: 'uae-hist-show-all',
    });
    setText(showAll, t(this.lang, 'home.uaeHist.showAllSeries'));
    legend.appendChild(showAll);
    this._applyLegendSwatchColors();
  }

  _applyLegendSwatchColors() {
    const wrap = document.getElementById('uae-hist-canvas-wrap');
    if (!wrap) return;
    const colors = readSeriesColors(wrap);
    document.querySelectorAll('.uae-hist-chart__legend-swatch').forEach((swatch) => {
      const code = swatch.dataset.karat;
      if (colors[code]) swatch.style.setProperty('--swatch-color', colors[code].line);
    });
  }

  _bindControls(root) {
    if (this._controlsBound) return;
    this._controlsBound = true;

    root.addEventListener('click', (e) => {
      const rangeBtn = e.target.closest('.uae-hist-chart__range-btn');
      if (rangeBtn) {
        const range = rangeBtn.dataset.range;
        if (range && range !== this.range) {
          this._applyRange(range);
          this.onAnalytics('uae_hist_range_change', { range });
        }
        return;
      }

      const modeBtn = e.target.closest('.uae-hist-chart__mode-btn');
      if (modeBtn) {
        const mode = modeBtn.dataset.mode;
        if (mode && mode !== this.mode) {
          this._applyMode(mode);
          this.onAnalytics('uae_hist_mode_change', { mode });
        }
        return;
      }

      const legendBtn = e.target.closest('.uae-hist-chart__legend-btn');
      if (legendBtn) {
        const code = legendBtn.dataset.karat;
        this._toggleSeries(code);
        this.onAnalytics('uae_hist_series_toggle', { karat: code });
        return;
      }

      if (e.target.closest('#uae-hist-show-all')) {
        this._showAllSeries();
        return;
      }

      if (e.target.closest('#uae-hist-table-more')) {
        this.tableExpanded = true;
        this._renderTable();
        this.onAnalytics('uae_hist_table_expand', {});
        return;
      }

      if (e.target.closest('#uae-hist-table-collapse')) {
        this.tableExpanded = false;
        this._renderTable();
        return;
      }

      if (e.target.closest('#uae-hist-export-csv')) {
        this._exportCsv();
        this.onAnalytics('export_click', { surface: 'home_uae_hist', export_type: 'csv' });
        return;
      }

      if (e.target.closest('#uae-hist-retry')) {
        this._retry();
      }
    });

    const canvas = () => document.getElementById('uae-hist-canvas');
    root.addEventListener('keydown', (e) => {
      const el_ = canvas();
      if (!el_ || document.activeElement !== el_ || !this.filteredPoints.length) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const delta = e.key === 'ArrowRight' ? 1 : -1;
        const max = this.filteredPoints.length - 1;
        this._keyboardIndex = Math.max(0, Math.min(max, (this._keyboardIndex < 0 ? max : this._keyboardIndex) + delta));
        this._showTooltipForPoint(this.filteredPoints[this._keyboardIndex]);
      } else if (e.key === 'Escape') {
        this._hideTooltip();
        this._keyboardIndex = -1;
      }
    });
  }

  async _retry() {
    this._destroyChart();
    this._error = null;
    this._loading = true;
    this._renderState();
    await this.init();
  }

  async _loadChartLibrary() {
    if (this._LW) return;
    const mod = await import('lightweight-charts');
    this._LW = mod;
  }

  _initChart() {
    const container = document.getElementById('uae-hist-canvas');
    if (!container || !this._LW) return;

    this._destroyChartInternals();

    clear(container);
    this._themeContainer = container.closest('.uae-hist-chart__canvas-wrap') || container;
    this._seriesColors = readSeriesColors(this._themeContainer);
    const theme = readChartTheme(this._themeContainer);

    this._chart = this._LW.createChart(container, {
      width: container.clientWidth || 600,
      height: CHART_HEIGHT,
      localization: { locale: this.lang === 'ar' ? 'ar-AE' : 'en-AE' },
      layout: {
        background: { color: 'transparent' },
        textColor: theme.text,
        fontFamily: theme.fontFamily,
      },
      grid: {
        vertLines: { color: theme.grid },
        horzLines: { color: theme.grid },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: theme.border,
        textColor: theme.text,
        minimumWidth: 72,
      },
      timeScale: {
        borderColor: theme.border,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      handleScroll: true,
      handleScale: true,
    });

    this._seriesMap.clear();
    for (const code of UAE_HISTORY_KARATS) {
      this._createSeries(code);
    }

    this._resizeObserver = new ResizeObserver(() => {
      if (this._chart && container.clientWidth > 0) {
        this._chart.resize(container.clientWidth, CHART_HEIGHT);
      }
    });
    this._resizeObserver.observe(container);

    this._themeObserver = new MutationObserver(() => {
      this._applyTheme();
      this._seriesColors = readSeriesColors(this._themeContainer);
      this._applyLegendSwatchColors();
      for (const code of UAE_HISTORY_KARATS) {
        this._createSeries(code);
      }
      this._updateChart();
    });
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    this._crosshairHandler = (param) => {
      if (!param?.time || !param.point) {
        this._hideTooltip();
        return;
      }
      const dateKey = typeof param.time === 'string' ? param.time : String(param.time);
      const point = findPointByDate(this.filteredPoints, dateKey);
      if (!point) {
        this._hideTooltip();
        return;
      }
      this._showTooltipForPoint(point, param.point.x);
    };
    this._chart.subscribeCrosshairMove(this._crosshairHandler);

    const wrap = document.getElementById('uae-hist-canvas-wrap');
    wrap?.addEventListener('pointerleave', () => this._hideTooltip());
    wrap?.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'mouse') this._hideTooltip();
    });

    this._ready = true;
  }

  _createSeries(code) {
    if (!this._chart || !this._LW) return;
    const colors = this._seriesColors?.[code] || readSeriesColors(this._themeContainer)[code];
    const SeriesType = this.mode === 'area' ? this._LW.AreaSeries : this._LW.LineSeries;
    const lineStyle = SERIES_LINE_STYLES[code] ?? 0;
    const opts =
      this.mode === 'area'
        ? {
            lineColor: colors.line,
            topColor: colors.areaTop,
            bottomColor: colors.areaBottom,
            lineWidth: 2,
            lineStyle,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            visible: this.visibleKarats.has(code),
          }
        : {
            color: colors.line,
            lineWidth: 2,
            lineStyle,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            visible: this.visibleKarats.has(code),
          };

    const existing = this._seriesMap.get(code);
    if (existing) {
      try {
        this._chart.removeSeries(existing);
      } catch {
        /* already removed */
      }
    }

    const series = this._chart.addSeries(SeriesType, opts);
    this._seriesMap.set(code, series);
    return series;
  }

  _applyTheme() {
    if (!this._chart) return;
    const theme = readChartTheme(this._themeContainer);
    this._chart.applyOptions({
      layout: { textColor: theme.text, fontFamily: theme.fontFamily },
      grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
      rightPriceScale: { borderColor: theme.border, textColor: theme.text },
      timeScale: { borderColor: theme.border },
    });
  }

  _applyRange(range) {
    this.range = range;
    this.filteredPoints = filterUaeHistoryByRange(this.allPoints, range);
    this.rangeCoverage = computeCoverageMeta(this.filteredPoints);
    this.rangeResolution = describeRangeResolution(this.filteredPoints);
    this._keyboardIndex = -1;
    this._hideTooltip();

    const rangeGroup = document.getElementById('uae-hist-range-group');
    rangeGroup?.querySelectorAll('.uae-hist-chart__range-btn').forEach((btn) => {
      const active = btn.dataset.range === range;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    this._updateCoverageUi();
    this._updateChart();
    this._renderSummary();
    this._renderTable();
    this._updateSrSummary();
    this._updateResolutionLabel();
  }

  _applyMode(mode) {
    this.mode = mode;
    const modeGroup = document.getElementById('uae-hist-mode-group');
    modeGroup?.querySelectorAll('.uae-hist-chart__mode-btn').forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (this._chart) {
      for (const code of UAE_HISTORY_KARATS) {
        this._createSeries(code);
      }
      this._updateChart();
    }
  }

  _toggleSeries(code) {
    if (!code) return;

    if (this.visibleKarats.has(code)) {
      if (this.visibleKarats.size <= 1) return;
      this.visibleKarats.delete(code);
    } else {
      this.visibleKarats.add(code);
    }

    const btn = document.querySelector(`.uae-hist-chart__legend-btn[data-karat="${code}"]`);
    const visible = this.visibleKarats.has(code);
    btn?.setAttribute('aria-pressed', visible ? 'true' : 'false');
    btn?.classList.toggle('is-muted', !visible);

    const series = this._seriesMap.get(code);
    series?.applyOptions({ visible });

    this._updateSrSummary();
  }

  _showAllSeries() {
    this.visibleKarats = new Set(UAE_HISTORY_KARATS);
    document.querySelectorAll('.uae-hist-chart__legend-btn').forEach((btn) => {
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.remove('is-muted');
    });
    for (const series of this._seriesMap.values()) {
      series.applyOptions({ visible: true });
    }
    this._updateSrSummary();
  }

  _updateChart() {
    if (!this._ready || !this.filteredPoints.length) {
      this._renderState();
      return;
    }

    for (const code of UAE_HISTORY_KARATS) {
      const series = this._seriesMap.get(code);
      if (!series) continue;
      const data = toChartSeriesData(this.filteredPoints, code);
      series.setData(data);
      series.applyOptions({ visible: this.visibleKarats.has(code) });
    }

    this._chart?.timeScale().fitContent();
    const canvas = document.getElementById('uae-hist-canvas');
    canvas?.classList.remove('uae-hist-chart__canvas--loading');
    this._clearFallback();
  }

  _updateCoverageUi() {
    const coverageEl = document.getElementById('uae-hist-coverage');
    const subtitleEl = document.getElementById('uae-hist-range-subtitle');
    const freshnessEl = document.getElementById('uae-hist-freshness-badge');

    const meta = this.rangeCoverage || this.coverage;
    if (!meta) return;

    const startFmt = formatHistoryDate(meta.start, this.lang);
    const endFmt = formatHistoryDate(meta.end, this.lang);

    if (coverageEl) {
      setText(
        coverageEl,
        t(this.lang, 'home.uaeHist.dataCoverage', { start: startFmt, end: endFmt })
      );
    }

    if (subtitleEl) {
      setText(
        subtitleEl,
        t(this.lang, `home.uaeHist.rangeSubtitle${this.range}`, { endDate: endFmt })
      );
    }

    if (freshnessEl) {
      const freshness = meta.freshness || classifyCoverageFreshness(meta.end);
      freshnessEl.className = `uae-hist-chart__freshness-badge uae-hist-chart__freshness-badge--${freshness}`;
      setText(freshnessEl, t(this.lang, `home.uaeHist.freshness.${freshness}`, { date: endFmt }));
    }
  }

  _renderSummary() {
    const summaryEl = document.getElementById('uae-hist-summary');
    if (!summaryEl) return;

    const summary = computeUaeHistorySummary(this.filteredPoints);
    clear(summaryEl);

    if (!summary) {
      setText(summaryEl, t(this.lang, 'home.uaeHist.noData'));
      return;
    }

    const items = [
      {
        label: t(this.lang, 'home.uaeHist.summaryLatest'),
        value: formatAedPerGramWithUnit(summary.latest24, this.lang),
      },
      {
        label: t(this.lang, 'home.uaeHist.summaryChange'),
        value: `${summary.absoluteChange >= 0 ? '+' : ''}${summary.absoluteChange.toFixed(2)} (${summary.percentageChange >= 0 ? '+' : ''}${summary.percentageChange.toFixed(1)}%)`,
      },
      {
        label: t(this.lang, 'home.uaeHist.summaryHigh'),
        value: formatAedPerGramWithUnit(summary.high24, this.lang),
      },
      {
        label: t(this.lang, 'home.uaeHist.summaryLow'),
        value: formatAedPerGramWithUnit(summary.low24, this.lang),
      },
    ];

    for (const item of items) {
      const block = el('div', { class: 'uae-hist-chart__summary-item' });
      const label = el('span', { class: 'uae-hist-chart__summary-label' });
      const value = el('span', { class: 'uae-hist-chart__summary-value gtl-num' });
      setText(label, item.label);
      setText(value, item.value);
      block.appendChild(label);
      block.appendChild(value);
      summaryEl.appendChild(block);
    }
  }

  _renderTable() {
    const wrap = document.getElementById('uae-hist-table-wrap');
    const actions = document.getElementById('uae-hist-table-actions');
    if (!wrap) return;

    clear(wrap);
    clear(actions);

    const rows = toTableRows(this.filteredPoints);
    if (!rows.length) return;

    const visibleCount = this.tableExpanded ? rows.length : Math.min(TABLE_INITIAL_ROWS, rows.length);
    const visibleRows = rows.slice(0, visibleCount);

    const table = el('table', { class: 'uae-hist-chart__table' });
    const caption = el('caption', { class: 'sr-only' });
    setText(caption, t(this.lang, 'home.uaeHist.tableCaption'));
    table.appendChild(caption);

    const thead = el('thead');
    const headRow = el('tr');
    const headers = [
      t(this.lang, 'home.uaeHist.colDate'),
      ...UAE_HISTORY_KARATS.map((c) => t(this.lang, `home.uaeHist.karat${c}`)),
    ];
    for (const h of headers) {
      const th = el('th', { scope: 'col' });
      setText(th, h);
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = el('tbody');
    for (const row of visibleRows) {
      const tr = el('tr');
      const dateTd = el('td');
      setText(dateTd, formatHistoryDate(row.date, this.lang));
      dateTd.setAttribute('data-iso-date', row.date);
      tr.appendChild(dateTd);
      for (const code of UAE_HISTORY_KARATS) {
        const td = el('td', { class: 'gtl-num' });
        setText(td, formatAedPerGramWithUnit(row.values[code], this.lang));
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    wrap.appendChild(table);

    if (rows.length > TABLE_INITIAL_ROWS) {
      const moreBtn = el('button', {
        type: 'button',
        class: 'btn btn--ghost btn--sm',
        id: this.tableExpanded ? 'uae-hist-table-collapse' : 'uae-hist-table-more',
      });
      setText(
        moreBtn,
        this.tableExpanded
          ? t(this.lang, 'home.uaeHist.tableCollapse')
          : t(this.lang, 'home.uaeHist.tableShowMore')
      );
      actions.appendChild(moreBtn);
    }

    const exportBtn = el('button', {
      type: 'button',
      class: 'btn btn--ghost btn--sm',
      id: 'uae-hist-export-csv',
    });
    setText(exportBtn, t(this.lang, 'home.uaeHist.exportCsv'));
    actions.appendChild(exportBtn);
  }

  _showTooltipForPoint(point, xPos) {
    const tooltip = document.getElementById('uae-hist-tooltip');
    const wrap = document.getElementById('uae-hist-canvas-wrap');
    if (!tooltip || !wrap || !point) return;

    clear(tooltip);
    const dateEl = el('div', { class: 'uae-hist-chart__tooltip-date' });
    setText(dateEl, formatHistoryDate(point.date, this.lang));
    tooltip.appendChild(dateEl);

    for (const code of UAE_HISTORY_KARATS) {
      if (!this.visibleKarats.has(code)) continue;
      const row = el('div', { class: 'uae-hist-chart__tooltip-row' });
      const colors = this._seriesColors?.[code] || readSeriesColors(this._themeContainer)?.[code];
      const label = el('span', {
        class: `uae-hist-chart__tooltip-karat ${SERIES_SHAPE_CLASS[code]}`,
        style: colors ? `--swatch-color:${colors.line}` : '',
      });
      setText(label, t(this.lang, `home.uaeHist.karat${code}`));
      const val = el('span', { class: 'uae-hist-chart__tooltip-value gtl-num' });
      const displayVal = point.displayValues?.[code] ?? point.values[code];
      setText(val, formatAedPerGramWithUnit(displayVal, this.lang));
      row.appendChild(label);
      row.appendChild(val);
      tooltip.appendChild(row);
    }

    const resKey = this.rangeResolution?.key || 'daily_reference';
    const resEl = el('div', { class: 'uae-hist-chart__tooltip-resolution' });
    setText(resEl, t(this.lang, `home.uaeHist.resolution.${resKey}`));
    tooltip.appendChild(resEl);

    tooltip.removeAttribute('hidden');

    if (typeof xPos === 'number') {
      const maxLeft = wrap.clientWidth - tooltip.offsetWidth - 8;
      const left = Math.max(8, Math.min(xPos - tooltip.offsetWidth / 2, maxLeft));
      tooltip.style.left = `${left}px`;
    } else {
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%)';
    }
  }

  _hideTooltip() {
    const tooltip = document.getElementById('uae-hist-tooltip');
    if (!tooltip) return;
    tooltip.setAttribute('hidden', '');
    tooltip.style.transform = '';
    clear(tooltip);
  }

  _updateSrSummary() {
    const el_ = document.getElementById('uae-hist-sr-summary');
    if (!el_) return;
    setText(
      el_,
      buildChartSrSummary(this.filteredPoints, this.range, [...this.visibleKarats], this.lang)
    );
  }

  _updateResolutionLabel() {
    const sourceEl = document.getElementById('uae-hist-source');
    if (!sourceEl || !this.rangeResolution) return;
    const resKey = this.rangeResolution.key;
    const base = t(this.lang, 'home.uaeHist.sourceNote');
    const resLabel = t(this.lang, `home.uaeHist.resolution.${resKey}`);
    const endFmt = formatHistoryDate(this.rangeCoverage?.end, this.lang);
    const delayed =
      this.rangeCoverage?.freshness === 'stale' || this.rangeCoverage?.freshness === 'delayed'
        ? t(this.lang, 'home.uaeHist.coverageDelayed', { date: endFmt })
        : '';
    setText(sourceEl, [base, resLabel, delayed].filter(Boolean).join(' · '));
  }

  _renderState() {
    const canvas = document.getElementById('uae-hist-canvas');
    if (!canvas) return;

    if (this._loading) {
      canvas.classList.add('uae-hist-chart__canvas--loading');
      this._hideTooltip();
      return;
    }

    canvas.classList.remove('uae-hist-chart__canvas--loading');

    if (this._error) {
      if (this._chart) this._destroyChartInternals();
      clear(canvas);
      const msg = el('div', { class: 'chart-no-data' });
      setText(
        msg,
        t(
          this.lang,
          this._error === 'load-error' ? 'chart.fallback.loadError' : 'home.uaeHist.noData'
        )
      );
      const retry = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'uae-hist-retry' });
      setText(retry, t(this.lang, 'home.uaeHist.retry'));
      canvas.appendChild(msg);
      canvas.appendChild(retry);
    }
  }

  _clearFallback() {
    const canvas = document.getElementById('uae-hist-canvas');
    canvas?.querySelector('.chart-no-data')?.remove();
    canvas?.querySelector('#uae-hist-retry')?.remove();
  }

  _exportCsv() {
    const rows = this.filteredPoints;
    if (!rows.length) return;

    const header = ['Date', '24K AED/g', '22K AED/g', '21K AED/g', '18K AED/g', 'XAU/USD', 'Source'];
    const lines = [
      '# Gold Ticker Live — UAE Historical Reference Prices (AED/gram)',
      '# Disclaimer: Spot-linked reference estimates. Not retail shop pricing.',
      `# Range: ${this.range}`,
      `# Coverage end: ${this.rangeCoverage?.end || ''}`,
      '',
      header.join(','),
    ];

    for (const p of rows) {
      const dv = p.displayValues || {};
      lines.push(
        [
          p.date,
          (dv['24'] ?? p.values['24']).toFixed(2),
          (dv['22'] ?? p.values['22']).toFixed(2),
          (dv['21'] ?? p.values['21']).toFixed(2),
          (dv['18'] ?? p.values['18']).toFixed(2),
          p.spotUsdOz.toFixed(2),
          p.source,
        ].join(',')
      );
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uae-gold-reference-${this.range.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  setLang(lang) {
    if (this.lang === lang) return;
    this.lang = lang;
    const root = document.getElementById(this.rootId);
    if (!root) return;

    this._localizeShell({ badge: document.getElementById('uae-hist-badge') });
    this._populateRangeButtons(document.getElementById('uae-hist-range-group'));
    this._populateModeButtons(document.getElementById('uae-hist-mode-group'));
    this._populateLegend(document.getElementById('uae-hist-legend'));

    if (this._chart) {
      this._chart.applyOptions({
        localization: { locale: lang === 'ar' ? 'ar-AE' : 'en-AE' },
      });
    }

    this._updateCoverageUi();
    this._renderSummary();
    this._renderTable();
    this._updateSrSummary();
    this._updateResolutionLabel();
  }

  _destroyChartInternals() {
    if (this._chart && this._crosshairHandler) {
      try {
        this._chart.unsubscribeCrosshairMove(this._crosshairHandler);
      } catch {
        /* already unsubscribed */
      }
    }
    this._crosshairHandler = null;
    this._crosshairUnsub = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._themeObserver?.disconnect();
    this._themeObserver = null;
    if (this._chart) {
      try {
        this._chart.remove();
      } catch {
        /* already removed */
      }
      this._chart = null;
    }
    this._seriesMap.clear();
    this._ready = false;
    this._hideTooltip();
  }

  _destroyChart() {
    this._destroyChartInternals();
  }

  destroy() {
    this._destroyChartInternals();
    this._shellReady = false;
    this._controlsBound = false;
  }
}
