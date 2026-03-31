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
  specialty: 'all',
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
    lead: 'Browse directory listings across countries covered on GoldPrices. Use filters to narrow by region, country, city, and specialty. Shop information is for reference, and business details are shown where available.',
    statListings: 'Listed shops',
    statCountries: 'Countries',
    statRegions: 'Regions',
    popularMarkets: 'Popular markets',
    searchLabel: 'Search by shop, city, country, market, or specialty',
    searchPlaceholder: 'e.g. Dubai Gold Souk, Riyadh, bullion',
    region: 'Region',
    country: 'Country',
    city: 'City',
    specialtyFilter: 'Specialty',
    listed: 'Listed Shops',
    allRegions: 'All regions',
    allCountries: 'All countries',
    allCities: 'All cities',
    allSpecialties: 'All specialties',
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
    featured: 'Featured market',
    infoTitle: 'How to use this directory',
    info1Title: 'Compare by market area',
    info1Body: 'Start with a country or city filter, then compare listed markets and specialties side by side.',
    info2Title: 'Check available details',
    info2Body: 'Cards indicate whether business details are limited or partially available so you know what to expect.',
    info3Title: 'Use as a shortlist',
    info3Body: 'This page is for reference and discovery. Always confirm current prices, charges, and product details directly with shops.',
  },
  ar: {
    kicker: 'محلات حسب المنطقة',
    title: 'استكشف محلات الذهب والأسواق المعروفة',
    lead: 'تصفح إدراجات الدليل ضمن الدول التي يغطيها GoldPrices. استخدم الفلاتر حسب المنطقة والدولة والمدينة والتخصص. معلومات المحلات مرجعية، وتظهر تفاصيل النشاط حيثما كانت متاحة.',
    statListings: 'المحلات المدرجة',
    statCountries: 'الدول',
    statRegions: 'المناطق',
    popularMarkets: 'أسواق شائعة',
    searchLabel: 'ابحث باسم المحل أو المدينة أو الدولة أو السوق أو التخصص',
    searchPlaceholder: 'مثال: سوق الذهب دبي، الرياض، سبائك',
    region: 'المنطقة',
    country: 'الدولة',
    city: 'المدينة',
    specialtyFilter: 'التخصص',
    listed: 'المحلات المدرجة',
    allRegions: 'كل المناطق',
    allCountries: 'كل الدول',
    allCities: 'كل المدن',
    allSpecialties: 'كل التخصصات',
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
    featured: 'سوق مميز',
    infoTitle: 'كيفية استخدام هذا الدليل',
    info1Title: 'قارن حسب منطقة السوق',
    info1Body: 'ابدأ بفلتر الدولة أو المدينة، ثم قارن الأسواق المدرجة والتخصصات بسهولة.',
    info2Title: 'راجع مستوى التفاصيل',
    info2Body: 'توضح البطاقات مستوى توفر تفاصيل النشاط حتى تعرف المعلومات المتاحة قبل التواصل.',
    info3Title: 'استخدمه كقائمة مختصرة',
    info3Body: 'هذه الصفحة للاكتشاف والمرجعية. احرص على تأكيد الأسعار والرسوم والتفاصيل مباشرة مع المحلات.',
  }
};

function t(key) {
  return TXT[STATE.lang]?.[key] ?? TXT.en[key] ?? key;
}

function countryByCode(code) {
  return COUNTRIES.find((country) => country.code === code);
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
  document.getElementById('shops-popular-label').textContent = t('popularMarkets');
  document.getElementById('shops-search-label').textContent = t('searchLabel');
  document.getElementById('shops-search').placeholder = t('searchPlaceholder');
  document.getElementById('shops-region-label').textContent = t('region');
  document.getElementById('shops-country-label').textContent = t('country');
  document.getElementById('shops-city-label').textContent = t('city');
  document.getElementById('shops-specialty-label').textContent = t('specialtyFilter');
  document.getElementById('shops-results-title').textContent = t('listed');
  document.getElementById('shops-empty-title').textContent = t('emptyTitle');
  document.getElementById('shops-empty-text').textContent = t('emptyText');
  document.getElementById('shops-clear-filters').textContent = t('clearFilters');
  document.getElementById('shops-stat-listings-label').textContent = t('statListings');
  document.getElementById('shops-stat-countries-label').textContent = t('statCountries');
  document.getElementById('shops-stat-regions-label').textContent = t('statRegions');
  document.getElementById('shops-info-title').textContent = t('infoTitle');
  document.getElementById('shops-info-1-title').textContent = t('info1Title');
  document.getElementById('shops-info-1-body').textContent = t('info1Body');
  document.getElementById('shops-info-2-title').textContent = t('info2Title');
  document.getElementById('shops-info-2-body').textContent = t('info2Body');
  document.getElementById('shops-info-3-title').textContent = t('info3Title');
  document.getElementById('shops-info-3-body').textContent = t('info3Body');
}

function shopsMatchingPrimaryFilters() {
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
    if (STATE.city !== 'all' && shop.city !== STATE.city) return false;
    return true;
  });
}

