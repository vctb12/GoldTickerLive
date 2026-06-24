'use strict';

/**
 * Reusable focus trap for modal dialogs / drawers.
 *
 * Keeps keyboard focus inside an open `role="dialog"` (or drawer) and
 * restores focus to the triggering element on close — the behaviour
 * WCAG 2.4.3 (Focus Order) and dialog best practice require, and which
 * `aria-modal="true"` alone does NOT provide for keyboard users (it only
 * hints assistive tech; browsers still let Tab walk into background DOM).
 *
 * The Tab-wrapping decision is factored into the pure `resolveTrapTarget`
 * helper so it can be unit-tested without a DOM.
 */

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Visible, focusable descendants of `container`, in DOM order.
 * @param {Element} container
 * @returns {HTMLElement[]}
 */
function getFocusable(container) {
  if (!container || typeof container.querySelectorAll !== 'function') return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.offsetParent !== null && el.offsetParent !== undefined) return true;
    const doc = el.ownerDocument || (typeof document !== 'undefined' ? document : null);
    return doc ? el === doc.activeElement : false;
  });
}

/**
 * Pure core of the trap: given the focusable list, the currently focused
 * element and whether Shift is held, return the element that should
 * receive focus to keep the user inside the trap — or `null` to let Tab
 * proceed naturally.
 *
 * @param {Array} focusables   ordered focusable elements
 * @param {*} activeEl         currently focused element
 * @param {boolean} shiftKey   Shift held during Tab
 * @param {{contains:(n:any)=>boolean}} [container]  used to detect focus that
 *        has escaped the trap; falls back to membership in `focusables`
 * @returns {*} element to focus, or null
 */
function resolveTrapTarget(focusables, activeEl, shiftKey, container) {
  if (!focusables || focusables.length === 0) return null;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const inside =
    container && typeof container.contains === 'function'
      ? container.contains(activeEl)
      : focusables.indexOf(activeEl) !== -1;
  if (shiftKey && (activeEl === first || !inside)) return last;
  if (!shiftKey && (activeEl === last || !inside)) return first;
  return null;
}

/**
 * Create a focus trap bound to `container`.
 *
 * @param {Element} container
 * @param {{ initialFocus?: Element | (() => Element|null) }} [opts]
 * @returns {{ activate: () => void, deactivate: () => void, isActive: () => boolean }}
 */
function createFocusTrap(container, opts = {}) {
  let active = false;
  let previouslyFocused = null;

  function onKeydown(e) {
    if (e.key !== 'Tab' || !active) return;
    const focusables = getFocusable(container);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const doc = container.ownerDocument || document;
    const target = resolveTrapTarget(focusables, doc.activeElement, e.shiftKey, container);
    if (target) {
      e.preventDefault();
      target.focus();
    }
  }

  function focusInitial() {
    const doc = container.ownerDocument || document;
    if (container.contains(doc.activeElement)) return;
    const raw = typeof opts.initialFocus === 'function' ? opts.initialFocus() : opts.initialFocus;
    const target = raw || getFocusable(container)[0] || container;
    if (target === container && !container.hasAttribute('tabindex')) {
      container.setAttribute('tabindex', '-1');
    }
    const focus = () => target && typeof target.focus === 'function' && target.focus();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(focus);
    else focus();
  }

  return {
    activate() {
      if (!active) {
        active = true;
        const doc = container.ownerDocument || document;
        previouslyFocused = doc.activeElement && doc.activeElement.focus ? doc.activeElement : null;
        container.addEventListener('keydown', onKeydown);
      }
      // (Re)assert focus inside the trap — also covers dialogs that
      // re-render their body while open.
      focusInitial();
    },
    deactivate() {
      if (!active) return;
      active = false;
      container.removeEventListener('keydown', onKeydown);
      if (previouslyFocused && previouslyFocused.isConnected !== false) {
        try {
          previouslyFocused.focus();
        } catch {
          /* element no longer focusable — ignore */
        }
      }
      previouslyFocused = null;
    },
    isActive() {
      return active;
    },
  };
}

export { FOCUSABLE_SELECTOR, getFocusable, resolveTrapTarget, createFocusTrap };
