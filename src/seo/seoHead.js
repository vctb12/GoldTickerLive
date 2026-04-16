/**
 * seo/seoHead.js
 * Reusable SEO component that injects all required meta tags, Open Graph,
 * Twitter Cards, hreflang alternates, canonical, and JSON-LD schemas.
 *
 * Every page can import and call applySeoHead(config) to emit a full
 * standards-compliant <head> metadata block.
 *
 * @example
 *   import { applySeoHead } from '../src/seo/seoHead.js';
 *   applySeoHead({
 *     type: 'city',
 *     country: 'Egypt',
 *     city: 'Cairo',
 *     lang: 'en',
 *     currency: 'EGP',
 *     date: '2026-04-16',
 *   });
 */

const SITE_NAME = 'GoldPrices';
const SITE_URL = 'https://www.goldtickerlive.com';
const OG_IMAGE = `${SITE_URL}/assets/og-image.png`;

/**
 * @typedef SeoConfig
 * @property {'home'|'country'|'city'|'shops'|'karat'} type
 * @property {string}  [country]   - Country name (English)
 * @property {string}  [city]      - City name (English)
 * @property {string}  [karat]     - e.g. '24K', '22K', '21K', '18K'
 * @property {'en'|'ar'} lang
 * @property {number}  [price]     - Current price (for structured data)
 * @property {string}  [currency]  - ISO currency code
 * @property {string}  date        - ISO date string (YYYY-MM-DD)
 * @property {string}  [countrySlug] - URL slug for the country
 * @property {string}  [citySlug]    - URL slug for the city
 * @property {Array<{q:string,a:string}>} [faq] - FAQ items for FAQPage schema
 */

/**
 * Build all metadata for a given page config.
 * @param {SeoConfig} cfg
 * @returns {{ title, description, canonical, hreflang, og, twitter, jsonLd }}
 */
export function buildSeoMeta(cfg) {
  const { type, country, city, karat, lang, price, currency, date, countrySlug, citySlug, faq } =
    cfg;

  let title, description, canonical, breadcrumbs;

  switch (type) {
    case 'home':
      title = `Live Gold Prices Today — UAE, GCC & Arab World | ${SITE_NAME}`;
      description =
        'Track live gold spot prices in 24+ countries across GCC, Levant and Africa. 24K, 22K, 21K, 18K per gram. Updated every 90 seconds.';
      canonical = `${SITE_URL}/`;
      breadcrumbs = [{ name: 'Home', url: canonical }];
      break;

    case 'country':
      title = `Gold Price in ${country} Today — 24K, 22K, 21K, 18K in ${currency || 'Local Currency'} | ${SITE_NAME}`;
      description = `Live ${country} gold prices in ${currency || 'local currency'}. 24K, 22K, 21K and 18K per gram and ounce. Updated every 90 seconds.`;
      canonical = `${SITE_URL}/countries/${countrySlug}/gold-price/`;
      breadcrumbs = [
        { name: 'Home', url: `${SITE_URL}/` },
        { name: `${country} Gold Price`, url: canonical },
      ];
      break;

    case 'city':
      title = `Gold Price in ${city}, ${country} Today — ${currency || ''} per Gram | ${SITE_NAME}`;
      description = `Live 24K, 22K, 21K, 18K gold prices in ${city}, ${country}. Compare ${currency || 'local'} rates per gram. Updated every 90 seconds.`;
      canonical = `${SITE_URL}/countries/${countrySlug}/${citySlug}/gold-prices/`;
      breadcrumbs = [
        { name: 'Home', url: `${SITE_URL}/` },
        { name: `${country} Gold`, url: `${SITE_URL}/countries/${countrySlug}/gold-price/` },
        { name: `${city} Gold Prices`, url: canonical },
      ];
      break;

    case 'shops':
      title = `Gold Shops in ${city || country} — Dealers & Jewellers | ${SITE_NAME}`;
      description = `Directory of gold shops and dealers in ${city || country}${city ? `, ${country}` : ''}. Find listings with contact information.`;
      canonical = citySlug
        ? `${SITE_URL}/countries/${countrySlug}/${citySlug}/gold-shops/`
        : `${SITE_URL}/shops.html`;
      breadcrumbs = [
        { name: 'Home', url: `${SITE_URL}/` },
        ...(countrySlug
          ? [
              {
                name: `${country} Gold`,
                url: `${SITE_URL}/countries/${countrySlug}/gold-price/`,
              },
            ]
          : []),
        { name: `Gold Shops in ${city || country}`, url: canonical },
      ];
      break;

    case 'karat':
      title = `${karat} Gold Price in ${city}, ${country} Today — ${currency || ''} per Gram | ${SITE_NAME}`;
      description = `Live ${karat} gold price in ${city}, ${country}. ${currency || 'Local currency'} per gram, per ounce, per tola. Updated every 90 seconds.`;
      canonical = `${SITE_URL}/countries/${countrySlug}/${citySlug}/gold-rate/${karat.toLowerCase().replace('k', '')}-karat/`;
      breadcrumbs = [
        { name: 'Home', url: `${SITE_URL}/` },
        { name: `${country} Gold`, url: `${SITE_URL}/countries/${countrySlug}/gold-price/` },
        {
          name: `${city} Prices`,
          url: `${SITE_URL}/countries/${countrySlug}/${citySlug}/gold-prices/`,
        },
        { name: `${karat} Gold`, url: canonical },
      ];
      break;

    default:
      title = `${SITE_NAME} — Live Gold Prices`;
      description = 'Live gold prices for UAE, GCC and Arab World.';
      canonical = `${SITE_URL}/`;
      breadcrumbs = [{ name: 'Home', url: `${SITE_URL}/` }];
  }

  const hreflang = [
    { rel: 'alternate', hreflang: 'x-default', href: canonical },
    { rel: 'alternate', hreflang: 'en', href: canonical },
    {
      rel: 'alternate',
      hreflang: 'ar',
      href: `${canonical}${canonical.includes('?') ? '&' : '?'}lang=ar`,
    },
  ];

  const og = {
    'og:title': title,
    'og:description': description,
    'og:url': canonical,
    'og:image': OG_IMAGE,
    'og:type': 'website',
    'og:site_name': SITE_NAME,
    'og:locale': lang === 'ar' ? 'ar_SA' : 'en_US',
  };

  const twitter = {
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': OG_IMAGE,
  };

  const jsonLd = buildJsonLd({
    type,
    title,
    description,
    canonical,
    breadcrumbs,
    price,
    currency,
    date,
    faq,
  });

  return { title, description, canonical, hreflang, og, twitter, jsonLd };
}

