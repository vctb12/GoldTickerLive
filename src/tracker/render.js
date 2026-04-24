// tracker/render.js — all DOM render functions for tracker-pro
import { CONSTANTS, KARATS, COUNTRIES, TRANSLATIONS } from '../config/index.js';
import { persistState } from './state.js';
import { updateShellTickerFromState } from './ui-shell.js';
import { filterByRange } from '../lib/historical-data.js';
import { clear, el, setText, escape } from '../lib/safe-dom.js';
import { getLiveFreshness, getMarketStatus } from '../lib/live-status.js';

let _state, _el, _priceFor, _currentSpot, _showToast;
let _chartListenersAttached = false;
// Holds the latest chart rows so the chart mousemove handler (attached once)
// can always read the most-current data without re-registering on every render.
let _latestChartRows = [];
const TRACKER_BADGE_CLASSES = [
  'tracker-badge-live',
  'tracker-badge--cached',
  'tracker-badge--stale',
  'tracker-badge--unavailable',
];
const SOURCE_BADGE_CLASS = {
  live: 'tracker-source-badge--live',
  cached: 'tracker-source-badge--cached',
  stale: 'tracker-source-badge--estimated',
  unavailable: 'tracker-source-badge--unavailable',
};
const STATUS_BADGE_CLASS = {
  live: 'tracker-badge-live',
  cached: 'tracker-badge--cached',
  stale: 'tracker-badge--stale',
  unavailable: 'tracker-badge--unavailable',
};

export function initRender({ state, el, priceFor, currentSpot, showToast }) {
  _state = state;
  _el = el;
  _priceFor = priceFor;
  _currentSpot = currentSpot;
  _showToast = showToast;
}

function tx(key, params = {}) {
  const fullKey = `tracker.${key}`;
  const template = TRANSLATIONS[_state.lang]?.[fullKey] ?? TRANSLATIONS.en?.[fullKey] ?? fullKey;
  return Object.entries(params).reduce(
    (text, [token, value]) => text.replaceAll(`{${token}}`, String(value)),
    template
  );
}

