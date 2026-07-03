import { BASE_PATH, CONSTANTS, KARATS } from '../../config/index.js';
import { formatPrice, formatTimestampShort } from '../../lib/formatter.js';
import { mountSharedShell } from '../../components/site-shell.js';
import { injectBreadcrumbs } from '../../components/breadcrumbs.js';
import { GoldChart } from '../../components/chart.js';
import { renderFreshnessBadge } from '../../components/FreshnessBadge.js';
import { getLiveFreshness, getMarketStatus } from '../../lib/live-status.js';
import { el, clear } from '../../lib/safe-dom.js';

const PERIODS = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];
const KARAT_CODES = ['24', '22', '21', '18'];
const CURRENCIES = ['AED', 'USD'];
const PERIOD_TO_RANGE = {
  '1D': '24H',
  '1W': '7D',
  '1M': '30D',
  '3M': '90D',
  '6M': '1Y',
  '1Y': '1Y',
  ALL: 'ALL',
};

function getShellDepth() {
  const basePath = String(BASE_PATH || '/').replace(/\/+$/, '');
  let pathname = window.location.pathname || '/';
  if (basePath && pathname.startsWith(`${basePath}/`)) {
    pathname = pathname.slice(basePath.length);
  }
  const normalized = pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
  return normalized.split('/').filter(Boolean).length;
}

const T = {
  en: {
    title: 'Gold Price Chart — UAE Historical Prices',
    noData: 'Collecting data since {date}. Check back soon.',
    stats: { high: 'High', low: 'Low', avg: 'Average', change: 'Change', changePct: 'Change %' },
    csv: 'Download CSV',
    share: 'Copy chart link',
    copied: 'Copied',
    source: 'Source',
    updated: 'Updated',
  },
  ar: {
    title: 'مخطط سعر الذهب في الإمارات',
    noData: 'نجمع البيانات منذ {date}. الرجاء العودة لاحقاً.',
    stats: {
      high: 'الأعلى',
      low: 'الأدنى',
      avg: 'المتوسط',
      change: 'التغير',
      changePct: 'نسبة التغير',
    },
    csv: 'تنزيل CSV',
    share: 'نسخ رابط الرسم البياني',
    copied: 'تم النسخ',
    source: 'المصدر',
    updated: 'آخر تحديث',
  },
};

function getPurity(code) {
  return KARATS.find((item) => item.code === String(code))?.purity ?? 1;
}

export function parseChartQuery(search) {
  const params = new URLSearchParams(search || '');
  const karat = KARAT_CODES.includes(params.get('karat')) ? params.get('karat') : '24';
  const currency = CURRENCIES.includes(params.get('currency')) ? params.get('currency') : 'AED';
  const period = PERIODS.includes(params.get('period')) ? params.get('period') : '1M';
  return { karat, currency, period };
}

export function serializeChartQuery({ karat = '24', currency = 'AED', period = '1M' } = {}) {
  const safe = {
    karat: KARAT_CODES.includes(String(karat)) ? String(karat) : '24',
    currency: CURRENCIES.includes(String(currency)) ? String(currency) : 'AED',
    period: PERIODS.includes(String(period)) ? String(period) : '1M',
  };
  const params = new URLSearchParams(safe);
  return `?${params.toString()}`;
}

