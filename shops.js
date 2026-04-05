import { COUNTRIES } from './config/countries.js';
import { SHOPS } from './data/shops.js';
import { injectNav, updateNavLang } from './components/nav.js';
import { injectFooter } from './components/footer.js';
import { injectTicker, updateTicker, updateTickerLang } from './components/ticker.js';
import { injectBreadcrumbs } from './components/breadcrumbs.js';
import * as cache from './lib/cache.js';
import { CONSTANTS } from './config/index.js';
import { KARATS } from './config/index.js';

const STATE = {
  lang: 'en',
  search: '',
  region: 'all',
  country: 'all',
  city: 'all',
  specialty: 'all',
  shortlist: [], // IDs of saved shops for quick comparison
};

// Load shortlist from localStorage on module init
(function loadShortlist() {
  try {
    const stored = localStorage.getItem('shops_shortlist');
    if (stored) STATE.shortlist = JSON.parse(stored);
  } catch {}
})();

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
    trustBanner: 'Directory updated regularly · Updated {date}',
    statListings: 'Listed markets',
    statCountries: 'Countries',
    statRegions: 'Regions',
    popularMarkets: 'Popular markets',
    searchLabel: 'Search by shop, city, country, market, or specialty',
    searchPlaceholder: 'e.g. Dubai Gold Souk, Riyadh, bullion',
    region: 'Region',
    country: 'Country',
    city: 'City',
    specialtyFilter: 'Specialty',
    listed: 'Listed Markets',
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
    noContact: 'Contact details not yet listed',
    visitWebsite: 'Visit website',
    featured: 'Featured market',
    marketCluster: 'Market area cluster',
    saveToShortlist: 'Save to shortlist',
    removeFromShortlist: 'Remove from shortlist',
    saved: 'Saved',
    shortlistCount: (n) => `${n} saved`,
    shareShop: 'Share',
    directions: 'Directions',
    callShop: 'Call',
    viewCountryPage: 'View country page',
    infoTitle: 'How to use this directory',
    info1Title: 'Compare by market area',
    info1Body: 'Start with a country or city filter, then compare listed markets and specialties side by side.',
    info2Title: 'Check available details',
    info2Body: 'Cards indicate whether business details are limited or partially available so you know what to expect.',
    info3Title: 'Use as a shortlist',
    info3Body: 'This page is for reference and discovery. Always confirm current prices, charges, and product details directly with shops.',
    quickActionsCalc: 'Calculate Value',
    quickActionsRates: 'Live Rates',
    quickActionsUAE: 'UAE Market',
  },
  ar: {
    kicker: 'محلات حسب المنطقة',
    title: 'استكشف محلات الذهب والأسواق المعروفة',
    lead: 'تصفح إدراجات الدليل ضمن الدول التي يغطيها GoldPrices. استخدم الفلاتر حسب المنطقة والدولة والمدينة والتخصص. معلومات المحلات مرجعية، وتظهر تفاصيل النشاط حيثما كانت متاحة.',
    trustBanner: 'يتم تحديث الدليل بانتظام · تم التحديث {date}',
    statListings: 'الأسواق المدرجة',
    statCountries: 'الدول',
    statRegions: 'المناطق',
    popularMarkets: 'أسواق شائعة',
    searchLabel: 'ابحث باسم المحل أو المدينة أو الدولة أو السوق أو التخصص',
    searchPlaceholder: 'مثال: سوق الذهب دبي، الرياض، سبائك',
    region: 'المنطقة',
    country: 'الدولة',
    city: 'المدينة',
    specialtyFilter: 'التخصص',
    listed: 'الأسواق المدرجة',
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
    noContact: 'بيانات الاتصال غير مدرجة بعد',
    visitWebsite: 'زيارة الموقع',
    featured: 'سوق مميز',
    marketCluster: 'مجموعة متاجر بسوق',
    saveToShortlist: 'حفظ في القائمة',
    removeFromShortlist: 'إزالة من القائمة',
    saved: 'محفوظ',
    shortlistCount: (n) => `${n} محفوظة`,
    shareShop: 'مشاركة',
    directions: 'الاتجاهات',
    callShop: 'اتصال',
    viewCountryPage: 'عرض صفحة الدولة',
    infoTitle: 'كيفية استخدام هذا الدليل',
    info1Title: 'قارن حسب منطقة السوق',
    info1Body: 'ابدأ بفلتر الدولة أو المدينة، ثم قارن الأسواق المدرجة والتخصصات بسهولة.',
    info2Title: 'راجع مستوى التفاصيل',
    info2Body: 'توضح البطاقات مستوى توفر تفاصيل النشاط حتى تعرف المعلومات المتاحة قبل التواصل.',
    info3Title: 'استخدمه كقائمة مختصرة',
    info3Body: 'هذه الصفحة للاكتشاف والمرجعية. احرص على تأكيد الأسعار والرسوم والتفاصيل مباشرة مع المحلات.',
    quickActionsCalc: 'احسب القيمة',
    quickActionsRates: 'الأسعار المباشرة',
    quickActionsUAE: 'سوق الإمارات',
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

function isMarketCluster(shop) {
  // Market clusters typically have "cluster", "shops", "dealers", "area", or "market" in notes
  // and empty phone/website
  return !shop.phone && !shop.website &&
         (shop.notes?.toLowerCase().includes('cluster') ||
          shop.notes?.toLowerCase().includes('concentration') ||
          shop.notes?.toLowerCase().includes('area'));
}

function toggleShortlist(shopId) {
  const idx = STATE.shortlist.indexOf(shopId);
  if (idx === -1) {
    STATE.shortlist.push(shopId);
  } else {
    STATE.shortlist.splice(idx, 1);
  }
  try {
    localStorage.setItem('shops_shortlist', JSON.stringify(STATE.shortlist));
  } catch {}
  render(); // Re-render to update button states
}

function isInShortlist(shopId) {
  return STATE.shortlist.includes(shopId);
}

function shareShop(shop) {
  const url = `${location.origin}${location.pathname}?shop=${shop.id}`;
  const text = `${shop.name} — ${shop.market}, ${shop.city}`;
  
  if (navigator.share) {
    navigator.share({ title: shop.name, text, url }).catch(() => {});
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard?.writeText(url).then(() => {
      alert(STATE.lang === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    }).catch(() => {});
  }
}

function openModal(shop) {
  const modal = document.getElementById('shops-modal');
  const country = countryByCode(shop.countryCode);
  const specialties = (shop.specialties || []).map((item) => `<span class="shop-tag">${item}</span>`).join('');
  const inList = isInShortlist(shop.id);
  
  // Build action buttons row
  const actionsHTML = `
    <div class="modal-actions">
      <button class="modal-action-btn modal-action-btn--shortlist ${inList ? 'is-saved' : ''}" 
              type="button" data-shop-id="${shop.id}" aria-label="${inList ? t('removeFromShortlist') : t('saveToShortlist')}">
        <span class="modal-action-icon">${inList ? '✓' : '+'}</span>
        <span class="modal-action-label">${inList ? t('saved') : t('saveToShortlist')}</span>
      </button>
      <button class="modal-action-btn modal-action-btn--share" type="button" data-shop-id="${shop.id}" aria-label="${t('shareShop')}">
        <span class="modal-action-icon">↗</span>
        <span class="modal-action-label">${t('shareShop')}</span>
      </button>
      ${shop.phone ? `<a href="tel:${shop.phone.replace(/\s+/g, '')}" class="modal-action-btn modal-action-btn--call" aria-label="${t('callShop')}">
        <span class="modal-action-icon">📞</span>
        <span class="modal-action-label">${t('callShop')}</span>
      </a>` : ''}
      ${shop.website ? `<a href="${shop.website}" target="_blank" rel="noopener" class="modal-action-btn modal-action-btn--website" aria-label="${t('visitWebsite')}">
        <span class="modal-action-icon">🌐</span>
        <span class="modal-action-label">${t('visitWebsite')}</span>
      </a>` : ''}
    </div>
  `;

  const contactHTML = shop.phone || shop.website ?
    `<div class="modal-contact">
      ${shop.phone ? `<p><strong>${t('phone')}:</strong> ${shop.phone}</p>` : ''}
      ${shop.website ? `<p><a href="${shop.website}" target="_blank" rel="noopener" class="shop-site-link">${t('visitWebsite')} →</a></p>` : ''}
    </div>` :
    `<p class="modal-no-contact">${t('noContact')}</p>`;

  const clusterBadge = isMarketCluster(shop) ?
    `<span class="modal-cluster-badge">${t('marketCluster')}</span>` : '';

  document.getElementById('shops-modal-body').innerHTML = `
    <div class="modal-head">
      <h2 id="shops-modal-title">${shop.name}</h2>
      <div class="modal-badges">
        ${clusterBadge}
        <span class="modal-details-badge modal-details-${shop.detailsAvailability}">${t('detailsSignal')}: ${detailsAvailabilityLabel(shop.detailsAvailability)}</span>
        ${shop.featured ? `<span class="modal-featured-badge">★ ${t('featured')}</span>` : ''}
      </div>
    </div>

    ${actionsHTML}

    <div class="modal-meta">
      <div class="modal-meta-item">
        <span class="modal-meta-label">${t('location')}</span>
        <span class="modal-meta-value">${shop.city}, ${countryName(country)} · ${regionName(country.group)}</span>
      </div>
      <div class="modal-meta-item">
        <span class="modal-meta-label">${t('market')}</span>
        <span class="modal-meta-value">${shop.market}</span>
      </div>
      <div class="modal-meta-item">
        <span class="modal-meta-label">${t('category')}</span>
        <span class="modal-meta-value">${shop.category}</span>
      </div>
    </div>

    ${specialties ? `<div class="modal-tags">
      <span class="modal-tags-label">${t('specialties')}</span>
      <div class="modal-tags-wrap">${specialties}</div>
    </div>` : ''}

    <div class="modal-notes">
      <p>${shop.notes}</p>
    </div>

    ${contactHTML}
  `;

  // Bind action button handlers
  const shortlistBtn = modal.querySelector('.modal-action-btn--shortlist');
  if (shortlistBtn) {
    shortlistBtn.addEventListener('click', () => {
      toggleShortlist(shop.id);
      openModal(shop); // Re-open to refresh button state
    });
  }
  
  const shareBtn = modal.querySelector('.modal-action-btn--share');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => shareShop(shop));
  }

  modal.hidden = false;
}

