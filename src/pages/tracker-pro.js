// tracker-pro.js — slim orchestrator
import { CONSTANTS, KARATS, COUNTRIES, TRANSLATIONS } from '../config/index.js';
import * as api from '../lib/api.js';
import * as cache from '../lib/cache.js';
import '../lib/reveal.js';
import { createRealtimePricingEngine } from '../lib/realtime-pricing-engine.js';
import { REALTIME_POLLING_DEFAULTS, WIRE_HISTORY_REFRESH_MS } from '../lib/realtime-config.js';
import { isRealtimeDebugEnabled } from '../lib/realtime-debug.js';
import { maybeTrackRealtimeSlo } from '../lib/realtime-slo-analytics.js';
import {
  createPrimaryQuoteProvider,
  createSecondaryQuoteProvider,
} from '../lib/quote-providers/create-providers.js';
import { resolveGoldIsFresh } from '../lib/quote-freshness-bridge.js';
import { formatProviderLabel } from '../lib/provider-labels.js';
import { createInitialState, persistState } from '../tracker/state.js';
import { getFreshnessModel } from '../tracker/freshness.js';
import { deriveLiveRowFreshness } from '../tracker/chart.js';
import { el as safeEl } from '../lib/safe-dom.js';
import { iconUseElement } from '../components/icon-sprite.js';
import { track, EVENTS } from '../lib/analytics.js';
import { getBaselineRange } from '../lib/historical-data.js';
import { getLiveFreshness, getMarketStatus } from '../lib/live-status.js';
import { renderFreshnessBadge } from '../components/FreshnessBadge.js';
import { renderMarketStatusPanel } from '../components/MarketStatusPanel.js';
import { renderQuoteMetaPanel } from '../components/QuoteMetaPanel.js';
import { renderRealtimeSlaPanel } from '../components/RealtimeSlaPanel.js';
import { renderTrackerQuickPresets } from '../components/TrackerQuickPresets.js';
import { renderTrackerCompareHints } from '../components/TrackerCompareHints.js';
import { renderExportHelpTips } from '../components/ExportHelpTips.js';
import { renderAlertsEducationTips } from '../components/AlertsEducationTips.js';
import { initInlineCalc } from '../tracker/inline-calc.js';
import { serializeCalculatorUrlState } from './calculator/url-state.js';
import { bindControlShortcuts } from '../tracker/control-shortcuts.js';
import { initPageEnter } from '../lib/page-enter.js';
import { createAlertEngine } from '../lib/alert-engine.js';
import {
  renderAlertManager,
  openAlertManager,
  showTriggerDialog,
  refreshAlertManager,
} from '../components/alert-manager.js';
import {
  createWatchlistItem,
  getMe,
  isAuthenticated as isAccountAuthenticated,
} from '../lib/public-account-client.js';
// Lazy-load heavy UI modules (ui-shell, events, wire, adSlot) inside init()
let mountShell;
let fetchWire, renderWireModule;
let initEvents, bindCoreEvents;
let renderAdSlot;
// Note: load `export` and `historical-data` lazily to reduce initial parse and network cost
// Render helpers are lazy-loaded inside init() to reduce initial module parse
let initRender,
  renderAll,
  renderLiveTick,
  renderChart,
  renderMarkets,
  renderComparisonWorkspace,
  renderAlerts,
  renderPresets,
  renderPlanners,
  renderArchive;
// render helpers are assigned during init()

const state = createInitialState();
const el = {};
let serverAlertsAvailable = false;
let accountEmailForAlerts = null;
const ALERT_EMAIL_FOCUS_DELAY_MS = 120;
let didPrefillAccountAlertEmail = false;
let realtimeEngine = null;
let realtimeSnapshot = null;
let inlineCalc = null;
let alertEngine = null;

function trackerTx(key, params = {}) {
  const fullKey = `tracker.${key}`;
  const template = TRANSLATIONS[state.lang]?.[fullKey] ?? TRANSLATIONS.en?.[fullKey] ?? fullKey;
  return Object.entries(params).reduce(
    (text, [token, value]) => text.replaceAll(`{${token}}`, String(value)),
    template
  );
}

