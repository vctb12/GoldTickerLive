import { COUNTRIES } from './config/countries.js';
import { SHOPS } from './data/shops.js';
import { injectNav, updateNavLang } from './components/nav.js';
import { injectFooter } from './components/footer.js';
import { injectTicker, updateTickerLang } from './components/ticker.js';
import * as cache from './lib/cache.js';

const STATE = {
  lang: 'en',
  search: '',
  region: 'all',
  country: 'all',
  city: 'all',
};

const REGIONS = {
  gcc: { en: 'GCC', ar: 'الخليج' },
  levant: { en: 'Levant', ar: 'بلاد الشام' },
  africa: { en: 'Africa', ar: 'أفريقيا' },
  global: { en: 'Global', ar: 'عالمي' },
};

const TXT = {
  en: {
    kicker: 'Shops by region',
    title: 'Explore Gold Shops & Known Gold Markets',
    lead: 'Browse listed shops across countries covered on GoldPrices. Use filters to narrow by region, country, city, and market. Business details are shown where available.',
    statListings: 'Listed shops',
    statCountries: 'Countries',
    statRegions: 'Regions',
    searchLabel: 'Search by shop, city, country, market, or specialty',
    searchPlaceholder: 'e.g. Dubai Gold Souk, Riyadh, bullion',
    region: 'Region',
    country: 'Country',
    city: 'City',
    listed: 'Listed Shops',
    allRegions: 'All regions',
    allCountries: 'All countries',
    allCities: 'All cities',
    count: (n) => `${n} listing${n === 1 ? '' : 's'}`,
    activeFilters: (value) => `Filters: ${value}`,
    noFilters: 'Showing all listings',
    emptyTitle: 'No listings match your filters',
    emptyText: 'Try clearing one filter or searching with a broader term.',
    clearFilters: 'Clear filters',
    location: 'Location',
    market: 'Market',
    category: 'Category',
    specialties: 'Specialties',
    phone: 'Phone',
    website: 'Website',
    detailsSignal: 'Business details',
    detailsPartial: 'Partially available',
    detailsLimited: 'Limited',
    detailsFull: 'Available',
    noContact: 'Business details where available',
    visitWebsite: 'Visit website',
  },
  ar: {
    kicker: 'محلات حسب المنطقة',
    title: 'استكشف محلات الذهب والأسواق المعروفة',
    lead: 'تصفح المحلات المدرجة ضمن الدول التي يغطيها GoldPrices. استخدم الفلاتر حسب المنطقة والدولة والمدينة والسوق. تظهر تفاصيل النشاط حيثما كانت متاحة.',
    statListings: 'المحلات المدرجة',
    statCountries: 'الدول',
    statRegions: 'المناطق',
    searchLabel: 'ابحث باسم المحل أو المدينة أو الدولة أو السوق أو التخصص',
    searchPlaceholder: 'مثال: سوق الذهب دبي، الرياض، سبائك',
    region: 'المنطقة',
    country: 'الدولة',
    city: 'المدينة',
    listed: 'المحلات المدرجة',
    allRegions: 'كل المناطق',
    allCountries: 'كل الدول',
    allCities: 'كل المدن',
    count: (n) => `${n} نتيجة`,
    activeFilters: (value) => `الفلاتر: ${value}`,
    noFilters: 'عرض جميع الإدراجات',
    emptyTitle: 'لا توجد إدراجات مطابقة',
    emptyText: 'جرّب إلغاء أحد الفلاتر أو استخدام كلمات أوسع في البحث.',
    clearFilters: 'مسح الفلاتر',
    location: 'الموقع',
    market: 'السوق',
    category: 'الفئة',
    specialties: 'التخصصات',
    phone: 'الهاتف',
    website: 'الموقع',
    detailsSignal: 'تفاصيل النشاط',
    detailsPartial: 'متوفرة جزئياً',
    detailsLimited: 'محدودة',
    detailsFull: 'متوفرة',
    noContact: 'تفاصيل النشاط متاحة عند توفرها',
    visitWebsite: 'زيارة الموقع',
  }
};

function t(key) {
  return TXT[STATE.lang]?.[key] ?? TXT.en[key] ?? key;
}

