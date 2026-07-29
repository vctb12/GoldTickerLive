/**
 * UAE Historical Karat Chart — multi-series homepage component.
 *
 * Renders four karat series (24K/22K/21K/18K) in AED/gram using lightweight-charts.
 * Supports line/area modes, range controls, legend toggles, summary strip, and table.
 */

import { readChartTheme } from '../lib/chart-theme.js';
import { TRANSLATIONS } from '../config/translations-runtime.js';
import { translate } from '../lib/i18n.js';
import { clear, el, setText } from '../lib/safe-dom.js';
import {
  UAE_HISTORY_KARATS,
  UAE_HISTORY_RANGES,
  filterUaeHistoryByRange,
  computeUaeHistorySummary,
  toChartSeriesData,
  toTableRows,
  buildChartSrSummary,
  loadUaeKaratHistory,
  formatAedPerGram,
} from '../lib/uae-historical-karat-data.js';

/** Series colors — distinct families per spec, adapted to GTL palette. */
const SERIES_COLORS = Object.freeze({
  24: { line: '#a855f7', areaTop: 'rgba(168, 85, 247, 0.25)', areaBottom: 'rgba(168, 85, 247, 0.02)' },
  22: { line: '#10b981', areaTop: 'rgba(16, 185, 129, 0.22)', areaBottom: 'rgba(16, 185, 129, 0.02)' },
  21: { line: '#ef4444', areaTop: 'rgba(239, 68, 68, 0.2)', areaBottom: 'rgba(239, 68, 68, 0.02)' },
  18: { line: '#3b82f6', areaTop: 'rgba(59, 130, 246, 0.2)', areaBottom: 'rgba(59, 130, 246, 0.02)' },
});

const DEFAULT_RANGE = '6M';
const DEFAULT_MODE = 'line';
const TABLE_INITIAL_ROWS = 20;

