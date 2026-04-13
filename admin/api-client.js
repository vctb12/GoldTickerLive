/**
 * admin/api-client.js
 * Shared JWT API client for all GoldAdmin pages.
 *
 * All requests target the Express backend at /api/admin/*.
 * The API origin is auto-detected from window.location.origin and can be
 * overridden by storing a URL in localStorage under 'gp_api_origin'
 * (useful when the admin static files are served from GitHub Pages but the
 * API runs on a separate host, e.g. Replit).
 */

// ---------------------------------------------------------------------------
// API base URL
// ---------------------------------------------------------------------------

function getApiBase() {
  let override = null;
  try { override = localStorage.getItem('gp_api_origin'); } catch {}
  return (override || window.location.origin) + '/api/admin';
}

const API_BASE = getApiBase();

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'gp_admin_token';

/** @returns {string|null} */
export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

/** @param {string} token */
export function setToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch {}
}

/** Remove stored JWT and any legacy session key. */
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('gp_admin_session'); // clean up legacy key
    localStorage.removeItem('gp_admin_hash');
  } catch {}
}

/** @returns {boolean} true if a JWT token string exists (not validated). */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Synchronous guard: redirects immediately if no token is present.
 * Use this in an inline <script> before the module to prevent flash-of-content.
 * @param {string} [redirectTo='../login/']
 * @returns {boolean}
 */
export function requireAuth(redirectTo = '../login/') {
  if (!isAuthenticated()) {
    window.location.replace(redirectTo);
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Performs a fetch against the admin API.
 * Automatically attaches Authorization header, handles 401 (redirect to login)
 * and 403 (emits a 'admin:forbidden' event so pages can show a toast).
 *
 * @param {string} path - path relative to API_BASE (e.g. '/shops')
 * @param {RequestInit} [options]
 * @returns {Promise<any>} parsed JSON body
 * @throws {{ status: number, message: string, code?: string }} on API errors
 * @throws {{ offline: true, message: string }} on network failure
 */
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(API_BASE + path, { ...options, headers });
  } catch (err) {
    // Network error / server offline
    document.dispatchEvent(new CustomEvent('admin:offline'));
    throw { offline: true, message: 'Admin server is unreachable. Make sure the server is running.' };
  }

  // Server is reachable — hide any offline banner
  document.dispatchEvent(new CustomEvent('admin:online'));

  if (response.status === 401) {
    clearToken();
    window.location.replace(resolveLoginPath());
    throw { status: 401, message: 'Session expired. Please sign in again.' };
  }

  if (response.status === 403) {
    document.dispatchEvent(new CustomEvent('admin:forbidden'));
    throw { status: 403, message: 'You do not have permission to perform this action.' };
  }

  let body;
  try {
    body = await response.json();
  } catch {
    body = { success: false, message: `HTTP ${response.status}` };
  }

  if (!response.ok) {
    throw { status: response.status, message: body.message || `HTTP ${response.status}`, body };
  }

  return body;
}

/** Resolve the login redirect path relative to the current page depth. */
function resolveLoginPath() {
  const path = window.location.pathname;
  if (path.includes('/admin/') && path.split('/admin/')[1]?.length > 0) {
    return '../login/';
  }
  return './login/';
}

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

/**
 * Login with email + password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: true, token: string, user: object }|{ success: false, message: string }>}
 */
export async function login(email, password) {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.success && data.token) {
      setToken(data.token);
    }
    return data;
  } catch (err) {
    if (err.offline) return { success: false, message: err.message, offline: true };
    if (err.status === 401 || err.status === 400) {
      clearToken();
      return { success: false, message: err.body?.message || 'Invalid credentials.' };
    }
    if (err.status === 429) {
      return { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' };
    }
    return { success: false, message: err.message || 'Login failed.' };
  }
}

/**
 * Verify the stored token with the server.
 * @returns {Promise<{ success: true, user: object }|null>}
 */
export async function verifyToken() {
  try {
    return await apiFetch('/auth/verify');
  } catch {
    return null;
  }
}

