/**
 * components/spotBar.js — Sticky top bar showing XAU/USD and 24K AED/gram.
 * Present on every page. Updates on each successful price fetch.
 *
 * Honors AGENTS.md non-negotiable rule 2 (freshness): cached / stale / unavailable values are visibly
 * labelled. The bar's `data-freshness` attribute reflects
 * `getLiveFreshness()` ('live' | 'cached' | 'stale' | 'unavailable') and
 * the timestamp slot renders both the clock time and a relative age
 * (e.g. "2 min ago") so staleness is legible without hover.
 *
 * API:
 *   injectSpotBar(lang, depth) — create & mount the bar
 *   updateSpotBar(data)        — update {xauUsd, aed24kGram, updatedAt, hasLiveFailure}
 *   updateSpotBarLang(lang)    — switch language
 */

import { getLiveFreshness, applyMarketClosedOverlay } from '../lib/live-status.js';
import { TRANSLATIONS } from '../config/translations.js';
import { translate } from '../lib/i18n.js';
import {
  downgradeFreshnessForDivergence,
  DEFAULT_DIVERGENCE_THRESHOLD_PCT,
} from '../lib/quote-providers/cross-validation.js';
import {
  isCrossValidationActive,
  maybeRunSecondarySpotCheck,
  getLastCrossValidationEvaluation,
} from '../lib/quote-providers/secondary-spot-check.js';

let _barEl = null;
let _prevXauUsd = null;
let _currentLang = 'en';
let _resizeObserver = null;
let _resizeHandler = null;
// Last data applied to the bar, so the cross-validation check can trigger a re-render when its async
// result lands after the render that kicked it off (surfaces that render the bar only once).
let _lastSpotData = null;

function syncSpotBarHeight() {
  if (!_barEl) return;
  const measuredHeight =
    typeof _barEl.getBoundingClientRect === 'function'
      ? _barEl.getBoundingClientRect().height
      : _barEl.offsetHeight;
  const heightPx = Math.max(0, Math.round(measuredHeight || 0));
  if (document?.documentElement?.style) {
    document.documentElement.style.setProperty('--spot-bar-height', `${heightPx}px`);
  }
}

export function injectSpotBar(lang = 'en', depth = 0) {
  if (document.getElementById('spot-price-bar')) return;

  _currentLang = lang;
  const isAr = lang === 'ar';
  const trackerHref = depth === 0 ? 'tracker.html' : '../'.repeat(depth) + 'tracker.html';

  const bar = document.createElement('div');
  bar.id = 'spot-price-bar';
  bar.className = 'spot-bar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  // No "Live" in the permanent accessible name — the label is set once and never
  // updated, so claiming "Live" would mislead screen-reader users when the data is
  // stale / cached / fallback / closed. The visible freshness pill carries the state.
  bar.setAttribute('aria-label', isAr ? 'أسعار الذهب الفورية' : 'Gold spot prices');
  bar.setAttribute('data-freshness', 'unavailable');
  // Build the inner structure via DOM to eliminate the innerHTML sink.
  function makeSpotLink(spot, label, valueLabel) {
    const a = document.createElement('a');
    a.href = trackerHref;
    a.className = 'spot-bar-item';
    a.setAttribute('data-spot', spot);
    const lbl = document.createElement('span');
    lbl.className = 'spot-bar-label';
    lbl.setAttribute('data-spot-label', spot);
    lbl.textContent = label;
    const val = document.createElement('span');
    val.className = 'spot-bar-value';
    val.setAttribute('data-spot-value', spot);
    val.textContent = valueLabel;
    a.appendChild(lbl);
    a.appendChild(val);
    return a;
  }
  function makeSep(extraClass) {
    const s = document.createElement('span');
    s.className = 'spot-bar-sep' + (extraClass ? ' ' + extraClass : '');
    s.setAttribute('aria-hidden', 'true');
    s.textContent = '|';
    return s;
  }
  const inner = document.createElement('div');
  inner.className = 'spot-bar-inner';
  inner.appendChild(makeSpotLink('xau', 'XAU/USD', '\u2014'));
  inner.appendChild(makeSep());
  inner.appendChild(makeSpotLink('aed', isAr ? '24K / \u063A AED' : '24K AED/g', '\u2014'));
  inner.appendChild(makeSep('spot-bar-sep--ts'));
  const ts = document.createElement('span');
  ts.className = 'spot-bar-ts';
  ts.setAttribute('data-spot-ts', '');
  inner.appendChild(ts);
  bar.appendChild(inner);

  // Insert before nav or as first child of body
  const nav = document.querySelector('.site-nav');
  if (nav) {
    nav.parentNode.insertBefore(bar, nav);
  } else {
    document.body.insertBefore(bar, document.body.firstChild);
  }

  _barEl = bar;
  document.body.classList.add('has-spot-bar');
  syncSpotBarHeight();
  if (typeof ResizeObserver === 'function') {
    _resizeObserver?.disconnect();
    _resizeObserver = new ResizeObserver(() => syncSpotBarHeight());
    _resizeObserver.observe(_barEl);
  } else if (typeof window !== 'undefined') {
    if (_resizeHandler) window.removeEventListener('resize', _resizeHandler);
    _resizeHandler = () => syncSpotBarHeight();
    window.addEventListener('resize', _resizeHandler, { passive: true });
  }
}

