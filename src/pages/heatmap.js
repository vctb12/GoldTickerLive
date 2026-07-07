/**
 * Gold Price World Map — page orchestrator.
 *
 * Interactive inline-SVG choropleth of the all-in retail estimate (spot-linked
 * gold value + typical making charge + VAT) per gram across every market the
 * site tracks. Features:
 *   • 5-bucket one-hue gold ramp (theme-aware via CSS custom properties)
 *   • Karat switcher (24K/22K/21K/18K) + URL-hash deep links (`#k=22&c=eg`)
 *   • Hover/focus tooltip, keyboard-operable countries, jump-to-country select
 *   • Detail panel with per-country breakdown and cross links
 *   • Full data table fallback (also the a11y + no-JS-hover data surface)
 *
 * Reuses the shared price/FX pipeline, compare-core estimates and the shared
 * shell. The 90-second refresh cadence and the fixed AED peg are preserved.
 * Map geometry is generated (see scripts/node/generate-world-map.js) and
 * loaded lazily so the page paints before the ~100 KB path data arrives.
 */

import { CONSTANTS, COUNTRIES } from '../config/index.js';
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
import { initPageEnter } from '../lib/page-enter.js';
import {
  HEATMAP_KARATS,
  buildHeatmapRows,
  computeDomain,
  fillIndex,
  legendStops,
  parseHeatmapHash,
  serializeHeatmapHash,
} from './heatmap/heatmap-core.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VALID_CODES = new Set(COUNTRIES.map((c) => c.code));
const GROUP_ORDER = ['gcc', 'levant', 'africa', 'global'];

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en: {
    h1: 'Gold Price World Map',
    sub: 'All-in retail estimates for one gram of gold — spot-linked reference value plus typical making charges and VAT — colored across every market we track.',
    spotLabel: 'XAU/USD spot:',
    karatLabel: 'Karat',
    mapAria: 'World map of gold retail estimates by country',
    mapHint: 'Hover, tap or use the keyboard to explore countries. Full data in the table below.',
    legendTitle: 'All-in retail estimate (USD per gram)',
    legendTitleSpot: 'Spot-linked gold value (USD per gram)',
    legendNoData: 'No data',
    legendLower: 'Lower',
    legendHigher: 'Higher',
    lensLabel: 'Colour map by',
    lensRetail: 'Retail estimate',
    lensSpot: 'Spot value',
    lensSpotLegend: 'Identical worldwide',
    lensRetailCaption:
      'Darker gold = a higher all-in retail estimate. The differences come from local VAT and typical making charges — the underlying gold is the same everywhere.',
    lensSpotCaption:
      'Every market shows the same shade: gold’s spot-linked value per gram is identical worldwide in USD. Switch to the retail lens to see where local VAT and making charges raise the price.',
    jumpLabel: 'Jump to a country',
    jumpPlaceholder: 'Pick a country…',
    groups: {
      gcc: 'GCC',
      levant: 'Levant',
      africa: 'North & East Africa',
      global: 'Global Reference',
    },
    detailTitle: 'Country detail',
    detailEmpty: 'Select a country on the map — or from the list — to see its full breakdown.',
    retailEst: 'All-in retail estimate',
    spotRef: 'Spot-linked gold value',
    perGram: 'per gram',
    vatRate: 'VAT / sales tax',
    makingRange: 'Typical making charge',
    vsUae: 'vs UAE',
    reference: 'Reference',
    eurozone: 'Applies across Eurozone markets',
    marketNote: 'Market note',
    countryPage: 'Open country page →',
    compareLink: 'Compare with UAE →',
    calculatorLink: 'Value your gold →',
    tableTitle: 'All tracked markets',
    tableCaptionPrefix: 'All-in retail estimates per gram of',
    tableCaptionSuffix: 'gold, cheapest first. Reference figures, not shop quotes.',
    colCountry: 'Country',
    colRetail: 'Retail est. (USD/g)',
    colLocal: 'Local/g',
    colVat: 'VAT',
    colMaking: 'Making',
    colVsUae: 'vs UAE',
    unavailable: 'Unavailable',
    waiting: 'Waiting for live prices…',
    howTitle: 'How to read this map',
    how1: 'Every country starts from the same spot-linked gold value per gram in USD — the color differences come from local VAT and typical jewellery making charges.',
    how2: 'Darker gold means a higher all-in retail estimate; countries with no FX or market data stay neutral and are listed as unavailable.',
    how3: 'These are reference estimates for comparison — a shop’s final quote depends on the piece, its making charge and the daily rate board.',
    disclaimer:
      'Gold value per gram is globally identical in USD — the map colors reflect local VAT and typical making charges only. All figures are spot-linked reference estimates, not final retail quotes or financial advice.',
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
    docTitle: 'Gold Price World Map | Gold Ticker Live',
  },
  ar: {
    h1: 'خريطة أسعار الذهب حول العالم',
    sub: 'تقديرات التجزئة الشاملة لجرام الذهب الواحد — القيمة المرجعية المرتبطة بالسعر الفوري مضافاً إليها أجور الصياغة المعتادة والضريبة — ملوّنة عبر كل الأسواق التي نغطيها.',
    spotLabel: 'سعر الأونصة (XAU/USD):',
    karatLabel: 'العيار',
    mapAria: 'خريطة العالم لتقديرات أسعار الذهب بالتجزئة حسب الدولة',
    mapHint:
      'مرّر المؤشر أو انقر أو استخدم لوحة المفاتيح لاستكشاف الدول. البيانات الكاملة في الجدول أدناه.',
    legendTitle: 'التقدير الشامل للتجزئة (دولار لكل جرام)',
    legendTitleSpot: 'قيمة الذهب المرتبطة بالسعر الفوري (دولار لكل جرام)',
    legendNoData: 'لا تتوفر بيانات',
    legendLower: 'أقل',
    legendHigher: 'أعلى',
    lensLabel: 'تلوين الخريطة حسب',
    lensRetail: 'تقدير التجزئة',
    lensSpot: 'القيمة الفورية',
    lensSpotLegend: 'متطابقة عالمياً',
    lensRetailCaption:
      'الذهبي الأغمق = تقدير تجزئة شامل أعلى. الفروق ناتجة عن الضريبة المحلية والمصنعية المعتادة — الذهب نفسه واحد في كل مكان.',
    lensSpotCaption:
      'كل الأسواق تظهر بنفس الدرجة: قيمة غرام الذهب المرتبطة بالسعر الفوري متطابقة عالمياً بالدولار. بدّل إلى عدسة التجزئة لترى أين ترفع الضريبة والمصنعية السعر.',
    jumpLabel: 'الانتقال إلى دولة',
    jumpPlaceholder: 'اختر دولة…',
    groups: {
      gcc: 'دول الخليج',
      levant: 'بلاد الشام',
      africa: 'شمال وشرق أفريقيا',
      global: 'مرجع عالمي',
    },
    detailTitle: 'تفاصيل الدولة',
    detailEmpty: 'اختر دولة على الخريطة — أو من القائمة — لعرض تفاصيلها الكاملة.',
    retailEst: 'التقدير الشامل للتجزئة',
    spotRef: 'قيمة الذهب المرتبطة بالسعر الفوري',
    perGram: 'لكل جرام',
    vatRate: 'ضريبة القيمة المضافة / المبيعات',
    makingRange: 'أجور الصياغة المعتادة',
    vsUae: 'مقارنة بالإمارات',
    reference: 'مرجع',
    eurozone: 'ينطبق على أسواق منطقة اليورو',
    marketNote: 'ملاحظة عن السوق',
    countryPage: 'فتح صفحة الدولة ←',
    compareLink: 'قارن مع الإمارات ←',
    calculatorLink: 'احسب قيمة ذهبك ←',
    tableTitle: 'كل الأسواق المتتبَّعة',
    tableCaptionPrefix: 'تقديرات التجزئة الشاملة لكل جرام من ذهب',
    tableCaptionSuffix: 'مرتبة من الأرخص. أرقام مرجعية وليست أسعار محلات.',
    colCountry: 'الدولة',
    colRetail: 'تقدير التجزئة (دولار/جم)',
    colLocal: 'محلي/جم',
    colVat: 'الضريبة',
    colMaking: 'الصياغة',
    colVsUae: 'مقابل الإمارات',
    unavailable: 'غير متوفر',
    waiting: 'بانتظار الأسعار الحية…',
    howTitle: 'كيف تقرأ هذه الخريطة',
    how1: 'كل دولة تبدأ من نفس قيمة الذهب المرتبطة بالسعر الفوري لكل جرام بالدولار — فروق الألوان تأتي من الضريبة المحلية وأجور الصياغة المعتادة للمجوهرات.',
    how2: 'اللون الذهبي الأغمق يعني تقديراً شاملاً أعلى للتجزئة؛ الدول التي لا تتوفر لها بيانات صرف أو سوق تبقى محايدة وتُعرض كغير متوفرة.',
    how3: 'هذه تقديرات مرجعية للمقارنة — السعر النهائي في المحل يعتمد على القطعة وأجور صياغتها ولوحة أسعار اليوم.',
    disclaimer:
      'قيمة الذهب لكل جرام متطابقة عالمياً بالدولار — ألوان الخريطة تعكس الضريبة المحلية وأجور الصياغة المعتادة فقط. جميع الأرقام تقديرات مرجعية مرتبطة بالسعر الفوري، وليست أسعار تجزئة نهائية ولا نصيحة مالية.',
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
    docTitle: 'خريطة أسعار الذهب حول العالم | Gold Ticker Live',
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
  karat: '22',
  lens: 'retail', // 'retail' = all-in estimate (varies) | 'spot' = pure gold value (uniform worldwide)
  selected: null,
  goldPriceUsdPerOz: 0,
  mapData: null, // lazily imported world-map-data.js module
  mapNodes: new Map(), // code → interactive SVG node(s)
};

