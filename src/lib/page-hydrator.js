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
import { injectNav, updateNavLang } from '../components/nav.js';
import { injectFooter } from '../components/footer.js';
import { injectSpotBar, updateSpotBar } from '../components/spotBar.js';

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
          return fb ? { price: fb.price, updatedAt: fb.updatedAt } : null;
        })();
    const fx =
      fxRes.status === 'fulfilled'
        ? fxRes.value
        : (() => {
          const fb = cache.getFallbackFXRates();
          return fb ? { rates: fb.rates } : { rates: {} };
        })();
    return { gold, fx };
  } catch {
    const fb = cache.getFallbackGoldPrice();
    return { gold: fb ? { price: fb.price, updatedAt: fb.updatedAt } : null, fx: { rates: {} } };
  }
}

function renderKaratCards(spot, fxRate, currency, karatFilter = null) {
  const karatsToShow = karatFilter
    ? KARATS.filter((k) => k.code === String(karatFilter).replace('-karat', ''))
    : KARATS.filter((k) => ['24', '22', '21', '18'].includes(k.code));

  return karatsToShow
    .map((k) => {
      const price = calcLocalPrice(spot, k.purity, fxRate);
      const priceStr = formatPrice(price, currency, 2);
      return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;text-align:center;min-height:90px;">
      <div style="font-size:0.8rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${k.code}K Gold</div>
      <div style="font-size:1.5rem;font-weight:700;color:#1e293b;margin:0.25rem 0;">${priceStr}</div>
      <div style="font-size:0.75rem;color:#94a3b8;">per gram</div>
    </div>`;
    })
    .join('');
}

function renderFreshnessBadge(updatedAt) {
  const { label, state } = formatFreshness(updatedAt);
  const colors = {
    live: '#10b981',
    recent: '#f59e0b',
    stale: '#f97316',
    cached: '#ef4444',
    error: '#6b7280',
  };
  const color = colors[state] || '#6b7280';
  const isStale = state === 'stale' || state === 'cached' || state === 'error';
  const staleBanner = isStale
    ? `<div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.8rem;color:#92400e;margin-bottom:0.75rem;">
        ⚠️ Prices may be delayed. Last known data shown. <a href="${BASE_URL}/methodology.html" style="color:#92400e;font-weight:600;">Learn more</a>
       </div>`
    : '';
  return `${staleBanner}<span style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.8rem;color:${color};font-weight:500;" title="Source: gold-api.com / open.er-api.com">
    <span style="width:7px;height:7px;border-radius:50%;background:${color};display:inline-block;"></span>
    ${label}
    <span style="color:#cbd5e1;font-size:0.75rem;">· spot-linked estimate</span>
  </span>`;
}

function renderDisclaimer(country, pageUrl) {
  const waText = encodeURIComponent(
    `Gold prices in ${country.nameEn} — check live rates: ${pageUrl}`
  );
  const waUrl = `https://wa.me/?text=${waText}`;
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.75rem 1rem;margin-top:1rem;font-size:0.78rem;color:#64748b;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;justify-content:space-between;">
    <span>⚠️ <strong>Reference rates only.</strong> Actual retail prices vary. <a href="${BASE_URL}/methodology.html" style="color:#d4a017;font-weight:600;">Methodology</a></span>
    <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.3rem 0.65rem;background:#25D366;color:white;border-radius:6px;font-weight:600;text-decoration:none;font-size:0.75rem;">
      <span>📲</span> Share on WhatsApp
    </a>
  </div>`;
}

async function hydrate() {
  const lang = getLang();
  injectSpotBar(lang, depth);
  injectNav(lang, depth);
  injectFooter(lang, depth);

  const { countrySlug, citySlug, karatSlug } = getCountryFromPath();
  const country = COUNTRIES.find((c) => c.slug === countrySlug);
  if (!country) return;

  const city = citySlug ? (country.cities || []).find((ci) => ci.slug === citySlug) : null;

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
    karatsEl.innerHTML = renderKaratCards(gold.price, rate, country.currency, karatSlug || null);
  if (freshEl) freshEl.innerHTML = renderFreshnessBadge(gold.updatedAt);
  if (disclaimerEl) disclaimerEl.innerHTML = renderDisclaimer(country, location.href);

  // Update sticky spot bar with live prices
  const aed24g = (gold.price / CONSTANTS.TROY_OZ_GRAMS) * AED_PEG;
  updateSpotBar({ xauUsd: gold.price, aed24kGram: aed24g, updatedAt: gold.updatedAt });

  if (displayEl) displayEl.style.display = '';
  if (loadingEl) loadingEl.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', hydrate);
