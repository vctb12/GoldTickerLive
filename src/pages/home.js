/**
 * Landing page entry point.
 * Fetches live gold + FX data in parallel, renders the hero live card
 * and GCC quick-price grid. Cache-first: shows cached data instantly.
 */
import {
  CONSTANTS,
  BASE_PATH,
  KARATS,
  COUNTRIES,
  TRANSLATIONS,
  getKaratCount,
  getKaratCountLabel,
  getKaratRangeLabel,
} from '../config/index.js';
import * as api from '../lib/api.js';
import * as cache from '../lib/cache.js';
import * as calc from '../lib/price-calculator.js';
import * as fmt from '../lib/formatter.js';
import { getMarketStatus, getLiveFreshness, applyMarketClosedOverlay } from '../lib/live-status.js';
import { createRealtimePricingEngine } from '../lib/realtime-pricing-engine.js';
import { REALTIME_POLLING_DEFAULTS } from '../lib/realtime-config.js';
import { isRealtimeDebugEnabled } from '../lib/realtime-debug.js';
import { maybeTrackRealtimeSlo } from '../lib/realtime-slo-analytics.js';
import {
  createPrimaryQuoteProvider,
  createSecondaryQuoteProvider,
} from '../lib/quote-providers/create-providers.js';
import { resolveGoldIsFresh } from '../lib/quote-freshness-bridge.js';
import { formatProviderLabel } from '../lib/provider-labels.js';
import { updateTicker } from '../components/ticker.js';
import { updateSpotBar } from '../components/spotBar.js';
import { mountSharedShell } from '../components/site-shell.js';
import { renderAdSlot } from '../components/adSlot.js';
import { renderFreshnessBadge } from '../components/FreshnessBadge.js';
import { renderRealtimeSlaPanel } from '../components/RealtimeSlaPanel.js';
import { renderMethodologySection } from '../components/MethodologySection.js';
import { renderLocationGuideSection } from '../components/LocationGuideSection.js';
import '../lib/reveal.js';
import { initPageEnter } from '../lib/page-enter.js';
import { countUp } from '../lib/count-up.js';
import { animatePrice } from '../lib/price-motion.js';
import { copyWithToast } from '../lib/copy-toast.js';
import { mountQuickConvertWidget } from '../components/QuickConvertWidget.js';
import { initSwUpdateToast } from '../lib/sw-update-toast.js';
import { showDataStatusBanner, hideDataStatusBanner } from '../lib/data-status-banner.js';
import { mountSkeleton } from '../components/skeleton.js';
import { clear, el, safeHref } from '../lib/safe-dom.js';
import { track, EVENTS } from '../lib/analytics.js';
import { enforceCanonicalOnDocument } from '../seo/canonical.js';
import { enforceHreflangAlternates } from '../seo/hreflang.js';
import { buildMethodologyFaqSchema, injectFaqSchema } from '../seo/faq-schema.js';
import { buildHomeTrackerHref } from '../lib/cross-page-links.js';
import { getBaselineHistory } from '../lib/historical-data.js';
import { applyTrackerHandoffToIds, HOME_DEFAULT_TRACKER_LINK_IDS } from '../lib/page-handoff.js';
import { serializeCalculatorUrlState } from './calculator/url-state.js';

// ── Constants ──────────────────────────────────────────────────────────────
const LANG_KEY = 'user_prefs';
const SKELETON_TIMEOUT_MS = 8000;
const TOLA_GRAMS = 11.6638; // 1 tola = 11.6638 grams (international standard)

// Multiply per-gram AED price by this to get the chosen unit price.
const KARAT_STRIP_UNIT_MULT = {
  gram: 1,
  tola: TOLA_GRAMS,
  oz: CONSTANTS.TROY_OZ_GRAMS,
};

// Maps freshness key → home.source* translation key
const SOURCE_TX_KEY = {
  live: 'sourceLive',
  delayed: 'sourceDelayed',
  cached: 'sourceCached',
  stale: 'sourceStale',
  fallback: 'sourceFallback',
  unavailable: 'sourceUnavailable',
  closed: 'sourceClosed',
};

// ── State ──────────────────────────────────────────────────────────────────
let lang = 'en';
let goldPrice = null;
let dayOpenPrice = null;
let rates = {};
let goldUpdatedAt = null;
let goldIsFresh = null;
let goldIsFallback = null;
let goldProviderId = 'primary-provider';
let _realtimeSnapshot = null;
let _realtimeEngine = null;
let _refreshTimer = null;
let _freshnessTimer = null;
let _quickConvert = null;
const _sessionPriceHistory = []; // [{price, ts}] — rolling 120-point window for sparkline
let _homeChart = null; // GoldChart instance for the home-chart section

// Karat selected for tracker/calculator deep links — persisted in user_prefs
let homeTrackerKarat = (() => {
  try {
    const k = JSON.parse(localStorage.getItem(LANG_KEY) || '{}').homeTrackerKarat;
    return ['24', '22', '21', '18', '14'].includes(k) ? k : '24';
  } catch {
    return '24';
  }
})();

// Karat strip unit preference — persisted in user_prefs localStorage
let karatStripUnit = (() => {
  try {
    return JSON.parse(localStorage.getItem(LANG_KEY) || '{}').karatStripUnit || 'gram';
  } catch {
    return 'gram';
  }
})();

function getLang() {
  try {
    // The /ar/ path is the canonical Arabic homepage — treat it as Arabic
    // regardless of query/localStorage so the indexable page renders in AR.
    if (/^\/ar(\/|$)/.test(window.location.pathname)) return 'ar';
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang === 'ar' || urlLang === 'en') return urlLang;
    const p = JSON.parse(localStorage.getItem(LANG_KEY) || '{}');
    return p.lang || 'en';
  } catch {
    return 'en';
  }
}

// Directory depth from the site root, so the shared shell builds correct
// relative links. The homepage app serves both `/` (depth 0) and the indexable
// Arabic homepage `/ar/` (depth 1).
function getDepth() {
  return /^\/ar(\/|$)/.test(window.location.pathname) ? 1 : 0;
}

function saveLang(l) {
  try {
    const p = JSON.parse(localStorage.getItem(LANG_KEY) || '{}');
    p.lang = l;
    localStorage.setItem(LANG_KEY, JSON.stringify(p));
  } catch {}
}

// ── Market status ──────────────────────────────────────────────────────────
// Canonical gold-market schedule (Sun 22:00 UTC – Fri 21:00 UTC) lives in
// `src/lib/live-status.js`. Phase 4 of §22b removed the duplicate local
// implementation; this page consumes the shared primitive directly.

// ── Translations ────────────────────────────────────────────────────────────
function tx(key) {
  const fullKey = 'home.' + key;
  return TRANSLATIONS[lang]?.[fullKey] ?? TRANSLATIONS.en?.[fullKey] ?? key;
}

function txGlobal(key) {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
}

// ── Regional groupings for homepage display ────────────────────────────────
const GCC = COUNTRIES.filter((c) => c.group === 'gcc');
const MENA = COUNTRIES.filter((c) => ['gcc', 'levant', 'africa'].includes(c.group));
const GLOBAL = COUNTRIES;
// Complete map of country-code → countries/ directory slug.
// Only codes listed here have a dedicated page; the rest are rendered without a link.
const COUNTRY_SLUGS = {
  AE: 'uae',
  SA: 'saudi-arabia',
  KW: 'kuwait',
  QA: 'qatar',
  BH: 'bahrain',
  OM: 'oman',
  JO: 'jordan',
  LB: 'lebanon',
  IQ: 'iraq',
  SY: 'syria',
  PS: 'palestine',
  YE: 'yemen',
  EG: 'egypt',
  LY: 'libya',
  TN: 'tunisia',
  DZ: 'algeria',
  MA: 'morocco',
  SD: 'sudan',
  TR: 'turkey',
  PK: 'pakistan',
  IN: 'india',
};
let homeRegion = (() => {
  try {
    return JSON.parse(localStorage.getItem('user_prefs') || '{}').homeRegion || 'gcc';
  } catch {
    return 'gcc';
  }
})();

// ── Render helpers ─────────────────────────────────────────────────────────
function setTextById(id, text) {
  const target = document.getElementById(id);
  if (target) target.textContent = text;
}

function applyRegionTabA11yLabels() {
  const tablist = document.querySelector('.gcc-region-tabs');
  if (tablist) tablist.setAttribute('aria-label', tx('gccTabListAria'));
  const tabLabelMap = {
    gcc: tx('gccTabGccAria'),
    mena: tx('gccTabMenaAria'),
    global: tx('gccTabGlobalAria'),
  };
  document.querySelectorAll('.gcc-region-tab').forEach((tab) => {
    const region = tab.dataset.region;
    const label = tabLabelMap[region];
    if (label) {
      tab.setAttribute('aria-label', label);
      return;
    }
    tab.setAttribute('aria-label', tx('gccTabFallbackAria'));
    console.warn('[home] Unrecognized region tab value for ARIA label:', region);
  });
}

