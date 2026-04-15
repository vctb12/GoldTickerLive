/**
 * admin/shared/admin-shell.js
 *
 * Shared admin shell: injects the sidebar, wires mobile toggle / overlay,
 * highlights the active nav link, shows the logged-in user, and provides
 * the logout button.
 *
 * Usage (from any admin page module):
 *
 *   import { initAdminShell } from '../shared/admin-shell.js';  // or './shared/…' from dashboard
 *   await initAdminShell({ logout, getSession });
 *
 * The function expects the page to contain:
 *   <div class="sidebar-overlay" id="sidebar-overlay"></div>
 *   <div class="admin-layout">
 *     <aside class="sidebar" id="sidebar" aria-label="Admin navigation"></aside>
 *     …
 *     <button class="sidebar-toggle" id="sidebar-toggle" …>☰</button>
 *   </div>
 */

import { ICONS } from './icons.js';
import { initCommandPalette } from './admin-utils.js';

// ── Chevron SVGs for collapse button ────────────────────────────────────────
const CHEVRON_LEFT = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>`;
const CHEVRON_RIGHT = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>`;

const SIDEBAR_COLLAPSED_KEY = 'gp_admin_sidebar_collapsed';

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { iconKey: 'dashboard', label: 'Dashboard', slug: '' },
  { iconKey: 'shops',     label: 'Shops',     slug: 'shops' },
  { iconKey: 'pricing',   label: 'Pricing',   slug: 'pricing' },
  { iconKey: 'orders',    label: 'Orders',    slug: 'orders' },
  { iconKey: 'content',   label: 'Content',   slug: 'content' },
  { iconKey: 'social',    label: 'Social',    slug: 'social' },
  { iconKey: 'settings',  label: 'Settings',  slug: 'settings' },
  { iconKey: 'analytics', label: 'Analytics', slug: 'analytics' },
];

