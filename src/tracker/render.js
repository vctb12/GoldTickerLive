// tracker/render.js — all DOM render functions for tracker-pro
import { CONSTANTS, KARATS, COUNTRIES, TRANSLATIONS } from '../config/index.js';
import { persistState } from './state.js';
import { updateShellTickerFromState } from './ui-shell.js';
import { filterByRange } from '../lib/historical-data.js';
import { clear, el, setText, escape } from '../lib/safe-dom.js';
import { getLiveFreshness, getMarketStatus } from '../lib/live-status.js';
import { pulseFreshness } from '../lib/freshness-pulse.js';
import { countUp } from '../lib/count-up.js';

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

function buildStatCard(label, value, sub) {
  return el('div', { class: 'tracker-stat-card' }, [
    el('div', { class: 'tracker-stat-k' }, label),
    el('div', { class: 'tracker-stat-v' }, value),
    el('div', { class: 'tracker-stat-s' }, sub),
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

  if (_el.xauUsdValue) {
    if (spot) {
      countUp(_el.xauUsdValue, spot, { decimals: 2, format: (n) => formatUsd(n) });
      pulseFreshness(_el.xauUsdValue);
    } else {
      setText(_el.xauUsdValue, '—');
    }
  }
  const xauBadge = document.getElementById('tp-xauusd-badge');
  if (xauBadge) {
    xauBadge.title = freshness.tooltip;
    xauBadge.setAttribute('aria-label', `XAU/USD · ${freshness.tooltip}`);
  }

  if (_el.marketBadge) {
    const market = getMarketStatus();
    const marketText = market.isOpen ? tx('marketOpen') : tx('marketClosed');
    setText(_el.marketBadge, marketText);
    // Provide a clean aria-label without decorative bullet/circle for screen readers
    _el.marketBadge.setAttribute(
      'aria-label',
      market.isOpen ? tx('marketOpenAriaLabel') : tx('marketClosedAriaLabel')
    );
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
    _el.heroStats.removeAttribute('aria-busy');
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
    const svgNs = 'http://www.w3.org/2000/svg';
    const t = document.createElementNS(svgNs, 'text');
    t.setAttribute('x', '50%');
    t.setAttribute('y', '50%');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('fill', '#9d8c72');
    t.setAttribute('font-size', '14');
    t.textContent = msg;
    _el.chart.replaceChildren(t);
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
  const svgNs = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, textContent) {
    const node = document.createElementNS(svgNs, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (textContent !== undefined) node.textContent = textContent;
    return node;
  }
  const frag = document.createDocumentFragment();
  frag.append(
    svgEl('polyline', {
      points: pts,
      fill: 'none',
      stroke: '#c49a44',
      'stroke-width': '2.5',
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    }),
    svgEl(
      'text',
      { x: '8', y: '18', fill: '#9d8c72', 'font-size': '11' },
      `High: ${max.toFixed(0)}`
    ),
    svgEl(
      'text',
      { x: '8', y: String(H - 6), fill: '#9d8c72', 'font-size': '11' },
      `Low: ${min.toFixed(0)}`
    ),
    svgEl(
      'text',
      {
        x: String(W - 8),
        y: String(H - 6),
        'text-anchor': 'end',
        fill: '#9d8c72',
        'font-size': '11',
      },
      `Source: ${sourceLabel} · ${rows.length} points`
    )
  );
  _el.chart.replaceChildren(frag);

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
      // Use DOM construction instead of innerHTML to avoid any XSS risk.
      const strong = document.createElement('strong');
      strong.textContent = `$${row.spot.toFixed(2)}`;
      const div = document.createElement('div');
      div.textContent = `${row.date.toLocaleDateString()} · ${row.source}`;
      tooltip.replaceChildren(strong, div);
      tooltip.style.left = x + 'px';
      tooltip.style.top = '0px';
      tooltip.style.display = 'block';
    });
    _el.chartWrap.addEventListener('mouseleave', () => {
      if (_el.tooltip) _el.tooltip.style.display = 'none';
    });
  }

  if (_el.chartStats) {
    const stats = getHistoryStats(flatHistory);
    const rangeMax = Math.max(...rows.map((r) => r.spot));
    const rangeMin = Math.min(...rows.map((r) => r.spot));
    const cards = [
      buildStatCard('Points shown', String(rows.length), _state.range || 'ALL'),
      buildStatCard('Data source', sourceLabel, 'LBMA baseline 2019–Aug 2025 + session'),
      buildStatCard(
        'Range high',
        `$${rangeMax.toLocaleString('en', { maximumFractionDigits: 0 })}`,
        'within selected range'
      ),
      buildStatCard(
        'Range low',
        `$${rangeMin.toLocaleString('en', { maximumFractionDigits: 0 })}`,
        'within selected range'
      ),
    ];
    if (stats.ytdChange != null)
      cards.push(
        buildStatCard(
          'YTD change',
          `${stats.ytdChange >= 0 ? '+' : ''}${stats.ytdChange.toFixed(1)}%`,
          'vs Jan 1'
        )
      );
    if (stats.yoyChange != null)
      cards.push(
        buildStatCard(
          '1Y change',
          `${stats.yoyChange >= 0 ? '+' : ''}${stats.yoyChange.toFixed(1)}%`,
          'year over year'
        )
      );
    clear(_el.chartStats);
    _el.chartStats.append(...cards);
    pulseFreshness(_el.chartStats);
  }
}

