/**
 * admin/auth.js
 * Compatibility re-export shim — all real logic lives in admin/supabase-auth.js.
 * This file exists so existing page scripts that import from '../auth.js' keep working.
 */
export {
  isAuthenticated,
  isAdminUser,
  requireAuth,
  login,
  loginWithGitHub,
  logout,
  logActivity,
  hasStoredSession,
  getSession,
  getUser,
  getSupabase,
} from './supabase-auth.js';

/**
 * isSetup — stub always returning true.
 * With Supabase auth there is no client-side "setup" step.
 * @returns {boolean}
 */
export function isSetup() {
  return true;
}

/**
 * setupPassword — stub, no-op.
 * Password management is done via Supabase Auth.
 */
export async function setupPassword() {}

/* Legacy stubs for api-client.js compatibility */
export function getToken() {
  try {
    const keys = Object.keys(localStorage);
    const key = keys.find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    return key ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    const keys = Object.keys(localStorage);
    keys
      .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('gp_admin_token');
    localStorage.removeItem('gp_admin_session');
    localStorage.removeItem('gp_admin_hash');
  } catch {}
}
