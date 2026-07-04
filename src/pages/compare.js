/**
 * Compare Countries — page orchestrator.
 *
 * Standalone interactive tool that compares spot-linked gold reference prices
 * and all-in retail estimates across the Arab-world + GCC markets the site
 * already tracks. Features:
 *   • Sortable comparison table (click headers; once = ASC, twice = DESC)
 *   • Multi-select country chips (max 6) with an "add country" dropdown
 *   • URL-hash deep links (`#compare=ae,sa,kw,qa&k=22`)
 *   • UAE row pinned as the reference point; cells tinted vs UAE (+ ▲/▼ text)
 *   • Side-by-side detail panel when exactly two countries are selected
 *   • "Cheapest to buy" callout (lowest all-in retail estimate, USD/g)
 *
 * Reuses the shared price/FX pipeline and the shared shell. The 90-second
 * refresh cadence and the fixed AED peg are preserved.
 */

import { CONSTANTS, COUNTRIES, KARATS } from '../config/index.js';
import { getMarketIntel } from '../config/market-intel.js';
import * as api from '../lib/api.js';
import * as cache from '../lib/cache.js';
import { formatPrice } from '../lib/formatter.js';
import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { updateTicker } from '../components/ticker.js';
import { updateSpotBar } from '../components/spotBar.js';
import { el, clear } from '../lib/safe-dom.js';
import { flagSymbolForCountry, iconUseElement } from '../components/icon-sprite.js';
import { track, EVENTS } from '../lib/analytics.js';
import { getLiveFreshness } from '../lib/live-status.js';
import { countUp } from '../lib/count-up.js';
import { initPageEnter } from '../lib/page-enter.js';
import {
  buildComparisonRows,
  annotatePctVsUae,
  sortRows,
  computeCheapest,
  parseCompareHash,
  serializeCompareHash,
  COMPARE_KARATS,
  MAX_COMPARE,
} from './compare/compare-core.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VALID_CODES = new Set(COUNTRIES.map((c) => c.code));

/**
 * Wrapper span holding the inline-SVG flag for a country (sprite `f-*`
 * symbols) — flag emoji are banned in UI (they render as "AE" letter pairs on
 * Windows). safe-dom's `el()` only appends nodes it created itself, so the
 * SVG from `iconUseElement` (createElementNS) is attached with appendChild.
 * Falls back to the `i-globe` monoline icon when no flag symbol exists.
 * @param {string|undefined} code  ISO country code, e.g. 'AE'
 * @param {string} className       wrapper span class (page CSS sizes the svg)
 */