export function renderKaratTable() {
  if (!_el.karatTable) return;
  const spot = _currentSpot();
  if (!spot) {
    clear(_el.karatTable);
    _el.karatTable.append(el('tr', null, [el('td', { colspan: '4' }, 'Waiting for live data…')]));
    return;
  }
  const price24 = _priceFor({
    currency: _state.selectedCurrency,
    karat: '24',
    unit: _state.selectedUnit,
    spot,
  });

  // Build rows on first render; update price cells in-place on subsequent renders
  // so countUp can animate from the previous value.
  const isFirstRender = !_el.karatTable.querySelector('[data-karat-price]');

  if (isFirstRender) {
    const fragment = document.createDocumentFragment();
    for (const k of KARATS) {
      const p = _priceFor({
        currency: _state.selectedCurrency,
        karat: k.code,
        unit: _state.selectedUnit,
        spot,
      });
      const vs = price24 && p ? `${((p / price24) * 100).toFixed(1)}%` : '—';
      const priceCell = el('td', { 'data-karat-price': k.code }, p ? p.toFixed(2) : '—');
      const vsCell = el('td', { 'data-karat-vs': k.code }, vs);
      fragment.append(
        el('tr', null, [
          el('td', null, `${k.code}K`),
          el('td', null, `${(k.purity * 100).toFixed(1)}%`),
          priceCell,
          vsCell,
        ])
      );
    }
    clear(_el.karatTable);
    _el.karatTable.append(fragment);
  } else {
    // In-place update: animate price cells with countUp, flash vs-cells
    for (const k of KARATS) {
      const p = _priceFor({
        currency: _state.selectedCurrency,
        karat: k.code,
        unit: _state.selectedUnit,
        spot,
      });
      const vs = price24 && p ? `${((p / price24) * 100).toFixed(1)}%` : '—';
      const priceCell = _el.karatTable.querySelector(`[data-karat-price="${k.code}"]`);
      const vsCell = _el.karatTable.querySelector(`[data-karat-vs="${k.code}"]`);
      if (priceCell && p) {
        countUp(priceCell, p, { decimals: 2, format: (n) => n.toFixed(2) });
        pulseFreshness(priceCell);
      } else if (priceCell) {
        setText(priceCell, '—');
      }
      if (vsCell) setText(vsCell, vs);
    }
  }
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
  if (sortValue === 'high' || sortValue === 'low') {
    const getPrice = (c) =>
      _priceFor({
        currency: c.currency,
        karat: _state.selectedKarat,
        unit: _state.selectedUnit,
        spot,
      }) || 0;
    filtered.sort((a, b) =>
      sortValue === 'high' ? getPrice(b) - getPrice(a) : getPrice(a) - getPrice(b)
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
  clear(_el.alertList);
  if (!alerts.length) {
    _el.alertList.append(
      el('p', { style: { color: 'var(--tp-text-muted)', fontSize: '0.85rem' } }, 'No alerts set.')
    );
    return;
  }
  const fragment = document.createDocumentFragment();
  alerts.forEach((a, i) => {
    const hit = spot && (a.direction === 'above' ? spot > a.target : spot < a.target);
    let proximityText = '';
    let proximityClass = '';
    if (spot) {
      const pct = (Math.abs(spot - a.target) / a.target) * 100;
      if (pct < 1) {
        proximityText = '⚡ very close';
        proximityClass = 'is-alert-imminent';
      } else if (pct < 3) {
        proximityText = '● nearby';
        proximityClass = 'is-alert-close';
      }
    }
    const classes = ['tracker-stack-item', hit && 'is-triggered', proximityClass]
      .filter(Boolean)
      .join(' ');
    const labelChildren = [
      `${a.scope} ${a.direction} `,
      el('strong', null, `$${a.target}`),
      ...(hit ? [' ✓ triggered'] : []),
    ];
    const bodyChildren = [el('span', null, labelChildren)];
    if (proximityText)
      bodyChildren.push(
        el(
          'div',
          { style: { fontSize: '0.8rem', color: 'var(--tp-text-muted)', marginTop: '0.25rem' } },
          proximityText
        )
      );
    fragment.append(
      el('div', { class: classes }, [
        el('div', { style: { flex: '1' } }, bodyChildren),
        el(
          'button',
          {
            dataset: { idx: String(i) },
            class: 'tracker-remove-btn',
            'aria-label': 'Delete alert',
          },
          '×'
        ),
      ])
    );
  });
  _el.alertList.append(fragment);
}

export function renderPresets() {
  if (!_el.presetList) return;
  const presets = _state.presets || [];
  clear(_el.presetList);
  if (!presets.length) {
    _el.presetList.append(
      el(
        'p',
        { style: { color: 'var(--tp-text-muted)', fontSize: '0.85rem' } },
        'No presets saved. Save the current view via the form above.'
      )
    );
    return;
  }
  const fragment = document.createDocumentFragment();
  presets.forEach((p, i) => {
    const isCurrent =
      _state.selectedCurrency === p.currency &&
      _state.selectedKarat === p.karat &&
      _state.selectedUnit === p.unit &&
      _state.range === p.range;
    const metaParts = [
      `${escape(p.karat)}K · ${escape(p.currency)}/${escape(p.unit)} · ${escape(p.range)} range`,
      ...(isCurrent
        ? [' · ', el('span', { style: { color: 'var(--tp-accent)' } }, '● current')]
        : []),
    ];
    fragment.append(
      el('div', { class: `tracker-stack-item${isCurrent ? ' is-highlight' : ''}` }, [
        el('div', { style: { flex: '1' } }, [
          el('div', null, [el('strong', null, p.name)]),
          el(
            'div',
            { style: { fontSize: '0.8rem', color: 'var(--tp-text-muted)', marginTop: '0.25rem' } },
            metaParts
          ),
        ]),
        el('span', null, [
          el(
            'button',
            { dataset: { idx: String(i) }, class: 'tracker-load-btn tracker-pill' },
            'Load'
          ),
          el(
            'button',
            {
              dataset: { idx: String(i) },
              class: 'tracker-remove-btn',
              'aria-label': 'Delete preset',
            },
            '×'
          ),
        ]),
      ])
    );
  });
  _el.presetList.append(fragment);
}

export function renderPlanners() {
  const spot = _currentSpot();
  if (!spot) return;

  // Helper: build a .tracker-result-item row from safe DOM
  function _resultItem(label, value, valueStyle) {
    return el('div', { class: 'tracker-result-item' }, [
      el('span', {}, [label]),
      el('strong', valueStyle ? { style: valueStyle } : {}, [value]),
    ]);
  }
  function _emptyMsg(msg) {
    return el('p', { style: { color: 'var(--tp-text-muted)' } }, [msg]);
  }

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
    _el.budgetResults.replaceChildren(
      p && net
        ? (() => {
            const f = document.createDocumentFragment();
            f.append(
              _resultItem('Net budget', `${net.toFixed(2)} ${escape(_state.selectedCurrency)}`),
              _resultItem(
                'Gold you can buy',
                `${(net / p).toFixed(3)} g (${escape(_state.selectedKarat)}K)`
              )
            );
            return f;
          })()
        : _emptyMsg('Enter a budget above.')
    );
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
      const gainColor = gainLoss >= 0 ? 'var(--tp-live)' : 'var(--tp-danger)';
      const gainPrefix = gainLoss >= 0 ? '+' : '';
      const frag = document.createDocumentFragment();
      frag.append(
        _resultItem('Entry value', `${entryValue.toFixed(2)} ${escape(_state.selectedCurrency)}`),
        _resultItem(
          'Current value',
          `${currentValue.toFixed(2)} ${escape(_state.selectedCurrency)}`
        ),
        _resultItem(
          'Gain / loss',
          `${gainPrefix}${gainLoss.toFixed(2)} ${escape(_state.selectedCurrency)} (${gainLoss >= 0 ? '+' : ''}${gainLossPercent.toFixed(1)}%)`,
          { color: gainColor }
        )
      );
      _el.positionResults.replaceChildren(frag);
    } else {
      _el.positionResults.replaceChildren(_emptyMsg('Enter entry price and quantity above.'));
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
      const cur = escape(_state.selectedCurrency);
      const frag = document.createDocumentFragment();
      frag.append(
        _resultItem('Gold value', `${goldValue.toFixed(2)} ${cur}`),
        _resultItem('Making charge', `${makingTotal.toFixed(2)} ${cur}`)
      );
      if (premium) frag.append(_resultItem('Premium', `${premiumTotal.toFixed(2)} ${cur}`));
      frag.append(_resultItem('Subtotal', `${subtotal.toFixed(2)} ${cur}`));
      if (vat) frag.append(_resultItem('VAT (5%)', `${vatAmount.toFixed(2)} ${cur}`));
      frag.append(
        _resultItem('Total', `${total.toFixed(2)} ${cur}`, { color: 'var(--tp-accent)' })
      );
      _el.jewelryResults.replaceChildren(frag);
    } else {
      _el.jewelryResults.replaceChildren(_emptyMsg('Enter weight and select karat above.'));
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
      const frag = document.createDocumentFragment();
      frag.append(
        _resultItem('Grams / month', `${gramsPerMonth.toFixed(3)} g`),
        _resultItem('Months to target', `${months.toFixed(1)}`),
        _resultItem('Years to target', `${years.toFixed(2)}`)
      );
      _el.accumResults.replaceChildren(frag);
    } else {
      _el.accumResults.replaceChildren(
        _emptyMsg('Enter monthly contribution and target quantity above.')
      );
    }
  }
}