function formatUsd(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  return `$${value.toLocaleString('en', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function formatUnitLabel(unit) {
  if (_state.lang !== 'ar') return unit;
  if (unit === 'gram') return 'غرام';
  if (unit === 'oz') return 'أوقية';
  return unit;
}

function getFreshnessModel() {
  const freshness = getLiveFreshness({
    updatedAt: _state.live?.updatedAt,
    lang: _state.lang,
    hasLiveFailure: _state.hasLiveFailure,
  });
  const sourceLabel = tx(`source.${freshness.key}`);
  const tooltip =
    freshness.key === 'unavailable'
      ? tx('liveUnavailable')
      : tx('summary.freshnessCopy', {
          source: sourceLabel,
          age: freshness.ageText,
          time: freshness.timeText,
        });

  return {
    ...freshness,
    sourceLabel,
    sourceBadgeClass: SOURCE_BADGE_CLASS[freshness.key] || SOURCE_BADGE_CLASS.cached,
    badgeClass: STATUS_BADGE_CLASS[freshness.key] || STATUS_BADGE_CLASS.cached,
    tooltip,
  };
}

function applyStatusBadge(node, freshness, text) {
  if (!node) return;
  node.classList.remove(...TRACKER_BADGE_CLASSES);
  node.classList.add(freshness.badgeClass);
  node.title = freshness.tooltip;
  node.setAttribute('aria-label', freshness.tooltip);
  if (typeof text === 'string') setText(node, text);
}

function buildSourceBadge(freshness) {
  return el(
    'span',
    {
      class: `tracker-source-badge ${freshness.sourceBadgeClass}`,
      title: freshness.tooltip,
      'aria-label': freshness.tooltip,
    },
    freshness.sourceLabel
  );
}

function buildHeroStatCard(label, value, sub) {
  return el('div', { class: 'tracker-hero-stat' }, [
    el('div', { class: 'tracker-hero-k' }, label),
    el('div', { class: 'tracker-hero-v' }, value),
    el('div', { class: 'tracker-hero-s' }, sub),
  ]);
}

function buildStackItem(title, copy, badge = null) {
  const headerChildren = [el('strong', null, title)];
  if (badge) headerChildren.push(badge);
  return el('div', { class: 'tracker-stack-item' }, [
    el('div', { class: 'tracker-stack-top' }, headerChildren),
    el('p', null, copy),
  ]);
}

export function renderHero() {
  const spot = _currentSpot();
  const freshness = getFreshnessModel();
  const liveBadge = document.getElementById('tp-live-badge');
  const summaryHeading = document.getElementById('tp-live-summary-heading');
  const isConnecting = !spot && !_state.hasLiveFailure;
  const summaryFreshness = isConnecting
    ? {
        ...freshness,
        key: 'live',
        sourceLabel: tx('source.live'),
        sourceBadgeClass: SOURCE_BADGE_CLASS.live,
        badgeClass: STATUS_BADGE_CLASS.live,
        tooltip: tx('connecting'),
      }
    : freshness;

  if (summaryHeading) setText(summaryHeading, tx('liveDeskTitle'));

  if (liveBadge) {
    liveBadge.classList.remove(...TRACKER_BADGE_CLASSES);
    liveBadge.classList.add(isConnecting ? 'tracker-badge-live' : freshness.badgeClass);
    const liveBadgeLabel = isConnecting ? tx('connecting') : freshness.tooltip;
    liveBadge.title = liveBadgeLabel;
    liveBadge.setAttribute('aria-label', liveBadgeLabel);
  }

  if (_el.liveBadgeText) {
    if (spot) {
      setText(
        _el.liveBadgeText,
        tx('refreshBadge', {
          source: freshness.sourceLabel,
          age: freshness.ageText,
        })
      );
    } else {
      setText(_el.liveBadgeText, _state.hasLiveFailure ? tx('liveUnavailable') : tx('connecting'));
    }
  }

  if (_el.xauUsdValue) setText(_el.xauUsdValue, spot ? formatUsd(spot) : '—');
  const xauBadge = document.getElementById('tp-xauusd-badge');
  if (xauBadge) {
    xauBadge.title = freshness.tooltip;
    xauBadge.setAttribute('aria-label', `XAU/USD · ${freshness.tooltip}`);
  }

  if (_el.marketBadge) {
    const market = getMarketStatus();
    setText(_el.marketBadge, market.isOpen ? tx('marketOpen') : tx('marketClosed'));
  }

  if (_el.refreshBadge) {
    const refreshText = spot
      ? tx('refreshBadgeDetailed', {
          age: freshness.ageText,
          time: freshness.timeText,
        })
      : _state.hasLiveFailure
        ? tx('liveUnavailable')
        : tx('connecting');
    if (isConnecting) {
      _el.refreshBadge.classList.remove(...TRACKER_BADGE_CLASSES);
      _el.refreshBadge.classList.add('tracker-badge-live');
      _el.refreshBadge.title = tx('connecting');
      _el.refreshBadge.setAttribute('aria-label', tx('connecting'));
      setText(_el.refreshBadge, refreshText);
    } else {
      applyStatusBadge(_el.refreshBadge, freshness, refreshText);
    }
  }

  if (_el.heroStats) {
    clear(_el.heroStats);
  }

  if (_el.heroStats && spot) {
    const aed24 = _priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot });
    const aed22 = _priceFor({ currency: 'AED', karat: '22', unit: 'gram', spot });
    const usd24g =
      (spot / CONSTANTS.TROY_OZ_GRAMS) * (KARATS.find((k) => k.code === '24')?.purity ?? 1);
    const stats = [
      buildHeroStatCard(
        'XAU/USD',
        formatUsd(spot),
        tx('heroStatSpotSub', { source: freshness.sourceLabel })
      ),
      buildHeroStatCard('UAE 24K', aed24 ? `AED ${aed24.toFixed(2)}` : '—', tx('heroStatGramSub')),
      buildHeroStatCard('UAE 22K', aed22 ? `AED ${aed22.toFixed(2)}` : '—', tx('heroStatGramSub')),
      buildHeroStatCard('USD/g 24K', usd24g ? formatUsd(usd24g, 3) : '—', tx('heroStatGramSub')),
    ];
    _el.heroStats.append(...stats);
  }

  if (_el.summaryList) {
    clear(_el.summaryList);

    const summaryItems = [
      buildStackItem(tx('summary.referenceTitle'), tx('summary.referenceCopy')),
      buildStackItem(
        tx('summary.freshnessTitle'),
        spot
          ? tx('summary.freshnessCopy', {
              source: summaryFreshness.sourceLabel,
              age: summaryFreshness.ageText,
              time: summaryFreshness.timeText,
            })
          : _state.hasLiveFailure
            ? tx('liveUnavailable')
            : tx('connecting'),
        buildSourceBadge(summaryFreshness)
      ),
      buildStackItem(tx('summary.aedPegTitle'), tx('summary.aedPegCopy')),
      buildStackItem(tx('summary.historyTitle'), tx('summary.historyCopy')),
    ];

    _el.summaryList.append(...summaryItems);
  }
}

export function renderMiniStrip() {
  if (!_el.miniStrip) return;
  const spot = _currentSpot();
  if (!spot) {
    _el.miniStrip.textContent = tx('waitingLive');
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

  // Keep the module-level snapshot up to date so the once-registered
  // mousemove handler always uses the latest rows without re-attaching.
  _latestChartRows = rows;

  if (_el.chartWrap && !_chartListenersAttached) {
    _chartListenersAttached = true;
    _el.chartWrap.addEventListener('mousemove', (e) => {
      if (!_el.tooltip || _latestChartRows.length < 2) return;
      const rect = _el.chart.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const idx = Math.round((x / rect.width) * (_latestChartRows.length - 1));
      const clampedIdx = Math.max(0, Math.min(idx, _latestChartRows.length - 1));
      const row = _latestChartRows[clampedIdx];
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
    const _stats = getHistoryStats(flatHistory);
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
  const freshness = getFreshnessModel();
  if (!spot) {
    clear(_el.marketBoard);
    _el.marketBoard.append(
      el(
        'p',
        {
          style: {
            padding: '1rem',
            color: 'var(--tp-text-muted)',
          },
        },
        tx('waitingLive')
      )
    );
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

  const fragment = document.createDocumentFragment();
  filtered.forEach((country) => {
    const cur = country.currency;
    const price = _priceFor({
      currency: cur,
      karat: _state.selectedKarat,
      unit: _state.selectedUnit,
      spot,
    });
    const isFav = (_state.favorites || []).includes(cur);
    const name = _state.lang === 'ar' ? country.nameAr || country.nameEn : country.nameEn;

    const button = el(
      'button',
      {
        type: 'button',
        class: `tracker-icon-btn${isFav ? ' is-favorite' : ''}`,
        dataset: { currency: cur },
        'aria-label': tx('favoriteToggle', { name }),
        'aria-pressed': isFav ? 'true' : 'false',
      },
      '★'
    );
    button.addEventListener('click', (event) => {
      event.preventDefault();
      if ((_state.favorites || []).includes(cur)) {
        _state.favorites = _state.favorites.filter((code) => code !== cur);
      } else {
        _state.favorites = [...(_state.favorites || []), cur];
      }
      persistState(_state);
      renderMarkets();
      renderWatchlist();
    });

    const card = el('div', { class: `tracker-market-card${isFav ? ' is-highlight' : ''}` }, [
      el('div', { class: 'tracker-market-top' }, [
        el('div', { class: 'tracker-market-title' }, [
          el('strong', null, `${country.flag ?? ''} ${name}`.trim()),
          el('span', null, cur),
        ]),
        el('div', { class: 'tracker-market-value' }, [
          el(
            'strong',
            null,
            price
              ? price.toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '—'
          ),
          el(
            'span',
            null,
            tx('marketMeta', {
              karat: _state.selectedKarat,
              unit: formatUnitLabel(_state.selectedUnit),
            })
          ),
        ]),
      ]),
      el('div', { class: 'tracker-market-bottom' }, [
        el('div', { class: 'tracker-market-meta' }, [
          buildSourceBadge(freshness),
          el(
            'span',
            { class: 'tracker-card-note' },
            `${tx('marketTrust')} · ${tx('marketFreshness', {
              source: freshness.sourceLabel,
              age: freshness.ageText,
            })}`
          ),
        ]),
        button,
      ]),
    ]);

    card.title = freshness.tooltip;
    fragment.append(card);
  });

  clear(_el.marketBoard);
  _el.marketBoard.append(fragment);

  if (_el.marketEmpty) _el.marketEmpty.hidden = filtered.length > 0;
}

export function renderWatchlist() {
  if (!_el.watchlistGrid) return;
  const spot = _currentSpot();
  const favs = _state.favorites || [];
  const freshness = getFreshnessModel();
  if (!favs.length) {
    clear(_el.watchlistGrid);
    _el.watchlistGrid.append(
      el(
        'p',
        {
          style: {
            color: 'var(--tp-text-muted)',
            fontSize: '0.85rem',
          },
        },
        tx('noFavorites')
      )
    );
    return;
  }
  if (!spot) {
    clear(_el.watchlistGrid);
    _el.watchlistGrid.append(
      el(
        'p',
        {
          style: {
            color: 'var(--tp-text-muted)',
            fontSize: '0.85rem',
          },
        },
        tx('waitingLive')
      )
    );
    return;
  }
  const fragment = document.createDocumentFragment();
  favs.forEach((cur) => {
    const country = COUNTRIES.find((item) => item.currency === cur);
    const price = _priceFor({
      currency: cur,
      karat: _state.selectedKarat,
      unit: _state.selectedUnit,
      spot,
    });
    const name = _state.lang === 'ar' ? country?.nameAr || country?.nameEn : country?.nameEn;
    const isCurrent = _state.selectedCurrency === cur;

    const card = el('div', { class: `tracker-watch-card${isCurrent ? ' is-highlight' : ''}` }, [
      el('div', { class: 'tracker-watch-top' }, [
        el('div', { class: 'tracker-watch-title' }, [
          el('strong', null, `${country?.flag ?? ''} ${name ?? cur}`.trim()),
          el('span', null, `${cur}${isCurrent ? ` · ${tx('selected')}` : ''}`),
        ]),
        el('div', { class: 'tracker-watch-value' }, [
          el(
            'strong',
            null,
            price
              ? price.toLocaleString('en', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '—'
          ),
          el(
            'span',
            null,
            tx('marketMeta', {
              karat: _state.selectedKarat,
              unit: formatUnitLabel(_state.selectedUnit),
            })
          ),
        ]),
      ]),
      el('div', { class: 'tracker-watch-meta' }, [
        buildSourceBadge(freshness),
        el(
          'span',
          { class: 'tracker-card-note' },
          `${tx('marketTrust')} · ${tx('marketFreshness', {
            source: freshness.sourceLabel,
            age: freshness.ageText,
          })}`
        ),
      ]),
    ]);

    card.title = freshness.tooltip;
    fragment.append(card);
  });

  clear(_el.watchlistGrid);
  _el.watchlistGrid.append(fragment);
}

export function renderDecisionCues() {
  if (!_el.decisionCues) return;
  const spot = _currentSpot();
  const freshness = getFreshnessModel();
  if (!spot) {
    _el.decisionCues.replaceChildren();
    return;
  }
  clear(_el.decisionCues);
  _el.decisionCues.append(
    el('div', { class: 'tracker-note-item' }, tx('liveSpotNote', { spot: spot.toFixed(2) })),
    el(
      'div',
      { class: 'tracker-note-item' },
      tx('dataSourceNote', { source: freshness.sourceLabel, age: freshness.ageText })
    ),
    el(
      'div',
      { class: 'tracker-note-item' },
      tx('historyNote', { count: _state.snapshots?.length || 0 })
    )
  );
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
          // escape p.name — it comes from a free-text input and is stored in
          // state/localStorage, so it must be sanitised before innerHTML insertion.
          const safeName = escape(p.name);
          const safeKarat = escape(p.karat);
          const safeCurrency = escape(p.currency);
          const safeUnit = escape(p.unit);
          const safeRange = escape(p.range);
          return `<div class="tracker-stack-item${isCurrent ? ' is-highlight' : ''}">
        <div style="flex:1">
          <div><strong>${safeName}</strong></div>
          <div style="font-size:0.8rem;color:var(--tp-text-muted);margin-top:0.25rem">
            ${safeKarat}K · ${safeCurrency}/${safeUnit} · ${safeRange} range
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

  renderSeasonal();
}

