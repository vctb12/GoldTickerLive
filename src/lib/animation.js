/**
 * Liveness substrate — pure animation logic + the event contract that lets the
 * visual layer make the gold price *visibly* move when fresh data arrives.
 *
 * This module is intentionally free of styling, CSS, and DOM-paint concerns.
 * It computes tween frames and publishes events; the CALLER owns the element
 * and writes the value. The visual layer (hero, karat grid, tracker, ticker)
 * consumes the events documented below and decides how to render them.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EVENT CONTRACT  (read this before building the visual layer)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Single shared target: the exported `liveness` emitter (a tiny EventTarget-like
 * bus). Listen with the familiar DOM ergonomics:
 *
 *     import { liveness, LIVENESS_EVENTS } from '/src/lib/animation.js';
 *     const off = liveness.on(LIVENESS_EVENTS.GOLD_UPDATE, (e) => {
 *       const { previous, current, direction, freshness, timestamp } = e.detail;
 *       // direction is 'up' | 'down' | 'unchanged'
 *     });
 *     // later: off();   // or liveness.removeEventListener(type, handler)
 *
 * The bus is a per-page module singleton (ES-module caching), so every component
 * on a page shares the same instance. It is NOT cross-tab; use the storage event
 * for that (out of scope here).
 *
 * Events (name → detail shape → who emits it):
 *
 *  • 'goldprice:update'  (LIVENESS_EVENTS.GOLD_UPDATE) — emitted by lib/api.js
 *      whenever a gold spot value resolves (live, cached, or fallback path).
 *      detail = {
 *        previous:  number|null,    // last known spot, null on first arrival
 *        current:   number,         // newly arrived spot (XAU/USD per oz)
 *        direction: 'up'|'down'|'unchanged',
 *        freshness: 'live'|'cached'|'delayed'|'estimated'|'fallback'|'stale'|'closed'|'unavailable',
 *        timestamp: string,         // ISO-8601 of the data, not of dispatch
 *      }
 *
 *  • 'fx:update'  (LIVENESS_EVENTS.FX_UPDATE) — emitted by lib/api.js when FX
 *      rates resolve. `previous`/`current` may be a rates map (whole refresh) or
 *      a single numeric rate (UI tracking one currency).
 *      detail = { previous, current, direction, freshness, timestamp }
 *
 *  • 'freshness:change'  (LIVENESS_EVENTS.FRESHNESS_CHANGE) — emitted by lib/api.js
 *      only when the freshness state transitions between fetches.
 *      detail = {
 *        previous: string|null,     // prior freshness key
 *        current:  string,          // new freshness key
 *        kind:     'gold'|'fx',
 *      }
 *
 *  • 'tracker:change'  (LIVENESS_EVENTS.TRACKER_CHANGE) — emitted by
 *      tracker/state.js SYNCHRONOUSLY when the user changes a control
 *      (mode/currency/karat/unit/range), so the UI can repaint optimistically
 *      before any async data settles.
 *      detail = {
 *        field:      'mode'|'currency'|'karat'|'unit'|'range',
 *        previous:   string,
 *        current:    string,
 *        optimistic: boolean,
 *        timestamp:  string,
 *      }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TRUST RULE  (non-negotiable — freshness honesty system)
 * ─────────────────────────────────────────────────────────────────────────────
 * A directional / flash / count-up animation is a sensory claim that "the price
 * just ticked live." That claim is ONLY valid for a genuine LIVE update. For any
 * non-live state (cached, delayed, estimated, fallback, stale, closed,
 * unavailable) the emitted `direction` is forced to 'unchanged' so the UI cannot
 * flash a cached value as if it were a live tick. The real freshness is always
 * carried in `detail.freshness` so the UI can label honestly and refuse to
 * animate. Never present stored or derived data as a live movement.
 */

/* ───────────────────────────── Freshness vocabulary ────────────────────────── */

/**
 * The canonical freshness keys understood by this substrate. Mirrors the
 * vocabulary owned by `freshness-policy.js` / `live-status.js` / `freshness.js`.
 * Only `'live'` permits a directional animation (see TRUST RULE).
 * @type {readonly string[]}
 */
export const FRESHNESS_STATES = Object.freeze([
  'live',
  'cached',
  'delayed',
  'estimated',
  'fallback',
  'stale',
  'closed',
  'unavailable',
]);

/** The only freshness state for which a live-tick animation may fire. */
export const LIVE_FRESHNESS = 'live';

/**
 * Reduce a freshness input (string key, or an object exposing `.state` / `.key`)
 * to a plain freshness key string. Unknown / missing inputs resolve to the
 * safest non-live default, `'unavailable'`.
 * @param {string|{state?: string, key?: string}|null|undefined} freshness
 * @returns {string}
 */
