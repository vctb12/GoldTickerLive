/**
 * Sitewide motion bootstrap — view transitions, scroll-driven reveals, stagger.
 * Call once per page (wired from injectNav).
 */

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
    return url.origin === location.origin && !anchor.hasAttribute('download');
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
    document.startViewTransition(() => {
      window.location.href = destination;
    });
  });
}

function initScrollDrivenClass() {
  if (prefersReducedMotion()) return;
  const cssApi = globalThis.CSS;
  if (!cssApi || typeof cssApi.supports !== 'function') return;
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
}