function countryByCode(code) {
  return COUNTRIES.find((c) => c.code === code);
}

function countryName(country) {
  return STATE.lang === 'ar' ? country.nameAr : country.nameEn;
}

function regionName(group) {
  return REGIONS[group]?.[STATE.lang] || group;
}

function detailsAvailabilityLabel(value) {
  if (value === 'full') return t('detailsFull');
  if (value === 'partial') return t('detailsPartial');
  return t('detailsLimited');
}

function applyStaticText() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  document.getElementById('shops-kicker').textContent = t('kicker');
  document.getElementById('shops-title').textContent = t('title');
  document.getElementById('shops-lead').textContent = t('lead');
  document.getElementById('shops-search-label').textContent = t('searchLabel');
  document.getElementById('shops-search').placeholder = t('searchPlaceholder');
  document.getElementById('shops-region-label').textContent = t('region');
  document.getElementById('shops-country-label').textContent = t('country');
  document.getElementById('shops-city-label').textContent = t('city');
  document.getElementById('shops-results-title').textContent = t('listed');
  document.getElementById('shops-empty-title').textContent = t('emptyTitle');
  document.getElementById('shops-empty-text').textContent = t('emptyText');
  document.getElementById('shops-clear-filters').textContent = t('clearFilters');
  document.getElementById('shops-stat-listings-label').textContent = t('statListings');
  document.getElementById('shops-stat-countries-label').textContent = t('statCountries');
  document.getElementById('shops-stat-regions-label').textContent = t('statRegions');
}

function allCountriesInData() {
  const codes = new Set(SHOPS.map((s) => s.countryCode));
  return COUNTRIES.filter((c) => codes.has(c.code))
    .sort((a, b) => countryName(a).localeCompare(countryName(b), STATE.lang));
}

function shopsForCountryFilter() {
  if (STATE.region === 'all') return SHOPS;
  return SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    return country?.group === STATE.region;
  });
}

function shopsForCityFilter() {
  return SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) return false;
    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    return true;
  });
}

function buildFilters() {
  const regionSelect = document.getElementById('shops-region-filter');
  const countrySelect = document.getElementById('shops-country-filter');
  const citySelect = document.getElementById('shops-city-filter');

  regionSelect.innerHTML = `<option value="all">${t('allRegions')}</option>${Object.entries(REGIONS)
    .map(([code, labels]) => `<option value="${code}">${labels[STATE.lang]}</option>`).join('')}`;

  const countryCodes = [...new Set(shopsForCountryFilter().map((s) => s.countryCode))];
  const countries = allCountriesInData().filter((country) => countryCodes.includes(country.code));
  countrySelect.innerHTML = `<option value="all">${t('allCountries')}</option>${countries
    .map((country) => `<option value="${country.code}">${countryName(country)}</option>`).join('')}`;

  const cities = [...new Set(shopsForCityFilter().map((s) => s.city))].sort((a, b) => a.localeCompare(b));
  citySelect.innerHTML = `<option value="all">${t('allCities')}</option>${cities
    .map((city) => `<option value="${city}">${city}</option>`).join('')}`;

  regionSelect.value = STATE.region;

  if (![...countrySelect.options].some((opt) => opt.value === STATE.country)) STATE.country = 'all';
  countrySelect.value = STATE.country;

  if (![...citySelect.options].some((opt) => opt.value === STATE.city)) STATE.city = 'all';
  citySelect.value = STATE.city;
}

function filterShops() {
  const q = STATE.search.trim().toLowerCase();

  return SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) return false;

    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    if (STATE.city !== 'all' && shop.city !== STATE.city) return false;

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
      regionName(country.group),
    ].join(' ').toLowerCase();

    return haystack.includes(q);
  });
}

function updateHeaderStats() {
  const uniqueCountries = new Set(SHOPS.map((shop) => shop.countryCode));
  const uniqueRegions = new Set(
    SHOPS.map((shop) => countryByCode(shop.countryCode)?.group).filter(Boolean)
  );

  document.getElementById('shops-stat-listings').textContent = String(SHOPS.length);
  document.getElementById('shops-stat-countries').textContent = String(uniqueCountries.size);
  document.getElementById('shops-stat-regions').textContent = String(uniqueRegions.size);
}