function t() {
  return T[STATE.lang] || T.en;
}
function countryName(country) {
  return STATE.lang === 'ar' ? country.nameAr || country.nameEn : country.nameEn;
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

function flagBadge(code, className) {
  const wrap = el('span', { class: className, 'aria-hidden': 'true' });
  const symbol = flagSymbolForCountry(code);
  wrap.appendChild(
    symbol
      ? iconUseElement(symbol, 'nav-flag heatmap-flag-ico')
      : iconUseElement('i-globe', 'nav-ico heatmap-flag-ico')
  );
  return wrap;
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
    console.warn('Heatmap fetch error:', e);
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

// ── Derived rows ──────────────────────────────────────────────────────────────
function currentRows() {
  return buildHeatmapRows({
    spotUsdPerOz: STATE.spotUsdPerOz,
    rates: STATE.rates,
    countries: COUNTRIES,
    karat: STATE.karat,
    getIntel: getMarketIntel,
  });
}

// ── SVG map ───────────────────────────────────────────────────────────────────
function svgEl(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) continue;
    node.setAttribute(key, String(value));
  }
  return node;
}

async function mountMap() {
  const host = document.getElementById('heatmap-map');
  if (!host) return;
  const data = await import('./heatmap/world-map-data.js');
  STATE.mapData = data;
  clear(host);

  const svg = svgEl('svg', {
    viewBox: data.WORLD_VIEWBOX,
    class: 'heatmap-svg',
    role: 'group',
    'aria-label': t().mapAria,
  });

  // Ocean sphere (fills the projection frame) + graticule grid, drawn under land.
  if (data.WORLD_SPHERE) {
    const ocean = svgEl('path', { d: data.WORLD_SPHERE, class: 'heatmap-ocean' });
    ocean.setAttribute('aria-hidden', 'true');
    svg.appendChild(ocean);
  }
  if (data.WORLD_GRATICULE) {
    const graticule = svgEl('path', {
      d: data.WORLD_GRATICULE,
      class: 'heatmap-graticule',
      fill: 'none',
    });
    graticule.setAttribute('aria-hidden', 'true');
    svg.appendChild(graticule);
  }

  const backdrop = svgEl('path', { d: data.WORLD_BACKGROUND, class: 'heatmap-land' });
  backdrop.setAttribute('aria-hidden', 'true');
  svg.appendChild(backdrop);

  STATE.mapNodes = new Map();

  for (const shape of data.WORLD_COUNTRIES) {
    const node = svgEl('path', {
      d: shape.d,
      class: 'heatmap-country heatmap-nodata',
      tabindex: '0',
      role: 'button',
      'data-code': shape.code,
      'aria-pressed': 'false',
    });
    svg.appendChild(node);
    STATE.mapNodes.set(shape.code, [node]);
  }

  // Circle markers for countries with no polygon at this scale (BH, KM).
  for (const marker of data.WORLD_MARKERS) {
    const node = svgEl('circle', {
      cx: marker.x,
      cy: marker.y,
      r: '5',
      class: 'heatmap-marker heatmap-nodata',
      tabindex: '0',
      role: 'button',
      'data-code': marker.code,
      'aria-pressed': 'false',
    });
    svg.appendChild(node);
    STATE.mapNodes.set(marker.code, [node]);
  }

  // Enlarged invisible hit circles over tiny countries (QA, KW, LB, PS, DJ) so
  // touch/coarse pointers have a ≥20px target; they proxy the country node.
  for (const [code, pt] of Object.entries(data.WORLD_SMALL_TARGETS)) {
    const hit = svgEl('circle', {
      cx: pt.x,
      cy: pt.y,
      r: '10',
      class: 'heatmap-hit',
      'data-code': code,
    });
    hit.setAttribute('aria-hidden', 'true');
    svg.appendChild(hit);
    if (STATE.mapNodes.has(code)) STATE.mapNodes.get(code).push(hit);
  }

  svg.addEventListener('pointermove', onMapPointerMove);
  svg.addEventListener('pointerleave', hideTooltip);
  svg.addEventListener('click', (e) => {
    const target = e.target.closest('[data-code]');
    if (target) selectCountry(target.dataset.code);
  });
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target.closest('[data-code]');
    if (target) {
      e.preventDefault();
      selectCountry(target.dataset.code);
    }
  });
  svg.addEventListener('focusin', (e) => {
    const target = e.target.closest('[data-code]');
    if (target) showTooltipFor(target);
  });
  svg.addEventListener('focusout', hideTooltip);

  host.appendChild(svg);
  paintMap();
}