const ARCHIVE_PAGE_SIZE = 50;
let _archivePage = 0;

export function renderArchive(resetPage = false) {
  if (!_el.archiveBody) return;
  if (resetPage) _archivePage = 0;

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

  const totalFiltered = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ARCHIVE_PAGE_SIZE));
  _archivePage = Math.min(_archivePage, totalPages - 1);
  const pageStart = _archivePage * ARCHIVE_PAGE_SIZE;
  const pageRows = rows.slice(pageStart, pageStart + ARCHIVE_PAGE_SIZE);

  clear(_el.archiveBody);

  if (!pageRows.length) {
    _el.archiveBody.append(
      el('tr', null, [el('td', { colspan: '5' }, 'No records match filters.')])
    );
    if (_el.archiveMeta) _el.archiveMeta.textContent = '';
    _renderArchivePagination(0, 1, 0);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const r of pageRows) {
    const aed24 = _priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot: r.spot });
    const selected = _priceFor({
      currency: _state.selectedCurrency,
      karat: _state.selectedKarat,
      unit: _state.selectedUnit,
      spot: r.spot,
    });
    const dateStr = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date);
    const sourceLabel = r.source + (r.granularity ? ' · ' + r.granularity : '');
    fragment.append(
      el('tr', null, [
        el('td', null, dateStr),
        el('td', null, `$${r.spot.toFixed(2)}`),
        el('td', null, selected ? selected.toFixed(2) : '—'),
        el('td', null, aed24 ? aed24.toFixed(2) : '—'),
        el('td', null, [
          el(
            'span',
            { class: `tracker-source-badge tracker-source-badge--${r.source}` },
            sourceLabel
          ),
        ]),
      ])
    );
  }
  _el.archiveBody.append(fragment);

  if (_el.archiveMeta) {
    const sourceInfo = _state.history.some(
      (r) => r.source === 'live' || r.source === 'session-cache'
    )
      ? 'session + baseline'
      : 'baseline';
    _el.archiveMeta.textContent = `${pageStart + 1}–${pageStart + pageRows.length} of ${totalFiltered} records · ${sourceInfo} · 2019–present`;
  }

  _renderArchivePagination(_archivePage, totalPages, totalFiltered);
  renderSeasonal();
}

