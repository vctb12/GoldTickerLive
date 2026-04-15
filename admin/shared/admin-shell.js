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

// ── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', slug: '' },
  { icon: '🏪', label: 'Shops', slug: 'shops' },
  { icon: '💰', label: 'Pricing', slug: 'pricing' },
  { icon: '📦', label: 'Orders', slug: 'orders' },
  { icon: '📝', label: 'Content', slug: 'content' },
  { icon: '📣', label: 'Social', slug: 'social' },
  { icon: '⚙️', label: 'Settings', slug: 'settings' },
  { icon: '📊', label: 'Analytics', slug: 'analytics' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Compute the admin base path from the current URL.
 * Supports both GitHub Pages (/Gold-Prices/admin/) and custom domains (/admin/).
 * @returns {string} e.g. "/Gold-Prices/admin/" or "/admin/"
 */
function getAdminBase() {
  const path = window.location.pathname;
  // Match up to and including /admin/
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
  // Strip the base to get the remainder, e.g. "shops/index.html" or "shops/" or ""
  const remainder = path.slice(base.length).replace(/index\.html$/, '').replace(/\/+$/, '');
  return remainder;
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
    return `<a class="${cls}" href="${href}"${aria}><span class="nav-icon">${item.icon}</span> ${item.label}</a>`;
  }).join('\n          ');

  return `
        <div class="sidebar-header">
          <span class="logo-icon" aria-hidden="true">⚙</span>
          <span class="logo-text">GoldAdmin</span>
        </div>

        <nav class="sidebar-nav" aria-label="Main menu">
          ${navLinks}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-user" id="sidebar-user"
               style="display:none;padding:0 0 10px;border-bottom:1px solid var(--border);margin-bottom:10px">
            <div style="font-size:0.8125rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                 id="sidebar-email"></div>
          </div>
          <button class="btn btn-ghost btn-sm w-full" id="logout-btn" type="button">
            <span aria-hidden="true">🚪</span> Sign Out
          </button>
        </div>`;
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

  // Close sidebar on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebarEl?.classList.contains('sidebar--open')) {
      closeSidebar();
    }
  });

  // Close sidebar when a nav link is clicked (mobile UX)
  sidebarEl?.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeSidebar);
  });

  // ── Logout button ──────────────────────────────────────
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn && logout) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      window.location.replace(login);
    });
  }

  // ── Show user email in sidebar footer ───────────────────
  if (getSession) {
    try {
      const session = await getSession();
      if (session?.user) {
        const email =
          session.user.email ||
          session.user.user_metadata?.email ||
          session.user.identities?.find((id) => id.provider === 'github')?.identity_data?.email;
        const emailEl = document.getElementById('sidebar-email');
        const userEl = document.getElementById('sidebar-user');
        if (emailEl && email) {
          emailEl.textContent = email;
          if (userEl) userEl.style.display = '';
        }
      }
    } catch {
      // Non-critical — user info display is a nice-to-have
    }
  }
}
