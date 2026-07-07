/**
 * Gold Portfolio Tracker — page orchestrator.
 *
 * Local-first holdings tracker: entries (weight / karat / purchase date /
 * cost) live ONLY in this browser's localStorage — nothing is uploaded.
 * Holdings are valued against the live spot-linked reference price with the
 * same karat table and fixed AED peg used across the site.
 *
 * Trust framing (non-negotiable rule 1): every value shown here is a
 * **reference valuation** of the gold content, never a resale quote or a
 * broker statement. Making charges paid at purchase are not recoverable at
 * resale, and the UI says so instead of hiding it.
 *
 * Pure logic lives in `src/pages/portfolio/portfolio-core.js` (unit-tested);
 * this file wires it to storage, live data and the shared shell.
 */

import { CONSTANTS, COUNTRIES, KARATS } from '../config/index.js';
import * as api from '../lib/api.js';
import * as cache from '../lib/cache.js';
import { formatPrice } from '../lib/formatter.js';
import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { updateTicker } from '../components/ticker.js';
import { updateSpotBar } from '../components/spotBar.js';
import { el, clear } from '../lib/safe-dom.js';
import { track, EVENTS } from '../lib/analytics.js';
import { getLiveFreshness, applyMarketClosedOverlay } from '../lib/live-status.js';
import { initPageEnter } from '../lib/page-enter.js';
import { showCopyToast } from '../lib/copy-toast.js';
import {
  PORTFOLIO_STORAGE_KEY,
  MAX_HOLDINGS,
  sanitizeHolding,
  parsePortfolio,
  serializePortfolio,
  summarizePortfolio,
  computeTimeline,
  holdingsToCsv,
} from './portfolio/portfolio-core.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Display / cost currencies: unique currency codes from the tracked-country
// config, AED + USD pinned first (primary audience + reference currency).
const CURRENCIES = (() => {
  const seen = new Set(['AED', 'USD']);
  const list = ['AED', 'USD'];
  for (const country of COUNTRIES) {
    if (!seen.has(country.currency)) {
      seen.add(country.currency);
      list.push(country.currency);
    }
  }
  return list;
})();

