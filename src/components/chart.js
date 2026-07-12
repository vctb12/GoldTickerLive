/**
 * Gold price chart component using Lightweight Charts (TradingView).
 *
 * DATA STRATEGY:
 *   - Short ranges (24H, 7D): uses localStorage session snapshots (90s resolution)
 *   - Longer ranges (30D, 90D, 1Y, 3Y, 5Y, ALL): uses unified historical data
 *     (monthly baseline 2019-present + daily cached snapshots merged together)
 *
 * Usage:
 *   import { GoldChart } from './components/chart.js';
 *   const chart = new GoldChart('chart-container', lang);
 *   chart.addPoint(price, timestamp);  // call on every gold fetch
 *   chart.setRange('24H' | '7D' | '30D' | '90D' | '1Y' | '3Y' | '5Y' | 'ALL');
 */

import { getUnifiedHistory, toChartData, filterByRange } from '../lib/historical-data.js';
import { updateChartSummary } from './chart-summary.js';
import { TRANSLATIONS } from '../config/translations-runtime.js';
import { translate } from '../lib/i18n.js';
import { readChartTheme } from '../lib/chart-theme.js';

const CHART_CACHE_KEY = 'gold_chart_snapshots';
const MAX_SNAPSHOTS = 5000; // ~5 days at 90s intervals

