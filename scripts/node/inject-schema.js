#!/usr/bin/env node
/**
 * scripts/node/inject-schema.js
 * Injects JSON-LD structured data into HTML pages for better SEO.
 *
 * Adds schema.org markup for:
 * - Organization (homepage)
 * - BreadcrumbList (all pages)
 * - WebSite with SearchAction (homepage)
 * - Dataset (+ FAQPage) for reference/price pages (non-commercial — no Offer)
 * - Article for content pages
 *
 * Usage:
 *   node scripts/node/inject-schema.js              # inject into all pages
 *   node scripts/node/inject-schema.js --check      # validate existing schema
 *   node scripts/node/inject-schema.js --file path  # inject into specific file
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SITE_URL = 'https://goldtickerlive.com';
const SITE_NAME = 'Gold Ticker Live';
const SITE_DESCRIPTION =
  'Spot-linked reference gold prices for GCC, Arab world and global markets — with visible freshness labels';

// ── Trusted local config loaders ────────────────────────────────────────────
// data/shops.js and src/config/countries.js are ES modules that can't be
// require()'d from this CommonJS script, so we extract the exported array
// literal and evaluate it in an isolated VM context (same pattern as
// build/generateSitemap.js). These feed the shops ItemList and country-hub
// Dataset schemas below. Failures degrade gracefully to an empty list — the
// injector must never crash a build because a data file moved.
const vm = require('vm');

function evalArrayLiteral(src) {
  return vm.runInNewContext(`(${src})`, Object.create(null), { timeout: 2000 });
}

function loadExportedArray(relPath, exportName) {
  try {
    const raw = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    const match = raw.match(new RegExp(`export const ${exportName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`));
    if (!match) return [];
    return evalArrayLiteral(match[1]);
  } catch {
    return [];
  }
}

const SHOPS = loadExportedArray('data/shops.js', 'SHOPS');
const COUNTRIES = loadExportedArray('src/config/countries.js', 'COUNTRIES');
const COUNTRY_BY_SLUG = new Map(COUNTRIES.filter((c) => c && c.slug).map((c) => [c.slug, c]));

// ── Schema Templates ────────────────────────────────────────────────────────

/**
 * Organization schema for homepage
 */
function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/assets/favicon-512x512.png`,
    description: SITE_DESCRIPTION,
    sameAs: ['https://twitter.com/goldtickerlive', 'https://x.com/GoldTickerLive'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Arabic'],
    },
  };
}

/**
 * WebSite schema with search action for homepage
 */
function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/content/search/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['en', 'ar'],
  };
}

/**
 * BreadcrumbList schema
 * @param {Array<{name: string, url: string}>} items
 */
function getBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Article schema for content pages
 * @param {Object} options
 */
function getArticleSchema(options) {
  const { headline, description, datePublished, dateModified, url, inLanguage = 'en' } = options;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/assets/favicon-512x512.png`,
        width: 512,
        height: 512,
      },
    },
    inLanguage,
  };
}

/**
 * FAQPage schema for pages with FAQ content.
 * @param {Array<{q: string, a: string}>} questions
 */
function getFAQPageSchema(questions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

function extractContentPanelFaq(content) {
  const panelRegex =
    /<section class="content-panel"[\s\S]*?<h2>([\s\S]*?)<\/h2>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<\/section>/gi;
  const faqItems = [];
  let match = panelRegex.exec(content);

  while (match) {
    faqItems.push({
      q: match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
      a: match[2]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    });
    match = panelRegex.exec(content);
  }

  return faqItems;
}

/**
 * Dataset schema for price data pages.
 * @param {Object} options
 */
function getDatasetSchema(options) {
  const { name, description, url, variableMeasured = 'Gold price per gram' } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url,
    creator: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    license: `${SITE_URL}/terms.html`,
    variableMeasured,
    isAccessibleForFree: true,
    inLanguage: ['en', 'ar'],
  };
}