function formatCountrySearchEmpty(query = '') {
  const trimmed = query.trim();
  if (!trimmed) return tx('countrySearchEmpty');
  return tx('countrySearchEmptyQuery').replace('{query}', trimmed);
}

function ensureHeroLoadingSkeletons() {
  mountSkeleton(document.getElementById('hlc-updated'), 'freshnessStrip');
  mountSkeleton(document.getElementById('karat-strip-updated'), 'freshnessStrip');
}

function persistHomeTrackerKarat(karat) {
  try {
    const p = JSON.parse(localStorage.getItem(LANG_KEY) || '{}');
    p.homeTrackerKarat = karat;
    localStorage.setItem(LANG_KEY, JSON.stringify(p));
  } catch (_) {}
}

/** Deep-link to calculator with homepage karat + AED context. */
function buildCalculatorHref(overrides = {}) {
  return `calculator.html${serializeCalculatorUrlState({
    karat: homeTrackerKarat,
    currency: 'AED',
    mode: 'value',
    valueMode: 'weight',
    ...overrides,
  })}`;
}

function updateKaratStripSelection() {
  document.querySelectorAll('.karat-strip-item').forEach((item) => {
    const karat = item.id?.replace('kstrip-', '');
    const isSelectable = ['24', '22', '21', '18', '14'].includes(karat);
    const selected = isSelectable && karat === homeTrackerKarat;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-pressed', selected ? 'true' : 'false');
    if (isSelectable) {
      item.setAttribute('aria-label', tx('karatStripSelectAria').replace('{karat}', karat));
    }
  });
}

function bindKaratStripSelection() {
  document.querySelectorAll('.karat-strip-item').forEach((item) => {
    const karat = item.id?.replace('kstrip-', '');
    if (!['24', '22', '21', '18', '14'].includes(karat)) return;
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', tx('karatStripSelectAria').replace('{karat}', karat));
    const selectKarat = (event) => {
      if (event.target.closest('.kstrip-copy-btn')) return;
      homeTrackerKarat = karat;
      persistHomeTrackerKarat(karat);
      updateKaratStripSelection();
      syncCrossPageLinks();
    };
    item.addEventListener('click', selectKarat);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectKarat(event);
      }
    });
  });
  updateKaratStripSelection();
}

function hasRealtimePathFailure() {
  return _realtimeSnapshot?.quote?.providerPathSuccessful === false;
}

function getFreshnessMeta() {
  const freshness = getLiveFreshness({
    updatedAt: goldUpdatedAt,
    lang,
    hasLiveFailure: hasRealtimePathFailure(),
    isFallback: goldIsFallback,
    isFresh: goldIsFresh,
  });
  // Market-closed overlay (mirrors src/tracker/freshness.js): the surfaced state
  // must read "closed" even for recent data when the market is closed, per
  // docs/freshness-contract.md. Prevents the hero from pulsing "Live" while the
  // separate market pill says "Closed".
  const key = applyMarketClosedOverlay(freshness.key);
  const statusText = tx(SOURCE_TX_KEY[key] || 'sourceCached');
  const sourceText = formatProviderLabel(goldProviderId);
  return {
    freshnessTime: freshness.timeText,
    ageText: freshness.ageText,
    isLive: key === 'live',
    key,
    statusText,
    sourceText,
  };
}

/** Derive the freshness CSS data attribute value based on exact age.
 * More granular than the 4-tier key: adds 'amber' class when 5–30 min old.
 * @param {number} ageMs
 * @returns {'live'|'amber'|'stale'|'unavailable'}
 */
function freshnessAgeClass(ageMs) {
  if (!Number.isFinite(ageMs)) return 'unavailable';
  const MIN5 = 5 * 60 * 1000;
  const MIN30 = 30 * 60 * 1000;
  if (ageMs < MIN5) return 'live';
  if (ageMs < MIN30) return 'amber';
  return 'stale';
}

/** Tick the freshness timestamp display every second.
 * DOM is only mutated when the displayed text or color class would change,
 * keeping CPU/battery impact minimal on mobile devices.
 */
function startFreshnessTimer() {
  if (_freshnessTimer) clearInterval(_freshnessTimer);
  let prevHlcText = '';
  let prevKstripText = '';
  _freshnessTimer = setInterval(() => {
    if (!goldPrice || !goldUpdatedAt) return;
    const { ageText, statusText, sourceText, key } = getFreshnessMeta();
    const ageClass = freshnessAgeClass(getLiveFreshness({ updatedAt: goldUpdatedAt, lang }).ageMs);
    const hlcText = `${statusText} · ${sourceText} · ${ageText}`;
    const kstripText = `${txGlobal('freshness.statusLabel')}: ${statusText} · ${tx('source')}: ${sourceText} · ${tx('updated')}: ${ageText}`;
    const hlcEl = document.getElementById('hlc-updated');
    if (hlcEl && hlcText !== prevHlcText) {
      hlcEl.textContent = hlcText;
      hlcEl.dataset.freshnessKey = key;
      hlcEl.dataset.freshnessAge = ageClass;
      prevHlcText = hlcText;
    }
    const kstripEl = document.getElementById('karat-strip-updated');
    if (kstripEl && kstripText !== prevKstripText) {
      kstripEl.textContent = kstripText;
      kstripEl.dataset.freshnessKey = key;
      kstripEl.dataset.freshnessAge = ageClass;
      prevKstripText = kstripText;
    }
  }, 1_000);
}

