// tracker/render.js — all DOM render functions for tracker-pro
import { CONSTANTS, KARATS, COUNTRIES } from '../config/index.js';
import { persistState } from './state.js';
import { updateShellTickerFromState } from './ui-shell.js';
import { filterByRange } from '../lib/historical-data.js';

let _state, _el, _priceFor, _currentSpot, _showToast;

export function initRender({ state, el, priceFor, currentSpot, showToast }) {
  _state = state;
  _el = el;
  _priceFor = priceFor;
  _currentSpot = currentSpot;
  _showToast = showToast;
}

export function renderHero() {
  const spot = _currentSpot();

  if (_el.liveBadgeText) {
    if (spot) {
      _el.liveBadgeText.textContent = _state.hasLiveFailure
        ? `Cached/Fallback · XAU/USD ${spot.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `Live · XAU/USD ${spot.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      _el.liveBadgeText.textContent = _state.hasLiveFailure
        ? 'Live feed unavailable — no cached data'
        : 'Connecting to API…';
    }
  }
  if (_el.marketBadge) {
    const now = new Date();
    const day = now.getUTCDay();
    const h = now.getUTCHours() * 60 + now.getUTCMinutes();
    const open = !(day === 6 || (day === 5 && h >= 21 * 60) || (day === 0 && h < 22 * 60));
    _el.marketBadge.textContent = open ? '● Market open' : '○ Market closed';
  }
  if (_el.heroStats && spot) {
    const aed24 = _priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot });
    const aed22 = _priceFor({ currency: 'AED', karat: '22', unit: 'gram', spot });
    const usd24g =
      (spot / CONSTANTS.TROY_OZ_GRAMS) * (KARATS.find((k) => k.code === '24')?.purity ?? 1);
    _el.heroStats.innerHTML = [
      {
        label: 'XAU/USD',
        value: `$${spot.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        sub: 'per troy oz · live',
      },
      { label: 'UAE 24K', value: aed24 ? `AED ${aed24.toFixed(2)}` : '—', sub: 'per gram' },
      { label: 'UAE 22K', value: aed22 ? `AED ${aed22.toFixed(2)}` : '—', sub: 'per gram' },
      { label: 'USD/g 24K', value: usd24g ? `$${usd24g.toFixed(3)}` : '—', sub: 'per gram' },
    ]
      .map(
        (item) => `<div class="tracker-hero-stat">
      <div class="tracker-hero-k">${item.label}</div>
      <div class="tracker-hero-v">${item.value}</div>
      <div class="tracker-hero-s">${item.sub}</div>
    </div>`
      )
      .join('');
  }
}

export function renderMiniStrip() {
  if (!_el.miniStrip) return;
  const spot = _currentSpot();
  if (!spot) {
    _el.miniStrip.textContent = 'Waiting for live data…';
    return;
  }
  const selected = _priceFor({
    currency: _state.selectedCurrency,
    karat: _state.selectedKarat,
    unit: _state.selectedUnit,
    spot,
  });
  _el.miniStrip.textContent = selected
    ? `${_state.selectedCurrency} ${_state.selectedKarat}K / ${_state.selectedUnit}: ${selected.toFixed(2)}`
    : '—';
}

export function renderChart() {
  if (!_el.chart) return;
  const spot = _currentSpot();
  if (!_state.history.length && !spot) {
    if (_el.chartEmpty) _el.chartEmpty.hidden = false;
    return;
  }
  if (_el.chartEmpty) _el.chartEmpty.hidden = true;
  const flatHistory = _state.history.map((r) => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
    price: r.spot,
    spot: r.spot,
    source: r.source,
    granularity: r.granularity,
  }));
  const filtered = filterByRange(flatHistory, _state.range);
  const rows = filtered.map((r) => ({ date: new Date(r.date), spot: r.spot, source: r.source }));
  if (spot) rows.push({ date: new Date(), spot, source: 'live' });
  if (rows.length < 2) {
    const msg = _state.lang === 'ar' ? 'جمع البيانات…' : 'Collecting data…';
    _el.chart.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#9d8c72" font-size="14">${msg}</text>`;
    return;
  }
  const prices = rows.map((r) => r.spot);
  const min = Math.min(...prices) * 0.998;
  const max = Math.max(...prices) * 1.002;
  const W = _el.chartWrap?.clientWidth || 1200;
  const H = _el.chartWrap?.clientHeight || 430;
  _el.chart.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const pts = rows
    .map((r, i) => {
      const x = (i / (rows.length - 1)) * W;
      const y = H - ((r.spot - min) / (max - min)) * (H - 40) - 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const sourceLabel = _state.hasLiveFailure ? 'cached' : 'live';
  _el.chart.innerHTML = `
    <polyline points="${pts}" fill="none" stroke="#c49a44" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <text x="8" y="18" fill="#9d8c72" font-size="11">High: ${max.toFixed(0)}</text>
    <text x="8" y="${H - 6}" fill="#9d8c72" font-size="11">Low: ${min.toFixed(0)}</text>
    <text x="${W - 8}" y="${H - 6}" text-anchor="end" fill="#9d8c72" font-size="11">Source: ${sourceLabel} · ${rows.length} points</text>
  `;

  if (_el.chartWrap) {
    _el.chartWrap.addEventListener('mousemove', (e) => {
      if (!_el.tooltip || rows.length < 2) return;
      const rect = _el.chart.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const idx = Math.round((x / rect.width) * (rows.length - 1));
      const clampedIdx = Math.max(0, Math.min(idx, rows.length - 1));
      const row = rows[clampedIdx];
      const tooltip = _el.tooltip;
      tooltip.innerHTML = `
        <strong>$${row.spot.toFixed(2)}</strong>
        <div>${row.date.toLocaleDateString()} · ${row.source}</div>
      `;
      tooltip.style.left = x + 'px';
      tooltip.style.top = '0px';
      tooltip.style.display = 'block';
    });
    _el.chartWrap.addEventListener('mouseleave', () => {
      if (_el.tooltip) _el.tooltip.style.display = 'none';
    });
  }

  if (_el.chartStats) {
    _el.chartStats.innerHTML = `
      <div class="tracker-stat-card"><div class="tracker-stat-k">Points shown</div><div class="tracker-stat-v">${rows.length}</div><div class="tracker-stat-s">${_state.range || 'ALL'}</div></div>
      <div class="tracker-stat-card"><div class="tracker-stat-k">Data source</div><div class="tracker-stat-v">${sourceLabel}</div><div class="tracker-stat-s">LBMA baseline 2019–Aug 2025 + session</div></div>
      <div class="tracker-stat-card"><div class="tracker-stat-k">Range high</div><div class="tracker-stat-v">$${Math.max(...rows.map((r) => r.spot)).toLocaleString('en', { maximumFractionDigits: 0 })}</div><div class="tracker-stat-s">within selected range</div></div>
      <div class="tracker-stat-card"><div class="tracker-stat-k">Range low</div><div class="tracker-stat-v">$${Math.min(...rows.map((r) => r.spot)).toLocaleString('en', { maximumFractionDigits: 0 })}</div><div class="tracker-stat-s">within selected range</div></div>
    `;
  }
}

export function renderKaratTable() {
  if (!_el.karatTable) return;
  const spot = _currentSpot();
  if (!spot) {
    _el.karatTable.innerHTML = '<tr><td colspan="4">Waiting for live data…</td></tr>';
    return;
  }
  const price24 = _priceFor({
    currency: _state.selectedCurrency,
    karat: '24',
    unit: _state.selectedUnit,
    spot,
  });
  _el.karatTable.innerHTML = KARATS.map((k) => {
    const p = _priceFor({
      currency: _state.selectedCurrency,
      karat: k.code,
      unit: _state.selectedUnit,
      spot,
    });
    const vs = price24 && p ? `${((p / price24) * 100).toFixed(1)}%` : '—';
    return `<tr>
      <td>${k.code}K</td>
      <td>${(k.purity * 100).toFixed(1)}%</td>
      <td>${p ? p.toFixed(2) : '—'} ${_state.selectedCurrency}</td>
      <td>${vs}</td>
    </tr>`;
  }).join('');
}

export function renderMarkets() {
  if (!_el.marketBoard) return;
  const spot = _currentSpot();
  if (!spot) {
    _el.marketBoard.innerHTML =
      '<p style="padding:1rem;color:var(--tp-text-muted)">Waiting for live data…</p>';
    return;
  }

  const activeRegion = _state.activeRegion || 'gcc';
  const regionMap = {
    gcc: ['AE', 'SA', 'KW', 'QA', 'BH', 'OM'],
    arab: [
      'AE',
      'SA',
      'KW',
      'QA',
      'BH',
      'OM',
      'EG',
      'JO',
      'LB',
      'SY',
      'YE',
      'MA',
      'TN',
      'DZ',
      'IQ',
    ],
    global: null,
  };
  const regionCodes = regionMap[activeRegion];

  let filtered = COUNTRIES.filter((c) => {
    if (regionCodes && !regionCodes.includes(c.code)) return false;
    if (_el.marketFilter?.value) {
      const q = _el.marketFilter.value.toLowerCase();
      if (!c.nameEn.toLowerCase().includes(q) && !c.currency.toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  const sortValue = _el.marketSort?.value || 'high';
  if (sortValue === 'high') {
    filtered.sort(
      (a, b) =>
        (_priceFor({
          currency: b.currency,
          karat: _state.selectedKarat,
          unit: _state.selectedUnit,
          spot,
        }) || 0) -
        (_priceFor({
          currency: a.currency,
          karat: _state.selectedKarat,
          unit: _state.selectedUnit,
          spot,
        }) || 0)
    );
  } else if (sortValue === 'low') {
    filtered.sort(
      (a, b) =>
        (_priceFor({
          currency: a.currency,
          karat: _state.selectedKarat,
          unit: _state.selectedUnit,
          spot,
        }) || 0) -
        (_priceFor({
          currency: b.currency,
          karat: _state.selectedKarat,
          unit: _state.selectedUnit,
          spot,
        }) || 0)
    );
  } else if (sortValue === 'alpha') {
    filtered.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  } else if (sortValue === 'favorites') {
    filtered.sort((a, b) => {
      const aFav = (_state.favorites || []).includes(a.currency) ? 1 : 0;
      const bFav = (_state.favorites || []).includes(b.currency) ? 1 : 0;
      return bFav - aFav;
    });
  }

  filtered = filtered.slice(0, 30);

  _el.marketBoard.innerHTML = filtered
    .map((c) => {
      const cur = c.currency;
      const p = _priceFor({
        currency: cur,
        karat: _state.selectedKarat,
        unit: _state.selectedUnit,
        spot,
      });
      const isFav = (_state.favorites || []).includes(cur);
      const name = _state.lang === 'ar' ? c.nameAr || c.nameEn : c.nameEn;
      return `<div class="tracker-market-card${isFav ? ' is-highlight' : ''}">
      <div class="tracker-market-top">
        <div class="tracker-market-title">
          <strong>${c.flag ?? ''} ${name}</strong>
          <span>${cur}</span>
        </div>
        <div class="tracker-market-value">
          <strong>${p ? p.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</strong>
          <span>${_state.selectedKarat}K / ${_state.selectedUnit}</span>
        </div>
      </div>
      <div class="tracker-market-bottom">
        <button type="button" class="tracker-icon-btn${isFav ? ' is-favorite' : ''}" data-currency="${cur}" aria-label="Toggle favorite" aria-pressed="${isFav ? 'true' : 'false'}">★</button>
      </div>
    </div>`;
    })
    .join('');

  _el.marketBoard?.querySelectorAll('.tracker-icon-btn[data-currency]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const cur = btn.dataset.currency;
      if ((_state.favorites || []).includes(cur)) {
        _state.favorites = _state.favorites.filter((c) => c !== cur);
      } else {
        _state.favorites = [...(_state.favorites || []), cur];
      }
      persistState(_state);
      renderMarkets();
      renderWatchlist();
    });
  });

  if (_el.marketEmpty) _el.marketEmpty.hidden = filtered.length > 0;
}

export function renderWatchlist() {
  if (!_el.watchlistGrid) return;
  const spot = _currentSpot();
  const favs = _state.favorites || [];
  if (!favs.length || !spot) {
    _el.watchlistGrid.innerHTML =
      '<p style="color:var(--tp-text-muted);font-size:0.85rem">No favorites set. Add currencies via the Compare tab. Your watchlist will appear here for quick reference.</p>';
    return;
  }
  _el.watchlistGrid.innerHTML = favs
    .map((cur) => {
      const country = COUNTRIES.find((c) => c.currency === cur);
      const p = _priceFor({
        currency: cur,
        karat: _state.selectedKarat,
        unit: _state.selectedUnit,
        spot,
      });
      const name = _state.lang === 'ar' ? country?.nameAr || country?.nameEn : country?.nameEn;
      const isCurrent = _state.selectedCurrency === cur;
      return `<div class="tracker-watch-card${isCurrent ? ' is-highlight' : ''}">
      <div class="tracker-watch-top">
        <div class="tracker-watch-title">
          <strong>${country?.flag ?? ''} ${name ?? cur}</strong>
          <span>${cur}${isCurrent ? ' · selected' : ''}</span>
        </div>
        <div class="tracker-watch-value">
          <strong>${p ? p.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</strong>
          <span>${_state.selectedKarat}K / ${_state.selectedUnit}</span>
        </div>
      </div>
    </div>`;
    })
    .join('');
}

export function renderDecisionCues() {
  if (!_el.decisionCues) return;
  const spot = _currentSpot();
  if (!spot) {
    _el.decisionCues.innerHTML = '';
    return;
  }
  const lines = [
    `Live spot: $${spot.toFixed(2)} / troy oz`,
    _state.hasLiveFailure
      ? '⚠ Data source: Cached/Fallback — using cache (API unreachable — live may return soon)'
      : '✓ Data source: live · last API fetch successful',
    `History coverage: 2019–Aug 2025 (LBMA baseline) + ${_state.snapshots?.length || 0} session snapshots`,
  ];
  _el.decisionCues.innerHTML = lines
    .map((l) => `<div class="tracker-note-item">${l}</div>`)
    .join('');
}

export function renderAlerts() {
  if (!_el.alertList) return;
  const alerts = _state.alerts || [];
  const spot = _currentSpot();
  _el.alertList.innerHTML = alerts.length
    ? alerts
        .map((a, i) => {
          const hit = spot && (a.direction === 'above' ? spot > a.target : spot < a.target);
          let proximity = '';
          let proximityClass = '';
          if (spot) {
            const distance = Math.abs(spot - a.target);
            const pct = (distance / a.target) * 100;
            if (pct < 1) {
              proximity = '⚡ very close';
              proximityClass = ' is-alert-imminent';
            } else if (pct < 3) {
              proximity = '● nearby';
              proximityClass = ' is-alert-close';
            }
          }
          return `<div class="tracker-stack-item${hit ? ' is-triggered' : ''}${proximityClass}">
          <div style="flex:1">
            <span>${a.scope} ${a.direction} <strong>$${a.target}</strong>${hit ? ' ✓ triggered' : ''}</span>
            ${proximity ? `<div style="font-size:0.8rem;color:var(--tp-text-muted);margin-top:0.25rem">${proximity}</div>` : ''}
          </div>
          <button data-idx="${i}" class="tracker-remove-btn" aria-label="Delete alert">×</button>
        </div>`;
        })
        .join('')
    : '<p style="color:var(--tp-text-muted);font-size:0.85rem">No alerts set.</p>';
}

export function renderPresets() {
  if (!_el.presetList) return;
  const presets = _state.presets || [];
  _el.presetList.innerHTML = presets.length
    ? presets
        .map((p, i) => {
          const isCurrent =
            _state.selectedCurrency === p.currency &&
            _state.selectedKarat === p.karat &&
            _state.selectedUnit === p.unit &&
            _state.range === p.range;
          return `<div class="tracker-stack-item${isCurrent ? ' is-highlight' : ''}">
        <div style="flex:1">
          <div><strong>${p.name}</strong></div>
          <div style="font-size:0.8rem;color:var(--tp-text-muted);margin-top:0.25rem">
            ${p.karat}K · ${p.currency}/${p.unit} · ${p.range} range
            ${isCurrent ? ' · <span style="color:var(--tp-accent)">● current</span>' : ''}
          </div>
        </div>
        <span>
          <button data-idx="${i}" class="tracker-load-btn tracker-pill">Load</button>
          <button data-idx="${i}" class="tracker-remove-btn" aria-label="Delete preset">×</button>
        </span>
      </div>`;
        })
        .join('')
    : '<p style="color:var(--tp-text-muted);font-size:0.85rem">No presets saved. Save the current view via the form above.</p>';
}

export function renderPlanners() {
  const spot = _currentSpot();
  if (!spot) return;

  if (_el.budgetResults) {
    const budget = parseFloat(_el.budgetAmount?.value) || 0;
    const fee = parseFloat(_el.budgetFee?.value) || 0;
    const net = budget / (1 + fee / 100);
    const p = _priceFor({
      currency: _state.selectedCurrency,
      karat: _state.selectedKarat,
      unit: 'gram',
      spot,
    });
    _el.budgetResults.innerHTML =
      p && net
        ? `<div class="tracker-result-item"><span>Net budget</span><strong>${net.toFixed(2)} ${_state.selectedCurrency}</strong></div>
         <div class="tracker-result-item"><span>Gold you can buy</span><strong>${(net / p).toFixed(3)} g (${_state.selectedKarat}K)</strong></div>`
        : '<p style="color:var(--tp-text-muted)">Enter a budget above.</p>';
  }

  if (_el.positionResults) {
    const entry = parseFloat(_el.positionEntry?.value) || 0;
    const qty = parseFloat(_el.positionQty?.value) || 0;
    const p = _priceFor({
      currency: _state.selectedCurrency,
      karat: _state.selectedKarat,
      unit: 'gram',
      spot,
    });
    if (entry && qty && p) {
      const entryValue = entry * qty;
      const currentValue = p * qty;
      const gainLoss = currentValue - entryValue;
      const gainLossPercent = (gainLoss / entryValue) * 100;
      _el.positionResults.innerHTML = `<div class="tracker-result-item"><span>Entry value</span><strong>${entryValue.toFixed(2)} ${_state.selectedCurrency}</strong></div>
        <div class="tracker-result-item"><span>Current value</span><strong>${currentValue.toFixed(2)} ${_state.selectedCurrency}</strong></div>
        <div class="tracker-result-item"><span>Gain / loss</span><strong style="color:${gainLoss >= 0 ? 'var(--tp-live)' : 'var(--tp-danger)'}">${gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ${_state.selectedCurrency} (${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(1)}%)</strong></div>`;
    } else {
      _el.positionResults.innerHTML =
        '<p style="color:var(--tp-text-muted)">Enter entry price and quantity above.</p>';
    }
  }

  if (_el.jewelryResults) {
    const weight = parseFloat(_el.jewelryWeight?.value) || 0;
    const karatCode = _el.jewelryKarat?.value || _state.selectedKarat;
    const making = parseFloat(_el.jewelryMaking?.value) || 0;
    const premium = parseFloat(_el.jewelryPremium?.value) || 0;
    const vat = _el.jewelryVat?.checked ? 0.05 : 0;
    const karat = KARATS.find((k) => k.code === karatCode);
    const p = _priceFor({
      currency: _state.selectedCurrency,
      karat: karatCode,
      unit: 'gram',
      spot,
    });
    if (weight && p && karat) {
      const goldValue = p * weight;
      const makingTotal = making * weight;
      const premiumTotal = (goldValue * premium) / 100;
      const subtotal = goldValue + makingTotal + premiumTotal;
      const vatAmount = subtotal * vat;
      const total = subtotal + vatAmount;
      _el.jewelryResults.innerHTML = `<div class="tracker-result-item"><span>Gold value</span><strong>${goldValue.toFixed(2)} ${_state.selectedCurrency}</strong></div>
        <div class="tracker-result-item"><span>Making charge</span><strong>${makingTotal.toFixed(2)} ${_state.selectedCurrency}</strong></div>
        ${premium ? `<div class="tracker-result-item"><span>Premium</span><strong>${premiumTotal.toFixed(2)} ${_state.selectedCurrency}</strong></div>` : ''}
        <div class="tracker-result-item"><span>Subtotal</span><strong>${subtotal.toFixed(2)} ${_state.selectedCurrency}</strong></div>
        ${vat ? `<div class="tracker-result-item"><span>VAT (5%)</span><strong>${vatAmount.toFixed(2)} ${_state.selectedCurrency}</strong></div>` : ''}
        <div class="tracker-result-item"><span>Total</span><strong style="color:var(--tp-accent)">${total.toFixed(2)} ${_state.selectedCurrency}</strong></div>`;
    } else {
      _el.jewelryResults.innerHTML =
        '<p style="color:var(--tp-text-muted)">Enter weight and select karat above.</p>';
    }
  }

  if (_el.accumResults) {
    const monthly = parseFloat(_el.accumMonthly?.value) || 0;
    const target = parseFloat(_el.accumTarget?.value) || 0;
    const p = _priceFor({
      currency: _state.selectedCurrency,
      karat: _state.selectedKarat,
      unit: 'gram',
      spot,
    });
    if (p && monthly && target) {
      const gramsPerMonth = monthly / p;
      const months = target / gramsPerMonth;
      const years = months / 12;
      _el.accumResults.innerHTML = `<div class="tracker-result-item"><span>Grams / month</span><strong>${gramsPerMonth.toFixed(3)} g</strong></div>
        <div class="tracker-result-item"><span>Months to target</span><strong>${months.toFixed(1)}</strong></div>
        <div class="tracker-result-item"><span>Years to target</span><strong>${years.toFixed(2)}</strong></div>`;
    } else {
      _el.accumResults.innerHTML =
        '<p style="color:var(--tp-text-muted)">Enter monthly contribution and target quantity above.</p>';
    }
  }
}

export function renderArchive() {
  if (!_el.archiveBody) return;
  let rows = _state.history.slice().reverse();

  const range = _el.archiveRange?.value || 'ALL';
  if (range !== 'ALL') {
    const daysBack = { '30D': 30, '90D': 90, '1Y': 365, '3Y': 1095, '5Y': 1825 }[range] || 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    rows = rows.filter((r) => {
      const d = r.date instanceof Date ? r.date : new Date(r.date);
      return d >= cutoff;
    });
  }

  const query = _el.archiveSearch?.value?.toLowerCase() || '';
  if (query) {
    rows = rows.filter((r) => {
      const dateStr = r.date instanceof Date ? r.date.toISOString() : String(r.date);
      return dateStr.includes(query) || r.source.toLowerCase().includes(query);
    });
  }

  rows = rows.slice(0, 200);

  if (!rows.length) {
    _el.archiveBody.innerHTML = '<tr><td colspan="5">No records match filters.</td></tr>';
    if (_el.archiveMeta) _el.archiveMeta.textContent = '';
    return;
  }
  _el.archiveBody.innerHTML = rows
    .map((r) => {
      const aed24 = _priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot: r.spot });
      const selected = _priceFor({
        currency: _state.selectedCurrency,
        karat: _state.selectedKarat,
        unit: _state.selectedUnit,
        spot: r.spot,
      });
      return `<tr>
      <td>${r.date instanceof Date ? r.date.toISOString().slice(0, 10) : r.date}</td>
      <td>$${r.spot.toFixed(2)}</td>
      <td>${selected ? selected.toFixed(2) : '—'}</td>
      <td>${aed24 ? aed24.toFixed(2) : '—'}</td>
      <td><span class="tracker-source-badge tracker-source-badge--${r.source}">${r.source}${r.granularity ? ' · ' + r.granularity : ''}</span></td>
    </tr>`;
    })
    .join('');
  if (_el.archiveMeta) {
    const sourceInfo = _state.history.some(
      (r) => r.source === 'live' || r.source === 'session-cache'
    )
      ? 'session + baseline'
      : 'baseline';
    _el.archiveMeta.textContent = `${rows.length}/${_state.history.length} records · ${sourceInfo} · 2019–present · filter by date or source`;
  }
}

export function renderBrief() {
  if (!_el.briefHeadline || !_el.briefCopy) return;
  const spot = _currentSpot();
  if (!spot) {
    _el.briefHeadline.textContent = 'Waiting for live data';
    _el.briefCopy.textContent =
      'Gold price data is loading. If this persists, the API may be temporarily unavailable — last cached price will be shown when available.';
    return;
  }
  const aed24 = _priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot });
  const src = _state.hasLiveFailure ? 'cached (API unavailable)' : 'live';
  _el.briefHeadline.textContent = `Gold at $${spot.toFixed(2)} / troy oz — ${src}`;
  _el.briefCopy.textContent =
    `UAE 24K: AED ${aed24 ? aed24.toFixed(2) : '—'}/g. ` +
    `Selected view: ${_state.selectedKarat}K in ${_state.selectedCurrency} per ${_state.selectedUnit}. ` +
    'FX source: open.er-api.com (AED uses fixed peg 3.6725). ' +
    'History: LBMA monthly baseline 2019–Aug 2025 + session snapshots.';
}

export function renderAll() {
  document.title =
    _state.lang === 'ar'
      ? 'متتبع الذهب برو — مساحة العمل المباشرة'
      : 'Gold Tracker Pro — Live Price Workspace';

  renderHero();

  if (_state.mode === 'live') {
    renderMiniStrip();
    renderChart();
    renderKaratTable();
    renderMarkets();
    renderWatchlist();
    renderDecisionCues();
  } else if (_state.mode === 'compare') {
    renderMarkets();
  } else if (_state.mode === 'archive') {
    renderArchive();
  }

  // Always render overlay content so it's fresh when opened
  renderAlerts();
  renderPresets();
  renderPlanners();

  renderBrief();

  const spot = _currentSpot();
  updateShellTickerFromState(_state, spot, _priceFor);
}