export function toKaratSeries(points, { karat = '24', currency = 'AED' } = {}) {
  const purity = getPurity(karat);
  return (Array.isArray(points) ? points : [])
    .map((point) => {
      const xauUsdPerOz = Number(point.xauUsdPerOz ?? point.xau_usd_per_oz ?? point.price);
      if (!Number.isFinite(xauUsdPerOz) || xauUsdPerOz <= 0) return null;
      const usdPerGram = (xauUsdPerOz / CONSTANTS.TROY_OZ_GRAMS) * purity;
      const value = currency === 'AED' ? usdPerGram * CONSTANTS.AED_PEG : usdPerGram;
      const timestampUtc = point.timestampUtc || point.timestamp_utc;
      if (!timestampUtc) return null;
      const date = new Date(timestampUtc);
      if (!Number.isFinite(date.getTime())) return null;
      return {
        timestampUtc,
        value,
        xauUsdPerOz,
        provider: point.provider || point.source_provider || 'supabase',
        isFallback: Boolean(point.isFallback ?? point.is_fallback),
        isFresh: point.isFresh ?? point.is_fresh ?? null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.timestampUtc) - new Date(b.timestampUtc));
}

export function filterSeriesByPeriod(series, period = '1M') {
  if (!Array.isArray(series) || !series.length) return [];
  if (period === 'ALL') return series;
  const msMap = {
    '1D': 86400000,
    '1W': 7 * 86400000,
    '1M': 30 * 86400000,
    '3M': 90 * 86400000,
    '6M': 180 * 86400000,
    '1Y': 365 * 86400000,
  };
  const windowMs = msMap[period] ?? msMap['1M'];
  const latestTime = new Date(series[series.length - 1].timestampUtc).getTime();
  const cutoff = latestTime - windowMs;
  const filtered = series.filter((entry) => new Date(entry.timestampUtc).getTime() >= cutoff);
  return filtered.length ? filtered : series;
}

export function calculateChartStats(series) {
  if (!Array.isArray(series) || !series.length) return null;
  const values = series.map((entry) => entry.value);
  const high = Math.max(...values);
  const low = Math.min(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  const change = last - first;
  const changePct = first ? (change / first) * 100 : 0;
  return { high, low, average, change, changePct, first, last };
}

export function buildChartCsv(series, { karat = '24', currency = 'AED', period = '1M' } = {}) {
  const lines = [
    'timestamp_utc,karat,currency,price_per_gram,source,resolution,timezone,disclaimer',
  ];
  const disclaimer =
    'Reference estimate based on spot-linked XAU/USD conversion. Not a retail shop quote.';
  for (const row of series) {
    const value = Number(row.value).toFixed(4);
    const source = row.provider || 'supabase';
    lines.push(
      `${row.timestampUtc},${karat}K,${currency},${value},${source},${period},UTC,"${disclaimer}"`
    );
  }
  return lines.join('\n');
}

function buildChartData(series) {
  return series.map((entry) => ({
    time: new Date(entry.timestampUtc).toISOString().slice(0, 10),
    value: Number(entry.value.toFixed(4)),
  }));
}

function setupPage() {
  const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const tx = T[lang];
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  mountSharedShell({ lang, depth: getShellDepth(), withSpotBar: true });
  injectBreadcrumbs('tracker');

  const queryState = parseChartQuery(window.location.search);
  const state = { ...queryState, rawPoints: [] };

  const titleEl = document.getElementById('chart-page-title');
  if (titleEl) titleEl.textContent = tx.title;

  const chart = new GoldChart('chart-canvas', lang);

  function updateUrl() {
    const next = serializeChartQuery(state);
    window.history.replaceState({}, '', `${window.location.pathname}${next}`);
  }

  function activeSeries() {
    const full = toKaratSeries(state.rawPoints, state);
    return filterSeriesByPeriod(full, state.period);
  }

  function renderChartHero(series) {
    const hero = document.getElementById('chart-hero');
    if (!hero) return;
    const latest = series[series.length - 1];
    if (!latest) {
      hero.hidden = true;
      return;
    }
    hero.hidden = false;
    clear(hero);
    const refLabel = lang === 'ar' ? 'سعر مرجعي' : 'Reference';
    const unitLabel = lang === 'ar' ? `/غرام · ${state.karat}K` : `/gram · ${state.karat}K`;
    const formatted = formatPrice(latest.value, state.currency, state.currency === 'AED' ? 2 : 3);
    hero.appendChild(
      el('div', { class: 'chart-hero__inner price-hero price-hero--reference' }, [
        el('span', { class: 'price-kind price-kind--reference' }, [refLabel]),
        el('div', { class: 'price-hero__row' }, [
          el('strong', { class: 'price-hero__value price-hero__value--lg' }, [formatted]),
          el('span', { class: 'price-hero__unit' }, [unitLabel]),
        ]),
      ])
    );
  }

  function renderStats(series) {
    const statsRoot = document.getElementById('chart-stats');
    if (!statsRoot) return;
    clear(statsRoot);
    const stats = calculateChartStats(series);
    if (!stats) return;
    const rows = [
      [tx.stats.high, stats.high],
      [tx.stats.low, stats.low],
      [tx.stats.avg, stats.average],
      [tx.stats.change, stats.change],
      [tx.stats.changePct, stats.changePct],
    ];
    rows.forEach(([label, value]) => {
      const formatted =
        label === tx.stats.changePct
          ? `${value.toFixed(2)}%`
          : formatPrice(value, state.currency, state.currency === 'AED' ? 2 : 3);
      statsRoot.appendChild(
        el('div', { class: 'chart-stat' }, [
          el('span', { class: 'chart-stat__label' }, [label]),
          el('strong', { class: 'chart-stat__value' }, [formatted]),
        ])
      );
    });
  }

  function renderFreshness(series) {
    const slot = document.getElementById('chart-freshness');
    if (!slot) return;
    clear(slot);
    const latest = series[series.length - 1];
    if (!latest) return;
    const freshness = getLiveFreshness({
      updatedAt: latest.timestampUtc,
      lang,
      isFallback: latest.isFallback,
      isFresh: latest.isFresh,
    });
    slot.appendChild(
      renderFreshnessBadge({
        lang,
        state: freshness.key,
        source: latest.provider || 'supabase',
        updatedAt: latest.timestampUtc,
        marketOpen: getMarketStatus().isOpen,
      })
    );
    const meta = document.getElementById('chart-meta');
    if (meta) {
      meta.textContent = `${tx.source}: ${latest.provider || 'supabase'} · ${tx.updated}: ${formatTimestampShort(latest.timestampUtc, lang)} UTC`;
    }
  }

  function renderFallback() {
    const empty = document.getElementById('chart-empty');
    const since = new Date().toISOString().slice(0, 10);
    if (!empty) return;
    empty.textContent = tx.noData.replace('{date}', since);
    empty.hidden = false;
  }

  function render() {
    const series = activeSeries();
    const empty = document.getElementById('chart-empty');
    if (empty) empty.hidden = true;
    if (!series.length) {
      chart.setCustomData([]);
      const hero = document.getElementById('chart-hero');
      if (hero) hero.hidden = true;
      renderFallback();
      return;
    }
    chart.setCustomData(buildChartData(series));
    chart.setRange(state.period);
    renderChartHero(series);
    renderStats(series);
    renderFreshness(series);
    updateUrl();
  }

  function setupControls() {
    document.querySelectorAll('[data-chart-period]').forEach((button) => {
      const period = button.getAttribute('data-chart-period');
      button.classList.toggle('is-active', period === state.period);
      button.addEventListener('click', () => {
        if (period === state.period) return;
        state.period = period;
        document
          .querySelectorAll('[data-chart-period]')
          .forEach((item) => item.classList.toggle('is-active', item === button));
        loadHistory();
      });
    });

    document.querySelectorAll('[data-chart-karat]').forEach((button) => {
      const karat = button.getAttribute('data-chart-karat');
      button.classList.toggle('is-active', karat === state.karat);
      button.addEventListener('click', () => {
        state.karat = karat;
        document
          .querySelectorAll('[data-chart-karat]')
          .forEach((item) => item.classList.toggle('is-active', item === button));
        render();
      });
    });

    document.querySelectorAll('[data-chart-currency]').forEach((button) => {
      const currency = button.getAttribute('data-chart-currency');
      button.classList.toggle('is-active', currency === state.currency);
      button.addEventListener('click', () => {
        state.currency = currency;
        document
          .querySelectorAll('[data-chart-currency]')
          .forEach((item) => item.classList.toggle('is-active', item === button));
        render();
      });
    });

    const csvBtn = document.getElementById('chart-download-csv');
    if (csvBtn) {
      csvBtn.textContent = tx.csv;
      csvBtn.addEventListener('click', () => {
        const csv = buildChartCsv(activeSeries(), state);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gold-history-${state.karat}k-${state.currency}-${state.period}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    }

    const shareBtn = document.getElementById('chart-share-link');
    if (shareBtn) {
      shareBtn.textContent = tx.share;
      shareBtn.addEventListener('click', async () => {
        const link = `${window.location.origin}${window.location.pathname}${serializeChartQuery(state)}`;
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(link);
            shareBtn.textContent = tx.copied;
            window.setTimeout(() => {
              shareBtn.textContent = tx.share;
            }, 1200);
          }
        } catch {
          // no-op fallback
        }
      });
    }
  }

  async function loadHistory() {
    const range = PERIOD_TO_RANGE[state.period] || '30D';
    try {
      const response = await fetch(
        `/api/v1/prices/history?range=${encodeURIComponent(range)}&limit=5000`
      );
      if (!response.ok) {
        state.rawPoints = [];
        render();
        return;
      }
      const payload = await response.json();
      state.rawPoints = payload?.data?.points || [];
      render();
    } catch {
      state.rawPoints = [];
      render();
    }
  }

  setupControls();
  loadHistory();
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (window.location.pathname.includes('/chart/')) {
    window.addEventListener('DOMContentLoaded', setupPage, { once: true });
  }
}

export { PERIODS, KARAT_CODES, CURRENCIES };