// ── Render hero live card ──────────────────────────────────────────────────
function renderHeroCard() {
  if (!goldPrice) return;
  const k24 = KARATS.find((k) => k.code === '24');
  const k22 = KARATS.find((k) => k.code === '22');
  const k21 = KARATS.find((k) => k.code === '21');
  const k18 = KARATS.find((k) => k.code === '18');
  if (!k24 || !k22 || !k21 || !k18) {
    console.warn('[home] Missing required karat config (24/22/21/18); skipping hero card render');
    return;
  }

  const usd24oz = goldPrice;
  const aed24g = calc.usdPerGram(goldPrice, k24.purity) * CONSTANTS.AED_PEG;
  const aed22g = calc.usdPerGram(goldPrice, k22.purity) * CONSTANTS.AED_PEG;
  const aed21g = calc.usdPerGram(goldPrice, k21.purity) * CONSTANTS.AED_PEG;
  const aed18g = calc.usdPerGram(goldPrice, k18.purity) * CONSTANTS.AED_PEG;

  // Accumulate session price history for sparkline (rolling 120-point window)
  _sessionPriceHistory.push({ price: usd24oz, ts: Date.now() });
  if (_sessionPriceHistory.length > 120) _sessionPriceHistory.shift();
  drawHeroSparkline();

  // Feed live tick into the home chart if it's loaded
  _homeChart?.addPoint(usd24oz, Date.now());

  // Update sticky spot bar
  updateSpotBar({
    xauUsd: usd24oz,
    aed24kGram: aed24g,
    updatedAt: goldUpdatedAt,
    hasLiveFailure: hasRealtimePathFailure(),
    isFallback: goldIsFallback,
    isFresh: goldIsFresh,
  });

  const priceEl = document.getElementById('hlc-price');
  const heroCard = document.getElementById('hero-live-card');
  if (priceEl) {
    const prev = parseFloat(String(priceEl.textContent || '').replace(/[^0-9.-]/g, ''));
    const direction =
      Number.isFinite(prev) && prev !== usd24oz ? (usd24oz > prev ? 'up' : 'down') : null;

    const { key } = getFreshnessMeta();
    const isLive = key === 'live';

    animatePrice(priceEl, usd24oz, {
      decimals: 2,
      format: (n) => fmt.formatPrice(n, 'USD', 2),
      pulse: true,
      pulseTarget: priceEl,
      terminalRoot: heroCard,
      direction,
      isLive,
    });

    priceEl.classList.remove('hlc-price--loading');

    priceEl.classList.remove('hlc-price--loading');
  }

  const directionEl = document.getElementById('hlc-direction');
  if (directionEl && dayOpenPrice && goldPrice) {
    const chg = goldPrice - dayOpenPrice;
    directionEl.hidden = false;
    directionEl.textContent = chg >= 0 ? '▲' : '▼';
    directionEl.className =
      'hlc-direction ' + (chg >= 0 ? 'hlc-direction--up' : 'hlc-direction--down');
  } else if (directionEl) {
    directionEl.hidden = true;
  }
  document.getElementById('hero-live-card')?.removeAttribute('aria-busy');
  const { ageText, isLive, statusText, sourceText, key } = getFreshnessMeta();
  const ageClass = freshnessAgeClass(getLiveFreshness({ updatedAt: goldUpdatedAt, lang }).ageMs);
  const hlcUpdatedEl = document.getElementById('hlc-updated');
  if (hlcUpdatedEl) {
    hlcUpdatedEl.classList.remove(
      'skeleton-text',
      'skeleton-inline',
      'shell-skeleton-freshness-strip'
    );
    hlcUpdatedEl.removeAttribute('aria-busy');
    hlcUpdatedEl.textContent = `${statusText} · ${sourceText} · ${ageText}`;
    hlcUpdatedEl.dataset.freshnessKey = key;
    hlcUpdatedEl.dataset.freshnessAge = ageClass;
  } else {
    setTextById('hlc-updated', `${statusText} · ${sourceText} · ${ageText}`);
  }
  const kstripUpdatedEl = document.getElementById('karat-strip-updated');
  if (kstripUpdatedEl) {
    kstripUpdatedEl.textContent = `${txGlobal('freshness.statusLabel')}: ${statusText} · ${tx('source')}: ${sourceText} · ${tx('updated')}: ${ageText}`;
    kstripUpdatedEl.dataset.freshnessKey = key;
    kstripUpdatedEl.dataset.freshnessAge = ageClass;
  } else {
    setTextById(
      'karat-strip-updated',
      `${txGlobal('freshness.statusLabel')}: ${statusText} · ${tx('source')}: ${sourceText} · ${tx('updated')}: ${ageText}`
    );
  }

  // Change vs day open — show absolute + percentage
  const changeEl = document.getElementById('hlc-change');
  if (changeEl && dayOpenPrice && goldPrice) {
    const absChg = goldPrice - dayOpenPrice;
    const pctChg = (absChg / dayOpenPrice) * 100;
    const signStr = absChg >= 0 ? '+' : '−';
    const absFmt = fmt.formatPrice(Math.abs(absChg), 'USD', 2);
    const pctFmt = Math.abs(pctChg).toFixed(2);
    changeEl.textContent = `${signStr}${absFmt}  ${signStr}${pctFmt}%`;
    changeEl.className = 'hlc-change ' + (absChg >= 0 ? 'badge-up' : 'badge-down');
    changeEl.hidden = false;
  }

  // Stats row: Day Open / High / Low
  const statsRowEl = document.getElementById('hlc-stats-row');
  if (statsRowEl && dayOpenPrice && goldPrice) {
    const high = Math.max(goldPrice, dayOpenPrice);
    const low = Math.min(goldPrice, dayOpenPrice);
    const openEl = document.getElementById('hlc-stat-open');
    const highEl = document.getElementById('hlc-stat-high');
    const lowEl = document.getElementById('hlc-stat-low');
    if (openEl) openEl.textContent = fmt.formatPrice(dayOpenPrice, 'USD', 2);
    if (highEl) highEl.textContent = fmt.formatPrice(high, 'USD', 2);
    if (lowEl) lowEl.textContent = fmt.formatPrice(low, 'USD', 2);
    statsRowEl.hidden = false;
  }

  // Day high/low (legacy element — keep updated for backward compat)
  const hlHlEl = document.getElementById('hlc-high-low');
  if (hlHlEl && dayOpenPrice && goldPrice) {
    const high = Math.max(goldPrice, dayOpenPrice);
    const low = Math.min(goldPrice, dayOpenPrice);
    hlHlEl.textContent = `H: ${fmt.formatPrice(high, 'USD', 2)} · L: ${fmt.formatPrice(low, 'USD', 2)}`;
    hlHlEl.hidden = true; // hidden — superseded by hlc-stats-row
  }

  // Market status
  const statusEl = document.getElementById('hlc-market-status');
  if (statusEl) {
    const { isOpen } = getMarketStatus();
    statusEl.textContent = isOpen ? tx('marketOpen') : tx('marketClosed');
    statusEl.className = 'hlc-market ' + (isOpen ? 'hlc-market--open' : 'hlc-market--closed');
  }

  // Update bottom ticker
  updateTicker({
    xauUsd: goldPrice,
    uae24k: aed24g,
    uae22k: aed22g,
    uae21k: aed21g,
    uae18k: aed18g,
    updatedAt: goldUpdatedAt,
    hasLiveFailure: hasRealtimePathFailure(),
    isFallback: goldIsFallback,
    isFresh: goldIsFresh,
  });

  // Update karat strip (single homepage karat table)
  renderKaratStrip(k18);
  _quickConvert?.recalc?.();

  // Update freshness banner
  const bar = document.getElementById('home-freshness-bar');
  const barText = document.getElementById('hfb-text');
  if (bar && barText) {
    const stale = !isLive;
    const timeStr = goldUpdatedAt ? fmt.formatTimestampShort(goldUpdatedAt, lang) : '—';
    bar.classList.toggle('home-freshness-bar--stale', stale);
    barText.textContent = stale
      ? `${txGlobal('freshness.statusLabel')}: ${statusText} · ${tx('source')}: ${sourceText} · ${tx('updated')}: ${timeStr}`
      : `${txGlobal('freshness.statusLabel')}: ${statusText} · ${tx('source')}: ${sourceText} · ${tx('updated')}: ${timeStr}`;
    bar.removeAttribute('hidden');
  }
  renderHomeTrustAddons();
  initExportButton();
}

// ── Hero sparkline ─────────────────────────────────────────────────────────
function drawHeroSparkline() {
  const container = document.getElementById('hlc-sparkline');
  if (!container) return;
  const prices = _sessionPriceHistory.map((p) => p.price);
  if (prices.length < 3) return;

  const W = 280;
  const H = 56;
  const PAD = 3;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || prices[0] * 0.0005;

  const toX = (i) => PAD + (i / (prices.length - 1)) * (W - PAD * 2);
  const toY = (p) => H - PAD - ((p - min) / range) * (H - PAD * 2);

  const pts = prices.map((p, i) => `${toX(i).toFixed(1)},${toY(p).toFixed(1)}`);
  const isUp = prices[prices.length - 1] >= prices[0];
  const stroke = isUp ? 'var(--color-up)' : 'var(--color-down)';
  const fill = isUp ? 'rgb(74 222 128 / 12%)' : 'rgb(239 68 68 / 12%)';

  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'hlc-spark-svg');

  const lastX = toX(prices.length - 1).toFixed(1);
  const firstX = toX(0).toFixed(1);
  const area = document.createElementNS(NS, 'path');
  area.setAttribute('d', `M ${pts.join(' L ')} L ${lastX},${H} L ${firstX},${H} Z`);
  area.setAttribute('fill', fill);
  svg.append(area);

  const line = document.createElementNS(NS, 'polyline');
  line.setAttribute('points', pts.join(' '));
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', stroke);
  line.setAttribute('stroke-width', '1.5');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-linejoin', 'round');
  svg.append(line);

  const [lx, ly] = pts[pts.length - 1].split(',').map(Number);
  const dot = document.createElementNS(NS, 'circle');
  dot.setAttribute('cx', lx.toFixed(1));
  dot.setAttribute('cy', ly.toFixed(1));
  dot.setAttribute('r', '3');
  dot.setAttribute('fill', stroke);
  dot.setAttribute('class', 'hlc-spark-dot');
  svg.append(dot);

  container.replaceChildren(svg);
}

// ── CSV export from session history ────────────────────────────────────────
function initExportButton() {
  const btn = document.getElementById('hlc-export-btn');
  if (!btn || _sessionPriceHistory.length < 2) return;
  btn.hidden = false;
  btn.onclick = () => {
    const k24 = KARATS.find((k) => k.code === '24');
    const purity = k24?.purity ?? 1;
    const rows = [['Timestamp', 'XAU/USD', 'AED/24K gram']];
    for (const { price, ts } of _sessionPriceHistory) {
      const aed = calc.usdPerGram(price, purity) * CONSTANTS.AED_PEG;
      rows.push([new Date(ts).toISOString(), price.toFixed(2), aed.toFixed(4)]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gold-price-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    track(EVENTS.EXPORT_CLICK, { surface: 'home-hero', export_type: 'csv' });
  };
}

// ── Historical price trend section ─────────────────────────────────────────
function renderPriceTrend() {
  const grid = document.getElementById('home-trend-grid');
  if (!grid) return;

  const k24 = KARATS.find((k) => k.code === '24');
  const purity = k24?.purity ?? 1;

  // Last 13 baseline entries → 12 month-over-month changes
  const baseline = getBaselineHistory();
  const slice = baseline.slice(-13);

  const cards = [];
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1];
    const curr = slice[i];
    const pctChange = ((curr.price - prev.price) / prev.price) * 100;
    const aedPerGram = calc.usdPerGram(curr.price, purity) * CONSTANTS.AED_PEG;

    // Parse 'YYYY-MM' → short month label
    const [year, month] = curr.date.split('-');
    const monthLabel = new Date(Number(year), Number(month) - 1, 1).toLocaleString('en', {
      month: 'short',
      year: '2-digit',
    });

    const isUp = pctChange >= 0;
    const sign = isUp ? '+' : '';
    const pctStr = `${sign}${pctChange.toFixed(1)}%`;
    const priceStr = `$${curr.price.toLocaleString('en', { maximumFractionDigits: 0 })}`;
    const aedStr = `AED ${aedPerGram.toFixed(2)}`;

    const card = el('div', {
      class: `price-trend-card ${isUp ? 'price-trend-card--up' : 'price-trend-card--down'}`,
    });
    const monthEl = el('span', { class: 'price-trend-month' });
    monthEl.textContent = monthLabel;
    const priceEl = el('span', { class: 'price-trend-price' });
    priceEl.textContent = priceStr;
    const aedEl = el('span', { class: 'price-trend-aed' });
    aedEl.textContent = aedStr;
    const changeEl = el('span', {
      class: `price-trend-change price-trend-change--${isUp ? 'up' : 'down'}`,
    });
    changeEl.textContent = pctStr;
    card.replaceChildren(monthEl, priceEl, aedEl, changeEl);
    cards.push(card);
  }

  grid.replaceChildren(...cards);
  grid.removeAttribute('aria-busy');

  // Apply i18n to section header
  const kicker = document.getElementById('home-trend-kicker');
  const title = document.getElementById('home-trend-title');
  const sub = document.getElementById('home-trend-sub');
  if (kicker) kicker.textContent = tx('priceTrendKicker');
  if (title) title.textContent = tx('priceTrendTitle');
  if (sub) sub.textContent = tx('priceTrendSub');
}

