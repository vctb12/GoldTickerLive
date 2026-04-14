/**
 * components/ticker.js — Premium bottom gold price ticker.
 * Slim fixed bar with smooth scrolling gold prices.
 *
 * API:
 *   injectTicker(lang, depth)    — create & mount the ticker
 *   updateTicker(data)           — update displayed values
 *   updateTickerLang(lang)       — switch language labels live
 */

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

  const isAr = lang === 'ar';
  const trackerHref = depth === 0 ? 'tracker.html' : '../tracker.html';
  const dismissLabel = isAr ? 'إغلاق الشريط' : 'Dismiss ticker';
  const ariaLabel = isAr ? 'شريط أسعار الذهب' : 'Live gold price ticker';

  // Two identical copies so the animation creates a seamless loop
  const copy1 = buildCopyHtml(lang, trackerHref);
  const copy2 = buildCopyHtml(lang, trackerHref);

  const ticker = document.createElement('div');
  ticker.id = 'gold-ticker';
  ticker.className = 'gold-ticker';
  ticker.setAttribute('role', 'status');
  ticker.setAttribute('aria-live', 'polite');
  ticker.setAttribute('aria-label', ariaLabel);
  ticker.innerHTML =
    `<div class="ticker-track">${copy1}${copy2}</div>` +
    `<button class="ticker-close" id="ticker-close" aria-label="${dismissLabel}" title="${dismissLabel}">×</button>`;

  document.body.appendChild(ticker);
  document.body.classList.add('has-ticker');

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
}

// ─────────────────────────────────────────────────────────────────────────────
// updateTickerLang
// ─────────────────────────────────────────────────────────────────────────────

export function updateTickerLang(lang) {
  const isAr = lang === 'ar';
  TICKER_ITEMS.forEach((item) => {
    const label = isAr ? item.labelAr : item.labelEn;
    document
      .querySelectorAll(`.ticker-item[data-key="${item.key}"] .ticker-label`)
      .forEach((el) => {
        el.textContent = label;
      });
  });
}