function txGlobal(key) {
  return TRANSLATIONS[state.lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
}

function setInlineLinkText(node, beforeText, href, linkText) {
  if (!node) return;
  const link = document.createElement('a');
  link.href = href;
  link.className = 'tracker-inline-link';
  link.textContent = linkText;
  node.replaceChildren(beforeText, ' ', link);
}

function setButtonCopy(button, label, icon = null) {
  if (!button) return;
  const children = [];
  if (icon) {
    if (/^i-[a-z0-9-]+$/.test(icon)) {
      children.push(iconUseElement(icon, 'tracker-inline-ico'), ' ');
    } else {
      const iconSpan = document.createElement('span');
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.textContent = icon;
      children.push(iconSpan, ' ');
    }
  }
  children.push(label);
  button.replaceChildren(...children);
}

function setNodeText(id, text) {
  const node = document.getElementById(id);
  if (node) node.textContent = text;
}

function syncCurrentCountryPageLink() {
  const link = document.getElementById('tp-country-page-link');
  if (!link) return;
  const label = document.getElementById('tp-country-page-link-label') || link;
  const selectedCountry = COUNTRIES.find((country) => country.currency === state.selectedCurrency);
  // Country pages were retired; deep-link into the compare tool instead.
  if (!selectedCountry?.slug) {
    link.href = '/compare.html';
    label.textContent = trackerTx('quickToolsCountries');
    return;
  }
  const code = selectedCountry.code.toLowerCase();
  link.href = code === 'ae' ? '/compare.html' : `/compare.html#compare=ae,${code}&k=22`;
  label.textContent =
    state.lang === 'ar' ? selectedCountry.nameAr || selectedCountry.nameEn : selectedCountry.nameEn;
}

// Generic declarative hydrator for static tracker copy. Any element tagged
// data-i18n="<key>" gets its textContent set from trackerTx('<key>'); the
// -placeholder / -aria-label / -title variants set those attributes instead.
// This replaces dozens of per-element setNodeText calls for the static modes
// (exports / method / archive / planner / alerts chrome) — one attribute per
// string, re-applied on every language change. Keys are guarded by
// tests/tracker-i18n-key-coverage.test.js (which scans data-i18n attributes).
function hydrateStaticI18n() {
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = trackerTx(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
    el.setAttribute('placeholder', trackerTx(el.dataset.i18nPlaceholder));
  }
  for (const el of document.querySelectorAll('[data-i18n-aria-label]')) {
    el.setAttribute('aria-label', trackerTx(el.dataset.i18nAriaLabel));
  }
  for (const el of document.querySelectorAll('[data-i18n-title]')) {
    el.setAttribute('title', trackerTx(el.dataset.i18nTitle));
  }
}

function localizeStaticTrackerCopy() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  hydrateStaticI18n();

  const trustContent = document.querySelector('.tracker-trust-content');
  if (trustContent) {
    const strong = document.createElement('strong');
    strong.textContent = trackerTx('referenceBannerTitle');
    const link = document.createElement('a');
    link.href = 'methodology.html';
    link.textContent = trackerTx('referenceBannerLink');
    trustContent.replaceChildren(strong, ` — ${trackerTx('referenceBannerBody')} `, link);
  }

  const trustClose = document.querySelector('.tracker-trust-close');
  if (trustClose) {
    trustClose.setAttribute('aria-label', trackerTx('referenceBannerClose'));
    trustClose.setAttribute('title', trackerTx('referenceBannerClose'));
  }

  // Hero heading parts are independent siblings (not nested in the <h1>) so the
  // <h1> accessible name is a single clean title — not a run-on of the kicker
  // eyebrow + title + tagline (D6). The kicker is decorative branding that
  // duplicates the title, so it is aria-hidden in the markup.
  const titleSub = document.querySelector('.tracker-hero-title-sub');
  if (titleSub) titleSub.textContent = trackerTx('heroSub');
  const heroKicker = document.getElementById('tp-hero-kicker');
  if (heroKicker) heroKicker.textContent = trackerTx('heroKicker');
  const heroTitle = document.getElementById('tp-hero-title');
  if (heroTitle) heroTitle.textContent = trackerTx('heroTitle');

  const heroStats = document.getElementById('tp-hero-stats');
  if (heroStats) heroStats.setAttribute('aria-label', trackerTx('heroStats.ariaLabel'));

  // Workspace tab labels — text only (the emoji lives in a separate aria-hidden
  // .tp-tab-icon). Previously static English, so AR users saw English tabs.
  for (const id of ['live', 'compare', 'archive', 'alerts', 'planner', 'exports', 'method']) {
    const label = document.querySelector(`#tab-${id} .tp-tab-label`);
    if (label) label.textContent = trackerTx(`tabs.${id}`);
  }

  // Live-mode toolbar — static control labels (active state is class-driven).
  const compareMarketLabel = document.getElementById('tp-compare-market-label');
  if (compareMarketLabel)
    compareMarketLabel.textContent = trackerTx('liveToolbar.compareMarketLabel');
  for (const [range, key] of Object.entries({
    '3Y': 'liveToolbar.range3y',
    '5Y': 'liveToolbar.range5y',
    ALL: 'liveToolbar.rangeAll',
  })) {
    const pill = document.querySelector(`.tracker-pill[data-range="${range}"]`);
    if (pill) pill.textContent = trackerTx(key);
  }
  for (const [sel, key] of Object.entries({
    '[data-metric="selected"]': 'liveToolbar.chipSelected',
    '[data-metric="spot"]': 'liveToolbar.chipSpotOnly',
    '[data-metric="compare"]': 'liveToolbar.chipCompare',
    '[data-toggle="wire"]': 'liveToolbar.chipWire',
    '[data-toggle="favorites"]': 'liveToolbar.chipFavorites',
  })) {
    const chip = document.querySelector(`.tracker-chip${sel}`);
    if (chip) chip.textContent = trackerTx(key);
  }
  const autoRefreshChip = document.getElementById('tp-auto-refresh');
  if (autoRefreshChip) {
    autoRefreshChip.textContent = trackerTx(
      state.autoRefresh === false ? 'liveToolbar.autoRefreshOff' : 'liveToolbar.autoRefreshOn'
    );
  }

  // Exports mode — link-bearing disclaimer (the static card copy is data-i18n).
  setInlineLinkText(
    document.getElementById('tp-export-disclaimer'),
    trackerTx('exports.disclaimer'),
    'methodology.html',
    trackerTx('exports.disclaimerLink')
  );

  // Method mode — "Live spot layer" body wraps two literal <code> repo paths, so
  // it can't be a single data-i18n string; rebuild it from the localized
  // before/mid/after fragments with the (untranslated) code paths preserved.
  const methodSpotBody = document.getElementById('tp-method-spot-body');
  if (methodSpotBody) {
    const codeWorkflow = document.createElement('code');
    codeWorkflow.textContent = '.github/workflows/gold-price-fetch.yml';
    const codeData = document.createElement('code');
    codeData.textContent = 'data/gold_price.json';
    methodSpotBody.replaceChildren(
      trackerTx('method.spotBodyBefore'),
      codeWorkflow,
      trackerTx('method.spotBodyMid'),
      codeData,
      trackerTx('method.spotBodyAfter')
    );
  }

  // Planner overlay — link-bearing fees note (the rest of the chrome is data-i18n).
  setInlineLinkText(
    document.getElementById('tp-planner-fees-note'),
    trackerTx('planner.feesNote'),
    'methodology.html',
    trackerTx('planner.feesNoteLink')
  );

  // Hero readout reference-vs-retail disclaimer (link-bearing; under the live price).
  setInlineLinkText(
    document.getElementById('tp-readout-disclaimer'),
    trackerTx('readout.disclaimer'),
    'methodology.html#not-included',
    trackerTx('readout.disclaimerLink')
  );

  setInlineLinkText(
    document.getElementById('tp-hero-copy'),
    trackerTx('heroCopy'),
    'methodology.html#not-included',
    trackerTx('heroCopyLink')
  );

  setButtonCopy(el.refreshBtn, trackerTx('actions.refresh'), 'i-refresh');
  if (el.refreshBtn) el.refreshBtn.setAttribute('aria-label', trackerTx('actions.refreshLabel'));
  setButtonCopy(el.shareBtn, trackerTx('actions.copyBrief'));
  if (el.shareBtn) el.shareBtn.setAttribute('aria-label', trackerTx('actions.copyBriefLabel'));
  setButtonCopy(el.resetBtn, trackerTx('actions.reset'));
  if (el.resetBtn) el.resetBtn.setAttribute('aria-label', trackerTx('actions.resetLabel'));

  const jumpChart = document.getElementById('tp-jump-chart');
  if (jumpChart) {
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = state.lang === 'ar' ? '←' : '↓';
    jumpChart.replaceChildren(trackerTx('actions.viewChart'), ' ', arrow);
    jumpChart.setAttribute('aria-label', trackerTx('actions.jumpChartLabel'));
  }

  const fieldLabels = document.querySelectorAll('.tracker-hero-field .tracker-field-label');
  const fieldKeys = [
    trackerTx('controls.language'),
    trackerTx('controls.currency'),
    trackerTx('controls.karat'),
    trackerTx('controls.unit'),
  ];
  fieldLabels.forEach((label, index) => {
    if (fieldKeys[index]) label.textContent = fieldKeys[index];
  });

  const referenceHint = document.querySelector('.tracker-hero-footer .tracker-hint-text');
  if (referenceHint) {
    const icon = iconUseElement('i-warning', 'tracker-inline-ico');
    const link = document.createElement('a');
    link.href = 'methodology.html';
    link.className = 'tracker-inline-link';
    link.textContent = trackerTx('hints.referenceLink');
    referenceHint.replaceChildren(icon, ` ${trackerTx('hints.reference')} · `, link);
  }

  const keyboardHint = document.getElementById('tp-hero-hints');
  if (keyboardHint) keyboardHint.textContent = trackerTx('hints.shortcuts');

  const quickToolsHeading = document.querySelector(
    '.tracker-side-card--links .tracker-side-subheading'
  );
  if (quickToolsHeading) quickToolsHeading.textContent = trackerTx('quickToolsTitle');

  const quickToolLinks = document.querySelectorAll(
    '.tracker-side-card--links a .tracker-side-label, .tracker-side-card--links button .tracker-side-label'
  );
  const quickToolLabels = [
    trackerTx('quickToolsCalculator'),
    trackerTx('quickToolsCountryPage'),
    trackerTx('quickToolsCountries'),
    trackerTx('quickToolsShops'),
    trackerTx('quickToolsMethodology'),
    trackerTx('quickToolsCreateServerAlert'),
    trackerTx('quickToolsSpotVsRetail'),
  ];
  quickToolLinks.forEach((link, index) => {
    if (quickToolLabels[index]) link.textContent = quickToolLabels[index];
  });
  setNodeText('tp-alert-account-hint', trackerTx('alerts.accountPrefillHint'));
  syncCurrentCountryPageLink();

  const quickReference = document.querySelector('.tracker-hero-aside');
  if (quickReference)
    quickReference.setAttribute('aria-label', trackerTx('quickReferenceAriaLabel'));

  setNodeText('tp-mobile-workspace-kicker', trackerTx('mobileWorkspaceKicker'));
  setNodeText('tp-mobile-workspace-title', trackerTx('mobileWorkspaceTitle'));
  setNodeText('tp-mobile-workspace-copy', trackerTx('mobileWorkspaceCopy'));
  setNodeText('tp-mobile-selected-label', trackerTx('mobileStatusLabel'));
  setNodeText('tp-mobile-selected-note', trackerTx('mobileStatusNote'));
  setNodeText('tp-mobile-price-label', trackerTx('mobilePriceLabel'));
  setNodeText('tp-mobile-price-note', trackerTx('mobilePriceNote'));
  setNodeText('tp-mobile-spot-label', trackerTx('mobileSpotLabel'));
  setNodeText('tp-mobile-spot-note', trackerTx('mobileSpotNote'));
  setNodeText('tp-mobile-updated-label', trackerTx('mobileFreshnessLabel'));
  setNodeText('tp-mobile-updated-note', trackerTx('mobileFreshnessNote'));
  setNodeText('tp-mobile-summary-note', trackerTx('mobileSummaryNote'));
  setNodeText('tp-mobile-action-compare-kicker', trackerTx('mobileActionCompareKicker'));
  setNodeText('tp-mobile-action-compare-label', trackerTx('mobileActionCompareLabel'));
  setNodeText('tp-mobile-action-compare-desc', trackerTx('mobileActionCompareDesc'));
  setNodeText('tp-mobile-action-archive-kicker', trackerTx('mobileActionArchiveKicker'));
  setNodeText('tp-mobile-action-archive-label', trackerTx('mobileActionArchiveLabel'));
  setNodeText('tp-mobile-action-archive-desc', trackerTx('mobileActionArchiveDesc'));
  setNodeText('tp-mobile-action-exports-kicker', trackerTx('mobileActionExportsKicker'));
  setNodeText('tp-mobile-action-exports-label', trackerTx('mobileActionExportsLabel'));
  setNodeText('tp-mobile-action-exports-desc', trackerTx('mobileActionExportsDesc'));
  setNodeText('tp-mobile-action-alerts-kicker', trackerTx('mobileActionAlertsKicker'));
  setNodeText('tp-mobile-action-alerts-label', trackerTx('mobileActionAlertsLabel'));
  setNodeText('tp-mobile-action-alerts-desc', trackerTx('mobileActionAlertsDesc'));
  setNodeText('tp-alert-delivery-label', trackerTx('alerts.deliveryLabel'));
  setNodeText('tp-alert-email-label', trackerTx('alerts.serverEmailLabel'));
  setNodeText('tp-alert-email-hint', trackerTx('alerts.serverEmailHint'));
  if (el.saveWatchlistAccount) {
    el.saveWatchlistAccount.textContent =
      state.lang === 'ar' ? 'حفظ قائمة المراقبة في الحساب' : 'Save watchlist to account';
  }
  if (el.alertDelivery?.options?.[0]) {
    el.alertDelivery.options[0].textContent = trackerTx('alerts.deliveryLocal');
  }
  if (el.alertDelivery?.options?.[1]) {
    el.alertDelivery.options[1].textContent = trackerTx('alerts.deliveryServer');
  }
  setNodeText('tp-mobile-cue-chart-kicker', trackerTx('mobileCueChartKicker'));
  setNodeText('tp-mobile-cue-chart-title', trackerTx('mobileCueChartTitle'));
  setNodeText('tp-mobile-cue-chart-copy', trackerTx('mobileCueChartCopy'));
  setNodeText('tp-mobile-cue-tools-kicker', trackerTx('mobileCueToolsKicker'));
  setNodeText('tp-mobile-cue-tools-title', trackerTx('mobileCueToolsTitle'));
  setNodeText('tp-mobile-cue-tools-copy', trackerTx('mobileCueToolsCopy'));
  setNodeText('tp-chart-source-note', trackerTx('chartSourceNote'));
  setNodeText('tp-karat-heading', trackerTx('karatSectionTitle'));
  setNodeText('tp-karat-source-note', trackerTx('karatSectionNote'));
  setNodeText('tp-alerts-watchlist-title', trackerTx('alertsWatchlistTitle'));
  setNodeText('tp-watchlist-title', trackerTx('watchlistTitle'));
  setNodeText('tp-decision-cues-title', trackerTx('decisionCuesTitle'));
  setButtonCopy(
    document.getElementById('tp-open-alerts-inline'),
    trackerTx('actions.openAlertsPanel')
  );
  setNodeText('tp-export-command-title', trackerTx('exportCommand.title'));
  setNodeText('tp-export-command-copy', trackerTx('exportCommand.copy'));
  setNodeText('tp-export-readiness-pill', trackerTx('exportReadiness.checking'));
  setNodeText('tracker-inline-calc-title', trackerTx('inlineCalcTitle'));
  setNodeText('tracker-inline-calc-sub', trackerTx('inlineCalcSub'));
  setNodeText('tracker-inline-calc-weight-label', trackerTx('calcWeightLabel'));
  setNodeText('tracker-inline-calc-karat-label', trackerTx('calcKaratLabel'));
  setNodeText('tracker-inline-calc-currency-label', trackerTx('calcCurrencyLabel'));
  setNodeText('tracker-inline-calc-result-label', trackerTx('calcResultLabel'));
  setNodeText('tracker-inline-calc-disclaimer', trackerTx('calcDisclaimer'));
  setNodeText('tracker-inline-calc-method-link', trackerTx('calcMethodLink'));
  const inlineCalcWeight = document.getElementById('tracker-inline-calc-weight');
  if (inlineCalcWeight) {
    inlineCalcWeight.placeholder = trackerTx('calcWeightPlaceholder');
  }
  setButtonCopy(document.getElementById('tp-share-inline'), trackerTx('actions.copyBrief'));
  setButtonCopy(
    document.getElementById('tp-open-exports-inline'),
    trackerTx('actions.openExportsPanel')
  );
  setInlineLinkText(
    document.getElementById('tp-export-source-note'),
    trackerTx('exportCommand.note'),
    'methodology.html',
    trackerTx('referenceBannerLink')
  );
  setNodeText('tp-market-scroll-hint', trackerTx('marketScrollHint'));
  setNodeText('tp-archive-scroll-hint', trackerTx('archiveScrollHint'));
  setNodeText('tp-compare-builder-title', trackerTx('compare.builderTitle'));
  setNodeText('tp-compare-note', trackerTx('compare.builderNote'));
  // Compare board intro carries a methodology link, so it can't be data-i18n.
  setInlineLinkText(
    document.getElementById('tp-compare-board-copy'),
    trackerTx('compare.boardCopy'),
    'methodology.html#not-included',
    trackerTx('compare.boardCopyLink')
  );
  const monthLabel = document.querySelector('.tracker-history-month-field > span');
  if (monthLabel) monthLabel.textContent = trackerTx('compare.monthLabel');
  setButtonCopy(document.getElementById('tp-history-month-clear'), trackerTx('compare.clearMonth'));
  el.compareCountrySelects?.forEach((select, index) => {
    const span = select?.closest('label')?.querySelector('span');
    if (span) span.textContent = trackerTx('compare.countryLabel', { index: index + 1 });
  });
  setButtonCopy(document.getElementById('tp-export-compare'), trackerTx('compare.exportLabel'));
  setButtonCopy(document.getElementById('tp-export-compare-2'), trackerTx('compare.exportLabel'));
  const presetLabels = [
    trackerTx('compare.presetGcc'),
    trackerTx('compare.presetUae'),
    trackerTx('compare.presetArab'),
  ];
  el.comparePresetButtons?.forEach((button, index) => {
    if (presetLabels[index]) button.textContent = presetLabels[index];
  });
}

