/**
 * components/nav.js — Shared navigation component.
 * Premium bilingual (EN/AR) nav with desktop dropdowns and mobile off-canvas drawer.
 *
 * API:
 *   const ctrl = injectNav(lang = 'en', depth = 0)
 *   ctrl.getLangToggleButtons() → HTMLButtonElement[]
 *
 *   updateNavLang(lang)   — live language switch without re-inject
 *
 * @param {'en'|'ar'} lang
 * @param {0|1}       depth  0 = root pages, 1 = /countries/ subdirectory
 */

// ─────────────────────────────────────────────────────────────────────────────
// Nav content data
// ─────────────────────────────────────────────────────────────────────────────

const NAV_DATA = {
  en: {
    home:  { href: '../index.html',  label: 'Home'  },
    shops: { href: '../shops.html',  label: 'Shops' },
    invest: { href: '../invest.html', label: 'Invest' },
    groups: [
      {
        key: 'markets',
        label: 'Markets',
        items: [
          { href: '../tracker.html',                   label: 'Live Tracker'   },
          { href: '../countries/uae.html',             label: 'UAE Gold Today' },
          { href: '../tracker.html#section-countries', label: 'GCC Compare'    },
          { href: '../tracker.html#section-countries', label: 'Country Pages'  },
          { href: '../tracker.html#section-chart',     label: 'History & Data' },
        ],
      },
      {
        key: 'tools',
        label: 'Tools',
        items: [
          { href: '../calculator.html',                label: 'Calculator'   },
          { href: '../tracker.html#section-alerts',    label: 'Alerts'       },
          { href: '../tracker.html#section-chart',     label: 'Downloads'    },
          { href: '../tracker.html#section-chart',     label: 'Date Lookup'  },
          { href: '../tracker.html#section-chart',     label: 'Archive'      },
        ],
      },
      {
        key: 'cities',
        label: 'Cities',
        items: [
          { href: '../cities/dubai.html',      label: 'Dubai, UAE'           },
          { href: '../cities/abu-dhabi.html',  label: 'Abu Dhabi, UAE'       },
          { href: '../cities/riyadh.html',     label: 'Riyadh, Saudi Arabia' },
          { href: '../cities/cairo.html',      label: 'Cairo, Egypt'         },
          { href: '../cities/doha.html',       label: 'Doha, Qatar'          },
        ],
      },
      {
        key: 'goldmarkets',
        label: 'Famous Markets',
        items: [
          { href: '../markets/dubai-gold-souk.html',      label: 'Dubai Gold Souk'         },
          { href: '../markets/khan-el-khalili-cairo.html', label: 'Khan el-Khalili, Cairo' },
        ],
      },
      {
        key: 'learn',
        label: 'Learn',
        items: [
          { href: '../guides/buying-guide.html', label: 'How to Buy Gold' },
          { href: '../learn.html',               label: 'Gold Guide'      },
          { href: '../methodology.html',         label: 'Methodology'     },
          { href: '../learn.html#faq',           label: 'FAQ'             },
        ],
      },
      {
        key: 'insights',
        label: 'Insights',
        items: [
          { href: '../insights.html',               label: 'Gold Insights'        },
          { href: '../insights.html#why-gold-moved', label: 'Why Gold Moved Today' },
          { href: '../insights.html#weekly-brief',   label: 'Weekly Brief'         },
        ],
      },
    ],
    langToggle: 'العربية',
    openMenu:   'Open menu',
    closeMenu:  'Close menu',
    mainNav:    'Main navigation',
  },

  ar: {
    home:  { href: '../index.html',  label: 'الرئيسية'    },
    shops: { href: '../shops.html',  label: 'المحلات'     },
    invest: { href: '../invest.html', label: 'الاستثمار' },

    groups: [
      {
        key: 'markets',
        label: 'الأسواق',
        items: [
          { href: '../tracker.html',                   label: 'تتبع مباشر'          },
          { href: '../countries/uae.html',             label: 'ذهب الإمارات'        },
          { href: '../tracker.html#section-countries', label: 'مقارنة دول الخليج'   },
          { href: '../tracker.html#section-countries', label: 'صفحات الدول'         },
          { href: '../tracker.html#section-chart',     label: 'البيانات التاريخية'   },
        ],
      },
      {
        key: 'tools',
        label: 'أدوات',
        items: [
          { href: '../calculator.html',                label: 'حاسبة'             },
          { href: '../tracker.html#section-alerts',    label: 'تنبيهات'           },
          { href: '../tracker.html#section-chart',     label: 'تنزيلات'           },
          { href: '../tracker.html#section-chart',     label: 'البحث بالتاريخ'    },
          { href: '../tracker.html#section-chart',     label: 'الأرشيف'           },
        ],
      },
      {
        key: 'cities',
        label: 'المدن',
        items: [
          { href: '../cities/dubai.html',      label: 'دبي، الإمارات'           },
          { href: '../cities/abu-dhabi.html',  label: 'أبوظبي، الإمارات'        },
          { href: '../cities/riyadh.html',     label: 'الرياض، السعودية'        },
          { href: '../cities/cairo.html',      label: 'القاهرة، مصر'            },
          { href: '../cities/doha.html',       label: 'الدوحة، قطر'             },
        ],
      },
      {
        key: 'goldmarkets',
        label: 'أسواق الذهب الشهيرة',
        items: [
          { href: '../markets/dubai-gold-souk.html',      label: 'سوق الذهب بدبي'        },
          { href: '../markets/khan-el-khalili-cairo.html', label: 'خان الخليلي، القاهرة' },
        ],
      },
      {
        key: 'learn',
        label: 'تعلّم',
        items: [
          { href: '../guides/buying-guide.html', label: 'كيفية شراء الذهب' },
          { href: '../learn.html',               label: 'دليل الذهب'      },
          { href: '../methodology.html',         label: 'المنهجية'        },
          { href: '../learn.html#faq',           label: 'الأسئلة الشائعة'  },
        ],
      },
      {
        key: 'insights',
        label: 'تحليلات',
        items: [
          { href: '../insights.html',                label: 'تحليلات الذهب'          },
          { href: '../insights.html#why-gold-moved', label: 'لماذا تحرك الذهب اليوم' },
          { href: '../insights.html#weekly-brief',   label: 'النشرة الأسبوعية'       },
        ],
      },
    ],
    langToggle: 'English',
    openMenu:   'فتح القائمة',
    closeMenu:  'إغلاق القائمة',
    mainNav:    'التنقل الرئيسي',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve href depth: strip leading `../` for root-level pages (depth=0).
 */
function resolveHref(href, depth) {
  return depth === 0 ? href.replace('../', '') : href;
}

/**
 * Return true if the given href's base path matches the current page URL.
 * Hash anchors on the same file count as a match for the base file.
 */
function isPageMatch(href) {
  const path = location.pathname;
  // Strip hash / query to get the base file name
  const base = href
    .split('#')[0]
    .split('?')[0]
    .replace(/^\.\.\//, '')
    .replace(/\.html$/, '');

  if (base === 'index') {
    return (
      path.endsWith('/') ||
      path.endsWith('/index.html') ||
      /\/Gold-Prices\/?$/.test(path)
    );
  }
  return path.includes(base);
}

/** True if any item in the group matches the current page. */
function groupIsActive(items) {
  return items.some(item => isPageMatch(item.href));
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML builders
// ─────────────────────────────────────────────────────────────────────────────

function buildDropdown(group, depth) {
  const active = groupIsActive(group.items);

  const itemsHtml = group.items.map(item => {
    const href      = resolveHref(item.href, depth);
    const itemClass = 'nav-dropdown-item' + (isPageMatch(href) ? ' nav-dropdown-item--active' : '');
    return `<a href="${href}" class="${itemClass}" role="menuitem">${item.label}</a>`;
  }).join('');

  const btnClass = 'nav-dropdown-btn' + (active ? ' nav-dropdown-btn--active' : '');

  return `
    <div class="nav-dropdown" data-group="${group.key}">
      <button class="${btnClass}"
              type="button"
              aria-haspopup="true"
              aria-expanded="false"
              data-group="${group.key}"
      >${group.label}<span class="nav-dropdown-caret" aria-hidden="true"></span></button>
      <div class="nav-dropdown-panel" role="menu" aria-label="${group.label}">
        ${itemsHtml}
      </div>
    </div>`;
}

function buildDrawerGroup(group, depth) {
  const itemsHtml = group.items.map(item => {
    const href      = resolveHref(item.href, depth);
    const itemClass = 'nav-drawer-link' + (isPageMatch(href) ? ' nav-link--active' : '');
    return `<a href="${href}" class="${itemClass}">${item.label}</a>`;
  }).join('');

  return `
    <div class="nav-drawer-group">
      <div class="nav-drawer-group-label" aria-hidden="true">${group.label}</div>
      ${itemsHtml}
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// injectNav
// ─────────────────────────────────────────────────────────────────────────────

export function injectNav(lang = 'en', depth = 0) {
  // Guard against double-injection
  if (document.querySelector('.site-nav')) {
    _currentLang = lang;
    return _buildReturnValue();
  }

  _currentLang = lang;

  const data     = NAV_DATA[lang] || NAV_DATA.en;
  const isRtl    = lang === 'ar';
  const homeHref = resolveHref(data.home.href, depth);
  const homeActive = isPageMatch(homeHref);
  const shopsHref   = resolveHref(data.shops.href, depth);
  const shopsActive = isPageMatch(shopsHref);
  const investHref  = resolveHref(data.invest.href, depth);
  const investActive = isPageMatch(investHref);

  const desktopDropdownsHtml = data.groups.map(g => buildDropdown(g, depth)).join('');
  const mobileGroupsHtml     = data.groups.map(g => buildDrawerGroup(g, depth)).join('');

  const html = `
<nav class="site-nav" role="navigation" aria-label="${data.mainNav}" dir="${isRtl ? 'rtl' : 'ltr'}">
  <div class="nav-inner">

    <!-- Brand -->
    <a href="${homeHref}" class="nav-brand" aria-label="GoldPrices Home">
      <span class="nav-brand-icon" aria-hidden="true">◈</span>
      <span class="nav-brand-text">GoldPrices</span>
    </a>

    <!-- Desktop links -->
    <div class="nav-links" role="list">
      <a href="${homeHref}"
         class="nav-link${homeActive ? ' nav-link--active' : ''}"
         role="listitem"
      >${data.home.label}</a>

      <a href="${shopsHref}"
         class="nav-link nav-link--shops${shopsActive ? ' nav-link--active' : ''}"
         role="listitem"
         data-nav-key="shops"
      >${data.shops.label}</a>

      ${desktopDropdownsHtml}

      <a href="${investHref}"
         class="nav-link${investActive ? ' nav-link--active' : ''}"
         role="listitem"
         data-nav-key="invest"
      >${data.invest.label}</a>
    </div>

    <!-- Right-side actions -->
    <div class="nav-actions">
      <button id="nav-lang-toggle"
              class="nav-lang-btn"
              type="button"
              aria-label="Toggle language"
      >${data.langToggle}</button>

      <button id="nav-hamburger"
              class="nav-hamburger"
              type="button"
              aria-label="${data.openMenu}"
              aria-expanded="false"
              aria-controls="nav-drawer"
      >
        <span></span><span></span><span></span>
      </button>
    </div>

  </div>

  <!-- Mobile off-canvas drawer -->
  <div id="nav-drawer"
       class="nav-drawer"
       role="dialog"
       aria-modal="true"
       aria-label="${data.mainNav}"
       aria-hidden="true"
  >
    <div class="nav-drawer-inner">
      <!-- Home (direct) -->
      <a href="${homeHref}"
         class="nav-drawer-link${homeActive ? ' nav-link--active' : ''}"
      >${data.home.label}</a>

      <!-- Shops (direct) -->
      <a href="${shopsHref}"
         class="nav-drawer-link${shopsActive ? ' nav-link--active' : ''}"
         data-nav-key="shops"
      >${data.shops.label}</a>

      <!-- Grouped sections -->
      ${mobileGroupsHtml}

      <!-- Invest (direct) -->
      <a href="${investHref}"
         class="nav-drawer-link${investActive ? ' nav-link--active' : ''}"
         data-nav-key="invest"
      >${data.invest.label}</a>

      <!-- Language toggle -->
      <button id="nav-lang-toggle-mobile"
              class="nav-lang-btn nav-lang-btn--drawer"
              type="button"
              aria-label="Toggle language"
      >${data.langToggle}</button>
    </div>
  </div>

  <!-- Backdrop -->
  <div id="nav-backdrop" class="nav-backdrop" aria-hidden="true"></div>
</nav>`;

  // Mount nav before the first child of body (or before <main>)
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  const navEl = wrapper.firstElementChild;
  const anchor = document.querySelector('main') || document.body.firstElementChild;
  document.body.insertBefore(navEl, anchor);

  // ── DOM references ──────────────────────────────────────────────────────────
  const burger   = document.getElementById('nav-hamburger');
  const drawer   = document.getElementById('nav-drawer');
  const backdrop = document.getElementById('nav-backdrop');

  // ── Drawer helpers ──────────────────────────────────────────────────────────
  function openDrawer() {
    const d = NAV_DATA[_currentLang] || NAV_DATA.en;
    navEl.classList.add('nav--open');
    drawer.classList.add('is-open');
    drawer.removeAttribute('aria-hidden');
    backdrop.classList.add('is-visible');
    backdrop.removeAttribute('aria-hidden');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', d.closeMenu);
    burger.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    const firstFocusable = drawer.querySelector('a, button');
    if (firstFocusable) firstFocusable.focus();
  }

  function closeDrawer() {
    const d = NAV_DATA[_currentLang] || NAV_DATA.en;
    navEl.classList.remove('nav--open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('is-visible');
    backdrop.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', d.openMenu);
    burger.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  // ── Dropdown helpers ────────────────────────────────────────────────────────
  /** Close all open dropdowns, optionally skipping one group key. */
  function closeAllDropdowns(exceptKey) {
    navEl.querySelectorAll('.nav-dropdown.is-open').forEach(dd => {
      if (dd.dataset.group === exceptKey) return;
      dd.classList.remove('is-open');
      const btn = dd.querySelector('.nav-dropdown-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function openDropdown(groupEl, btnEl) {
    closeAllDropdowns(groupEl.dataset.group);
    groupEl.classList.add('is-open');
    btnEl.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown(groupEl, btnEl) {
    groupEl.classList.remove('is-open');
    btnEl.setAttribute('aria-expanded', 'false');
  }

  // ── Dropdown button events ──────────────────────────────────────────────────
  navEl.querySelectorAll('.nav-dropdown-btn').forEach(btn => {
    const groupEl = btn.closest('.nav-dropdown');

    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (groupEl.classList.contains('is-open')) {
        closeDropdown(groupEl, btn);
      } else {
        openDropdown(groupEl, btn);
      }
    });

    btn.addEventListener('keydown', e => {
      const panel = groupEl.querySelector('.nav-dropdown-panel');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        openDropdown(groupEl, btn);
        const first = panel.querySelector('.nav-dropdown-item');
        if (first) first.focus();
      }
      if (e.key === 'Escape') {
        closeDropdown(groupEl, btn);
        btn.focus();
      }
    });
  });

  // ── Keyboard nav inside dropdown panels ────────────────────────────────────
  navEl.querySelectorAll('.nav-dropdown-panel').forEach(panel => {
    panel.addEventListener('keydown', e => {
      const items = [...panel.querySelectorAll('.nav-dropdown-item')];
      const idx   = items.indexOf(document.activeElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        (items[idx + 1] || items[0]).focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        (items[idx - 1] || items[items.length - 1]).focus();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        const groupEl = panel.closest('.nav-dropdown');
        const btn     = groupEl.querySelector('.nav-dropdown-btn');
        closeDropdown(groupEl, btn);
        btn.focus();
      }
      if (e.key === 'Tab') {
        // Let Tab move naturally; just close the dropdown
        const groupEl = panel.closest('.nav-dropdown');
        const btn     = groupEl.querySelector('.nav-dropdown-btn');
        closeDropdown(groupEl, btn);
      }
    });
  });

  // ── Click-outside closes dropdowns ─────────────────────────────────────────
  document.addEventListener('click', e => {
    if (!navEl.contains(e.target)) {
      closeAllDropdowns(null);
    }
  });

  // ── Hamburger ──────────────────────────────────────────────────────────────
  burger.addEventListener('click', () => {
    closeAllDropdowns(null);
    if (navEl.classList.contains('nav--open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  // ── Backdrop ───────────────────────────────────────────────────────────────
  backdrop.addEventListener('click', () => {
    closeDrawer();
    burger.focus();
  });

  // ── Close drawer on any drawer link click ──────────────────────────────────
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeDrawer());
  });

  // ── Global Escape key ──────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;

    if (navEl.classList.contains('nav--open')) {
      closeDrawer();
      burger.focus();
      return;
    }

    const openDd = navEl.querySelector('.nav-dropdown.is-open');
    if (openDd) {
      const btn = openDd.querySelector('.nav-dropdown-btn');
      closeDropdown(openDd, btn);
      btn.focus();
    }
  });

  return _buildReturnValue();
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level state
// ─────────────────────────────────────────────────────────────────────────────

let _currentLang = 'en';

function _buildReturnValue() {
  return {
    getLangToggleButtons: () =>
      [
        document.getElementById('nav-lang-toggle'),
        document.getElementById('nav-lang-toggle-mobile'),
      ].filter(Boolean),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// updateNavLang — live language switch without re-injecting the nav
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call after a language change to update all nav text in-place.
 * @param {'en'|'ar'} lang
 */
export function updateNavLang(lang) {
  _currentLang = lang;
  const data  = NAV_DATA[lang] || NAV_DATA.en;
  const isRtl = lang === 'ar';

  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // Direction
  nav.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  nav.setAttribute('aria-label', data.mainNav);

  // Language toggle buttons
  document.querySelectorAll('#nav-lang-toggle, #nav-lang-toggle-mobile').forEach(btn => {
    btn.textContent = data.langToggle;
  });

  // Home — match by href ending in index.html or just /
  nav.querySelectorAll('.nav-link[href], .nav-drawer-link[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (href === 'index.html' || href.endsWith('/index.html') || href === '../index.html')) {
      a.textContent = data.home.label;
    }
  });

  // Shops
  nav.querySelectorAll('[data-nav-key="shops"]').forEach(el => {
    el.textContent = data.shops.label;
  });

  // Invest
  nav.querySelectorAll('[data-nav-key="invest"]').forEach(el => {
    el.textContent = data.invest.label;
  });
  
  // Dropdown groups
  data.groups.forEach((group, gi) => {
    // Desktop button — preserve the caret <span>
    const btn = nav.querySelector(`.nav-dropdown-btn[data-group="${group.key}"]`);
    if (btn) {
      btn.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) node.textContent = group.label;
      });
    }

    // Desktop panel items
    const panel = nav.querySelector(`.nav-dropdown[data-group="${group.key}"] .nav-dropdown-panel`);
    if (panel) {
      panel.querySelectorAll('.nav-dropdown-item').forEach((el, i) => {
        if (group.items[i]) el.textContent = group.items[i].label;
      });
    }

    // Mobile drawer group
    const drawerGroups = nav.querySelectorAll('.nav-drawer-group');
    if (drawerGroups[gi]) {
      const labelEl = drawerGroups[gi].querySelector('.nav-drawer-group-label');
      if (labelEl) labelEl.textContent = group.label;
      drawerGroups[gi].querySelectorAll('.nav-drawer-link').forEach((el, i) => {
        if (group.items[i]) el.textContent = group.items[i].label;
      });
    }
  });

  // Hamburger aria-label
  const burger = document.getElementById('nav-hamburger');
  if (burger) {
    const isExpanded = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-label', isExpanded ? data.closeMenu : data.openMenu);
  }

  // Drawer aria-label
  const drawer = document.getElementById('nav-drawer');
  if (drawer) drawer.setAttribute('aria-label', data.mainNav);
}
