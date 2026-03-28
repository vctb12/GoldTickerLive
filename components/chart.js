/**
 * Gold price chart component using Lightweight Charts (TradingView).
 * Stores price snapshots in localStorage; renders session + multi-day history.
 *
 * Usage:
 *   import { GoldChart } from './components/chart.js';
 *   const chart = new GoldChart('chart-container', lang);
 *   chart.addPoint(price, timestamp);   // call on every gold fetch
 *   chart.setRange('24h' | '7d' | '30d');
 */

const CHART_CACHE_KEY  = 'gold_chart_snapshots';
const MAX_SNAPSHOTS    = 5000; // ~5 days at 90s intervals
const LIGHTWEIGHT_CDN  = 'https://cdn.jsdelivr.net/npm/lightweight-charts@4.2.3/+esm';

function loadSnapshots() {
  try {
    const raw = localStorage.getItem(CHART_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSnapshots(snapshots) {
  try {
    const trimmed = snapshots.slice(-MAX_SNAPSHOTS);
    localStorage.setItem(CHART_CACHE_KEY, JSON.stringify(trimmed));
  } catch {}
}

function filterByRange(snapshots, range) {
  const now = Date.now();
  const cutoffs = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 };
  const ms = cutoffs[range] || cutoffs['24h'];
  return snapshots.filter(s => now - s.time * 1000 < ms);
}

export class GoldChart {
  constructor(containerId, lang = 'en') {
    this.containerId = containerId;
    this.lang = lang;
    this.range = '24h';
    this.snapshots = loadSnapshots();
    this._chart = null;
    this._series = null;
    this._ready = false;
    this._loadLibrary();
  }

  async _loadLibrary() {
    try {
      const mod = await import(LIGHTWEIGHT_CDN);
      this._LW = mod;
      this._init();
    } catch (e) {
      console.warn('[chart] Lightweight Charts failed to load:', e.message);
      this._showFallback();
    }
  }

  _init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Remove skeleton
    container.innerHTML = '';

    const isDark = false; // could hook into theme later
    this._chart = this._LW.createChart(container, {
      width: container.clientWidth,
      height: 220,
      layout: {
        background: { color: 'transparent' },
        textColor: '#6a6050',
        fontFamily: "'Cairo', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(230,224,208,0.5)' },
        horzLines: { color: 'rgba(230,224,208,0.5)' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: 'rgba(230,224,208,0.8)',
        textColor: '#6a6050',
      },
      timeScale: {
        borderColor: 'rgba(230,224,208,0.8)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      handleScroll: true,
      handleScale: true,
    });

    this._series = this._chart.addAreaSeries({
      lineColor: '#c9a84c',
      topColor: 'rgba(201,168,76,0.28)',
      bottomColor: 'rgba(201,168,76,0.02)',
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    // Responsive resize
    const ro = new ResizeObserver(() => {
      if (this._chart) this._chart.resize(container.clientWidth, 220);
    });
    ro.observe(container);

    this._ready = true;
    this._render();
  }

  _showFallback() {
    const container = document.getElementById(this.containerId);
    if (!container) return;
    container.innerHTML = `<div class="chart-no-data">${
      this.lang === 'ar'
        ? 'تعذّر تحميل المخطط. تحقق من الاتصال.'
        : 'Chart unavailable. Check your connection.'
    }</div>`;
  }

  _render() {
    if (!this._ready || !this._series) return;
    const filtered = filterByRange(this.snapshots, this.range);
    if (filtered.length < 2) {
      // Show no-data overlay
      const container = document.getElementById(this.containerId);
      if (container && !container.querySelector('.chart-no-data')) {
        const msg = document.createElement('div');
        msg.className = 'chart-no-data';
        msg.textContent = this.lang === 'ar'
          ? 'لا تتوفر بيانات كافية بعد — سيتم ملء المخطط مع وصول التحديثات'
          : 'Not enough data yet — chart fills as price updates arrive';
        container.appendChild(msg);
      }
      return;
    }
    // Remove no-data overlay if present
    document.querySelector('.chart-no-data')?.remove();

    const data = filtered.map(s => ({ time: s.time, value: s.price }));
    this._series.setData(data);
    this._chart.timeScale().fitContent();
  }

  /** Call this every time a new gold price arrives. */
  addPoint(price, timestamp) {
    if (!price || price <= 0) return;
    const time = Math.floor(new Date(timestamp || Date.now()).getTime() / 1000);
    // Avoid duplicate timestamps
    if (this.snapshots.length && this.snapshots[this.snapshots.length - 1].time === time) return;
    this.snapshots.push({ time, price });
    saveSnapshots(this.snapshots);
    if (this._ready && this._series) {
      // Update chart incrementally
      const filtered = filterByRange(this.snapshots, this.range);
      if (filtered.length >= 2) {
        document.querySelector('.chart-no-data')?.remove();
        this._series.update({ time, value: price });
      }
    }
  }

  setRange(range) {
    this.range = range;
    this._render();
  }

  setLang(lang) {
    this.lang = lang;
  }
}