function syncInlineCalcCalculatorLink() {
  const link = document.getElementById('tracker-inline-calc-full-link');
  const weightInput = document.getElementById('tracker-inline-calc-weight');
  const karatSelect = document.getElementById('tracker-inline-calc-karat');
  const currencySelect = document.getElementById('tracker-inline-calc-currency');
  if (!link) return;
  link.textContent = trackerTx('quickCalc.openFull');
  const weight = weightInput?.value || '';
  const karat = karatSelect?.value || state.selectedKarat || '24';
  const currency = currencySelect?.value || state.selectedCurrency || 'AED';
  link.href = `calculator.html${serializeCalculatorUrlState({
    weight,
    karat,
    currency,
    mode: 'value',
    valueMode: 'weight',
  })}&lang=${state.lang}`;
}

function syncInlineCalcSourceNote(freshnessKey, freshnessMeta) {
  inlineCalc?.update({
    goldPriceUsd: currentSpot(),
    rates: state.rates,
    lang: state.lang,
  });
  syncInlineCalcCalculatorLink();
  setNodeText(
    'tracker-inline-calc-source',
    trackerTx('summary.freshnessCopy', {
      source: formatProviderLabel(state.live?.providerId || 'primary-provider'),
      age: freshnessMeta.ageText,
      time: freshnessMeta.timeText,
    })
  );
  const result = document.getElementById('tracker-inline-calc-result');
  if (result) result.dataset.freshnessKey = freshnessKey;
}

function renderTrackerAddonPanels() {
  const freshnessKey = realtimeSnapshot?.freshness?.state || state.live?.status || 'unavailable';
  const freshnessMeta = getLiveFreshness({
    updatedAt: state.live?.updatedAt,
    lang: state.lang,
    hasLiveFailure: state.hasLiveFailure,
    isFallback: state.live?.isFallback ?? null,
    isFresh: state.live?.isFresh ?? null,
  });

  const freshnessSlot = document.getElementById('tp-freshness-badge-slot');
  if (freshnessSlot) {
    freshnessSlot.replaceChildren(
      renderFreshnessBadge({
        lang: state.lang,
        state: freshnessKey,
        source: formatProviderLabel(state.live?.providerId || 'primary-provider'),
        updatedAt: state.live?.updatedAt,
        marketOpen: getMarketStatus().isOpen,
        t: txGlobal,
      })
    );
  }

  const marketSlot = document.getElementById('tp-market-status-slot');
  if (marketSlot) {
    marketSlot.replaceChildren(
      renderMarketStatusPanel({
        lang: state.lang,
        t: txGlobal,
      })
    );
  }

  const quoteMetaSlot = document.getElementById('tp-quote-meta-slot');
  if (quoteMetaSlot) {
    quoteMetaSlot.replaceChildren(
      renderQuoteMetaPanel({
        lang: state.lang,
        statusLabel: trackerTx(`source.${freshnessKey}`),
        sourceLabel: formatProviderLabel(state.live?.providerId || 'primary-provider'),
        providerId: formatProviderLabel(state.live?.providerId || 'primary-provider'),
        providerTimestamp: state.live?.sourceTimestamp,
        fetchedAt: state.live?.fetchedAt,
        ageLabel: freshnessMeta.ageText,
        pollIntervalMs: realtimeSnapshot?.metrics?.nextPollInMs ?? null,
        lastFetchLatencyMs: realtimeSnapshot?.metrics?.latestNetworkLatencyMs ?? null,
        t: txGlobal,
      })
    );
  }

  const slaSlot = document.getElementById('tp-realtime-sla-slot');
  if (slaSlot) {
    if (!isRealtimeDebugEnabled()) {
      slaSlot.replaceChildren();
    } else {
      slaSlot.replaceChildren(
        renderRealtimeSlaPanel({
          snapshot: realtimeSnapshot,
          t: txGlobal,
        })
      );
    }
  }

  document
    .getElementById('tp-quick-presets-slot')
    ?.replaceChildren(renderTrackerQuickPresets({ t: txGlobal }));
  document
    .getElementById('tp-compare-hints-slot')
    ?.replaceChildren(renderTrackerCompareHints({ t: txGlobal }));
  document
    .getElementById('tp-export-help-slot')
    ?.replaceChildren(renderExportHelpTips({ t: txGlobal }));
  document
    .getElementById('tp-alerts-help-slot')
    ?.replaceChildren(renderAlertsEducationTips({ t: txGlobal }));
  syncInlineCalcSourceNote(freshnessKey, freshnessMeta);
}

