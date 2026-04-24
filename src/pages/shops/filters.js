/**
 * shops/filters.js - Extract filter logic from shops.js
 * Separates filter building and application logic
 */

import { countryByCode, countryName, regionName } from './helpers.js';
import { escape as esc } from '../../lib/safe-dom.js';

export function buildFilterDropdowns(SHOPS, STATE, COUNTRIES, t) {
  const regionSelect = document.getElementById('shops-region-filter');
  const countrySelect = document.getElementById('shops-country-filter');
  const citySelect = document.getElementById('shops-city-filter');
  const specialtySelect = document.getElementById('shops-specialty-filter');

  if (!regionSelect || !countrySelect || !citySelect || !specialtySelect) {
    const missing = [];
    if (!regionSelect) missing.push('shops-region-filter');
    if (!countrySelect) missing.push('shops-country-filter');
    if (!citySelect) missing.push('shops-city-filter');
    if (!specialtySelect) missing.push('shops-specialty-filter');

    const errorMsg = `[shops] CRITICAL: Filter select elements not found: ${missing.join(', ')}. Check shops.html.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const REGIONS = {
    gcc: { en: 'GCC', ar: 'الخليج' },
    levant: { en: 'Levant', ar: 'بلاد الشام' },
    africa: { en: 'Africa', ar: 'أفريقيا' },
    global: { en: 'Global', ar: 'عالمي' },
  };

  // Build region dropdown
  regionSelect.innerHTML = `<option value="all">${t('allRegions')}</option>${Object.entries(REGIONS)
    .map(([code, labels]) => `<option value="${code}">${labels[STATE.lang]}</option>`)
    .join('')}`;

  // Build country dropdown
  const shopsMatchingRegion = getShopsMatchingPrimaryFilters(SHOPS, STATE);
  const countryCodes = [...new Set(shopsMatchingRegion.map((shop) => shop.countryCode))];

  const allCountries = COUNTRIES.filter((country) =>
    SHOPS.some((shop) => shop.countryCode === country.code)
  )
    .filter((country) => STATE.region === 'all' || country.group === STATE.region)
    .sort((a, b) => countryName(a, STATE.lang).localeCompare(countryName(b, STATE.lang), STATE.lang));

  countrySelect.innerHTML = `<option value="all">${t('allCountries')}</option>${allCountries
    .filter((country) => countryCodes.includes(country.code) || STATE.country === 'all')
    .map((country) => `<option value="${country.code}">${countryName(country, STATE.lang)}</option>`)
    .join('')}`;

  // Build city dropdown
  const cityPool = SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) return false;
    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    return true;
  });

  const cities = [...new Set(cityPool.map((shop) => shop.city))].sort((a, b) => a.localeCompare(b));

  citySelect.innerHTML = `<option value="all">${t('allCities')}</option>${cities
    .map((city) => `<option value="${esc(city)}">${esc(city)}</option>`)
    .join('')}`;

  // Build specialty dropdown
  const specialties = [
    ...new Set(shopsMatchingRegion.flatMap((shop) => shop.specialties || [])),
  ].sort((a, b) => a.localeCompare(b));

  specialtySelect.innerHTML = `<option value="all">${t('allSpecialties')}</option>${specialties
    .map((item) => `<option value="${esc(item)}">${esc(item)}</option>`)
    .join('')}`;

  // Set dropdown values and validate
  regionSelect.value = STATE.region;

  if (![...countrySelect.options].some((option) => option.value === STATE.country)) {
    console.warn('[shops] Invalid country', STATE.country, 'resetting to all');
    STATE.country = 'all';
  }
  countrySelect.value = STATE.country;

  if (![...citySelect.options].some((option) => option.value === STATE.city)) {
    console.warn('[shops] Invalid city', STATE.city, 'resetting to all');
    STATE.city = 'all';
  }
  citySelect.value = STATE.city;

  if (![...specialtySelect.options].some((option) => option.value === STATE.specialty)) {
    console.warn('[shops] Invalid specialty', STATE.specialty, 'resetting to all');
    STATE.specialty = 'all';
  }
  specialtySelect.value = STATE.specialty;
}

export function getShopsMatchingPrimaryFilters(SHOPS, STATE) {
  return SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) return false;
    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    if (STATE.city !== 'all' && shop.city !== STATE.city) return false;
    return true;
  });
}

export function filterShops(SHOPS, STATE) {
  const q = STATE.search.trim().toLowerCase();
  const filtered = SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) {
      console.warn('[shops] Shop missing country:', shop.id, shop.countryCode);
      return false;
    }

    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    if (STATE.city !== 'all' && shop.city !== STATE.city) return false;
    if (STATE.specialty !== 'all' && !(shop.specialties || []).includes(STATE.specialty))
      return false;
    if (STATE.verifiedOnly && !(shop.phone || shop.website)) return false;

    if (!q) return true;

    const haystack = [
      shop.name,
      shop.city,
      shop.market,
      shop.category,
      ...(shop.specialties || []),
      shop.notes,
      country.nameEn,
      country.nameAr,
      regionName(country.group, STATE.lang),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });

  console.log('[shops] filterShops:', SHOPS.length, 'total ->', filtered.length, 'after filtering');
  return filtered;
}
