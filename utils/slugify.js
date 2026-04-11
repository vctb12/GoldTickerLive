/**
 * utils/slugify.js
 * Slug utilities — uses canonical slugs from config for countries/cities,
 * generic kebab-case only for karats and units.
 */
import { COUNTRIES } from '../config/countries.js';
import { KARATS } from '../config/karats.js';

/**
 * Convert karat code to URL slug.
 * @param {string} karatCode  e.g. '22'
 * @returns {string}          e.g. '22-karat'
 */
export function karatToSlug(karatCode) {
  return `${karatCode}-karat`;
}

/**
 * Convert URL slug back to karat code.
 * @param {string} slug  e.g. '22-karat'
 * @returns {string}     e.g. '22'
 */
export function slugToKarat(slug) {
  return slug.replace('-karat', '');
}

/**
 * Get canonical URL slug for a country by its code.
 * @param {string} countryCode  e.g. 'AE'
 * @returns {string|null}
 */
export function countryCodeToSlug(countryCode) {
  return COUNTRIES.find(c => c.code === countryCode)?.slug ?? null;
}

/**
 * Get canonical URL slug for a city.
 * @param {string} countrySlug  e.g. 'uae'
 * @param {string} cityNameEn   e.g. 'Dubai'
 * @returns {string|null}
 */
export function cityToSlug(countrySlug, cityNameEn) {
  const country = COUNTRIES.find(c => c.slug === countrySlug);
  return (country?.cities || []).find(ci => ci.nameEn === cityNameEn)?.slug ?? null;
}

/**
 * Generic kebab-case slugify for simple strings.
 * Only use this for things not in the config (karat labels, units, etc.)
 * @param {string} str
 * @returns {string}
 */
export function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