function ui() {
  return {
    refreshBtn: document.getElementById('tp-refresh-btn'),
    shareBtn: document.getElementById('tp-share-btn'),
    resetBtn: document.getElementById('tp-reset-btn'),
    workspaceToggle: document.getElementById('tp-workspace-toggle'),
    language: document.getElementById('tp-language'),
    currency: document.getElementById('tp-currency'),
    karat: document.getElementById('tp-karat'),
    unit: document.getElementById('tp-unit'),
    compare: document.getElementById('tp-compare-country'),
    rangePills: document.querySelectorAll('.tracker-pill[data-range]'),
    historyMonth: document.getElementById('tp-history-month'),
    historyMonthClear: document.getElementById('tp-history-month-clear'),
    autoRefresh: document.getElementById('tp-auto-refresh'),
    liveBadgeText: document.getElementById('tp-live-badge-text'),
    xauUsdValue: document.getElementById('tp-xauusd-value'),
    marketBadge: document.getElementById('tp-market-badge'),
    refreshBadge: document.getElementById('tp-refresh-badge'),
    heroStats: document.getElementById('tp-hero-stats'),
    summaryList: document.getElementById('tp-summary-list'),
    wireTrack: document.getElementById('tp-wire-track'),
    wireRefresh: document.getElementById('tp-wire-refresh'),
    wireToggle: document.getElementById('tp-wire-toggle'),
    chart: document.getElementById('tp-chart'),
    chartWrap: document.querySelector('.tracker-chart-wrap'),
    tooltip: document.getElementById('tp-tooltip'),
    legendMain: document.getElementById('tp-legend-main'),
    legendCompare: document.getElementById('tp-legend-compare'),
    miniStrip: document.getElementById('tp-mini-strip'),
    chartStats: document.getElementById('tp-chart-stats'),
    chartHistorySource: document.getElementById('tp-chart-history-source'),
    historyCaption: document.getElementById('tp-history-caption'),
    rangeNotes: document.getElementById('tp-range-notes'),
    playbackStrip: document.getElementById('tp-playback-strip'),
    playbackBtn: document.getElementById('tp-playback-btn'),
    karatTable: document.getElementById('tp-karat-table'),
    marketFilter: document.getElementById('tp-market-filter'),
    marketSort: document.getElementById('tp-market-sort'),
    marketView: document.getElementById('tp-market-view'),
    marketBoard: document.getElementById('tp-market-board'),
    marketEmpty: document.getElementById('tp-market-empty'),
    compareCountrySelects: [
      document.getElementById('tp-compare-country-1'),
      document.getElementById('tp-compare-country-2'),
      document.getElementById('tp-compare-country-3'),
    ],
    compareKaratButtons: document.querySelectorAll('[data-compare-karat]'),
    comparePresetButtons: document.querySelectorAll('[data-compare-preset]'),
    comparisonCards: document.getElementById('tp-comparison-cards'),
    comparisonEmpty: document.getElementById('tp-comparison-empty'),
    watchlistGrid: document.getElementById('tp-watchlist-grid'),
    decisionCues: document.getElementById('tp-decision-cues'),
    alertSummary: document.getElementById('tp-alert-summary'),
    openAlertsInline: document.getElementById('tp-open-alerts-inline'),
    alertScope: document.getElementById('tp-alert-scope'),
    alertScopeWrap: document.getElementById('tp-alert-scope-wrap'),
    alertDelivery: document.getElementById('tp-alert-delivery'),
    alertDirection: document.getElementById('tp-alert-direction'),
    alertTarget: document.getElementById('tp-alert-target'),
    alertEmail: document.getElementById('tp-alert-email'),
    alertEmailWrap: document.getElementById('tp-alert-email-wrap'),
    alertAccountHint: document.getElementById('tp-alert-account-hint'),
    alertList: document.getElementById('tp-alert-list'),
    alertPermission: document.getElementById('tp-alert-permission'),
    alertServerStatus: document.getElementById('tp-alert-server-status'),
    saveAlert: document.getElementById('tp-save-alert'),
    enableNotifications: document.getElementById('tp-enable-notifications'),
    presetName: document.getElementById('tp-preset-name'),
    savePreset: document.getElementById('tp-save-preset'),
    copyUrl: document.getElementById('tp-copy-url'),
    presetList: document.getElementById('tp-preset-list'),
    budgetAmount: document.getElementById('tp-budget-amount'),
    budgetFee: document.getElementById('tp-budget-fee'),
    budgetResults: document.getElementById('tp-budget-results'),
    positionEntry: document.getElementById('tp-position-entry'),
    positionQty: document.getElementById('tp-position-qty'),
    positionResults: document.getElementById('tp-position-results'),
    jewelryWeight: document.getElementById('tp-jewelry-weight'),
    jewelryKarat: document.getElementById('tp-jewelry-karat'),
    jewelryMaking: document.getElementById('tp-jewelry-making'),
    jewelryPremium: document.getElementById('tp-jewelry-premium'),
    jewelryVat: document.getElementById('tp-jewelry-vat'),
    jewelryResults: document.getElementById('tp-jewelry-results'),
    accumMonthly: document.getElementById('tp-accum-monthly'),
    accumTarget: document.getElementById('tp-accum-target'),
    accumResults: document.getElementById('tp-accum-results'),
    archiveRange: document.getElementById('tp-archive-range'),
    archiveSearch: document.getElementById('tp-archive-search'),
    archiveBody: document.getElementById('tp-archive-body'),
    archiveMeta: document.getElementById('tp-archive-meta'),
    exportArchive: document.getElementById('tp-export-archive'),
    exportArchive2: document.getElementById('tp-export-archive-2'),
    exportHistory: document.getElementById('tp-export-history'),
    exportHistory2: document.getElementById('tp-export-history-2'),
    lookupDate: document.getElementById('tp-lookup-date'),
    runLookup: document.getElementById('tp-run-lookup'),
    lookupResults: document.getElementById('tp-lookup-results'),
    seasonalResults: document.getElementById('tp-seasonal-results'),
    exportChart: document.getElementById('tp-export-chart'),
    exportChart2: document.getElementById('tp-export-chart-2'),
    exportCompare: document.getElementById('tp-export-compare'),
    exportCompare2: document.getElementById('tp-export-compare-2'),
    exportWatchlist: document.getElementById('tp-export-watchlist'),
    saveWatchlistAccount: document.getElementById('tp-save-watchlist-account'),
    chartEmpty: document.getElementById('tp-chart-empty'),
    openExportsInline: document.getElementById('tp-open-exports-inline'),
    shareInline: document.getElementById('tp-share-inline'),
    downloadJson: document.getElementById('tp-download-json'),
    downloadJson2: document.getElementById('tp-download-json-2'),
    downloadBrief: document.getElementById('tp-download-brief'),
    briefHeadline: document.getElementById('tp-brief-headline'),
    briefCopy: document.getElementById('tp-brief-copy'),
    toastStack: document.getElementById('tp-toast-stack'),
    createServerAlertLink: document.getElementById('tp-create-server-alert-link'),
  };
}

function updateServerAlertUiState() {
  if (!el.alertDelivery) return;
  const wantsServer = el.alertDelivery.value === 'server';
  const canUseServer = serverAlertsAvailable;

  if (el.alertEmailWrap) {
    el.alertEmailWrap.hidden = !(wantsServer && canUseServer);
  }
  if (el.alertAccountHint) {
    el.alertAccountHint.hidden = !(didPrefillAccountAlertEmail && wantsServer && canUseServer);
  }
  if (el.alertScopeWrap) {
    el.alertScopeWrap.hidden = wantsServer && canUseServer;
  }

  if (wantsServer && !canUseServer) {
    el.alertDelivery.value = 'local';
    if (el.alertServerStatus) {
      el.alertServerStatus.textContent = trackerTx('alerts.serverUnavailable');
    }
    return;
  }

  if (el.alertServerStatus) {
    el.alertServerStatus.textContent = canUseServer
      ? trackerTx('alerts.serverAvailable')
      : trackerTx('alerts.serverUnavailable');
  }
}

async function probeServerAlertsAvailability() {
  // Static GitHub Pages has no `/api/v1/*` backend, so this capability probe
  // would 404 on every tracker load. Skip it unless a backend is actually
  // deployed (CONSTANTS.API_BACKEND_ENABLED). All server-alert UI and POSTs are
  // gated on the returned value, so returning false here cleanly keeps the
  // tracker on the local-alert path with no failed request.
  if (!CONSTANTS.API_BACKEND_ENABLED) return false;
  try {
    const res = await fetch('/api/v1/config/public', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;
    const payload = await res.json();
    return payload?.ok === true && payload?.data?.features?.alerts === true;
  } catch {
    return false;
  }
}

async function createServerAlert({ condition, target }) {
  const typedEmail = el.alertEmail?.value?.trim();
  const email = (typedEmail || accountEmailForAlerts || '').toLowerCase();
  if (!email) {
    throw new Error(trackerTx('alerts.serverEmailRequired'));
  }

  const response = await fetch('/api/v1/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      channel: 'email',
      symbol: 'XAUUSD',
      currency: state.selectedCurrency === 'AED' ? 'AED' : 'USD',
      condition,
      threshold_value: target,
      karat: state.selectedCurrency === 'AED' ? state.selectedKarat : null,
      country_code: state.selectedCurrency === 'AED' ? 'AE' : null,
      cooldown_minutes: 60,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || trackerTx('alerts.serverCreateFailed'));
  }
  return payload?.data || null;
}

