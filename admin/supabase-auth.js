/**
 * admin/supabase-auth.js
 * Supabase-based authentication for the GoldAdmin panel.
 *
 * Uses Supabase Auth with GitHub OAuth for admin login.
 * Only the ALLOWED_EMAIL (your GitHub email) can access the panel.
 * The Supabase JS client is loaded from the CDN — no build step needed.
 *
 * Config is loaded from admin/supabase-config.js which must export
 * SUPABASE_URL, SUPABASE_ANON_KEY, and ALLOWED_EMAIL.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_EMAIL } from './supabase-config.js';

let _supabase = null;

/**
 * Lazy-init the Supabase client.  Waits for the CDN script to load.
 * @returns {object|null}
 */
function getClient() {
  if (_supabase) return _supabase;
  if (typeof window !== 'undefined' && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _supabase;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Sign in via GitHub OAuth using Supabase Auth.
 * Redirects the user to GitHub's authorization page.
 * @param {string} [redirectTo] — URL to return to after login (defaults to admin root)
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
export async function loginWithGitHub(redirectTo) {
  const sb = getClient();
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh.' };

  // Default redirect: go to admin root (one level up from /login/)
  const target =
    redirectTo || window.location.origin + window.location.pathname.replace(/\/login\/?$/, '/');

  const { error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: target },
  });

  if (error) {
    return { success: false, message: error.message || 'GitHub login failed.' };
  }
  return { success: true };
}

/**
 * Legacy login stub — kept for backward compatibility.
 * GitHub OAuth is the primary method; email/password is no longer used.
 */
export async function login() {
  return loginWithGitHub();
}

/**
 * Sign out and clear session.
 */
export async function logout() {
  const sb = getClient();
  if (sb) await sb.auth.signOut();
}

/**
 * Get the current Supabase session (null if not logged in).
 */
export async function getSession() {
  const sb = getClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data?.session || null;
}

/**
 * Get the current user.
 */
export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Check if the current session belongs to the allowed admin email.
 * @returns {Promise<boolean>}
 */
export async function isAdminUser() {
  const session = await getSession();
  if (!session) return false;
  return session.user.email === ALLOWED_EMAIL;
}

/**
 * Check if user is authenticated AND is the allowed admin.
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  return await isAdminUser();
}

/**
 * Quick synchronous check — looks at Supabase's stored session key.
 * Used for flash-prevention inline scripts only.
 * NOTE: This only checks for *any* Supabase session; the async
 * requireAuth() below also verifies the email.
 */
export function hasStoredSession() {
  try {
    // Supabase stores sessions under sb-<ref>-auth-token
    const keys = Object.keys(localStorage);
    return keys.some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
  } catch {
    return false;
  }
}

/**
 * Async auth guard — redirects to login if no session or wrong email.
 * Call this at the top of every admin page module.
 * @param {string} [redirectTo='../login/']
 */
export async function requireAuth(redirectTo = '../login/') {
  const session = await getSession();

  if (!session || session.user.email !== ALLOWED_EMAIL) {
    // If logged in with the wrong account, sign them out first
    if (session) await logout();
    window.location.replace(redirectTo);
    return false;
  }
  return true;
}

/**
 * Stub for backwards compatibility — server logs actions.
 */
export function logActivity() {}

/**
 * Return the Supabase client for direct use (e.g. querying tables).
 */
export function getSupabase() {
  return getClient();
}
