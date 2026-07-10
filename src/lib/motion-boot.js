/**
 * Sitewide motion bootstrap — view transitions, scroll-driven reveals, stagger.
 * Call once per page (wired from injectNav).
 */
import { observeReveal } from './reveal.js';

let booted = false;
let viewTransitionsBound = false;
let devBeaconInstalled = false;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Local-development host detection (mirrors the analytics debug gate). Used only
// to arm the dev-only rejection beacon below; it never returns true in production.
const isDevHost = () => {
  try {
    const host = typeof location !== 'undefined' ? location.hostname || '' : '';
    return (
      host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')
    );
  } catch {
    return false;
  }
};

function isSameOriginNavLink(anchor) {
  if (!anchor || anchor.tagName !== 'A') return false;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:'))
    return false;
  try {
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || anchor.hasAttribute('download')) return false;
    // Same-document navigation (only the hash differs) is an in-page scroll, not a
    // cross-document load. Running a cross-document view transition for it is
    // pointless and can leave reveal-animated content stuck mid-fade — let the
    // browser handle it natively (matches the early-return for `#`-only hrefs).
    if (url.pathname === location.pathname && url.search === location.search) return false;
    return true;
  } catch {
    return false;
  }
}

function initViewTransitions() {
  // Idempotent: never bind the document click listener twice. A second binding
  // would start two transitions per click, and the second `startViewTransition`
  // call skips the first — guaranteeing an AbortError rejection every time.
  if (viewTransitionsBound) return;
  if (prefersReducedMotion()) return;
  if (typeof document.startViewTransition !== 'function') return;
  viewTransitionsBound = true;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;

    const anchor = e.target.closest('a[href]');
    if (!isSameOriginNavLink(anchor)) return;
    if (anchor.target && anchor.target !== '_self') return;

    // Re-check at click time: the reduced-motion preference can flip after boot.
    // Short-circuit BEFORE preventDefault so no transition is ever created and
    // the browser performs a normal navigation.
    if (prefersReducedMotion()) return;

    e.preventDefault();
    const destination = anchor.href;

    let transition;
    try {
      transition = document.startViewTransition(() => {
        window.location.href = destination;
      });
    } catch {
      // `startViewTransition` can throw synchronously (e.g. mid-unload). We have
      // already called preventDefault(), so fall back to a plain navigation
      // rather than leaving the click dead.
      window.location.href = destination;
      return;
    }

    // Navigating away unloads this document, which aborts the pending transition
    // and rejects its promises with `InvalidStateError: Transition was aborted
    // because of invalid state`. That abort is expected — swallow every promise
    // path (each may be undefined on older engines, and `transition` itself may
    // be undefined) so none surfaces as an uncaught promise rejection.
    const swallow = () => {};
    if (transition) {
      transition.ready?.catch(swallow);
      transition.finished?.catch(swallow);
      transition.updateCallbackDone?.catch(swallow);
    }
  });
}

// Dev-only diagnostic: surface any unhandled promise rejection that is NOT the
// expected view-transition abort, so console-stability regressions are caught
// during local development. Gated on a dev host — it never installs in
// production (the site-wide error-reporter owns production rejection signals).
function installDevRejectionBeacon() {
  if (devBeaconInstalled || typeof window === 'undefined' || !isDevHost()) return;
  devBeaconInstalled = true;
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event && event.reason;
    const name = (reason && reason.name) || '';
    if (name === 'InvalidStateError' || name === 'AbortError') return;
    console.warn('[motion-boot] unhandled promise rejection (dev only):', name || reason);
  });
}

function initScrollDrivenClass() {
  if (prefersReducedMotion()) return;
  const cssApi = globalThis.CSS;
  if (typeof cssApi === 'undefined' || typeof cssApi.supports !== 'function') return;
  if (!cssApi.supports('animation-timeline: view()')) return;
  document.documentElement.classList.add('motion-scroll-driven');
}

function initStaggerScan() {
  const groups = document.querySelectorAll('[data-stagger]');
  for (const group of groups) {
    const children = group.children;
    for (let i = 0; i < children.length; i++) {
      children[i].style.setProperty('--stagger-index', String(i));
    }
  }
}

/**
 * Initialize sitewide motion enhancements (idempotent).
 */
export function initMotionBoot() {
  if (booted || typeof document === 'undefined') return;
  booted = true;

  initScrollDrivenClass();
  initStaggerScan();
  initViewTransitions();
  installDevRejectionBeacon();

  // Sitewide reveal-on-scroll: animate any [data-reveal] element on every page
  // (idempotent — already-observed nodes are skipped). Reduced-motion is a no-op
  // via the reveal CSS, so this is safe to run unconditionally.
  try {
    observeReveal();
  } catch {
    /* reveal is a progressive enhancement; never block boot */
  }
}
