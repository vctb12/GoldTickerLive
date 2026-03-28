/**
 * Shared navigation component — premium bilingual drawer nav.
 * Call injectNav(lang, depth) from any page entry point.
 * Highlights the current page link automatically.
 */

const NAV_LINKS = {
  en: [
    { href: '../index.html',      label: 'Home' },
    { href: '../tracker.html',    label: 'Live Tracker' },
    { href: '../calculator.html', label: 'Calculator' },
    { href: '../learn.html',      label: 'Learn' },
    { href: '../insights.html',   label: 'Insights' },
  ],
  ar: [
    { href: '../index.html',      label: 'الرئيسية' },
    { href: '../tracker.html',    label: 'تتبع مباشر' },
    { href: '../calculator.html', label: 'حاسبة' },
    { href: '../learn.html',      label: 'تعلّم' },
    { href: '../insights.html',   label: 'تحليلات' },
  ],
};

function resolveHref(href, depth) {
  if (depth === 0) return href.replace('../', '');
  return href;
}

function currentPageMatch(href) {
  const path = location.pathname;
  const base = href.replace('../', '').replace('.html', '');
  return (
    path.includes(base) ||
    (base === 'index' && (path.endsWith('/') || path.endsWith('/Gold-Prices/')))
  );
}

function buildLinkHtml(links, depth, extraClass = '') {
  return links
    .map(link => {
      const href = resolveHref(link.href, depth);
      const active = currentPageMatch(href);
      const cls = ['nav-link', extraClass, active ? 'nav-link--active' : '']
        .filter(Boolean)
        .join(' ');
      return `<a href="${href}" class="${cls}">${link.label}</a>`;
    })
    .join('');
}

export function injectNav(lang = 'en', depth = 0) {
  const links = NAV_LINKS[lang] || NAV_LINKS.en;
  const isRtl = lang === 'ar';
  const langToggleLabel = lang === 'en' ? 'العربية' : 'English';
  const homeHref = resolveHref('../index.html', depth);

  const desktopLinksHtml = buildLinkHtml(links, depth);
  const drawerLinksHtml = buildLinkHtml(links, depth, 'nav-drawer-link');

  const html = `
<nav class="site-nav" role="navigation" aria-label="Main navigation" dir="${isRtl ? 'rtl' : 'ltr'}">
  <div class="nav-inner">
    <a href="${homeHref}" class="nav-brand" aria-label="GoldPrices Home">
      <span class="nav-brand-icon" aria-hidden="true">◈</span>
      <span class="nav-brand-text">GoldPrices</span>
    </a>
    <div class="nav-links">
      ${desktopLinksHtml}
    </div>
    <div class="nav-actions">
      <button id="nav-lang-toggle" class="nav-lang-btn" aria-label="Toggle language">${langToggleLabel}</button>
      <button class="nav-hamburger" id="nav-hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-drawer">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <div class="nav-drawer" id="nav-drawer" aria-hidden="true">
    <div class="nav-drawer-inner">
      ${drawerLinksHtml}
      <button id="nav-lang-toggle-mobile" class="nav-lang-btn nav-lang-btn--drawer">${langToggleLabel}</button>
    </div>
  </div>

  <div class="nav-backdrop" id="nav-backdrop" aria-hidden="true"></div>
</nav>`;

  const target = document.querySelector('main') || document.body.firstElementChild;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  const navEl = wrapper.firstElementChild;
  document.body.insertBefore(navEl, target);

  const burger = document.getElementById('nav-hamburger');
  const drawer = document.getElementById('nav-drawer');
  const backdrop = document.getElementById('nav-backdrop');

  function openDrawer() {
    navEl.classList.add('nav--open');
    drawer.classList.add('is-open');
    drawer.removeAttribute('aria-hidden');
    backdrop.classList.add('is-visible');
    backdrop.removeAttribute('aria-hidden');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    burger.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    navEl.classList.remove('nav--open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('is-visible');
    backdrop.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    burger.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  burger.addEventListener('click', () => {
    if (navEl.classList.contains('nav--open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  backdrop.addEventListener('click', closeDrawer);

  drawer.querySelectorAll('.nav-drawer-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navEl.classList.contains('nav--open')) {
      closeDrawer();
      burger.focus();
    }
  });

  return {
    getLangToggleButtons: () =>
      [
        document.getElementById('nav-lang-toggle'),
        document.getElementById('nav-lang-toggle-mobile'),
      ].filter(Boolean),
  };
}

export function updateNavLang(lang) {
  const isAr = lang === 'ar';
  const newLabel = isAr ? 'English' : 'العربية';
  document
    .querySelectorAll('#nav-lang-toggle, #nav-lang-toggle-mobile')
    .forEach(btn => { btn.textContent = newLabel; });
  const nav = document.querySelector('.site-nav');
  if (nav) nav.setAttribute('dir', isAr ? 'rtl' : 'ltr');
}