function closeModal() {
  document.getElementById('shops-modal').hidden = true;
}

function applyStaticText() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  document.getElementById('shops-kicker').textContent = t('kicker');
  document.getElementById('shops-title').textContent = t('title');
  document.getElementById('shops-lead').textContent = t('lead');
  
  // Trust banner with formatted date
  const today = new Date();
  const dateStr = STATE.lang === 'ar' 
    ? today.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
    : today.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const trustEl = document.getElementById('shops-last-updated');
  if (trustEl) {
    trustEl.textContent = t('trustBanner').replace('{date}', dateStr);
  }
  
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
  return SHOPS.filter((shop) => {
    const country = countryByCode(shop.countryCode);
    if (!country) return false;
    if (STATE.region !== 'all' && country.group !== STATE.region) return false;
    if (STATE.country !== 'all' && shop.countryCode !== STATE.country) return false;
    if (STATE.city !== 'all' && shop.city !== STATE.city) return false;
    return true;
  });
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

  // Guard against missing DOM elements
  if (!regionSelect || !countrySelect || !citySelect || !specialtySelect) {
    console.warn('[shops] Filter select elements not found');
    return;
  }

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

  // Update mobile filter badge count
  const badge = document.getElementById('shops-filter-badge');
  if (badge) {
    const count = labels.length;
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }
}

