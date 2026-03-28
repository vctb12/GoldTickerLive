/**
 * Shared navigation component.
 * Call injectNav(lang) from any page entry point.
 * Highlights the current page link automatically.
 */

const NAV_LINKS = {
  en: [
    { href: '../index.html',       key: 'nav.home',       label: 'Home' },
    { href: '../tracker.html',     key: 'nav.tracker',    label: 'Live Tracker' },
    { href: '../calculator.html',  key: 'nav.calculator', label: 'Calculator' },
    { href: '../learn.html',       key: 'nav.learn',      label: 'Learn' },
    { href: '../insights.html',    key: 'nav.insights',   label: 'Insights' },
  ],
  ar: [
    { href: '../index.html',       key: 'nav.home',       label: 'الرئيسية' },
    { href: '../tracker.html',     key: 'nav.tracker',    label: 'تتبع مباشر' },
    { href: '../calculator.html',  key: 'nav.calculator', label: 'حاسبة' },
    { href: '../learn.html',       key: 'nav.learn',      label: 'تعلّم' },
    { href: '../insights.html',    key: 'nav.insights',   label: 'تحليلات' },
  ],
};

// Adjust hrefs for root-level pages (index.html, tracker.html, etc.)
function resolveHref(href, depth) {
  if (depth === 0) return href.replace('../', '');
  return href;
}

function currentPageMatch(href) {
  const path = location.pathname;
  const base = href.replace('../', '').replace('.html', '');
  return path.includes(base) || (base === 'index' && (path.endsWith('/') || path.endsWith('/Gold-Prices/')));
}

export function injectNav(lang = 'en', depth = 0) {
  const links = NAV_LINKS[lang] || NAV_LINKS.en;
  const isRtl = lang === 'ar';

  const langToggleLabel = lang === 'en' ? 'العربية' : 'English';

  const linksHtml = links.map(link => {
    const href = resolveHref(link.href, depth);
    const active = currentPageMatch(href);
    return `<a href="${href}" class="nav-link${active ? ' nav-link--active' : ''}">${link.label}</a>`;
  }).join('');

  const html = `
<nav class="site-nav" role="navigation" aria-label="Main navigation" dir="${isRtl ? 'rtl' : 'ltr'}">
  <div class="nav-inner">
    <a href="${resolveHref('../index.html', depth)}" class="nav-brand" aria-label="Gold Prices Home">
      <span class="nav-brand-icon" aria-hidden="true">◈</span>
      <span class="nav-brand-text">${lang === 'ar' ? 'أسعار الذهب' : 'GoldPrices'}</span>
    </a>
    <div class="nav-links" role="list">
      ${linksHtml}
    </div>
    <div class="nav-actions">
      <button id="nav-lang-toggle" class="nav-lang-btn" aria-label="Toggle language">${langToggleLabel}</button>
    </div>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="nav-mobile-menu" id="nav-mobile-menu" hidden>
    ${linksHtml}
    <button id="nav-lang-toggle-mobile" class="nav-lang-btn nav-lang-btn--mobile">${langToggleLabel}</button>
  </div>
</nav>`;

  // Insert before <main> or at top of <body>
  const target = document.querySelector('main') || document.body.firstElementChild;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  document.body.insertBefore(wrapper.firstElementChild, target);

  // Hamburger toggle
  const burger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = !mobileMenu.hidden;
      mobileMenu.hidden = open;
      burger.setAttribute('aria-expanded', String(!open));
    });
  }

  return {
    // Returns the lang toggle buttons so the page can wire language switching
    getLangToggleButtons: () => [
      document.getElementById('nav-lang-toggle'),
      document.getElementById('nav-lang-toggle-mobile'),
    ].filter(Boolean),
  };
}

export function updateNavLang(lang) {
  const isAr = lang === 'ar';
  const newLabel = isAr ? 'English' : 'العربية';
  document.querySelectorAll('#nav-lang-toggle, #nav-lang-toggle-mobile')
    .forEach(btn => { btn.textContent = newLabel; });
  const nav = document.querySelector('.site-nav');
  if (nav) nav.setAttribute('dir', isAr ? 'rtl' : 'ltr');
}
