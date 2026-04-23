/**
 * components/ticker.js — Premium bottom gold price ticker.
 * Slim fixed bar with smooth scrolling gold prices.
 *
 * Honors AGENTS.md §6.2: the ticker's `data-freshness` attribute reflects
 * `getLiveFreshness()` ('live' | 'cached' | 'stale' | 'unavailable'), a
 * status pill surfaces the label + relative age next to the close button,
 * and the pill's tooltip discloses the source timestamp. Pass `updatedAt`
 * + `hasLiveFailure` in `updateTicker()` so callers that already track
 * those can forward them unchanged.
 *
 * API:
 *   injectTicker(lang, depth)    — create & mount the ticker
 *   updateTicker(data)           — update displayed values + freshness state
 *   updateTickerLang(lang)       — switch language labels live
 */

import { getLiveFreshness } from '../lib/live-status.js';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  {
    key: 'xauUsd',
    labelEn: 'XAU/USD',
    labelAr: 'XAU/USD',
    fmt: (v) =>
      `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    key: 'uae24k',
    labelEn: 'UAE 24K/g (AED)',
    labelAr: 'الإمارات 24K/غ (AED)',
    fmt: (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  },
  {
    key: 'uae22k',
    labelEn: 'UAE 22K/g (AED)',
    labelAr: 'الإمارات 22K/غ (AED)',
    fmt: (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  },
  {
    key: 'uae21k',
    labelEn: 'UAE 21K/g (AED)',
    labelAr: 'الإمارات 21K/غ (AED)',
    fmt: (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  },
  {
    key: 'uae18k',
    labelEn: 'UAE 18K/g (AED)',
    labelAr: 'الإمارات 18K/غ (AED)',
    fmt: (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  },
];

const DISMISSED_KEY = 'gp-ticker-dismissed';

let _tickerEl = null;
let _currentLang = 'en';

function freshnessLabel(key, lang) {
  const isAr = lang === 'ar';
  switch (key) {
    case 'live':
      return isAr ? 'مباشر' : 'Live';
    case 'cached':
      return isAr ? 'مخزن مؤقتاً' : 'Cached';
    case 'stale':
      return isAr ? 'قديم' : 'Stale';
    case 'unavailable':
    default:
      return isAr ? 'غير متاح' : 'Unavailable';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildCopyHtml(lang, trackerHref) {
  const isAr = lang === 'ar';
  const items = TICKER_ITEMS.map((item) => {
    const label = isAr ? item.labelAr : item.labelEn;
    return (
      `<a href="${trackerHref}" class="ticker-item" data-key="${item.key}" tabindex="-1">` +
      `<span class="ticker-label">${label}</span>` +
      '<span class="ticker-value">—</span>' +
      '</a>' +
      '<span class="ticker-sep" aria-hidden="true">◦</span>'
    );
  }).join('');
  return `<div class="ticker-copy" aria-hidden="true">${items}</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// injectTicker
// ─────────────────────────────────────────────────────────────────────────────

export function injectTicker(lang = 'en', depth = 0) {
  if (document.getElementById('gold-ticker')) return; // already injected

  _currentLang = lang;
  const isAr = lang === 'ar';
  const trackerHref = depth === 0 ? 'tracker.html' : '../'.repeat(depth) + 'tracker.html';
  const dismissLabel = isAr ? 'إغلاق الشريط' : 'Dismiss ticker';
  const ariaLabel = isAr ? 'شريط أسعار الذهب' : 'Live gold price ticker';
  const unavailableLabel = freshnessLabel('unavailable', lang);

  // Two identical copies so the animation creates a seamless loop
  const copy1 = buildCopyHtml(lang, trackerHref);
  const copy2 = buildCopyHtml(lang, trackerHref);

  const ticker = document.createElement('div');
  ticker.id = 'gold-ticker';
  ticker.className = 'gold-ticker';
  ticker.setAttribute('role', 'status');
  ticker.setAttribute('aria-live', 'polite');
  ticker.setAttribute('aria-label', ariaLabel);
  ticker.setAttribute('data-freshness', 'unavailable');
  ticker.innerHTML =
    '<span class="ticker-status" data-ticker-status ' +
    `title="${unavailableLabel}" aria-label="${unavailableLabel}">` +
    '<span class="ticker-status-dot" aria-hidden="true"></span>' +
    `<span class="ticker-status-label" data-ticker-status-label>${unavailableLabel}</span>` +
    '</span>' +
    `<div class="ticker-track">${copy1}${copy2}</div>` +
    `<button class="ticker-close" id="ticker-close" aria-label="${dismissLabel}" title="${dismissLabel}">×</button>`;

  document.body.appendChild(ticker);
  document.body.classList.add('has-ticker');
  _tickerEl = ticker;

  // Restore dismissed state from sessionStorage
  try {
    if (sessionStorage.getItem(DISMISSED_KEY) === '1') {
      ticker.classList.add('ticker-dismissed');
      document.body.classList.remove('has-ticker');
    }
  } catch {
    /* storage blocked */
  }

  // Close button
  document.getElementById('ticker-close')?.addEventListener('click', () => {
    ticker.classList.add('ticker-dismissed');
    document.body.classList.remove('has-ticker');
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      /* blocked */
    }
  });

  // Pause on hover (desktop)
  const track = ticker.querySelector('.ticker-track');
  if (track) {
    track.addEventListener('mouseenter', () => {
      track.querySelectorAll('.ticker-copy').forEach((c) => {
        c.style.animationPlayState = 'paused';
      });
    });
    track.addEventListener('mouseleave', () => {
      track.querySelectorAll('.ticker-copy').forEach((c) => {
        c.style.animationPlayState = '';
      });
    });
  }

  // prefers-reduced-motion: stop animation
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ticker.querySelectorAll('.ticker-copy').forEach((c) => {
      c.style.animation = 'none';
    });
    if (track) track.style.overflowX = 'auto';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateTicker
// ─────────────────────────────────────────────────────────────────────────────

export function updateTicker(data = {}) {
  TICKER_ITEMS.forEach((item) => {
    const val = data[item.key];
    if (val == null) return;
    const formatted = item.fmt(val);
    // Update all copies (both ticker-copy divs)
    document
      .querySelectorAll(`.ticker-item[data-key="${item.key}"] .ticker-value`)
      .forEach((el) => {
        el.textContent = formatted;
      });
  });

  // Freshness pill (§6.2). Callers may omit updatedAt, in which case we
  // leave whatever state was last rendered — never silently regress to
  // "live" without a fresh timestamp to back it.
  const bar = _tickerEl || document.getElementById('gold-ticker');
  if (!bar) return;
  if (data.updatedAt) {
    const fresh = getLiveFreshness({
      updatedAt: data.updatedAt,
      lang: _currentLang,
      hasLiveFailure: Boolean(data.hasLiveFailure),
    });
    bar.setAttribute('data-freshness', fresh.key);
    const label = freshnessLabel(fresh.key, _currentLang);
    const statusEl = bar.querySelector('[data-ticker-status]');
    const labelEl = bar.querySelector('[data-ticker-status-label]');
    if (labelEl) labelEl.textContent = label;
    if (statusEl) {
      const tooltip = `${label} · ${fresh.timeText} (${fresh.ageText})`;
      statusEl.setAttribute('title', tooltip);
      statusEl.setAttribute('aria-label', tooltip);
    }
  } else if (data.updatedAt === null) {
    bar.setAttribute('data-freshness', 'unavailable');
    const label = freshnessLabel('unavailable', _currentLang);
    const statusEl = bar.querySelector('[data-ticker-status]');
    const labelEl = bar.querySelector('[data-ticker-status-label]');
    if (labelEl) labelEl.textContent = label;
    if (statusEl) {
      statusEl.setAttribute('title', label);
      statusEl.setAttribute('aria-label', label);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateTickerLang
// ─────────────────────────────────────────────────────────────────────────────

export function updateTickerLang(lang) {
  _currentLang = lang;
  const isAr = lang === 'ar';
  TICKER_ITEMS.forEach((item) => {
    const label = isAr ? item.labelAr : item.labelEn;
    document
      .querySelectorAll(`.ticker-item[data-key="${item.key}"] .ticker-label`)
      .forEach((el) => {
        el.textContent = label;
      });
  });
  // Re-translate the status pill label to the current freshness key.
  const bar = _tickerEl || document.getElementById('gold-ticker');
  if (!bar) return;
  const key = bar.getAttribute('data-freshness') || 'unavailable';
  const label = freshnessLabel(key, lang);
  const statusEl = bar.querySelector('[data-ticker-status]');
  const labelEl = bar.querySelector('[data-ticker-status-label]');
  if (labelEl) labelEl.textContent = label;
  if (statusEl) {
    statusEl.setAttribute('aria-label', label);
  }
}