// ── Home interactive chart ──────────────────────────────────────────────────
function initHomeChart() {
  const wrap = document.getElementById('home-chart-wrap');
  if (!wrap) return;

  // Apply i18n to section header and buttons
  const kicker = document.getElementById('home-chart-kicker');
  const title = document.getElementById('home-chart-title');
  const sub = document.getElementById('home-chart-sub');
  const btn1y = document.getElementById('home-chart-btn-1y');
  const btn3y = document.getElementById('home-chart-btn-3y');
  const btnAll = document.getElementById('home-chart-btn-all');
  if (kicker) kicker.textContent = tx('chartKicker');
  if (title) title.textContent = tx('chartTitle');
  if (sub) sub.textContent = tx('chartSub');
  if (btn1y) btn1y.textContent = tx('chartRange1Y');
  if (btn3y) btn3y.textContent = tx('chartRange3Y');
  if (btnAll) btnAll.textContent = tx('chartRangeAll');

  // Lazy-load chart when section scrolls into view
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();

      import('../components/chart.js')
        .then(({ GoldChart }) => {
          const container = document.getElementById('home-chart-container');
          if (!container) return;
          container.removeAttribute('aria-busy');
          _homeChart = new GoldChart('home-chart-container', lang);
          _homeChart.setRange('ALL');

          // Wire range button clicks
          const rangeGroup = document.getElementById('home-chart-ranges');
          if (rangeGroup) {
            rangeGroup.addEventListener('click', (e) => {
              const btn = e.target.closest('.home-chart-range-btn');
              if (!btn || !_homeChart) return;
              const range = btn.dataset.range;
              rangeGroup.querySelectorAll('.home-chart-range-btn').forEach((b) => {
                b.classList.toggle('is-active', b === btn);
              });
              _homeChart.setRange(range);
            });
          }
        })
        .catch(() => {});
    },
    { threshold: 0.1 }
  );
  observer.observe(wrap);
}

function renderHomeTrustAddons() {
  const freshnessSlot = document.getElementById('home-freshness-badge-slot');
  if (freshnessSlot) {
    const freshness = getLiveFreshness({
      updatedAt: goldUpdatedAt,
      lang,
      hasLiveFailure: hasRealtimePathFailure(),
      isFallback: goldIsFallback,
      isFresh: goldIsFresh,
    });
    freshnessSlot.replaceChildren(
      renderFreshnessBadge({
        lang,
        state: freshness.key,
        source: formatProviderLabel(goldProviderId),
        updatedAt: goldUpdatedAt,
        marketOpen: getMarketStatus().isOpen,
        className: 'home-freshness-badge',
        t: txGlobal,
      })
    );
  }

  renderHomeRealtimePanels();
}

function renderHomeRealtimePanels() {
  const slaMount = document.getElementById('home-realtime-sla-slot');
  if (slaMount) {
    if (!isRealtimeDebugEnabled()) {
      slaMount.replaceChildren();
      return;
    }
    slaMount.replaceChildren(
      renderRealtimeSlaPanel({
        snapshot: _realtimeSnapshot,
        t: txGlobal,
        className: 'home-realtime-sla-panel',
      })
    );
  }
}

function mountHomeQuickConvert() {
  const mount = document.getElementById('home-quick-convert-mount');
  if (!mount) return;
  _quickConvert = mountQuickConvertWidget({
    lang,
    // Pass a live getter, not a snapshot: goldPrice is null until the first
    // price (cache-boot or live) lands, and the later recalc() calls must see
    // the current value instead of the null captured at mount time.
    getSpot: () => goldPrice,
    t: (key) => tx(key),
    mount,
  });
}

function renderHomeAdditiveSections() {
  const methodologyMount = document.getElementById('home-methodology-mount');
  if (methodologyMount) {
    methodologyMount.replaceChildren(
      renderMethodologySection({
        t: txGlobal,
        className: 'home-methodology-section',
      })
    );
  }

  const locationMount = document.getElementById('home-location-guides-mount');
  if (locationMount) {
    locationMount.replaceChildren(
      renderLocationGuideSection({
        lang,
        t: txGlobal,
        className: 'home-location-guides-section',
      })
    );
  }
}

// ── Render karat price strip ───────────────────────────────────────────────
function renderKaratStrip(k18Ref) {
  if (!goldPrice) return;
  const AED = CONSTANTS.AED_PEG;
  const k18 = k18Ref || KARATS.find((k) => k.code === '18');
  const k21 = KARATS.find((k) => k.code === '21');
  const k22 = KARATS.find((k) => k.code === '22');
  const k24 = KARATS.find((k) => k.code === '24');
  const k14 = KARATS.find((k) => k.code === '14');

  // Skip rendering if required core karat data is not available; 14K is optional.
  if (!k18 || !k21 || !k22 || !k24) return;

  // Apply unit multiplier to base AED/gram price.
  const mult = KARAT_STRIP_UNIT_MULT[karatStripUnit] || 1;

  const prices = {
    24: calc.usdPerGram(goldPrice, k24.purity) * AED * mult,
    22: calc.usdPerGram(goldPrice, k22.purity) * AED * mult,
    21: calc.usdPerGram(goldPrice, k21.purity) * AED * mult,
    18: calc.usdPerGram(goldPrice, k18.purity) * AED * mult,
  };
  if (k14) prices[14] = calc.usdPerGram(goldPrice, k14.purity) * AED * mult;

  for (const [k, v] of Object.entries(prices)) {
    const valueElement = document.getElementById(`kstrip-${k}-val`);
    if (valueElement) {
      valueElement.className = 'karat-strip-v';
      // Smooth count-up with directional flash when price changes.
      countUp(valueElement, v, {
        decimals: 2,
        format: (n) => fmt.formatPrice(n, 'AED', 2),
        pulse: true,
        pulseTarget: valueElement.closest('.karat-strip-item'),
      });
    }
    // Update copy button's data-copy attribute so clipboard gets the current value.
    const copyBtn = document.getElementById(`kstrip-${k}-copy`);
    if (copyBtn) {
      const formatted = fmt.formatPrice(v, 'AED', 2);
      copyBtn.dataset.copy = formatted;
      copyBtn.setAttribute('aria-label', tx('karatCopyAriaLabel').replace('{karat}', k));
    }
  }

  // Update the strip label to reflect the current unit.
  const labelKey =
    karatStripUnit === 'tola'
      ? 'karatStripLabelTola'
      : karatStripUnit === 'oz'
        ? 'karatStripLabelOz'
        : 'karatStripLabelGram';
  setTextById('karat-strip-label', tx(labelKey));

  const tooltip = tx('karatHoverTooltip');
  document.querySelectorAll('.karat-strip-item').forEach((item) => {
    item.dataset.tooltip = tooltip;
  });
}