function _renderArchivePagination(page, totalPages, total) {
  let paginationEl = document.getElementById('tp-archive-pagination');
  if (!paginationEl) {
    const tableFooter = _el.archiveMeta?.parentElement;
    if (!tableFooter) return;
    paginationEl = el('div', {
      id: 'tp-archive-pagination',
      class: 'tracker-pagination',
      'aria-label': 'Archive pages',
    });
    tableFooter.after(paginationEl);
  }
  clear(paginationEl);
  if (total <= ARCHIVE_PAGE_SIZE) return;

  const prevBtn = el(
    'button',
    {
      type: 'button',
      class: 'btn btn-sm btn-ghost tracker-pagination-btn',
      'aria-label': 'Previous page',
      disabled: page === 0 ? true : null,
    },
    '← Prev'
  );
  prevBtn.addEventListener('click', () => {
    _archivePage--;
    renderArchive();
  });

  const pageLabel = el(
    'span',
    { class: 'tracker-pagination-label' },
    `Page ${page + 1} / ${totalPages}`
  );

  const nextBtn = el(
    'button',
    {
      type: 'button',
      class: 'btn btn-sm btn-ghost tracker-pagination-btn',
      'aria-label': 'Next page',
      disabled: page >= totalPages - 1 ? true : null,
    },
    'Next →'
  );
  nextBtn.addEventListener('click', () => {
    _archivePage++;
    renderArchive();
  });

  paginationEl.append(prevBtn, pageLabel, nextBtn);
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
  function _resultCard(label, value, sub) {
    return el('div', { class: 'tracker-result-card' }, [
      el('div', { class: 'tracker-result-k' }, [label]),
      el('div', { class: 'tracker-result-v' }, [value]),
      el('div', { class: 'tracker-result-s' }, [sub]),
    ]);
  }

  const frag = document.createDocumentFragment();
  frag.append(
    _resultCard('Typical high month', maxMonth.label, `$${maxAvg.toFixed(0)} avg spot`),
    _resultCard('Typical low month', minMonth.label, `$${minAvg.toFixed(0)} avg spot`),
    _resultCard('Seasonal spread', `${pctSpread.toFixed(1)}%`, `high vs low month${yearsSpan}`)
  );
  _el.seasonalResults.replaceChildren(frag);
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
  const spotForTitle = _state.goldPriceUsdPerOz;
  if (spotForTitle) {
    const priceStr = Math.round(spotForTitle).toLocaleString();
    document.title =
      _state.lang === 'ar'
        ? `${priceStr}$ XAU/USD | متتبع الذهب`
        : `$${priceStr} XAU/USD | GoldTickerLive`;
  } else {
    document.title =
      _state.lang === 'ar'
        ? 'متتبع الذهب — أسعار مباشرة'
        : 'Gold Tracker — Live Prices | GoldTickerLive';
  }

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

  // Localize welcome strip chips (bilingual parity — §6 rule 6).
  _localizeWelcomeStrip();

  const spot = _currentSpot();
  updateShellTickerFromState(_state, spot, _priceFor);
}

/** Localize the first-visit orientation strip chips and dismiss button. */
function _localizeWelcomeStrip() {
  const chipEls = document.querySelectorAll('.tracker-welcome-chip');
  const chipDefs = [
    { bold: tx('welcome.chip1Bold'), rest: tx('welcome.chip1Rest'), icon: '📈' },
    { bold: tx('welcome.chip2Bold'), rest: tx('welcome.chip2Rest'), icon: '⚖️' },
    { bold: tx('welcome.chip3Bold'), rest: tx('welcome.chip3Rest'), icon: '📋' },
  ];
  chipEls.forEach((chip, i) => {
    const def = chipDefs[i];
    if (!def) return;
    chip.replaceChildren(`${def.icon} `, el('strong', {}, def.bold), ` ${def.rest}`);
  });
  const closeBtn = document.getElementById('tracker-welcome-close');
  if (closeBtn) setText(closeBtn, tx('welcome.dismiss'));
}
