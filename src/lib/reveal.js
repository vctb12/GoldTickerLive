/**
 * Shared IntersectionObserver for section reveal-on-scroll.
 *
 * Any element with `data-reveal` attribute is observed once; when it enters the
 * viewport the `.is-in-view` class is added and the element is unobserved.
 * CSS (see `styles/global.css` under "Motion Primitives") fades + slides it in,
 * with a `prefers-reduced-motion: reduce` no-op.
 *
 * Usage:
 *   import { observeReveal } from '/src/lib/reveal.js';
 *   observeReveal();            // scans whole document
 *   observeReveal(rootElement); // scans a subtree only
 *
 * One observer is shared across callers so repeated imports are cheap.
 */

let sharedObserver = null;

function getObserver() {
  if (sharedObserver || typeof IntersectionObserver === 'undefined') return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in-view');
          sharedObserver.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.15 }
  );
  return sharedObserver;
}

/** Start observing every `[data-reveal]` element under `root` (defaults to
 *  `document`). Safe to call multiple times — already-observed nodes are
 *  skipped via `WeakSet`. */
const seen = new WeakSet();

export function observeReveal(root) {
  if (typeof document === 'undefined') return;
  const scope = root || document;
  const nodes = scope.querySelectorAll('[data-reveal]');
  const obs = getObserver();
  if (!obs) {
    // No IntersectionObserver support — reveal immediately.
    for (const node of nodes) node.classList.add('is-in-view');
    return;
  }
  for (const node of nodes) {
    if (seen.has(node)) continue;
    seen.add(node);
    obs.observe(node);
  }
}

/**
 * Dwell-based visibility observer built on the same IntersectionObserver
 * primitive as `observeReveal`. Invokes `onDwell(node)` once — the first time a
 * node stays at least `ratio` visible for `dwellMs` continuous milliseconds. If
 * the node dips below `ratio` before the timer fires, the dwell resets, so this
 * measures genuine on-screen reading time rather than a momentary scroll-past.
 *
 * The learn hub uses this to count a guide as truly *read* (not merely clicked).
 * This is a behavioural signal, not motion, so it intentionally runs regardless
 * of `prefers-reduced-motion` (no animation is added by observing).
 *
 * Returns a disconnect function. A no-op (returning a no-op) when
 * IntersectionObserver is unavailable or no valid nodes/callback are given —
 * click + hashchange marking still covers those cases.
 *
 * @param {Iterable<Element>} nodes
 * @param {{ ratio?: number, dwellMs?: number, onDwell: (node: Element) => void }} options
 * @returns {() => void}
 */
export function observeDwell(nodes, { ratio = 0.6, dwellMs = 3000, onDwell } = {}) {
  const list = nodes ? Array.from(nodes) : [];
  if (
    typeof IntersectionObserver === 'undefined' ||
    typeof onDwell !== 'function' ||
    !list.length
  ) {
    return () => {};
  }

  const timers = new Map();
  const done = new WeakSet();

  const clear = (node) => {
    const timer = timers.get(node);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.delete(node);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const node = entry.target;
        if (done.has(node)) {
          observer.unobserve(node);
          continue;
        }
        if (entry.isIntersecting && entry.intersectionRatio >= ratio) {
          if (timers.has(node)) continue; // already counting down
          timers.set(
            node,
            setTimeout(() => {
              timers.delete(node);
              done.add(node);
              observer.unobserve(node);
              onDwell(node);
            }, dwellMs)
          );
        } else {
          clear(node); // left the ≥ratio band — reset the dwell
        }
      }
    },
    // Fire on entry/exit of the ratio band (and the 0/1 extremes) so a partial
    // scroll that never reaches `ratio` never starts the timer.
    { threshold: [0, ratio, 1] }
  );

  for (const node of list) observer.observe(node);

  return () => {
    for (const node of list) clear(node);
    observer.disconnect();
  };
}

/** Auto-run when the document is ready. Safe in ES-module context. */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => observeReveal());
  } else {
    observeReveal();
  }
}