function activeFilterSummary() {
  const labels = [];

  if (STATE.region !== 'all') labels.push(regionName(STATE.region));
  if (STATE.country !== 'all') {
    const country = countryByCode(STATE.country);
    if (country) labels.push(countryName(country));
  }
  if (STATE.city !== 'all') labels.push(STATE.city);
  if (STATE.search.trim()) labels.push(`"${STATE.search.trim()}"`);

  const activeFiltersEl = document.getElementById('shops-active-filters');
  activeFiltersEl.textContent = labels.length ? t('activeFilters')(labels.join(' · ')) : t('noFilters');
}

function renderCards(shops) {
  const grid = document.getElementById('shops-grid');

  grid.innerHTML = shops.map((shop) => {
    const country = countryByCode(shop.countryCode);
    const specialties = (shop.specialties || []).map((item) => `<span class="shop-tag">${item}</span>`).join('');

    const contactParts = [];
    if (shop.phone) contactParts.push(`${t('phone')}: ${shop.phone}`);
    if (shop.website) {
      contactParts.push(`<a href="${shop.website}" target="_blank" rel="noopener" class="shop-site-link">${t('visitWebsite')}</a>`);
    }

    return `
      <article class="shop-card">
        <header class="shop-card-head">
          <h3>${shop.name}</h3>
          <span class="shop-signal">${t('detailsSignal')}: ${detailsAvailabilityLabel(shop.detailsAvailability)}</span>
        </header>

        <div class="shop-meta-grid">
          <p class="shop-meta"><span>${t('location')}</span><strong>${shop.city}, ${countryName(country)} · ${regionName(country.group)}</strong></p>
          <p class="shop-meta"><span>${t('market')}</span><strong>${shop.market}</strong></p>
          <p class="shop-meta"><span>${t('category')}</span><strong>${shop.category}</strong></p>
        </div>

        <div class="shop-tags-wrap">
          <span class="shop-tag shop-tag--muted">${t('specialties')}</span>
          ${specialties || `<span class="shop-tag">—</span>`}
        </div>

        <p class="shop-notes">${shop.notes}</p>
        <p class="shop-contact">${contactParts.join(' · ') || t('noContact')}</p>
      </article>
    `;
  }).join('');
}

function render() {
  const shops = filterShops();
  const empty = document.getElementById('shops-empty');
  const count = document.getElementById('shops-count');

  count.textContent = t('count')(shops.length);
  activeFilterSummary();

  if (!shops.length) {
    document.getElementById('shops-grid').innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  renderCards(shops);
}

function resetFilters() {
  STATE.search = '';
  STATE.region = 'all';
  STATE.country = 'all';
  STATE.city = 'all';

  document.getElementById('shops-search').value = '';
  buildFilters();
  render();
}

function bindEvents() {
  document.getElementById('shops-search').addEventListener('input', (event) => {
    STATE.search = event.target.value;
    render();
  });

  document.getElementById('shops-region-filter').addEventListener('change', (event) => {
    STATE.region = event.target.value;
    STATE.country = 'all';
    STATE.city = 'all';
    buildFilters();
    render();
  });

  document.getElementById('shops-country-filter').addEventListener('change', (event) => {
    STATE.country = event.target.value;
    STATE.city = 'all';
    buildFilters();
    render();
  });

  document.getElementById('shops-city-filter').addEventListener('change', (event) => {
    STATE.city = event.target.value;
    render();
  });

  document.getElementById('shops-clear-filters').addEventListener('click', resetFilters);
}

function updateLanguage() {
  applyStaticText();
  buildFilters();
  updateHeaderStats();
  render();
}

function init() {
  try {
    const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
    if (prefs.lang === 'ar' || prefs.lang === 'en') STATE.lang = prefs.lang;
  } catch {}

  const navResult = injectNav(STATE.lang, 0);
  injectFooter(STATE.lang, 0);
  injectTicker(STATE.lang, 0);

  navResult.getLangToggleButtons().forEach((button) => {
    button.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      updateNavLang(STATE.lang);
      updateTickerLang(STATE.lang);
      updateLanguage();
    });
  });

  bindEvents();
  updateLanguage();
}

init();