function currencyDecimals(currency) {
  const country = COUNTRIES.find((c) => c.currency === currency);
  return country ? (country.decimals ?? 2) : 2;
}

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    h1: 'Gold Portfolio Tracker',
    sub: 'Track your gold holdings over time — valued against the live spot-linked reference price, privately, in this browser.',
    spotLabel: 'XAU/USD spot:',
    privacy: 'Stored only on this device — holdings are never uploaded.',
    addHolding: 'Add holding',
    editHolding: 'Edit holding',
    currencyLabel: 'Display currency',
    exportCsv: 'Export CSV',
    exportJson: 'Backup JSON',
    importJson: 'Restore JSON',
    clearAll: 'Delete all',
    cardValue: 'Current reference value',
    cardValueHint: 'Gold content × live reference price',
    cardWeight: 'Gold content',
    cardWeightUnit: 'g total',
    cardWeightFine: 'g fine gold (24K equivalent)',
    cardCost: 'Cost as entered',
    cardCostMixed: 'Mixed currencies — shown per holding below',
    cardGain: 'Vs. cost',
    cardGainHint: 'Against today’s reference value',
    cardGainMixed: 'Not totalled across different cost currencies',
    cardGainNoCost: 'Add costs to see this',
    chartTitle: 'Portfolio value over time',
    chartNote:
      'Reference value replayed from daily price snapshots saved by this browser — days without a visit have no snapshot.',
    chartEmpty: 'Come back after a few visits — daily snapshots build this chart over time.',
    holdingsTitle: 'Holdings',
    colLabel: 'Label',
    colWeight: 'Weight',
    colKarat: 'Karat',
    colDate: 'Purchase date',
    colCost: 'Cost',
    colValue: 'Reference value',
    colGain: '± vs cost',
    colActions: 'Actions',
    edit: 'Edit',
    remove: 'Delete',
    emptyTitle: 'No holdings yet',
    emptyBody:
      'Add your first bangle, coin or bar to see its live reference valuation. Everything stays in this browser — nothing is uploaded, no account needed.',
    formLabel: 'Label (optional)',
    formLabelPlaceholder: 'e.g. Wedding bangle',
    formWeight: 'Weight (grams)',
    formKarat: 'Karat',
    formDate: 'Purchase date',
    formCost: 'Total paid (including making charges)',
    formCostCurrency: 'Currency',
    formSave: 'Save holding',
    formCancel: 'Cancel',
    formErrors: 'Please check the weight, karat, date and cost fields.',
    confirmDeleteTitle: 'Delete this holding?',
    confirmDeleteAllTitle: 'Delete all holdings?',
    confirmDeleteAllBody:
      'This removes every holding stored in this browser. Export a JSON backup first if you may want them back.',
    confirmCancel: 'Keep',
    confirmDelete: 'Delete',
    limitReached: `Limit of ${MAX_HOLDINGS} holdings reached.`,
    imported: 'Portfolio restored.',
    importFailed: 'That file is not a valid portfolio backup.',
    csvDone: 'CSV downloaded.',
    jsonDone: 'Backup downloaded.',
    valueUnavailable: 'Waiting for live prices…',
    unavailable: '—',
    gainNoCost: 'No cost entered',
    howTitle: 'How this valuation works',
    how1: 'Reference value = weight × karat purity × the live spot-linked price per gram, converted at the current FX rate (AED uses the fixed 3.6725 peg).',
    how2: 'Your purchase price usually included making charges — those are not recoverable when you sell, so a positive number here does not promise a resale profit.',
    how3: 'Gain vs. cost is only totalled when your costs are in the display currency — historic costs are never converted at today’s FX rate.',
    disclaimer:
      'This is a reference valuation of gold content, not a broker statement, buy-back quote or financial advice. Shop resale offers depend on the piece, its condition and the dealer’s rate board.',
    methodology: 'How prices work →',
    freshness: {
      live: 'Live',
      delayed: 'Delayed',
      cached: 'Cached',
      stale: 'Stale',
      fallback: 'Fallback',
      closed: 'Closed',
      unavailable: 'Unavailable',
    },
    docTitle: 'Gold Portfolio Tracker | Gold Ticker Live',
  },
  ar: {
    h1: 'متتبع محفظة الذهب',
    sub: 'تابع مقتنياتك من الذهب عبر الوقت — مقيّمة وفق السعر المرجعي الحي المرتبط بالسعر الفوري، وبخصوصية داخل متصفحك.',
    spotLabel: 'سعر الأونصة (XAU/USD):',
    privacy: 'تُحفظ على هذا الجهاز فقط — لا تُرفع مقتنياتك إلى أي خادم.',
    addHolding: 'إضافة مقتنى',
    editHolding: 'تعديل المقتنى',
    currencyLabel: 'عملة العرض',
    exportCsv: 'تصدير CSV',
    exportJson: 'نسخة احتياطية JSON',
    importJson: 'استعادة JSON',
    clearAll: 'حذف الكل',
    cardValue: 'القيمة المرجعية الحالية',
    cardValueHint: 'محتوى الذهب × السعر المرجعي الحي',
    cardWeight: 'محتوى الذهب',
    cardWeightUnit: 'جم إجمالي',
    cardWeightFine: 'جم ذهب خالص (مكافئ عيار 24)',
    cardCost: 'التكلفة كما أُدخلت',
    cardCostMixed: 'عملات مختلفة — تظهر لكل مقتنى أدناه',
    cardGain: 'مقارنة بالتكلفة',
    cardGainHint: 'مقابل القيمة المرجعية لليوم',
    cardGainMixed: 'لا يُجمع عبر عملات تكلفة مختلفة',
    cardGainNoCost: 'أضف التكاليف لعرض هذا الرقم',
    chartTitle: 'قيمة المحفظة عبر الوقت',
    chartNote:
      'قيمة مرجعية مُعادة الحساب من لقطات الأسعار اليومية المحفوظة في هذا المتصفح — الأيام بلا زيارة لا تحتوي لقطة.',
    chartEmpty: 'عد بعد بضع زيارات — اللقطات اليومية تبني هذا الرسم مع الوقت.',
    holdingsTitle: 'المقتنيات',
    colLabel: 'الوصف',
    colWeight: 'الوزن',
    colKarat: 'العيار',
    colDate: 'تاريخ الشراء',
    colCost: 'التكلفة',
    colValue: 'القيمة المرجعية',
    colGain: '± مقابل التكلفة',
    colActions: 'إجراءات',
    edit: 'تعديل',
    remove: 'حذف',
    emptyTitle: 'لا مقتنيات بعد',
    emptyBody:
      'أضف أول غوايشك أو عملتك أو سبيكتك لعرض قيمتها المرجعية الحية. كل شيء يبقى في هذا المتصفح — لا رفع للبيانات ولا حاجة لحساب.',
    formLabel: 'الوصف (اختياري)',
    formLabelPlaceholder: 'مثال: غويشة الزفاف',
    formWeight: 'الوزن (جرام)',
    formKarat: 'العيار',
    formDate: 'تاريخ الشراء',
    formCost: 'إجمالي المدفوع (شاملاً أجور الصياغة)',
    formCostCurrency: 'العملة',
    formSave: 'حفظ المقتنى',
    formCancel: 'إلغاء',
    formErrors: 'يرجى التحقق من حقول الوزن والعيار والتاريخ والتكلفة.',
    confirmDeleteTitle: 'حذف هذا المقتنى؟',
    confirmDeleteAllTitle: 'حذف كل المقتنيات؟',
    confirmDeleteAllBody:
      'سيزيل هذا كل المقتنيات المحفوظة في هذا المتصفح. صدّر نسخة JSON احتياطية أولاً إن كنت قد تحتاجها لاحقاً.',
    confirmCancel: 'إبقاء',
    confirmDelete: 'حذف',
    limitReached: `تم بلوغ الحد الأقصى (${MAX_HOLDINGS} مقتنى).`,
    imported: 'تمت استعادة المحفظة.',
    importFailed: 'هذا الملف ليس نسخة احتياطية صالحة للمحفظة.',
    csvDone: 'تم تنزيل ملف CSV.',
    jsonDone: 'تم تنزيل النسخة الاحتياطية.',
    valueUnavailable: 'بانتظار الأسعار الحية…',
    unavailable: '—',
    gainNoCost: 'لم تُدخل تكلفة',
    howTitle: 'كيف يُحسب هذا التقييم',
    how1: 'القيمة المرجعية = الوزن × نقاء العيار × سعر الجرام المرجعي الحي، محوّلة بسعر الصرف الحالي (الدرهم بربط ثابت 3.6725).',
    how2: 'سعر شرائك تضمّن غالباً أجور الصياغة — وهي لا تُسترد عند البيع، لذا فالرقم الموجب هنا لا يعِد بربح عند إعادة البيع.',
    how3: 'المقارنة بالتكلفة تُجمع فقط عندما تكون تكاليفك بعملة العرض — التكاليف التاريخية لا تُحوَّل أبداً بسعر صرف اليوم.',
    disclaimer:
      'هذا تقييم مرجعي لمحتوى الذهب، وليس كشف حساب وسيط ولا عرض إعادة شراء ولا نصيحة مالية. عروض إعادة البيع في المحلات تعتمد على القطعة وحالتها ولوحة أسعار التاجر.',
    methodology: 'كيف تُحسب الأسعار ←',
    freshness: {
      live: 'مباشر',
      delayed: 'متأخر',
      cached: 'مخزّن',
      stale: 'قديم',
      fallback: 'احتياطي',
      closed: 'مغلق',
      unavailable: 'غير متوفر',
    },
    docTitle: 'متتبع محفظة الذهب | Gold Ticker Live',
  },
};

