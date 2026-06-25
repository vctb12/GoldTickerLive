import { BASE_PATH, CONSTANTS, KARATS } from '../config/index.js';
import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { GoldChart } from '../components/chart.js';
import { renderFreshnessBadge } from '../components/FreshnessBadge.js';
import { getLiveFreshness, getMarketStatus } from '../lib/live-status.js';
import { formatPrice } from '../lib/formatter.js';
import { el, clear } from '../lib/safe-dom.js';

export const KARAT_INFO = {
  24: {
    en: '99.9% pure gold. Investment standard. Rarely used in jewelry due to softness.',
    ar: 'ذهب نقي بنسبة 99.9%. معيار استثماري. نادراً ما يُستخدم في المجوهرات بسبب الليونة.',
  },
  22: {
    en: '91.7% pure. Most common in UAE/GCC jewelry. Excellent balance of purity and durability.',
    ar: 'نقاء 91.7%. الأكثر شيوعاً في مجوهرات الإمارات والخليج. توازن ممتاز بين النقاء والمتانة.',
  },
  21: {
    en: '87.5% pure. Popular in Gulf jewelry. Slightly more durable than 22K.',
    ar: 'نقاء 87.5%. شائع في مجوهرات الخليج. أكثر متانة قليلاً من عيار 22.',
  },
  18: {
    en: '75% pure. Common in European-style and diamond jewelry. More scratch-resistant.',
    ar: 'نقاء 75%. شائع في المجوهرات الأوروبية ومجوهرات الألماس. أكثر مقاومة للخدش.',
  },
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

export function calculateKaratPricePerGram(xauUsdPerOz, karatCode, currency = 'AED') {
  const purity = KARATS.find((item) => item.code === String(karatCode))?.purity ?? 1;
  const usdPerGram = (Number(xauUsdPerOz) / CONSTANTS.TROY_OZ_GRAMS) * purity;
  return currency === 'AED' ? usdPerGram * CONSTANTS.AED_PEG : usdPerGram;
}

function getPageState() {
  const root = document.body;
  const karat = root.dataset.karat || '24';
  const lang = root.dataset.lang || 'en';
  return { karat, lang };
}

function makeHistoryRows(points, karat) {
  return points.map((point) => {
    const aed = calculateKaratPricePerGram(point.xauUsdPerOz, karat, 'AED');
    const usd = calculateKaratPricePerGram(point.xauUsdPerOz, karat, 'USD');
    return {
      date: new Date(point.timestampUtc).toISOString().slice(0, 10),
      aed,
      usd,
      changePct: point.changePct || 0,
      provider: point.provider || 'supabase',
      timestampUtc: point.timestampUtc,
      isFallback: Boolean(point.isFallback),
      isFresh: point.isFresh ?? null,
    };
  });
}

async function fetchHistory(days = '30D') {
  let response;
  try {
    response = await fetch(`/api/v1/prices/history?range=${days}&limit=120`);
  } catch {
    return [];
  }
  if (!response.ok) return [];
  const payload = await response.json();
  const points = payload?.data?.points || [];
  return points
    .map((point) => ({
      timestampUtc: point.timestampUtc,
      xauUsdPerOz: Number(point.xauUsdPerOz),
      provider: point.provider,
      isFallback: point.isFallback,
      isFresh: point.isFresh,
    }))
    .filter(
      (point) => Number.isFinite(point.xauUsdPerOz) && point.xauUsdPerOz > 0 && point.timestampUtc
    )
    .sort((a, b) => new Date(a.timestampUtc) - new Date(b.timestampUtc));
}

function renderTable(rows, lang) {
  const body = document.getElementById('karat-history-table-body');
  const fallback = document.getElementById('karat-history-fallback');
  if (!body) return;
  clear(body);
  if (!rows.length) {
    if (fallback) fallback.hidden = false;
    return;
  }
  if (fallback) fallback.hidden = true;
  let previous = null;
  rows.forEach((row) => {
    const changePct = previous ? ((row.aed - previous.aed) / previous.aed) * 100 : 0;
    previous = row;
    body.appendChild(
      el('tr', null, [
        el('td', null, [row.date]),
        el('td', null, [formatPrice(row.aed, 'AED', 2)]),
        el('td', null, [formatPrice(row.usd, 'USD', 2)]),
        el('td', null, [`${changePct.toFixed(2)}%`]),
      ])
    );
  });

  const faqPrice = document.getElementById('faq-live-price');
  if (faqPrice) {
    faqPrice.textContent =
      lang === 'ar'
        ? `آخر سعر مرجعي متاح هو ${formatPrice(rows[rows.length - 1].aed, 'AED', 2)} لكل غرام.`
        : `The latest available reference price is ${formatPrice(rows[rows.length - 1].aed, 'AED', 2)} per gram.`;
  }
}

function wireCalculator(karat, lang) {
  const gramsInput = document.getElementById('karat-calc-grams');
  const output = document.getElementById('karat-calc-output');
  if (!gramsInput || !output) return;
  gramsInput.addEventListener('input', () => {
    const grams = Number(gramsInput.value);
    const latestAed = Number(output.dataset.latestAed || 0);
    if (!Number.isFinite(grams) || grams <= 0 || !latestAed) {
      output.textContent = '—';
      return;
    }
    output.textContent = formatPrice(grams * latestAed, 'AED', 2);
  });

  const info = document.getElementById('karat-info');
  if (info) info.textContent = KARAT_INFO[karat]?.[lang] || KARAT_INFO[karat]?.en || '';
}

async function init() {
  const { karat, lang } = getPageState();
  mountSharedShell({ lang, depth: getShellDepth(), withSpotBar: true });
  injectBreadcrumbs('country');

  const title = document.getElementById('karat-page-title');
  if (title)
    title.textContent = `${karat}K ${lang === 'ar' ? 'سعر الذهب في الإمارات اليوم' : 'Gold Price in UAE Today'}`;

  const history = await fetchHistory('30D');
  const rows = makeHistoryRows(history, karat);
  renderTable(rows, lang);
  wireCalculator(karat, lang);

  const latest = rows[rows.length - 1];
  const aedEl = document.getElementById('karat-price-aed');
  const usdEl = document.getElementById('karat-price-usd');
  const freshnessSlot = document.getElementById('karat-freshness');
  if (latest && aedEl && usdEl) {
    aedEl.textContent = formatPrice(latest.aed, 'AED', 2);
    usdEl.textContent = formatPrice(latest.usd, 'USD', 2);
    const calcOut = document.getElementById('karat-calc-output');
    if (calcOut) calcOut.dataset.latestAed = String(latest.aed);
    if (freshnessSlot) {
      const freshness = getLiveFreshness({
        updatedAt: latest.timestampUtc,
        lang,
        isFallback: latest.isFallback,
        isFresh: latest.isFresh,
      });
      freshnessSlot.replaceChildren(
        renderFreshnessBadge({
          lang,
          state: freshness.key,
          source: latest.provider,
          updatedAt: latest.timestampUtc,
          marketOpen: getMarketStatus().isOpen,
        })
      );
    }
  }

  const miniChart = new GoldChart('karat-mini-chart', lang);
  miniChart.setCustomData(
    rows.map((row) => ({
      time: row.date,
      value: Number(row.aed.toFixed(4)),
    }))
  );
  miniChart.setRange('1W');
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init, { once: true });
}
