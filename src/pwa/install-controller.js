/**
 * pwa/install-controller.js — reusable, DI'd add-to-home-screen (A2HS) controller (Phase 42).
 *
 * A shared, framework-agnostic version of the inline `beforeinstallprompt` handling: captures the
 * deferred install event, tracks installed/standalone state, and exposes a clean surface any page can
 * mount an install button on — without each page re-implementing the event dance. The `window` is
 * injected so it is fully unit-testable (and SSR/no-DOM safe). It does NOT touch the service worker.
 *
 * Usage:
 *   const install = createInstallController();
 *   install.init();
 *   install.subscribe((state) => renderButton(state.canInstall));
 *   button.onclick = () => install.promptInstall();
 */

/** @returns {Window | undefined} */
function defaultWindow() {
  return typeof window === 'undefined' ? undefined : window;
}

/**
 * @param {{ win?: any }} [options]
 */
export function createInstallController(options = {}) {
  const win = options.win ?? defaultWindow();
  let deferredPrompt = null;
  let installed = false;
  const listeners = new Set();

  function isStandalone() {
    if (!win) return false;
    const mm = typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)');
    // iOS Safari exposes navigator.standalone instead of the display-mode media query.
    return Boolean((mm && mm.matches) || win.navigator?.standalone === true);
  }

  function isInstalled() {
    return installed || isStandalone();
  }

  function canInstall() {
    return Boolean(deferredPrompt) && !isInstalled();
  }

  function getState() {
    return { canInstall: canInstall(), installed: isInstalled() };
  }

  function notify() {
    const state = getState();
    for (const fn of listeners) fn(state);
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function init() {
    if (!win || typeof win.addEventListener !== 'function') return;
    win.addEventListener('beforeinstallprompt', (event) => {
      // Suppress the mini-infobar so the app controls when/where to offer install.
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      deferredPrompt = event;
      notify();
    });
    win.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      installed = true;
      notify();
    });
  }

  /**
   * Trigger the browser install prompt.
   * @returns {Promise<{ outcome: 'accepted'|'dismissed'|'unavailable' }>}
   */
  async function promptInstall() {
    if (!deferredPrompt) return { outcome: 'unavailable' };
    const event = deferredPrompt;
    deferredPrompt = null; // a deferred prompt can only be used once
    event.prompt();
    const choice = (await event.userChoice) || {};
    notify();
    return { outcome: choice.outcome === 'accepted' ? 'accepted' : 'dismissed' };
  }

  return { init, canInstall, isInstalled, promptInstall, getState, subscribe };
}