function renderCards(shops) {
  const grid = document.getElementById('shops-grid');
  if (!grid) {
    console.warn('[shops] Element #shops-grid not found');
    return;
  }

  grid.innerHTML = shops.map((shop, idx) => {
    const country = countryByCode(shop.countryCode);
    const specialties = (shop.specialties || []).map((item) => `<span class="shop-tag">${item}</span>`).join('');
    const isCluster = isMarketCluster(shop);
    const clusterBadge = isCluster ? `<span class="shop-cluster-badge">${t('marketCluster')}</span>` : '';
    const inShortlist = isInShortlist(shop.id);

    const contactParts = [];
    if (shop.phone) contactParts.push(`${t('phone')}: ${shop.phone}`);
    if (shop.website) {
      contactParts.push(`<a href="${shop.website}" target="_blank" rel="noopener" class="shop-site-link">${t('visitWebsite')}</a>`);
    }

    return `
      <article class="shop-card${shop.featured ? ' shop-card--featured' : ''}${isCluster ? ' shop-card--cluster' : ''}" data-shop-id="${shop.id}">
        <header class="shop-card-head">
          <div>
            <h3>${shop.name}</h3>
            <div class="shop-card-badges">
              ${clusterBadge}
              ${shop.featured ? `<span class="shop-featured">${t('featured')}</span>` : ''}
            </div>
          </div>
          <span class="shop-signal shop-signal--${shop.detailsAvailability}">${detailsAvailabilityLabel(shop.detailsAvailability)}</span>
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
        
        <div class="shop-actions-row">
          <button class="shop-action-btn shop-action-btn--save ${inShortlist ? 'is-saved' : ''}" 
                  type="button" data-shop-id="${shop.id}" aria-label="${inShortlist ? t('removeFromShortlist') : t('saveToShortlist')}">
            <span class="shop-action-icon">${inShortlist ? '✓' : '+'}</span>
            <span class="shop-action-label">${inShortlist ? t('saved') : t('saveToShortlist')}</span>
          </button>
          <button class="shop-action-btn shop-action-btn--share" type="button" data-shop-id="${shop.id}" aria-label="${t('shareShop')}">
            <span class="shop-action-icon">↗</span>
            <span class="shop-action-label">${t('shareShop')}</span>
          </button>
          ${shop.phone ? `<a href="tel:${shop.phone.replace(/\s+/g, '')}" class="shop-action-btn shop-action-btn--call" aria-label="${t('callShop')}">
            <span class="shop-action-icon">📞</span>
            <span class="shop-action-label">${t('callShop')}</span>
          </a>` : ''}
          ${country?.slug ? `<a href="countries/${country.slug}.html" class="shop-action-btn shop-action-btn--country" aria-label="${t('viewCountryPage')}: ${countryName(country)}">
            <span class="shop-action-icon">📄</span>
            <span class="shop-action-label">${countryName(country)}</span>
          </a>` : ''}
        </div>
        
        <p class="shop-contact">${contactParts.join(' · ') || t('noContact')}</p>
      </article>
    `;
  }).join('');

  // Bind click handlers after rendering
  bindShopCardHandlers();
}

