/**
 * search/searchIndex.js
 * Builds a flat searchable index from all site entities.
 * No external dependencies — pure data.
 */
import { COUNTRIES } from '../config/countries.js';
import { KARATS } from '../config/karats.js';
import { SHOPS } from '../../data/shops.js';
import { navIconSymbol } from '../components/icon-sprite.js';

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
    }
  );

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