function flagBadge(code, className) {
  const wrap = el('span', { class: className, 'aria-hidden': 'true' });
  const symbol = flagSymbolForCountry(code);
  wrap.appendChild(
    symbol
      ? iconUseElement(symbol, 'nav-flag compare-flag-ico')
      : iconUseElement('i-globe', 'nav-ico compare-flag-ico')
  );
  return wrap;
}

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    h1: 'Compare Gold Prices by Country',
    sub: 'Live 24K–18K reference prices and all-in retail estimates across the GCC and Arab world. Sort, filter and compare side by side.',
    spotLabel: 'XAU/USD spot:',
    karatLabel: 'Karat',
    selected: 'Selected countries',
    addCountry: 'Add country',
    addHint: 'Pick a country to compare',
    max: `Up to ${MAX_COMPARE} countries`,
    remove: 'Remove',
    colCountry: 'Country',
    colCurrency: 'Currency',
    colLocal: 'local/g',
    colUsd: 'USD/g',
    colVat: 'VAT',
    colMaking: 'Making',
    colRetail: 'Retail est. (USD/g)',
    colVsUae: 'vs UAE',
    cheapestLabel: 'Currently most affordable',
    cheapestSuffix: 'all-in retail estimate per gram',
    cheapestEmpty: 'Waiting for live prices…',
    detailTitle: 'Side-by-side detail',
    detailHint: 'Select exactly two countries to see a full karat-by-karat breakdown.',
    perGram: 'per gram',
    aedEquiv: 'AED equiv.',
    vatRate: 'VAT / sales tax',
    makingRange: 'Typical making charge',
    marketNote: 'Market note',
    chartTitle: 'Retail estimate per gram (USD)',
    swipeHint: '← swipe to see all columns →',
    refReference: 'Reference',
    none: 'No countries selected. Add one to start comparing.',
    disclaimer:
      'Gold value per gram is globally identical in USD — differences below come from local VAT and typical making charges. All figures are spot-linked reference estimates, not final retail quotes or financial advice.',
    methodology: 'How prices work →',
    unavailable: 'Unavailable',
    freshness: {
      live: 'Live',
      delayed: 'Delayed',
      cached: 'Cached',
      stale: 'Stale',
      fallback: 'Fallback',
      closed: 'Closed',
      unavailable: 'Unavailable',
    },
  },
  ar: {
    h1: 'قارن أسعار الذهب حسب الدولة',
    sub: 'أسعار مرجعية حية لعيار 24 إلى 18 وتقديرات التجزئة الشاملة عبر الخليج والعالم العربي. رتّب وقارن جنباً إلى جنب.',
    spotLabel: 'سعر الأونصة (XAU/USD):',
    karatLabel: 'العيار',
    selected: 'الدول المختارة',
    addCountry: 'إضافة دولة',
    addHint: 'اختر دولة للمقارنة',
    max: `حتى ${MAX_COMPARE} دول`,
    remove: 'إزالة',
    colCountry: 'الدولة',
    colCurrency: 'العملة',
    colLocal: 'محلي/غرام',
    colUsd: 'دولار/غرام',
    colVat: 'ضريبة',
    colMaking: 'مصنعية',
    colRetail: 'تقدير التجزئة (دولار/غرام)',
    colVsUae: 'مقابل الإمارات',
    cheapestLabel: 'الأكثر تيسّراً حالياً',
    cheapestSuffix: 'تقدير التجزئة الشامل لكل غرام',
    cheapestEmpty: 'بانتظار الأسعار الحية…',
    detailTitle: 'تفاصيل جنباً إلى جنب',
    detailHint: 'اختر دولتين بالضبط لعرض تفصيل كامل حسب العيار.',
    perGram: 'لكل غرام',
    aedEquiv: 'بالدرهم',
    vatRate: 'الضريبة / ضريبة المبيعات',
    makingRange: 'المصنعية المعتادة',
    marketNote: 'ملاحظة السوق',
    chartTitle: 'تقدير التجزئة لكل غرام (دولار)',
    swipeHint: '← اسحب لرؤية كل الأعمدة →',
    refReference: 'مرجع',
    none: 'لا توجد دول مختارة. أضف دولة لبدء المقارنة.',
    disclaimer:
      'قيمة غرام الذهب متطابقة عالمياً بالدولار — الفروق أدناه ناتجة عن الضريبة المحلية والمصنعية المعتادة. جميع الأرقام تقديرات مرجعية مرتبطة بالسعر الفوري وليست أسعار تجزئة نهائية ولا نصيحة مالية.',
    methodology: 'كيف تُحتسب الأسعار ←',
    unavailable: 'غير متاح',
    freshness: {
      live: 'مباشر',
      delayed: 'متأخر قليلاً',
      cached: 'مخزن مؤقتاً',
      stale: 'قديم',
      fallback: 'بديل احتياطي',
      closed: 'مغلق',
      unavailable: 'غير متاح',
    },
  },
};

// ── State ─────────────────────────────────────────────────────────────────────
const STATE = {
  lang: 'en',
  spotUsdPerOz: 0,
  spotSource: 'cached/fallback',
  rates: {},
  freshness: { goldUpdatedAt: null },
  selectedCodes: [],
  karat: '22',
  sortKey: 'retailUsd',
  sortDir: 'asc',
  goldPriceUsdPerOz: 0,
};