/**
 * ItemList of gold-shop / gold-market directory listings for shops.html.
 *
 * Honesty contract (AGENTS.md "schema must match visible content"): the
 * directory page explicitly frames most listings as "market areas or dealer
 * clusters, not a single shop", and `data/shops.js` carries NO verified phone,
 * website, opening hours, rating, or review data. We therefore emit ONLY the
 * fields that are real and visible on each card — name, locality (city),
 * country, and the served area — and deliberately omit telephone, geo,
 * openingHours, aggregateRating, review, and any Offer/priceRange. This keeps
 * the markup truthful and avoids a Google structured-data policy violation.
 *
 * @param {Array<Object>} shops - SHOPS from data/shops.js
 */
function getShopsDirectorySchema(shops) {
  if (!Array.isArray(shops) || shops.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Gold Shops & Markets Directory',
    description:
      'Editorially listed gold shops and known gold markets across the GCC, Levant, North Africa, and India.',
    url: `${SITE_URL}/shops.html`,
    numberOfItems: shops.length,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: shops.map((shop, index) => {
      const area = [shop.market, shop.city].filter(Boolean).join(', ');
      const descParts = [shop.category, shop.market].filter(Boolean);
      const store = {
        '@type': 'JewelryStore',
        name: shop.name,
        address: {
          '@type': 'PostalAddress',
          addressLocality: shop.city,
          addressCountry: shop.countryCode,
        },
      };
      if (area) store.areaServed = area;
      if (descParts.length) store.description = descParts.join(' · ');
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: store,
      };
    }),
  };
}

/**
 * WebApplication schema for the calculator tool page.
 *
 * featureList mirrors the five tabs that are actually rendered on the page
 * (value, scrap, Zakat, buying power, unit converter), so the markup matches
 * visible content. The tool is free and runs in the browser — represented with
 * a zero-price Offer and isAccessibleForFree, no fabricated review/rating.
 *
 * @param {Object} options
 */
function getCalculatorAppSchema({ url, description }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Gold Calculator',
    url,
    description,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Gold value calculator (any weight and karat)',
      'Scrap / melt gold value calculator',
      'Zakat on gold calculator (2.5%)',
      'Buying power calculator',
      'Gold weight unit converter',
    ],
    inLanguage: ['en', 'ar'],
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// ── URL to Breadcrumb Parser ────────────────────────────────────────────────

/**
 * Generate breadcrumb items from URL path.
 *
 * The last item uses `canonicalUrl` when provided so the schema item URL
 * matches the page's `<link rel="canonical">` exactly (preserving `.html`
 * extensions where required by the host).
 *
 * @param {string} urlPath     - e.g. "/tracker" (extension already stripped)
 * @param {string|null} [canonicalUrl] - Canonical URL for the current page,
 *   extracted from `<link rel="canonical">`. Used for the final breadcrumb
 *   item so schema URLs align with canonicals.
 * @returns {Array<{name: string, url: string}>}
 */
function generateBreadcrumbs(urlPath, canonicalUrl = null) {
  const items = [{ name: 'Home', url: SITE_URL }];

  if (urlPath === '/' || urlPath === '/index.html') {
    return items;
  }

  const parts = urlPath
    .replace(/\.html$/, '')
    .split('/')
    .filter(Boolean);
  let currentPath = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    currentPath += `/${part}`;

    // Humanize the part (replace hyphens, capitalize) with locale-aware fixes.
    const prevPart = i > 0 ? parts[i - 1] : '';
    const arabicSectionLabels = {
      tools: 'أدوات',
      guides: 'أدلة',
      content: 'المحتوى',
      countries: 'الدول',
      learn: 'تعلّم',
      insights: 'رؤى',
      markets: 'الأسواق',
      faq: 'الأسئلة الشائعة',
    };
    const name =
      part === 'ar'
        ? arabicSectionLabels[prevPart] || 'العربية'
        : part
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

    // For the last crumb, prefer the canonical URL so the item URL matches
    // the page's own canonical (e.g. "…/tracker.html" not "…/tracker").
    const isLast = i === parts.length - 1;
    const url = isLast && canonicalUrl ? canonicalUrl : `${SITE_URL}${currentPath}`;

    items.push({ name, url });
  }

  return items;
}

// ── Page Type Detection ─────────────────────────────────────────────────────

/**
 * Detect page type from file path and content
 * @param {string} filePath
 * @param {string} content
 * @returns {string} - 'homepage' | 'country' | 'city' | 'price' | 'article' | 'generic'
 */
