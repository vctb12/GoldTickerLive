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

const COUNTRY_SLUGS = {
  AE: 'uae',
  SA: 'saudi-arabia',
  KW: 'kuwait',
  QA: 'qatar',
  BH: 'bahrain',
  OM: 'oman',
  EG: 'egypt',
  JO: 'jordan',
  MA: 'morocco',
  IN: 'india',
};

const TXT = {
  en: {
    kicker: 'Shops by region',
    title: 'Explore Gold Shops & Known Gold Markets',
    lead: 'Browse directory listings across countries covered on GoldPrices. Use filters to narrow by region, country, city, and specialty. Shop information is for reference, and business details are shown where available.',
    trustNote: 'Directory listings are for discovery only — not endorsement. Always confirm pricing, making charges, and product details directly with each shop.',
    reviewedAt: 'Directory reviewed: March 2026',
    statListings: 'Listed shops',
    statCountries: 'Countries',
    statRegions: 'Regions',
    popularMarkets: 'Popular markets',
    filtersBtn: 'Filters',
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
    clearFilter: 'Clear',
    location: 'Location',
    market: 'Market',
    category: 'Category',
    specialties: 'Specialties',
    phone: 'Phone',
    detailsSignal: 'Business details',
    detailsPartial: 'Partially available',
    detailsLimited: 'Limited',
    detailsFull: 'Available',
    noContact: 'Business details where available',
    visitWebsite: 'Visit website',
    openCountry: 'Live prices in this country',
    openCalculator: 'Estimate with calculator',
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
    trustNote: 'إدراجات الدليل مخصصة للاكتشاف فقط وليست اعتماداً رسمياً. احرص دائماً على تأكيد الأسعار والرسوم والتفاصيل مباشرة مع كل محل.',
    reviewedAt: 'آخر مراجعة للدليل: مارس 2026',
    statListings: 'المحلات المدرجة',
    statCountries: 'الدول',
    statRegions: 'المناطق',
    popularMarkets: 'أسواق شائعة',
    filtersBtn: 'الفلاتر',
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
    clearFilter: 'إزالة',
    location: 'الموقع',
    market: 'السوق',
    category: 'الفئة',
    specialties: 'التخصصات',
    phone: 'الهاتف',
    detailsSignal: 'تفاصيل النشاط',
    detailsPartial: 'متوفرة جزئياً',
    detailsLimited: 'محدودة',
    detailsFull: 'متوفرة',
    noContact: 'تفاصيل النشاط متاحة عند توفرها',
    visitWebsite: 'زيارة الموقع',
    openCountry: 'الأسعار المباشرة في هذه الدولة',
    openCalculator: 'التقدير عبر الحاسبة',
    featured: 'سوق مميز',
    infoTitle: 'كيفية استخدام هذا الدليل',
    info1Title: 'قارن حسب منطقة السوق',
    info1Body: 'ابدأ بفلتر الدولة أو المدينة، ثم قارن الأسواق المدرجة والتخصصات بسهولة.',
    info2Title: 'راجع مستوى التفاصيل',
    info2Body: 'توضح البطاقات مستوى توفر تفاصيل النشاط حتى تعرف المعلومات المتاحة قبل التواصل.',
    info3Title: 'استخدمه كقائمة مختصرة',
    info3Body: 'هذه الصفحة للاكتشاف والمرجعية. احرص على تأكيد الأسعار والرسوم والتفاصيل مباشرة مع المحلات.',
  },
};

function t(key) { return TXT[STATE.lang]?.[key] ?? TXT.en[key] ?? key; }

function countryByCode(code) { return COUNTRIES.find((country) => country.code === code); }
function countryName(country) { return STATE.lang === 'ar' ? country.nameAr : country.nameEn; }
function regionName(group) { return REGIONS[group]?.[STATE.lang] || group; }

function detailsAvailabilityLabel(value) {
  if (value === 'full') return t('detailsFull');
  if (value === 'partial') return t('detailsPartial');
  return t('detailsLimited');
}

