/**
 * admin/supabase-auth.js
 * Supabase-based authentication for the GoldAdmin panel.
 *
 * Uses Supabase Auth with multiple providers (GitHub, Google, Microsoft,
 * email magic link, email/password, phone OTP) and supports TOTP MFA.
 * The legacy ALLOWED_EMAIL remains as a client-side fallback; real
 * authorization should be enforced server-side (RLS / Edge function).
 * The Supabase JS client is loaded from the CDN — no build step needed.
 *
 * Config is loaded from admin/supabase-config.js which must export
 * SUPABASE_URL, SUPABASE_ANON_KEY, and ALLOWED_EMAIL.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY, ALLOWED_EMAIL } from './supabase-config.js';

let _supabase = null;

/**
 * Compute the admin base URL (origin + /admin/ prefix), handling subpaths.
 * @returns {string}
 */
function getAdminBaseUrl() {
  try {
    const { origin, pathname } = window.location;
    const idx = pathname.indexOf('/admin/');
    if (idx >= 0) {
      return origin + pathname.slice(0, idx + '/admin/'.length);
    }
    return origin + '/admin/';
  } catch {
    return '/admin/';
  }
}

/**
 * Build an absolute redirect URL inside the admin area.
 * @param {string} [path=''] e.g. '', 'login/', 'orders/'
 */
function buildRedirect(path = '') {
  const base = getAdminBaseUrl();
  const trimmed = path ? path.replace(/^\/+/, '') : '';
  return trimmed ? base + trimmed : base;
}

/**
 * Lazy-init the Supabase client (synchronous — returns null if CDN not ready).
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

/**
 * Wait for the Supabase CDN script to load and initialise the client.
 * Polls every 50 ms, up to 3 seconds.  Resolves with the client or null.
 * @returns {Promise<object|null>}
 */
function ensureClient() {
  const existing = getClient();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let elapsed = 0;
    const interval = 50;
    const maxWait = 3000;
    const timer = setInterval(() => {
      elapsed += interval;
      const client = getClient();
      if (client) {
        clearInterval(timer);
        resolve(client);
      } else if (elapsed >= maxWait) {
        clearInterval(timer);
        resolve(null);
      }
    }, interval);
  });
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
 * OAuth login (GitHub/Google/Microsoft).
 * @param {'github'|'google'|'azure'} provider
 * @param {string} [redirectTo]
 */
export async function loginWithOAuth(provider, redirectTo) {
  const sb = await ensureClient();
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh the page.' };

  const target = redirectTo || buildRedirect();
  try {
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: target,
        scopes: provider === 'github' ? 'user:email' : undefined,
      },
    });
    if (error) return { success: false, message: error.message || 'OAuth login failed.' };
    return { success: true };
  } catch (err) {
    if (err?.message?.toLowerCase().includes('network')) {
      return { success: false, message: 'Network error — cannot reach Supabase. Check your connection.' };
    }
    return { success: false, message: err?.message || 'An unexpected error occurred.' };
  }
}

/**
 * GitHub convenience wrapper.
 */
export async function loginWithGitHub(redirectTo) {
  return loginWithOAuth('github', redirectTo);
}

/**
 * Magic link login (email).
 */
export async function loginWithMagicLink(email, redirectTo) {
  const sb = await ensureClient();
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh the page.' };
  if (!email) return { success: false, message: 'Email is required.' };

  const target = redirectTo || buildRedirect();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: target, shouldCreateUser: false },
  });
  if (error) return { success: false, message: error.message || 'Could not send magic link.' };
  return { success: true };
}

/**
 * Email/password login.
 */
export async function loginWithPassword(email, password) {
  const sb = await ensureClient();
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh the page.' };
  if (!email || !password) return { success: false, message: 'Email and password are required.' };

  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { success: false, message: error.message || 'Invalid credentials.' };
  return { success: true };
}

/**
 * Send phone OTP (restricted to +971).
 */
export async function sendPhoneOtp(phone) {
  const sb = await ensureClient();
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh the page.' };
  if (!phone || !phone.startsWith('+971')) {
    return { success: false, message: 'Phone must start with +971.' };
  }
  const { error } = await sb.auth.signInWithOtp({ phone, options: { channel: 'sms' } });
  if (error) return { success: false, message: error.message || 'Could not send OTP.' };
  return { success: true };
}