function paintMap() {
  if (!STATE.mapData) return;
  const rows = currentRows();
  const spot = isSpotLens();
  // Spot lens has no gradient (gold's USD value is identical worldwide) — every market with data
  // gets the same uniform bucket; the retail lens keeps the equal-interval domain.
  const domain = spot ? null : computeDomain(rows);
  const index = fillIndex(rows, domain);
  const dict = t();
  const lensLabel = spot ? dict.spotRef : dict.retailEst;

  for (const [code, nodes] of STATE.mapNodes) {
    const entry = index.get(code);
    const value = entry ? (spot ? entry.row.spotUsdPerGram : entry.row.retailUsdPerGram) : null;
    const hasData = value != null;
    const bucket = !hasData ? null : spot ? SPOT_UNIFORM_BUCKET : entry.bucket;
    const primary = nodes[0];
    primary.classList.remove(
      'heatmap-b0',
      'heatmap-b1',
      'heatmap-b2',
      'heatmap-b3',
      'heatmap-b4',
      'heatmap-nodata'
    );
    primary.classList.add(bucket == null ? 'heatmap-nodata' : `heatmap-b${bucket}`);
    const country = COUNTRIES.find((c) => c.code === code);
    const name = country ? countryName(country) : code;
    const valueText = hasData
      ? `${fmtUsd(value)} ${dict.perGram} (${STATE.karat}K)`
      : dict.unavailable;
    primary.setAttribute('aria-label', `${name} — ${lensLabel}: ${valueText}`);
    primary.setAttribute('aria-pressed', STATE.selected === code ? 'true' : 'false');
    for (const node of nodes) node.classList.toggle('heatmap-selected', STATE.selected === code);
  }
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function onMapPointerMove(e) {
  const target = e.target.closest('[data-code]');
  if (!target) {
    hideTooltip();
    return;
  }
  showTooltipFor(target, e);
}

function showTooltipFor(target, pointerEvent) {
  const tip = document.getElementById('heatmap-tooltip');
  const wrap = document.getElementById('heatmap-map-wrap');
  if (!tip || !wrap) return;
  const code = target.dataset.code;
  const country = COUNTRIES.find((c) => c.code === code);
  if (!country) return;
  const rows = currentRows();
  const row = rows.find((r) => r.code === code);
  const dict = t();

  clear(tip);
  const spot = isSpotLens();
  const primaryValue = row ? (spot ? row.spotUsdPerGram : row.retailUsdPerGram) : null;
  tip.appendChild(el('span', { class: 'heatmap-tip-name' }, [countryName(country)]));
  if (primaryValue != null) {
    tip.appendChild(
      el('span', { class: 'heatmap-tip-value' }, [
        `${fmtUsd(primaryValue)} ${dict.perGram} · ${STATE.karat}K`,
      ])
    );
    // Local-currency line only makes sense for the retail lens (spot value is quoted in USD).
    if (!spot && row.retailLocalPerGram != null && row.currency !== 'USD') {
      tip.appendChild(
        el('span', { class: 'heatmap-tip-local' }, [
          formatPrice(row.retailLocalPerGram, row.currency, row.decimals),
        ])
      );
    }
  } else {
    tip.appendChild(el('span', { class: 'heatmap-tip-value' }, [dict.unavailable]));
  }

  const wrapRect = wrap.getBoundingClientRect();
  let x;
  let y;
  if (pointerEvent) {
    x = pointerEvent.clientX - wrapRect.left;
    y = pointerEvent.clientY - wrapRect.top;
  } else {
    const box = target.getBoundingClientRect();
    x = box.left + box.width / 2 - wrapRect.left;
    y = box.top - wrapRect.top;
  }
  tip.hidden = false;
  // Clamp inside the wrapper so the tooltip never overflows the viewport.
  const tipRect = tip.getBoundingClientRect();
  const maxX = wrapRect.width - tipRect.width - 4;
  const clampedX = Math.max(4, Math.min(x + 12, maxX));
  const clampedY = Math.max(4, Math.min(y - tipRect.height - 10, wrapRect.height - tipRect.height));
  tip.style.insetInlineStart = `${clampedX}px`;
  tip.style.insetBlockStart = `${clampedY}px`;
}

function hideTooltip() {
  const tip = document.getElementById('heatmap-tooltip');
  if (tip) tip.hidden = true;
}

// ── Legend ────────────────────────────────────────────────────────────────────
function renderLegend() {
  const host = document.getElementById('heatmap-legend');
  if (!host) return;
  const dict = t();
  const rows = currentRows();
  const spot = isSpotLens();
  const domain = spot ? null : computeDomain(rows);
  clear(host);
  host.appendChild(
    el('span', { class: 'heatmap-legend-title', id: 'heatmap-legend-title' }, [
      spot ? dict.legendTitleSpot : dict.legendTitle,
    ])
  );
  const scale = el('div', { class: 'heatmap-legend-scale', role: 'list' });
  if (spot) {
    // One uniform swatch — the spot value is identical for every market.
    scale.appendChild(
      el('span', { class: 'heatmap-legend-stop', role: 'listitem' }, [
        el('span', {
          class: `heatmap-legend-swatch heatmap-b${SPOT_UNIFORM_BUCKET}`,
          'aria-hidden': 'true',
        }),
        el('span', { class: 'heatmap-legend-range' }, [
          `${fmtUsd(spotUsdPerGramNow(rows), 1)} ${dict.perGram} · ${dict.lensSpotLegend}`,
        ]),
      ])
    );
  } else if (!domain) {
    scale.appendChild(el('span', { class: 'heatmap-legend-waiting' }, [dict.waiting]));
  } else {
    const stops = legendStops(domain);
    stops.forEach((stop, i) => {
      scale.appendChild(
        el('span', { class: 'heatmap-legend-stop', role: 'listitem' }, [
          el('span', { class: `heatmap-legend-swatch heatmap-b${i}`, 'aria-hidden': 'true' }),
          el('span', { class: 'heatmap-legend-range' }, [
            `${fmtUsd(stop.from, 1)}–${fmtUsd(stop.to, 1)}`,
          ]),
        ])
      );
    });
  }
  scale.appendChild(
    el('span', { class: 'heatmap-legend-stop', role: 'listitem' }, [
      el('span', { class: 'heatmap-legend-swatch heatmap-nodata', 'aria-hidden': 'true' }),
      el('span', { class: 'heatmap-legend-range' }, [dict.legendNoData]),
    ])
  );
  host.appendChild(scale);
  // Lens explainer — states plainly why the map varies (retail) or is uniform (spot).
  host.appendChild(
    el('p', { class: 'heatmap-lens-note' }, [spot ? dict.lensSpotCaption : dict.lensRetailCaption])
  );
}

/** The single spot-linked gold value per gram (USD) — identical across markets for the active karat. */
function spotUsdPerGramNow(rows) {
  const withSpot = (rows || []).find((r) => r.spotUsdPerGram != null);
  return withSpot ? withSpot.spotUsdPerGram : 0;
}

// ── Karat switcher ────────────────────────────────────────────────────────────
function renderKarats() {
  const host = document.getElementById('heatmap-karat');
  if (!host) return;
  clear(host);
  for (const code of HEATMAP_KARATS) {
    host.appendChild(
      el(
        'button',
        {
          type: 'button',
          class: `heatmap-karat-btn${STATE.karat === code ? ' is-active' : ''}`,
          'aria-pressed': STATE.karat === code ? 'true' : 'false',
          onclick: () => {
            if (STATE.karat === code) return;
            STATE.karat = code;
            syncHash();
            render();
          },
        },
        [`${code}K`]
      )
    );
  }
}

// Bucket the spot lens paints every market with — a single mid-high gold shade, since gold's
// spot-linked value per gram is identical worldwide in USD (there is no meaningful gradient).
const SPOT_UNIFORM_BUCKET = 3;

/** True when the map is coloured by pure spot value (uniform) rather than the all-in retail estimate. */
function isSpotLens() {
  return STATE.lens === 'spot';
}

// ── Lens switcher (colour map by retail estimate vs pure spot value) ───────────
function renderLens() {
  const host = document.getElementById('heatmap-lens');
  if (!host) return;
  const dict = t();
  host.setAttribute('aria-label', dict.lensLabel);
  clear(host);
  for (const [code, labelKey] of [
    ['retail', 'lensRetail'],
    ['spot', 'lensSpot'],
  ]) {
    host.appendChild(
      el(
        'button',
        {
          type: 'button',
          class: `heatmap-lens-btn${STATE.lens === code ? ' is-active' : ''}`,
          'aria-pressed': STATE.lens === code ? 'true' : 'false',
          onclick: () => {
            if (STATE.lens === code) return;
            STATE.lens = code;
            render();
          },
        },
        [dict[labelKey]]
      )
    );
  }
}

// ── Jump select ───────────────────────────────────────────────────────────────
function renderJumpSelect() {
  const select = document.getElementById('heatmap-jump');
  if (!select) return;
  const dict = t();
  clear(select);
  select.appendChild(el('option', { value: '' }, [dict.jumpPlaceholder]));
  for (const group of GROUP_ORDER) {
    const members = COUNTRIES.filter((c) => c.group === group);
    if (!members.length) continue;
    const optgroup = el('optgroup', { label: dict.groups[group] || group });
    for (const country of members) {
      optgroup.appendChild(
        el('option', { value: country.code, selected: STATE.selected === country.code }, [
          countryName(country),
        ])
      );
    }
    select.appendChild(optgroup);
  }
}

// ── Selection + detail panel ──────────────────────────────────────────────────
function selectCountry(code) {
  const clean = String(code || '').toUpperCase();
  if (!VALID_CODES.has(clean)) return;
  STATE.selected = STATE.selected === clean ? null : clean;
  syncHash();
  render();
  if (STATE.selected) {
    const detail = document.getElementById('heatmap-detail');
    if (detail && typeof detail.scrollIntoView === 'function') {
      detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function renderDetail() {
  const host = document.getElementById('heatmap-detail');
  if (!host) return;
  const dict = t();
  clear(host);
  host.appendChild(el('h2', { class: 'heatmap-detail-title' }, [dict.detailTitle]));

  const country = COUNTRIES.find((c) => c.code === STATE.selected);
  if (!country) {
    host.appendChild(el('p', { class: 'heatmap-detail-empty' }, [dict.detailEmpty]));
    return;
  }
  const rows = currentRows();
  const row = rows.find((r) => r.code === country.code);
  const intel = getMarketIntel(country.code) || {};
  const note = STATE.lang === 'ar' ? intel.marketNoteAr || intel.marketNoteEn : intel.marketNoteEn;

  const head = el('div', { class: 'heatmap-detail-head' }, [
    flagBadge(country.code, 'heatmap-detail-flag'),
    el('span', { class: 'heatmap-detail-name' }, [countryName(country)]),
    el('span', { class: 'heatmap-detail-karat' }, [`${STATE.karat}K`]),
  ]);
  host.appendChild(head);

  const grid = el('dl', { class: 'heatmap-detail-grid' });
  const addStat = (label, valueNodes) => {
    grid.appendChild(el('dt', {}, [label]));
    grid.appendChild(el('dd', {}, valueNodes));
  };

  if (row && row.available) {
    const retailNodes = [el('strong', {}, [`${fmtUsd(row.retailUsdPerGram)} ${dict.perGram}`])];
    if (row.currency !== 'USD' && row.retailLocalPerGram != null) {
      retailNodes.push(
        el('span', { class: 'heatmap-detail-local' }, [
          ` · ${formatPrice(row.retailLocalPerGram, row.currency, row.decimals)}`,
        ])
      );
    }
    addStat(dict.retailEst, retailNodes);
    const spotNodes = [`${fmtUsd(row.spotUsdPerGram)} ${dict.perGram}`];
    if (row.currency !== 'USD' && row.spotLocalPerGram != null) {
      spotNodes.push(
        el('span', { class: 'heatmap-detail-local' }, [
          ` · ${formatPrice(row.spotLocalPerGram, row.currency, row.decimals)}`,
        ])
      );
    }
    addStat(dict.spotRef, spotNodes);
    addStat(dict.vatRate, [`${Math.round(row.vatRate * 1000) / 10}%`]);
    addStat(dict.makingRange, [
      `${Math.round(row.makingMin * 100)}–${Math.round(row.makingMax * 100)}%`,
    ]);
    addStat(dict.vsUae, [country.code === 'AE' ? dict.reference : fmtPct(row.pctVsUae)]);
  } else {
    addStat(dict.retailEst, [dict.unavailable]);
  }
  host.appendChild(grid);

  if (country.code === 'EU') {
    host.appendChild(el('p', { class: 'heatmap-detail-note' }, [dict.eurozone]));
  } else if (note) {
    host.appendChild(el('p', { class: 'heatmap-detail-note' }, [`${dict.marketNote}: ${note}`]));
  }

  const links = el('div', { class: 'heatmap-detail-links' });
  if (country.slug) {
    // Country pages were retired; deep-link into the compare tool instead.
    const code = country.code.toLowerCase();
    links.appendChild(
      el(
        'a',
        {
          class: 'heatmap-detail-link',
          href: code === 'ae' ? '/compare.html' : `/compare.html#compare=ae,${code}&k=22`,
        },
        [dict.countryPage]
      )
    );
  }
  if (country.code !== 'AE') {
    links.appendChild(
      el(
        'a',
        {
          class: 'heatmap-detail-link',
          href: `compare.html#compare=ae,${country.code.toLowerCase()}&k=${STATE.karat}`,
        },
        [dict.compareLink]
      )
    );
  }
  links.appendChild(
    el('a', { class: 'heatmap-detail-link', href: 'calculator.html' }, [dict.calculatorLink])
  );
  host.appendChild(links);
}

// ── Table fallback ────────────────────────────────────────────────────────────
function renderTable() {
  const host = document.getElementById('heatmap-table-wrap');
  if (!host) return;
  const dict = t();
  const rows = currentRows()
    .slice()
    .sort((a, b) => {
      const av = a.retailUsdPerGram;
      const bv = b.retailUsdPerGram;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return av - bv;
    });

  clear(host);
  const table = el('table', { class: 'heatmap-table' });
  table.appendChild(
    el('caption', { class: 'heatmap-table-caption' }, [
      `${dict.tableCaptionPrefix} ${STATE.karat}K ${dict.tableCaptionSuffix}`,
    ])
  );
  const thead = el('thead', {}, [
    el('tr', {}, [
      el('th', { scope: 'col' }, [dict.colCountry]),
      el('th', { scope: 'col' }, [dict.colRetail]),
      el('th', { scope: 'col' }, [dict.colLocal]),
      el('th', { scope: 'col' }, [dict.colVat]),
      el('th', { scope: 'col' }, [dict.colMaking]),
      el('th', { scope: 'col' }, [dict.colVsUae]),
    ]),
  ]);
  table.appendChild(thead);
  const tbody = el('tbody');
  for (const row of rows) {
    const country = COUNTRIES.find((c) => c.code === row.code);
    const nameCell = el('th', { scope: 'row', class: 'heatmap-table-country' }, [
      flagBadge(row.code, 'heatmap-table-flag'),
      el(
        'button',
        {
          type: 'button',
          class: 'heatmap-table-name',
          onclick: () => selectCountry(row.code),
        },
        [country ? countryName(country) : row.code]
      ),
    ]);
    tbody.appendChild(
      el('tr', { class: STATE.selected === row.code ? 'is-selected' : null }, [
        nameCell,
        el('td', {}, [row.retailUsdPerGram != null ? fmtUsd(row.retailUsdPerGram) : '—']),
        el('td', {}, [
          row.retailLocalPerGram != null
            ? formatPrice(row.retailLocalPerGram, row.currency, row.decimals)
            : dict.unavailable,
        ]),
        el('td', {}, [`${Math.round(row.vatRate * 1000) / 10}%`]),
        el('td', {}, [`${Math.round(row.makingMid * 100)}%`]),
        el('td', {}, [row.code === 'AE' ? dict.reference : fmtPct(row.pctVsUae)]),
      ])
    );
  }
  table.appendChild(tbody);
  host.appendChild(table);
}

// ── Freshness + spot badge ────────────────────────────────────────────────────
function renderSpotBadge() {
  const priceNode = document.getElementById('heatmap-spot-price');
  const freshNode = document.getElementById('heatmap-freshness');
  if (priceNode) {
    priceNode.textContent = STATE.spotUsdPerOz ? fmtUsd(STATE.spotUsdPerOz) : '—';
  }
  if (freshNode) {
    const f = getLiveFreshness({
      updatedAt: STATE.freshness.goldUpdatedAt,
      lang: STATE.lang,
      hasLiveFailure: STATE.spotSource !== 'live',
    });
    const dict = t();
    clear(freshNode);
    freshNode.dataset.state = f.key;
    freshNode.appendChild(el('span', { class: 'heatmap-fresh-dot', 'aria-hidden': 'true' }));
    freshNode.appendChild(
      el('span', {}, [`${dict.freshness[f.key] || f.key}${f.ageText ? ` · ${f.ageText}` : ''}`])
    );
  }
}

// ── Hash sync ─────────────────────────────────────────────────────────────────
function syncHash() {
  const hash = serializeHeatmapHash({ karat: STATE.karat, selected: STATE.selected });
  if (location.hash.replace(/^#/, '') !== hash) {
    history.replaceState(null, '', `#${hash}`);
  }
}

function readHash() {
  const parsed = parseHeatmapHash(location.hash, VALID_CODES);
  STATE.karat = parsed.karat;
  STATE.selected = parsed.selected;
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
  set('heatmap-h1', dict.h1);
  set('heatmap-sub', dict.sub);
  set('heatmap-spot-label', dict.spotLabel);
  set('heatmap-map-hint', dict.mapHint);
  set('heatmap-jump-label', dict.jumpLabel);
  set('heatmap-table-title', dict.tableTitle);
  set('heatmap-how-title', dict.howTitle);
  set('heatmap-how-1', dict.how1);
  set('heatmap-how-2', dict.how2);
  set('heatmap-how-3', dict.how3);
  set('heatmap-disclaimer', dict.disclaimer);
  const methodLink = document.getElementById('heatmap-methodology');
  if (methodLink) methodLink.textContent = dict.methodology;
  const svg = document.querySelector('.heatmap-svg');
  if (svg) svg.setAttribute('aria-label', dict.mapAria);
  document.title = dict.docTitle;
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  renderSpotBadge();
  renderKarats();
  renderLens();
  renderLegend();
  renderJumpSelect();
  renderDetail();
  renderTable();
  paintMap();
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
  injectBreadcrumbs('heatmap');

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

  const jump = document.getElementById('heatmap-jump');
  if (jump) {
    jump.addEventListener('change', (e) => {
      if (e.target.value) selectCountry(e.target.value);
    });
  }

  window.addEventListener('hashchange', () => {
    readHash();
    render();
  });

  render();
  await Promise.all([mountMap(), fetchLiveData()]);

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
  track(EVENTS.PRICE_VIEW, { path: location.pathname, locale: STATE.lang, surface: 'heatmap' });
}

init();