async function prefillServerAlertEmailFromAccount() {
  if (!isAccountAuthenticated()) return;
  try {
    const me = await getMe();
    const email = me?.user?.email?.trim()?.toLowerCase();
    if (!email) return;
    accountEmailForAlerts = email;
    const canPrefill = el.alertEmail && !el.alertEmail.value;
    if (canPrefill) {
      el.alertEmail.value = email;
      didPrefillAccountAlertEmail = true;
    }
    updateServerAlertUiState();
  } catch {
    // non-blocking
  }
}

async function syncAlertToAccount({ condition, target }) {
  if (!isAccountAuthenticated()) return;
  const currency = state.selectedCurrency || 'USD';
  const karat = state.selectedKarat || '24';
  const itemKey = `${condition}:${target}:${currency}:${karat}`;
  await createWatchlistItem({
    item_type: 'alert',
    item_key: itemKey.slice(0, 120),
    item_label:
      state.lang === 'ar'
        ? `تنبيه ${condition === 'above' ? 'أعلى من' : 'أقل من'} ${target}`
        : `Alert ${condition} ${target}`,
    metadata: {
      source: 'tracker',
      condition,
      target,
      currency,
      karat,
    },
  });
}

async function saveWatchlistToAccount() {
  if (!isAccountAuthenticated()) {
    // Cross-device sync was retired with the account page — the watchlist
    // already persists locally, so just confirm that honestly.
    showToast(trackerTx('toast.watchlistSavedLocal'));
    return;
  }

  const favorites = Array.isArray(state.favorites) ? state.favorites : [];
  for (const currency of favorites) {
    if (!currency) continue;
    await createWatchlistItem({
      item_type: 'currency',
      item_key: String(currency).toUpperCase(),
      item_label: String(currency).toUpperCase(),
      metadata: { source: 'tracker-watchlist' },
    });
  }
  showToast(trackerTx('toast.watchlistSavedAccount', { count: favorites.length }));
}

function initMobileWorkspaceActions() {
  document.querySelectorAll('[data-mobile-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-mobile-action');
      if (
        ['compare', 'archive', 'exports'].includes(action) &&
        !document.body.classList.contains('tracker-workspace-advanced')
      ) {
        el.workspaceToggle?.click();
      }
      const targetMap = {
        compare: '#tab-compare',
        archive: '#tab-archive',
        exports: '#tab-exports',
        alerts: '#tab-alerts',
      };
      const target = targetMap[action];
      if (!target) return;
      document.querySelector(target)?.click();
    });
  });
}

// ── Price helpers ─────────────────────────────────────────────────────────────

function currentSpot() {
  return state.live?.price ?? null;
}

const TOLA_GRAMS = 11.6638;
const KG_GRAMS = 1000;

function priceFor({ currency, karat, unit, spot }) {
  const s = spot ?? currentSpot();
  if (!s) return null;
  const karatObj = KARATS.find((k) => k.code === String(karat));
  if (!karatObj) return null;
  const usdPerGram = (s / CONSTANTS.TROY_OZ_GRAMS) * karatObj.purity;
  let local;
  if (currency === 'AED') {
    local = usdPerGram * CONSTANTS.AED_PEG;
  } else {
    const rate = state.rates?.[currency];
    if (!rate) return null;
    local = usdPerGram * rate;
  }
  if (unit === 'oz') return local * CONSTANTS.TROY_OZ_GRAMS;
  if (unit === 'tola') return local * TOLA_GRAMS;
  if (unit === 'kg') return local * KG_GRAMS;
  return local;
}

