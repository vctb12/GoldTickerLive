/**
 * Slim top reading-progress bar for long editorial pages (Learn hub).
 *
 * Pure progressive enhancement: the bar element is decorative (aria-hidden) so it
 * never adds screen-reader chatter, and if this module never runs the page is
 * unaffected. Width is driven by scroll fraction, updated on a passive scroll
 * listener and coalesced to one paint via requestAnimationFrame — no layout
 * thrash, no History/IntersectionObserver APIs (so it cannot raise the
 * InvalidStateError the Learn hub was previously hardened against).
 *
 * Scroll-container aware: several site pages set `html, body { height: 100% }`
 * with `body { overflow-y: auto }`, which makes <body> — not the window — the
 * actual scroller (window.scrollY stays 0). We resolve whichever element really
 * overflows and read its scrollTop, and we listen in the capture phase on
 * `document` so a body-level scroll (whose event never reaches `window`) is
 * still observed.
 *
 * @param {string} [selector='.learn-reading-progress__bar'] fill element
 * @returns {() => void} teardown that removes the listeners
 */
export function initReadingProgress(selector = '.learn-reading-progress__bar') {
  const bar = document.querySelector(selector);
  if (!bar) return () => {};

  let ticking = false;

  const getScroller = () => {
    const de = document.documentElement;
    const body = document.body;
    // Whichever element actually overflows is the scroller. When html is pinned
    // to viewport height, <body> becomes the scroll container instead of the
    // document element.
    if (body && body.scrollHeight - body.clientHeight > 2 && de.scrollHeight - de.clientHeight <= 2) {
      return body;
    }
    return de;
  };

  const compute = () => {
    ticking = false;
    const s = getScroller();
    const scrollable = s.scrollHeight - s.clientHeight;
    const top = s.scrollTop || window.scrollY || 0;
    const fraction = scrollable > 0 ? Math.min(1, Math.max(0, top / scrollable)) : 0;
    bar.style.transform = `scaleX(${fraction.toFixed(4)})`;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(compute);
  };

  // Capture-phase document listener catches scrolls on any scroller (window,
  // documentElement, or body) since the scroll event does not bubble.
  document.addEventListener('scroll', onScroll, { passive: true, capture: true });
  window.addEventListener('resize', onScroll, { passive: true });
  compute();

  return () => {
    document.removeEventListener('scroll', onScroll, { capture: true });
    window.removeEventListener('resize', onScroll);
  };
}
