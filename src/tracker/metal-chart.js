import { getMetal, metalKeys, PRIMARY_METAL } from '../config/metals.js';
import { isMetalsPilotEnabled } from '../config/metals-flags.js';
import { assessMetalFreshness } from '../lib/metal-freshness.js';
import { normalizeMetalSelection, reconcileGradeForMetal } from '../lib/metal-selector-state.js';
import { GoldApiComMetalQuoteProvider } from '../lib/quote-providers/gold-api-com-metal-provider.js';
import { getMarketStatus } from '../lib/live-status.js';
import { getTrackerMetalQuote } from './metal-chart-state.js';

export { getActiveTrackerMetal, getTrackerMetalQuote } from './metal-chart-state.js';

function localizedMetalName(metal, lang) {
  return lang === 'ar' ? metal.nameAr : metal.nameEn;
}

function localizedPurityName(purity, lang) {
  return lang === 'ar' ? purity.labelAr : purity.labelEn;
}

function setStatus(root, key, text) {
  root.dataset.state = key;
  root.textContent = text;
}

function revealMetalTab(button) {
  if (!button || typeof button.scrollIntoView !== 'function') return;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  button.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'nearest',
    inline: 'nearest',
  });
}

export function initMetalChartWorkspace({
  state,
  renderChart,
  persistState,
  syncUrlFromState,
  tx,
  currentSpot,
  showToast,
} = {}) {
  const root = document.getElementById('tp-metal-chart-workspace');
  if (!root || !isMetalsPilotEnabled()) {
    if (root) root.hidden = true;
    return { enabled: false, sync() {} };
  }

  root.hidden = false;
  const tabs = root.querySelector('#tp-metal-tabs');
  const puritySelect = root.querySelector('#tp-metal-purity');
  const value = root.querySelector('#tp-metal-value');
  const valueLabel = root.querySelector('#tp-metal-value-label');
  const coverage = root.querySelector('#tp-metal-coverage');
  const source = root.querySelector('#tp-metal-source');
  const freshness = root.querySelector('#tp-metal-freshness');
  const timestamp = root.querySelector('#tp-metal-timestamp');
  const miniStrip = document.getElementById('tp-mini-strip');
  let requestId = 0;

  function selection() {
    return normalizeMetalSelection({
      metal: state.selectedMetal,
      grade: state.selectedMetalPurity,
    });
  }

  function renderPurities() {
    if (!puritySelect) return;
    const selected = selection();
    const metal = getMetal(selected.metal);
    const options = metal.purities.map((purity) => {
      const option = document.createElement('option');
      option.value = purity.code;
      option.textContent = localizedPurityName(purity, state.lang);
      option.selected = purity.code === selected.grade;
      return option;
    });
    puritySelect.replaceChildren(...options);
    puritySelect.setAttribute(
      'aria-label',
      selected.metal === PRIMARY_METAL
        ? tx('metalChart.karatLabel')
        : tx('metalChart.finenessLabel')
    );
  }

  function renderTabs() {
    if (!tabs) return;
    const selected = selection();
    const buttons = metalKeys().map((metalKey) => {
      const metal = getMetal(metalKey);
      const button = document.createElement('button');
      const active = selected.metal === metalKey;
      button.type = 'button';
      button.className = `tracker-metal-tab${active ? ' is-active' : ''}`;
      button.dataset.metal = metalKey;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', active ? 'true' : 'false');
      button.tabIndex = active ? 0 : -1;
      button.textContent = localizedMetalName(metal, state.lang);
      return button;
    });
    tabs.replaceChildren(...buttons);
  }

  function renderReadout() {
    const selected = selection();
    const metal = getMetal(selected.metal);
    const quote = getTrackerMetalQuote(state, currentSpot);
    if (valueLabel)
      valueLabel.textContent = `${localizedMetalName(metal, state.lang)} · ${metal.symbol}/USD`;
    if (value) {
      value.textContent = quote?.price
        ? `$${Number(quote.price).toLocaleString(state.lang === 'ar' ? 'ar-AE' : 'en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : '—';
    }

    if (selected.metal === PRIMARY_METAL) {
      if (coverage) coverage.textContent = tx('metalChart.goldCoverage');
    } else if (coverage) {
      coverage.textContent = tx('metalChart.currentOnly');
    }
    if (source) {
      source.textContent = tx('metalChart.source', {
        source: quote?.source || quote?.providerId || tx('source.unavailable'),
      });
    }
    if (freshness) {
      const freshnessKey = quote?.freshnessState || 'unavailable';
      setStatus(
        freshness,
        freshnessKey,
        tx('metalChart.freshness', { state: tx(`source.${freshnessKey}`) })
      );
    }
    if (timestamp) {
      const rawTimestamp = quote?.providerTimestamp;
      const date = rawTimestamp ? new Date(rawTimestamp) : null;
      timestamp.textContent = tx('metalChart.timestamp', {
        timestamp:
          date && Number.isFinite(date.getTime())
            ? date.toLocaleString(state.lang === 'ar' ? 'ar-AE' : 'en-AE')
            : tx('source.unavailable'),
      });
    }
    root
      .querySelector('.tracker-metal-readout')
      ?.setAttribute('dir', state.lang === 'ar' ? 'rtl' : 'ltr');
  }

  function syncChartSurface() {
    const isGold = selection().metal === PRIMARY_METAL;
    const advanced = document.getElementById('tp-chart-container');
    const fallback = document.getElementById('tp-chart');
    if (!isGold) {
      if (advanced) advanced.style.display = 'none';
      if (fallback) fallback.style.display = '';
      return;
    }
    if (advanced && window.__GOLD_CHART) {
      advanced.style.display = '';
      if (fallback) fallback.style.display = 'none';
    } else if (fallback) {
      fallback.style.display = '';
    }
  }

  function sync({ redrawChart = false, revealSelected = false } = {}) {
    renderTabs();
    renderPurities();
    renderReadout();
    syncChartSurface();
    if (miniStrip) miniStrip.hidden = selection().metal !== PRIMARY_METAL;
    if (revealSelected) {
      revealMetalTab(tabs?.querySelector('[aria-selected="true"]'));
    }
    if (redrawChart) renderChart?.();
  }

  async function fetchSelectedMetal() {
    const selected = selection();
    if (selected.metal === PRIMARY_METAL) return;
    const selectedRequest = ++requestId;
    setStatus(freshness, 'loading', tx('metalChart.loading'));
    try {
      const quote = await new GoldApiComMetalQuoteProvider({
        metalKey: selected.metal,
      }).fetchQuote();
      if (selectedRequest !== requestId || selected.metal !== state.selectedMetal) return;
      const observedAtMs = Date.now();
      const market = getMarketStatus(new Date(observedAtMs));
      const assessed = assessMetalFreshness({
        updatedAt: quote.providerTimestamp,
        observedAtMs,
        marketOpen: market.isOpen,
      });
      state.metalQuotes[selected.metal] = {
        ...quote,
        freshnessState: market.isOpen ? assessed.state : 'closed',
        verified: quote.providerPathSuccessful === true,
        derived: false,
      };
      persistState?.();
      sync({ redrawChart: true });
    } catch (_error) {
      if (selectedRequest !== requestId) return;
      delete state.metalQuotes[selected.metal];
      setStatus(freshness, 'unavailable', tx('metalChart.unavailable'));
      renderReadout();
      renderChart?.();
      showToast?.(tx('metalChart.unavailable'));
    }
  }

  tabs?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-metal]');
    if (!button || !tabs.contains(button)) return;
    const metal = button.dataset.metal;
    state.selectedMetal = metal;
    state.selectedMetalPurity = reconcileGradeForMetal(metal, state.selectedMetalPurity);
    state.historyMonth = '';
    persistState?.();
    syncUrlFromState?.();
    sync({ redrawChart: true, revealSelected: true });
    fetchSelectedMetal();
    if (metal === PRIMARY_METAL) window.__installGoldChartNow?.();
  });

  tabs?.addEventListener('focusin', (event) => {
    const button = event.target.closest('[data-metal]');
    if (!button || !tabs.contains(button)) return;
    revealMetalTab(button);
  });

  tabs?.addEventListener('keydown', (event) => {
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[next].focus();
    buttons[next].click();
  });

  puritySelect?.addEventListener('change', () => {
    state.selectedMetalPurity = normalizeMetalSelection({
      metal: state.selectedMetal,
      grade: puritySelect.value,
    }).grade;
    if (state.selectedMetal === PRIMARY_METAL) state.selectedKarat = state.selectedMetalPurity;
    persistState?.();
    syncUrlFromState?.();
    sync({ redrawChart: true });
  });

  sync({ revealSelected: selection().metal !== PRIMARY_METAL });
  if (selection().metal !== PRIMARY_METAL && !state.metalQuotes[selection().metal]) {
    fetchSelectedMetal();
  }
  return { enabled: true, sync, refreshSelected: fetchSelectedMetal };
}
