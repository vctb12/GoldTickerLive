// tracker/render.js — orchestrates DOM render functions for tracker-pro
import { _currentSpot, _priceFor, _setCtx, _state } from './_ctx.js';
import { updateShellTickerFromState } from './ui-shell.js';
import { renderChart } from './chart.js';
import { renderHero, renderKaratTable, renderMiniStrip } from './hero.js';
import { renderAlerts, renderAlertsSummary } from './alerts.js';
import { renderWatchlist } from './watchlist.js';
import { renderComparisonWorkspace } from './compare.js';
import { applyExportReadiness } from './export.js';
import { renderMarkets } from './markets.js';
import { renderBrief, renderDecisionCues } from './decision.js';
import { renderArchive } from './archive.js';
import { renderPlanners, renderPresets } from './planner.js';
import { localizeTrustBanner, localizeWelcomeStrip } from './onboarding.js';

export { applyExportReadiness, getExportReadinessState } from './export.js';
export { getFreshnessModel, applyStatusBadge, buildSourceBadge } from './freshness.js';
export { getSelectedRangeLabel, getVisibleHistoryRows, renderChart } from './chart.js';
export { renderHero, renderKaratTable, renderMiniStrip } from './hero.js';
export { renderAlerts, renderAlertsSummary } from './alerts.js';
export { renderWatchlist } from './watchlist.js';
export { renderComparisonWorkspace } from './compare.js';
export { renderMarkets } from './markets.js';
export { renderBrief, renderDecisionCues } from './decision.js';
export { renderArchive, renderSeasonal } from './archive.js';
export { renderPlanners, renderPresets } from './planner.js';

export function initRender({ state, el, priceFor, currentSpot, showToast }) {
  _setCtx({ state, el, priceFor, currentSpot, showToast });
}

export function renderAll() {
  const spotForTitle = _state.goldPriceUsdPerOz;
  if (spotForTitle) {
    const priceStr = Math.round(spotForTitle).toLocaleString();
    document.title =
      _state.lang === 'ar'
        ? `${priceStr}$ XAU/USD | متتبع الذهب`
        : `$${priceStr} XAU/USD | Gold Ticker Live`;
  } else {
    document.title =
      _state.lang === 'ar'
        ? 'متتبع الذهب — أسعار مباشرة'
        : 'Gold Tracker — Live Prices | Gold Ticker Live';
  }

  renderHero();

  if (_state.mode === 'live') {
    renderMiniStrip();
    renderChart();
    renderKaratTable();
    renderMarkets();
    renderComparisonWorkspace();
    renderWatchlist();
    renderDecisionCues();
    renderAlertsSummary();
  } else if (_state.mode === 'compare') {
    renderComparisonWorkspace();
    renderMarkets();
  } else if (_state.mode === 'archive') {
    renderArchive();
  }

  renderAlerts();
  renderPresets();
  renderPlanners();

  renderBrief();
  applyExportReadiness();

  localizeWelcomeStrip();
  localizeTrustBanner();

  const spot = _currentSpot();
  updateShellTickerFromState(_state, spot, _priceFor);
}
