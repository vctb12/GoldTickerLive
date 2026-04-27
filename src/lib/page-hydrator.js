/**
 * lib/page-hydrator.js
 * Shared hydration script for all generated country/city/karat pages.
 * Reads URL path → determines route → fetches live prices → renders.
 *
 * Loaded by all generated pages as: <script type="module" src="...lib/page-hydrator.js">
 */
import { CONSTANTS } from '../config/index.js';
import { COUNTRIES } from '../config/countries.js';
import { KARATS } from '../config/karats.js';
import * as api from './api.js';
import * as cache from './cache.js';
import { formatPrice, formatFreshness } from './formatter.js';
import { injectNav, updateNavLang as _updateNavLang } from '../components/nav.js';
import { injectFooter } from '../components/footer.js';
import { injectSpotBar, updateSpotBar } from '../components/spotBar.js';
import { el, safeHref, escape } from './safe-dom.js';

// Determine depth by comparing import.meta.url (this module) to the page URL.
// This module lives at {root}/src/lib/page-hydrator.js (2 dirs from root).
// depth = (dirs between page and root).
const _modUrl = new URL(import.meta.url);
const _pageUrl = new URL(location.href);
// Module path always ends with /src/lib/page-hydrator.js — strip that to find root
const _rootPath = _modUrl.pathname.replace(/\/src\/lib\/page-hydrator\.js$/, '/');
// Page path relative to root — count directory segments
const _relPath = _pageUrl.pathname.slice(_rootPath.length).replace(/[^/]+$/, ''); // strip filename
const depth = _relPath ? _relPath.split('/').filter(Boolean).length : 0;

const AED_PEG = CONSTANTS.AED_PEG;
const TROY_OZ_GRAMS = CONSTANTS.TROY_OZ_GRAMS;
const BASE_URL = 'https://goldtickerlive.com';

function getLang() {
  try {
    const p = JSON.parse(localStorage.getItem(CONSTANTS.CACHE_KEYS.userPrefs) || '{}');
    const urlLang = new URLSearchParams(location.search).get('lang');
    return urlLang || p.lang || 'en';
  } catch {
    return 'en';
  }
}

function getCountryFromPath() {
  const path = location.pathname.replace(/^\/|\/$/g, '');
  const parts = path.split('/');
  // Pages live under /countries/{slug}/… — strip the leading 'countries' segment
  const offset = parts[0] === 'countries' ? 1 : 0;
  const countrySlug = parts[offset];
  const citySlug = parts[offset + 1];
  const type = parts[offset + 2]; // 'gold-price', 'gold-prices', 'gold-shops', 'gold-rate'
  const karatSlug = parts[offset + 3]; // '22-karat'
  return { countrySlug, citySlug, type, karatSlug, parts };
}

function calcLocalPrice(spotUsdPerOz, purity, fxRate) {
  const usdPerGram = (spotUsdPerOz / TROY_OZ_GRAMS) * purity;
  return usdPerGram * fxRate;
}

async function fetchPrices() {
  try {
    const [goldRes, fxRes] = await Promise.allSettled([api.fetchGold(), api.fetchFX()]);
    const gold =
      goldRes.status === 'fulfilled'
        ? goldRes.value
        : (() => {
            const fb = cache.getFallbackGoldPrice();
            return fb
              ? { price: fb.price, updatedAt: fb.updatedAt, source: 'cache-fallback' }
              : null;
          })();
    // fetchFX() now handles its own cache fallback and returns source: 'cache-fallback' when used.
    const fx = fxRes.status === 'fulfilled' ? fxRes.value : { rates: {}, source: 'unavailable' };
    return { gold, fx };
  } catch {
    const fb = cache.getFallbackGoldPrice();
    return {
      gold: fb ? { price: fb.price, updatedAt: fb.updatedAt, source: 'cache-fallback' } : null,
      fx: { rates: {}, source: 'unavailable' },
    };
  }
}

function renderKaratCards(spot, fxRate, currency, karatFilter = null) {
  const karatsToShow = karatFilter
    ? KARATS.filter((k) => k.code === String(karatFilter).replace('-karat', ''))
    : KARATS.filter((k) => ['24', '22', '21', '18'].includes(k.code));

  // Styles in styles/global.css `.ph-karat-card` (W-6 token migration, W-1 safe-dom migration).
  const frag = document.createDocumentFragment();
  for (const k of karatsToShow) {
    const price = calcLocalPrice(spot, k.purity, fxRate);
    const priceStr = formatPrice(price, currency, 2);
    frag.appendChild(
      el('div', { class: 'ph-karat-card' }, [
        el('div', { class: 'ph-karat-card__label' }, [`${escape(k.code)}K Gold`]),
        el('div', { class: 'ph-karat-card__price' }, [priceStr]),
        el('div', { class: 'ph-karat-card__unit' }, ['per gram']),
      ])
    );
  }
  return frag;
}