// Separate binding function to prevent handler orphaning
function bindShopCardHandlers() {
  const grid = document.getElementById('shops-grid');
  if (!grid) return;

  // Bind card click -> open modal
  grid.querySelectorAll('.shop-card').forEach((card) => {
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);

    newCard.addEventListener('click', (e) => {
      // Ignore clicks on action buttons
      if (e.target.closest('.shop-action-btn')) return;
      
      const shopId = newCard.dataset.shopId;
      const shop = SHOPS.find((s) => s.id === shopId);
      if (shop) openModal(shop);
    });
  });

  // Bind action buttons
  grid.querySelectorAll('.shop-action-btn--save').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const shopId = btn.dataset.shopId;
      toggleShortlist(shopId);
    });
  });

  grid.querySelectorAll('.shop-action-btn--share').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const shopId = btn.dataset.shopId;
      const shop = SHOPS.find((s) => s.id === shopId);
      if (shop) shareShop(shop);
    });
  });
}

function renderFeaturedSection() {
  const featuredSection = document.getElementById('shops-featured');
  const featuredGrid = document.getElementById('shops-featured-grid');

  if (!featuredSection || !featuredGrid) {
    console.warn('[shops] Featured section elements not found');
    return;
  }

  const featured = shopsMatchingPrimaryFilters().filter((shop) => shop.featured);

  if (!featured.length) {
    featuredSection.hidden = true;
    return;
  }

  featuredSection.hidden = false;
  featuredGrid.innerHTML = featured.map((shop) => {
    const country = countryByCode(shop.countryCode);
    const specialties = (shop.specialties || []).slice(0, 2).map((item) => `<span class="featured-tag">${item}</span>`).join('');
    return `
      <article class="featured-card" data-shop-id="${shop.id}" style="cursor: pointer;">
        <div class="featured-header">
          <h3>${shop.name}</h3>
          <span class="featured-location">${shop.city} · ${countryName(country)}</span>
        </div>
        <p class="featured-market">${shop.market}</p>
        <div class="featured-tags">${specialties}</div>
      </article>
    `;
  }).join('');

  // Bind click handlers after rendering
  bindFeaturedCardHandlers();
}