/**
 * Seasonal patterns — average spot USD/oz by calendar month across the full
 * history window. Highlights the monthly min/max months so users can see
 * typical seasonal skew at a glance. Uses baseline + session data.
 */
export function renderSeasonal() {
  if (!_el.seasonalResults) return;
  const history = Array.isArray(_state.history) ? _state.history : [];
  if (!history.length) {
    _el.seasonalResults.replaceChildren();
    return;
  }

  // Aggregate sum + count per month (0-indexed: Jan=0, Dec=11).
  const sums = new Array(12).fill(0);
  const counts = new Array(12).fill(0);
  for (const r of history) {
    const d = r.date instanceof Date ? r.date : new Date(r.date);
    if (!Number.isFinite(d.getTime())) continue;
    const v = Number(r.spot);
    if (!Number.isFinite(v) || v <= 0) continue;
    const m = d.getMonth();
    sums[m] += v;
    counts[m] += 1;
  }

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthly = [];
  for (let m = 0; m < 12; m++) {
    if (counts[m] > 0) monthly.push({ m, label: monthNames[m], avg: sums[m] / counts[m] });
  }

  if (!monthly.length) {
    _el.seasonalResults.replaceChildren();
    return;
  }

  const avgs = monthly.map((x) => x.avg);
  const minAvg = Math.min(...avgs);
  const maxAvg = Math.max(...avgs);
  const minMonth = monthly.find((x) => x.avg === minAvg);
  const maxMonth = monthly.find((x) => x.avg === maxAvg);
  const overall = avgs.reduce((a, b) => a + b, 0) / avgs.length;
  const range = maxAvg - minAvg;
  const pctSpread = (range / overall) * 100;

  const yearsSpan = (() => {
    const times = history
      .map((r) => (r.date instanceof Date ? r.date : new Date(r.date)).getTime())
      .filter(Number.isFinite);
    if (!times.length) return '';
    const years = (Math.max(...times) - Math.min(...times)) / (365.25 * 24 * 3600 * 1000);
    return years >= 1 ? ` over ${years.toFixed(1)} yrs` : '';
  })();

  // Build result cards: overall + each month with rel-to-average delta.
  const cards = [
    `<div class="tracker-result-card"><div class="tracker-result-k">Typical high month</div><div class="tracker-result-v">${maxMonth.label}</div><div class="tracker-result-s">$${maxAvg.toFixed(0)} avg spot</div></div>`,
    `<div class="tracker-result-card"><div class="tracker-result-k">Typical low month</div><div class="tracker-result-v">${minMonth.label}</div><div class="tracker-result-s">$${minAvg.toFixed(0)} avg spot</div></div>`,
    `<div class="tracker-result-card"><div class="tracker-result-k">Seasonal spread</div><div class="tracker-result-v">${pctSpread.toFixed(1)}%</div><div class="tracker-result-s">high vs low month${yearsSpan}</div></div>`,
  ];

  _el.seasonalResults.innerHTML = cards.join('');
}

export function renderBrief() {
  if (!_el.briefHeadline || !_el.briefCopy) return;
  const spot = _currentSpot();
  const freshness = getFreshnessModel();
  if (!spot) {
    _el.briefHeadline.textContent = tx('briefWaitingHeadline');
    _el.briefCopy.textContent = tx('briefWaitingBody');
    return;
  }
  const aed24 = _priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot });
  _el.briefHeadline.textContent = tx('briefHeadline', {
    spot: spot.toFixed(2),
    source: freshness.sourceLabel,
  });
  _el.briefCopy.textContent = tx('briefBody', {
    aed24: aed24 ? aed24.toFixed(2) : '—',
    karat: _state.selectedKarat,
    currency: _state.selectedCurrency,
    unit: formatUnitLabel(_state.selectedUnit),
  });
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
