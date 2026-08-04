import { CONSTANTS, COUNTRIES, KARATS, TRANSLATIONS, ensureLocale } from '../config/index.js';
import * as api from '../lib/api.js';
import { getCanonicalSpot } from '../lib/spot-resolver.js';
import { formatCurrency, formatNumber, formatTimestamp } from '../lib/formatter.js';
import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { track, EVENTS } from '../lib/analytics.js';
import { clear, setText } from '../lib/safe-dom.js';
import {
  DEFAULT_DEAL_INPUTS,
  calculateDeal,
  normalizeDealInputs,
  parseDealState,
  serializeDealState,
  shareableDealInputs,
  validateDealInputs,
} from './deal-checker/deal-checker-core.js';

const OFFERS_KEY = 'gold_deal_offers_v1';
const STATE = {
  lang: new URLSearchParams(location.search).get('lang') === 'ar' ? 'ar' : 'en',
  inputs: parseDealState(new URLSearchParams(location.search).get('state')) || {
    ...DEFAULT_DEAL_INPUTS,
  },
  snapshot: null,
  fx: null,
  sourceError: null,
  calculation: null,
  offers: [],
  shell: null,
};

const currencyDecimals = {
  AED: 2,
  USD: 2,
  SAR: 2,
  KWD: 3,
  QAR: 2,
  BHD: 3,
  OMR: 3,
  JOD: 3,
  EGP: 2,
};

const modeKeys = {
  making: [
    ['unknown', 'dealChecker.makingUnknown'],
    ['per_gram', 'dealChecker.makingPerGram'],
    ['fixed', 'dealChecker.makingFixed'],
    ['percent', 'dealChecker.makingPercent'],
    ['included', 'dealChecker.makingIncluded'],
  ],
  premium: [
    ['unknown', 'dealChecker.premiumUnknown'],
    ['percent', 'dealChecker.premiumPercent'],
    ['fixed', 'dealChecker.premiumFixed'],
    ['included', 'dealChecker.premiumIncluded'],
  ],
  tax: [
    ['unknown', 'dealChecker.taxUnknown'],
    ['percent', 'dealChecker.taxPercent'],
    ['included', 'dealChecker.taxIncluded'],
  ],
  discount: [
    ['none', 'dealChecker.discountNone'],
    ['percent', 'dealChecker.discountPercent'],
    ['fixed', 'dealChecker.discountFixed'],
  ],
};

