/**
 * Lightweight copy-to-clipboard helper with a shared toast stack.
 * Respects prefers-reduced-motion (CSS no-ops animation).
 */

const STACK_ID = 'ui-copy-toast-stack';
const DEFAULT_DURATION_MS = 2800;

function ensureStack() {
  let stack = document.getElementById(STACK_ID);
  if (stack) return stack;
  stack = document.createElement('div');
  stack.id = STACK_ID;
  stack.className = 'ui-copy-toast-stack';
  stack.setAttribute('role', 'status');
  stack.setAttribute('aria-live', 'polite');
  stack.setAttribute('aria-atomic', 'true');
  document.body.appendChild(stack);
  return stack;
}

/**
 * Show a brief toast message (bottom-center on mobile, bottom-end on desktop).
 * @param {string} message
 * @param {{ durationMs?: number }} [options]
 */
export function showCopyToast(message, { durationMs = DEFAULT_DURATION_MS } = {}) {
  if (!message || typeof document === 'undefined') return;
  const stack = ensureStack();
  const toast = document.createElement('div');
  toast.className = 'ui-copy-toast';
  toast.textContent = message;
  stack.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add('ui-copy-toast--out');
    window.setTimeout(() => toast.remove(), 220);
  }, durationMs);
}

/**
 * Copy text and show success/error toasts.
 * @param {string} text
 * @param {{ successMessage: string, errorMessage?: string }} messages
 * @returns {Promise<boolean>}
 */
export async function copyWithToast(text, { successMessage, errorMessage }) {
  if (!text) return false;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(text);
    showCopyToast(successMessage);
    return true;
  } catch {
    if (errorMessage) showCopyToast(errorMessage);
    return false;
  }
}
