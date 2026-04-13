/**
 * admin/auth.js
 * Compatibility re-export shim — all real logic lives in admin/api-client.js.
 * This file exists so older page scripts that import from '../auth.js' keep working.
 */
export {
  isAuthenticated,
  requireAuth,
  login,
  logout,
  logActivity,
  getToken,
  clearToken,
} from './api-client.js';

/**
 * isSetup — stub always returning true.
 * With backend auth there is no client-side "setup" step.
 * @returns {boolean}
 */
export function isSetup() { return true; }

/**
 * setupPassword — stub, no-op.
 * Password management is done via the server API.
 */
export async function setupPassword() {}