function renderFreshnessBadge(updatedAt) {
  const { label, state } = formatFreshness(updatedAt);
  const colorMap = {
    live: 'var(--color-live, #10b981)',
    recent: 'var(--color-warning, #f59e0b)',
    stale: 'var(--color-stale, #f97316)',
    cached: 'var(--color-error, #ef4444)',
    error: 'var(--text-tertiary, #6b7280)',
  };
  const color = colorMap[state] || 'var(--text-tertiary, #6b7280)';
  const isStale = state === 'stale' || state === 'cached' || state === 'error';
  const frag = document.createDocumentFragment();
  if (isStale) {
    frag.appendChild(
      el(
        'div',
        {
          class: 'ph-freshness-banner',
          role: 'alert',
        },
        [
          '⚠️ Prices may be delayed. Last known data shown. ',
          el('a', { href: safeHref(`${BASE_URL}/methodology.html`), class: 'ph-freshness-link' }, [
            'Learn more',
          ]),
        ]
      )
    );
  }
  frag.appendChild(
    el(
      'span',
      {
        class: 'ph-freshness-badge',
        title: 'Source: goldpricez.com / open.er-api.com',
        style: { color },
      },
      [
        el('span', { class: 'ph-freshness-dot', style: { background: color } }),
        label,
        el('span', { class: 'ph-freshness-suffix' }, ['· spot-linked estimate']),
      ]
    )
  );
  return frag;
}

function renderDisclaimer(country, pageUrl) {
  // Sanitize pageUrl to canonical origin+pathname (strip user-controlled hash/query)
  let safeUrl;
  try {
    const parsed = new URL(pageUrl);
    safeUrl = parsed.origin + parsed.pathname;
  } catch {
    safeUrl = BASE_URL;
  }
  const waText = encodeURIComponent(
    `Gold prices in ${escape(country.nameEn)} — check live rates: ${safeUrl}`
  );
  const waUrl = `https://wa.me/?text=${waText}`;
  return el('div', { class: 'ph-disclaimer' }, [
    el('span', {}, [
      '⚠️ ',
      el('strong', {}, ['Reference rates only.']),
      ' Actual retail prices vary. ',
      el('a', { href: safeHref(`${BASE_URL}/methodology.html`), class: 'ph-disclaimer-link' }, [
        'Methodology',
      ]),
    ]),
    el(
      'a',
      {
        href: safeHref(waUrl),
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'ph-disclaimer-share',
      },
      ['📲 Share on WhatsApp']
    ),
  ]);
}

async function hydrate() {
  try {
    const lang = getLang();
    injectSpotBar(lang, depth);
    injectNav(lang, depth);
    injectFooter(lang, depth);

    const { countrySlug, citySlug, karatSlug } = getCountryFromPath();
    const country = COUNTRIES.find((c) => c.slug === countrySlug);
    if (!country) return;

    const _city = citySlug ? (country.cities || []).find((ci) => ci.slug === citySlug) : null;

    const loadingEl = document.getElementById('price-loading');
    const displayEl = document.getElementById('price-display');
    const karatsEl = document.getElementById('karat-cards');
    const freshEl = document.getElementById('freshness-badge');
    const disclaimerEl = document.getElementById('price-disclaimer');

    const { gold, fx } = await fetchPrices();

    if (!gold) {
      if (loadingEl) loadingEl.textContent = 'Unable to fetch prices. Please try again.';
      return;
    }

    const rate = country.currency === 'AED' ? AED_PEG : (fx.rates?.[country.currency] ?? null);
    if (!rate) {
      if (loadingEl) loadingEl.textContent = `FX rate for ${country.currency} unavailable.`;
      return;
    }

    if (karatsEl)
      karatsEl.replaceChildren(
        renderKaratCards(gold.price, rate, country.currency, karatSlug || null)
      );
    if (freshEl) freshEl.replaceChildren(renderFreshnessBadge(gold.updatedAt));
    if (disclaimerEl) disclaimerEl.replaceChildren(renderDisclaimer(country, location.href));

    // Update sticky spot bar with live prices
    const aed24g = (gold.price / CONSTANTS.TROY_OZ_GRAMS) * AED_PEG;
    updateSpotBar({
      xauUsd: gold.price,
      aed24kGram: aed24g,
      updatedAt: gold.updatedAt,
      hasLiveFailure: gold.source === 'cache-fallback',
    });

    if (displayEl) displayEl.style.display = '';
    if (loadingEl) loadingEl.style.display = 'none';
  } catch (err) {
    console.error('[page-hydrator] Hydration error:', err);
    const loadingEl = document.getElementById('price-loading');
    if (loadingEl) loadingEl.textContent = 'Unable to load prices. Please refresh the page.';
  }
}

document.addEventListener('DOMContentLoaded', hydrate);
