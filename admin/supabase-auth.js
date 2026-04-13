/**
 * admin/supabase-auth.js
 * Supabase-based authentication for the GoldAdmin panel.
 *
 * Uses Supabase Auth (email + password) instead of the custom JWT backend.
 * The Supabase JS client is loaded from the CDN — no build step needed.
 *
 * Config is loaded from admin/supabase-config.js which must export
 * SUPABASE_URL and SUPABASE_ANON_KEY.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

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
 * Sign in with email + password via Supabase Auth.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, message?: string, user?: object }>}
 */
export async function login(email, password) {
  const sb = getClient();
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh.' };

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    return { success: false, message: error.message || 'Invalid credentials.' };
  }
  return { success: true, user: data.user };
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
 * Check if user is authenticated (has an active Supabase session).
 * This is async — use for module-level checks.
 */
export async function isAuthenticated() {
  return !!(await getSession());
}

/**
 * Quick synchronous check — looks at Supabase's stored session key.
 * Used for flash-prevention inline scripts only.
 */
export function hasStoredSession() {
  try {
    // Supabase stores sessions under sb-<ref>-auth-token
    const keys = Object.keys(localStorage);
    return keys.some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  } catch {
    return false;
  }
}

/**
 * Async auth guard — redirects to login if no session.
 * Call this at the top of every admin page module.
 * @param {string} [redirectTo='../login/']
 */
export async function requireAuth(redirectTo = '../login/') {
  const session = await getSession();
  if (!session) {
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