function t(key) {
  return TRANSLATIONS[STATE.lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
}

function byId(id) {
  return document.getElementById(id);
}

function formatAmount(value, currency = STATE.inputs.currency) {
  return formatCurrency(value, currency, STATE.lang, currencyDecimals[currency] ?? 2);
}

function formatGrams(value) {
  return formatNumber(value, STATE.lang, { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function formatPercent(value) {
  return value === null || value === undefined
    ? t('dealChecker.notAvailable')
    : `${formatNumber(value, STATE.lang, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
}

function formatUsdSpot(value) {
  return value === null || value === undefined
    ? t('dealChecker.notAvailable')
    : `${formatNumber(value, STATE.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD/oz`;
}

function sourceStateLabel(state) {
  return state || t('dealChecker.notAvailable');
}

function readInputValue(element) {
  if (!element) return null;
  return element.type === 'number'
    ? element.value === ''
      ? null
      : Number(element.value)
    : element.value;
}

function readForm() {
  const form = byId('deal-form');
  if (!form) return STATE.inputs;
  const next = {};
  form.querySelectorAll('input, select').forEach((field) => {
    if (field.name) next[field.name] = readInputValue(field);
  });
  return normalizeDealInputs(next);
}

function writeForm(inputs) {
  const form = byId('deal-form');
  if (!form) return;
  form.querySelectorAll('input, select').forEach((field) => {
    if (!field.name || !(field.name in inputs)) return;
    const value = inputs[field.name];
    field.value = value === null || value === undefined ? '' : String(value);
  });
}

function makeOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function populateSelect(id, options, selected) {
  const select = byId(id);
  if (!select) return;
  clear(select);
  options.forEach(([value, label]) => select.appendChild(makeOption(value, label)));
  if (options.some(([value]) => value === selected)) select.value = selected;
}

function populateControls() {
  const currencies = new Map([
    ['AED', STATE.lang === 'ar' ? 'درهم إماراتي (AED)' : 'UAE dirham (AED)'],
    ['USD', STATE.lang === 'ar' ? 'دولار أمريكي (USD)' : 'US dollar (USD)'],
  ]);
  COUNTRIES.forEach((country) => {
    if (!currencies.has(country.currency)) {
      currencies.set(
        country.currency,
        `${STATE.lang === 'ar' ? country.nameAr : country.nameEn} (${country.currency})`
      );
    }
  });
  populateSelect(
    'deal-currency',
    [...currencies].sort(([a], [b]) => a.localeCompare(b)),
    STATE.inputs.currency
  );
  populateSelect(
    'deal-purchase-type',
    [
      ['jewelry', t('dealChecker.purchaseJewelry')],
      ['bullion', t('dealChecker.purchaseBullion')],
      ['scrap', t('dealChecker.purchaseScrap')],
    ],
    STATE.inputs.purchaseType
  );
  populateSelect(
    'deal-karat',
    KARATS.map((karat) => [karat.code, `${karat.code}K (${formatPercent(karat.purity * 100)})`]),
    STATE.inputs.karat
  );
  for (const [name, options] of Object.entries(modeKeys)) {
    populateSelect(
      `deal-${name}-mode`,
      options.map(([value, key]) => [value, t(key)]),
      STATE.inputs[`${name}Mode`]
    );
  }
}

function applyTranslations() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  const labels = {
    'deal-eyebrow': 'dealChecker.eyebrow',
    'deal-title': 'dealChecker.title',
    'deal-subtitle': 'dealChecker.subtitle',
    'deal-reference-note': 'dealChecker.referenceNote',
    'deal-methodology-link': 'dealChecker.methodologyLink',
    'deal-learn-link': 'dealChecker.learnLink',
    'deal-form-kicker': 'dealChecker.formTitle',
    'deal-form-title': 'dealChecker.formTitle',
    'deal-local-badge': 'dealChecker.localPrivacy',
    'deal-form-intro': 'dealChecker.formIntro',
    'deal-currency-label': 'dealChecker.currency',
    'deal-purchase-type-label': 'dealChecker.purchaseType',
    'deal-quoted-total-label': 'dealChecker.quotedTotal',
    'deal-gross-weight-label': 'dealChecker.grossWeight',
    'deal-non-gold-weight-label': 'dealChecker.nonGoldWeight',
    'deal-karat-label': 'dealChecker.karat',
    'deal-making-label': 'dealChecker.making',
    'deal-making-value-label': 'dealChecker.componentValue',
    'deal-premium-label': 'dealChecker.premium',
    'deal-premium-value-label': 'dealChecker.componentValue',
    'deal-tax-label': 'dealChecker.tax',
    'deal-tax-value-label': 'dealChecker.componentValue',
    'deal-discount-label': 'dealChecker.discount',
    'deal-discount-value-label': 'dealChecker.componentValue',
    'deal-buyback-label': 'dealChecker.buyback',
    'deal-tolerance-label': 'dealChecker.tolerance',
    'deal-shop-label-label': 'dealChecker.shopLabel',
    'deal-quote-timestamp-label': 'dealChecker.quoteTimestamp',
    'deal-tolerance-hint': 'dealChecker.toleranceHint',
    'deal-shop-label-hint': 'dealChecker.shopLabelHint',
    'deal-quote-timestamp-hint': 'dealChecker.optional',
    'deal-submit': 'dealChecker.calculate',
    'deal-reset': 'dealChecker.reset',
    'deal-results-kicker': 'dealChecker.benchmark',
    'deal-results-title': 'dealChecker.resultsTitle',
    'deal-results-intro': 'dealChecker.resultsIntro',
    'deal-breakdown-title': 'dealChecker.referenceMethod',
    'deal-markup-label': 'dealChecker.markup',
    'deal-gold-share-label': 'dealChecker.actualGoldShare',
    'deal-break-even-label': 'dealChecker.breakEven',
    'deal-resale-label': 'dealChecker.resaleEstimate',
    'deal-source-title': 'dealChecker.freshnessLabel',
    'deal-source-label': 'dealChecker.sourceLabel',
    'deal-fx-source-label': 'dealChecker.fxSourceLabel',
    'deal-freshness-label': 'dealChecker.freshnessLabel',
    'deal-updated-label': 'dealChecker.updatedLabel',
    'deal-save': 'dealChecker.saveOffer',
    'deal-copy': 'dealChecker.copyLink',
    'deal-export': 'dealChecker.export',
    'deal-print': 'dealChecker.print',
    'deal-method-title': 'dealChecker.referenceMethod',
    'deal-method-body': 'dealChecker.methodBody',
    'deal-methodology-link-bottom': 'dealChecker.methodologyLink',
    'deal-tracker-link': 'dealChecker.trackerLink',
    'deal-learn-link-bottom': 'dealChecker.learnLink',
    'deal-privacy-title': 'dealChecker.localPrivacy',
    'deal-privacy-body': 'dealChecker.localPrivacyBody',
    'deal-offers-title': 'dealChecker.offersTitle',
    'deal-offers-limit': 'dealChecker.offersLimit',
  };
  Object.entries(labels).forEach(([id, key]) => setText(byId(id), t(key)));
  const metricLabels = {
    'deal-reference-value-label': 'dealChecker.referenceValue',
    'deal-fine-gold-label': 'dealChecker.fineGold',
    'deal-reference-per-gross-label': 'dealChecker.referencePerGross',
    'deal-quoted-per-gross-label': 'dealChecker.quotedPerGross',
  };
  Object.entries(metricLabels).forEach(([id, key]) => setText(byId(id), t(key)));
  setText(byId('deal-loading'), t('dealChecker.loading'));
  setText(byId('deal-empty'), t('dealChecker.enterDetails'));
  setText(byId('deal-benchmark-status'), t('dealChecker.statusIncomplete'));
  const source = STATE.snapshot?.freshness;
  setText(
    byId('deal-source-summary'),
    source ? `${t('dealChecker.sourceLabel')}: ${source.source}` : t('dealChecker.loading')
  );
  populateControls();
}

function setUrlState() {
  const url = new URL(location.href);
  url.searchParams.set('lang', STATE.lang);
  url.searchParams.set('state', serializeDealState(STATE.inputs));
  history.replaceState(null, '', url);
}

function fxRateFor(currency) {
  if (currency === 'USD')
    return {
      rate: 1,
      source: 'USD base',
      state: 'updated',
      updatedAt: STATE.fx?.time_last_update_utc || null,
    };
  if (currency === 'AED')
    return { rate: CONSTANTS.AED_PEG, source: 'UAE fixed peg', state: 'fixed', updatedAt: null };
  const rate = Number(STATE.fx?.rates?.[currency]);
  if (!(rate > 0))
    return { rate: null, source: 'unavailable', state: 'unavailable', updatedAt: null };
  return {
    rate,
    source: STATE.fx?.source === 'cache-fallback' ? 'FX cache fallback' : 'FX provider',
    state: STATE.fx?.source === 'cache-fallback' ? 'cached' : 'updated',
    updatedAt: STATE.fx?.time_last_update_utc || null,
  };
}

function renderSources(fxInfo) {
  const freshness = STATE.snapshot?.freshness;
  setText(byId('deal-source-value'), freshness?.source || t('dealChecker.notAvailable'));
  setText(byId('deal-fx-source-value'), fxInfo?.source || t('dealChecker.notAvailable'));
  setText(
    byId('deal-freshness-value'),
    freshness ? sourceStateLabel(freshness.state) : t('dealChecker.notAvailable')
  );
  setText(
    byId('deal-updated-value'),
    freshness?.updatedAt
      ? formatTimestamp(freshness.updatedAt, STATE.lang)
      : t('dealChecker.notAvailable')
  );
  const sourceText = freshness
    ? `${t('dealChecker.sourceLabel')}: ${freshness.source} · ${sourceStateLabel(freshness.state)}`
    : t('dealChecker.sourceUnavailable');
  setText(byId('deal-source-summary'), sourceText);
}

function renderErrors(errors) {
  const node = byId('deal-errors');
  if (!node) return;
  const messages = errors.map((error) => {
    const key =
      {
        quotedTotal: 'dealChecker.quoteRequired',
        grossWeightGrams: 'dealChecker.weightRequired',
        nonGoldWeightGrams: 'dealChecker.nonGoldInvalid',
        karat: 'dealChecker.karatInvalid',
        spotUsdPerOz: 'dealChecker.sourceUnavailable',
        fxRate: 'dealChecker.sourceUnavailable',
      }[error] || 'dealChecker.numberInvalid';
    return t(key);
  });
  node.replaceChildren(
    ...messages.map((message) => {
      const p = document.createElement('p');
      p.textContent = message;
      return p;
    })
  );
  node.hidden = messages.length === 0;
}

function valueOrUnknown(value) {
  return value === null || value === undefined ? t('dealChecker.unknown') : formatAmount(value);
}

function appendBreakdownRow(list, labelKey, value) {
  const wrapper = document.createElement('div');
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = t(labelKey);
  description.textContent = valueOrUnknown(value);
  wrapper.append(term, description);
  list.appendChild(wrapper);
}

function statusKey(status) {
  return (
    {
      within: 'dealChecker.statusWithin',
      above: 'dealChecker.statusAbove',
      below: 'dealChecker.statusBelow',
      incomplete: 'dealChecker.statusIncomplete',
    }[status] || 'dealChecker.statusIncomplete'
  );
}

function renderCalculation(calculation) {
  const resultNode = byId('deal-results');
  const emptyNode = byId('deal-empty');
  if (!calculation?.ok) {
    resultNode.hidden = true;
    emptyNode.hidden = false;
    renderErrors(calculation?.errors || []);
    return;
  }
  resultNode.hidden = false;
  emptyNode.hidden = true;
  renderErrors([]);
  setText(byId('deal-reference-value'), formatAmount(calculation.referenceValue));
  setText(byId('deal-fine-gold'), `${formatGrams(calculation.fineGoldGrams)} g`);
  setText(byId('deal-reference-per-gross'), formatAmount(calculation.referencePerGrossGram));
  setText(byId('deal-quoted-per-gross'), formatAmount(calculation.impliedQuotedPerGrossGram));
  const list = byId('deal-breakdown-list');
  clear(list);
  appendBreakdownRow(list, 'dealChecker.makingTotal', calculation.makingTotal);
  appendBreakdownRow(list, 'dealChecker.premiumTotal', calculation.premiumTotal);
  appendBreakdownRow(list, 'dealChecker.taxTotal', calculation.taxTotal);
  appendBreakdownRow(
    list,
    'dealChecker.discountTotal',
    calculation.discountTotal === null ? null : -calculation.discountTotal
  );
  appendBreakdownRow(list, 'dealChecker.modeledTotal', calculation.modeledTotal);
  appendBreakdownRow(list, 'dealChecker.residual', calculation.residual);
  setText(byId('deal-markup'), formatAmount(calculation.actualMarkup));
  setText(byId('deal-markup-pct'), formatPercent(calculation.actualMarkupPct));
  setText(
    byId('deal-markup-per-gross'),
    `${t('dealChecker.markupPerGross')}: ${formatAmount(calculation.markupPerGrossGram)}`
  );
  setText(byId('deal-gold-share'), formatPercent(calculation.actualGoldSharePct));
  setText(byId('deal-break-even'), formatUsdSpot(calculation.breakEvenSpotUsdPerOz));
  setText(byId('deal-resale'), formatAmount(calculation.resaleEstimate));
  setText(
    byId('deal-resale-gap'),
    calculation.resaleGap === null
      ? t('dealChecker.notAvailable')
      : formatAmount(calculation.resaleGap)
  );
  const status = byId('deal-benchmark-status');
  status.dataset.status = calculation.benchmarkStatus;
  setText(status, t(statusKey(calculation.benchmarkStatus)));
  setText(byId('deal-status-explain'), t('dealChecker.statusExplain'));
}

function renderOffers() {
  const list = byId('deal-offers');
  if (!list) return;
  clear(list);
  if (STATE.offers.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'deal-empty';
    empty.textContent = t('dealChecker.offersEmpty');
    list.appendChild(empty);
    return;
  }
  STATE.offers.forEach((offer, index) => {
    const card = document.createElement('article');
    card.className = 'deal-offer';
    const heading = document.createElement('h3');
    heading.textContent = offer.inputs.shopLabel || `${t('dealChecker.offersTitle')} ${index + 1}`;
    const total = document.createElement('p');
    total.textContent = `${t('dealChecker.quotedTotal')}: ${formatCurrency(offer.inputs.quotedTotal, offer.inputs.currency, STATE.lang, currencyDecimals[offer.inputs.currency] ?? 2)}`;
    const weight = document.createElement('p');
    weight.textContent = `${t('dealChecker.grossWeight')}: ${formatGrams(offer.inputs.grossWeightGrams)} g · ${offer.inputs.karat}K`;
    const saved = document.createElement('p');
    saved.textContent = `${t('dealChecker.updatedLabel')}: ${formatTimestamp(offer.savedAt, STATE.lang)}`;
    card.append(heading, total, weight, saved);
    list.appendChild(card);
  });
}

function loadOffers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(OFFERS_KEY) || '[]');
    STATE.offers = Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    STATE.offers = [];
  }
}

function saveOffers() {
  try {
    localStorage.setItem(OFFERS_KEY, JSON.stringify(STATE.offers.slice(0, 3)));
  } catch {
    // Private browsing or storage policy: the current comparison still works.
  }
}

function renderState() {
  const fxInfo = fxRateFor(STATE.inputs.currency);
  STATE.calculation = calculateDeal(STATE.inputs, {
    spotUsdPerOz: STATE.snapshot?.spotUsdPerOz,
    fxRate: fxInfo.rate,
  });
  renderSources(fxInfo);
  renderCalculation(STATE.calculation);
}

async function loadSnapshot() {
  const loading = byId('deal-loading');
  loading.hidden = false;
  STATE.sourceError = null;
  try {
    const [spotResult, fxResult] = await Promise.allSettled([
      getCanonicalSpot({ force: true }),
      api.fetchFX(),
    ]);
    STATE.snapshot = spotResult.status === 'fulfilled' ? spotResult.value : null;
    STATE.fx = fxResult.status === 'fulfilled' ? fxResult.value : null;
    STATE.sourceError = spotResult.status === 'rejected' || fxResult.status === 'rejected';
    if (!STATE.snapshot?.ok) {
      setText(byId('deal-loading'), t('dealChecker.sourceUnavailable'));
    } else {
      loading.hidden = true;
    }
  } catch {
    STATE.snapshot = null;
    STATE.fx = null;
    STATE.sourceError = true;
    setText(byId('deal-loading'), t('dealChecker.sourceUnavailable'));
  }
  const fxInfo = fxRateFor(STATE.inputs.currency);
  renderSources(fxInfo);
  renderState();
}

function onFormChange() {
  STATE.inputs = readForm();
  setUrlState();
  renderState();
}

function resetForm() {
  STATE.inputs = { ...DEFAULT_DEAL_INPUTS };
  writeForm(STATE.inputs);
  setUrlState();
  renderState();
}

function saveCurrentOffer() {
  const validation = validateDealInputs(STATE.inputs);
  if (!validation.ok) {
    renderErrors(validation.errors);
    return;
  }
  const offer = {
    savedAt: new Date().toISOString(),
    inputs: { ...STATE.inputs },
  };
  STATE.offers = [
    offer,
    ...STATE.offers.filter((item) => item.inputs?.shopLabel !== offer.inputs.shopLabel),
  ].slice(0, 3);
  saveOffers();
  renderOffers();
  setText(byId('deal-action-status'), t('dealChecker.savedOffer'));
}

async function copyLink() {
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    setText(byId('deal-action-status'), t('dealChecker.copySuccess'));
  } catch {
    setText(byId('deal-action-status'), t('dealChecker.copyFailure'));
  }
  track(EVENTS.SHARE_CLICK, { surface: 'deal_checker', channel: 'copy_link' });
}

function exportJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    inputs: shareableDealInputs(STATE.inputs),
    snapshot: STATE.snapshot
      ? {
          spotUsdPerOz: STATE.snapshot.spotUsdPerOz,
          freshness: STATE.snapshot.freshness,
        }
      : null,
    fx:
      STATE.inputs.currency === 'AED'
        ? { source: 'UAE fixed peg', rate: CONSTANTS.AED_PEG }
        : fxRateFor(STATE.inputs.currency),
    calculation: STATE.calculation?.ok ? STATE.calculation : null,
    disclosure: t('dealChecker.referenceNote'),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = 'gold-deal-comparison.json';
  anchor.click();
  URL.revokeObjectURL(href);
  setText(byId('deal-action-status'), t('dealChecker.exported'));
  track(EVENTS.EXPORT_CLICK, { surface: 'deal_checker', export_type: 'json' });
}

function wireEvents() {
  byId('deal-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    onFormChange();
  });
  byId('deal-form')
    ?.querySelectorAll('input, select')
    .forEach((field) => {
      field.addEventListener('input', onFormChange);
      field.addEventListener('change', onFormChange);
    });
  byId('deal-reset')?.addEventListener('click', resetForm);
  byId('deal-save')?.addEventListener('click', saveCurrentOffer);
  byId('deal-copy')?.addEventListener('click', copyLink);
  byId('deal-export')?.addEventListener('click', exportJson);
  byId('deal-print')?.addEventListener('click', () => window.print());
  STATE.shell?.navCtrl?.getLangToggleButtons().forEach((button) => {
    button.addEventListener('click', async () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      await ensureLocale(STATE.lang);
      STATE.shell.updateLang(STATE.lang);
      applyTranslations();
      injectBreadcrumbs('deal-checker');
      writeForm(STATE.inputs);
      setUrlState();
      renderOffers();
      renderState();
    });
  });
}

async function init() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  await ensureLocale(STATE.lang);
  STATE.shell = mountSharedShell({ lang: STATE.lang, depth: 0, withSpotBar: true });
  injectBreadcrumbs('deal-checker');
  applyTranslations();
  writeForm(STATE.inputs);
  loadOffers();
  renderOffers();
  wireEvents();
  track(EVENTS.PAGE_VIEW, { path: location.pathname, locale: STATE.lang });
  track(EVENTS.TOOL_USE, { tool: 'deal_checker' });
  await loadSnapshot();
}

init().catch((error) => {
  setText(byId('deal-loading'), t('dealChecker.sourceUnavailable'));
  track(EVENTS.ERROR, { type: 'deal_checker_init', where: 'deal_checker' });
  console.error('[deal-checker] init failed', error);
});