function t() {
  return T[STATE.lang] || T.en;
}
function countryName(country) {
  return STATE.lang === 'ar' ? country.nameAr || country.nameEn : country.nameEn;
}
function intelNote(code) {
  const intel = getMarketIntel(code) || {};
  return STATE.lang === 'ar' ? intel.marketNoteAr || intel.marketNoteEn : intel.marketNoteEn;
}
function fmtUsd(value, decimals = 2) {
  if (value == null || Number.isNaN(value)) return '—';
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
function fmtPct(value) {
  if (value == null || Number.isNaN(value)) return '—';
  if (Math.abs(value) < 0.05) return '0%';
  const arrow = value > 0 ? '▲' : '▼';
  return `${arrow} ${Math.abs(value).toFixed(1)}%`;
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
    console.warn('Compare fetch error:', e);
  }
}

function updateSharedSurfaces() {
  if (!STATE.spotUsdPerOz) return;
  const TROY = CONSTANTS.TROY_OZ_GRAMS;
  const AED = CONSTANTS.AED_PEG;
  const aed24 = (STATE.spotUsdPerOz / TROY) * AED;
  const payload = {
    xauUsd: STATE.spotUsdPerOz,
    uae24k: aed24,
    uae22k: ((STATE.spotUsdPerOz * (22 / 24)) / TROY) * AED,
    uae21k: ((STATE.spotUsdPerOz * (21 / 24)) / TROY) * AED,
    uae18k: ((STATE.spotUsdPerOz * (18 / 24)) / TROY) * AED,
    updatedAt: STATE.freshness.goldUpdatedAt,
    hasLiveFailure: STATE.spotSource !== 'live',
  };
  updateTicker(payload);
  updateSpotBar({
    xauUsd: STATE.spotUsdPerOz,
    aed24kGram: aed24,
    updatedAt: STATE.freshness.goldUpdatedAt,
    hasLiveFailure: STATE.spotSource !== 'live',
  });
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function currentRows() {
  const selected = STATE.selectedCodes
    .map((code) => COUNTRIES.find((c) => c.code === code))
    .filter(Boolean);
  const rows = annotatePctVsUae(
    buildComparisonRows({
      spotUsdPerOz: STATE.spotUsdPerOz,
      rates: STATE.rates,
      countries: selected,
      karat: STATE.karat,
      getIntel: getMarketIntel,
    })
  );
  return rows;
}

function render() {
  renderSpotBadge();
  renderKaratTabs();
  renderChips();
  renderAddMenu();
  const rows = currentRows();
  renderCheapest(rows);
  renderTable(rows);
  renderDetail(rows);
}

function renderSpotBadge() {
  const priceEl = document.getElementById('compare-spot-price');
  const labelEl = document.getElementById('compare-spot-label');
  const freshEl = document.getElementById('compare-freshness');
  if (labelEl) labelEl.textContent = t().spotLabel;
  if (priceEl) priceEl.textContent = STATE.spotUsdPerOz ? fmtUsd(STATE.spotUsdPerOz) : '—';
  if (freshEl) {
    const f = getLiveFreshness({
      updatedAt: STATE.freshness.goldUpdatedAt,
      lang: STATE.lang,
      hasLiveFailure: STATE.spotSource !== 'live',
    });
    const label = t().freshness[f.key] || f.key;
    clear(freshEl);
    freshEl.dataset.state = f.key;
    freshEl.append(
      el('span', { class: 'compare-fresh-dot', 'aria-hidden': 'true' }),
      el('span', null, `${label} · ${f.ageText}`)
    );
  }
}

function renderKaratTabs() {
  const wrap = document.getElementById('compare-karat');
  if (!wrap) return;
  clear(wrap);
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', t().karatLabel);
  for (const k of COMPARE_KARATS) {
    const active = k === STATE.karat;
    wrap.append(
      el(
        'button',
        {
          type: 'button',
          class: `compare-karat-btn${active ? ' is-active' : ''}`,
          'aria-pressed': active ? 'true' : 'false',
          onClick: () => {
            if (STATE.karat === k) return;
            STATE.karat = k;
            syncHash();
            render();
          },
        },
        `${k}K`
      )
    );
  }
}

function renderChips() {
  const wrap = document.getElementById('compare-chips');
  if (!wrap) return;
  clear(wrap);
  if (!STATE.selectedCodes.length) {
    wrap.append(el('p', { class: 'compare-empty-note' }, t().none));
    return;
  }
  for (const code of STATE.selectedCodes) {
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) continue;
    const isUae = code === 'AE';
    wrap.append(
      el('span', { class: `compare-chip${isUae ? ' compare-chip--ref' : ''}` }, [
        flagBadge(country.code, 'compare-chip-flag'),
        el('span', { class: 'compare-chip-name' }, countryName(country)),
        el(
          'button',
          {
            type: 'button',
            class: 'compare-chip-remove',
            'aria-label': `${t().remove} ${countryName(country)}`,
            onClick: () => removeCountry(code),
          },
          '×'
        ),
      ])
    );
  }
}

