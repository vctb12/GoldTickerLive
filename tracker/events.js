// tracker/events.js — all event bindings for tracker-pro
import { persistState } from './state.js';

let _state, _el, _cb;

export function initEvents({ state, el, ...callbacks }) {
  _state = state;
  _el = el;
  _cb = callbacks;
}

export function bindCoreEvents() {
  // Refresh button
  _el.refreshBtn?.addEventListener('click', async () => {
    _el.refreshBtn.disabled = true;
    _el.refreshBtn.textContent = 'Refreshing…';
    await _cb.refreshData(true);
    _cb.renderAll();
    _el.refreshBtn.disabled = false;
    _el.refreshBtn.textContent = 'Refresh live data';
  });

  // Reset view
  _el.resetBtn?.addEventListener('click', () => {
    _state.mode = 'live';
    _state.selectedCurrency = 'AED';
    _state.selectedKarat = '24';
    _state.selectedUnit = 'gram';
    _state.range = '30D';
    persistState(_state);
    _cb.renderAll();
  });

  // Share brief
  _el.shareBtn?.addEventListener('click', () => {
    const spot = _cb.currentSpot();
    const txt = spot
      ? `Gold: $${spot.toFixed(2)}/oz · UAE 24K: AED ${_cb.priceFor({ currency:'AED', karat:'24', unit:'gram', spot })?.toFixed(2)}/g · ${new Date().toUTCString()}`
      : 'Gold data unavailable';
    navigator.clipboard?.writeText(txt).then(() => {
      _cb.showToast('Brief copied to clipboard');
    }).catch(() => {
      _cb.showToast('Failed to copy to clipboard');
    });
  });

  // Toolbar selects
  _el.currency?.addEventListener('change', () => { _state.selectedCurrency = _el.currency.value; persistState(_state); _cb.renderAll(); });
  _el.karat?.addEventListener('change', () => { _state.selectedKarat = _el.karat.value; persistState(_state); _cb.renderAll(); });
  _el.unit?.addEventListener('change', () => { _state.selectedUnit = _el.unit.value; persistState(_state); _cb.renderAll(); });
  _el.language?.addEventListener('change', () => { _state.lang = _el.language.value; persistState(_state); _cb.renderAll(); });

  // Range pills
  _el.rangePills?.forEach(pill => {
    pill.addEventListener('click', () => {
      _el.rangePills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      _state.range = pill.dataset.range;
      persistState(_state);
      _cb.renderAll();
    });
  });

  // Auto-refresh toggle
  _el.autoRefresh?.addEventListener('click', () => {
    _state.autoRefresh = !_state.autoRefresh;
    _el.autoRefresh.textContent = `Auto refresh: ${_state.autoRefresh ? 'on' : 'off'}`;
    persistState(_state);
    if (_state.autoRefresh) _cb.startAutoRefresh();
    else _cb.stopAutoRefresh();
  });

  // Wire controls
  _el.wireRefresh?.addEventListener('click', async () => { await _cb.refreshWire(); });
  _el.wireToggle?.addEventListener('click', () => {
    const track = _el.wireTrack;
    if (!track) return;
    const paused = track.style.animationPlayState === 'paused';
    track.style.animationPlayState = paused ? 'running' : 'paused';
    _el.wireToggle.textContent = paused ? 'Pause' : 'Resume';
    _el.wireToggle.setAttribute('aria-pressed', String(!paused));
  });

  // Region tabs for compare board
  const regionTabs = document.querySelectorAll('.tracker-region-pill[data-region]');
  if (!_state.activeRegion) _state.activeRegion = 'gcc';
  regionTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      _state.activeRegion = btn.dataset.region;
      regionTabs.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      _cb.renderMarkets();
    });
  });

  // Alert save
  _el.saveAlert?.addEventListener('click', () => {
    const scope = _el.alertScope?.value || 'selected';
    const direction = _el.alertDirection?.value || 'above';
    const target = parseFloat(_el.alertTarget?.value);
    if (!Number.isFinite(target)) return;
    _state.alerts = [...(_state.alerts || []), { scope, direction, target }];
    persistState(_state);
    _cb.renderAlerts();
    _cb.showToast(`Alert ${direction} $${target} saved`);
    if (_el.alertTarget) _el.alertTarget.value = '';
  });

  // Notifications enable
  _el.enableNotifications?.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      if (_el.alertPermission) _el.alertPermission.textContent = 'Browser notifications not supported.';
      return;
    }
    const perm = await Notification.requestPermission();
    if (_el.alertPermission) _el.alertPermission.textContent = perm === 'granted' ? 'Notifications enabled.' : 'Notifications blocked.';
  });

  // Preset save
  _el.savePreset?.addEventListener('click', () => {
    const name = _el.presetName?.value?.trim();
    if (!name) return;
    _state.presets = [...(_state.presets || []), { name, currency: _state.selectedCurrency, karat: _state.selectedKarat, unit: _state.selectedUnit, range: _state.range }];
    persistState(_state);
    _cb.renderPresets();
    _cb.showToast(`Preset "${name}" saved`);
    if (_el.presetName) _el.presetName.value = '';
  });

  // Copy URL
  _el.copyUrl?.addEventListener('click', () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      _cb.showToast('Preset URL copied to clipboard');
    }).catch(() => {
      _cb.showToast('Failed to copy to clipboard');
    });
  });

  // Archive search
  _el.archiveSearch?.addEventListener('input', () => _cb.renderArchive());
  _el.archiveRange?.addEventListener('change', () => _cb.renderArchive());

  // Date lookup
  _el.runLookup?.addEventListener('click', () => {
    const dateStr = _el.lookupDate?.value;
    if (!dateStr || !_el.lookupResults) return;
    const targetDate = new Date(dateStr);
    let closest = null;
    let minDaysDiff = Infinity;
    _state.history.forEach(r => {
      const d = r.date instanceof Date ? r.date : new Date(r.date);
      const daysDiff = Math.abs((d.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < minDaysDiff) {
        minDaysDiff = daysDiff;
        closest = r;
      }
    });
    if (closest) {
      const aed24 = _cb.priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot: closest.spot });
      const lookupDateIso = closest.date instanceof Date ? closest.date.toISOString().slice(0, 10) : closest.date;
      const daysAway = Math.round(minDaysDiff);
      const daysNote = daysAway === 0 ? 'exact match' : `${daysAway} day${daysAway !== 1 ? 's' : ''} away`;
      _el.lookupResults.innerHTML = `
        <div class="tracker-result-grid">
          <div class="tracker-result-card"><div class="tracker-result-k">Found date</div><div class="tracker-result-v">${lookupDateIso}</div><div class="tracker-result-s">${daysNote}</div></div>
          <div class="tracker-result-card"><div class="tracker-result-k">XAU/USD</div><div class="tracker-result-v">$${closest.spot.toFixed(2)}</div><div class="tracker-result-s">per troy oz</div></div>
          <div class="tracker-result-card"><div class="tracker-result-k">UAE 24K/g</div><div class="tracker-result-v">${aed24 ? 'AED ' + aed24.toFixed(2) : '—'}</div><div class="tracker-result-s">AED peg 3.6725</div></div>
          <div class="tracker-result-card"><div class="tracker-result-k">Source</div><div class="tracker-result-v"><span class="tracker-source-badge tracker-source-badge--${closest.source}">${closest.source}</span></div><div class="tracker-result-s">${closest.granularity || 'daily'}</div></div>
        </div>`;
    } else {
      _el.lookupResults.innerHTML = '<p style="color:var(--tp-text-muted)">No data available for that date. Archive covers 2019–present.</p>';
    }
  });

  // Market filter
  _el.marketFilter?.addEventListener('input', () => _cb.renderMarkets());
  _el.marketSort?.addEventListener('change', () => _cb.renderMarkets());

  // Planner inputs
  [_el.budgetAmount, _el.budgetFee, _el.positionEntry, _el.positionQty, _el.accumMonthly, _el.accumTarget,
   _el.jewelryWeight, _el.jewelryKarat, _el.jewelryMaking, _el.jewelryPremium, _el.jewelryVat].forEach(inp => {
    inp?.addEventListener('input', () => _cb.renderPlanners());
    inp?.addEventListener('change', () => _cb.renderPlanners());
  });

  // Exports
  _el.exportArchive?.addEventListener('click', () => _cb.exportArchiveData());
  _el.exportArchive2?.addEventListener('click', () => _cb.exportArchiveData());
  _el.exportHistory?.addEventListener('click', () => _cb.exportHistoryData());
  _el.exportHistory2?.addEventListener('click', () => _cb.exportHistoryData());
  _el.downloadJson?.addEventListener('click', () => _cb.exportJsonData());
  _el.downloadJson2?.addEventListener('click', () => _cb.exportJsonData());
  // exportChart, exportChart2, exportCurrent, exportWatchlist, downloadBrief are disabled in HTML until implemented

  // Alert list: delete button delegation
  _el.alertList?.addEventListener('click', (e) => {
    const btn = e.target.closest('.tracker-remove-btn[data-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    _state.alerts = (_state.alerts || []).filter((_, i) => i !== idx);
    persistState(_state);
    _cb.renderAlerts();
  });

  // Preset list: delete + load button delegation
  _el.presetList?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx, 10);
    const preset = (_state.presets || [])[idx];
    if (!preset) return;
    if (btn.classList.contains('tracker-remove-btn')) {
      _state.presets = _state.presets.filter((_, i) => i !== idx);
      persistState(_state);
      _cb.renderPresets();
    } else if (btn.classList.contains('tracker-load-btn')) {
      _state.selectedCurrency = preset.currency;
      _state.selectedKarat = preset.karat;
      _state.selectedUnit = preset.unit;
      _state.range = preset.range;
      persistState(_state);
      _cb.populateSelects();
      _cb.renderAll();
    }
  });

  // Trust banner close
  const trustCloseBtn = document.querySelector('.tracker-trust-close');
  const trustSection = document.querySelector('.tracker-data-trust-section');
  if (trustCloseBtn && trustSection) {
    trustCloseBtn.addEventListener('click', () => {
      trustSection.style.display = 'none';
      localStorage.setItem('tracker_trust_banner_dismissed', 'true');
    });
  }

  // First-visit welcome strip
  const welcomeStrip = document.getElementById('tracker-welcome-strip');
  const welcomeClose = document.getElementById('tracker-welcome-close');
  if (welcomeStrip && welcomeClose) {
    if (!localStorage.getItem('tracker_first_visit')) {
      welcomeStrip.hidden = false;
    }
    welcomeClose.addEventListener('click', () => {
      welcomeStrip.hidden = true;
      localStorage.setItem('tracker_first_visit', 'seen');
    });
  }
}