// ── Render GCC grid ────────────────────────────────────────────────────────
function renderGCCGrid() {
  const grid = document.getElementById('gcc-quick-grid');
  if (!grid || !goldPrice) return;
  const k22 = KARATS.find((k) => k.code === '22');

  // Select countries based on current region filter
  const regionLists = { gcc: GCC, mena: MENA, global: GLOBAL };
  const countries = regionLists[homeRegion] || GCC;
  const { sourceText } = getFreshnessMeta();
  const fragment = document.createDocumentFragment();

  clear(grid);
  countries.forEach((c, index) => {
    let price = '—';
    if (c.currency === 'AED') {
      price = fmt.formatPrice(calc.usdPerGram(goldPrice, k22.purity) * CONSTANTS.AED_PEG, 'AED', 2);
    } else if (rates[c.currency]) {
      price = fmt.formatPrice(
        calc.usdPerGram(goldPrice, k22.purity) * rates[c.currency],
        c.currency,
        c.decimals
      );
    }
    const name = lang === 'ar' ? c.nameAr : c.nameEn;
    const slug = COUNTRY_SLUGS[c.code] ?? null;

    const headerChildren = [
      el('span', { class: 'gcc-flag', 'aria-hidden': 'true' }, c.flag),
      el('div', { class: 'gcc-meta' }, [
        el('span', { class: 'gcc-name' }, name),
        el('span', { class: 'gcc-currency' }, c.currency),
      ]),
    ];
    if (dayOpenPrice && goldPrice) {
      const chg = ((goldPrice - dayOpenPrice) / dayOpenPrice) * 100;
      const sign = chg >= 0 ? '+' : '';
      const cls = chg >= 0 ? 'badge-up' : 'badge-down';
      headerChildren.push(
        el('span', { class: `gcc-change badge ${cls}` }, `${sign}${chg.toFixed(2)}%`)
      );
    }

    const cardChildren = [
      el('div', { class: 'gcc-card-header' }, headerChildren),
      el('div', { class: 'gcc-price' }, price),
      el('div', { class: 'gcc-unit' }, `${tx('perGram')} · 22K`),
      el('div', { class: 'gcc-source' }, sourceText),
    ];
    if (slug) {
      cardChildren.push(el('span', { class: 'gcc-card-cta' }, tx('gccCardCta')));
    }
    const card = slug
      ? el(
          'a',
          { href: safeHref(`./countries/${slug}/`), class: 'gcc-card card-interactive' },
          cardChildren
        )
      : el('div', { class: 'gcc-card gcc-card--no-link card-interactive' }, cardChildren);

    fragment.append(
      el(
        'div',
        {
          class: 'gcc-card-wrapper is-entering',
          style: `--stagger-index: ${index}`,
        },
        [
          card,
          el(
            'button',
            {
              class: 'gcc-copy-btn',
              dataset: { copy: price },
              'aria-label': `${tx('copyPrice')} ${name}`,
              type: 'button',
            },
            '⎘'
          ),
        ]
      )
    );
  });
  grid.append(fragment);
}

function syncCrossPageLinks() {
  const unit = karatStripUnit === 'tola' ? 'tola' : karatStripUnit === 'oz' ? 'oz' : 'gram';
  const trackerHref = buildHomeTrackerHref(homeTrackerKarat, unit, lang);
  applyTrackerHandoffToIds(trackerHref, HOME_DEFAULT_TRACKER_LINK_IDS);
  const calcHref = buildCalculatorHref();
  for (const id of ['hero-cta-calculator', 'home-action-calc']) {
    const node = document.getElementById(id);
    if (node) node.setAttribute('href', calcHref);
  }
}

// ── Apply full page language ───────────────────────────────────────────────
// Declarative hydrator: any element tagged data-i18n / data-i18n-aria-label
// gets its text/aria-label from tx('home.<value>'). Lets static home copy be
// localized with one attribute instead of a bespoke setTextById call.

/**
 * Render a FAQ answer into `id`. `segments` is either a plain string (text
 * only) or an array of strings / [href, displayText] pairs (for answers
 * that include inline links). Uses replaceChildren so no innerHTML is needed.
 */
function renderFaqAnswer(id, segments) {
  const container = document.getElementById(id);
  if (!container) return;
  const nodes = (Array.isArray(segments) ? segments : [segments]).map((s) => {
    if (!Array.isArray(s)) return s;
    const a = document.createElement('a');
    a.href = s[0];
    a.textContent = s[1];
    return a;
  });
  container.replaceChildren(...nodes);
}

function hydrateHomeI18n() {
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = tx(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-aria-label]')) {
    el.setAttribute('aria-label', tx(el.dataset.i18nAriaLabel));
  }
}

