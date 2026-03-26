import * as api from './api.js';
import * as cache from './cache.js';

let _debugPanel = null;
let _stateRef = null;
let _refreshFn = null;

export function initDebugPanel(STATE, onRefresh) {
  _stateRef = STATE;
  _refreshFn = onRefresh;

  _debugPanel = document.getElementById('debug-panel');
  if (!_debugPanel) return;

  _debugPanel.style.display = 'block';
  _debugPanel.innerHTML = buildPanel();

  _debugPanel.querySelector('#dbg-gold-fail')?.addEventListener('click', () => {
    api.setSimulateGoldFail(!api._simulateGoldFail);
    updateButtonState();
  });

  _debugPanel.querySelector('#dbg-fx-fail')?.addEventListener('click', () => {
    api.setSimulateFxFail(!api._simulateFxFail);
    updateButtonState();
  });

  _debugPanel.querySelector('#dbg-clear-cache')?.addEventListener('click', () => {
    cache.clearAllCache();
    alert('Cache cleared. Reload the page.');
  });

  _debugPanel.querySelector('#dbg-close')?.addEventListener('click', () => {
    _debugPanel.style.display = 'none';
  });

  // Live STATE inspector — update every 2s
  setInterval(updateStateView, 2000);
}

function buildPanel() {
  return `
    <div class="debug-inner">
      <div class="debug-header">
        <strong>🛠 Debug Panel</strong>
        <button id="dbg-close">✕</button>
      </div>
      <div class="debug-buttons">
        <button id="dbg-gold-fail" class="dbg-btn">Simulate Gold Fail</button>
        <button id="dbg-fx-fail" class="dbg-btn">Simulate FX Fail</button>
        <button id="dbg-clear-cache" class="dbg-btn dbg-danger">Clear Cache</button>
      </div>
      <details class="debug-state">
        <summary>Current STATE (updates every 2s)</summary>
        <pre id="dbg-state-pre"></pre>
      </details>
    </div>`;
}

function updateButtonState() {
  const goldBtn = _debugPanel?.querySelector('#dbg-gold-fail');
  const fxBtn = _debugPanel?.querySelector('#dbg-fx-fail');
  if (goldBtn) goldBtn.textContent = api._simulateGoldFail ? '✓ Gold Fail ON' : 'Simulate Gold Fail';
  if (fxBtn) fxBtn.textContent = api._simulateFxFail ? '✓ FX Fail ON' : 'Simulate FX Fail';
}

function updateStateView() {
  const pre = document.getElementById('dbg-state-pre');
  if (!pre || !_stateRef) return;
  const snapshot = {
    lang: _stateRef.lang,
    goldPriceUsdPerOz: _stateRef.goldPriceUsdPerOz,
    goldStale: _stateRef.status.goldStale,
    fxStale: _stateRef.status.fxStale,
    isOnline: _stateRef.isOnline,
    ratesLoaded: Object.keys(_stateRef.rates).length,
    cacheHealthScore: _stateRef.cacheHealthScore,
    selectedKarat: _stateRef.selectedKaratCountries,
    activeTab: _stateRef.activeTab,
  };
  pre.textContent = JSON.stringify(snapshot, null, 2);
}
