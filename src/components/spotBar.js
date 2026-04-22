/**
 * components/spotBar.js — Sticky top bar showing XAU/USD and 24K AED/gram.
 * Present on every page. Updates on each successful price fetch.
 *
 * API:
 *   injectSpotBar(lang, depth) — create & mount the bar
 *   updateSpotBar(data)        — update {xauUsd, aed24kGram}
 *   updateSpotBarLang(lang)    — switch language
 */

let _barEl = null;
let _prevXauUsd = null;

export function injectSpotBar(lang = 'en', depth = 0) {
  if (document.getElementById('spot-price-bar')) return;

  const isAr = lang === 'ar';
  const trackerHref = depth === 0 ? 'tracker.html' : '../'.repeat(depth) + 'tracker.html';

  const bar = document.createElement('div');
  bar.id = 'spot-price-bar';
  bar.className = 'spot-bar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  bar.setAttribute('aria-label', isAr ? 'أسعار الذهب الفورية' : 'Live gold spot prices');
  bar.innerHTML = `
    <div class="spot-bar-inner">
      <a href="${trackerHref}" class="spot-bar-item" data-spot="xau">
        <span class="spot-bar-label" data-spot-label="xau">XAU/USD</span>
        <span class="spot-bar-value" data-spot-value="xau">—</span>
      </a>
      <span class="spot-bar-sep" aria-hidden="true">|</span>
      <a href="${trackerHref}" class="spot-bar-item" data-spot="aed">
        <span class="spot-bar-label" data-spot-label="aed">${isAr ? '24K / غ AED' : '24K AED/g'}</span>
        <span class="spot-bar-value" data-spot-value="aed">—</span>
      </a>
      <span class="spot-bar-sep spot-bar-sep--ts" aria-hidden="true">|</span>
      <span class="spot-bar-ts" data-spot-ts></span>
    </div>`;

  // Insert before nav or as first child of body
  const nav = document.querySelector('.site-nav');
  if (nav) {
    nav.parentNode.insertBefore(bar, nav);
  } else {
    document.body.insertBefore(bar, document.body.firstChild);
  }

  _barEl = bar;
  document.body.classList.add('has-spot-bar');
}

export function updateSpotBar(data = {}) {
  if (!_barEl) return;
  if (data.xauUsd != null) {
    const el = _barEl.querySelector('[data-spot-value="xau"]');
    if (el) {
      el.textContent =
        '$' +
        data.xauUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      el.classList.remove('spot-change-up', 'spot-change-down', 'spot-change-neutral');
      if (_prevXauUsd === null) {
        el.classList.add('spot-change-neutral');
      } else if (data.xauUsd > _prevXauUsd) {
        el.classList.add('spot-change-up');
      } else if (data.xauUsd < _prevXauUsd) {
        el.classList.add('spot-change-down');
      }
      _prevXauUsd = data.xauUsd;
    }
  }
  if (data.aed24kGram != null) {
    const el = _barEl.querySelector('[data-spot-value="aed"]');
    if (el)
      el.textContent = data.aed24kGram.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  }
  if (data.updatedAt) {
    const el = _barEl.querySelector('[data-spot-ts]');
    if (el) {
      const d = new Date(data.updatedAt);
      el.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
}

export function updateSpotBarLang(lang) {
  if (!_barEl) return;
  const isAr = lang === 'ar';
  const labelEl = _barEl.querySelector('[data-spot-label="aed"]');
  if (labelEl) labelEl.textContent = isAr ? '24K / غ AED' : '24K AED/g';
}