function applyLangToPage() {
  const isAr = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  hydrateHomeI18n();

  setTextById('hero-live-label', tx('heroLive'));
  setTextById('hero-title-main', tx('heroTitle'));
  setTextById('hero-title-sub', tx('heroSub'));
  setTextById(
    'hero-lead',
    lang === 'ar'
      ? `تتبع أسعار الذهب المرجعية المرتبطة بالسعر الفوري للإمارات والخليج وأسواق العالم العربي عبر أكثر من 24 دولة و${getKaratCount()} عيارات وعملات محلية.`
      : `Track spot-linked gold reference prices for the UAE, GCC, and Arab markets across 24+ countries, ${getKaratCountLabel('en')}, and local currencies.`
  );
  setTextById('hero-cta-tracker', tx('heroCta1'));
  setTextById('hero-cta-calculator', tx('heroCtaCalculator'));
  setTextById('hero-cta-countries', tx('heroCta2'));
  setTextById('hero-cta-shops', tx('heroCta4'));
  setTextById('hero-cta-alert', tx('heroCta5'));
  setTextById('hero-cta-methodology', tx('heroCtaMethodology'));
  setTextById('hero-trust-line', tx('heroTrustLine'));
  setTextById('hlc-trust-line', tx('heroTrustShort'));
  setTextById('home-tools-kicker', tx('toolsKicker'));
  setTextById('home-tools-title', tx('actionRailTitle'));
  setTextById('home-tools-sub', tx('quickToolsSub'));
  setTextById('hlc-karat-teaser-link', tx('karatTeaserLink'));
  setTextById('home-action-track-kicker', tx('actionTrackKicker'));
  setTextById('home-action-track-label', tx('actionTrackLabel'));
  setTextById('home-action-track-desc', tx('actionTrackDesc'));
  setTextById('home-action-calc-kicker', tx('actionCalcKicker'));
  setTextById('home-action-calc-label', tx('actionCalcLabel'));
  setTextById('home-action-calc-desc', tx('actionCalcDesc'));
  setTextById('home-action-compare-kicker', tx('actionCompareKicker'));
  setTextById('home-action-compare-label', tx('actionCompareLabel'));
  setTextById('home-action-compare-desc', tx('actionCompareDesc'));
  setTextById('home-action-shops-kicker', tx('actionShopsKicker'));
  setTextById('home-action-shops-label', tx('actionShopsLabel'));
  setTextById('home-action-shops-desc', tx('actionShopsDesc'));
  setTextById('home-action-learn-kicker', tx('actionLearnKicker'));
  setTextById('home-action-learn-label', tx('actionLearnLabel'));
  setTextById('home-action-learn-desc', tx('actionLearnDesc'));
  setTextById('hlc-tracker-link', tx('trackerLink'));
  setTextById('hlc-title', tx('spotTitle'));
  setTextById('hlc-sub', tx('perOz'));
  setTextById('hlc-updated', tx('fetching'));
  setTextById('gcc-section-title', tx('gccLiveTitle'));
  setTextById('gcc-section-sub', tx('gccLiveSub'));
  setTextById('gcc-see-all', tx('seeAll'));
  setTextById('trust-live', tx('trustLive'));
  setTextById('trust-live-sub', tx('trustLiveSub'));
  setTextById('trust-countries', tx('trustCountries'));
  setTextById('trust-countries-sub', tx('trustCountriesSub'));
  setTextById('trust-karats', getKaratCountLabel(lang));
  setTextById('trust-karats-sub', getKaratRangeLabel(lang));
  setTextById('trust-aed', tx('trustAed'));
  setTextById('trust-aed-sub', tx('trustAedSub'));
  setTextById('trust-bilingual', tx('trustBilingual'));
  setTextById('trust-bilingual-sub', tx('trustBilingualSub'));
  setTextById('trust-offline', tx('trustOffline'));
  setTextById('trust-offline-sub', tx('trustOfflineSub'));
  setTextById('karat-strip-label', tx('karatStripLabel'));
  setTextById('karat-strip-title', tx('karatStripTitle'));
  setTextById('karat-strip-sub', tx('karatStripSub'));
  setTextById('karat-strip-cta', tx('karatStripCta'));
  setTextById('karat-strip-scroll-hint', tx('karatStripScrollHint'));
  updateKaratStripSelection();
  syncCrossPageLinks();
  setTextById('tools-title', tx('toolsTitle'));
  setTextById('tools-sub', tx('toolsSub'));
  setTextById('home-stats-title', tx('statsTitle'));
  setTextById('home-stats-sub', tx('statsSub'));
  setTextById('home-stat-1-value', tx('stat1Value'));
  setTextById('home-stat-1-label', tx('stat1Label'));
  setTextById('home-stat-2-value', String(getKaratCount()));
  setTextById('home-stat-2-label', tx('stat2Label'));
  setTextById('home-stat-3-value', tx('stat3Value'));
  setTextById('home-stat-3-label', tx('stat3Label'));
  setTextById('home-stat-4-value', tx('stat4Value'));
  setTextById('home-stat-4-label', tx('stat4Label'));
  setTextById('home-stats-disclaimer', tx('statsDisclaimer'));
  setTextById('tool-tracker-title', tx('toolTrackerTitle'));
  setTextById('tool-tracker-desc', tx('toolTrackerDesc'));
  setTextById('tool-tracker-cta', tx('toolTrackerCta'));
  setTextById('tool-calc-title', tx('toolCalcTitle'));
  setTextById('tool-calc-desc', tx('toolCalcDesc'));
  setTextById('tool-calc-cta', tx('toolCalcCta'));
  setTextById('tool-uae-title', tx('toolUaeTitle'));
  setTextById('tool-uae-desc', tx('toolUaeDesc'));
  setTextById('tool-uae-cta', tx('toolUaeCta'));
  setTextById('tool-shops-title', tx('toolShopsTitle'));
  setTextById('tool-shops-desc', tx('toolShopsDesc'));
  setTextById('tool-shops-cta', tx('toolShopsCta'));
  setTextById('tool-countries-title', tx('toolCountriesTitle'));
  setTextById('tool-countries-desc', tx('toolCountriesDesc'));
  setTextById('tool-countries-cta', tx('toolCountriesCta'));
  setTextById('tool-learn-title', tx('toolLearnTitle'));
  setTextById('tool-learn-desc', tx('toolLearnDesc'));
  setTextById('tool-learn-cta', tx('toolLearnCta'));
  setTextById('tool-insights-title', tx('toolInsightsTitle'));
  setTextById('tool-insights-desc', tx('toolInsightsDesc'));
  setTextById('tool-insights-cta', tx('toolInsightsCta'));
  setTextById('tool-method-title', tx('toolMethodTitle'));
  setTextById('tool-method-desc', tx('toolMethodDesc'));
  setTextById('tool-method-cta', tx('toolMethodCta'));
  setTextById('tool-invest-title', tx('toolInvestTitle'));
  setTextById('tool-invest-desc', tx('toolInvestDesc'));
  setTextById('tool-invest-cta', tx('toolInvestCta'));
  setTextById('tools-alert-text', tx('alertRowText'));
  setTextById('tools-alert-btn', tx('alertBtn'));
  setTextById('trust-banner-title', tx('trustBannerTitle'));
  setTextById('trust-banner-copy', tx('trustBannerCopy'));
  setTextById('trust-banner-source-tail', tx('trustBannerSourceTail'));
  setTextById('trust-banner-methodology', tx('trustBannerMethodology'));
  setTextById('countries-quick-title', tx('countriesTitle'));
  setTextById('countries-quick-sub', tx('countriesSub'));
  setTextById('countries-see-all', tx('seeAllCountries'));
  setTextById('social-follow-text', tx('socialFollowText'));
  setTextById('social-follow-cta', tx('socialFollowCta'));
  setTextById('explainer-spot-title', tx('explainerSpotTitle'));
  setTextById('explainer-spot-desc', tx('explainerSpotDesc'));
  setTextById('explainer-karat-title', tx('explainerKaratTitle'));
  setTextById('explainer-karat-desc', tx('explainerKaratDesc'));
  setTextById('explainer-local-title', tx('explainerLocalTitle'));
  setTextById('explainer-local-desc', tx('explainerLocalDesc'));
  setTextById('faq-title', tx('faqTitle'));
  for (let n = 1; n <= 7; n++) {
    renderFaqAnswer(`faq-a${n}`, tx(`faq${n}A`));
  }
  setTextById('faq-more-link', tx('faqMore'));
  setTextById('home-methodology-title', txGlobal('methodology.sectionTitle'));
  setTextById('home-methodology-sub', txGlobal('methodology.sectionSub'));
  setTextById('home-methodology-page-link', txGlobal('methodology.fullPageLink'));
  setTextById('home-location-guides-title', txGlobal('locationGuides.sectionTitle'));
  setTextById('home-location-guides-sub', txGlobal('locationGuides.sectionSub'));
  setTextById('home-location-guides-link', txGlobal('locationGuides.sectionLink'));
  document.getElementById('hfb-dismiss')?.setAttribute('aria-label', tx('freshnessDismiss'));

  // Next-step guides section
  setTextById('next-step-title', tx('nextStepTitle'));
  setTextById('next-step-sub', tx('nextStepSub'));
  setTextById('next-uae-title', tx('nextUaeTitle'));
  setTextById('next-uae-desc', tx('nextUaeDesc'));
  setTextById('next-uae-cta', tx('nextUaeCta'));
  setTextById('next-dubai-title', tx('nextDubaiTitle'));
  setTextById('next-dubai-desc', tx('nextDubaiDesc'));
  setTextById('next-dubai-cta', tx('nextDubaiCta'));
  setTextById('next-gcc-title', tx('nextGccTitle'));
  setTextById('next-gcc-desc', tx('nextGccDesc'));
  setTextById('next-gcc-cta', tx('nextGccCta'));
  setTextById('next-svr-title', tx('nextSvrTitle'));
  setTextById('next-svr-desc', tx('nextSvrDesc'));
  setTextById('next-svr-cta', tx('nextSvrCta'));

  // Markets highlights section
  setTextById('markets-title', tx('marketsTitle'));
  setTextById('markets-sub', tx('marketsSub'));
  setTextById('markets-see-tracker', tx('marketsSeeAll'));
  setTextById('mkt-dubai-name', tx('mktDubaiName'));
  setTextById('mkt-dubai-loc', tx('mktDubaiLoc'));
  setTextById('mkt-dubai-desc', tx('mktDubaiDesc'));
  setTextById('mkt-dubai-cta', tx('mktDubaiCta'));
  setTextById('mkt-riyadh-name', tx('mktRiyadhName'));
  setTextById('mkt-riyadh-loc', tx('mktRiyadhLoc'));
  setTextById('mkt-riyadh-desc', tx('mktRiyadhDesc'));
  setTextById('mkt-riyadh-cta', tx('mktRiyadhCta'));
  setTextById('mkt-kuwait-name', tx('mktKuwaitName'));
  setTextById('mkt-kuwait-loc', tx('mktKuwaitLoc'));
  setTextById('mkt-kuwait-desc', tx('mktKuwaitDesc'));
  setTextById('mkt-kuwait-cta', tx('mktKuwaitCta'));
  setTextById('mkt-cairo-name', tx('mktCairoName'));
  setTextById('mkt-cairo-loc', tx('mktCairoLoc'));
  setTextById('mkt-cairo-desc', tx('mktCairoDesc'));
  setTextById('mkt-cairo-cta', tx('mktCairoCta'));
  setTextById('markets-note', tx('marketsNote'));

  // Country tiles — use localised names from COUNTRIES data
  const countryMap = {
    'ct-uae': 'AE',
    'ct-sa': 'SA',
    'ct-kw': 'KW',
    'ct-qa': 'QA',
    'ct-bh': 'BH',
    'ct-om': 'OM',
    'ct-eg': 'EG',
    'ct-jo': 'JO',
    'ct-ma': 'MA',
    'ct-in': 'IN',
  };
  for (const [elId, code] of Object.entries(countryMap)) {
    const c = COUNTRIES.find((x) => x.code === code);
    if (c) setTextById(elId, isAr ? c.nameAr : c.nameEn);
  }
  setTextById('ct-more', tx('seeAllCountries'));

  // Country search — update placeholder and empty-state text bilingually
  const countrySearchInput = /** @type {HTMLInputElement|null} */ (
    document.getElementById('country-search')
  );
  if (countrySearchInput) {
    countrySearchInput.placeholder = tx('countrySearchPlaceholder');
    countrySearchInput.setAttribute('aria-label', tx('countrySearchPlaceholder'));
  }
  setTextById('country-search-empty', formatCountrySearchEmpty(countrySearchInput?.value || ''));

  // Karat strip unit toggle group — update aria-label bilingually
  const unitGroupEl = document.getElementById('kstrip-unit-group');
  if (unitGroupEl) unitGroupEl.setAttribute('aria-label', tx('unitToggleLabel'));
  applyRegionTabA11yLabels();
  renderHomeAdditiveSections();
  renderHomeTrustAddons();

  renderHeroCard();
  renderGCCGrid();
}