function detectPageType(filePath, _content) {
  const relativePath = path.relative(ROOT, filePath);

  if (relativePath === 'index.html') return 'homepage';
  if (relativePath.includes('/gold-price') || relativePath.includes('/gold-rate')) return 'price';
  if (relativePath.includes('/countries/')) return 'country';
  if (
    relativePath.includes('/guides/') ||
    relativePath.startsWith('content/') ||
    relativePath.includes('/content/')
  ) {
    return 'article';
  }
  if (relativePath.includes('/calculator') || relativePath.includes('/tools')) return 'tool';

  return 'generic';
}

// ── Schema Injection ────────────────────────────────────────────────────────

/**
 * Generate appropriate schemas for a page
 * @param {string} filePath
 * @param {string} content
 * @returns {Array<Object>} array of schema objects
 */
function generateSchemasForPage(filePath, content) {
  const pageType = detectPageType(filePath, content);
  const schemas = [];

  // Get URL path from file path
  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const urlPath = '/' + relativePath.replace(/index\.html$/, '').replace(/\.html$/, '');

  // Extract title from HTML
  const titleMatch = content.match(/<title>([^<]+)<\/title>/);
  const pageTitle = titleMatch ? titleMatch[1].replace(/&amp;/g, '&') : '';

  // Extract description from meta tag
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/);
  const pageDescription = descMatch ? descMatch[1] : '';

  // Extract canonical URL from <link rel="canonical"> — used to align
  // BreadcrumbList item URLs with the page's own canonical declaration.
  const canonicalMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;
  const langMatch = content.match(/<html[^>]*lang=["']([^"']+)["']/i);
  const pageLanguage = langMatch ? langMatch[1].split('-')[0] : 'en';

  // Homepage gets Organization + WebSite schemas
  if (pageType === 'homepage') {
    schemas.push(getOrganizationSchema());
    schemas.push(getWebSiteSchema());
  }

  // All pages get breadcrumb schema (except homepage)
  if (pageType !== 'homepage') {
    const breadcrumbs = generateBreadcrumbs(urlPath, canonicalUrl);
    if (breadcrumbs.length > 1) {
      schemas.push(getBreadcrumbSchema(breadcrumbs));
    }
  }

  // Reference/price pages get FAQPage + Dataset schemas only.
  //
  // These pages publish non-commercial reference/spot prices and sell nothing,
  // so they must NOT emit Product/Offer/AggregateOffer markup (doing so would
  // mark up retail offers the page doesn't show — a schema-honesty violation
  // that risks a Google manual action). The non-commercial Dataset schema below
  // is the correct representation of the price data these pages display.
  if (pageType === 'price') {
    // Extract karat from path (used by the Dataset variableMeasured label).
    const karatMatch = relativePath.match(/(\d+k)/i);

    // Extract currency code from page title.
    // Handles multiple formats:
    //   "— SAR reference rates" (country gold-price pages)
    //   "— AED per Gram" (city gold-price and karat pages)
    //   "in AED |" (some city-level pages)
    const currencyMatch =
      pageTitle.match(/—\s*([A-Z]{3})\s+reference rates/) ||
      pageTitle.match(/—\s*([A-Z]{3})\s+per Gram/i) ||
      pageTitle.match(/\bin\s+([A-Z]{3})\s*[|,]/);
    const currency = currencyMatch ? currencyMatch[1] : 'AED';

    // Extract FAQ data from embedded country-page-data JSON (body script tag)
    const pageDataMatch = content.match(
      /<script[^>]+id=["']country-page-data["'][^>]*>([\s\S]*?)<\/script>/i
    );
    if (pageDataMatch) {
      try {
        const pageData = JSON.parse(pageDataMatch[1]);
        const faqItems = pageData.faqEn || [];
        if (faqItems.length > 0) {
          schemas.push(getFAQPageSchema(faqItems));
        }
      } catch {
        // Malformed JSON — skip FAQ schema
      }
    }

    // Dataset schema for the price data
    const pageUrl = canonicalUrl || `${SITE_URL}${urlPath}`;
    const karatLabel = karatMatch ? karatMatch[1].toUpperCase() : '24K';
    schemas.push(
      getDatasetSchema({
        name: pageTitle,
        description: pageDescription,
        url: pageUrl,
        variableMeasured: `${karatLabel} gold price per gram in ${currency}`,
      })
    );
  }

  // Article pages get Article schema
  if (pageType === 'article') {
    // Preserve existing publication dates across rebuilds. Re-running the
    // injector must NOT bump datePublished/dateModified — doing so would falsely
    // signal republication across the content hub on every schema regeneration.
    // Reuse the dates already present in the page's Article JSON-LD; only fall
    // back to the file mtime for brand-new pages that have no Article date yet.
    const existingPublished = content.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
    const existingModified = content.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
    const mtimeDate = fs.statSync(filePath).mtime.toISOString().split('T')[0];
    const datePublished = existingPublished ? existingPublished[1] : mtimeDate;
    const dateModified = existingModified ? existingModified[1] : datePublished;

    schemas.push(
      getArticleSchema({
        headline: pageTitle,
        description: pageDescription,
        url: canonicalUrl || `${SITE_URL}${urlPath}`,
        datePublished,
        dateModified,
        inLanguage: pageLanguage,
      })
    );

    if (relativePath === 'content/faq/index.html') {
      const faqItems = extractContentPanelFaq(content);
      if (faqItems.length > 0) {
        schemas.push(getFAQPageSchema(faqItems));
      }
    }
  }

  // Shops directory — ItemList of JewelryStore listings (from data/shops.js).
  if (relativePath === 'shops.html') {
    const itemList = getShopsDirectorySchema(SHOPS);
    if (itemList) schemas.push(itemList);
  }

  // Calculator tool — WebApplication describing the five calculator tools.
  if (relativePath === 'calculator.html') {
    schemas.push(
      getCalculatorAppSchema({
        url: canonicalUrl || `${SITE_URL}${urlPath}`,
        description: pageDescription || SITE_DESCRIPTION,
      })
    );
  }

  // Tracker — WebApplication (gold price terminal with live data, karat table, chart).
  if (relativePath === 'tracker.html') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Gold Price Tracker',
      url: canonicalUrl || `${SITE_URL}/tracker.html`,
      description:
        pageDescription ||
        'Spot-linked reference gold price tracker with XAU/USD data, multi-karat table, historical charts, and currency conversion — freshness labels visible on page.',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'XAU/USD spot-linked reference price (freshness label on page)',
        'Multi-karat reference table (24K–14K)',
        'Historical price chart (7D–5Y)',
        'Currency comparison (AED and majors)',
        'Price alerts',
        'Export to CSV/JSON',
      ],
      inLanguage: ['en', 'ar'],
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    });
  }

  // Compare countries tool — WebApplication for multi-country gold price comparison.
  if (relativePath === 'compare.html') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Gold Price Country Comparison',
      url: canonicalUrl || `${SITE_URL}/compare.html`,
      description:
        pageDescription ||
        'Compare gold prices across GCC and global countries side by side, with karat breakdowns and VAT/making-charge estimates.',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Side-by-side gold price comparison across countries',
        'Per-karat breakdown (24K–14K)',
        'VAT and making-charge retail estimate',
        'Cheapest-to-buy country callout',
      ],
      inLanguage: ['en', 'ar'],
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
    });
  }

  // Country hub (countries/{slug}/index.html, indexable) — add a Dataset for
  // the reference price data the page displays. FAQPage is injected at runtime
  // by country-page.js alongside the visible FAQ (parity-correct), so it is not
  // duplicated here; BreadcrumbList is already added above. The deeper
  // /{slug}/gold-price/ variant is noindex and skipped by the injector.
  const hubMatch = relativePath.match(/^countries\/([^/]+)\/index\.html$/);
  if (hubMatch && COUNTRY_BY_SLUG.has(hubMatch[1])) {
    const country = COUNTRY_BY_SLUG.get(hubMatch[1]);
    schemas.push(
      getDatasetSchema({
        name: pageTitle,
        description: pageDescription,
        url: canonicalUrl || `${SITE_URL}${urlPath}`,
        variableMeasured: `Gold price per gram in ${country.currency}`,
      })
    );
  }

  return schemas;
}