export function updateSpotBar(data = {}) {
  if (!_barEl) return;
  _lastSpotData = data;
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
      const fresh = getLiveFreshness({
        updatedAt: data.updatedAt,
        lang: _currentLang,
        hasLiveFailure: Boolean(data.hasLiveFailure),
        isFallback: data.isFallback ?? null,
        isFresh: data.isFresh ?? null,
      });
      // Market-closed overlay: never surface "Live" for a closed market (per
      // docs/freshness-contract.md). getLiveFreshness stays pure data-freshness.
      let key = applyMarketClosedOverlay(fresh.key);
      let title = freshnessLabel(key, _currentLang);

      // Secondary-source cross-validation (T1.1) — OFF by default, dormant unless
      // FEATURE_FLAGS.CROSS_VALIDATION_ENABLED is on or `?debug=true` forces the display.
      // Lazy + throttled + fire-and-forget: reads the last cached evaluation synchronously
      // so it never blocks this render or fetches on every poll. If a reference second
      // source disagrees beyond the threshold, downgrade "live" → "delayed" so a number a
      // second source contradicts is never shown as unlabelled "Live" (AGENTS.md rule 2).
      if (isCrossValidationActive()) {
        // Fire-and-forget; when the async result flips the divergence state, re-render this bar so
        // the downgrade lands even on surfaces that render the spot bar only once (no price poll).
        maybeRunSecondarySpotCheck({
          primaryUsd: data.xauUsd,
          onResolved: () => {
            if (_lastSpotData) updateSpotBar(_lastSpotData);
          },
        });
        const evaluation = getLastCrossValidationEvaluation();
        const downgraded = downgradeFreshnessForDivergence(key, evaluation);
        if (downgraded !== key) {
          key = downgraded;
          title = translate(TRANSLATIONS, _currentLang, 'crossValidation.divergence.tooltip', {
            vars: { pct: DEFAULT_DIVERGENCE_THRESHOLD_PCT },
          });
        }
      }

      _barEl.setAttribute('data-freshness', key);
      el.textContent = `${fresh.timeText} · ${fresh.ageText}`;
      el.setAttribute('title', title);
    }
  } else if (data.updatedAt === null) {
    _barEl.setAttribute('data-freshness', 'unavailable');
    const el = _barEl.querySelector('[data-spot-ts]');
    if (el) el.textContent = '—';
  }
}

function freshnessLabel(key, lang) {
  const isAr = lang === 'ar';
  switch (key) {
    case 'live':
      return isAr ? 'مباشر' : 'Live';
    case 'delayed':
      return isAr ? 'متأخر قليلاً' : 'Delayed';
    case 'cached':
      return isAr ? 'مخزن مؤقتاً' : 'Cached';
    case 'stale':
      return isAr ? 'قديم' : 'Stale';
    case 'fallback':
      return isAr ? 'بديل احتياطي' : 'Fallback';
    case 'closed':
      return isAr ? 'مغلق' : 'Closed';
    case 'unavailable':
    default:
      return isAr ? 'غير متاح' : 'Unavailable';
  }
}

export function updateSpotBarLang(lang) {
  if (!_barEl) return;
  _currentLang = lang;
  const isAr = lang === 'ar';
  const labelEl = _barEl.querySelector('[data-spot-label="aed"]');
  if (labelEl) labelEl.textContent = isAr ? '24K / غ AED' : '24K AED/g';
  syncSpotBarHeight();
}