export function normalizeFreshnessKey(freshness) {
  if (typeof freshness === 'string' && freshness) return freshness;
  if (freshness && typeof freshness === 'object') {
    return freshness.state || freshness.key || 'unavailable';
  }
  return 'unavailable';
}

/**
 * Whether a freshness input represents a genuine LIVE tick. This is the single
 * gate behind the trust rule — direction/flash signals are valid only when this
 * returns `true`.
 * @param {string|{state?: string, key?: string}|null|undefined} freshness
 * @returns {boolean}
 */
export function isLiveFreshness(freshness) {
  return normalizeFreshnessKey(freshness) === LIVE_FRESHNESS;
}

/* ──────────────────────────── Direction detection ──────────────────────────── */

/**
 * Classify a price transition as `'up'`, `'down'`, or `'unchanged'`.
 *
 * Non-finite inputs (NaN, null, undefined, Infinity) resolve to `'unchanged'`
 * as a safe neutral default — never default to `'up'`. An optional `epsilon`
 * lets callers treat sub-threshold moves as unchanged (default `0` = exact).
 *
 * NOTE: this is the raw mathematical direction. The trust rule is applied
 * separately by the emit helpers — a real up-move on a cached value is still
 * published as `'unchanged'`.
 *
 * @param {number} oldValue
 * @param {number} newValue
 * @param {number} [epsilon=0]  Moves with |delta| ≤ epsilon are `'unchanged'`.
 * @returns {'up'|'down'|'unchanged'}
 */
export function getPriceDirection(oldValue, newValue, epsilon = 0) {
  // Guard null/undefined explicitly: `Number(null)` is 0, which would otherwise
  // read a first-arrival (previous == null) as a real move.
  if (oldValue == null || newValue == null) return 'unchanged';
  const a = Number(oldValue);
  const b = Number(newValue);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 'unchanged';
  const delta = b - a;
  if (Math.abs(delta) <= Math.max(0, epsilon)) return 'unchanged';
  return delta > 0 ? 'up' : 'down';
}

/* ───────────────────────────────── Easing ─────────────────────────────────── */

/**
 * Named easing functions. Each maps progress `t` in [0,1] to eased [0,1].
 * @type {Record<string, (t: number) => number>}
 */
export const EASINGS = Object.freeze({
  linear: (t) => t,
  easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
});

function resolveEasing(easing) {
  if (typeof easing === 'function') return easing;
  return EASINGS[easing] || EASINGS.easeOutCubic;
}

/* ─────────────────────── Environment-agnostic frame timing ─────────────────── */

const FALLBACK_FRAME_MS = 16;

/** High-resolution clock with a Date fallback (Node test environments). */
function now() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/**
 * Schedule a frame callback. Uses `requestAnimationFrame` in the browser and
 * falls back to `setTimeout` (~60fps) where rAF is unavailable (Node tests).
 * Returns an opaque token for {@link cancelFrame}.
 */
function scheduleFrame(cb) {
  if (typeof requestAnimationFrame === 'function') {
    return { kind: 'raf', id: requestAnimationFrame(cb) };
  }
  return { kind: 'timeout', id: setTimeout(() => cb(now()), FALLBACK_FRAME_MS) };
}

function cancelFrame(token) {
  if (!token) return;
  if (token.kind === 'raf' && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(token.id);
  } else if (token.kind === 'timeout') {
    clearTimeout(token.id);
  }
}

/** Whether the user has asked for reduced motion. Re-read on every call. */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches === true
  );
}

let _animSeq = 0;

/**
 * @typedef {Object} AnimationHandle
 * @property {number}  id         Unique animation id (also usable as a handle).
 * @property {boolean} cancelled  Whether the animation has been cancelled.
 * @property {boolean} [finished] Set when the animation completed synchronously.
 * @property {() => void} cancel  Stop the animation; no further callbacks fire.
 */

/**
 * Tween a number from `from` to `to`, invoking `onUpdate(currentValue)` once per
 * frame and `onComplete(finalValue)` when finished. The caller owns the element
 * and is responsible for writing the value — this utility only computes frames.
 *
 * Behaviour:
 *  - Respects `prefers-reduced-motion: reduce`: jumps straight to `to`
 *    (one `onUpdate(to)` then `onComplete(to)`) — no animation.
 *  - Zero / negative duration, or `from === to`, also jump straight to `to`.
 *  - A non-finite `to` is a no-op (returns an already-cancelled handle).
 *  - A non-finite `from` is treated as starting at `to` (jump).
 *  - Cancellable: call `handle.cancel()` so rapid successive updates don't stack.
 *
 * @param {Object} opts
 * @param {number} opts.from
 * @param {number} opts.to
 * @param {number} [opts.duration=600]            Total tween duration in ms.
 * @param {((t:number)=>number)|string} [opts.easing='easeOutCubic']  Fn or {@link EASINGS} key.
 * @param {number|null} [opts.decimals=null]      Round emitted values to N decimals (null = raw).
 * @param {(value:number)=>void} [opts.onUpdate]  Called each frame with the current value.
 * @param {(value:number)=>void} [opts.onComplete] Called once with the final value.
 * @returns {AnimationHandle}
 */