// ── Fetch live data in parallel ────────────────────────────────────────────
async function fetchLiveData() {
  if (!navigator.onLine) return;
  try {
    if (_realtimeEngine) {
      const fx = await api.fetchFX();
      if (fx?.rates) {
        rates = fx.rates ?? {};
        cache.saveFXRates(rates, {
          lastUpdateUtc: fx.time_last_update_utc,
          nextUpdateUtc: fx.time_next_update_utc,
        });
        renderGCCGrid();
      }
      return;
    }

    const { gold, fx } = await api.fetchGoldAndFX();
    if (fx?.rates) {
      rates = fx.rates ?? {};
      cache.saveFXRates(rates, {
        lastUpdateUtc: fx.time_last_update_utc,
        nextUpdateUtc: fx.time_next_update_utc,
      });
      renderGCCGrid();
    }
    if (gold?.price && !goldPrice) {
      goldPrice = gold.price;
      goldUpdatedAt = gold.updatedAt || goldUpdatedAt;
      cache.saveGoldPrice(gold.price, goldUpdatedAt);
      renderHeroCard();
      renderKaratStrip();
    }
  } catch {
    // keep previous FX / gold data
  }
}

function applyRealtimeSnapshot(snapshot) {
  _realtimeSnapshot = snapshot;

  const quote = snapshot?.quote;
  if (quote?.price) {
    goldPrice = quote.price;
    goldUpdatedAt = quote.providerTimestamp || quote.fetchedAt || new Date().toISOString();
    goldProviderId = quote.providerId || goldProviderId;
    goldIsFallback = quote.isFallback ?? quote.forcedState === 'fallback';
    goldIsFresh = resolveGoldIsFresh(quote);
    cache.saveGoldPrice(quote.price, goldUpdatedAt);
    hideDataStatusBanner();
    renderHeroCard();
  } else if (!goldPrice) {
    const priceEl = document.getElementById('hlc-price');
    if (priceEl) {
      priceEl.classList.add('hlc-price--loading');
      mountSkeleton(priceEl, 'priceLg');
    }
  }

  maybeTrackRealtimeSlo(snapshot, 'home');
  renderHomeRealtimePanels();
}

function initRealtimeEngine() {
  if (_realtimeEngine) return;

  _realtimeEngine = createRealtimePricingEngine({
    primaryProvider: createPrimaryQuoteProvider(),
    secondaryProvider: createSecondaryQuoteProvider(),
    config: REALTIME_POLLING_DEFAULTS,
    debug: isRealtimeDebugEnabled(),
  });

  const cacheBoot = cache.getFreshBootGoldPrice();
  if (cacheBoot) {
    _realtimeEngine.seedFromCache({
      price: cacheBoot.price,
      updatedAt: cacheBoot.updatedAt,
      fetchedAt: cacheBoot.fetchedAt,
      providerId: 'cache',
      source: 'cache',
    });
  }

  _realtimeEngine.subscribe((snapshot) => {
    applyRealtimeSnapshot(snapshot);
  });

  _realtimeEngine.start();
  document.addEventListener('visibilitychange', () => {
    _realtimeEngine?.setVisibility(!document.hidden);
  });
}

function initLazyBelowFoldFeatures() {
  // 220px prefetch margin was chosen to load content before it enters view on
  // common mobile scroll velocity without aggressively preloading deep sections.
  const BELOW_FOLD_PREFETCH_MARGIN_PX = 220;
  let countrySearchInitialized = false;
  let bottomAdLoaded = false;

  const runCountrySearchInit = () => {
    if (countrySearchInitialized) return;
    countrySearchInitialized = true;
    initCountrySearch();
  };
  const runBottomAdLoad = () => {
    if (bottomAdLoaded) return;
    bottomAdLoaded = true;
    renderAdSlot('ad-bottom', 'rectangle');
  };

  if (!('IntersectionObserver' in window)) {
    runCountrySearchInit();
    runBottomAdLoad();
    return;
  }

  const sectionObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const targetId = entry.target.id;
        if (targetId === 'countries-quick') runCountrySearchInit();
        if (targetId === 'ad-bottom') runBottomAdLoad();
        obs.unobserve(entry.target);
      });
    },
    { rootMargin: `${BELOW_FOLD_PREFETCH_MARGIN_PX}px 0px` }
  );

  const countriesSection = document.getElementById('countries-quick');
  const bottomAd = document.getElementById('ad-bottom');
  if (countriesSection) sectionObserver.observe(countriesSection);
  else runCountrySearchInit();
  if (bottomAd) sectionObserver.observe(bottomAd);
  else runBottomAdLoad();
}

// ── Country quick-picker search ────────────────────────────────────────────
/**
 * Wires up the inline search/filter on the country-tiles section (Track C.4).
 * Progressive enhancement: graceful no-op if the elements are absent.
 * Keyboard contract:
 *   - While in the input: ArrowDown focuses the first visible tile; Escape clears.
 *   - While in the tile list: ArrowDown/ArrowUp cycles; ArrowUp from first tile
 *     returns focus to the input.
 */
