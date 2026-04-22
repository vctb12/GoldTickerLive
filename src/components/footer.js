import { FORMSPREE_ENDPOINT } from '../config/index.js';

/**
 * Shared footer component — 5-column dark premium.
 * Call injectFooter(lang, depth) from any page entry point.
 */

export function injectFooter(lang = 'en', depth = 0) {
  const isAr = lang === 'ar';

  function r(href) {
    const base = href.replace(/^\.\.\//, '');
    if (depth === 0) return base;
    return '../'.repeat(depth) + base;
  }

  const year = new Date().getFullYear();

  const html = `
<footer class="site-footer-global">
  <div class="footer-top">
    <div class="footer-inner">

      <!-- Brand column -->
      <div class="footer-col footer-col--brand">
        <a href="${r('../index.html')}" class="footer-brand-link" aria-label="GoldPrices Home">
          <span class="footer-brand-icon" aria-hidden="true">◈</span>
          <span class="footer-brand-name">${isAr ? 'أسعار الذهب' : 'GoldPrices'}</span>
        </a>
        <p class="footer-tagline">${
          isAr
            ? 'تقديرات الذهب المباشرة للخليج والعالم العربي'
            : 'Live gold estimates for the Gulf &amp; Arab world'
        }</p>
        <div class="footer-brand-badges">
          <span class="footer-badge">${isAr ? '24+ دولة' : '24+ Countries'}</span>
          <span class="footer-badge">${isAr ? '7 عيارات' : '7 Karats'}</span>
          <span class="footer-badge">${isAr ? 'ثنائي اللغة' : 'EN / AR'}</span>
        </div>
      </div>

      <!-- Markets column -->
      <div class="footer-col footer-col--links">
        <h4 class="footer-col-heading">${isAr ? 'الأسواق' : 'Markets'}</h4>
        <a href="${r('../tracker.html')}">${isAr ? 'تتبع مباشر' : 'Live Tracker'}</a>
        <a href="${r('../countries/uae/')}">${isAr ? 'ذهب الإمارات اليوم' : 'UAE Gold Today'}</a>
        <a href="${r('../tracker.html#mode=compare')}">${isAr ? 'مقارنة دول الخليج' : 'GCC Compare'}</a>
        <a href="${r('../tracker.html#mode=archive')}">${isAr ? 'البيانات التاريخية' : 'History &amp; Data'}</a>
        <a href="${r('../shops.html')}">${isAr ? 'دليل المحلات' : 'Shop Directory'}</a>
        <a href="${r('../countries/index.html')}">${isAr ? 'جميع الدول' : 'All Countries'}</a>
      </div>

      <!-- Tools column -->
      <div class="footer-col footer-col--links">
        <h4 class="footer-col-heading">${isAr ? 'الأدوات' : 'Tools'}</h4>
        <a href="${r('../calculator.html')}">${isAr ? 'حاسبة الذهب' : 'Gold Calculator'}</a>
        <a href="${r('../tools/weight-converter.html')}">${isAr ? 'محول الأوزان' : 'Weight Converter'}</a>
        <a href="${r('../tools/zakat-calculator.html')}">${isAr ? 'حاسبة الزكاة' : 'Zakat Calculator'}</a>
        <a href="${r('../tools/investment-return.html')}">${isAr ? 'عائد الاستثمار' : 'Investment Return'}</a>
        <a href="${r('../tracker.html#mode=live&panel=alerts')}">${isAr ? 'تنبيهات السعر' : 'Price Alerts'}</a>
        <a href="${r('../gold-price-history/')}">${isAr ? 'سجل الأسعار' : 'Price History'}</a>
        <a href="${r('../order-gold/')}">${isAr ? 'اطلب الذهب' : 'Order Gold'}</a>
        <a href="${r('../invest.html')}">${isAr ? 'دليل الاستثمار' : 'Investing Guide'}</a>
      </div>

      <!-- GCC column -->
      <div class="footer-col footer-col--links">
        <h4 class="footer-col-heading">${isAr ? 'دول الخليج' : 'GCC Prices'}</h4>
        <a href="${r('../countries/uae/')}">${isAr ? 'الإمارات' : 'UAE'}</a>
        <a href="${r('../countries/saudi-arabia/')}">${isAr ? 'السعودية' : 'Saudi Arabia'}</a>
        <a href="${r('../countries/kuwait/')}">${isAr ? 'الكويت' : 'Kuwait'}</a>
        <a href="${r('../countries/qatar/')}">${isAr ? 'قطر' : 'Qatar'}</a>
        <a href="${r('../countries/bahrain/')}">${isAr ? 'البحرين' : 'Bahrain'}</a>
        <a href="${r('../countries/oman/')}">${isAr ? 'عُمان' : 'Oman'}</a>
      </div>

      <!-- More Regions + Learn column -->
      <div class="footer-col footer-col--links">
        <h4 class="footer-col-heading">${isAr ? 'مناطق أخرى' : 'More Regions'}</h4>
        <a href="${r('../countries/egypt/')}">${isAr ? 'مصر' : 'Egypt'}</a>
        <a href="${r('../countries/jordan/')}">${isAr ? 'الأردن' : 'Jordan'}</a>
        <a href="${r('../countries/morocco/')}">${isAr ? 'المغرب' : 'Morocco'}</a>
        <a href="${r('../countries/india/')}">${isAr ? 'الهند' : 'India'}</a>
        <h4 class="footer-col-heading footer-col-heading--mt">${isAr ? 'مدن رئيسية' : 'Top Cities'}</h4>
        <a href="${r('../countries/uae/cities/dubai.html')}">${isAr ? 'دبي' : 'Dubai'}</a>
        <a href="${r('../countries/saudi-arabia/cities/riyadh.html')}">${isAr ? 'الرياض' : 'Riyadh'}</a>
        <a href="${r('../countries/egypt/cities/cairo.html')}">${isAr ? 'القاهرة' : 'Cairo'}</a>
        <h4 class="footer-col-heading footer-col-heading--mt">${isAr ? 'تعلّم وتحليلات' : 'Learn &amp; Insights'}</h4>
        <a href="${r('../learn.html')}">${isAr ? 'دليل الذهب' : 'Gold Guide'}</a>
        <a href="${r('../guides/buying-guide.html')}">${isAr ? 'دليل الشراء' : 'Buying Guide'}</a>
        <a href="${r('../methodology.html')}">${isAr ? 'المنهجية' : 'Methodology'}</a>
        <a href="${r('../insights.html')}">${isAr ? 'تحليلات' : 'Insights'}</a>
      </div>

    </div>
  </div>

  ${
    FORMSPREE_ENDPOINT
      ? `
  <div class="footer-newsletter">
    <div class="footer-inner">
      <div class="footer-newsletter-inner">
        <div class="footer-newsletter-text">
          <strong>${isAr ? '📬 النشرة الإخبارية' : '📬 Gold Price Alerts'}</strong>
          <span>${isAr ? 'احصل على تحديثات أسعار الذهب الأسبوعية' : 'Get weekly gold price updates delivered to your inbox'}</span>
        </div>
        <form class="footer-newsletter-form" action="${FORMSPREE_ENDPOINT}" method="POST" aria-label="${isAr ? 'اشتراك النشرة' : 'Newsletter signup'}">
          <input type="email" name="email" placeholder="${isAr ? 'بريدك الإلكتروني' : 'Your email address'}" required aria-label="${isAr ? 'البريد الإلكتروني' : 'Email address'}" autocomplete="email" />
          <button type="submit" class="btn btn-primary">${isAr ? 'اشتراك' : 'Subscribe'}</button>
        </form>
      </div>
    </div>
  </div>
  `
      : ''
  }

  <div class="footer-bottom">
    <div class="footer-inner">
      <div class="footer-sources">
        <span>${isAr ? 'بيانات الذهب:' : 'Gold data:'} <a href="https://gold-api.com" target="_blank" rel="noopener">gold-api.com</a></span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span>${isAr ? 'أسعار الصرف:' : 'FX data:'} <a href="https://open.er-api.com" target="_blank" rel="noopener">open.er-api.com</a></span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span>${isAr ? 'الدرهم الإماراتي:' : 'AED peg:'} <a href="${r('../methodology.html')}">${isAr ? '3.6725 ثابت' : '3.6725 fixed'}</a></span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span>${isAr ? 'أونصة ترويوا:' : 'Troy oz:'} 31.1035 g</span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span class="footer-freshness"></span>
        <span class="footer-data-updated"></span>
      </div>
      <div class="footer-bottom-row">
        <p class="footer-disclaimer">${
          isAr
            ? 'قيم تقديرية مكافئة للسبيكة فقط. قد تختلف أسعار التجزئة والمجوهرات. ليست نصيحة مالية.'
            : 'Estimated bullion-equivalent values only. Retail and jewellery prices may differ. Not financial advice.'
        }</p>
        <p class="footer-copy">© ${year} GoldPrices · <a href="${r('../terms.html')}">${isAr ? 'شروط الخدمة' : 'Terms'}</a> · <a href="${r('../privacy.html')}">${isAr ? 'الخصوصية' : 'Privacy'}</a> · <span class="footer-copy-trigger" id="footer-admin-trigger" aria-hidden="true" style="cursor:default;user-select:none">⚡</span></p>
      </div>
    </div>
  </div>
</footer>`;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const footerEl = wrapper.firstElementChild;
  document.body.appendChild(footerEl);

  // Populate gold-data freshness timestamp from localStorage
  try {
    const ts = localStorage.getItem('goldprices_gold_ts');
    const freshnessEl = footerEl.querySelector('.footer-freshness');
    if (freshnessEl && ts) {
      const d = new Date(Number(ts));
      if (!isNaN(d.getTime())) {
        const isAr2 =
          document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
        freshnessEl.textContent =
          (isAr2 ? 'آخر تحديث: ' : 'Gold: ') +
          d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
  } catch (_) {}

  // Populate "Data last updated" from goldUpdatedAt key
  try {
    const updatedAt = localStorage.getItem('goldUpdatedAt');
    const dataUpdatedEl = footerEl.querySelector('.footer-data-updated');
    if (dataUpdatedEl && updatedAt) {
      const d = new Date(updatedAt);
      if (!isNaN(d.getTime())) {
        const isAr2 =
          document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
        dataUpdatedEl.textContent =
          (isAr2 ? '· آخر تحديث البيانات: ' : '· Data last updated: ') +
          d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
  } catch (_) {}

  // ── Admin Access Methods (Easter Eggs) ──────────────────────────────────────
  // Method 3: Triple-click on ⚡ symbol in footer
  // Method 4: Keyboard shortcut Ctrl+Shift+A
  // Method 5: Konami code ↑↑↓↓←→←→BA
  _initAdminAccessMethods(depth);
}

/**
 * Computes the admin URL relative to the current page depth.
 * @param {number} depth
 * @returns {string}
 */
function _getAdminUrl(depth) {
  if (depth === 0) return 'admin/login/';
  return '../'.repeat(depth) + 'admin/login/';
}

/**
 * Show admin quick-access popup then redirect.
 * @param {string} adminUrl
 */
function _showAdminPopup(adminUrl) {
  // Don't show if already on an admin page
  if (window.location.pathname.includes('/admin/')) return;

  let popup = document.getElementById('gp-admin-secret-popup');
  if (popup) {
    popup.remove();
  }

  popup = document.createElement('div');
  popup.id = 'gp-admin-secret-popup';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Admin panel access');
  popup.style.cssText = [
    'position:fixed',
    'bottom:80px',
    'right:20px',
    'z-index:99999',
    'background:linear-gradient(135deg,#0a1628,#0d1526)',
    'border:1px solid rgba(245,158,11,0.55)',
    'border-radius:16px',
    'box-shadow:0 12px 48px rgba(0,0,0,0.7),0 0 30px rgba(245,158,11,0.12)',
    'padding:20px 24px',
    'max-width:280px',
    'animation:gp-admin-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
  ].join(';');

  popup.innerHTML = `
    <style>
      @keyframes gp-admin-pop {
        from { opacity:0; transform:scale(0.82) translateY(14px); }
        to   { opacity:1; transform:scale(1) translateY(0); }
      }
    </style>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <span style="font-size:22px;line-height:1">⚙️</span>
      <strong style="color:#f1f5f9;font-size:0.9375rem;letter-spacing:-0.01em">GoldAdmin</strong>
      <button id="gp-admin-popup-close" style="margin-left:auto;background:none;border:none;color:#64748b;cursor:pointer;font-size:18px;line-height:1;padding:0" aria-label="Close">✕</button>
    </div>
    <p style="color:#8ba3c7;font-size:0.8125rem;line-height:1.5;margin-bottom:14px">
      Admin panel access detected. Click below to sign in.
    </p>
    <a href="${adminUrl}" style="display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#0f172a;font-weight:700;font-size:0.875rem;border-radius:8px;padding:10px 16px;text-decoration:none;justify-content:center;box-shadow:0 2px 12px rgba(245,158,11,0.3)">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      Open Admin Panel
    </a>`;

  document.body.appendChild(popup);

  const closeBtn = document.getElementById('gp-admin-popup-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => popup.remove());
  }

  // Auto-close after 8 seconds
  setTimeout(() => {
    if (popup.parentNode) popup.remove();
  }, 8000);

  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', function onDocClick(e) {
      if (!popup.contains(e.target)) {
        popup.remove();
        document.removeEventListener('click', onDocClick);
      }
    });
  }, 300);
}

function _initAdminAccessMethods(depth) {
  const adminUrl = _getAdminUrl(depth);

  // Method 3: Triple-click on ⚡ footer trigger
  const trigger = document.getElementById('footer-admin-trigger');
  if (trigger) {
    let clicks = 0;
    let clickTimer;
    trigger.addEventListener('click', () => {
      clicks++;
      clearTimeout(clickTimer);
      if (clicks >= 3) {
        clicks = 0;
        _showAdminPopup(adminUrl);
      } else {
        clickTimer = setTimeout(() => {
          clicks = 0;
        }, 600);
      }
    });
  }

  // Method 4: Keyboard shortcut Ctrl+Shift+A
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      _showAdminPopup(adminUrl);
    }
  });

  // Method 5: Konami code ↑↑↓↓←→←→BA
  const KONAMI = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  let konamiIdx = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key === KONAMI[konamiIdx]) {
      konamiIdx++;
      if (konamiIdx === KONAMI.length) {
        konamiIdx = 0;
        _showAdminPopup(adminUrl);
      }
    } else {
      konamiIdx = e.key === KONAMI[0] ? 1 : 0;
    }
  });
}