// Separate binding function for featured cards
function bindFeaturedCardHandlers() {
  const featuredGrid = document.getElementById('shops-featured-grid');
  if (!featuredGrid) return;

  featuredGrid.querySelectorAll('.featured-card').forEach((card) => {
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);

    newCard.addEventListener('click', () => {
      const shopId = newCard.dataset.shopId;
      const shop = SHOPS.find((s) => s.id === shopId);
      if (shop) openModal(shop);
    });
  });
}

function renderFilterPills() {
  const pillsContainer = document.getElementById('shops-filter-pills');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pills = [];

  if (STATE.region !== 'all') pills.push({ type: 'region', value: STATE.region, label: regionName(STATE.region) });
  if (STATE.country !== 'all') {
    const country = countryByCode(STATE.country);
    if (country) pills.push({ type: 'country', value: STATE.country, label: countryName(country) });
  }
  if (STATE.city !== 'all') pills.push({ type: 'city', value: STATE.city, label: STATE.city });
  if (STATE.specialty !== 'all') pills.push({ type: 'specialty', value: STATE.specialty, label: STATE.specialty });
  if (STATE.search.trim()) {
    const q = STATE.search.trim();
    pills.push({ type: 'search', value: '', label: `"${esc(q)}"`, ariaLabel: `Remove "${q}" search filter` });
  }

  if (!pills.length) {
    pillsContainer.innerHTML = '';
    return;
  }

  pillsContainer.innerHTML = pills.map((pill) => {
    const ariaLabel = pill.ariaLabel || `Remove ${pill.label} filter`;
    return `
      <button class="shops-filter-pill" data-type="${pill.type}" data-value="${pill.value || ''}" type="button" aria-label="${ariaLabel}">
        ${pill.label}
        <span class="shops-filter-pill-remove" aria-hidden="true">×</span>
      </button>
    `;
  }).join('');

  pillsContainer.querySelectorAll('.shops-filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const type = pill.dataset.type;
      if (type === 'region') STATE.region = 'all';
      if (type === 'country') STATE.country = 'all';
      if (type === 'city') STATE.city = 'all';
      if (type === 'specialty') STATE.specialty = 'all';
      if (type === 'search') {
        STATE.search = '';
        document.getElementById('shops-search').value = '';
      }
      buildFilters();
      render();
    });
  });
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

function renderShortlistBar() {
  const bar = document.getElementById('shops-shortlist-bar');
  const countEl = document.getElementById('shops-shortlist-count');
  if (!bar || !countEl) return;
  
  const count = STATE.shortlist.length;
  if (count === 0) {
    bar.hidden = true;
  } else {
    bar.hidden = false;
    countEl.textContent = t('shortlistCount')(count);
  }
}

function render() {
  syncUrlToState();
  const shops = filterShops();
  const empty = document.getElementById('shops-empty');
  const count = document.getElementById('shops-count');
  if (count) count.textContent = t('count')(shops.length);
  activeFilterSummary();
  renderFilterPills();
  renderFeaturedSection();
  renderShortlistBar();

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

  // Modal events
  const modal = document.getElementById('shops-modal');
  const modalClose = document.getElementById('shops-modal-close') || modal.querySelector('.shops-modal-close');
  const modalOverlay = modal.querySelector('.shops-modal-overlay');

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
}