function initCountrySearch() {
  const input = /** @type {HTMLInputElement|null} */ (document.getElementById('country-search'));
  const tilesWrap = document.querySelector('.country-tiles');
  const emptyState = document.getElementById('country-search-empty');
  if (!input || !tilesWrap) return;

  // All searchable tiles — excludes the "See all" tile
  const links = /** @type {HTMLAnchorElement[]} */ (
    Array.from(tilesWrap.querySelectorAll('a.country-tile:not(.country-tile--more)'))
  );

  function getVisible() {
    return links.filter((l) => !l.classList.contains('country-tile--filtered'));
  }

  function filterTiles(q) {
    const query = q.trim().toLowerCase();
    let visible = 0;
    links.forEach((link) => {
      const name = link.textContent.trim().toLowerCase();
      const hide = Boolean(query && !name.includes(query));
      link.classList.toggle('country-tile--filtered', hide);
      if (!hide) visible++;
    });
    if (emptyState) {
      emptyState.hidden = !query || visible > 0;
      if (query && visible === 0) emptyState.textContent = formatCountrySearchEmpty(q);
    }
    return { query, visible };
  }

  let _searchTimer;
  input.addEventListener('input', (e) => {
    const q = /** @type {HTMLInputElement} */ (e.target).value;
    const { query, visible } = filterTiles(q);
    // Debounce search_query to avoid firing on every keystroke
    clearTimeout(_searchTimer);
    if (query) {
      _searchTimer = setTimeout(() => {
        track(EVENTS.SEARCH_QUERY, {
          length: query.length,
          result_count: visible,
          locale: document.documentElement.lang || 'en',
        });
      }, 600);
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const first = getVisible()[0];
      if (first) first.focus();
    } else if (e.key === 'Escape') {
      input.value = '';
      filterTiles('');
    }
  });

  tilesWrap.addEventListener('keydown', (e) => {
    const visible = getVisible();
    const idx = visible.indexOf(/** @type {HTMLAnchorElement} */ (document.activeElement));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = visible[idx + 1];
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (idx <= 0) input.focus();
      else visible[idx - 1].focus();
    }
  });
}

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  lang = getLang();

  // Apply language direction immediately
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  enforceCanonicalOnDocument(document, window.location.pathname);
  enforceHreflangAlternates(document, window.location.pathname);
  injectFaqSchema(document, buildMethodologyFaqSchema(lang));

  // Nav + footer + spot bar
  const shell = mountSharedShell({ lang, depth: getDepth(), withSpotBar: true });
  initPageEnter('main');
  const navCtrl = shell.navCtrl;
  navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      lang = lang === 'en' ? 'ar' : 'en';
      saveLang(lang);
      shell.updateLang(lang);
      applyLangToPage();
      mountHomeQuickConvert();
      injectFaqSchema(document, buildMethodologyFaqSchema(lang));
    });
  });

  // Render ad slots
  renderAdSlot('ad-top', 'leaderboard');
  initLazyBelowFoldFeatures();

  // Bind region tab filters
  document.querySelectorAll('.gcc-region-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      homeRegion = tab.dataset.region;
      try {
        const p = JSON.parse(localStorage.getItem('user_prefs') || '{}');
        p.homeRegion = homeRegion;
        localStorage.setItem('user_prefs', JSON.stringify(p));
      } catch (_) {}
      document.querySelectorAll('.gcc-region-tab').forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      renderGCCGrid();
    });
    if (tab.dataset.region === homeRegion) {
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
    }
  });

  // Freshness bar dismiss
  document.getElementById('hfb-dismiss')?.addEventListener('click', () => {
    document.getElementById('home-freshness-bar')?.setAttribute('hidden', '');
  });

  // Copy price button (event delegation — covers both GCC grid and karat strip)
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.gcc-copy-btn, .kstrip-copy-btn');
    if (!btn) return;
    const text = btn.dataset.copy;
    if (!text || text === '—') return;
    const surface = btn.classList.contains('kstrip-copy-btn') ? 'karat_strip' : 'gcc_grid';
    const ok = await copyWithToast(text, {
      successMessage: tx('copyPriceSuccess'),
      errorMessage: tx('copyPriceFailed'),
    });
    if (ok) {
      const orig = btn.textContent;
      btn.textContent = '✓';
      track(EVENTS.COPY_CLICK, { surface, value_type: 'price' });
      setTimeout(() => {
        btn.textContent = orig;
      }, 1500);
    }
  });

  // Karat strip unit toggle
  document.querySelectorAll('.kstrip-unit-btn').forEach((btn) => {
    const unit = btn.dataset.unit;
    if (unit === karatStripUnit) {
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('is-active');
      btn.setAttribute('aria-pressed', 'false');
    }
    btn.addEventListener('click', () => {
      karatStripUnit = unit;
      try {
        const p = JSON.parse(localStorage.getItem(LANG_KEY) || '{}');
        p.karatStripUnit = unit;
        localStorage.setItem(LANG_KEY, JSON.stringify(p));
      } catch (_) {}
      document.querySelectorAll('.kstrip-unit-btn').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.unit === unit);
        b.setAttribute('aria-pressed', b.dataset.unit === unit ? 'true' : 'false');
      });
      renderKaratStrip();
      syncCrossPageLinks();
    });
  });

  bindKaratStripSelection();

  // FAQ: one-open-at-a-time behaviour
  document.querySelectorAll('.faq-item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        document.querySelectorAll('.faq-item').forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  // Load cache first for instant render
  const cacheState = {
    lang,
    goldPriceUsdPerOz: null,
    rates: {},
    fxMeta: { nextUpdateUtc: 0 },
    status: {},
    freshness: {},
    favorites: [],
    history: [],
    prevGoldPriceUsdPerOz: null,
    dayOpenGoldPriceUsdPerOz: null,
    isOnline: navigator.onLine,
  };
  cache.loadState(cacheState);
  ensureHeroLoadingSkeletons();

  dayOpenPrice = cacheState.dayOpenGoldPriceUsdPerOz;
  rates = cacheState.rates;

  const bootGold = cache.getFreshBootGoldPrice();
  if (bootGold?.price) {
    goldPrice = bootGold.price;
    goldUpdatedAt = bootGold.updatedAt || null;
    goldIsFallback = true;
    goldIsFresh = false;
  }

  applyLangToPage();
  renderPriceTrend();
  initHomeChart();
  mountHomeQuickConvert();

  // Analytics: fire page_view on home load
  track(EVENTS.PAGE_VIEW, { path: location.pathname, locale: lang });
  track(EVENTS.PRICE_VIEW, { path: location.pathname, locale: lang, surface: 'home' });

  // Render cached data immediately for instant content (non-blocking)
  if (goldPrice) {
    renderHeroCard();
    renderGCCGrid();
  }

  // Fetch live data (non-blocking)
  initRealtimeEngine();
  fetchLiveData();

  // FX auto-refresh (gold polling handled by realtime pricing engine)
  if (_refreshTimer) clearInterval(_refreshTimer);
  _refreshTimer = setInterval(fetchLiveData, CONSTANTS.GOLD_REFRESH_MS);

  // Tick the "Updated X sec/min ago" label every second without a full price re-fetch.
  startFreshnessTimer();

  // Hero-backdrop scroll parallax retired (Precision Instrument: the freshness dot is the
  // only hero animation; the orb layer it drove was removed in home.css).

  // Clean up timers on page unload to prevent memory leaks
  window.addEventListener(
    'pagehide',
    () => {
      if (_refreshTimer) {
        clearInterval(_refreshTimer);
        _refreshTimer = null;
      }
      if (_freshnessTimer) {
        clearInterval(_freshnessTimer);
        _freshnessTimer = null;
      }
      if (_realtimeEngine) {
        _realtimeEngine.stop();
        _realtimeEngine = null;
      }
    },
    { once: true }
  );

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register(BASE_PATH + 'sw.js')
      .then(() => initSwUpdateToast())
      .catch(() => {});
  }

  // PWA install prompt — capture the beforeinstallprompt event and show a
  // subtle banner after 30 seconds if the user hasn't dismissed it before.
  initPwaInstallPrompt();
  // Skeleton timeout: if price still loading after 8s, show unavailable state
  setTimeout(() => {
    const priceEl = document.getElementById('hlc-price');
    if (priceEl && priceEl.classList.contains('hlc-price--loading')) {
      priceEl.classList.remove('hlc-price--loading');
      mountSkeleton(priceEl, 'priceLg');
      const updEl = document.getElementById('hlc-updated');
      if (updEl) {
        updEl.textContent = tx('priceUnavailableConnection');
        updEl.dataset.freshnessKey = 'unavailable';
        updEl.dataset.freshnessAge = 'unavailable';
      }
      const karatUpdEl = document.getElementById('karat-strip-updated');
      if (karatUpdEl) {
        karatUpdEl.textContent = tx('priceUnavailableConnection');
        karatUpdEl.dataset.freshnessKey = 'unavailable';
        karatUpdEl.dataset.freshnessAge = 'unavailable';
      }
      document.getElementById('hero-live-card')?.removeAttribute('aria-busy');
      showDataStatusBanner({
        variant: 'error',
        lang,
        message: tx('liveUnavailableBanner'),
        onRetry: () => {
          hideDataStatusBanner();
          if (_realtimeEngine) {
            _realtimeEngine.stop();
            _realtimeEngine = null;
          }
          initRealtimeEngine();
        },
      });
    }
    // GCC grid skeleton timeout
    document.querySelectorAll('.gcc-card.skeleton-card').forEach((card) => {
      card.classList.remove('skeleton-card');
      card.textContent = '—';
    });
  }, SKELETON_TIMEOUT_MS);
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => {
    console.error('[home] Initialisation error:', err);
  });
});

// ---------------------------------------------------------------------------
// PWA Install Prompt
// ---------------------------------------------------------------------------
/**
 * Listens for the browser's beforeinstallprompt event and shows a subtle
 * bottom banner after a delay. Respects user dismissal via localStorage.
 * The banner renders itself directly into the DOM — no HTML changes needed.
 */
function initPwaInstallPrompt() {
  // Don't show if user already dismissed or if already installed
  if (localStorage.getItem('pwa_install_dismissed')) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show banner after 30 seconds of engagement
    setTimeout(() => {
      if (!deferredPrompt) return;
      if (localStorage.getItem('pwa_install_dismissed')) return;
      showPwaBanner(deferredPrompt);
    }, 30000);
  });
}

function showPwaBanner(deferredPrompt) {
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', tx('pwaInstallLabel'));
  banner.append(
    el('div', { class: 'pwa-banner-inner' }, [
      el('img', {
        src: safeHref(`${BASE_PATH}favicon.svg`),
        width: '32',
        height: '32',
        alt: '',
        'aria-hidden': 'true',
        class: 'pwa-banner-icon',
      }),
      el('div', { class: 'pwa-banner-text' }, [
        el('strong', null, tx('pwaTitle')),
        el('span', null, tx('pwaSubtitle')),
      ]),
      el(
        'button',
        {
          class: 'pwa-banner-install btn btn-primary btn-sm',
          id: 'pwa-install-btn',
          type: 'button',
        },
        tx('pwaInstall')
      ),
      el(
        'button',
        {
          class: 'pwa-banner-dismiss',
          id: 'pwa-dismiss-btn',
          'aria-label': tx('pwaDismiss'),
          type: 'button',
        },
        '✕'
      ),
    ])
  );

  // Inject styles
  if (!document.getElementById('pwa-banner-styles')) {
    const style = document.createElement('style');
    style.id = 'pwa-banner-styles';
    style.textContent = `
      #pwa-install-banner {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
        background: #1e293b; color: #f8fafc;
        border-top: 2px solid #d4a017;
        padding: 0.75rem 1rem;
        box-shadow: 0 -4px 24px rgba(0,0,0,0.3);
        animation: pwaSlideUp 0.3s ease;
      }
      @media (max-width: 640px) {
        #pwa-install-banner { bottom: 60px; }
      }
      @keyframes pwaSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .pwa-banner-inner {
        display: flex; align-items: center; gap: 0.75rem;
        max-width: 960px; margin: 0 auto;
      }
      .pwa-banner-icon { flex-shrink: 0; border-radius: 8px; }
      .pwa-banner-text { flex: 1; min-width: 0; }
      .pwa-banner-text strong { display: block; font-size: 0.875rem; font-weight: 700; }
      .pwa-banner-text span { font-size: 0.78rem; color: #94a3b8; }
      .pwa-banner-install {
        flex-shrink: 0; background: #d4a017; color: #fff; border: none;
        padding: 0.45rem 1rem; border-radius: 6px; font-size: 0.8rem;
        font-weight: 700; cursor: pointer; white-space: nowrap;
      }
      .pwa-banner-install:hover { background: #b8860b; }
      .pwa-banner-dismiss {
        background: none; border: none; color: #94a3b8; cursor: pointer;
        font-size: 1rem; padding: 0.25rem 0.5rem; flex-shrink: 0;
      }
      .pwa-banner-dismiss:hover { color: #f8fafc; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    banner.remove();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_install_dismissed', '1');
    }
    deferredPrompt = null;
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    localStorage.setItem('pwa_install_dismissed', '1');
    deferredPrompt = null;
  });
}