function applyStaticText() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  const map = {
    'shops-kicker': 'kicker',
    'shops-title': 'title',
    'shops-lead': 'lead',
    'shops-trust-note': 'trustNote',
    'shops-reviewed-at': 'reviewedAt',
    'shops-popular-label': 'popularMarkets',
    'shops-search-label': 'searchLabel',
    'shops-region-label': 'region',
    'shops-country-label': 'country',
    'shops-city-label': 'city',
    'shops-specialty-label': 'specialtyFilter',
    'shops-results-title': 'listed',
    'shops-empty-title': 'emptyTitle',
    'shops-empty-text': 'emptyText',
    'shops-clear-filters': 'clearFilters',
    'shops-stat-listings-label': 'statListings',
    'shops-stat-countries-label': 'statCountries',
    'shops-stat-regions-label': 'statRegions',
    'shops-info-title': 'infoTitle',
    'shops-info-1-title': 'info1Title',
    'shops-info-1-body': 'info1Body',
    'shops-info-2-title': 'info2Title',
    'shops-info-2-body': 'info2Body',
    'shops-info-3-title': 'info3Title',
    'shops-info-3-body': 'info3Body',
    'shops-filter-toggle': 'filtersBtn',
  };

  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  });

  const search = document.getElementById('shops-search');
  if (search) search.placeholder = t('searchPlaceholder');
}

function loadStateFromUrl() {
  const params = new URLSearchParams(location.search);
  const read = (key) => (params.get(key) || '').trim();

  STATE.search = read('q');
  STATE.region = read('region') || 'all';
  STATE.country = read('country') || 'all';
  STATE.city = read('city') || 'all';
  STATE.specialty = read('specialty') || 'all';

  if (STATE.region !== 'all' && !REGIONS[STATE.region]) STATE.region = 'all';
  if (STATE.country !== 'all' && !countryByCode(STATE.country)) STATE.country = 'all';
}

function syncUrlState() {
  const params = new URLSearchParams();
  if (STATE.search.trim()) params.set('q', STATE.search.trim());
  if (STATE.region !== 'all') params.set('region', STATE.region);
  if (STATE.country !== 'all') params.set('country', STATE.country);
  if (STATE.city !== 'all') params.set('city', STATE.city);
  if (STATE.specialty !== 'all') params.set('specialty', STATE.specialty);

  const q = params.toString();
  const next = `${location.pathname}${q ? `?${q}` : ''}`;
  history.replaceState(null, '', next);
}

function shopsMatchingPrimaryFilters() {
  return SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) return false;
    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    if (STATE.city !== 'all' && shop.city !== STATE.city) return false;
    return true;
  });
}

function shopsForFeaturedChips() {
  const pool = shopsMatchingPrimaryFilters();
  const featured = pool.filter((shop) => shop.featured);
  return (featured.length ? featured : pool).slice(0, 6);
}

function buildFilters() {
  const regionSelect = document.getElementById('shops-region-filter');
  const countrySelect = document.getElementById('shops-country-filter');
  const citySelect = document.getElementById('shops-city-filter');
  const specialtySelect = document.getElementById('shops-specialty-filter');

  regionSelect.innerHTML = `<option value="all">${t('allRegions')}</option>${Object.entries(REGIONS)
    .map(([code, labels]) => `<option value="${code}">${labels[STATE.lang]}</option>`).join('')}`;

  const countriesInScope = COUNTRIES
    .filter((country) => SHOPS.some((shop) => shop.countryCode === country.code))
    .filter((country) => STATE.region === 'all' || country.group === STATE.region)
    .sort((a, b) => countryName(a).localeCompare(countryName(b), STATE.lang));

  countrySelect.innerHTML = `<option value="all">${t('allCountries')}</option>${countriesInScope
    .map((country) => `<option value="${country.code}">${countryName(country)}</option>`).join('')}`;

  const cityPool = SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) return false;
    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    return true;
  });

  const cities = [...new Set(cityPool.map((shop) => shop.city))].sort((a, b) => a.localeCompare(b));
  citySelect.innerHTML = `<option value="all">${t('allCities')}</option>${cities.map((city) => `<option value="${city}">${city}</option>`).join('')}`;

  const specialties = [...new Set(shopsMatchingPrimaryFilters().flatMap((shop) => shop.specialties || []))]
    .sort((a, b) => a.localeCompare(b));
  specialtySelect.innerHTML = `<option value="all">${t('allSpecialties')}</option>${specialties.map((item) => `<option value="${item}">${item}</option>`).join('')}`;

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
  const chips = shopsForFeaturedChips();

  box.innerHTML = chips.map((shop) => {
    const label = `${shop.market} · ${shop.city}`;
    return `<button class="shops-chip" type="button" data-country="${shop.countryCode}" data-city="${shop.city}" aria-label="${label}">${label}</button>`;
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
      shop.name, shop.city, shop.market, shop.category,
      ...(shop.specialties || []), shop.notes, country.nameEn, country.nameAr,
    ].join(' ').toLowerCase();

    return haystack.includes(q);
  });
}

