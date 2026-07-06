/**
 * Sitewide motion bootstrap — view transitions, scroll-driven reveals, stagger.
 * Call once per page (wired from injectNav).
 */
import { observeReveal } from './reveal.js';

let booted = false;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  if (prefersReducedMotion()) return;
  if (typeof document.startViewTransition !== 'function') return;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;

    const anchor = e.target.closest('a[href]');
    if (!isSameOriginNavLink(anchor)) return;
    if (anchor.target && anchor.target !== '_self') return;

    e.preventDefault();
    const destination = anchor.href;
    const transition = document.startViewTransition(() => {
      window.location.href = destination;
    });
    // Navigating away unloads this document, which aborts the pending transition
    // and rejects its promises with `InvalidStateError: Transition was aborted
    // because of invalid state`. That abort is expected — swallow it so it never
    // surfaces as an uncaught promise rejection in the console.
    if (transition) {
      transition.ready?.catch(() => {});
      transition.finished?.catch(() => {});
      transition.updateCallbackDone?.catch(() => {});
    }
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

  // Sitewide reveal-on-scroll: animate any [data-reveal] element on every page
  // (idempotent — already-observed nodes are skipped). Reduced-motion is a no-op
  // via the reveal CSS, so this is safe to run unconditionally.
  try {
    observeReveal();
  } catch {
    /* reveal is a progressive enhancement; never block boot */
  }
}