// Bottom nav shows the four most-used sections + a More button
const BOTTOM_NAV_ITEMS = [
  { iconKey: 'dashboard', label: 'Dashboard', slug: '' },
  { iconKey: 'shops',     label: 'Shops',     slug: 'shops' },
  { iconKey: 'orders',    label: 'Orders',    slug: 'orders' },
  { iconKey: 'social',    label: 'Social',    slug: 'social' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute the admin base path from the current URL.
 * Supports both GitHub Pages (/Gold-Prices/admin/) and custom domains (/admin/).
 * @returns {string} e.g. "/Gold-Prices/admin/" or "/admin/"
 */
function getAdminBase() {
  const path = window.location.pathname;
  const match = path.match(/^(.*\/admin\/)/);
  return match ? match[1] : '/admin/';
}

/**
 * Determine which nav slug is active based on the current URL.
 * @returns {string} slug ('' for dashboard, 'shops' for shops, etc.)
 */
function getActiveSlug() {
  const path = window.location.pathname;
  const base = getAdminBase();
  const remainder = path.slice(base.length).replace(/index\.html$/, '').replace(/\/+$/, '');
  return remainder;
}

/** Strip HTML tags from a string — used only for plain-text representations. */
function stripHtml(html) {
  return html.replace(/<[^>]*>|\s+/g, ' ').trim();
}

// ── Sidebar HTML builder ─────────────────────────────────────────────────────

/**
 * Build the inner HTML for the sidebar <aside>.
 * @param {string} adminBase — e.g. "/Gold-Prices/admin/"
 * @param {string} activeSlug — e.g. "shops" or ""
 * @returns {string}
 */
function buildSidebarHTML(adminBase, activeSlug) {
  const navLinks = NAV_ITEMS.map((item) => {
    const href = adminBase + (item.slug ? item.slug + '/' : '');
    const isActive = item.slug === activeSlug;
    const cls = 'nav-link' + (isActive ? ' active' : '');
    const aria = isActive ? ' aria-current="page"' : '';
    // Orders link gets a badge placeholder for pending count
    const badge = item.slug === 'orders'
      ? '<span class="notification-badge" id="orders-badge" aria-label="pending orders count" style="display:none"></span>'
      : '';
    return `<a class="${cls}" href="${href}"${aria}><span class="nav-icon">${ICONS[item.iconKey]}</span><span class="nav-label">${item.label}</span>${badge}</a>`;
  }).join('\n          ');

  return `
        <div class="sidebar-header">
          <span class="logo-icon" aria-hidden="true">⚙</span>
          <span class="logo-text">GoldAdmin</span>
          <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" title="Collapse sidebar" aria-label="Collapse sidebar">${CHEVRON_LEFT}</button>
        </div>

        <nav class="sidebar-nav" aria-label="Main menu">
          ${navLinks}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user-row" id="sidebar-user"
               style="display:flex;align-items:center;gap:8px;padding:0 0 10px;border-bottom:1px solid var(--border);margin-bottom:10px">
            <div class="user-avatar" id="sidebar-avatar">?</div>
            <div style="min-width:0;flex:1">
              <div class="sidebar-user-email" id="sidebar-email"
                   style="font-size:0.8125rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></div>
              <div class="role-badge role-badge--admin" style="display:inline-block;margin-top:2px">admin</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm w-full" id="logout-btn" type="button">
            <span class="nav-icon">${ICONS.logout}</span><span class="nav-label"> Sign Out</span>
          </button>
        </div>`;
}

// ── Mobile bottom nav ────────────────────────────────────────────────────────

function injectBottomNav(adminBase, activeSlug, openSidebarFn) {
  if (document.querySelector('.admin-bottom-nav')) return;
  const nav = document.createElement('nav');
  nav.className = 'admin-bottom-nav';
  nav.setAttribute('aria-label', 'Mobile navigation');

  const items = BOTTOM_NAV_ITEMS.map((item) => {
    const href = adminBase + (item.slug ? item.slug + '/' : '');
    const isActive = item.slug === activeSlug;
    return `<a class="bottom-nav-item${isActive ? ' active' : ''}" href="${href}"${isActive ? ' aria-current="page"' : ''}>
      <span class="bottom-nav-icon">${ICONS[item.iconKey]}</span>
      <span class="bottom-nav-label">${item.label}</span>
    </a>`;
  });

  // More button opens the sidebar
  items.push(`<button class="bottom-nav-item" id="bottom-nav-more" type="button" aria-label="More navigation options">
    <span class="bottom-nav-icon">${ICONS.menu}</span>
    <span class="bottom-nav-label">More</span>
  </button>`);

  nav.innerHTML = items.join('');
  document.body.appendChild(nav);

  document.getElementById('bottom-nav-more')?.addEventListener('click', openSidebarFn);
}

// ── Breadcrumb ───────────────────────────────────────────────────────────────

/**
 * Render a breadcrumb nav after the page-header element.
 * Pass no pageName (or undefined) to skip rendering (e.g. Dashboard).
 * @param {string} [pageName]
 */
export function renderBreadcrumb(pageName) {
  if (!pageName) return;
  // Accept array [{label, href?}, ...] or plain string
  const crumbs = Array.isArray(pageName)
    ? pageName
    : [{ label: String(pageName) }];
  if (!crumbs.length) return;
  const adminBase = getAdminBase();
  const header = document.querySelector('header.page-header');
  if (!header) return;

  let bc = header.nextElementSibling;
  if (!bc || !bc.classList.contains('breadcrumb')) {
    bc = document.createElement('nav');
    bc.className = 'breadcrumb';
    bc.setAttribute('aria-label', 'Breadcrumb');
    header.insertAdjacentElement('afterend', bc);
  }

  // Build trail: "GoldAdmin > [crumb1] > ... > currentPage"
  const parts = [`<a href="${adminBase}">GoldAdmin</a>`];
  crumbs.forEach((c, i) => {
    parts.push(`<span class="breadcrumb-sep" aria-hidden="true">›</span>`);
    if (c.href && i < crumbs.length - 1) {
      parts.push(`<a href="${adminBase}${c.href}">${c.label}</a>`);
    } else {
      parts.push(`<span class="breadcrumb-current">${c.label}</span>`);
    }
  });
  bc.innerHTML = parts.join('');
}

// ── Main init function ───────────────────────────────────────────────────────

/**
 * Initialise the admin shell: populate sidebar, wire events, show user info.
 *
 * @param {object} opts
 * @param {() => Promise<void>} opts.logout — supabase logout function
 * @param {() => Promise<object|null>} opts.getSession — returns current session
 * @param {string} [opts.loginPath] — override login redirect (auto-computed if omitted)
 */
export async function initAdminShell({ logout, getSession, loginPath } = {}) {
  const adminBase = getAdminBase();
  const activeSlug = getActiveSlug();
  const login = loginPath || adminBase + 'login/';

  // ── Inject sidebar content ──────────────────────────────
  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) {
    sidebarEl.innerHTML = buildSidebarHTML(adminBase, activeSlug);
  }

  // ── Collapse / expand sidebar ──────────────────────────
  const mainArea = document.querySelector('.main-area');
  const collapseBtn = document.getElementById('sidebar-collapse-btn');

  function setCollapsed(collapsed) {
    if (collapsed) {
      sidebarEl?.classList.add('sidebar--collapsed');
      mainArea?.classList.add('main-area--collapsed');
      if (collapseBtn) collapseBtn.innerHTML = CHEVRON_RIGHT;
    } else {
      sidebarEl?.classList.remove('sidebar--collapsed');
      mainArea?.classList.remove('main-area--collapsed');
      if (collapseBtn) collapseBtn.innerHTML = CHEVRON_LEFT;
    }
  }

  // Restore persisted state
  try {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved === 'true') setCollapsed(true);
  } catch { /* storage unavailable */ }

  collapseBtn?.addEventListener('click', () => {
    const willCollapse = !sidebarEl?.classList.contains('sidebar--collapsed');
    setCollapsed(willCollapse);
    try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(willCollapse)); } catch { /* ignore */ }
  });

  // ── Mobile sidebar toggle ───────────────────────────────
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('sidebar-toggle');

  function openSidebar() {
    sidebarEl?.classList.add('sidebar--open');
    overlay?.classList.add('sidebar-overlay--visible');
  }
  function closeSidebar() {
    sidebarEl?.classList.remove('sidebar--open');
    overlay?.classList.remove('sidebar-overlay--visible');
  }

  toggleBtn?.addEventListener('click', () => {
    if (sidebarEl?.classList.contains('sidebar--open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  overlay?.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebarEl?.classList.contains('sidebar--open')) {
      closeSidebar();
    }
  });

  sidebarEl?.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeSidebar);
  });

  // ── Mobile bottom nav ───────────────────────────────────
  injectBottomNav(adminBase, activeSlug, openSidebar);

  // ── Logout button ──────────────────────────────────────
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn && logout) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      window.location.replace(login);
    });
  }

  // ── Show user info in sidebar footer ────────────────────
  if (getSession) {
    try {
      const session = await getSession();
      if (session?.user) {
        const email =
          session.user.email ||
          session.user.user_metadata?.email ||
          session.user.identities?.find((id) => id.provider === 'github')?.identity_data?.email;
        const emailEl = document.getElementById('sidebar-email');
        const avatarEl = document.getElementById('sidebar-avatar');
        if (email) {
          if (emailEl) emailEl.textContent = email;
          if (avatarEl) avatarEl.textContent = email[0].toUpperCase();
        }
      }
    } catch {
      // Non-critical — user info display is a nice-to-have
    }
  }

  // ── Pending orders badge ─────────────────────────────────
  try {
    // Dynamically import to avoid hard dependency if supabase-auth is missing
    const { getSupabase } = await import('../supabase-auth.js');
    const sb = getSupabase();
    if (sb) {
      const { count } = await sb
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (count > 0) {
        const badge = document.getElementById('orders-badge');
        if (badge) {
          badge.textContent = count;
          badge.style.display = '';
        }
      }
    }
  } catch {
    // Non-critical — badge is a nice-to-have
  }

  // ── Command palette ──────────────────────────────────────
  const paletteItems = NAV_ITEMS.map((item) => ({
    label: item.label,
    icon: ICONS[item.iconKey] || '',
    href: adminBase + (item.slug ? item.slug + '/' : ''),
  }));
  initCommandPalette(paletteItems);
}
