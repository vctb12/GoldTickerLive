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

// Determine depth from script's own src attribute
const scriptEl = document.currentScript;
const scriptSrc = scriptEl?.src || '';
// Count how many ../ are in the relative path to this file
const selfPathMatch = scriptSrc.match(/(\.\.\/)+lib\/page-hydrator\.js/);
const depth = selfPathMatch ? (selfPathMatch[0].match(/\.\.\//g) || []).length : 0;

const AED_PEG = CONSTANTS.AED_PEG;
const TROY_OZ_GRAMS = CONSTANTS.TROY_OZ_GRAMS;
const BASE_URL = 'https://vctb12.github.io/Gold-Prices';

function getLang() {
  try {
    const p = JSON.parse(localStorage.getItem(CONSTANTS.CACHE_KEYS.userPrefs) || '{}');
    const urlLang = new URLSearchParams(location.search).get('lang');
    return urlLang || p.lang || 'en';
  } catch { return 'en'; }
}

function getCountryFromPath() {
  const path = location.pathname.replace('/Gold-Prices', '').replace(/^\/|\/$/g, '');
  const parts = path.split('/');
  const countrySlug = parts[0];
  const citySlug = parts[1];
  const type = parts[2]; // 'gold-price', 'gold-prices', 'gold-shops', 'gold-rate'
  const karatSlug = parts[3]; // '22-karat'
  return { countrySlug, citySlug, type, karatSlug, parts };
}

function calcLocalPrice(spotUsdPerOz, purity, fxRate) {
  const usdPerGram = (spotUsdPerOz / TROY_OZ_GRAMS) * purity;
  return usdPerGram * fxRate;
}

async function fetchPrices() {
  try {
    const [goldRes, fxRes] = await Promise.allSettled([api.fetchGold(), api.fetchFX()]);
    const gold = goldRes.status === 'fulfilled' ? goldRes.value
      : (() => { const fb = cache.getFallbackGoldPrice(); return fb ? { price: fb.price, updatedAt: fb.updatedAt } : null; })();
    const fx = fxRes.status === 'fulfilled' ? fxRes.value
      : (() => { const fb = cache.getFallbackFXRates(); return fb ? { rates: fb.rates } : { rates: {} }; })();
    return { gold, fx };
  } catch {
    const fb = cache.getFallbackGoldPrice();
    return { gold: fb ? { price: fb.price, updatedAt: fb.updatedAt } : null, fx: { rates: {} } };
  }
}

function renderKaratCards(spot, fxRate, currency, karatFilter = null) {
  const karatsToShow = karatFilter
    ? KARATS.filter(k => k.code === String(karatFilter).replace('-karat', ''))
    : KARATS.filter(k => ['24', '22', '21', '18'].includes(k.code));

  return karatsToShow.map(k => {
    const price = calcLocalPrice(spot, k.purity, fxRate);
    const priceStr = formatPrice(price, currency, 2);
    return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:1.25rem;text-align:center;">
      <div style="font-size:0.8rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${k.code}K Gold</div>
      <div style="font-size:1.5rem;font-weight:700;color:#1e293b;margin:0.25rem 0;">${priceStr}</div>
      <div style="font-size:0.75rem;color:#94a3b8;">per gram</div>
    </div>`;
  }).join('');
}

function renderFreshnessBadge(updatedAt) {
  const { label, state } = formatFreshness(updatedAt);
  const colors = { live: '#10b981', recent: '#f59e0b', stale: '#f97316', cached: '#ef4444', error: '#6b7280' };
  const color = colors[state] || '#6b7280';
  return `<span style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.8rem;color:${color};font-weight:500;">
    <span style="width:7px;height:7px;border-radius:50%;background:${color};display:inline-block;"></span>
    ${label}
  </span>`;
}

async function hydrate() {
  const lang = getLang();
  injectNav(lang, depth);
  injectFooter(lang, depth);

  const { countrySlug, citySlug, karatSlug } = getCountryFromPath();
  const country = COUNTRIES.find(c => c.slug === countrySlug);
  if (!country) return;

  const city = citySlug ? (country.cities || []).find(ci => ci.slug === citySlug) : null;

  const loadingEl = document.getElementById('price-loading');
  const displayEl = document.getElementById('price-display');
  const karatsEl  = document.getElementById('karat-cards');
  const freshEl   = document.getElementById('freshness-badge');

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

  if (karatsEl) karatsEl.innerHTML = renderKaratCards(gold.price, rate, country.currency, karatSlug || null);
  if (freshEl) freshEl.innerHTML = renderFreshnessBadge(gold.updatedAt);

  if (displayEl) displayEl.style.display = '';
  if (loadingEl) loadingEl.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', hydrate);