/**
 * Verify phone OTP.
 */
export async function verifyPhoneOtp({ phone, token }) {
  const sb = await ensureClient();
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh the page.' };
  if (!phone || !token) return { success: false, message: 'Phone and code are required.' };
  const { error } = await sb.auth.verifyOtp({ phone, token, type: 'sms' });
  if (error) return { success: false, message: error.message || 'Invalid or expired code.' };
  return { success: true };
}

/**
 * TOTP enrollment.
 */
export async function enrollTotp() {
  const sb = await ensureClient();
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh the page.' };
  const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp' });
  if (error) return { success: false, message: error.message || 'Could not start TOTP enrollment.' };
  return { success: true, data };
}

/**
 * Verify TOTP code for a given factor.
 * @param {{ factorId: string, code: string }} params
 */
export async function verifyTotp({ factorId, code }) {
  const sb = await ensureClient();
  if (!sb) return { success: false, message: 'Supabase client not loaded. Please refresh the page.' };
  if (!factorId || !code) return { success: false, message: 'Code is required.' };

  const challenge = await sb.auth.mfa.challenge({ factorId });
  if (challenge.error) {
    return { success: false, message: challenge.error.message || 'Could not start verification.' };
  }

  const verify = await sb.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });

  if (verify.error) {
    return { success: false, message: verify.error.message || 'Invalid TOTP code.' };
  }

  return { success: true };
}

/**
 * Get the first enrolled TOTP factor id (if any).
 */
export async function getTotpFactorId() {
  const sb = await ensureClient();
  if (!sb) return null;
  const res = await sb.auth.mfa.listFactors();
  if (res.error) return null;
  const factor = res.data?.totp?.find(Boolean);
  return factor?.id || null;
}

/**
 * Legacy login stub — kept for backward compatibility.
 */
export async function login() {
  return loginWithGitHub();
}

/**
 * Sign out and clear session.
 */
export async function logout() {
  const sb = await ensureClient();
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
 * Waits for the CDN to load before checking.
 */
export async function getSession() {
  const sb = await ensureClient();
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

async function fetchAdminStatus() {
  const sb = await ensureClient();
  if (!sb) return { ok: false };
  try {
    const { data, error } = await sb.functions.invoke('admin-guard', {
      body: {},
    });
    if (error) return { ok: false, error };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

/**
 * Check if the current session belongs to an admin (server-side edge function preferred).
 * Falls back to ALLOWED_EMAIL if the edge function is unavailable.
 */
export async function isAdminUser() {
  const session = await getSession();
  if (!session) return false;

  // Prefer server-side verdict
  const status = await fetchAdminStatus();
  if (status.ok && status.data) {
    return Boolean(status.data.isAdmin);
  }

  // Fallback: client hint
  const email = resolveEmail(session.user);
  return email === ALLOWED_EMAIL;
}

/**
 * Check if user is authenticated AND is admin.
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
 * Async auth guard — redirects to login if no session or not admin.
 * Call this at the top of every admin page module.
 * @param {string} [redirectTo='../login/']
 */
export async function requireAuth(redirectTo = '../login/') {
  const session = await getSession();
  if (!session) {
    window.location.replace(redirectTo);
    return false;
  }

  const status = await fetchAdminStatus();
  if (status.ok && status.data) {
    if (!status.data.isAdmin) {
      await logout();
      window.location.replace(redirectTo);
      return false;
    }
    // If MFA required but not satisfied, let caller prompt.
    return true;
  }

  // Fallback to client email check to avoid locking out if edge function is down
  const email = resolveEmail(session.user);
  if (email !== ALLOWED_EMAIL) {
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
 * Returns synchronously — may be null if CDN hasn't loaded yet.
 * Prefer calling this after requireAuth() has resolved.
 */
export function getSupabase() {
  return getClient();
}

/**
 * Async version of getSupabase — waits for CDN to load.
 * @returns {Promise<object|null>}
 */
export async function getSupabaseAsync() {
  return ensureClient();
}

/**
 * Resolve the email for a user object (exposed for use in login pages).
 * @param {object} user
 * @returns {string|null}
 */
export { resolveEmail };

// Expose admin base helper for login page
export const ADMIN_BASE = { get: getAdminBaseUrl, buildRedirect };