function activeFilterLabels() {
  const labels = [];
  if (STATE.region !== 'all') labels.push({ key: 'region', label: regionName(STATE.region) });
  if (STATE.country !== 'all') {
    const country = countryByCode(STATE.country);
    if (country) labels.push({ key: 'country', label: countryName(country) });
  }
  if (STATE.city !== 'all') labels.push({ key: 'city', label: STATE.city });
  if (STATE.specialty !== 'all') labels.push({ key: 'specialty', label: STATE.specialty });
  if (STATE.search.trim()) labels.push({ key: 'search', label: `"${STATE.search.trim()}"` });
  return labels;
}

function renderActivePills() {
  const pillsEl = document.getElementById('shops-active-pills');
  const labels = activeFilterLabels();

  pillsEl.innerHTML = labels.map((item) => `
    <button type="button" class="shops-active-pill" data-key="${item.key}">
      <span>${item.label}</span><span aria-hidden="true">×</span>
    </button>
  `).join('');

  pillsEl.querySelectorAll('.shops-active-pill').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.key;
      if (key === 'region') {
        STATE.region = 'all'; STATE.country = 'all'; STATE.city = 'all'; STATE.specialty = 'all';
      } else if (key === 'country') {
        STATE.country = 'all'; STATE.city = 'all'; STATE.specialty = 'all';
      } else if (key === 'city') {
        STATE.city = 'all'; STATE.specialty = 'all';
      } else if (key === 'specialty') {
        STATE.specialty = 'all';
      } else if (key === 'search') {
        STATE.search = '';
        document.getElementById('shops-search').value = '';
      }
      buildFilters();
      render();
    });
  });
}

function activeFilterSummary() {
  const labels = activeFilterLabels().map((item) => item.label);
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


function countryPageUrl(countryCode) {
  const slug = COUNTRY_SLUGS[countryCode];
  return slug ? `./countries/${slug}.html` : './tracker.html#section-countries';
}

function renderCards(shops) {
  const grid = document.getElementById('shops-grid');

  grid.innerHTML = shops.map((shop) => {
    const country = countryByCode(shop.countryCode);
    const specialties = (shop.specialties || []).map((item) => `<span class="shop-tag">${item}</span>`).join('');

    const contactParts = [];
    if (shop.phone) contactParts.push(`${t('phone')}: ${shop.phone}`);
    if (shop.website) contactParts.push(`<a href="${shop.website}" target="_blank" rel="noopener" class="shop-site-link">${t('visitWebsite')}</a>`);

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
        <div class="shop-actions">
          <a class="shop-action-link" href="${countryPageUrl(shop.countryCode)}">${t('openCountry')}</a>
          <a class="shop-action-link" href="./calculator.html">${t('openCalculator')}</a>
        </div>
      </article>
    `;
  }).join('');
}

function syncUrlToState() {
  const p = new URLSearchParams(location.search);

  if (STATE.region !== 'all') p.set('region', STATE.region); else p.delete('region');
  if (STATE.country !== 'all') p.set('country', STATE.country); else p.delete('country');
  if (STATE.city !== 'all') p.set('city', STATE.city); else p.delete('city');
  if (STATE.specialty !== 'all') p.set('specialty', STATE.specialty); else p.delete('specialty');

  const q = STATE.search.trim();
  if (q) { p.set('search', q); p.delete('q'); }
  else { p.delete('search'); p.delete('q'); }

  const qs = p.toString();
  history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);
}

function render() {
  syncUrlToState();
  const shops = filterShops();
  const empty = document.getElementById('shops-empty');

  document.getElementById('shops-count').textContent = t('count')(shops.length);
  activeFilterSummary();
  renderActivePills();
  syncUrlState();
  populatePopularChips();

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

  const toggle = document.getElementById('shops-filter-toggle');
  const panel = document.getElementById('shops-controls-inner');
  if (toggle && panel) {
    toggle.addEventListener('click', () => {
      panel.classList.toggle('is-collapsed');
      const expanded = !panel.classList.contains('is-collapsed');
      toggle.setAttribute('aria-expanded', String(expanded));
    });
  }
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

  loadStateFromUrl();

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

  const search = document.getElementById('shops-search');
  if (search) search.value = STATE.search;
}

init();