/**
 * Inject schemas into HTML content
 * @param {string} content - HTML content
 * @param {Array<Object>} schemas - Array of schema objects
 * @returns {string} modified HTML
 */
function injectSchemas(content, schemas) {
  if (schemas.length === 0) return content;

  // Remove existing JSON-LD schema blocks (including any trailing blank line).
  // We strip trailing whitespace from each removal but avoid consuming the
  // newline that belongs to the NEXT element. Then we collapse multiple blank
  // lines left behind so each run produces the same result (idempotency).
  if (content.includes('application/ld+json')) {
    // Remove each schema block without consuming unrelated trailing content.
    content = content.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>[ \t]*\r?\n?/gi,
      ''
    );
    // Collapse 2+ consecutive blank lines (a blank line is an empty or
    // whitespace-only line between two newlines) down to a single blank line.
    content = content.replace(/(\n[ \t]*){2,}\n/g, '\n\n');
  }

  // Generate schema script tags
  const schemaScripts = schemas
    .map((schema) => {
      const json = JSON.stringify(schema, null, 2);
      return `  <script type="application/ld+json">\n${json}\n  </script>`;
    })
    .join('\n');

  // Inject before </head>, ensuring exactly one blank line separates the last
  // preceding element from the schema block so the result is consistent.
  const headEndIndex = content.indexOf('</head>');
  if (headEndIndex === -1) {
    console.warn('Warning: No </head> tag found');
    return content;
  }

  // Trim any trailing whitespace/newlines from the content before </head>,
  // then add one newline + schemas + newline before </head>.
  const before = content.slice(0, headEndIndex).trimEnd();
  const after = content.slice(headEndIndex);
  return before + '\n' + schemaScripts + '\n  ' + after;
}

