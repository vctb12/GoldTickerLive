/**
 * search/searchIndex.js
 * Builds a flat searchable index from all site entities.
 * No external dependencies — pure data.
 */
import { COUNTRIES } from '../config/countries.js';
import { KARATS } from '../config/karats.js';
import { SHOPS } from '../../data/shops.js';
import { navIconSymbol } from '../components/icon-sprite.js';
import { LEARN_GUIDE_CATEGORIES } from '../config/learn-hub-catalog.js';
import { TRANSLATIONS } from '../config/translations.js';

/** Resolve a translation key to its EN + AR strings (falls back to the key). */
function tr(key) {
  return {
    en: (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key,
    ar: (TRANSLATIONS.ar && TRANSLATIONS.ar[key]) || TRANSLATIONS.en?.[key] || key,
  };
}

const _BASE_URL = 'https://goldtickerlive.com';

function buildIndex() {
  const entries = [];

  // Countries — dedicated country pages were retired; deep-link into the
  // compare tool instead (UAE is the reference column, so it lands on the
  // default compare view; every other country pre-selects ae + itself at 22K).
  for (const c of COUNTRIES) {
    if (!c.slug) continue;
    const code = c.code.toLowerCase();
    entries.push({
      type: 'country',
      slug: c.slug,
      label: c.nameEn,
      labelAr: c.nameAr,
      url: code === 'ae' ? '/compare.html' : `/compare.html#compare=ae,${code}&k=22`,
      // Match the nav: show the country's flag (falls back to a location pin
      // for countries without a flag symbol). navIconSymbol handles the lookup.
      icon: navIconSymbol(c.code),
      keywords: [c.nameEn, c.nameAr, c.currency, ...(c.searchAliases || [])],
    });
  }

  // Cities — bilingual, from each country's canonical city list (the engine's
  // TYPE_BOOST always ranked cities but the index never emitted them, so
  // queries like "دبي"/"Doha" returned nothing). Dubai has a dedicated page;
  // every other city deep-links into its country's compare view.
  for (const c of COUNTRIES) {
    const code = c.code.toLowerCase();
    const countryUrl = code === 'ae' ? '/compare.html' : `/compare.html#compare=ae,${code}&k=22`;
    for (const city of c.cities || []) {
      entries.push({
        type: 'city',
        slug: city.slug,
        label: `${city.nameEn} Gold Price`,
        labelAr: `سعر الذهب في ${city.nameAr}`,
        url: city.slug === 'dubai' ? '/dubai-gold-price.html' : countryUrl,
        icon: navIconSymbol(c.code),
        keywords: [city.nameEn, city.nameAr, c.nameEn, c.nameAr],
      });
    }
  }

  // Karats
  for (const k of KARATS) {
    entries.push({
      type: 'karat',
      slug: `${k.code}-karat`,
      label: `${k.code}K Gold Price`,
      labelAr: `سعر ذهب عيار ${k.code}`,
      url: `/tracker.html#mode=live&k=${k.code}`,
      icon: 'i-coins',
      keywords: [`${k.code}K`, `${k.code} karat`, `عيار ${k.code}`, k.labelEn, k.labelAr],
    });
  }

  // Static pages
  entries.push(
    {
      type: 'page',
      label: 'Live Gold Tracker',
      labelAr: 'تتبع الذهب المباشر',
      url: '/tracker.html',
      icon: 'i-chart',
      keywords: ['tracker', 'live', 'real-time', 'تتبع'],
    },
    {
      type: 'page',
      label: 'Gold Price Calculator',
      labelAr: 'حاسبة أسعار الذهب',
      url: '/calculator.html',
      icon: 'i-calc',
      keywords: ['calculator', 'calc', 'compute', 'حاسبة'],
    },
    {
      type: 'page',
      label: 'Gold Shops Directory',
      labelAr: 'دليل محلات الذهب',
      url: '/shops.html',
      icon: 'i-shop',
      keywords: ['shops', 'dealers', 'jewellers', 'محلات', 'بائعين'],
    },
    {
      type: 'page',
      label: 'Gold Price Methodology',
      labelAr: 'منهجية أسعار الذهب',
      url: '/methodology.html',
      icon: 'i-book',
      keywords: ['methodology', 'how', 'منهجية'],
    },
    {
      type: 'page',
      label: 'Gold Insights & Analysis',
      labelAr: 'تحليلات الذهب',
      url: '/learn.html#insights',
      icon: 'i-info',
      keywords: ['insights', 'analysis', 'news', 'تحليل'],
    },
    // Core tool + reference pages that were missing from the index, so searching
    // their name (e.g. "compare", "portfolio", "مقارنة") returned nothing.
    {
      type: 'page',
      label: 'Compare Gold Prices',
      labelAr: 'قارن أسعار الذهب',
      url: '/compare.html',
      icon: 'i-exchange',
      keywords: ['compare', 'comparison', 'countries', 'قارن', 'مقارنة'],
    },
    {
      type: 'page',
      label: 'Gold Portfolio Tracker',
      labelAr: 'محفظة الذهب',
      url: '/portfolio.html',
      icon: 'i-coins',
      keywords: ['portfolio', 'holdings', 'investment', 'محفظة', 'استثمار'],
    },
    {
      type: 'page',
      label: 'Gold Price World Map',
      labelAr: 'خريطة أسعار الذهب العالمية',
      url: '/heatmap.html',
      icon: 'i-globe',
      keywords: ['world map', 'heatmap', 'global', 'map', 'خريطة', 'العالم'],
    },
    {
      type: 'page',
      label: 'How Gold Is Priced',
      labelAr: 'كيف يُسعّر الذهب',
      url: '/market.html',
      icon: 'i-info',
      keywords: ['market', 'how gold is priced', 'spot', 'السوق', 'تسعير'],
    },
    {
      type: 'page',
      label: 'Learn About Gold',
      labelAr: 'تعلّم عن الذهب',
      url: '/learn.html',
      icon: 'i-book',
      keywords: ['learn', 'guides', 'education', 'تعلم', 'أدلة'],
    },
    {
      type: 'page',
      label: 'Gold Glossary',
      labelAr: 'مسرد مصطلحات الذهب',
      url: '/glossary.html',
      icon: 'i-book',
      keywords: ['glossary', 'terms', 'definitions', 'مسرد', 'مصطلحات'],
    }
  );

  // Learn guides — deep-link into the learn.html hub sections. Titles/descriptions
  // resolve bilingually from the shared translation table (the catalog stores
  // translation keys, not literals), so guides like "24K vs 22K vs 18K" /
  // "الفرق بين عيار 24 و22 و18" become findable in both languages.
  for (const cat of LEARN_GUIDE_CATEGORIES) {
    for (const g of cat.guides || []) {
      const title = tr(g.titleKey);
      const desc = tr(g.descKey);
      entries.push({
        type: 'guide',
        slug: g.titleKey,
        label: title.en,
        labelAr: title.ar,
        url: g.href,
        icon: 'i-book',
        keywords: [title.en, title.ar, desc.en, desc.ar, 'learn', 'guide', 'دليل'],
      });
    }
  }

  // Shops
  for (const s of Array.isArray(SHOPS) ? SHOPS : []) {
    if (!s.name) continue;
    const country = COUNTRIES.find((c) => c.code === s.countryCode);
    entries.push({
      type: 'shop',
      slug: s.id || s.name.toLowerCase().replace(/\s+/g, '-'),
      label: s.name,
      labelAr: s.nameAr || s.name,
      url: `/shops.html#${s.id || ''}`,
      icon: 'i-shop',
      keywords: [
        s.name,
        s.nameAr || '',
        s.city || '',
        s.market || '',
        ...(s.specialties || []),
        country?.nameEn || '',
      ],
    });
  }

  return entries;
}

export const SEARCH_INDEX = buildIndex();