function renderAddMenu() {
  const select = document.getElementById('compare-add-select');
  if (!select) return;
  const atMax = STATE.selectedCodes.length >= MAX_COMPARE;
  select.disabled = atMax;
  clear(select);
  select.append(el('option', { value: '' }, atMax ? t().max : t().addHint));
  const available = COUNTRIES.filter((c) => !STATE.selectedCodes.includes(c.code)).sort((a, b) =>
    countryName(a).localeCompare(countryName(b))
  );
  for (const country of available) {
    select.append(
      // <option> labels cannot render SVG — text only (no flag emoji).
      el('option', { value: country.code }, countryName(country))
    );
  }
}

function renderCheapest(rows) {
  const wrap = document.getElementById('compare-cheapest');
  if (!wrap) return;
  clear(wrap);
  const cheapest = computeCheapest(rows);
  if (!cheapest) {
    wrap.hidden = false;
    wrap.append(el('span', { class: 'compare-cheapest-text' }, t().cheapestEmpty));
    return;
  }
  wrap.hidden = false;
  const country = COUNTRIES.find((c) => c.code === cheapest.code);
  const priceSpan = el('strong', { class: 'compare-cheapest-price', 'data-countup': '1' }, '—');
  wrap.append(
    flagBadge(country?.code, 'compare-cheapest-flag'),
    el('span', { class: 'compare-cheapest-text' }, [
      el('span', { class: 'compare-cheapest-label' }, `${t().cheapestLabel}: `),
      el('span', { class: 'compare-cheapest-country' }, countryName(country || cheapest)),
      ' — ',
      priceSpan,
      el('span', { class: 'compare-cheapest-suffix' }, ` ${t().cheapestSuffix}`),
    ])
  );
  countUp(priceSpan, cheapest.retailUsdPerGram, {
    decimals: 2,
    format: (n) => fmtUsd(n),
  });
}

const COLUMNS = [
  { key: 'name', labelKey: 'colCountry', numeric: false },
  { key: 'currency', labelKey: 'colCurrency', numeric: false },
  { key: 'spotLocal', labelKey: 'colLocal', numeric: true },
  { key: 'spotUsd', labelKey: 'colUsd', numeric: true },
  { key: 'vat', labelKey: 'colVat', numeric: true },
  { key: 'making', labelKey: 'colMaking', numeric: true },
  { key: 'retailUsd', labelKey: 'colRetail', numeric: true, primary: true },
  { key: 'pctVsUae', labelKey: 'colVsUae', numeric: true },
];

