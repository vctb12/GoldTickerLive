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
 * @param {number}   depth  Number of directory levels from the site root (0 = root pages, 1 = /countries/, 2 = /content/guides/, etc.)
 */

import { NAV_DATA } from './nav-data.js';
import { applyFeatureFlags } from '../lib/site-settings.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Escape a string for safe inclusion in HTML. */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Resolve href depth: strip leading `../` then prepend the correct number
 * of `../` segments for the page's actual depth from the site root.
 *
 * @param {string} href  — href from NAV_DATA (always starts with `../`)
 * @param {number} depth — 0 = root, 1 = one dir deep, 2 = two dirs deep, etc.
 */
function resolveHref(href, depth) {
  // If href is absolute (starts with '/'), return it as-is.
  if (href.startsWith('/')) return href;

  // If the href is already root-relative without leading slash, normalize it.
  if (href.startsWith('./')) {
    const stripped = href.replace(/^\.\//, '');
    return depth === 0 ? stripped : '../'.repeat(depth) + stripped;
  }

  // Default: treat '../' segments as relative to current depth.
  const stripped = href.replace(/^\.\.\//, '');
  if (depth === 0) return stripped;
  return '../'.repeat(depth) + stripped;
}

/**
 * Return true if the given href's base path matches the current page URL.
 * Hash anchors on the same file count as a match for the base file.
 */
function isPageMatch(href) {
  const loc = location.pathname;
  const base = href.split('#')[0].split('?')[0];
  // Normalize leading ../ or ./ and leading slash
  let norm = base.replace(/^\.\.\//, '').replace(/^\.\//, '');
  if (!norm.startsWith('/')) norm = (norm === 'index.html' ? '/index.html' : '/' + norm);
  // Remove trailing index.html for comparison
  const cmp = norm.replace(/index\.html$/, '');
  return loc === cmp || loc.startsWith(cmp);
}

/** True if any item in the group matches the current page. */
function groupIsActive(items) {
  return items.some((item) => isPageMatch(item.href));
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML builders
// ─────────────────────────────────────────────────────────────────────────────

function buildDropdown(group, depth) {
  const active = groupIsActive(group.items);

  const itemsHtml = group.items
    .map((item) => {
      const href = resolveHref(item.href, depth);
      const itemClass =
        'nav-dropdown-item' + (isPageMatch(href) ? ' nav-dropdown-item--active' : '');
      return `<a href="${href}" class="${itemClass}" role="menuitem">${item.label}</a>`;
    })
    .join('');

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
        ${group.description ? `<div class="nav-dropdown-panel-header"><span class="nav-dropdown-panel-title">${group.label}</span><span class="nav-dropdown-panel-desc">${group.description}</span></div>` : ''}
        ${itemsHtml}
      </div>
    </div>`;
}

function buildDrawerGroup(group, depth) {
  const itemsHtml = group.items
    .map((item) => {
      const href = resolveHref(item.href, depth);
      const itemClass = 'nav-drawer-link' + (isPageMatch(href) ? ' nav-link--active' : '');
      return `<a href="${href}" class="${itemClass}">${item.label}</a>`;
    })
    .join('');

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

  const data = NAV_DATA[lang] || NAV_DATA.en;
  const isRtl = lang === 'ar';
  const homeHref = resolveHref(data.home.href, depth);
  const homeActive = isPageMatch(homeHref);
  const shopsHref = resolveHref(data.shops.href, depth);
  const shopsActive = isPageMatch(shopsHref);
  const investHref = resolveHref(data.invest.href, depth);
  const investActive = isPageMatch(investHref);

  const desktopDropdownsHtml = data.groups.map((g) => buildDropdown(g, depth)).join('');
  const mobileGroupsHtml = data.groups.map((g) => buildDrawerGroup(g, depth)).join('');

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
      <button id="nav-search-btn"
              type="button"
              aria-label="Search"
              style="background:none;border:none;cursor:pointer;padding:0.4rem;font-size:1.1rem;color:#64748b;display:flex;align-items:center;line-height:1;"
      >🔍</button>

      <button id="nav-theme-toggle"
              type="button"
              aria-label="Switch to dark mode"
              style="background:none;border:none;cursor:pointer;padding:0.4rem;font-size:1.1rem;color:var(--color-text-muted);display:flex;align-items:center;line-height:1;"
      >🌙</button>

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

  <!-- Search overlay -->
  <div id="nav-search-overlay" style="display:none;position:absolute;top:100%;right:0;left:0;background:white;border-bottom:1px solid #e2e8f0;padding:0.75rem 1rem;z-index:1000;">
    <input id="nav-search-input" type="search" placeholder="Search countries, cities, karats..." autocomplete="off"
      style="width:100%;max-width:480px;padding:0.5rem 0.75rem;border:1px solid #e2e8f0;border-radius:6px;font-size:0.875rem;outline:none;display:block;margin:0 auto;" />
    <div id="nav-search-dropdown" style="max-width:480px;margin:0.25rem auto 0;background:white;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);max-height:300px;overflow-y:auto;"></div>
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

  // ── Mobile bottom navigation bar ──────────────────────────────────────────
  _injectMobileBottomNav(lang, depth);

  // ── Theme (dark/light) toggle ────────────────────────────────────────────
  const themeBtn = document.getElementById('nav-theme-toggle');
  if (themeBtn) {
    function _applyTheme(t) {
      document.documentElement.setAttribute('data-theme', t);
      themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
      themeBtn.setAttribute(
        'aria-label',
        t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
    try {
      const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
      const saved = prefs.theme;
      if (saved) {
        _applyTheme(saved);
      } else {
        _applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      }
    } catch (e) {
      console.warn('theme init', e);
    }

    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      _applyTheme(next);
      try {
        const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
        prefs.theme = next;
        localStorage.setItem('user_prefs', JSON.stringify(prefs));
      } catch (e) {
        console.warn('theme save', e);
      }
    });
  }

  // ── DOM references ──────────────────────────────────────────────────────────
  const burger = document.getElementById('nav-hamburger');
  const drawer = document.getElementById('nav-drawer');
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
    // Defer overflow reset so the slide-out CSS transition finishes first
    setTimeout(() => {
      document.body.style.overflow = '';
    }, 260);
  }

  // ── Dropdown helpers ────────────────────────────────────────────────────────
  /** Close all open dropdowns, optionally skipping one group key. */
  function closeAllDropdowns(exceptKey) {
    navEl.querySelectorAll('.nav-dropdown.is-open').forEach((dd) => {
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
  navEl.querySelectorAll('.nav-dropdown-btn').forEach((btn) => {
    const groupEl = btn.closest('.nav-dropdown');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (groupEl.classList.contains('is-open')) {
        closeDropdown(groupEl, btn);
      } else {
        openDropdown(groupEl, btn);
      }
    });

    btn.addEventListener('keydown', (e) => {
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
  navEl.querySelectorAll('.nav-dropdown-panel').forEach((panel) => {
    panel.addEventListener('keydown', (e) => {
      const items = [...panel.querySelectorAll('.nav-dropdown-item')];
      const idx = items.indexOf(document.activeElement);

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
        const btn = groupEl.querySelector('.nav-dropdown-btn');
        closeDropdown(groupEl, btn);
        btn.focus();
      }
      if (e.key === 'Tab') {
        // Let Tab move naturally; just close the dropdown
        const groupEl = panel.closest('.nav-dropdown');
        const btn = groupEl.querySelector('.nav-dropdown-btn');
        closeDropdown(groupEl, btn);
      }
    });
  });

  // ── Click-outside closes dropdowns ─────────────────────────────────────────
  document.addEventListener('click', (e) => {
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
  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeDrawer());
  });

  // ── Global Escape key ──────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
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

  // ── Apply site-level feature flags (async — runs after current call stack) ─
  applyFeatureFlags().catch((err) => {
    console.warn('[nav] Failed to apply feature flags:', err);
  });

  return _buildReturnValue();
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile bottom navigation bar
// ─────────────────────────────────────────────────────────────────────────────

function _injectMobileBottomNav(lang, depth) {
  // Guard against double-injection
  if (document.querySelector('.mobile-bottom-nav')) return;

  const isAr = lang === 'ar';

  function r(href) {
    const base = href.replace(/^\.\.\//, '');
    if (depth === 0) return base;
    return '../'.repeat(depth) + base;
  }

  const items = [
    {
      href: r('../index.html'),
      icon: '🏠',
      label: isAr ? 'الرئيسية' : 'Home',
      key: 'home',
    },
    {
      href: r('../tracker.html'),
      icon: '📈',
      label: isAr ? 'تتبع' : 'Tracker',
      key: 'tracker',
    },
    {
      href: r('../calculator.html'),
      icon: '🧮',
      label: isAr ? 'حاسبة' : 'Calc',
      key: 'calculator',
    },
    {
      href: r('../shops.html'),
      icon: '🏪',
      label: isAr ? 'المحلات' : 'Shops',
      key: 'shops',
    },
    {
      action: 'menu',
      icon: '☰',
      label: isAr ? 'القائمة' : 'More',
      key: 'menu',
    },
  ];

  const itemsHtml = items
    .map((item) => {
      const isActive = !item.action && typeof item.href === 'string' && isPageMatch(item.href);
      const cls = 'mobile-bottom-nav-item' + (isActive ? ' is-active' : '');

      if (item.action === 'menu') {
        return `<button class="${cls}" data-mobile-nav="menu" type="button" aria-label="${item.label}">
          <span class="mobile-bottom-nav-icon" aria-hidden="true">${item.icon}</span>
          <span class="mobile-bottom-nav-label">${item.label}</span>
        </button>`;
      }

      return `<a href="${item.href}" class="${cls}" data-mobile-nav="${item.key}">
        <span class="mobile-bottom-nav-icon" aria-hidden="true">${item.icon}</span>
        <span class="mobile-bottom-nav-label">${item.label}</span>
      </a>`;
    })
    .join('');

  const bottomNavHtml = `
    <div class="mobile-bottom-nav" role="navigation" aria-label="${isAr ? 'التنقل السريع' : 'Quick navigation'}" dir="${isAr ? 'rtl' : 'ltr'}">
      <div class="mobile-bottom-nav-inner">
        ${itemsHtml}
      </div>
    </div>`;

  const container = document.createElement('div');
  container.innerHTML = bottomNavHtml.trim();
  document.body.appendChild(container.firstElementChild);

  // Wire "More" button to open the mobile drawer
  const menuBtn = document.querySelector('[data-mobile-nav="menu"]');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const burger = document.getElementById('nav-hamburger');
      if (burger) burger.click();
    });
  }
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
  const data = NAV_DATA[lang] || NAV_DATA.en;
  const isRtl = lang === 'ar';

  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // Direction
  nav.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  nav.setAttribute('aria-label', data.mainNav);

  // Language toggle buttons
  document.querySelectorAll('#nav-lang-toggle, #nav-lang-toggle-mobile').forEach((btn) => {
    btn.textContent = data.langToggle;
  });

  // Home — match by href ending in index.html or just /
  nav.querySelectorAll('.nav-link[href], .nav-drawer-link[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (
      href &&
      (href === 'index.html' || href.endsWith('/index.html') || href === '../index.html')
    ) {
      a.textContent = data.home.label;
    }
  });

  // Shops
  nav.querySelectorAll('[data-nav-key="shops"]').forEach((el) => {
    el.textContent = data.shops.label;
  });

  // Invest
  nav.querySelectorAll('[data-nav-key="invest"]').forEach((el) => {
    el.textContent = data.invest.label;
  });

  // Dropdown groups
  data.groups.forEach((group, gi) => {
    // Desktop button — preserve the caret <span>
    const btn = nav.querySelector(`.nav-dropdown-btn[data-group="${group.key}"]`);
    if (btn) {
      btn.childNodes.forEach((node) => {
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

  // Mobile bottom nav language update
  const bottomNav = document.querySelector('.mobile-bottom-nav');
  if (bottomNav) {
    bottomNav.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    bottomNav.setAttribute('aria-label', isRtl ? 'التنقل السريع' : 'Quick navigation');
    const labels = {
      home: isRtl ? 'الرئيسية' : 'Home',
      tracker: isRtl ? 'تتبع' : 'Tracker',
      calculator: isRtl ? 'حاسبة' : 'Calc',
      shops: isRtl ? 'المحلات' : 'Shops',
      menu: isRtl ? 'القائمة' : 'More',
    };
    bottomNav.querySelectorAll('[data-mobile-nav]').forEach((el) => {
      const key = el.dataset.mobileNav;
      const lbl = el.querySelector('.mobile-bottom-nav-label');
      if (lbl && labels[key]) lbl.textContent = labels[key];
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// initNavSearch — wire up the search bar injected by injectNav()
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize the nav search bar.
 * Called once per page, after injectNav().
 * @param {string} basePath  Base URL path (e.g. '/')
 */
export function initNavSearch(basePath = '/') {
  // Lazy-load the search engine only when the user first interacts
  let searchModule = null;

  async function getSearch() {
    if (searchModule) return searchModule;
    searchModule = await import('../search/searchEngine.js').catch(() => null);
    return searchModule;
  }

  const btn = document.getElementById('nav-search-btn');
  const overlay = document.getElementById('nav-search-overlay');
  const input = document.getElementById('nav-search-input');
  const dropdown = document.getElementById('nav-search-dropdown');

  if (!btn || !overlay || !input) return;

  let debounceTimer = null;

  function openOverlay() {
    overlay.style.display = 'block';
    input.focus();
  }

  function closeOverlay() {
    overlay.style.display = 'none';
    if (dropdown) dropdown.innerHTML = '';
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    overlay.style.display === 'block' ? closeOverlay() : openOverlay();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!overlay.contains(e.target) && e.target !== btn) {
      closeOverlay();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlay();
    }
    if (e.key === 'Enter') {
      const first = dropdown.querySelector('a');
      if (first) first.click();
    }
    if (e.key === 'ArrowDown') {
      const items = Array.from(dropdown.querySelectorAll('a'));
      if (items.length) {
        items[0].focus();
        e.preventDefault();
      }
    }
  });

  dropdown.addEventListener('keydown', (e) => {
    const items = Array.from(dropdown.querySelectorAll('a'));
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && idx < items.length - 1) {
      items[idx + 1].focus();
      e.preventDefault();
    }
    if (e.key === 'ArrowUp') {
      if (idx > 0) {
        items[idx - 1].focus();
        e.preventDefault();
      } else {
        input.focus();
        e.preventDefault();
      }
    }
    if (e.key === 'Escape') {
      closeOverlay();
      input.focus();
    }
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      dropdown.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      const mod = await getSearch();
      if (!mod) {
        dropdown.innerHTML =
          '<div style="padding:0.75rem 1rem;color:#64748b;font-size:0.875rem;">Search unavailable</div>';
        return;
      }
      const results = mod.search(q);
      if (!results.length) {
        dropdown.innerHTML =
          '<div style="padding:0.75rem 1rem;color:#64748b;font-size:0.875rem;">No results found</div>';
        return;
      }
      const base = basePath.replace(/\/$/, '');
      dropdown.innerHTML = results
        .map((r) => {
          const href = base + r.url;
          return `<a href="${escapeHtml(href)}" style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 1rem;text-decoration:none;color:#1e293b;font-size:0.875rem;border-bottom:1px solid #f1f5f9;" tabindex="0">
          <span style="font-size:1rem;">${escapeHtml(r.icon || '🔍')}</span>
          <span>
            <span style="font-weight:500;">${escapeHtml(r.label)}</span>
            <span style="font-size:0.75rem;color:#94a3b8;margin-left:0.4rem;">${escapeHtml(r.type)}</span>
          </span>
        </a>`;
        })
        .join('');
    }, 200);
  });
}
