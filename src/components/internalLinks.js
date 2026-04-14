/**
 * components/internalLinks.js
 * Generates internal link blocks for SEO and navigation.
 * Given a route object, produces parent, sibling, child, and cross-type links.
 */
import { COUNTRIES } from '../config/countries.js';

const BASE_URL = 'https://vctb12.github.io/Gold-Prices';

/**
 * Generate HTML for internal link blocks.
 * @param {{ type, country, city, countryObj, cityObj }} route
 * @returns {string} HTML string
 */
export function generateInternalLinks(route) {
  const sections = [];

  if (route.type === 'country-landing' && route.countryObj) {
    // Children: all city price pages
    const cities = route.countryObj.cities || [];
    if (cities.length) {
      const links = cities
        .map(
          (city) =>
            `<a href="${BASE_URL}/${route.country}/${city.slug}/gold-prices/" class="internal-link">${city.nameEn} Gold Price</a>`
        )
        .join('\n');
      sections.push(
        `<div class="internal-links-section"><h3>Cities in ${route.countryObj.nameEn}</h3><div class="internal-links-grid">${links}</div></div>`
      );
    }
    // Sibling: other countries in same region
    const siblings = COUNTRIES.filter(
      (c) => c.group === route.countryObj.group && c.slug !== route.country && c.slug
    );
    if (siblings.length) {
      const links = siblings
        .slice(0, 6)
        .map(
          (c) =>
            `<a href="${BASE_URL}/${c.slug}/gold-price/" class="internal-link">${c.nameEn} Gold</a>`
        )
        .join('\n');
      sections.push(
        `<div class="internal-links-section"><h3>Related Countries</h3><div class="internal-links-grid">${links}</div></div>`
      );
    }
  }

  if (route.type === 'city-prices' && route.countryObj && route.cityObj) {
    // Parent
    sections.push(
      `<div class="internal-links-section"><a href="${BASE_URL}/${route.country}/gold-price/" class="internal-link internal-link--parent">← ${route.countryObj.nameEn} Gold Price Overview</a></div>`
    );
    // Cross-type: shops
    sections.push(
      `<div class="internal-links-section"><a href="${BASE_URL}/${route.country}/${route.city}/gold-shops/" class="internal-link internal-link--cross">Gold Shops in ${route.cityObj.nameEn} →</a></div>`
    );
    // Siblings
    const siblings = (route.countryObj.cities || []).filter((c) => c.slug !== route.city);
    if (siblings.length) {
      const links = siblings
        .slice(0, 5)
        .map(
          (c) =>
            `<a href="${BASE_URL}/${route.country}/${c.slug}/gold-prices/" class="internal-link">${c.nameEn}</a>`
        )
        .join('\n');
      sections.push(
        `<div class="internal-links-section"><h3>Other Cities</h3><div class="internal-links-grid">${links}</div></div>`
      );
    }
  }

  if (route.type === 'city-shops' && route.countryObj && route.cityObj) {
    sections.push(
      `<div class="internal-links-section"><a href="${BASE_URL}/${route.country}/${route.city}/gold-prices/" class="internal-link internal-link--cross">Gold Prices in ${route.cityObj.nameEn} →</a></div>`
    );
    sections.push(
      `<div class="internal-links-section"><a href="${BASE_URL}/${route.country}/gold-price/" class="internal-link internal-link--parent">← ${route.countryObj.nameEn} Gold Price Overview</a></div>`
    );
  }

  if (!sections.length) return '';
  return `<section class="internal-links">${sections.join('\n')}</section>`;
}