function renderTable(rows) {
  const wrap = document.getElementById('compare-table-wrap');
  const hint = document.getElementById('compare-swipe-hint');
  if (!wrap) return;
  clear(wrap);
  if (!rows.length) {
    if (hint) hint.hidden = true;
    wrap.append(el('p', { class: 'compare-empty-note' }, t().none));
    return;
  }
  if (hint) {
    hint.hidden = false;
    hint.textContent = t().swipeHint;
  }

  const sorted = sortRows(rows, STATE.sortKey, STATE.sortDir);
  const table = el('table', { class: 'compare-table' });
  const thead = el('thead');
  const headRow = el('tr');
  for (const col of COLUMNS) {
    const isActive = STATE.sortKey === col.key;
    const ariaSort = isActive ? (STATE.sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
    headRow.append(
      el(
        'th',
        {
          scope: 'col',
          class: `compare-th${col.numeric ? ' compare-th--num' : ''}${
            col.primary ? ' compare-th--primary' : ''
          }${isActive ? ' is-sorted' : ''}`,
          'aria-sort': ariaSort,
        },
        [
          el(
            'button',
            {
              type: 'button',
              class: 'compare-sort-btn',
              onClick: () => toggleSort(col.key),
            },
            [
              t()[col.labelKey],
              el(
                'span',
                { class: 'compare-sort-ind', 'aria-hidden': 'true' },
                isActive ? (STATE.sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'
              ),
            ]
          ),
        ]
      )
    );
  }
  thead.append(headRow);
  table.append(thead);

  const tbody = el('tbody');
  for (const row of sorted) {
    const isUae = row.code === 'AE';
    let tint = '';
    if (!isUae && row.pctVsUae != null) {
      if (row.pctVsUae < -0.05) tint = ' compare-row--lower';
      else if (row.pctVsUae > 0.05) tint = ' compare-row--higher';
    }
    const tr = el('tr', { class: `compare-row${isUae ? ' compare-row--ref' : ''}${tint}` });
    // Country
    tr.append(
      el('th', { scope: 'row', class: 'compare-td compare-td--country' }, [
        flagBadge(row.code, 'compare-td-flag'),
        el('span', { class: 'compare-td-name' }, countryName(row)),
        isUae ? el('span', { class: 'compare-ref-badge' }, t().refReference) : null,
      ])
    );
    if (!row.available) {
      const td = el(
        'td',
        { class: 'compare-td compare-td--unavailable', colspan: String(COLUMNS.length - 1) },
        t().unavailable
      );
      tr.append(el('td', { class: 'compare-td' }, row.currency), td);
      tbody.append(tr);
      continue;
    }
    tr.append(
      el('td', { class: 'compare-td' }, row.currency),
      el(
        'td',
        { class: 'compare-td compare-td--num' },
        formatPrice(row.spotLocalPerGram, row.currency, row.decimals)
      ),
      el('td', { class: 'compare-td compare-td--num' }, fmtUsd(row.spotUsdPerGram)),
      el('td', { class: 'compare-td compare-td--num' }, `${Math.round(row.vatRate * 100)}%`),
      el(
        'td',
        { class: 'compare-td compare-td--num' },
        `${Math.round(row.makingMin * 100)}–${Math.round(row.makingMax * 100)}%`
      ),
      el(
        'td',
        { class: 'compare-td compare-td--num compare-td--primary' },
        fmtUsd(row.retailUsdPerGram)
      ),
      el(
        'td',
        {
          class: `compare-td compare-td--num compare-td--pct${tint ? tint.replace('compare-row', '') : ''}`,
        },
        isUae ? '—' : fmtPct(row.pctVsUae)
      )
    );
    tbody.append(tr);
  }
  table.append(tbody);
  wrap.append(table);
}

function renderDetail(rows) {
  const wrap = document.getElementById('compare-detail');
  if (!wrap) return;
  clear(wrap);
  const titleId = 'compare-detail-title';
  wrap.append(el('h2', { class: 'compare-detail-title', id: titleId }, t().detailTitle));
  const available = rows.filter((r) => r.available);
  if (STATE.selectedCodes.length !== 2 || available.length !== 2) {
    wrap.append(el('p', { class: 'compare-detail-hint' }, t().detailHint));
    return;
  }
  const [a, b] = available;
  const grid = el('div', { class: 'compare-detail-grid' });
  grid.append(renderDetailCard(a), renderDetailCard(b));
  wrap.append(grid, renderDetailChart(a, b));
}

function karatGoldUsdPerGram(karatCode) {
  const purity = Number(karatCode) / 24;
  return (STATE.spotUsdPerOz / CONSTANTS.TROY_OZ_GRAMS) * purity;
}

function renderDetailCard(row) {
  const country = COUNTRIES.find((c) => c.code === row.code) || row;
  const karatRows = KARATS.map((k) => {
    const goldUsd = karatGoldUsdPerGram(k.code);
    const retailUsd = goldUsd * (1 + row.makingMid) * (1 + row.vatRate);
    const local = retailUsd * row.fxRate;
    const aed = retailUsd * CONSTANTS.AED_PEG;
    return el('div', { class: 'compare-detail-row' }, [
      el('span', { class: 'compare-detail-karat' }, `${k.code}K`),
      el('span', { class: 'compare-detail-local' }, formatPrice(local, row.currency, row.decimals)),
      el(
        'span',
        { class: 'compare-detail-aed' },
        row.currency === 'AED' ? '' : formatPrice(aed, 'AED', 2)
      ),
    ]);
  });
  return el(
    'article',
    { class: `compare-detail-card${row.code === 'AE' ? ' compare-detail-card--ref' : ''}` },
    [
      el('header', { class: 'compare-detail-head' }, [
        flagBadge(country.code, 'compare-detail-flag'),
        el('div', null, [
          el('h3', { class: 'compare-detail-name' }, countryName(country)),
          el('p', { class: 'compare-detail-cur' }, `${row.currency} · ${t().perGram}`),
        ]),
      ]),
      el('div', { class: 'compare-detail-table' }, [
        el('div', { class: 'compare-detail-row compare-detail-row--head' }, [
          el('span', { class: 'compare-detail-karat' }, t().karatLabel),
          el('span', { class: 'compare-detail-local' }, `${row.currency}/g`),
          el('span', { class: 'compare-detail-aed' }, row.currency === 'AED' ? '' : t().aedEquiv),
        ]),
        ...karatRows,
      ]),
      el('dl', { class: 'compare-detail-meta' }, [
        el('div', null, [
          el('dt', null, t().vatRate),
          el('dd', null, `${Math.round(row.vatRate * 100)}%`),
        ]),
        el('div', null, [
          el('dt', null, t().makingRange),
          el('dd', null, `${Math.round(row.makingMin * 100)}–${Math.round(row.makingMax * 100)}%`),
        ]),
        el('div', { class: 'compare-detail-note' }, [
          el('dt', null, t().marketNote),
          el('dd', null, intelNote(row.code) || '—'),
        ]),
      ]),
    ]
  );
}

function svgEl(tag, attrs, text) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderDetailChart(a, b) {
  const karats = COMPARE_KARATS;
  const data = karats.map((k) => {
    const goldUsd = karatGoldUsdPerGram(k);
    return {
      karat: k,
      a: goldUsd * (1 + a.makingMid) * (1 + a.vatRate),
      b: goldUsd * (1 + b.makingMid) * (1 + b.vatRate),
    };
  });
  const maxVal = Math.max(...data.map((d) => Math.max(d.a, d.b)), 1);
  const W = 320;
  const H = 160;
  const padBottom = 22;
  const padTop = 8;
  const chartH = H - padBottom - padTop;
  const groupW = W / karats.length;
  const barW = groupW * 0.32;

  const svg = svgEl('svg', {
    class: 'compare-chart-svg',
    viewBox: `0 0 ${W} ${H}`,
    role: 'img',
    'aria-label': `${t().chartTitle}: ${countryName(a)} vs ${countryName(b)}`,
    preserveAspectRatio: 'none',
  });
  data.forEach((d, i) => {
    const cx = i * groupW + groupW / 2;
    const aH = (d.a / maxVal) * chartH;
    const bH = (d.b / maxVal) * chartH;
    svg.append(
      svgEl('rect', {
        class: 'compare-chart-bar compare-chart-bar--a',
        x: (cx - barW - 1).toFixed(1),
        y: (padTop + chartH - aH).toFixed(1),
        width: barW.toFixed(1),
        height: aH.toFixed(1),
        rx: '2',
      }),
      svgEl('rect', {
        class: 'compare-chart-bar compare-chart-bar--b',
        x: (cx + 1).toFixed(1),
        y: (padTop + chartH - bH).toFixed(1),
        width: barW.toFixed(1),
        height: bH.toFixed(1),
        rx: '2',
      }),
      svgEl(
        'text',
        {
          class: 'compare-chart-label',
          x: cx.toFixed(1),
          y: (H - 6).toFixed(1),
          'text-anchor': 'middle',
        },
        `${d.karat}K`
      )
    );
  });

  const legend = el('div', { class: 'compare-chart-legend' }, [
    el('span', { class: 'compare-chart-key compare-chart-key--a' }, [
      flagBadge(a.code, 'compare-chart-flag'),
      countryName(a),
    ]),
    el('span', { class: 'compare-chart-key compare-chart-key--b' }, [
      flagBadge(b.code, 'compare-chart-flag'),
      countryName(b),
    ]),
  ]);

  return el('figure', { class: 'compare-chart' }, [
    el('figcaption', { class: 'compare-chart-caption' }, `${t().chartTitle}`),
    svg,
    legend,
  ]);
}

// ── Selection + sort actions ──────────────────────────────────────────────────
function toggleSort(key) {
  if (STATE.sortKey === key) {
    STATE.sortKey = key;
    STATE.sortDir = STATE.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    STATE.sortKey = key;
    STATE.sortDir = key === 'name' || key === 'currency' ? 'asc' : 'asc';
  }
  render();
}

function addCountry(code) {
  const clean = String(code || '').toUpperCase();
  if (!VALID_CODES.has(clean)) return;
  if (STATE.selectedCodes.includes(clean)) return;
  if (STATE.selectedCodes.length >= MAX_COMPARE) return;
  STATE.selectedCodes = [...STATE.selectedCodes, clean];
  syncHash();
  render();
}

function removeCountry(code) {
  STATE.selectedCodes = STATE.selectedCodes.filter((c) => c !== code);
  syncHash();
  render();
}

function syncHash() {
  const hash = serializeCompareHash({ codes: STATE.selectedCodes, karat: STATE.karat });
  if (location.hash.replace(/^#/, '') !== hash) {
    history.replaceState(null, '', `#${hash}`);
  }
}

function readHash() {
  const parsed = parseCompareHash(location.hash, VALID_CODES);
  STATE.selectedCodes = parsed.codes;
  STATE.karat = parsed.karat;
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
  set('compare-h1', dict.h1);
  set('compare-sub', dict.sub);
  set('compare-selected-label', dict.selected);
  set('compare-disclaimer', dict.disclaimer);
  const addLabel = document.querySelector('#compare-add-btn .compare-add-label');
  if (addLabel) addLabel.textContent = dict.addCountry;
  const methodLink = document.getElementById('compare-methodology');
  if (methodLink) methodLink.textContent = dict.methodology;
  document.title =
    STATE.lang === 'ar'
      ? 'قارن أسعار الذهب حسب الدولة | Gold Ticker Live'
      : 'Compare Gold Prices by Country | Gold Ticker Live';
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  cache.loadState(STATE);

  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'ar' || urlLang === 'en') STATE.lang = urlLang;
  else if (cache.getPreference('lang') === 'ar') STATE.lang = 'ar';

  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  const shell = mountSharedShell({ lang: STATE.lang, depth: 0, withSpotBar: true });
  initPageEnter('#main-content');
  injectBreadcrumbs('compare');

  shell.navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      shell.updateLang(STATE.lang);
      applyLang();
      render();
    });
  });

  readHash();
  applyLang();

  const select = document.getElementById('compare-add-select');
  if (select) {
    select.addEventListener('change', (e) => {
      const value = e.target.value;
      if (value) addCountry(value);
      e.target.value = '';
    });
  }

  window.addEventListener('hashchange', () => {
    readHash();
    applyLang();
    render();
  });

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
  track(EVENTS.PRICE_VIEW, { path: location.pathname, locale: STATE.lang, surface: 'compare' });
}

init();