export function animateValue({
  from,
  to,
  duration = 600,
  easing = 'easeOutCubic',
  decimals = null,
  onUpdate,
  onComplete,
} = {}) {
  const id = ++_animSeq;
  const emit = typeof onUpdate === 'function' ? onUpdate : () => {};
  const complete = typeof onComplete === 'function' ? onComplete : () => {};

  const hasDecimals = Number.isInteger(decimals) && decimals >= 0;
  const round = (v) => {
    if (!hasDecimals) return v;
    const p = Math.pow(10, decimals);
    return Math.round(v * p) / p;
  };

  const end = Number(to);
  // Nothing sensible to animate toward — no-op.
  if (!Number.isFinite(end)) {
    return { id, cancelled: true, cancel() {} };
  }

  const startRaw = Number(from);
  const start = Number.isFinite(startRaw) ? startRaw : end;
  const totalMs = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const ease = resolveEasing(easing);

  // Reduced motion / zero distance / zero duration → jump straight to `to`.
  if (prefersReducedMotion() || totalMs === 0 || start === end) {
    const final = round(end);
    emit(final);
    complete(final);
    return { id, cancelled: false, finished: true, cancel() {} };
  }

  const delta = end - start;
  const t0 = now();
  let frame = null;
  let cancelled = false;

  const step = (ts) => {
    if (cancelled) return;
    const elapsed = (Number.isFinite(ts) ? ts : now()) - t0;
    const p = totalMs > 0 ? Math.min(1, elapsed / totalMs) : 1;
    if (p >= 1) {
      const final = round(end);
      emit(final);
      complete(final);
      return;
    }
    emit(round(start + delta * ease(p)));
    frame = scheduleFrame(step);
  };

  frame = scheduleFrame(step);

  return {
    id,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      cancelFrame(frame);
    },
  };
}

/* ──────────────────────────── Shared event bus ─────────────────────────────── */

/** Event names published on the {@link liveness} bus. */
export const LIVENESS_EVENTS = Object.freeze({
  GOLD_UPDATE: 'goldprice:update',
  FX_UPDATE: 'fx:update',
  FRESHNESS_CHANGE: 'freshness:change',
  TRACKER_CHANGE: 'tracker:change',
});

/**
 * A tiny, DOM-compatible event bus. Implements the subset of `EventTarget`
 * the substrate needs (`addEventListener` / `removeEventListener` /
 * `dispatchEvent`) plus `on`/`off` conveniences, without depending on the
 * `EventTarget` global (not whitelisted for the browser bundle / not present
 * in every Node version). A listener that throws cannot break the others.
 */
class LivenessEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  addEventListener(type, handler) {
    if (typeof handler !== 'function') return;
    let set = this._listeners.get(type);
    if (!set) {
      set = new Set();
      this._listeners.set(type, set);
    }
    set.add(handler);
  }

  removeEventListener(type, handler) {
    this._listeners.get(type)?.delete(handler);
  }

  /**
   * Dispatch an event-like object (`{ type, detail }` or a `CustomEvent`).
   * @returns {boolean} always `true` (mirrors EventTarget when not cancelled).
   */
  dispatchEvent(event) {
    const set = this._listeners.get(event?.type);
    if (!set || set.size === 0) return true;
    for (const handler of [...set]) {
      try {
        handler(event);
      } catch (err) {
        if (typeof console !== 'undefined') {
          console.error('liveness listener error', err);
        }
      }
    }
    return true;
  }

  /**
   * Convenience subscribe that returns an unsubscribe function.
   * @returns {() => void}
   */
  on(type, handler) {
    this.addEventListener(type, handler);
    return () => this.removeEventListener(type, handler);
  }

  off(type, handler) {
    this.removeEventListener(type, handler);
  }
}

/** The single shared liveness event target for the current page. */
export const liveness = new LivenessEmitter();

/** Build a CustomEvent when available, else a plain `{ type, detail }`. */
function makeEvent(type, detail) {
  if (typeof CustomEvent === 'function') {
    return new CustomEvent(type, { detail });
  }
  return { type, detail };
}

function isoNow() {
  try {
    return new Date().toISOString();
  } catch {
    return null;
  }
}