// ── State ─────────────────────────────────────────────────────────────────────
const STATE = {
  lang: 'en',
  spotUsdPerOz: 0,
  spotSource: 'cached/fallback',
  rates: {},
  freshness: { goldUpdatedAt: null },
  status: { goldStale: false, fxStale: false },
  fxMeta: { lastUpdateUtc: null, nextUpdateUtc: 0 },
  history: [],
  goldPriceUsdPerOz: 0,
  portfolio: { version: 1, currency: 'AED', holdings: [] },
  editingId: null,
};

function t() {
  return T[STATE.lang] || T.en;
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function fmtMoney(value, currency) {
  if (value == null || Number.isNaN(value)) return t().unavailable;
  return formatPrice(value, currency, currencyDecimals(currency));
}
function fmtSigned(value, currency) {
  if (value == null || Number.isNaN(value)) return t().unavailable;
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatPrice(Math.abs(value), currency, currencyDecimals(currency))}`;
}
function fmtSignedPct(value) {
  if (value == null || Number.isNaN(value)) return '';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `(${sign}${Math.abs(value).toFixed(1)}%)`;
}

/**
 * Gain amount + percent as DOM nodes. The percent sits in its own
 * bidi-isolated span so RTL currency symbols (د.إ, ر.س) cannot reorder the
 * "(+4.6%)" fragment in either language direction.
 */
function gainNodes(value, pct, currency) {
  const nodes = [fmtSigned(value, currency)];
  const pctText = fmtSignedPct(pct);
  if (pctText) {
    nodes.push(' ');
    nodes.push(el('span', { dir: 'ltr', class: 'portfolio-gain-pct' }, [pctText]));
  }
  return nodes;
}

// ── Storage ───────────────────────────────────────────────────────────────────
function loadPortfolio() {
  let raw = null;
  try {
    raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
  } catch {
    /* storage unavailable — start empty */
  }
  STATE.portfolio = parsePortfolio(raw, { now: todayIso() });
}

function savePortfolio() {
  try {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, serializePortfolio(STATE.portfolio));
  } catch {
    cache.showStorageQuotaWarning();
  }
}

// ── Live data ─────────────────────────────────────────────────────────────────
async function fetchLiveData() {
  try {
    const [goldRes, fxRes] = await Promise.allSettled([api.fetchGold(), api.fetchFX()]);
    if (goldRes.status === 'fulfilled') {
      STATE.spotUsdPerOz = goldRes.value.price;
      STATE.goldPriceUsdPerOz = goldRes.value.price;
      STATE.freshness.goldUpdatedAt = goldRes.value.updatedAt || new Date().toISOString();
      STATE.spotSource = goldRes.value.source === 'cache-fallback' ? 'cached/fallback' : 'live';
      cache.saveGoldPrice(goldRes.value.price, goldRes.value.updatedAt);
    } else if (STATE.spotUsdPerOz) {
      STATE.spotSource = 'cached/fallback';
    }
    if (fxRes.status === 'fulfilled') {
      STATE.rates = fxRes.value.rates;
      cache.saveFXRates(fxRes.value.rates, {
        lastUpdateUtc: fxRes.value.time_last_update_utc,
        nextUpdateUtc: fxRes.value.time_next_update_utc,
      });
    }
    cache.saveHistorySnapshot(STATE);
    updateSharedSurfaces();
    render();
  } catch (e) {
    console.warn('Portfolio fetch error:', e);
  }
}

function updateSharedSurfaces() {
  if (!STATE.spotUsdPerOz) return;
  const TROY = CONSTANTS.TROY_OZ_GRAMS;
  const AED = CONSTANTS.AED_PEG;
  const aed24 = (STATE.spotUsdPerOz / TROY) * AED;
  updateTicker({
    xauUsd: STATE.spotUsdPerOz,
    uae24k: aed24,
    uae22k: ((STATE.spotUsdPerOz * (22 / 24)) / TROY) * AED,
    uae21k: ((STATE.spotUsdPerOz * (21 / 24)) / TROY) * AED,
    uae18k: ((STATE.spotUsdPerOz * (18 / 24)) / TROY) * AED,
    updatedAt: STATE.freshness.goldUpdatedAt,
    hasLiveFailure: STATE.spotSource !== 'live',
  });
  updateSpotBar({
    xauUsd: STATE.spotUsdPerOz,
    aed24kGram: aed24,
    updatedAt: STATE.freshness.goldUpdatedAt,
    hasLiveFailure: STATE.spotSource !== 'live',
  });
}

// ── Spot badge ────────────────────────────────────────────────────────────────
function renderSpotBadge() {
  const priceNode = document.getElementById('portfolio-spot-price');
  const freshNode = document.getElementById('portfolio-freshness');
  if (priceNode) {
    priceNode.textContent = STATE.spotUsdPerOz
      ? `$${STATE.spotUsdPerOz.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : '—';
  }
  if (freshNode) {
    const f = getLiveFreshness({
      updatedAt: STATE.freshness.goldUpdatedAt,
      lang: STATE.lang,
      hasLiveFailure: STATE.spotSource !== 'live',
    });
    // Never claim "Live" while the gold market is closed — mirror the overlay the
    // shared spot bar / ticker apply (docs/freshness-contract.md).
    const key = applyMarketClosedOverlay(f.key);
    const dict = t();
    clear(freshNode);
    freshNode.dataset.state = key;
    freshNode.appendChild(el('span', { class: 'portfolio-fresh-dot', 'aria-hidden': 'true' }));
    freshNode.appendChild(
      el('span', {}, [`${dict.freshness[key] || key}${f.ageText ? ` · ${f.ageText}` : ''}`])
    );
  }
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
function renderToolbar() {
  const host = document.getElementById('portfolio-toolbar');
  if (!host) return;
  const dict = t();
  clear(host);

  const currencySelect = el('select', {
    class: 'portfolio-currency-select',
    id: 'portfolio-currency',
    'aria-label': dict.currencyLabel,
    onchange: (e) => {
      STATE.portfolio.currency = e.target.value;
      savePortfolio();
      render();
    },
  });
  for (const currency of CURRENCIES) {
    currencySelect.appendChild(
      el('option', { value: currency, selected: STATE.portfolio.currency === currency }, [currency])
    );
  }

  host.appendChild(
    el('div', { class: 'portfolio-toolbar-group' }, [
      el('label', { class: 'portfolio-toolbar-label', for: 'portfolio-currency' }, [
        dict.currencyLabel,
      ]),
      currencySelect,
    ])
  );

  const actions = el('div', { class: 'portfolio-toolbar-actions' });
  actions.appendChild(
    el(
      'button',
      { type: 'button', class: 'portfolio-btn portfolio-btn-primary', onclick: () => openForm() },
      [dict.addHolding]
    )
  );
  if (STATE.portfolio.holdings.length) {
    actions.appendChild(
      el('button', { type: 'button', class: 'portfolio-btn', onclick: exportCsv }, [dict.exportCsv])
    );
    actions.appendChild(
      el('button', { type: 'button', class: 'portfolio-btn', onclick: exportJson }, [
        dict.exportJson,
      ])
    );
  }
  actions.appendChild(
    el('button', { type: 'button', class: 'portfolio-btn', onclick: importJson }, [dict.importJson])
  );
  if (STATE.portfolio.holdings.length) {
    actions.appendChild(
      el(
        'button',
        { type: 'button', class: 'portfolio-btn portfolio-btn-danger', onclick: confirmClearAll },
        [dict.clearAll]
      )
    );
  }
  host.appendChild(actions);
}

// ── Summary cards ─────────────────────────────────────────────────────────────
function renderSummary(summary) {
  const host = document.getElementById('portfolio-summary');
  if (!host) return;
  const dict = t();
  const currency = STATE.portfolio.currency;
  clear(host);
  if (!summary.count) {
    host.hidden = true;
    return;
  }
  host.hidden = false;

  const card = (label, valueNodes, hint) =>
    el('div', { class: 'portfolio-card' }, [
      el('span', { class: 'portfolio-card-label' }, [label]),
      el('strong', { class: 'portfolio-card-value' }, valueNodes),
      hint ? el('span', { class: 'portfolio-card-hint' }, [hint]) : null,
    ]);

  host.appendChild(
    card(
      dict.cardValue,
      [
        summary.currentDisplay != null
          ? fmtMoney(summary.currentDisplay, currency)
          : dict.valueUnavailable,
      ],
      dict.cardValueHint
    )
  );

  host.appendChild(
    card(
      dict.cardWeight,
      [`${summary.totalWeightGrams} ${dict.cardWeightUnit}`],
      `${summary.totalFineGrams} ${dict.cardWeightFine}`
    )
  );

  if (summary.mixedCostCurrencies) {
    host.appendChild(card(dict.cardCost, [dict.cardCostMixed]));
  } else {
    const costCurrency = Object.keys(summary.costByCurrency)[0];
    const cost = costCurrency ? summary.costByCurrency[costCurrency] : null;
    host.appendChild(
      card(dict.cardCost, [cost != null ? fmtMoney(cost, costCurrency) : dict.unavailable])
    );
  }

  if (summary.gain) {
    const cls =
      summary.gain.value > 0
        ? 'portfolio-gain-up'
        : summary.gain.value < 0
          ? 'portfolio-gain-down'
          : '';
    host.appendChild(
      card(
        dict.cardGain,
        [el('span', { class: cls }, gainNodes(summary.gain.value, summary.gain.pct, currency))],
        dict.cardGainHint
      )
    );
  } else {
    host.appendChild(
      card(dict.cardGain, [summary.mixedCostCurrencies ? dict.cardGainMixed : dict.cardGainNoCost])
    );
  }
}

// ── Timeline sparkline ────────────────────────────────────────────────────────
function renderTimeline() {
  const section = document.getElementById('portfolio-chart-section');
  const host = document.getElementById('portfolio-chart');
  if (!section || !host) return;
  const dict = t();
  const currency = STATE.portfolio.currency;
  const points = computeTimeline(STATE.portfolio.holdings, STATE.history, currency);
  clear(host);

  if (!STATE.portfolio.holdings.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  if (points.length < 2) {
    host.appendChild(el('p', { class: 'portfolio-chart-empty' }, [dict.chartEmpty]));
    return;
  }

  const width = 640;
  const height = 160;
  const pad = 8;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i) => pad + (i / (points.length - 1)) * (width - pad * 2);
  const y = (v) => height - pad - ((v - min) / span) * (height - pad * 2);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'portfolio-spark');
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    `${dict.chartTitle}: ${points[0].date} ${fmtMoney(points[0].value, currency)} → ${points[points.length - 1].date} ${fmtMoney(points[points.length - 1].value, currency)}`
  );

  let d = '';
  points.forEach((p, i) => {
    d += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`;
  });

  const area = document.createElementNS(SVG_NS, 'path');
  area.setAttribute(
    'd',
    `${d}L${x(points.length - 1).toFixed(1)},${height - pad}L${x(0).toFixed(1)},${height - pad}Z`
  );
  area.setAttribute('class', 'portfolio-spark-area');
  svg.appendChild(area);

  const line = document.createElementNS(SVG_NS, 'path');
  line.setAttribute('d', d);
  line.setAttribute('class', 'portfolio-spark-line');
  line.setAttribute('fill', 'none');
  svg.appendChild(line);

  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', x(points.length - 1).toFixed(1));
  dot.setAttribute('cy', y(points[points.length - 1].value).toFixed(1));
  dot.setAttribute('r', '3.5');
  dot.setAttribute('class', 'portfolio-spark-dot');
  svg.appendChild(dot);

  host.appendChild(svg);

  // Min / max / latest labels keep the sparkline honest without a full axis.
  host.appendChild(
    el('div', { class: 'portfolio-spark-labels' }, [
      el('span', {}, [`${points[0].date}`]),
      el('span', { class: 'portfolio-spark-range' }, [
        `${fmtMoney(min, currency)} – ${fmtMoney(max, currency)}`,
      ]),
      el('span', {}, [`${points[points.length - 1].date}`]),
    ])
  );
}

// ── Holdings table ────────────────────────────────────────────────────────────
function renderHoldings(summary) {
  const host = document.getElementById('portfolio-holdings');
  if (!host) return;
  const dict = t();
  clear(host);

  if (!summary.count) {
    host.appendChild(
      el('div', { class: 'portfolio-empty' }, [
        el('h2', { class: 'portfolio-empty-title' }, [dict.emptyTitle]),
        el('p', { class: 'portfolio-empty-body' }, [dict.emptyBody]),
        el(
          'button',
          {
            type: 'button',
            class: 'portfolio-btn portfolio-btn-primary',
            onclick: () => openForm(),
          },
          [dict.addHolding]
        ),
      ])
    );
    return;
  }

  const table = el('table', { class: 'portfolio-table' });
  table.appendChild(
    el('thead', {}, [
      el('tr', {}, [
        el('th', { scope: 'col' }, [dict.colLabel]),
        el('th', { scope: 'col' }, [dict.colWeight]),
        el('th', { scope: 'col' }, [dict.colKarat]),
        el('th', { scope: 'col' }, [dict.colDate]),
        el('th', { scope: 'col' }, [dict.colCost]),
        el('th', { scope: 'col' }, [dict.colValue]),
        el('th', { scope: 'col' }, [dict.colGain]),
        el('th', { scope: 'col' }, [dict.colActions]),
      ]),
    ])
  );

  const tbody = el('tbody');
  const currency = STATE.portfolio.currency;
  for (const entry of summary.valued) {
    const h = entry.holding;
    const karat = KARATS.find((k) => k.code === h.karat);
    const karatLabel = STATE.lang === 'ar' ? `عيار ${h.karat}` : `${h.karat}K`;
    let gainNode;
    if (h.costTotal <= 0) {
      gainNode = el('span', { class: 'portfolio-muted' }, [dict.gainNoCost]);
    } else if (entry.gainValue == null) {
      gainNode = el('span', { class: 'portfolio-muted' }, [dict.unavailable]);
    } else {
      const cls =
        entry.gainValue > 0
          ? 'portfolio-gain-up'
          : entry.gainValue < 0
            ? 'portfolio-gain-down'
            : '';
      gainNode = el(
        'span',
        { class: cls },
        gainNodes(entry.gainValue, entry.gainPct, h.costCurrency)
      );
    }

    tbody.appendChild(
      el('tr', {}, [
        el('th', { scope: 'row', class: 'portfolio-table-label' }, [
          h.label || (karat ? (STATE.lang === 'ar' ? karat.labelAr : karat.labelEn) : h.karat),
        ]),
        el('td', {}, [`${h.weightGrams} g`]),
        el('td', {}, [karatLabel]),
        el('td', {}, [h.purchaseDate]),
        el('td', {}, [h.costTotal > 0 ? fmtMoney(h.costTotal, h.costCurrency) : dict.unavailable]),
        el('td', {}, [
          entry.currentDisplay != null
            ? fmtMoney(entry.currentDisplay, currency)
            : dict.unavailable,
        ]),
        el('td', {}, [gainNode]),
        el('td', { class: 'portfolio-table-actions' }, [
          el(
            'button',
            {
              type: 'button',
              class: 'portfolio-row-btn',
              onclick: () => openForm(h.id),
              'aria-label': `${dict.edit}: ${h.label || h.purchaseDate}`,
            },
            [dict.edit]
          ),
          el(
            'button',
            {
              type: 'button',
              class: 'portfolio-row-btn portfolio-row-btn-danger',
              onclick: () => confirmDelete(h.id),
              'aria-label': `${dict.remove}: ${h.label || h.purchaseDate}`,
            },
            [dict.remove]
          ),
        ]),
      ])
    );
  }
  table.appendChild(tbody);

  const wrap = el('div', { class: 'portfolio-table-wrap' });
  wrap.appendChild(table);
  host.appendChild(wrap);
}

// ── Add / edit dialog ─────────────────────────────────────────────────────────
function openForm(editId = null) {
  const dict = t();
  if (!editId && STATE.portfolio.holdings.length >= MAX_HOLDINGS) {
    showCopyToast(dict.limitReached);
    return;
  }
  STATE.editingId = editId;
  const editing = STATE.portfolio.holdings.find((h) => h.id === editId) || null;

  const dialog = document.getElementById('portfolio-dialog');
  if (!dialog) return;
  clear(dialog);

  const title = el('h2', { id: 'portfolio-dialog-title', class: 'portfolio-dialog-title' }, [
    editing ? dict.editHolding : dict.addHolding,
  ]);

  const errorNote = el('p', { class: 'portfolio-form-error', role: 'alert', hidden: true }, [
    dict.formErrors,
  ]);

  const labelInput = el('input', {
    type: 'text',
    id: 'pf-label',
    class: 'portfolio-input',
    maxlength: '80',
    placeholder: dict.formLabelPlaceholder,
    value: editing ? editing.label : '',
  });
  const weightInput = el('input', {
    type: 'number',
    id: 'pf-weight',
    class: 'portfolio-input',
    min: '0.001',
    step: '0.001',
    inputmode: 'decimal',
    required: true,
    value: editing ? String(editing.weightGrams) : '',
  });
  const karatSelect = el('select', { id: 'pf-karat', class: 'portfolio-input' });
  for (const karat of KARATS) {
    karatSelect.appendChild(
      el(
        'option',
        {
          value: karat.code,
          selected: editing ? editing.karat === karat.code : karat.code === '22',
        },
        [STATE.lang === 'ar' ? karat.labelAr : karat.labelEn]
      )
    );
  }
  const dateInput = el('input', {
    type: 'date',
    id: 'pf-date',
    class: 'portfolio-input',
    max: todayIso(),
    required: true,
    value: editing ? editing.purchaseDate : todayIso(),
  });
  const costInput = el('input', {
    type: 'number',
    id: 'pf-cost',
    class: 'portfolio-input',
    min: '0',
    step: '0.01',
    inputmode: 'decimal',
    value: editing ? String(editing.costTotal) : '',
  });
  const costCurrencySelect = el('select', { id: 'pf-cost-currency', class: 'portfolio-input' });
  for (const currency of CURRENCIES) {
    costCurrencySelect.appendChild(
      el(
        'option',
        {
          value: currency,
          selected: editing
            ? editing.costCurrency === currency
            : STATE.portfolio.currency === currency,
        },
        [currency]
      )
    );
  }

  const field = (labelText, inputNode, inputId) =>
    el('div', { class: 'portfolio-field' }, [
      el('label', { class: 'portfolio-field-label', for: inputId }, [labelText]),
      inputNode,
    ]);

  const form = el(
    'form',
    {
      class: 'portfolio-form',
      onsubmit: (e) => {
        e.preventDefault();
        const raw = {
          id: editing ? editing.id : makeId(),
          label: labelInput.value,
          weightGrams: weightInput.value,
          karat: karatSelect.value,
          purchaseDate: dateInput.value,
          costTotal: costInput.value === '' ? 0 : costInput.value,
          costCurrency: costCurrencySelect.value,
          createdAt: editing ? editing.createdAt : new Date().toISOString(),
        };
        const clean = sanitizeHolding(raw, { now: todayIso() });
        if (!clean) {
          errorNote.hidden = false;
          return;
        }
        clean.id = raw.id;
        clean.createdAt = raw.createdAt;
        if (editing) {
          STATE.portfolio.holdings = STATE.portfolio.holdings.map((h) =>
            h.id === editing.id ? clean : h
          );
        } else {
          STATE.portfolio.holdings = [...STATE.portfolio.holdings, clean];
        }
        savePortfolio();
        dialog.close();
        render();
        track(EVENTS.TOOL_USE, {
          tool: 'portfolio',
          path: location.pathname,
          locale: STATE.lang,
          action: editing ? 'edit_holding' : 'add_holding',
        });
      },
    },
    [
      field(dict.formLabel, labelInput, 'pf-label'),
      el('div', { class: 'portfolio-field-row' }, [
        field(dict.formWeight, weightInput, 'pf-weight'),
        field(dict.formKarat, karatSelect, 'pf-karat'),
      ]),
      field(dict.formDate, dateInput, 'pf-date'),
      el('div', { class: 'portfolio-field-row' }, [
        field(dict.formCost, costInput, 'pf-cost'),
        field(dict.formCostCurrency, costCurrencySelect, 'pf-cost-currency'),
      ]),
      errorNote,
      el('div', { class: 'portfolio-form-actions' }, [
        el('button', { type: 'button', class: 'portfolio-btn', onclick: () => dialog.close() }, [
          dict.formCancel,
        ]),
        el('button', { type: 'submit', class: 'portfolio-btn portfolio-btn-primary' }, [
          dict.formSave,
        ]),
      ]),
    ]
  );

  dialog.appendChild(title);
  dialog.appendChild(form);
  dialog.showModal();
}

// ── Confirm dialogs ───────────────────────────────────────────────────────────
function confirmDialog({ title, body, onConfirm }) {
  const dict = t();
  const dialog = document.getElementById('portfolio-dialog');
  if (!dialog) return;
  clear(dialog);
  dialog.appendChild(
    el('h2', { id: 'portfolio-dialog-title', class: 'portfolio-dialog-title' }, [title])
  );
  if (body) dialog.appendChild(el('p', { class: 'portfolio-dialog-body' }, [body]));
  dialog.appendChild(
    el('div', { class: 'portfolio-form-actions' }, [
      el('button', { type: 'button', class: 'portfolio-btn', onclick: () => dialog.close() }, [
        dict.confirmCancel,
      ]),
      el(
        'button',
        {
          type: 'button',
          class: 'portfolio-btn portfolio-btn-danger',
          onclick: () => {
            dialog.close();
            onConfirm();
          },
        },
        [dict.confirmDelete]
      ),
    ])
  );
  dialog.showModal();
}

function confirmDelete(id) {
  confirmDialog({
    title: t().confirmDeleteTitle,
    onConfirm: () => {
      STATE.portfolio.holdings = STATE.portfolio.holdings.filter((h) => h.id !== id);
      savePortfolio();
      render();
    },
  });
}

function confirmClearAll() {
  confirmDialog({
    title: t().confirmDeleteAllTitle,
    body: t().confirmDeleteAllBody,
    onConfirm: () => {
      STATE.portfolio.holdings = [];
      savePortfolio();
      render();
    },
  });
}

// ── Export / import ───────────────────────────────────────────────────────────
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const summary = summarizePortfolio(
    STATE.portfolio.holdings,
    STATE.spotUsdPerOz,
    STATE.rates,
    STATE.portfolio.currency
  );
  downloadFile(
    holdingsToCsv(summary.valued, STATE.portfolio.currency),
    `gold-portfolio-${todayIso()}.csv`,
    'text/csv;charset=utf-8'
  );
  showCopyToast(t().csvDone);
  track(EVENTS.EXPORT_CLICK, { surface: 'portfolio', export_type: 'csv' });
}

function exportJson() {
  downloadFile(
    serializePortfolio(STATE.portfolio),
    `gold-portfolio-backup-${todayIso()}.json`,
    'application/json'
  );
  showCopyToast(t().jsonDone);
  track(EVENTS.EXPORT_CLICK, { surface: 'portfolio', export_type: 'json' });
}

function importJson() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parsePortfolio(String(reader.result || ''), { now: todayIso() });
      if (!parsed.holdings.length) {
        showCopyToast(t().importFailed);
        return;
      }
      // Restore replaces the current set — ids are regenerated to avoid clashes.
      parsed.holdings = parsed.holdings.map((h) => ({ ...h, id: h.id || makeId() }));
      STATE.portfolio = parsed;
      savePortfolio();
      render();
      showCopyToast(t().imported);
    };
    reader.readAsText(file);
  });
  input.click();
}

// ── Language ──────────────────────────────────────────────────────────────────
function applyLang() {
  const dict = t();
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  const set = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  };
  set('portfolio-h1', dict.h1);
  set('portfolio-sub', dict.sub);
  set('portfolio-spot-label', dict.spotLabel);
  set('portfolio-privacy', dict.privacy);
  set('portfolio-chart-title', dict.chartTitle);
  set('portfolio-chart-note', dict.chartNote);
  set('portfolio-holdings-title', dict.holdingsTitle);
  set('portfolio-how-title', dict.howTitle);
  set('portfolio-how-1', dict.how1);
  set('portfolio-how-2', dict.how2);
  set('portfolio-how-3', dict.how3);
  set('portfolio-disclaimer', dict.disclaimer);
  const methodLink = document.getElementById('portfolio-methodology');
  if (methodLink) methodLink.textContent = dict.methodology;
  document.title = dict.docTitle;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const summary = summarizePortfolio(
    STATE.portfolio.holdings,
    STATE.spotUsdPerOz,
    STATE.rates,
    STATE.portfolio.currency
  );
  renderSpotBadge();
  renderToolbar();
  renderSummary(summary);
  renderTimeline();
  renderHoldings(summary);
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  cache.loadState(STATE);
  loadPortfolio();

  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'ar' || urlLang === 'en') STATE.lang = urlLang;
  else if (cache.getPreference('lang') === 'ar') STATE.lang = 'ar';

  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  const shell = mountSharedShell({ lang: STATE.lang, depth: 0, withSpotBar: true });
  initPageEnter('#main-content');
  injectBreadcrumbs('portfolio');

  shell.navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      shell.updateLang(STATE.lang);
      applyLang();
      render();
    });
  });

  applyLang();
  render();
  await fetchLiveData();

  let refreshTimer = setInterval(fetchLiveData, CONSTANTS.GOLD_REFRESH_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    } else if (!refreshTimer) {
      fetchLiveData();
      refreshTimer = setInterval(fetchLiveData, CONSTANTS.GOLD_REFRESH_MS);
    }
  });
  window.addEventListener(
    'pagehide',
    () => {
      clearInterval(refreshTimer);
      refreshTimer = null;
    },
    { once: true }
  );

  track(EVENTS.PAGE_VIEW, { path: location.pathname, locale: STATE.lang });
  track(EVENTS.PRICE_VIEW, { path: location.pathname, locale: STATE.lang, surface: 'portfolio' });
}

init();