function loadSnapshots() {
  try {
    const raw = localStorage.getItem(CHART_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots) {
  try {
    localStorage.setItem(CHART_CACHE_KEY, JSON.stringify(snapshots.slice(-MAX_SNAPSHOTS)));
  } catch {}
}

/**
 * Filter live session snapshots by time range (for short ranges).
 */
function filterSnapshotsByMs(snapshots, ms) {
  const cutoff = Date.now() - ms;
  return snapshots.filter((s) => s.time * 1000 >= cutoff);
}

const SHORT_RANGE_MS = {
  '24H': 86400000,
  '7D': 604800000,
};

const CUSTOM_RANGE_MS = {
  '1D': 86400000,
  '1W': 604800000,
  '1M': 30 * 86400000,
  '3M': 90 * 86400000,
  '6M': 180 * 86400000,
  '1Y': 365 * 86400000,
};

// Theme colors resolve from the chart's own container (container-scoped, see
// src/lib/chart-theme.js) — NOT the document root — so a chart on the tracker's
// always-dark terminal panel gets dark-legible colors in both site themes.
function applyChartTheme(chart, series, containerEl) {
  if (!chart || !series) return;
  const theme = readChartTheme(containerEl);
  chart.applyOptions({
    layout: {
      background: { color: 'transparent' },
      textColor: theme.text,
      fontFamily: theme.fontFamily,
    },
    grid: {
      vertLines: { color: theme.grid },
      horzLines: { color: theme.grid },
    },
    rightPriceScale: {
      borderColor: theme.border,
      textColor: theme.text,
    },
    timeScale: {
      borderColor: theme.border,
    },
  });
  series.applyOptions({
    lineColor: theme.line,
    topColor: theme.areaTop,
    bottomColor: theme.areaBottom,
  });
}

export class GoldChart {
  constructor(containerId, lang = 'en') {
    this.containerId = containerId;
    this.lang = lang;
    this.range = '1Y'; // default to show meaningful historical data
    this.snapshots = loadSnapshots();
    this._cachedDaily = []; // injected from STATE.history
    this._customData = null;
    this._chart = null;
    this._series = null;
    this._ready = false;
    this._LW = null;
    this._fallbackReason = null;
    this._themeContainer = null;
    this._loadLibrary();
  }

  /** Inject the daily history from STATE (called after cache load) */
  setDailyHistory(dailyHistory) {
    this._cachedDaily = Array.isArray(dailyHistory) ? dailyHistory : [];
    if (this._ready) this._render();
  }

  /**
   * Inject custom chart data in Lightweight Charts format:
   * [{ time: 'YYYY-MM-DD' | unixSeconds, value: number }]
   */
  setCustomData(points) {
    this._customData = Array.isArray(points) ? points : null;
    if (this._ready) this._render();
  }

  clearCustomData() {
    this._customData = null;
    if (this._ready) this._render();
  }

  async _loadLibrary() {
    try {
      const [mod] = await Promise.all([
        import('lightweight-charts'),
        import('../lib/historical-data.js').then((m) => m.ensureRemoteHistory?.()),
      ]);
      this._LW = mod;
      this._init();
    } catch (e) {
      console.warn('[chart] Lightweight Charts failed to load:', e.message);
      this._showFallback('load-error');
    }
  }

  _init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.replaceChildren();

    // Derive height from the parent chart-wrap so it fills the panel
    const wrap = container.closest('.tracker-chart-wrap');
    const chartHeight = wrap ? Math.max(240, wrap.clientHeight - 4) : 380;

    // Container-scoped theme: the wrap (when present) is the CSS context that
    // declares the chart tokens — e.g. the tracker's always-dark terminal.
    this._themeContainer = wrap || container;
    const theme = readChartTheme(this._themeContainer);
    this._chart = this._LW.createChart(container, {
      width: container.clientWidth,
      height: chartHeight,
      // Localize time-axis / crosshair dates to the page language, mirroring
      // the formatter.js ar-AE / en-AE date convention. Price digits keep the
      // library default (Latin), matching formatPrice() sitewide.
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
        minimumWidth: 65,
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

    this._series = this._chart.addSeries(this._LW.AreaSeries, {
      lineColor: theme.line,
      topColor: theme.areaTop,
      bottomColor: theme.areaBottom,
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    this._themeObserver = new MutationObserver(() => {
      applyChartTheme(this._chart, this._series, this._themeContainer);
    });
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    this._resizeObserver = new ResizeObserver(() => {
      if (this._chart) {
        const w = container.clientWidth;
        const h = wrap ? Math.max(240, wrap.clientHeight - 4) : chartHeight;
        if (w > 0) this._chart.resize(w, h);
      }
    });
    this._resizeObserver.observe(container);

    this._injectTradingViewAttribution(container);

    this._ready = true;
    this._render();
  }

  _injectTradingViewAttribution(container) {
    const label = translate(TRANSLATIONS, this.lang, 'chart.attribution.tradingView');
    const existing = container.querySelector('.chart-tv-attribution');
    if (existing) {
      existing.textContent = label;
      return;
    }
    const link = document.createElement('a');
    link.className = 'chart-tv-attribution';
    link.href = 'https://www.tradingview.com/';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    container.appendChild(link);
    applyChartTheme(this._chart, this._series, this._themeContainer);
  }

  _showFallback(reason) {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    // All user-facing strings live in translations.js (chart.fallback.*);
    // unknown reasons fall back to the honest no-data sentence.
    this._fallbackReason = reason === 'load-error' ? 'load-error' : 'no-data';
    const key =
      this._fallbackReason === 'load-error' ? 'chart.fallback.loadError' : 'chart.fallback.noData';
    const text = translate(TRANSLATIONS, this.lang, key);
    const existing = container.querySelector('.chart-no-data');
    if (existing) {
      existing.textContent = text;
      return;
    }
    const msg = document.createElement('div');
    msg.className = 'chart-no-data';
    msg.textContent = text;
    container.appendChild(msg);
  }

  _clearFallback() {
    this._fallbackReason = null;
    document.getElementById(this.containerId)?.querySelector('.chart-no-data')?.remove();
  }

  _getChartData() {
    const range = (this.range || '1Y').toUpperCase();

    // When custom data is set (even empty), do not fall back to spot snapshots — those use USD/oz scale.
    if (this._customData !== null) {
      if (!Array.isArray(this._customData) || !this._customData.length) return null;
      const normalized = this._customData
        .map((point) => {
          if (!point || typeof point !== 'object') return null;
          const value = Number(point.value);
          if (!Number.isFinite(value) || value <= 0) return null;
          const asDate =
            typeof point.time === 'string'
              ? new Date(`${point.time}T00:00:00Z`)
              : new Date(point.time * 1000);
          if (!Number.isFinite(asDate.getTime())) return null;
          return {
            time: typeof point.time === 'string' ? point.time : Math.floor(asDate.getTime() / 1000),
            value,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          const aTime =
            typeof a.time === 'string' ? new Date(`${a.time}T00:00:00Z`).getTime() : a.time * 1000;
          const bTime =
            typeof b.time === 'string' ? new Date(`${b.time}T00:00:00Z`).getTime() : b.time * 1000;
          return aTime - bTime;
        });
      if (!normalized.length) return null;
      if (range === 'ALL') return normalized;
      const rangeMs = CUSTOM_RANGE_MS[range];
      if (!rangeMs) return normalized;
      const latest = normalized[normalized.length - 1];
      const latestTime =
        typeof latest.time === 'string'
          ? new Date(`${latest.time}T00:00:00Z`).getTime()
          : latest.time * 1000;
      const cutoff = latestTime - rangeMs;
      const filtered = normalized.filter((point) => {
        const pointTime =
          typeof point.time === 'string'
            ? new Date(`${point.time}T00:00:00Z`).getTime()
            : point.time * 1000;
        return pointTime >= cutoff;
      });
      return filtered.length ? filtered : normalized;
    }

    // Short ranges: use live snapshots for high resolution
    if (range === '24H' || range === '7D') {
      const ms = SHORT_RANGE_MS[range];
      const filtered = filterSnapshotsByMs(this.snapshots, ms);
      if (filtered.length < 2) return null;
      return filtered.map((s) => ({ time: s.time, value: s.price }));
    }

    // Longer ranges: use unified history (baseline + daily cache)
    const unified = getUnifiedHistory(this._cachedDaily);
    const filtered = filterByRange(unified, range);
    if (filtered.length < 2) return null;
    return toChartData(filtered);
  }

  _render() {
    if (!this._ready || !this._series) return;

    const data = this._getChartData();
    if (!data || data.length < 2) {
      this._showFallback('no-data');
      // Keep the SR summary truthful when a range switch empties the series.
      updateChartSummary(document.getElementById(this.containerId), null, this.lang);
      return;
    }
    this._clearFallback();

    // Dedupe by time (Lightweight Charts requires strictly ascending unique times)
    const seen = new Set();
    const deduped = [];
    for (const d of data) {
      const key = typeof d.time === 'string' ? d.time : String(d.time);
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(d);
      }
    }
    deduped.sort((a, b) => {
      const ka = typeof a.time === 'string' ? a.time : String(a.time);
      const kb = typeof b.time === 'string' ? b.time : String(b.time);
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

    this._series.setData(deduped);
    this._chart.timeScale().fitContent();
    // Accessible text equivalent of the exact series just rendered. The
    // USD/troy-oz unit sentence applies only to this component's own data
    // paths (spot snapshots + unified history); custom-injected series may
    // use other units/currencies, so their summary makes no unit claim.
    updateChartSummary(document.getElementById(this.containerId), deduped, this.lang, {
      unitKey: this._customData === null ? 'chart.summary.unitUsdOz' : null,
    });
  }

  addPoint(price, timestamp) {
    if (!price || price <= 0) return;
    const time = Math.floor(new Date(timestamp || Date.now()).getTime() / 1000);
    if (this.snapshots.length && this.snapshots[this.snapshots.length - 1].time === time) return;
    this.snapshots.push({ time, price });
    saveSnapshots(this.snapshots);

    // Only do incremental update for short-range views
    const range = (this.range || '1Y').toUpperCase();
    if ((range === '24H' || range === '7D') && this._ready && this._series) {
      const data = this._getChartData();
      if (data && data.length >= 2) {
        this._clearFallback();
        this._series.update({ time, value: price });
        // Keep the SR summary in step with the incrementally-updated canvas
        // (data from _getChartData already includes the point just pushed).
        updateChartSummary(document.getElementById(this.containerId), data, this.lang, {
          unitKey: this._customData === null ? 'chart.summary.unitUsdOz' : null,
        });
      }
    }
  }

  setRange(range) {
    this.range = range;
    this._render();
  }

  setLang(lang) {
    if (this.lang === lang) return;
    this.lang = lang;
    // Re-localize the time axis and refresh the SR summary in the new language.
    if (this._chart) {
      this._chart.applyOptions({
        localization: { locale: lang === 'ar' ? 'ar-AE' : 'en-AE' },
      });
    }
    // Re-resolve translated DOM strings this component owns: the attribution
    // link is created once in _init (never rebuilt by _render), and the
    // load-error fallback lives outside the _render path entirely because the
    // library never initialized. The no-data fallback re-resolves via
    // _render() → _showFallback('no-data') updating the existing node.
    const container = document.getElementById(this.containerId);
    const attribution = container?.querySelector('.chart-tv-attribution');
    if (attribution) {
      attribution.textContent = translate(TRANSLATIONS, lang, 'chart.attribution.tradingView');
    }
    if (this._ready) {
      this._render();
    } else if (this._fallbackReason) {
      this._showFallback(this._fallbackReason);
    }
  }

  /**
   * Tear down the chart and its observers. Safe to call twice. Pages that
   * re-mount charts (language/theme rebuilds) should call this to avoid
   * leaking MutationObserver/ResizeObserver instances.
   */
  destroy() {
    this._themeObserver?.disconnect();
    this._themeObserver = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    if (this._chart) {
      try {
        this._chart.remove();
      } catch {}
      this._chart = null;
    }
    this._series = null;
    this._themeContainer = null;
    this._ready = false;
  }
}
