/**
 * admin/auth.js
 * Client-side SHA-256 authentication for the admin panel.
 * Uses Web Crypto API (crypto.subtle) — no external dependencies.
 */

const KEYS = {
  hash: 'gp_admin_hash',
  session: 'gp_admin_session',
  log: 'gp_activity_log',
};

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOG_ENTRIES = 100;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function sha256hex(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns true if a password hash has been stored (i.e. admin is set up).
 * @returns {boolean}
 */
export function isSetup() {
  return storageGet(KEYS.hash) !== null;
}

/**
 * Hashes the given password with SHA-256 and stores it.
 * Clears any existing session so the new password takes effect immediately.
 * @param {string} password
 * @returns {Promise<string>} The stored hex hash.
 */
export async function setupPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }
  const hash = await sha256hex(password);
  storageSet(KEYS.hash, hash);
  storageRemove(KEYS.session);
  logActivity('setup', 'Admin password configured.');
  return hash;
}

/**
 * Attempts to log in with the given password.
 * Creates a 24-hour session token on success.
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function login(password) {
  const storedHash = storageGet(KEYS.hash);
  if (!storedHash) return false;

  const hash = await sha256hex(password);
  if (hash !== storedHash) {
    logActivity('login_fail', 'Failed login attempt.');
    return false;
  }

  const now = Date.now();
  const session = {
    token: randomToken(),
    createdAt: now,
    expires: now + SESSION_TTL_MS,
  };
  storageSet(KEYS.session, JSON.stringify(session));
  logActivity('login', 'Admin logged in.');
  return true;
}

/**
 * Destroys the current session.
 */
export function logout() {
  logActivity('logout', 'Admin logged out.');
  storageRemove(KEYS.session);
}

/**
 * Returns the parsed session object, or null if absent or malformed.
 * @returns {{ token: string, createdAt: number, expires: number } | null}
 */
export function getSession() {
  const raw = storageGet(KEYS.session);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Returns true if a valid, non-expired session exists.
 * @returns {boolean}
 */
export function isAuthenticated() {
  const session = getSession();
  if (!session || typeof session.expires !== 'number') return false;
  return Date.now() < session.expires;
}

/**
 * Redirects to `redirectTo` if the user is not authenticated.
 * @param {string} [redirectTo='../login/']
 * @returns {boolean} true if authenticated, false if redirecting.
 */
export function requireAuth(redirectTo = '../login/') {
  if (isAuthenticated()) return true;
  storageRemove(KEYS.session);
  window.location.href = redirectTo;
  return false;
}

/**
 * Appends an entry to the activity log (capped at MAX_LOG_ENTRIES).
 * @param {string} action
 * @param {string} [details='']
 */
export function logActivity(action, details = '') {
  let log = [];
  try {
    const raw = storageGet(KEYS.log);
    if (raw) log = JSON.parse(raw);
    if (!Array.isArray(log)) log = [];
  } catch {
    log = [];
  }

  log.push({
    action: String(action),
    details: String(details),
    timestamp: new Date().toISOString(),
  });

  if (log.length > MAX_LOG_ENTRIES) {
    log = log.slice(log.length - MAX_LOG_ENTRIES);
  }

  storageSet(KEYS.log, JSON.stringify(log));
}