/**
 * Clear the local token (server-side JWT is stateless, no revoke needed).
 */
export function logout() {
  clearToken();
}

/**
 * logActivity is a no-op stub — the server logs all actions via its audit system.
 * Kept for backwards-compatibility with existing page scripts.
 */
export function logActivity() {}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

/** @returns {Promise<object>} */
export async function getStats() {
  return apiFetch('/stats');
}

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

/**
 * @param {{ search?, status?, type?, city?, country?, sortBy?, sortDesc?, page?, limit? }} [opts]
 * @returns {Promise<{ success: true, shops: object[], total: number, page: number, totalPages: number }>}
 */
export async function getShops(opts = {}) {
  const params = new URLSearchParams();
  if (opts.search)     params.set('search', opts.search);
  if (opts.status)     params.set('status', opts.status);
  if (opts.type)       params.set('type', opts.type);
  if (opts.city)       params.set('city', opts.city);
  if (opts.country)    params.set('country', opts.country);
  if (opts.sortBy)     params.set('sortBy', opts.sortBy);
  if (opts.sortDesc)   params.set('sortDesc', 'true');
  if (opts.page)       params.set('page', String(opts.page));
  if (opts.limit)      params.set('limit', String(opts.limit));
  const qs = params.toString();
  return apiFetch('/shops' + (qs ? '?' + qs : ''));
}

/**
 * @param {string} id
 * @returns {Promise<{ success: true, shop: object }>}
 */
export async function getShop(id) {
  return apiFetch(`/shops/${encodeURIComponent(id)}`);
}

/**
 * @param {object} data
 * @returns {Promise<{ success: true, shop: object }>}
 */
export async function createShop(data) {
  return apiFetch('/shops', { method: 'POST', body: JSON.stringify(data) });
}

/**
 * @param {string} id
 * @param {object} data
 * @returns {Promise<{ success: true, shop: object }>}
 */
export async function updateShop(id, data) {
  return apiFetch(`/shops/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

/**
 * @param {string} id
 * @returns {Promise<{ success: true }>}
 */
export async function deleteShop(id) {
  return apiFetch(`/shops/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

/**
 * @param {{ action?, entityType?, actor?, startDate?, endDate?, page?, limit? }} [opts]
 * @returns {Promise<{ success: true, logs: object[], total: number }>}
 */
export async function getAuditLogs(opts = {}) {
  const params = new URLSearchParams();
  if (opts.action)     params.set('action', opts.action);
  if (opts.entityType) params.set('entityType', opts.entityType);
  if (opts.actor)      params.set('actor', opts.actor);
  if (opts.startDate)  params.set('startDate', opts.startDate);
  if (opts.endDate)    params.set('endDate', opts.endDate);
  if (opts.page)       params.set('page', String(opts.page));
  if (opts.limit)      params.set('limit', String(opts.limit));
  const qs = params.toString();
  return apiFetch('/audit-logs' + (qs ? '?' + qs : ''));
}

/**
 * Trigger a CSV download of all audit logs.
 */
export async function exportAuditLogs() {
  const token = getToken();
  const res = await fetch(API_BASE + '/audit-logs/export', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw { status: res.status, message: 'Export failed' };
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/** @returns {Promise<{ success: true, users: object[] }>} */
export async function getUsers() {
  return apiFetch('/users');
}

/**
 * @param {{ email: string, password: string, name?: string, role?: string }} data
 * @returns {Promise<{ success: true, user: object }|{ success: false, message: string }>}
 */
export async function createUser(data) {
  return apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
}

/**
 * @param {string} id
 * @param {{ name?, role?, password? }} updates
 * @returns {Promise<{ success: true, user: object }|{ success: false, message: string }>}
 */
export async function updateUser(id, updates) {
  return apiFetch(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(updates) });
}

/**
 * @param {string} id
 * @returns {Promise<{ success: true }|{ success: false, message: string }>}
 */
export async function deleteUser(id) {
  return apiFetch(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
