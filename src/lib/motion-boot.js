/**
* Sitewide motion bootstrap - view transitions, scroll-driven reveals, stagger.
* Call once per page (wired from injectNav).
*/
import { observeReveal } from './reveal.js';

let booted = false;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
* True when `url` targets the exact same document as the current page (same
* origin, path, and query) and only differs by hash - i.e. an in-page anchor
* jump such as `/learn.html#karats` while already on `/learn.html`.
*
* These must NEVER be wrapped in `document.startViewTransition()`: that API
* only supports same-document DOM-mutation transitions, not real
* navigations. Wrapping a hash-only `location.href` assignment in it can
* throw "InvalidStateError: Transition was aborted because of invalid
* state" and can leave elements stuck mid-fade under the abandoned
* transition pseudo-elements. Same-document anchors are left to native
* browser handling (instant/smooth scroll per CSS `scroll-behavior`).
*/
export function isSameDocumentHashLink(url) {
  if (typeof location === 'undefined') return false;
  return (
    url.origin === location.origin &&
    url.pathname === location.pathname &&
    url.search === location.search &&
    url.hash !== ''
    );
}

export function isSameOriginNavLink(anchor) {
  if (!anchor || anchor.tagName !== 'A') return false;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:'))
    return false;
  if (anchor.hasAttribute('download')) return false;
  try {
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin) return false;
    if (isSameDocumentHashLink(url)) return false;
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
  try {
    const transition = document.startViewTransition(() => {
      window.location.href = destination;
    });
    transition?.ready?.catch(() => {});
    transition?.finished?.catch(() => {});
    transition?.updateCallbackDone?.catch(() => {});
  } catch {
    window.location.href = destination;
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

  try {
    observeReveal();
  } catch {
    /* reveal is a progressive enhancement; never block boot */
  }
}