function buildFilters() {
  const regionSelect = document.getElementById('shops-region-filter');
  const countrySelect = document.getElementById('shops-country-filter');
  const citySelect = document.getElementById('shops-city-filter');
  const specialtySelect = document.getElementById('shops-specialty-filter');

  regionSelect.innerHTML = `<option value="all">${t('allRegions')}</option>${Object.entries(REGIONS)
    .map(([code, labels]) => `<option value="${code}">${labels[STATE.lang]}</option>`).join('')}`;

  const countryCodes = [...new Set(shopsMatchingPrimaryFilters().map((shop) => shop.countryCode))];
  const allCountries = COUNTRIES
    .filter((country) => SHOPS.some((shop) => shop.countryCode === country.code))
    .filter((country) => STATE.region === 'all' || country.group === STATE.region)
    .sort((a, b) => countryName(a).localeCompare(countryName(b), STATE.lang));

  countrySelect.innerHTML = `<option value="all">${t('allCountries')}</option>${allCountries
    .filter((country) => countryCodes.includes(country.code) || STATE.country === 'all')
    .map((country) => `<option value="${country.code}">${countryName(country)}</option>`).join('')}`;

  const cityPool = SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) return false;
    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    return true;
  });

  const cities = [...new Set(cityPool.map((shop) => shop.city))].sort((a, b) => a.localeCompare(b));
  citySelect.innerHTML = `<option value="all">${t('allCities')}</option>${cities
    .map((city) => `<option value="${city}">${city}</option>`).join('')}`;

  const specialties = [...new Set(shopsMatchingPrimaryFilters().flatMap((shop) => shop.specialties || []))]
    .sort((a, b) => a.localeCompare(b));
  specialtySelect.innerHTML = `<option value="all">${t('allSpecialties')}</option>${specialties
    .map((item) => `<option value="${item}">${item}</option>`).join('')}`;

  regionSelect.value = STATE.region;
  if (![...countrySelect.options].some((option) => option.value === STATE.country)) STATE.country = 'all';
  countrySelect.value = STATE.country;
  if (![...citySelect.options].some((option) => option.value === STATE.city)) STATE.city = 'all';
  citySelect.value = STATE.city;
  if (![...specialtySelect.options].some((option) => option.value === STATE.specialty)) STATE.specialty = 'all';
  specialtySelect.value = STATE.specialty;
}

function populatePopularChips() {
  const box = document.getElementById('shops-popular-chips');
  const featured = SHOPS.filter((shop) => shop.featured).slice(0, 6);
  box.innerHTML = featured.map((shop) => {
    const label = `${shop.market} · ${shop.city}`;
    return `<button class="shops-chip" type="button" data-country="${shop.countryCode}" data-city="${shop.city}">${label}</button>`;
  }).join('');

  box.querySelectorAll('.shops-chip').forEach((button) => {
    button.addEventListener('click', () => {
      STATE.country = button.dataset.country || 'all';
      STATE.city = button.dataset.city || 'all';
      STATE.region = 'all';
      STATE.specialty = 'all';
      buildFilters();
      render();
    });
  });
}

function filterShops() {
  const q = STATE.search.trim().toLowerCase();
  return SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) return false;

    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    if (STATE.city !== 'all' && shop.city !== STATE.city) return false;
    if (STATE.specialty !== 'all' && !(shop.specialties || []).includes(STATE.specialty)) return false;

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
  if (STATE.specialty !== 'all') labels.push(STATE.specialty);
  if (STATE.search.trim()) labels.push(`"${STATE.search.trim()}"`);

  document.getElementById('shops-active-filters').textContent =
    labels.length ? t('activeFilters')(labels.join(' · ')) : t('noFilters');
}

function updateHeaderStats() {
  const uniqueCountries = new Set(SHOPS.map((shop) => shop.countryCode));
  const uniqueRegions = new Set(SHOPS.map((shop) => countryByCode(shop.countryCode)?.group).filter(Boolean));
  document.getElementById('shops-stat-listings').textContent = String(SHOPS.length);
  document.getElementById('shops-stat-countries').textContent = String(uniqueCountries.size);
  document.getElementById('shops-stat-regions').textContent = String(uniqueRegions.size);
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
      <article class="shop-card${shop.featured ? ' shop-card--featured' : ''}">
        <header class="shop-card-head">
          <div>
            <h3>${shop.name}</h3>
            ${shop.featured ? `<span class="shop-featured">${t('featured')}</span>` : ''}
          </div>
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
if (count) count.textContent = t('count')(shops.length);
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
  STATE.specialty = 'all';
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
    STATE.specialty = 'all';
    buildFilters();
    render();
  });

  document.getElementById('shops-country-filter').addEventListener('change', (event) => {
    STATE.country = event.target.value;
    STATE.city = 'all';
    STATE.specialty = 'all';
    buildFilters();
    render();
  });

  document.getElementById('shops-city-filter').addEventListener('change', (event) => {
    STATE.city = event.target.value;
    STATE.specialty = 'all';
    buildFilters();
    render();
  });

  document.getElementById('shops-specialty-filter').addEventListener('change', (event) => {
    STATE.specialty = event.target.value;
    render();
  });

  document.getElementById('shops-clear-filters').addEventListener('click', resetFilters);
}

function updateLanguage() {
  applyStaticText();
  buildFilters();
  updateHeaderStats();
  populatePopularChips();
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