/**
 * Build JSON-LD structured data for the page.
 * Emits BreadcrumbList + optional FAQPage + optional PriceSpecification.
 */
function buildJsonLd({
  type,
  title,
  description,
  canonical,
  breadcrumbs,
  price,
  currency,
  date,
  faq,
}) {
  const graph = [];

  // WebPage
  graph.push({
    '@type': 'WebPage',
    '@id': canonical,
    name: title,
    description,
    url: canonical,
    inLanguage: 'en',
    ...(date ? { dateModified: date } : {}),
  });

  // BreadcrumbList
  if (breadcrumbs?.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.name,
        item: b.url,
      })),
    });
  }

  // FAQPage
  if (faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  // Product price (for city/karat pages with live prices)
  if (price && currency && (type === 'city' || type === 'karat')) {
    graph.push({
      '@type': 'UnitPriceSpecification',
      price: String(price),
      priceCurrency: currency,
      unitCode: 'GRM',
      ...(date ? { validFrom: date } : {}),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * Inject all SEO tags into document.head at runtime.
 * Safe to call multiple times — previous tags with matching IDs are replaced.
 * @param {SeoConfig} cfg
 */
export function applySeoHead(cfg) {
  const meta = buildSeoMeta(cfg);

  // Title
  document.title = meta.title;

  // Meta description
  _setMeta('description', meta.description);

  // Canonical
  _setLink('canonical', meta.canonical);

  // Hreflang alternates
  _removeAll('link[data-seo-hreflang]');
  for (const h of meta.hreflang) {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = h.hreflang;
    link.href = h.href;
    link.dataset.seoHreflang = '';
    document.head.appendChild(link);
  }

  // Open Graph tags
  for (const [prop, content] of Object.entries(meta.og)) {
    _setMetaProperty(prop, content);
  }

  // Twitter Card tags
  for (const [name, content] of Object.entries(meta.twitter)) {
    _setMeta(name, content);
  }

  // JSON-LD
  let ldScript = document.getElementById('seo-jsonld');
  if (!ldScript) {
    ldScript = document.createElement('script');
    ldScript.id = 'seo-jsonld';
    ldScript.type = 'application/ld+json';
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(meta.jsonLd);

  return meta;
}

/* ── Internal helpers ─────────────────────────────────────────────── */

function _setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function _setMetaProperty(prop, content) {
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.content = content;
}

function _setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function _removeAll(selector) {
  document.querySelectorAll(selector).forEach((el) => el.remove());
}
