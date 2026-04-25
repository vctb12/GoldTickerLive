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
 * Hardened behaviour:
 *   - Empty / non-string inputs return '#' (safe no-op anchor).
 *   - Absolute paths (`/foo`), full URLs (`https://…`), `mailto:`, `tel:`,
 *     and protocol-relative (`//host/…`) are returned unchanged.
 *   - Hash-only (`#anchor`) and query-only (`?k=v`) inputs return unchanged.
 *
 * @param {string} href  — href from NAV_DATA (`/foo`, `./foo`, `../foo`, `foo`)
 * @param {number} depth — 0 = root, 1 = one dir deep, 2 = two dirs deep, etc.
 */
function resolveHref(href, depth) {
  if (typeof href !== 'string' || href === '') return '#';

  // Full URLs and non-http schemes pass through untouched.
  if (
    href.startsWith('/') ||
    href.startsWith('//') ||
    href.startsWith('#') ||
    href.startsWith('?') ||
    /^[a-z][a-z0-9+.-]*:/i.test(href)
  ) {
    return href;
  }

  const d = Math.max(0, Number.isFinite(depth) ? Math.floor(depth) : 0);

  if (href.startsWith('./')) {
    const stripped = href.replace(/^\.\//, '');
    return d === 0 ? stripped : '../'.repeat(d) + stripped;
  }

  // '../foo' — strip exactly one '../' segment (NAV_DATA convention), then re-prepend for depth.
  const stripped = href.replace(/^\.\.\//, '');
  return d === 0 ? stripped : '../'.repeat(d) + stripped;
}

/**
 * Return true if the given href's base path matches the current page URL.
 * Hash anchors on the same file count as a match for the base file.
 *
 * Hardened behaviour:
 *   - Non-string or empty hrefs never match.
 *   - Hash-only / query-only hrefs never match (they're same-page fragments).
 *   - External (full-URL, protocol-relative, mailto:, tel:) hrefs never match.
 *   - Root `/` only matches the exact homepage, never every page.
 *   - Directory matches (cmp ending in `/`) use startsWith; file matches require equality.
 */
function isPageMatch(href) {
  if (typeof href !== 'string' || href === '') return false;
  if (href.startsWith('#') || href.startsWith('?')) return false;
  if (href.startsWith('//') || /^[a-z][a-z0-9+.-]*:\/\//i.test(href)) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;

  const loc = location.pathname || '/';
  const base = href.split('#')[0].split('?')[0];
  if (!base) return false;

  // Normalize to a root-absolute path.
  let norm = base.replace(/^\.\.\//, '').replace(/^\.\//, '');
  if (!norm.startsWith('/')) norm = '/' + norm;

  // Treat `/index.html` and `/` as equivalent for the homepage case.
  const cmp = norm.replace(/\/index\.html$/, '/');

  // Exact match is the primary case. Root (`/`) only matches the exact homepage.
  if (cmp === '/') return loc === '/' || loc === '/index.html';
  if (loc === cmp) return true;

  // Directory-style hrefs (trailing slash) match any page inside that directory.
  if (cmp.endsWith('/') && loc.startsWith(cmp)) return true;

  return false;
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
  const layout = group.layout === 'two-col' ? 'two-col' : 'one-col';

  const itemsHtml = group.items
    .map((item) => {
      const href = resolveHref(item.href, depth);
      const isActive = isPageMatch(href);
      const classes = ['nav-dropdown-item'];
      if (isActive) classes.push('nav-dropdown-item--active');
      if (item.primary) classes.push('nav-dropdown-item--primary');
      const ariaCurrent = isActive ? ' aria-current="page"' : '';
      const iconHtml = item.icon
        ? `<span class="nav-dropdown-item-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>`
        : '';
      const descHtml = item.description
        ? `<span class="nav-dropdown-item-desc">${escapeHtml(item.description)}</span>`
        : '';
      return `<a href="${href}" class="${classes.join(' ')}"${ariaCurrent} role="menuitem">
        ${iconHtml}
        <span class="nav-dropdown-item-body">
          <span class="nav-dropdown-item-label">${escapeHtml(item.label)}</span>
          ${descHtml}
        </span>
      </a>`;
    })
    .join('');

  const btnClass = 'nav-dropdown-btn' + (active ? ' nav-dropdown-btn--active' : '');

  return `
    <div class="nav-dropdown" data-group="${group.key}" data-layout="${layout}"${active ? ' data-active="true"' : ''}>
      <button class="${btnClass}"
              type="button"
              aria-haspopup="true"
              aria-expanded="false"
              data-group="${group.key}"
      >${escapeHtml(group.label)}<span class="nav-dropdown-caret" aria-hidden="true"></span></button>
      <div class="nav-dropdown-panel" role="menu" aria-label="${escapeHtml(group.label)}" data-layout="${layout}">
        ${
          group.description
            ? `<div class="nav-dropdown-panel-header"><span class="nav-dropdown-panel-title">${escapeHtml(group.label)}</span><span class="nav-dropdown-panel-desc">${escapeHtml(group.description)}</span></div>`
            : ''
        }
        <div class="nav-dropdown-panel-items" data-layout="${layout}">
          ${itemsHtml}
        </div>
      </div>
    </div>`;
}

function buildDrawerGroup(group, depth, index = 0) {
  const itemsHtml = group.items
    .map((item) => {
      const href = resolveHref(item.href, depth);
      const isActive = isPageMatch(href);
      const classes = ['nav-drawer-link'];
      if (isActive) classes.push('nav-link--active');
      if (item.primary) classes.push('nav-drawer-link--primary');
      const ariaCurrent = isActive ? ' aria-current="page"' : '';
      const iconHtml = item.icon
        ? `<span class="nav-drawer-link-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>`
        : '';
      return `<a href="${href}" class="${classes.join(' ')}"${ariaCurrent}>
        ${iconHtml}<span class="nav-drawer-link-label">${escapeHtml(item.label)}</span>
      </a>`;
    })
    .join('');

  const shouldOpen =
    index === 0 || group.items.some((item) => isPageMatch(resolveHref(item.href, depth)));

  return `
    <details class="nav-drawer-group"${shouldOpen ? ' open' : ''}>
      <summary class="nav-drawer-group-label">
        <span>${escapeHtml(group.label)}</span>
        <span class="nav-drawer-group-caret" aria-hidden="true"></span>
      </summary>
      <div class="nav-drawer-group-items">
        ${itemsHtml}
      </div>
    </details>`;
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

  const desktopDropdownsHtml = data.groups.map((g) => buildDropdown(g, depth)).join('');
  const mobileGroupsHtml = data.groups
    .map((g, index) => buildDrawerGroup(g, depth, index))
    .join('');

  const html = `
<a class="nav-skip-link" href="#main-content">${lang === 'ar' ? 'تخطي إلى المحتوى' : 'Skip to main content'}</a>
<nav class="site-nav" role="navigation" aria-label="${data.mainNav}" dir="${isRtl ? 'rtl' : 'ltr'}">
  <div class="nav-inner">

    <!-- Brand -->
    <a href="${homeHref}" class="nav-brand" aria-label="${escapeHtml(data.brandLabel)}">
      <span class="nav-brand-icon" aria-hidden="true">◈</span>
      <span class="nav-brand-text">GoldPrices</span>
    </a>

    <!-- Desktop links -->
    <div class="nav-links" role="list">
      <a href="${homeHref}"
         class="nav-link${homeActive ? ' nav-link--active' : ''}"
         role="listitem"
         ${homeActive ? 'aria-current="page"' : ''}
      >${data.home.label}</a>

      <a href="${shopsHref}"
         class="nav-link nav-link--shops${shopsActive ? ' nav-link--active' : ''}"
         role="listitem"
         data-nav-key="shops"
         ${shopsActive ? 'aria-current="page"' : ''}
      >${data.shops.label}</a>

      ${desktopDropdownsHtml}
    </div>

    <!-- Right-side actions -->
    <div class="nav-actions">
      <button id="nav-search-btn"
              class="nav-icon-btn"
              type="button"
               aria-label="${escapeHtml(data.searchLabel)}"
               aria-expanded="false"
               aria-controls="nav-search-overlay"
      >🔍</button>

      <button id="nav-theme-toggle"
              class="nav-icon-btn nav-icon-btn--theme"
              type="button"
              aria-label="${escapeHtml(data.themeLabels.auto)}"
              title="${escapeHtml(data.themeLabels.auto)}"
              data-theme-mode="auto"
              data-nav-theme-toggle
      >🌓</button>

      <button id="nav-lang-toggle"
              class="nav-lang-btn"
              type="button"
              aria-label="${escapeHtml(data.toggleLanguage)}"
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
  <div id="nav-search-overlay" class="nav-search-overlay" hidden>
    <input id="nav-search-input" class="nav-search-input" type="search"
      placeholder="${escapeHtml(data.searchPlaceholder)}" autocomplete="off"
      aria-label="${escapeHtml(data.searchLabel)}" />
    <div id="nav-search-dropdown" class="nav-search-dropdown" role="listbox"></div>
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
         ${homeActive ? 'aria-current="page"' : ''}
      >${data.home.label}</a>

      <!-- Shops (direct) -->
      <a href="${shopsHref}"
         class="nav-drawer-link${shopsActive ? ' nav-link--active' : ''}"
         data-nav-key="shops"
         ${shopsActive ? 'aria-current="page"' : ''}
      >${data.shops.label}</a>

      <!-- Grouped sections -->
      ${mobileGroupsHtml}

      <div class="nav-drawer-bottom">
        <button id="nav-theme-toggle-mobile"
                class="nav-icon-btn nav-icon-btn--theme"
                type="button"
                aria-label="${escapeHtml(data.themeLabels.auto)}"
                title="${escapeHtml(data.themeLabels.auto)}"
                data-theme-mode="auto"
                data-nav-theme-toggle
        >🌓</button>

        <button id="nav-lang-toggle-mobile"
                class="nav-lang-btn nav-lang-btn--drawer"
                type="button"
                aria-label="${escapeHtml(data.toggleLanguage)}"
        >${data.langToggle}</button>
      </div>
    </div>
  </div>

  <!-- Backdrop -->
  <div id="nav-backdrop" class="nav-backdrop" aria-hidden="true"></div>
</nav>`;

  // Mount nav before the first child of body (or before <main>)
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  // Move every rendered top-level node (skip link + nav) before the anchor, in order.
  const nodes = Array.from(wrapper.children);
  const anchor = document.querySelector('main') || document.body.firstElementChild;
  for (const n of nodes) document.body.insertBefore(n, anchor);
  const navEl =
    nodes.find((n) => n.matches && n.matches('nav.site-nav')) || nodes[nodes.length - 1];

  // Skip-link fallback: if #main-content is missing, focus <main> directly.
  const skipLink = nodes.find((n) => n.matches && n.matches('.nav-skip-link'));
  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      const target = document.getElementById('main-content') || document.querySelector('main');
      if (!target) return;
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      e.preventDefault();
      target.focus();
      target.scrollIntoView({ block: 'start' });
    });
  }

  // ── Mobile bottom navigation bar ──────────────────────────────────────────
  _injectMobileBottomNav(lang, depth);

  // ── Scroll state: is-scrolled + hide/reveal on scroll (Track B §5.B.7) ───
  _initNavScrollBehavior(navEl);

  // ── Theme (auto/light/dark) tri-state toggle ─────────────────────────────
  const themeBtns = Array.from(document.querySelectorAll('[data-nav-theme-toggle]'));
  if (themeBtns.length) {
    const THEME_CYCLE = ['auto', 'light', 'dark'];
    const THEME_ICON = { auto: '🌓', light: '☀️', dark: '🌙' };
    const mql =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    function _resolvedTheme(mode) {
      if (mode === 'light' || mode === 'dark') return mode;
      return mql && mql.matches ? 'dark' : 'light';
    }

    function _applyTheme(mode) {
      const d = NAV_DATA[_currentLang] || NAV_DATA.en;
      const labels = d.themeLabels || NAV_DATA.en.themeLabels;
      const resolved = _resolvedTheme(mode);
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.setAttribute('data-theme-mode', mode);
      for (const themeBtn of themeBtns) {
        themeBtn.textContent = THEME_ICON[mode] || THEME_ICON.auto;
        themeBtn.setAttribute('aria-label', labels[mode] || labels.auto);
        themeBtn.setAttribute('title', labels[mode] || labels.auto);
        themeBtn.setAttribute('data-theme-mode', mode);
      }
    }

    function _currentMode() {
      const themeBtn = themeBtns[0];
      const m = themeBtn.getAttribute('data-theme-mode') || 'auto';
      return THEME_CYCLE.includes(m) ? m : 'auto';
    }

    try {
      const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
      const saved = prefs.theme;
      const initial = THEME_CYCLE.includes(saved) ? saved : 'auto';
      _applyTheme(initial);
    } catch (e) {
      console.warn('theme init', e);
      _applyTheme('auto');
    }

    // Live-follow system preference while in "auto" mode.
    if (mql) {
      const _onSystemChange = () => {
        if (_currentMode() === 'auto') _applyTheme('auto');
      };
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', _onSystemChange);
      } else if (typeof mql.addListener === 'function') {
        // Safari <14 fallback
        mql.addListener(_onSystemChange);
      }
    }

    themeBtns.forEach((themeBtn) => {
      themeBtn.addEventListener('click', () => {
        const current = _currentMode();
        const idx = THEME_CYCLE.indexOf(current);
        const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
        _applyTheme(next);
        try {
          const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
          prefs.theme = next;
          localStorage.setItem('user_prefs', JSON.stringify(prefs));
        } catch (e) {
          console.warn('theme save', e);
        }
      });
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
    document.querySelector('[data-mobile-nav="menu"]')?.setAttribute('aria-expanded', 'true');
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
    document.querySelector('[data-mobile-nav="menu"]')?.setAttribute('aria-expanded', 'false');
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

  // ── Focus trap inside the open drawer ──────────────────────────────────────
  drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !navEl.classList.contains('nav--open')) return;
    const focusables = drawer.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // ── Apply site-level feature flags (async — runs after current call stack) ─
  applyFeatureFlags().catch((err) => {
    console.warn('[nav] Failed to apply feature flags:', err);
  });

  return _buildReturnValue();
}

// ─────────────────────────────────────────────────────────────────────────────
// Scroll behavior: is-scrolled + hide/reveal (Track B §5.B.7)
// ─────────────────────────────────────────────────────────────────────────────

function _initNavScrollBehavior(navEl) {
  if (!navEl || typeof window === 'undefined') return;
  const HIDE_DELTA = 6;
  const SHOW_NEAR_TOP = 64;

  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lastY = window.scrollY || 0;
  let ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY || 0;

    // Scrolled state (for shadow/border tint) — always tracked.
    if (y > 4) {
      navEl.setAttribute('data-scrolled', 'true');
    } else {
      navEl.removeAttribute('data-scrolled');
    }

    // Never hide while drawer/dropdown open, or near the top, or when reduced motion.
    if (reduceMotion || y < SHOW_NEAR_TOP || navEl.classList.contains('nav--open')) {
      navEl.removeAttribute('data-nav-hidden');
      lastY = y;
      return;
    }
    if (navEl.querySelector('.nav-dropdown.is-open')) {
      navEl.removeAttribute('data-nav-hidden');
      lastY = y;
      return;
    }

    const delta = y - lastY;
    if (delta > HIDE_DELTA) {
      navEl.setAttribute('data-nav-hidden', 'true');
    } else if (delta < -HIDE_DELTA) {
      navEl.removeAttribute('data-nav-hidden');
    }
    lastY = y;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    },
    { passive: true }
  );

  // Initial sync (e.g., if page loaded mid-scroll).
  update();
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile bottom navigation bar
// ─────────────────────────────────────────────────────────────────────────────

function _injectMobileBottomNav(lang, _depth) {
  // Guard against double-injection
  if (document.querySelector('.mobile-bottom-nav')) return;

  const isAr = lang === 'ar';
  const data = NAV_DATA[lang] || NAV_DATA.en;
  const labels = data.bottomNav || NAV_DATA.en.bottomNav;

  // Bottom nav uses root-safe absolute hrefs (matches phx/06 AR-nav pattern).
  const items = [
    { href: '/', icon: '🏠', label: labels.home, key: 'home' },
    { href: '/tracker.html', icon: '📈', label: labels.tracker, key: 'tracker' },
    { href: '/calculator.html', icon: '🧮', label: labels.calculator, key: 'calculator' },
    { href: '/shops.html', icon: '🏪', label: labels.shops, key: 'shops' },
    { action: 'menu', icon: '☰', label: labels.menu, key: 'menu' },
  ];

  const itemsHtml = items
    .map((item) => {
      const isActive = !item.action && typeof item.href === 'string' && isPageMatch(item.href);
      const cls = 'mobile-bottom-nav-item' + (isActive ? ' is-active' : '');

      if (item.action === 'menu') {
        return `<button class="${cls}" data-mobile-nav="menu" type="button" aria-label="${item.label}" aria-expanded="false" aria-controls="nav-drawer">
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
    <div class="mobile-bottom-nav" role="navigation" aria-label="${data.quickNav}" dir="${isAr ? 'rtl' : 'ltr'}">
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
      if (burger) {
        burger.click();
        menuBtn.setAttribute('aria-expanded', burger.getAttribute('aria-expanded') || 'false');
      }
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
    btn.setAttribute('aria-label', data.toggleLanguage);
  });

  const brand = nav.querySelector('.nav-brand');
  if (brand) brand.setAttribute('aria-label', data.brandLabel);

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

  // Dropdown groups
  data.groups.forEach((group, gi) => {
    // Desktop button — preserve the caret <span>
    const btn = nav.querySelector(`.nav-dropdown-btn[data-group="${group.key}"]`);
    if (btn) {
      btn.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.textContent = group.label;
      });
    }

    // Desktop panel items (label + description live inside nav-dropdown-item-body)
    const panel = nav.querySelector(`.nav-dropdown[data-group="${group.key}"] .nav-dropdown-panel`);
    if (panel) {
      panel.querySelectorAll('.nav-dropdown-item').forEach((el, i) => {
        const src = group.items[i];
        if (!src) return;
        const labelEl = el.querySelector('.nav-dropdown-item-label');
        if (labelEl) labelEl.textContent = src.label;
        const descEl = el.querySelector('.nav-dropdown-item-desc');
        if (descEl && src.description) descEl.textContent = src.description;
      });
      const panelTitle = panel.querySelector('.nav-dropdown-panel-title');
      if (panelTitle) panelTitle.textContent = group.label;
      const panelDesc = panel.querySelector('.nav-dropdown-panel-desc');
      if (panelDesc && group.description) panelDesc.textContent = group.description;
    }

    // Mobile drawer group (<details><summary><span>LABEL</span><caret/></summary>…)
    const drawerGroups = nav.querySelectorAll('.nav-drawer-group');
    if (drawerGroups[gi]) {
      const summary = drawerGroups[gi].querySelector('.nav-drawer-group-label');
      if (summary) {
        const labelSpan = summary.querySelector('span:not(.nav-drawer-group-caret)');
        if (labelSpan) labelSpan.textContent = group.label;
        else summary.textContent = group.label;
      }
      drawerGroups[gi].querySelectorAll('.nav-drawer-link').forEach((el, i) => {
        const src = group.items[i];
        if (!src) return;
        const labelEl = el.querySelector('.nav-drawer-link-label');
        if (labelEl) labelEl.textContent = src.label;
        else el.textContent = src.label;
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

  const searchBtn = document.getElementById('nav-search-btn');
  if (searchBtn) searchBtn.setAttribute('aria-label', data.searchLabel);
  const searchInput = document.getElementById('nav-search-input');
  if (searchInput) {
    searchInput.setAttribute('aria-label', data.searchLabel);
    searchInput.setAttribute('placeholder', data.searchPlaceholder);
  }
  document.querySelectorAll('[data-nav-theme-toggle]').forEach((btn) => {
    const mode = btn.getAttribute('data-theme-mode') || 'auto';
    const labels = data.themeLabels || NAV_DATA.en.themeLabels;
    btn.setAttribute('aria-label', labels[mode] || labels.auto);
    btn.setAttribute('title', labels[mode] || labels.auto);
  });

  // Mobile bottom nav language update
  const bottomNav = document.querySelector('.mobile-bottom-nav');
  if (bottomNav) {
    bottomNav.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    bottomNav.setAttribute('aria-label', data.quickNav);
    const labels = data.bottomNav || NAV_DATA.en.bottomNav;
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
 *
 * Track B (§5.B.5) enhancements:
 *   - Keyboard shortcuts: `/` and `Ctrl/Cmd+K` open the overlay (ignored inside inputs).
 *   - Recent searches persisted in localStorage under `nav.search.recent` (cap 8).
 *   - All result rows built via safe DOM (createElement + textContent); no innerHTML sinks.
 *   - Progressive enhancement: the `/content/search/` link in Tools stays as the no-JS fallback.
 *
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

  const RECENT_KEY = 'nav.search.recent';
  const RECENT_CAP = 8;

  function readRecent() {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr)
        ? arr.filter((s) => typeof s === 'string').slice(0, RECENT_CAP)
        : [];
    } catch {
      return [];
    }
  }

  function pushRecent(q) {
    if (!q || q.length < 2) return;
    try {
      const list = readRecent().filter((s) => s !== q);
      list.unshift(q);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_CAP)));
    } catch {
      /* ignore */
    }
  }

  function clearResults() {
    if (dropdown) dropdown.replaceChildren();
  }

  function showMessage(text) {
    if (!dropdown) return;
    dropdown.replaceChildren();
    const msg = document.createElement('div');
    msg.className = 'nav-search-message';
    msg.textContent = text;
    dropdown.appendChild(msg);
  }

  function isOpen() {
    return !overlay.hasAttribute('hidden');
  }

  let debounceTimer = null;

  function openOverlay() {
    overlay.removeAttribute('hidden');
    btn.setAttribute('aria-expanded', 'true');
    input.focus();
    // If the input is empty, surface recent searches (if any).
    if (!input.value.trim()) renderRecent();
  }

  function closeOverlay() {
    overlay.setAttribute('hidden', '');
    btn.setAttribute('aria-expanded', 'false');
    clearResults();
  }

  function renderRecent() {
    const recents = readRecent();
    if (!recents.length) {
      clearResults();
      return;
    }
    dropdown.replaceChildren();
    const header = document.createElement('div');
    header.className = 'nav-search-message nav-search-section-head';
    header.textContent = (NAV_DATA[_currentLang] || NAV_DATA.en).recentSearches;
    dropdown.appendChild(header);
    for (const q of recents) {
      const btnEl = document.createElement('button');
      btnEl.type = 'button';
      btnEl.className = 'nav-search-recent';
      btnEl.textContent = q;
      btnEl.addEventListener('click', () => {
        input.value = q;
        input.dispatchEvent(new Event('input'));
      });
      dropdown.appendChild(btnEl);
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen()) closeOverlay();
    else openOverlay();
  });

  // Global keyboard shortcuts: `/` and Ctrl/Cmd+K
  document.addEventListener('keydown', (e) => {
    const ae = document.activeElement;
    const inField =
      ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
    const isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !inField;
    const isCmdK = (e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 'k' || e.key === 'K');
    if (isSlash || isCmdK) {
      e.preventDefault();
      if (!isOpen()) openOverlay();
      else input.focus();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!overlay.contains(e.target) && e.target !== btn && isOpen()) {
      closeOverlay();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlay();
      btn.focus();
    }
    if (e.key === 'Enter') {
      const first = dropdown.querySelector('a');
      if (first) {
        pushRecent(input.value.trim());
        first.click();
      }
    }
    if (e.key === 'ArrowDown') {
      const items = Array.from(dropdown.querySelectorAll('a, button'));
      if (items.length) {
        items[0].focus();
        e.preventDefault();
      }
    }
  });

  dropdown.addEventListener('keydown', (e) => {
    const items = Array.from(dropdown.querySelectorAll('a, button'));
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
      btn.focus();
    }
  });

  function renderResults(results, q) {
    const base = basePath.replace(/\/$/, '');
    dropdown.replaceChildren();

    // Group results by `type` if available.
    const groups = new Map();
    for (const r of results) {
      const key = r.type || 'Pages';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    for (const [typeLabel, entries] of groups) {
      const head = document.createElement('div');
      head.className = 'nav-search-message nav-search-section-head';
      head.textContent = typeLabel;
      dropdown.appendChild(head);

      for (const r of entries) {
        const href = base + r.url;
        const a = document.createElement('a');
        a.href = href;
        a.className = 'nav-search-result';
        a.setAttribute('tabindex', '0');
        a.setAttribute('role', 'option');

        const icon = document.createElement('span');
        icon.className = 'nav-search-result-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = r.icon || '🔍';
        a.appendChild(icon);

        const body = document.createElement('span');
        body.className = 'nav-search-result-body';

        const label = document.createElement('span');
        label.className = 'nav-search-result-label';
        label.textContent = r.label || '';
        body.appendChild(label);

        if (r.type) {
          const type = document.createElement('span');
          type.className = 'nav-search-result-type';
          type.textContent = r.type;
          body.appendChild(type);
        }

        a.appendChild(body);
        a.addEventListener('click', () => pushRecent(q));
        dropdown.appendChild(a);
      }
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      // Empty/too-short query: show recent searches instead of results.
      renderRecent();
      return;
    }

    debounceTimer = setTimeout(async () => {
      const mod = await getSearch();
      if (!mod) {
        showMessage((NAV_DATA[_currentLang] || NAV_DATA.en).searchUnavailable);
        return;
      }
      const results = mod.search(q);
      if (!results.length) {
        showMessage((NAV_DATA[_currentLang] || NAV_DATA.en).noSearchResults);
        return;
      }
      renderResults(results, q);
    }, 200);
  });
}