function t(lang, key) {
  return translate(TRANSLATIONS, lang, key);
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
    this.resolution = null;
    this.tableExpanded = false;
    this._chart = null;
    this._seriesMap = new Map();
    this._LW = null;
    this._ready = false;
    this._loading = true;
    this._error = null;
    this._resizeObserver = null;
    this._themeObserver = null;
    this._themeContainer = null;
  }

  /** Mount UI shell and lazy-load data + chart library. */
  async init() {
    const root = document.getElementById(this.rootId);
    if (!root) return;

    this._renderShell(root);
    this._bindControls(root);

    try {
      const { points, resolution } = await loadUaeKaratHistory();
      this.allPoints = points;
      this.resolution = resolution;
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
      this._renderState(root);
    }
  }

  _renderShell(root) {
    clear(root);
    root.className = 'uae-hist-chart';

    const badge = el('span', { class: 'uae-hist-chart__badge', id: 'uae-hist-badge' });
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
      'aria-labelledby': 'home-chart-title',
    });
    const srSummary = el('p', { class: 'sr-only chart-sr-summary', id: 'uae-hist-sr-summary' });
    const legend = el('div', { class: 'uae-hist-chart__legend', id: 'uae-hist-legend', role: 'group' });
    const tableWrap = el('div', { class: 'uae-hist-chart__table-wrap', id: 'uae-hist-table-wrap' });
    const tableActions = el('div', { class: 'uae-hist-chart__table-actions', id: 'uae-hist-table-actions' });

    chartWrap.appendChild(chartContainer);
    chartWrap.appendChild(srSummary);
    controls.appendChild(rangeGroup);
    controls.appendChild(modeGroup);

    root.appendChild(badge);
    root.appendChild(controls);
    root.appendChild(summary);
    root.appendChild(chartWrap);
    root.appendChild(legend);
    root.appendChild(tableWrap);
    root.appendChild(tableActions);

    this._populateRangeButtons(rangeGroup);
    this._populateModeButtons(modeGroup);
    this._populateLegend(legend);
    this._localizeShell({ badge, source });
    root.appendChild(source);
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
      const colors = SERIES_COLORS[code];
      const btn = el('button', {
        type: 'button',
        class: 'uae-hist-chart__legend-btn',
        'data-karat': code,
        'aria-pressed': 'true',
      });
      const swatch = el('span', {
        class: 'uae-hist-chart__legend-swatch',
        style: `background:${colors.line}`,
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
  }

  _bindControls(root) {
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
        this._error = null;
        this._loading = true;
        this.init();
      }
    });
  }

  async _loadChartLibrary() {
    if (this._LW) return;
    const mod = await import('lightweight-charts');
    this._LW = mod;
  }

  _initChart() {
    const container = document.getElementById('uae-hist-canvas');
    if (!container || !this._LW) return;

    clear(container);
    this._themeContainer = container.closest('.uae-hist-chart__canvas-wrap') || container;
    const theme = readChartTheme(this._themeContainer);
    const height = 360;

    this._chart = this._LW.createChart(container, {
      width: container.clientWidth || 600,
      height,
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
        this._chart.resize(container.clientWidth, height);
      }
    });
    this._resizeObserver.observe(container);

    this._themeObserver = new MutationObserver(() => this._applyTheme());
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    this._ready = true;
  }

  _createSeries(code) {
    if (!this._chart || !this._LW) return;
    const colors = SERIES_COLORS[code];
    const SeriesType = this.mode === 'area' ? this._LW.AreaSeries : this._LW.LineSeries;
    const opts =
      this.mode === 'area'
        ? {
            lineColor: colors.line,
            topColor: colors.areaTop,
            bottomColor: colors.areaBottom,
            lineWidth: 2,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            visible: this.visibleKarats.has(code),
          }
        : {
            color: colors.line,
            lineWidth: 2,
            priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
            visible: this.visibleKarats.has(code),
          };

    const existing = this._seriesMap.get(code);
    if (existing) {
      try {
        this._chart.removeSeries(existing);
      } catch {}
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

    const rangeGroup = document.getElementById('uae-hist-range-group');
    rangeGroup?.querySelectorAll('.uae-hist-chart__range-btn').forEach((btn) => {
      const active = btn.dataset.range === range;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

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
    this._clearFallback();
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
      { label: t(this.lang, 'home.uaeHist.summaryLatest'), value: formatAedPerGram(summary.latest24) },
      {
        label: t(this.lang, 'home.uaeHist.summaryChange'),
        value: `${summary.absoluteChange >= 0 ? '+' : ''}${summary.absoluteChange.toFixed(2)} (${summary.percentageChange >= 0 ? '+' : ''}${summary.percentageChange.toFixed(1)}%)`,
      },
      { label: t(this.lang, 'home.uaeHist.summaryHigh'), value: formatAedPerGram(summary.high24) },
      { label: t(this.lang, 'home.uaeHist.summaryLow'), value: formatAedPerGram(summary.low24) },
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
      setText(dateTd, row.date);
      tr.appendChild(dateTd);
      for (const code of UAE_HISTORY_KARATS) {
        const td = el('td', { class: 'gtl-num' });
        setText(td, formatAedPerGram(row.values[code]));
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

  _updateSrSummary() {
    const el_ = document.getElementById('uae-hist-sr-summary');
    if (!el_) return;
    setText(
      el_,
      buildChartSrSummary(
        this.filteredPoints,
        this.range,
        [...this.visibleKarats],
        this.lang
      )
    );
  }

  _updateResolutionLabel() {
    const sourceEl = document.getElementById('uae-hist-source');
    if (!sourceEl || !this.resolution) return;
    const resLabel = this.resolution.label || '';
    const base = t(this.lang, 'home.uaeHist.sourceNote');
    setText(sourceEl, `${base} · ${resLabel}`);
  }

  _renderState() {
    const canvas = document.getElementById('uae-hist-canvas');
    if (!canvas) return;

    if (this._loading) {
      canvas.classList.add('uae-hist-chart__canvas--loading');
      return;
    }

    canvas.classList.remove('uae-hist-chart__canvas--loading');

    if (this._error) {
      clear(canvas);
      const msg = el('div', { class: 'chart-no-data' });
      setText(
        msg,
        t(
          this.lang,
          this._error === 'load-error' ? 'chart.fallback.loadError' : 'chart.fallback.noData'
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
      '',
      header.join(','),
    ];

    for (const p of rows) {
      lines.push(
        [
          p.date,
          formatAedPerGram(p.values['24']),
          formatAedPerGram(p.values['22']),
          formatAedPerGram(p.values['21']),
          formatAedPerGram(p.values['18']),
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

    this._renderSummary();
    this._renderTable();
    this._updateSrSummary();
    this._updateResolutionLabel();
  }

  destroy() {
    this._resizeObserver?.disconnect();
    this._themeObserver?.disconnect();
    if (this._chart) {
      try {
        this._chart.remove();
      } catch {}
      this._chart = null;
    }
    this._seriesMap.clear();
    this._ready = false;
  }
}
