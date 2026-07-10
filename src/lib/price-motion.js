/**
 * Sitewide price motion orchestration — wraps countUp with terminal effects.
 *
 * Adoption: tracker hero → karat grid → homepage → nav ticker → calculator.
 * Respects prefers-reduced-motion via countUp + CSS no-ops.
 */

import { countUp } from './count-up.js';
import { pulseFreshness } from './freshness-pulse.js';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const HERO_FRESHNESS_THROTTLE_MS = 3000;

/**
 * Animate a price cell with directional flash + optional container pulse.
 * @param {HTMLElement} el
 * @param {number} target
 * @param {object} [options] — forwarded to countUp; adds terminalClass on root
 */
export function animatePrice(el, target, options = {}) {
  if (!el || !Number.isFinite(target)) return;

  countUp(el, target, {
    flash: options.flash ?? 'auto',
    pulse: options.pulse ?? false,
    pulseTarget: options.pulseTarget,
    decimals: options.decimals,
    format: options.format,
    minDurationMs: options.minDurationMs,
    maxDurationMs: options.maxDurationMs,
    unitsPerMs: options.unitsPerMs,
  });

  if (options.terminalRoot) {
    pulseSpotTerminal(options.terminalRoot, {
      direction: options.direction,
      isLive: options.isLive,
    });
  }
}

/**
 * Apply live-terminal ambient classes on a successful tick.
 * @param {HTMLElement} root — e.g. `.tracker-hero-wrap` or `#hero-live-card`
 * @param {{ direction?: 'up'|'down'|null, isLive?: boolean }} [options]
 */
export function pulseSpotTerminal(root, { direction = null, isLive = false } = {}) {
  if (!root || prefersReducedMotion()) return;

  root.classList.toggle('spot-terminal--live', Boolean(isLive));
  if (direction === 'up' || direction === 'down') {
    root.setAttribute('data-price-flash', direction);
    const timer =
      typeof window !== 'undefined' && typeof window.setTimeout === 'function'
        ? window.setTimeout
        : setTimeout;
    timer(() => root.removeAttribute('data-price-flash'), 320);
  } else {
    root.removeAttribute('data-price-flash');
  }
}

/**
 * Hero-only freshness pill pulse — throttled to 3 s (not the global 90 s cap).
 * @param {HTMLElement} el
 * @returns {boolean}
 */
export function tickFreshnessPill(el) {
  return pulseFreshness(el, { minIntervalMs: HERO_FRESHNESS_THROTTLE_MS });
}

export { HERO_FRESHNESS_THROTTLE_MS };