function updateLanguage() {
  applyStaticText();
  buildFilters();
  updateHeaderStats();
  populatePopularChips();
  render();
}

function init() {
  // Validate data and DOM prerequisites
  if (!SHOPS || SHOPS.length === 0) {
    console.error('[shops] SHOPS data is empty or not loaded');
    document.body.innerHTML = '<p>Error: Shop data failed to load.</p>';
    return;
  }

  // Validate critical DOM elements exist
  const requiredElements = ['shops-grid', 'shops-empty', 'shops-featured', 'shops-featured-grid', 'shops-filter-pills'];
  for (const id of requiredElements) {
    if (!document.getElementById(id)) {
      console.error(`[shops] Required element #${id} not found in DOM`);
    }
  }

  try {
    const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
    if (prefs.lang === 'ar' || prefs.lang === 'en') STATE.lang = prefs.lang;
  } catch {}

  // Apply URL query params to initial state (e.g. ?country=AE&region=gcc)
  const _p = new URLSearchParams(location.search);
  const _pRegion  = (_p.get('region')    || '').toLowerCase();
  const _pCountry = (_p.get('country')   || '').toUpperCase();
  const _pCity    =  _p.get('city')      || '';
  const _pSpec    =  _p.get('specialty') || '';
  const _pSearch  =  _p.get('search')    || _p.get('q') || '';

  if (_pRegion && Object.prototype.hasOwnProperty.call(REGIONS, _pRegion)) STATE.region = _pRegion;
  if (_pCountry)  STATE.country   = _pCountry;   // buildFilters() resets to 'all' if invalid
  if (_pCity)     STATE.city      = _pCity;
  if (_pSpec)     STATE.specialty = _pSpec;
  if (_pSearch)   STATE.search    = _pSearch;

  const navResult = injectNav(STATE.lang, 0);
  injectBreadcrumbs('shops');
  injectFooter(STATE.lang, 0);
  injectTicker(STATE.lang, 0);

  // Populate ticker from cache so it never shows all-dashes
  const cachedGold = cache.getFallbackGoldPrice();
  const cachedFX   = cache.getFallbackFXRates();
  if (cachedGold?.price) {
    const spot = cachedGold.price;
    const aedRate = CONSTANTS.AED_PEG;
    const purity = (k) => KARATS.find(x => x.code === k)?.purity ?? 1;
    const aedGram = (k) => (spot / CONSTANTS.TROY_OZ_GRAMS) * purity(k) * aedRate;
    updateTicker({
      xauUsd:  spot,
      uae24k:  aedGram('24'),
      uae22k:  aedGram('22'),
      uae21k:  aedGram('21'),
      uae18k:  aedGram('18'),
    });
  }

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
  // Sync search input DOM value if set from URL param
  if (STATE.search) {
    const el = document.getElementById('shops-search');
    if (el) el.value = STATE.search;
  }
  
  // Handle direct shop link from URL (?shop=ID)
  const _pShop = new URLSearchParams(location.search).get('shop');
  if (_pShop) {
    const shop = SHOPS.find((s) => s.id === _pShop);
    if (shop) {
      setTimeout(() => openModal(shop), 500);
    }
  }
  
  updateLanguage();

  // Mobile filter toggle
  const filterToggle = document.getElementById('shops-filter-toggle');
  const filterPanel  = document.getElementById('shops-filter-panel');
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', () => {
      const open = filterPanel.classList.toggle('is-open');
      filterToggle.setAttribute('aria-expanded', String(open));
    });
  }
  
  // Shortlist bar clear button
  const shortlistClear = document.getElementById('shops-shortlist-clear');
  if (shortlistClear) {
    shortlistClear.addEventListener('click', () => {
      STATE.shortlist = [];
      try { localStorage.setItem('shops_shortlist', '[]'); } catch {}
      render();
    });
  }
}

init();
