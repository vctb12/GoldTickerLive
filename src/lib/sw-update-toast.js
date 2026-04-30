/**
 * SW update toast
 *
 * Shows a non-blocking "Update available — refresh to apply" notification when
 * the service worker sends a SW_UPDATED message (new version activated).
 *
 * Usage:
 *   import { initSwUpdateToast } from './sw-update-toast.js';
 *   initSwUpdateToast();   // call once after SW registration
 *
 * Respects prefers-reduced-motion: the slide-in animation is suppressed.
 * Auto-dismisses after 15 seconds.
 */

const AUTO_DISMISS_MS = 15_000;

function injectStyles() {
  if (document.getElementById('sw-update-toast-style')) return;
  const style = document.createElement('style');
  style.id = 'sw-update-toast-style';
  style.textContent = `
    #sw-update-toast {
      position: fixed;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.1rem;
      background: var(--surface-primary, #fff);
      border: 1px solid var(--border-subtle, #e2e8f0);
      border-radius: var(--radius-md, 10px);
      box-shadow: var(--shadow-lg, 0 4px 24px rgba(0,0,0,0.12));
      font-size: 0.875rem;
      color: var(--text-primary, #1a1612);
      max-width: calc(100vw - 2rem);
      width: max-content;
      animation: sw-toast-in 0.25s var(--ease-out, ease-out) both;
    }
    @keyframes sw-toast-in {
      from { opacity: 0; transform: translateX(-50%) translateY(1.5rem); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
      #sw-update-toast { animation: none; }
    }
    #sw-update-toast .sw-toast-msg {
      flex: 1;
    }
    #sw-update-toast .sw-toast-refresh {
      padding: 0.35rem 0.85rem;
      background: var(--color-gold, #d4a017);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm, 6px);
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
      min-height: 36px;
    }
    #sw-update-toast .sw-toast-refresh:hover { opacity: 0.88; }
    #sw-update-toast .sw-toast-dismiss {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-secondary, #64748b);
      font-size: 1rem;
      line-height: 1;
      padding: 0.2rem;
      min-height: 36px;
      min-width: 36px;
    }
    #sw-update-toast.sw-toast-out {
      animation: sw-toast-out 0.2s var(--ease-in, ease-in) both;
    }
    @keyframes sw-toast-out {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      #sw-update-toast.sw-toast-out { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

function showToast(lang) {
  if (document.getElementById('sw-update-toast')) return; // already visible

  injectStyles();

  const isAr = lang === 'ar';
  const msgText = isAr
    ? 'تحديث متوفر — أعد تحميل الصفحة لتطبيقه'
    : 'Update available — refresh to apply';
  const refreshLabel = isAr ? 'تحديث' : 'Refresh';
  const dismissLabel = isAr ? 'إغلاق' : 'Dismiss';

  const toast = document.createElement('div');
  toast.id = 'sw-update-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const msg = document.createElement('span');
  msg.className = 'sw-toast-msg';
  msg.textContent = msgText;

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'sw-toast-refresh';
  refreshBtn.textContent = refreshLabel;
  refreshBtn.addEventListener('click', () => window.location.reload());

  const dismissBtn = document.createElement('button');
  dismissBtn.className = 'sw-toast-dismiss';
  dismissBtn.setAttribute('aria-label', dismissLabel);
  dismissBtn.textContent = '✕';
  dismissBtn.addEventListener('click', () => dismiss(toast));

  toast.appendChild(msg);
  toast.appendChild(refreshBtn);
  toast.appendChild(dismissBtn);
  document.body.appendChild(toast);

  // Auto-dismiss
  const timer = setTimeout(() => dismiss(toast), AUTO_DISMISS_MS);
  toast._dismissTimer = timer;
}

function dismiss(toast) {
  if (!toast || !toast.isConnected) return;
  clearTimeout(toast._dismissTimer);
  toast.classList.add('sw-toast-out');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
  // Fallback in case animationend doesn't fire (reduced-motion, hidden tab)
  setTimeout(() => toast.isConnected && toast.remove(), 300);
}

/**
 * Initialise the SW update toast listener.
 * Call once after registering the service worker.
 *
 * @param {string} [lang='en'] - Current UI language ('en' or 'ar').
 */
export function initSwUpdateToast(lang = 'en') {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED') {
      showToast(lang);
    }
  });
}