function numOrNull(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/* ─────────────────────────────── Emit helpers ──────────────────────────────── */

/**
 * Publish a gold price update. The trust rule is enforced here: `direction` is
 * computed only for a genuine LIVE freshness state, otherwise it is forced to
 * `'unchanged'` so the UI cannot flash non-live data as a live tick.
 *
 * @param {Object} payload
 * @param {number|null} [payload.previous=null]
 * @param {number} payload.current
 * @param {string|{state?:string,key?:string}} [payload.freshness='unavailable']
 * @param {string|null} [payload.timestamp=null]  ISO-8601 of the data.
 * @param {LivenessEmitter|EventTarget} [target=liveness]
 * @returns {{previous:number|null,current:number|null,direction:string,freshness:string,timestamp:string|null}}
 *   The dispatched detail (handy for synchronous callers and tests).
 */
export function emitGoldPriceUpdate(
  { previous = null, current, freshness = 'unavailable', timestamp = null } = {},
  target = liveness
) {
  const key = normalizeFreshnessKey(freshness);
  const direction = isLiveFreshness(key) ? getPriceDirection(previous, current) : 'unchanged';
  const detail = {
    previous: numOrNull(previous),
    current: numOrNull(current),
    direction,
    freshness: key,
    timestamp: timestamp ?? isoNow(),
  };
  target.dispatchEvent(makeEvent(LIVENESS_EVENTS.GOLD_UPDATE, detail));
  return detail;
}

/**
 * Publish an FX update. `previous`/`current` may be a rates map (whole refresh)
 * or a single numeric rate. Direction is only meaningful — and only computed —
 * when both are finite numbers AND the freshness is live; otherwise `'unchanged'`.
 *
 * @param {Object} payload
 * @param {number|object|null} [payload.previous=null]
 * @param {number|object|null} [payload.current=null]
 * @param {string|{state?:string,key?:string}} [payload.freshness='unavailable']
 * @param {string|null} [payload.timestamp=null]
 * @param {LivenessEmitter|EventTarget} [target=liveness]
 * @returns {{previous:*,current:*,direction:string,freshness:string,timestamp:string|null}}
 */
export function emitFxUpdate(
  { previous = null, current = null, freshness = 'unavailable', timestamp = null } = {},
  target = liveness
) {
  const key = normalizeFreshnessKey(freshness);
  const numeric = Number.isFinite(Number(previous)) && Number.isFinite(Number(current));
  const direction =
    isLiveFreshness(key) && numeric ? getPriceDirection(previous, current) : 'unchanged';
  const detail = { previous, current, direction, freshness: key, timestamp: timestamp ?? isoNow() };
  target.dispatchEvent(makeEvent(LIVENESS_EVENTS.FX_UPDATE, detail));
  return detail;
}

/**
 * Publish a freshness-state transition (e.g. Live → Cached). Callers should only
 * invoke this when the state has actually changed.
 *
 * @param {Object} payload
 * @param {string|{state?:string,key?:string}|null} [payload.previous=null]
 * @param {string|{state?:string,key?:string}|null} [payload.current=null]
 * @param {'gold'|'fx'} [payload.kind='gold']
 * @param {LivenessEmitter|EventTarget} [target=liveness]
 * @returns {{previous:string|null,current:string|null,kind:string}}
 */
export function emitFreshnessChange(
  { previous = null, current = null, kind = 'gold' } = {},
  target = liveness
) {
  const detail = {
    previous: previous == null ? null : normalizeFreshnessKey(previous),
    current: current == null ? null : normalizeFreshnessKey(current),
    kind,
  };
  target.dispatchEvent(makeEvent(LIVENESS_EVENTS.FRESHNESS_CHANGE, detail));
  return detail;
}

/**
 * Publish an optimistic tracker control change. Dispatch is synchronous so the
 * UI can repaint before async data settles.
 *
 * @param {Object} payload
 * @param {string} payload.field            One of mode|currency|karat|unit|range.
 * @param {string} [payload.previous=null]
 * @param {string} [payload.current=null]
 * @param {boolean} [payload.optimistic=true]
 * @param {string|null} [payload.timestamp=null]
 * @param {LivenessEmitter|EventTarget} [target=liveness]
 * @returns {{field:string,previous:*,current:*,optimistic:boolean,timestamp:string|null}}
 */
export function emitTrackerChange(
  { field, previous = null, current = null, optimistic = true, timestamp = null } = {},
  target = liveness
) {
  const detail = { field, previous, current, optimistic, timestamp: timestamp ?? isoNow() };
  target.dispatchEvent(makeEvent(LIVENESS_EVENTS.TRACKER_CHANGE, detail));
  return detail;
}
