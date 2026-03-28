/**
 * Price alert system using localStorage + browser Notifications API.
 * Alerts fire when the gold price crosses a user-defined threshold.
 */

const ALERTS_KEY = 'gold_price_alerts';

/**
 * @typedef {Object} PriceAlert
 * @property {string}  id        - Unique ID
 * @property {'above'|'below'} direction - Trigger direction
 * @property {number}  targetUsd - Target XAU/USD price
 * @property {string}  label     - Display label (e.g. "Alert: 2000")
 * @property {boolean} active    - Is this alert active?
 * @property {number}  createdAt - Unix ms timestamp
 * @property {number|null} firedAt - When it last fired (null = never)
 */

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Alerts cache write failed:', e.message);
  }
}

export function loadAlerts() {
  return safeGet(ALERTS_KEY) || [];
}

export function saveAlerts(alerts) {
  safeSet(ALERTS_KEY, alerts);
}

export function addAlert(direction, targetUsd, label = '') {
  const alerts = loadAlerts();
  const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  alerts.push({
    id,
    direction,
    targetUsd,
    label: label || `${direction === 'above' ? '≥' : '≤'} $${targetUsd.toLocaleString()}`,
    active: true,
    createdAt: Date.now(),
    firedAt: null,
  });
  saveAlerts(alerts);
  return id;
}

export function removeAlert(id) {
  const alerts = loadAlerts().filter(a => a.id !== id);
  saveAlerts(alerts);
}

export function toggleAlert(id) {
  const alerts = loadAlerts();
  const idx = alerts.findIndex(a => a.id === id);
  if (idx !== -1) {
    alerts[idx].active = !alerts[idx].active;
    saveAlerts(alerts);
    return alerts[idx].active;
  }
  return null;
}

/**
 * Check current price against all active alerts.
 * Fires browser notification for any that trigger.
 * @param {number} currentUsdPrice
 * @returns {string[]} IDs of alerts that fired
 */
export function checkAlerts(currentUsdPrice) {
  if (!currentUsdPrice) return [];
  const alerts = loadAlerts();
  const fired = [];

  for (const alert of alerts) {
    if (!alert.active) continue;

    // Cooldown: don't re-fire within 5 minutes
    if (alert.firedAt && (Date.now() - alert.firedAt) < 5 * 60 * 1000) continue;

    const triggered =
      (alert.direction === 'above' && currentUsdPrice >= alert.targetUsd) ||
      (alert.direction === 'below' && currentUsdPrice <= alert.targetUsd);

    if (triggered) {
      fired.push(alert.id);
      alert.firedAt = Date.now();
      fireNotification(alert, currentUsdPrice);
    }
  }

  if (fired.length) saveAlerts(alerts);
  return fired;
}

function fireNotification(alert, currentPrice) {
  const title = `Gold Price Alert: ${alert.label}`;
  const body = `Current price: $${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / oz`;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/Gold-Prices/favicon.svg',
        tag: alert.id, // Prevent duplicate notifications
      });
    } catch (e) {
      console.warn('Notification failed:', e.message);
    }
  }

  // Also dispatch a custom DOM event for in-page alert banners
  window.dispatchEvent(new CustomEvent('goldAlertFired', {
    detail: { alert, currentPrice, title, body },
  }));
}

/**
 * Request notification permission.
 * Returns 'granted', 'denied', or 'default'.
 */
export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
