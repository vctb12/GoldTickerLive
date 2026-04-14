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
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the email for a Supabase user.
 * GitHub OAuth may not populate `user.email` if the email is set to private.
 * Falls back to identity data and user_metadata.
 * @param {object} user — Supabase user object
 * @returns {string|null}
 */
function resolveEmail(user) {
  if (!user) return null;
  // Primary email (set when GitHub email is public)
  if (user.email) return user.email;
  // user_metadata.email is populated from the GitHub profile
  if (user.user_metadata?.email) return user.user_metadata.email;
  // Check identity data (GitHub provider identity)
  const ghIdentity = user.identities?.find((id) => id.provider === 'github');
  if (ghIdentity?.identity_data?.email) return ghIdentity.identity_data.email;
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
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh the page.' };

  // Default redirect: go to admin root (one level up from /login/)
  const target =
    redirectTo || window.location.origin + window.location.pathname.replace(/\/login\/?$/, '/');

  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: target,
        scopes: 'user:email',
      },
    });

    if (error) {
      return { success: false, message: error.message || 'GitHub login failed.' };
    }
    return { success: true };
  } catch (err) {
    if (err?.message?.includes('fetch') || err?.message?.includes('network')) {
      return { success: false, message: 'Network error — cannot reach Supabase. Check your connection.' };
    }
    return { success: false, message: err?.message || 'An unexpected error occurred.' };
  }
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
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch {
      // signOut may fail if session is already expired — clear local storage as fallback
      try {
        const keys = Object.keys(localStorage);
        keys
          .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
          .forEach((k) => localStorage.removeItem(k));
      } catch {}
    }
  }
}

/**
 * Get the current Supabase session (null if not logged in).
 */
export async function getSession() {
  const sb = getClient();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}

/**
 * Get the current user.
 */
export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Resolve the email address of the currently authenticated user.
 * Handles the case where GitHub email is set to private.
 * @returns {Promise<string|null>}
 */
export async function getUserEmail() {
  const session = await getSession();
  if (!session) return null;
  return resolveEmail(session.user);
}

/**
 * Check if the current session belongs to the allowed admin email.
 * Uses resolveEmail() to handle private GitHub emails.
 * @returns {Promise<boolean>}
 */
export async function isAdminUser() {
  const session = await getSession();
  if (!session) return false;
  const email = resolveEmail(session.user);
  return email === ALLOWED_EMAIL;
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
  if (!session) {
    window.location.replace(redirectTo);
    return false;
  }

  const email = resolveEmail(session.user);
  if (email !== ALLOWED_EMAIL) {
    // If logged in with the wrong account, sign them out first
    await logout();
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

/**
 * Resolve the email for a user object (exposed for use in login pages).
 * @param {object} user
 * @returns {string|null}
 */
export { resolveEmail };
