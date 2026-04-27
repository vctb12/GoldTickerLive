import { FORMSPREE_ENDPOINT } from '../config/index.js';
import { NAV_DATA } from './nav-data.js';

/**
 * Shared footer component — 5-column dark premium.
 * Call injectFooter(lang, depth) from any page entry point.
 */

export function injectFooter(lang = 'en', depth = 0) {
  const isAr = lang === 'ar';
  const navData = NAV_DATA[lang] || NAV_DATA.en;

  function r(href) {
    if (href.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
    const base = href.replace(/^\.\.\//, '');
    if (depth === 0) return base;
    return '../'.repeat(depth) + base;
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const year = new Date().getFullYear();
  const footerColumnsHtml = navData.groups
    .map((group) => {
      const sectionLinks = group.sections
        .map((section) => {
          const links = section.items
            .slice(0, 3)
            .map((item) => `<a href="${r(item.href)}">${esc(item.label)}</a>`)
            .join('');
          return `<div class="footer-link-section">
            <h5 class="footer-section-heading">${esc(section.label)}</h5>
            ${links}
          </div>`;
        })
        .join('');

      return `<div class="footer-col footer-col--links">
        <h4 class="footer-col-heading">${esc(group.label)}</h4>
        <p class="footer-col-note">${esc(group.description)}</p>
        ${sectionLinks}
      </div>`;
    })
    .join('');

  const html = `
<footer class="site-footer-global">
  <div class="footer-top">
    <div class="footer-inner">

      <!-- Brand column -->
      <div class="footer-col footer-col--brand">
        <a href="${r('../index.html')}" class="footer-brand-link" aria-label="GoldTickerLive Home">
          <span class="footer-brand-icon" aria-hidden="true">◈</span>
          <span class="footer-brand-name">${isAr ? 'GoldTickerLive' : 'GoldTickerLive'}</span>
        </a>
        <p class="footer-tagline">${
          isAr
            ? 'أسعار ذهب مرجعية مباشرة للخليج والعالم العربي'
            : 'Live spot-linked gold reference prices for the Gulf &amp; Arab world'
        }</p>
        <div class="footer-brand-badges">
          <span class="footer-badge">${isAr ? '24+ دولة' : '24+ Countries'}</span>
          <span class="footer-badge">${isAr ? '7 عيارات' : '7 Karats'}</span>
          <span class="footer-badge">${isAr ? 'ثنائي اللغة' : 'EN / AR'}</span>
        </div>
      </div>

      ${footerColumnsHtml}

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
        <span>${isAr ? 'بيانات الأسعار من' : 'Price data by'} <a href="https://goldpricez.com" target="_blank" rel="noopener">GoldPriceZ.com</a></span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span>${isAr ? 'أسعار الصرف:' : 'FX data:'} <a href="https://open.er-api.com" target="_blank" rel="noopener">open.er-api.com</a></span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span>${isAr ? 'الدرهم الإماراتي:' : 'AED peg:'} <a href="${r('../methodology.html')}">${isAr ? '3.6725 ثابت' : '3.6725 fixed'}</a></span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span>${isAr ? 'الأونصة التروية:' : 'Troy oz:'} 31.1035 g</span>
        <span class="footer-sep" aria-hidden="true">·</span>
        <span class="footer-freshness"></span>
        <span class="footer-data-updated"></span>
      </div>
      <div class="footer-bottom-row">
        <p class="footer-disclaimer">${
          isAr
            ? 'قيم تقديرية مكافئة للسبيكة فقط. قد تختلف أسعار التجزئة والمجوهرات. ليست نصيحة مالية.'
            : 'Spot-linked reference estimates only. Retail and jewellery prices may include making charges, premiums, and tax. Not financial advice.'
        }</p>
        <p class="footer-copy">© ${year} GoldTickerLive · <a href="${r('../terms.html')}">${isAr ? 'شروط الخدمة' : 'Terms'}</a> · <a href="${r('../privacy.html')}">${isAr ? 'الخصوصية' : 'Privacy'}</a> · <span class="footer-copy-trigger" id="footer-admin-trigger" aria-hidden="true" style="cursor:default;user-select:none">⚡</span></p>
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