function formatReadoutPrice(value, currency) {
  if (value == null || !Number.isFinite(value)) return '—';
  const formatted = value.toLocaleString(state.lang === 'ar' ? 'ar-AE' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : `$${formatted}`;
}

function syncHeroReadout() {
  const spotEl = document.getElementById('tp-readout-spot-value');
  const selectedEl = document.getElementById('tp-readout-selected-value');
  const unitNoteEl = document.getElementById('tp-readout-unit-note');
  const spotLabelEl = document.getElementById('tp-readout-spot-label');
  const selectedLabelEl = document.getElementById('tp-readout-selected-label');
  const metaHeading = document.getElementById('tp-command-meta-heading');

  const spot = currentSpot();
  const selectedPrice = priceFor({
    currency: state.selectedCurrency,
    karat: state.selectedKarat,
    unit: state.selectedUnit,
    spot,
  });

  if (spotLabelEl) spotLabelEl.textContent = trackerTx('readout.spotLabel');
  if (selectedLabelEl) {
    selectedLabelEl.textContent =
      trackerTx('readout.selectedLabel', {
        karat: state.selectedKarat,
        currency: state.selectedCurrency,
      }) || `${state.selectedKarat}K · ${state.selectedCurrency}`;
  }
  if (spotEl) {
    spotEl.textContent = spot
      ? `$${spot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '—';
    spotEl.removeAttribute('aria-busy');
  }
  if (selectedEl) {
    selectedEl.textContent = formatReadoutPrice(selectedPrice, state.selectedCurrency);
    selectedEl.removeAttribute('aria-busy');
  }
  if (unitNoteEl) {
    const unitKey =
      state.selectedUnit === 'gram'
        ? 'Gram'
        : state.selectedUnit === 'oz'
          ? 'Oz'
          : state.selectedUnit === 'tola'
            ? 'Tola'
            : 'Kg';
    unitNoteEl.textContent = trackerTx(`controls.unit${unitKey}`) || state.selectedUnit;
  }
  if (metaHeading) {
    metaHeading.textContent = trackerTx('commandMeta.heading');
  }
}

function syncUnitSegmented() {
  const segmented = document.getElementById('tp-unit-segmented');
  if (!segmented) return;
  segmented.querySelectorAll('[data-unit]').forEach((btn) => {
    const active = btn.dataset.unit === state.selectedUnit;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function wireUnitSegmentedControl() {
  const segmented = document.getElementById('tp-unit-segmented');
  if (!segmented || segmented.dataset.wired === 'true') return;
  segmented.dataset.wired = 'true';
  segmented.querySelectorAll('[data-unit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const unit = btn.dataset.unit;
      if (!unit || unit === state.selectedUnit) return;
      state.selectedUnit = unit;
      if (el.unit) {
        el.unit.value = unit;
        el.unit.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        persistState(state);
        renderAll?.();
        renderTrackerAddonPanels();
      }
      syncUnitSegmented();
      syncHeroReadout();
      track(EVENTS.UNIT_CHANGE, { surface: 'tracker', unit });
    });
  });
  syncUnitSegmented();
}

function setChartLoading(isLoading) {
  const wrap = el.chartWrap || document.querySelector('.tracker-chart-wrap');
  if (!wrap) return;
  wrap.classList.toggle('is-loading', Boolean(isLoading));
  const skeleton = document.getElementById('tp-chart-skeleton');
  if (skeleton) skeleton.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
}

function getSelectedComparisonCountries() {
  return (state.compareCountries || [])
    .map((code) => COUNTRIES.find((country) => country.code === code))
    .filter(Boolean)
    .slice(0, 3);
}

function getSelectedComparisonKarats() {
  return (state.compareKarats || []).filter(Boolean).slice(0, 4);
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function showToast(msg, durationMs = 3500) {
  if (!el.toastStack) return;
  const toast = document.createElement('div');
  toast.className = 'tracker-toast';
  toast.textContent = msg;
  el.toastStack.appendChild(toast);
  setTimeout(() => toast.remove(), durationMs);
}

function checkAlerts() {
  const spot = currentSpot();
  if (!spot || !state.alerts?.length) return;
  const triggered = [];
  state.alerts.forEach((a) => {
    const hit = a.direction === 'above' ? spot > a.target : spot < a.target;
    if (hit) {
      const directionLabel = trackerTx(
        a.direction === 'above' ? 'alerts.directionAbove' : 'alerts.directionBelow'
      );
      triggered.push(`${a.scope} · ${directionLabel} $${a.target}`);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(trackerTx('alerts.notificationTitle'), {
          body: trackerTx('alerts.liveRegionTriggered', {
            alerts: `${a.scope} · ${directionLabel} $${a.target}`,
            spot: spot.toFixed(2),
          }),
        });
      }
    }
  });
  // Announce triggered alerts to screen readers via the aria-live region
  if (triggered.length) {
    const liveRegion = document.getElementById('tp-alert-live-region');
    if (liveRegion) {
      liveRegion.textContent = trackerTx('alerts.liveRegionTriggered', {
        alerts: triggered.join(', '),
        spot: spot.toFixed(2),
      });
    }
  }
}

async function exportArchiveData() {
  if (!state.history.length) {
    showToast(trackerTx('toast.noArchiveData'));
    return;
  }
  const records = state.history.map((r) => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
    price: r.spot,
    source: r.source,
    granularity: r.granularity,
  }));
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportHistoricalCSV(records, state.selectedKarat);
  } catch (_e) {
    showToast(trackerTx('toast.exportFailed'));
  }
}

function exportHistoryData() {
  // keep synchronous facade; archive export is async but not awaited here
  exportArchiveData();
}

async function exportChartData() {
  if (!state.history.length) {
    showToast(trackerTx('toast.noChartData'));
    return;
  }
  const flat = state.history.map((r) => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
    spot: r.spot,
    price: r.spot,
    source: r.source,
  }));
  const spot = currentSpot();
  // Filter to the visible range before exporting so the CSV matches what the user sees
  const { filterByRange } = await import('../lib/historical-data.js');
  const rangeFiltered = state.range ? filterByRange(flat, state.range) : flat;
  const rows = rangeFiltered.filter(Boolean);
  if (spot)
    rows.push({
      date: new Date().toISOString().slice(0, 10),
      spot,
      price: spot,
      granularity: 'live',
      ...deriveLiveRowFreshness(getFreshnessModel().effectiveKey),
    });
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportChartCSV(rows, state.range, state.selectedKarat);
    showToast(trackerTx('toast.chartCsvDownloaded'));
  } catch (_e) {
    showToast(trackerTx('toast.exportFailed'));
  }
}

async function exportWatchlistData() {
  const spot = currentSpot();
  if (!spot) {
    showToast(trackerTx('toast.waitingLivePrice'));
    return;
  }
  if (!state.favorites?.length) {
    showToast(trackerTx('toast.noFavorites'));
    return;
  }
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportWatchlistCSV({
      favorites: state.favorites,
      countries: COUNTRIES,
      karatCode: state.selectedKarat,
      priceFor,
      spot,
      selectedUnit: state.selectedUnit,
      selectedCurrency: state.selectedCurrency,
      lang: state.lang,
    });
    showToast(trackerTx('toast.watchlistCsvDownloaded'));
  } catch (_e) {
    showToast(trackerTx('toast.exportFailed'));
  }
}

async function exportComparisonData() {
  const spot = currentSpot();
  if (!spot) {
    showToast(trackerTx('toast.waitingLivePrice'));
    return;
  }
  const countries = getSelectedComparisonCountries();
  const karats = getSelectedComparisonKarats();
  if (!countries.length || !karats.length) {
    showToast(trackerTx('toast.selectCountryKarat'));
    return;
  }
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportComparisonCSV({
      countries,
      karatCodes: karats,
      priceFor,
      spot,
      freshness: {
        goldUpdatedAt: state.live?.updatedAt || null,
        fxUpdatedAt: state.fxMeta?.lastUpdateUtc || null,
        hasLiveFailure: state.hasLiveFailure,
      },
      lang: state.lang,
    });
    showToast(trackerTx('toast.comparisonCsvDownloaded'));
  } catch (_e) {
    showToast(trackerTx('toast.exportFailed'));
  }
}

async function exportBriefData() {
  const headline = el.briefHeadline?.textContent;
  const body = el.briefCopy?.textContent;
  if (!headline || headline.startsWith('Waiting')) {
    showToast(trackerTx('toast.waitingLiveData'));
    return;
  }
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportBriefText(headline, body);
    showToast(trackerTx('toast.briefDownloaded'));
  } catch (_e) {
    showToast(trackerTx('toast.exportFailed'));
  }
}

async function exportJsonData() {
  const spot = currentSpot();
  const prices = {};
  if (spot) {
    KARATS.forEach((k) => {
      prices[k.code] = {};
      [...new Set(COUNTRIES.map((c) => c.currency))].forEach((cur) => {
        const p = priceFor({ currency: cur, karat: k.code, unit: 'gram', spot });
        if (p) prices[k.code][cur] = { gram: p, oz: p * CONSTANTS.TROY_OZ_GRAMS };
      });
    });
  }
  const hasLiveFailure = state.hasLiveFailure;
  const baselineRange = getBaselineRange();
  const exportState = {
    goldPriceUsdPerOz: spot || null,
    freshness: {
      goldUpdatedAt: state.live?.updatedAt || new Date().toISOString(),
      fxUpdatedAt: state.fxMeta?.lastUpdateUtc || new Date().toISOString(),
      hasLiveFailure,
    },
    rates: state.rates,
    lang: state.lang,
    selectedCurrency: state.selectedCurrency,
    selectedKarat: state.selectedKarat,
    selectedUnit: state.selectedUnit,
    compareCountries: getSelectedComparisonCountries().map((country) => ({
      code: country.code,
      currency: country.currency,
      nameEn: country.nameEn,
      nameAr: country.nameAr,
    })),
    compareKarats: getSelectedComparisonKarats(),
    historyMonth: state.historyMonth || null,
    range: state.range,
    baselineCoverage: {
      first: baselineRange.first,
      last: baselineRange.last,
      monthCount: baselineRange.count,
    },
  };
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportJSON(exportState, prices);
  } catch (_e) {
    showToast(trackerTx('toast.exportFailed'));
  }
}

// ── Auto-refresh ──────────────────────────────────────────────────────────────

let _autoRefreshTimer = null;
let _countdownTimer = null;
let _countdownValue = 0;
let _fetchInFlight = false; // used for non-pricing refresh tasks only

function startCountdown() {
  clearInterval(_countdownTimer);
  const nextPollMs = realtimeSnapshot?.metrics?.nextPollInMs ?? CONSTANTS.GOLD_REFRESH_MS;
  _countdownValue = Math.floor(nextPollMs / 1000);

  // Query once; reused by every tick and the initial paint.
  const el_countdown = document.getElementById('tp-countdown');

  // Display the initial value immediately so the user sees the full countdown.
  if (el_countdown) el_countdown.textContent = trackerTx('countdown', { seconds: _countdownValue });

  function tick() {
    _countdownValue--;
    if (_countdownValue <= 0) {
      clearInterval(_countdownTimer);
      if (el_countdown) el_countdown.textContent = '';
      return;
    }
    if (el_countdown)
      el_countdown.textContent = trackerTx('countdown', { seconds: _countdownValue });
  }
  _countdownTimer = setInterval(tick, 1000);
}

function startAutoRefresh() {
  if (realtimeEngine) realtimeEngine.start();
  if (_autoRefreshTimer) return;
  _autoRefreshTimer = setInterval(async () => {
    if (!state.autoRefresh) return;
    if (_fetchInFlight) return;
    _fetchInFlight = true;
    try {
      await ensureUnifiedHistory();
      await refreshWire();
      checkAlerts();
      renderTrackerAddonPanels();
    } finally {
      _fetchInFlight = false;
    }
  }, WIRE_HISTORY_REFRESH_MS);
}

function stopAutoRefresh() {
  if (realtimeEngine) realtimeEngine.stop();
  clearInterval(_autoRefreshTimer);
  _autoRefreshTimer = null;
}

// ── Populates dropdowns ───────────────────────────────────────────────────────

function populateSelects() {
  if (el.currency) {
    const currencies = [...new Set(COUNTRIES.map((c) => c.currency))].sort();
    const frag = document.createDocumentFragment();
    currencies.forEach((c) => {
      const opt = safeEl('option', { value: c }, [c]);
      if (c === state.selectedCurrency) opt.selected = true;
      frag.appendChild(opt);
    });
    el.currency.replaceChildren(frag);
  }
  if (el.karat) {
    const frag = document.createDocumentFragment();
    KARATS.forEach((k) => {
      const opt = safeEl('option', { value: k.code }, [
        `${k.code}K — ${(k.purity * 100).toFixed(1)}%`,
      ]);
      if (k.code === state.selectedKarat) opt.selected = true;
      frag.appendChild(opt);
    });
    el.karat.replaceChildren(frag);
  }
  if (el.unit) {
    const frag = document.createDocumentFragment();
    ['gram', 'oz', 'tola', 'kg'].forEach((u) => {
      const unitKey = u === 'gram' ? 'Gram' : u === 'oz' ? 'Oz' : u === 'tola' ? 'Tola' : 'Kg';
      const opt = safeEl('option', { value: u }, [trackerTx(`controls.unit${unitKey}`)]);
      if (u === state.selectedUnit) opt.selected = true;
      frag.appendChild(opt);
    });
    el.unit.replaceChildren(frag);
  }
  if (el.language) el.language.value = state.lang;
  if (el.historyMonth) el.historyMonth.value = state.historyMonth || '';
  // Sync range pills with persisted state (HTML default is 24H; state default is 30D).
  if (el.rangePills?.length) {
    el.rangePills.forEach((p) => {
      const active = p.dataset.range === state.range;
      p.classList.toggle('is-active', active);
      p.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  if (el.jewelryKarat) {
    const frag = document.createDocumentFragment();
    KARATS.forEach((k) => {
      frag.appendChild(safeEl('option', { value: k.code }, [`${k.code}K`]));
    });
    el.jewelryKarat.replaceChildren(frag);
  }
  if (el.compareCountrySelects?.length) {
    const options = COUNTRIES.map((country) => ({
      value: country.code,
      label: state.lang === 'ar' ? country.nameAr || country.nameEn : country.nameEn,
    }));
    el.compareCountrySelects.forEach((select, index) => {
      if (!select) return;
      const frag = document.createDocumentFragment();
      frag.appendChild(safeEl('option', { value: '' }, ['—']));
      options.forEach((option) => {
        const node = safeEl('option', { value: option.value }, [option.label]);
        if (option.value === state.compareCountries[index]) node.selected = true;
        frag.appendChild(node);
      });
      select.replaceChildren(frag);
    });
  }
  if (el.compareKaratButtons?.length) {
    el.compareKaratButtons.forEach((button) => {
      const active = state.compareKarats.includes(button.dataset.compareKarat);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  if (el.comparePresetButtons?.length) {
    el.comparePresetButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.comparePreset === state.comparePreset);
    });
  }
  syncUnitSegmented();
}

// ── Data fetch ────────────────────────────────────────────────────────────────

function applyRealtimeSnapshot(snapshot) {
  realtimeSnapshot = snapshot;
  const quote = snapshot?.quote;
  if (quote?.price) {
    state.live = {
      price: quote.price,
      updatedAt: quote.providerTimestamp || quote.fetchedAt,
      providerId: quote.providerId,
      source: quote.source || quote.providerId,
      status: snapshot?.freshness?.state || quote.status || 'cached',
      isFresh: resolveGoldIsFresh(quote),
      isFallback: quote.isFallback ?? quote.forcedState === 'fallback',
      freshnessSeconds: quote.freshnessSeconds ?? null,
      sourceTimestamp: quote.providerTimestamp ?? null,
      raw: quote.providerRaw || quote,
      fetchedAt: quote.fetchedAt || null,
    };
    state.hasLiveFailure = quote.providerPathSuccessful === false;
    cache.saveGoldPrice(state.live.price, state.live.updatedAt);
    cache.checkDayOpenReset({ goldPriceUsdPerOz: state.live.price });
    const today = new Date().toISOString().slice(0, 10);
    const alreadySaved = (state.snapshots || []).some((s) => s.date === today);
    if (!alreadySaved) {
      state.snapshots = [
        ...(state.snapshots || []),
        { date: today, price: state.live.price, timestamp: Date.now() },
      ];
    }
  } else if (!state.live) {
    state.hasLiveFailure = true;
  }

  maybeTrackRealtimeSlo(snapshot, 'tracker');
  startCountdown();
  syncHeroReadout();
  if (typeof renderLiveTick === 'function' && el.xauUsdValue) {
    renderLiveTick();
  } else {
    renderAll?.();
  }
  renderTrackerAddonPanels();

  // Run alert engine check after every price update
  if (alertEngine && state.live?.price) {
    const aed24k = priceFor({ currency: 'AED', karat: '24', unit: 'gram' });
    alertEngine.check(state.live.price, aed24k);
  }
}

function initRealtimeEngine() {
  if (realtimeEngine) return;

  realtimeEngine = createRealtimePricingEngine({
    primaryProvider: createPrimaryQuoteProvider(),
    secondaryProvider: createSecondaryQuoteProvider(),
    config: REALTIME_POLLING_DEFAULTS,
    debug: isRealtimeDebugEnabled(),
  });

  const cacheBoot = cache.getFreshBootGoldPrice();
  if (cacheBoot) {
    realtimeEngine.seedFromCache({
      price: cacheBoot.price,
      updatedAt: cacheBoot.updatedAt,
      fetchedAt: cacheBoot.fetchedAt,
      providerId: 'cache',
      source: 'cache',
    });
  }

  realtimeEngine.subscribe((snapshot) => {
    applyRealtimeSnapshot(snapshot);
  });

  if (state.autoRefresh) realtimeEngine.start();
  document.addEventListener('visibilitychange', () => {
    realtimeEngine?.setVisibility(!document.hidden);
  });
}

async function refreshData(forceLive = true, includeWire = true) {
  const tasks = [];
  if (forceLive) tasks.push(fetchLive());
  tasks.push(ensureUnifiedHistory());
  if (includeWire) tasks.push(refreshWire());
  await Promise.all(tasks);
  // If advanced chart is loaded, give it the updated unified history
  try {
    if (window.__GOLD_CHART && typeof window.__GOLD_CHART.setDailyHistory === 'function') {
      window.__GOLD_CHART.setDailyHistory(state.history || []);
    }
  } catch (_e) {
    console.warn('[chart-hook] setDailyHistory failed', _e);
  }
  persistState(state);
  renderTrackerAddonPanels();
}

async function fetchLive() {
  const tasks = [];
  if (realtimeEngine) {
    tasks.push(realtimeEngine.refreshNow('manual-refresh'));
  }
  tasks.push(
    api.fetchGoldAndFX().then(({ gold, fx, errors }) => {
      if (fx?.rates) {
        state.rates = fx.rates;
        state.fxMeta = {
          lastUpdateUtc: fx.time_last_update_utc,
          nextUpdateUtc: new Date(fx.time_next_update_utc).getTime(),
        };
        cache.saveFXRates(state.rates, state.fxMeta);
      }
      if (!state.live?.price && gold?.price) {
        state.live = {
          price: gold.price,
          updatedAt: gold.updatedAt || new Date().toISOString(),
          raw: gold.raw || {},
        };
      }
      if (errors.gold || errors.fx) state.hasLiveFailure = true;
    })
  );
  try {
    await Promise.all(tasks);
  } catch (_e) {
    console.warn('[tracker] refreshData failed', _e);
    state.hasLiveFailure = true;
  }
  // When live price arrives, update advanced chart if it's loaded
  try {
    if (window.__GOLD_CHART && state.live && typeof window.__GOLD_CHART.addPoint === 'function') {
      window.__GOLD_CHART.addPoint(state.live.price, state.live.updatedAt || Date.now());
    }
  } catch (_e) {
    // non-fatal
  }
}

async function ensureUnifiedHistory() {
  const cachedDaily = Array.isArray(state.snapshots) ? state.snapshots : [];
  const { ensureRemoteHistory, getUnifiedHistory } = await import('../lib/historical-data.js');
  await ensureRemoteHistory();
  const unified = getUnifiedHistory(cachedDaily);
  state.history = unified
    .map((row) => ({
      date: new Date(row.date.length === 7 ? `${row.date}-01` : row.date),
      spot: Number(row.price),
      source: row.source,
      granularity: row.granularity,
    }))
    .filter((r) => r.spot > 0 && Number.isFinite(r.date.getTime()));
}

async function refreshWire() {
  const { items } = await fetchWire(state.wireItems || []);
  state.wireItems = items;
  renderWireModule(el, state);
}

// ── Alert Engine ──────────────────────────────────────────────────────────────

function initAlertEngine() {
  alertEngine = createAlertEngine({
    onTrigger: (alert, currentPrice) => {
      showTriggerDialog(alert, currentPrice);
      refreshAlertManager();
      updateAlertCountBadge();
    },
    onCountChange: (count) => {
      updateAlertCountBadge(count);
    },
    onLimitWarning: (count, max) => {
      showToast(trackerTx('toast.alertLimitWarning', { count, max }));
    },
  });

  // Render alert manager (mounts the drawer to body)
  renderAlertManager(document.body, alertEngine, state.lang);

  // Wire the "Open alerts panel" button to open the new manager
  const openBtn = document.getElementById('tp-open-alerts-inline');
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAlertManager();
    });
  }

  updateAlertCountBadge();
}

function updateAlertCountBadge(count) {
  const c = count ?? alertEngine?.getActiveCount() ?? 0;
  // Update any existing badge, or create one on the alerts tab/button
  let badge = document.querySelector('.alert-count-badge');
  if (!badge) {
    const alertTab = document.getElementById('tab-alerts');
    if (alertTab) {
      badge = document.createElement('span');
      badge.className = 'alert-count-badge';
      badge.setAttribute('aria-label', `${c} active alerts`);
      alertTab.appendChild(badge);
    }
  }
  if (badge) {
    badge.textContent = c > 0 ? String(c) : '';
    badge.setAttribute('data-count', String(c));
    badge.setAttribute('aria-label', `${c} active alert${c !== 1 ? 's' : ''}`);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  // Wait for DOM to be fully ready
  if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
    await new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));
  }

  Object.assign(el, ui());

  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  // Lazy-load render helpers and UI modules to reduce initial parse cost
  const [renderMod, uiMod, eventsMod, wireMod, adMod] = await Promise.all([
    import('../tracker/render.js'),
    import('../tracker/ui-shell.js'),
    import('../tracker/events.js'),
    import('../tracker/wire.js'),
    import('../components/adSlot.js'),
  ]);

  ({
    initRender,
    renderAll,
    renderLiveTick,
    renderChart,
    renderMarkets,
    renderComparisonWorkspace,
    renderAlerts,
    renderPresets,
    renderPlanners,
    renderArchive,
  } = renderMod);
  ({ mountShell } = uiMod);
  ({ initEvents, bindCoreEvents } = eventsMod);
  ({ fetchWire, renderWire: renderWireModule } = wireMod);
  ({ renderAdSlot } = adMod);

  // Init sub-modules with their dependencies
  initRender({ state, el, priceFor, currentSpot, showToast });
  initEvents({
    state,
    el,
    tx: trackerTx,
    refreshData,
    renderAll,
    renderMarkets,
    renderComparisonWorkspace,
    renderAlerts,
    renderPresets,
    renderPlanners,
    renderArchive,
    showToast,
    currentSpot,
    priceFor,
    startAutoRefresh,
    stopAutoRefresh,
    populateSelects,
    refreshWire,
    exportArchiveData,
    exportHistoryData,
    exportJsonData,
    exportChartData,
    exportWatchlistData,
    exportComparisonData,
    exportBriefData,
    updateServerAlertUiState,
    createServerAlert,
    syncAlertToAccount,
  });

  mountShell(
    state,
    el,
    /* onModeChange */ () => {
      populateSelects();
      renderAll();
      renderTrackerAddonPanels();
    },
    /* onLangChange */ () => {
      localizeStaticTrackerCopy();
      populateSelects();
      updateServerAlertUiState();
      renderAll();
      syncHeroReadout();
      renderTrackerAddonPanels();
    }
  );

  localizeStaticTrackerCopy();
  populateSelects();
  inlineCalc = initInlineCalc({
    goldPriceUsd: currentSpot(),
    rates: state.rates,
    lang: state.lang,
  });
  [
    'tracker-inline-calc-weight',
    'tracker-inline-calc-karat',
    'tracker-inline-calc-currency',
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', syncInlineCalcCalculatorLink);
    document.getElementById(id)?.addEventListener('change', syncInlineCalcCalculatorLink);
  });
  syncInlineCalcCalculatorLink();
  renderTrackerAddonPanels();
  initRealtimeEngine();
  initAlertEngine();
  serverAlertsAvailable = await probeServerAlertsAvailability();
  updateServerAlertUiState();
  bindCoreEvents();
  wireUnitSegmentedControl();
  bindControlShortcuts({
    state,
    el,
    currentSpot,
    priceFor,
    persistState: () => persistState(state),
    renderAll,
    tx: trackerTx,
  });
  initPageEnter('#tracker-app');
  await prefillServerAlertEmailFromAccount();
  el.createServerAlertLink?.addEventListener('click', (event) => {
    event.preventDefault();
    const alertsTab = document.getElementById('tab-alerts');
    alertsTab?.click();
    if (serverAlertsAvailable && el.alertDelivery) {
      el.alertDelivery.value = 'server';
      updateServerAlertUiState();
    }
    setTimeout(() => el.alertEmail?.focus(), ALERT_EMAIL_FOCUS_DELAY_MS);
  });
  el.openAlertsInline?.addEventListener('click', (event) => {
    event.preventDefault();
    const alertsTab = document.getElementById('tab-alerts');
    alertsTab?.click();
    if (serverAlertsAvailable && el.alertDelivery) {
      el.alertDelivery.value = 'server';
      updateServerAlertUiState();
    }
    setTimeout(() => el.alertEmail?.focus(), ALERT_EMAIL_FOCUS_DELAY_MS);
  });
  el.openExportsInline?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!document.body.classList.contains('tracker-workspace-advanced')) {
      el.workspaceToggle?.click();
    }
    document.getElementById('tab-exports')?.click();
  });
  el.shareInline?.addEventListener('click', (event) => {
    event.preventDefault();
    el.shareBtn?.click();
  });
  el.saveWatchlistAccount?.addEventListener('click', () => {
    saveWatchlistToAccount().catch(() => {
      showToast(trackerTx('toast.watchlistSaveFailed'));
    });
  });
  el.currency?.addEventListener('change', () => syncCurrentCountryPageLink());
  initMobileWorkspaceActions();

  if (localStorage.getItem('tracker_trust_banner_dismissed')) {
    const trustSection = document.querySelector('.tracker-data-trust-section');
    if (trustSection) trustSection.style.display = 'none';
  }

  const regionTabs = document.querySelectorAll('.tracker-region-pill[data-region]');
  regionTabs.forEach((btn) => {
    const isActive = btn.dataset.region === (state.activeRegion || 'gcc');
    btn.classList.toggle('is-active', isActive);
  });

  // Skip fetching the market wire during initial load to reduce critical path
  await refreshData(false, false);
  setChartLoading(true);
  renderAll();
  syncHeroReadout();
  renderTrackerAddonPanels();
  setChartLoading(false);
  syncCurrentCountryPageLink();
  if (state.autoRefresh) startAutoRefresh();
  startCountdown();

  // Analytics: fire page_view + tracker_view after first data load
  const locale = document.documentElement.lang || 'en';
  track(EVENTS.PAGE_VIEW, { path: location.pathname, locale });
  track(EVENTS.PRICE_VIEW, { path: location.pathname, locale, surface: 'tracker' });
  track(EVENTS.TRACKER_VIEW, {
    karat: state.selectedKarat,
    country: state.selectedCountry,
    currency: state.selectedCurrency,
  });

  // Render ads (ad slot renderer was lazy-loaded above)
  try {
    if (renderAdSlot) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => renderAdSlot('ad-bottom', 'rectangle'), { timeout: 5000 });
      } else {
        setTimeout(() => renderAdSlot('ad-bottom', 'rectangle'), 1500);
      }
    }
  } catch (_e) {
    console.warn('[ads] failed to render ad slot', _e);
  }

  // Install the chart loader non-blocking; loader itself will lazy-load the heavy chart
  try {
    import('./tracker-chart-loader.js')
      .then((m) => m.installChartLoader({ state, el }))
      .catch(() => {});
  } catch (_e) {
    // silent
  }

  // Mobile swipe for region tabs
  const marketBoard = document.getElementById('tp-market-board');
  if (marketBoard) {
    let touchStartX = 0;
    const REGIONS_ORDER = ['gcc', 'levant', 'africa', 'global'];

    marketBoard.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );
    marketBoard.addEventListener(
      'touchend',
      (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 50) return;
        const currentIdx = REGIONS_ORDER.indexOf(state.activeRegion || 'gcc');
        let nextIdx = dx < 0 ? currentIdx + 1 : currentIdx - 1;
        nextIdx = Math.max(0, Math.min(REGIONS_ORDER.length - 1, nextIdx));
        if (nextIdx !== currentIdx) {
          state.activeRegion = REGIONS_ORDER[nextIdx];
          document.querySelectorAll('.tracker-region-pill[data-region]').forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.region === state.activeRegion);
          });
          renderMarkets();
        }
      },
      { passive: true }
    );
  }

  // Redraw chart on resize so viewBox stays in sync with container dimensions
  let _resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      if (state.mode === 'live') renderChart();
    }, 150);
  });

  window.addEventListener(
    'pagehide',
    () => {
      realtimeEngine?.stop();
      realtimeEngine = null;
      alertEngine?.destroy();
      alertEngine = null;
    },
    { once: true }
  );
}

// Offline detection
function handleOnlineStatus() {
  const isOnline = navigator.onLine;
  let offlineBanner = document.getElementById('tp-offline-banner');
  if (!isOnline) {
    if (!offlineBanner) {
      offlineBanner = document.createElement('div');
      offlineBanner.id = 'tp-offline-banner';
      offlineBanner.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:9999;background:#dc2626;color:white;text-align:center;padding:0.5rem;font-size:0.875rem;font-weight:500;';
      const cached = state.live?.updatedAt
        ? new Date(state.live.updatedAt).toLocaleTimeString(
            state.lang === 'ar' ? 'ar-AE' : 'en-AE',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          )
        : trackerTx('offlineUnknown');
      offlineBanner.textContent = trackerTx('offlineBanner', { time: cached });
      document.body.prepend(offlineBanner);
    }
  } else {
    offlineBanner?.remove();
  }
}
window.addEventListener('online', handleOnlineStatus);
window.addEventListener('offline', handleOnlineStatus);

// ── Share / copy-URL buttons ──────────────────────────────────────────────
function initShareButtons() {
  function copyUrlToClipboard(btn) {
    const url = window.location.href;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        if (!btn) return;
        const orig = btn.textContent;
        btn.textContent = txGlobal('card.copied');
        setTimeout(() => {
          btn.textContent = orig;
        }, 2000);
      })
      .catch(() => {});
  }
  document
    .getElementById('tp-copy-url')
    ?.addEventListener('click', (e) => copyUrlToClipboard(e.currentTarget));
  document
    .getElementById('tp-share-btn')
    ?.addEventListener('click', (e) => copyUrlToClipboard(e.currentTarget));
}

// First-time onboarding is handled by the bilingual welcome chip strip
// (src/tracker/onboarding.js → localizeWelcomeStrip). The previous hardcoded-
// English modal overlay was removed in phase 16 (EN/AR parity — it had no
// translation keys and showed an all-English dialog to Arabic users).

init().catch((err) => {
  // Surface a boot failure instead of a silent unhandled rejection. The static
  // HTML still renders the last cached/skeleton state; this just logs the cause.
  console.error('[tracker] initialisation failed', err);
});
initShareButtons();
