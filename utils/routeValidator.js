/**
 * utils/routeValidator.js
 * Validates route parameters before rendering or linking.
 * Rejects invalid country/city/karat combinations early.
 */
import { COUNTRIES } from '../config/countries.js';
import { KARATS } from '../config/karats.js';

/**
 * Validate a country slug.
 * @param {string} slug
 * @returns {{ valid: boolean, country?: Object, error?: string }}
 */
export function validateCountry(slug) {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Country slug is required' };
  }
  const country = COUNTRIES.find(c => c.slug === slug);
  if (!country) {
    return { valid: false, error: `Unknown country: ${slug}` };
  }
  if (!country.cities || country.cities.length === 0) {
    return { valid: false, error: `Country "${slug}" has no city pages` };
  }
  return { valid: true, country };
}

/**
 * Validate a city slug within a country.
 * @param {string} countrySlug
 * @param {string} citySlug
 * @returns {{ valid: boolean, country?: Object, city?: Object, error?: string }}
 */
export function validateCity(countrySlug, citySlug) {
  const countryResult = validateCountry(countrySlug);
  if (!countryResult.valid) return countryResult;

  if (!citySlug || typeof citySlug !== 'string') {
    return { valid: false, error: 'City slug is required' };
  }

  const city = countryResult.country.cities.find(c => c.slug === citySlug);
  if (!city) {
    return { valid: false, error: `Unknown city "${citySlug}" in country "${countrySlug}"` };
  }

  return { valid: true, country: countryResult.country, city };
}

/**
 * Validate a karat code.
 * @param {string} karatCode  e.g. '22'
 * @returns {{ valid: boolean, karat?: Object, error?: string }}
 */
export function validateKarat(karatCode) {
  if (!karatCode || typeof karatCode !== 'string') {
    return { valid: false, error: 'Karat code is required' };
  }
  const code = karatCode.replace('-karat', '');
  const karat = KARATS.find(k => k.code === code);
  if (!karat) {
    return { valid: false, error: `Unknown karat: ${karatCode}` };
  }
  return { valid: true, karat };
}

/**
 * Validate a full route parameter set.
 * @param {Object} params
 * @param {string} [params.country]
 * @param {string} [params.city]
 * @param {string} [params.karat]
 * @returns {{ valid: boolean, error?: string, country?: Object, city?: Object, karat?: Object }}
 */
export function validateRoute({ country, city, karat } = {}) {
  // If karat is specified, city must be too
  if (karat && !city) {
    return { valid: false, error: 'Karat pages require a city' };
  }
  // If city is specified, country must be too
  if (city && !country) {
    return { valid: false, error: 'City pages require a country' };
  }

  let countryObj, cityObj, karatObj;

  if (country) {
    const cr = validateCountry(country);
    if (!cr.valid) return cr;
    countryObj = cr.country;
  }

  if (city) {
    const cir = validateCity(country, city);
    if (!cir.valid) return cir;
    cityObj = cir.city;
  }

  if (karat) {
    const kr = validateKarat(karat);
    if (!kr.valid) return kr;
    karatObj = kr.karat;
  }

  return { valid: true, country: countryObj, city: cityObj, karat: karatObj };
}