/**
 * Process a single HTML file
 * @param {string} filePath
 * @param {boolean} checkOnly
 * @returns {boolean} true if modified
 */
function processFile(filePath, checkOnly = false) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Skip files with noindex
  if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(content)) {
    return false;
  }

  const schemas = generateSchemasForPage(filePath, content);

  if (checkOnly) {
    const hasSchema = content.includes('application/ld+json');
    const relativePath = path.relative(ROOT, filePath);
    if (!hasSchema && schemas.length > 0) {
      console.log(`Missing schema: ${relativePath}`);
      return true;
    }
    return false;
  }

  if (schemas.length === 0) {
    return false;
  }

  const newContent = injectSchemas(content, schemas);

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    const relativePath = path.relative(ROOT, filePath);
    console.log(`✓ Injected ${schemas.length} schema(s) into ${relativePath}`);
    return true;
  }

  return false;
}

/**
 * Walk directory and process all HTML files
 * @param {string} dir
 * @param {boolean} checkOnly
 * @returns {Object} stats
 */
function processDirectory(dir, checkOnly = false) {
  const stats = { processed: 0, modified: 0, skipped: 0 };

  const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'server', 'tests', 'admin', 'embed']);

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        stats.processed++;
        try {
          const modified = processFile(fullPath, checkOnly);
          if (modified) stats.modified++;
          else stats.skipped++;
        } catch (err) {
          console.error(`Error processing ${fullPath}:`, err.message);
          stats.skipped++;
        }
      }
    }
  }

  walk(dir);
  return stats;
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const fileIndex = args.indexOf('--file');

  console.log('JSON-LD Schema Injection Tool\n');

  if (fileIndex >= 0 && args[fileIndex + 1]) {
    const filePath = path.resolve(ROOT, args[fileIndex + 1]);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    processFile(filePath, checkOnly);
    console.log('\nDone.');
    return;
  }

  if (checkOnly) {
    console.log('Checking for missing schemas...\n');
  } else {
    console.log('Injecting schemas into all HTML pages...\n');
  }

  const stats = processDirectory(ROOT, checkOnly);

  console.log('\n' + '─'.repeat(50));
  console.log(`Processed: ${stats.processed} files`);
  console.log(`Modified:  ${stats.modified} files`);
  console.log(`Skipped:   ${stats.skipped} files`);
  console.log('─'.repeat(50));

  if (checkOnly && stats.modified === 0) {
    console.log('\n✓ All pages have appropriate schemas');
    process.exit(0);
  } else if (checkOnly) {
    console.log(`\n⚠ ${stats.modified} pages missing schemas`);
    process.exit(1);
  } else {
    console.log('\n✓ Schema injection complete');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateSchemasForPage,
  injectSchemas,
  processFile,
};
