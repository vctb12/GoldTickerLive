import { formatTimestampShort } from './formatter.js';

/**
 * Gold-market timing constants.
 *
 * - `OPEN_SUN_MINUTES`: minutes past midnight UTC when the market re-opens on Sunday.
 * - `CLOSE_FRI_MINUTES`: minutes past midnight UTC when the market closes on Friday.
 * - `STALE_AFTER_MS`: age in ms after which a price is considered stale (12 minutes).
 *   The gold-price-fetch workflow runs every 6 minutes while markets are open.
 *   A 12-minute threshold tolerates one missed cron tick before the "Live"
 *   pill flips to "stale", preventing the UI from claiming "Live" data that
 *   is actually two cron windows old.
 */
export const GOLD_MARKET = {
  OPEN_SUN_MINUTES: 22 * 60,
  CLOSE_FRI_MINUTES: 21 * 60,
  STALE_AFTER_MS: 12 * 60 * 1000,
};

/**
 * FX-freshness constants.
 *
 * `open.er-api.com` free tier updates FX rates approximately once per 24 hours.
 * A rate older than `FX_STALE_AFTER_MS` (26 hours — one full day plus a margin)
 * is considered stale and should be visibly labelled as a cached value.
 */
export const FX_MARKET = {
  FX_STALE_AFTER_MS: 26 * 60 * 60 * 1000,
};

/** Sentinel ageMs value for an unavailable / unresolvable timestamp. */
const UNAVAILABLE_AGE_MS = Number.POSITIVE_INFINITY;

function toDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Determine whether the global gold market (LBMA / London Fix schedule) is
 * currently open. The market is closed from 21:00 UTC Friday to 22:00 UTC Sunday.
 *
 * @param {Date} [now=new Date()]  Reference timestamp (defaults to current time).
 * @returns {{ isOpen: boolean, key: 'open'|'closed' }}
 */
export function getMarketStatus(now = new Date()) {
  const date = toDate(now) || new Date();
  const utcDay = date.getUTCDay();
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();

  const isOpen = !(
    utcDay === 6 ||
    (utcDay === 5 && utcMinutes >= GOLD_MARKET.CLOSE_FRI_MINUTES) ||
    (utcDay === 0 && utcMinutes < GOLD_MARKET.OPEN_SUN_MINUTES)
  );

  return { isOpen, key: isOpen ? 'open' : 'closed' };
}

/**
 * Return the age of `updatedAt` in milliseconds relative to `now`.
 * Returns `Number.POSITIVE_INFINITY` when `updatedAt` is absent or invalid.
 *
 * @param {string|Date|number|null} updatedAt  Timestamp of the last update.
 * @param {number}                 [now]       Reference epoch ms (default: `Date.now()`).
 * @returns {number}
 */
export function getAgeMs(updatedAt, now = Date.now()) {
  const date = toDate(updatedAt);
  if (!date) return UNAVAILABLE_AGE_MS;
  return Math.max(0, now - date.getTime());
}

/**
 * Format `ageMs` as a human-readable relative-time string using
 * `Intl.RelativeTimeFormat` (e.g. `"2 min. ago"`, `"منذ دقيقتين"`).
 * Returns `'—'` for non-finite values.
 *
 * @param {number}      ageMs  Age in milliseconds (must be ≥ 0).
 * @param {'en'|'ar'} [lang]   Display language (default `'en'`).
 * @returns {string}
 */
export function formatRelativeAge(ageMs, lang = 'en') {
  if (!Number.isFinite(ageMs)) return '—';

  const locale = lang === 'ar' ? 'ar-AE' : 'en';
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: 'short',
  });

  const totalSeconds = Math.max(0, Math.round(ageMs / 1000));
  if (totalSeconds < 60) return formatter.format(-totalSeconds, 'second');

  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) return formatter.format(-totalMinutes, 'minute');

  const totalHours = Math.round(totalMinutes / 60);
  if (totalHours < 24) return formatter.format(-totalHours, 'hour');

  const totalDays = Math.round(totalHours / 24);
  return formatter.format(-totalDays, 'day');
}

/**
 * Derive the freshness key and human-readable age text for a price timestamp.
 *
 * Freshness keys:
 * - `'live'`        — data is within `staleAfterMs` and no live fetch failure.
 * - `'cached'`      — data is within `staleAfterMs` but a live fetch failure occurred.
 * - `'stale'`       — data is older than `staleAfterMs`.
 * - `'unavailable'` — `updatedAt` is absent.
 *
 * @param {{ updatedAt?: string|Date|number|null, lang?: 'en'|'ar', hasLiveFailure?: boolean, staleAfterMs?: number }} [options]
 * @returns {{ key: 'live'|'cached'|'stale'|'unavailable', ageMs: number, ageText: string, timeText: string, updatedAt: string|Date|number|null }}
 */
export function getLiveFreshness({
  updatedAt,
  lang = 'en',
  hasLiveFailure = false,
  staleAfterMs = GOLD_MARKET.STALE_AFTER_MS,
} = {}) {
  if (!updatedAt) {
    return {
      key: 'unavailable',
      ageMs: UNAVAILABLE_AGE_MS,
      ageText: '—',
      timeText: '—',
      updatedAt: null,
    };
  }

  const ageMs = getAgeMs(updatedAt);
  const key = ageMs > staleAfterMs ? 'stale' : hasLiveFailure ? 'cached' : 'live';

  return {
    key,
    ageMs,
    ageText: formatRelativeAge(ageMs, lang),
    timeText: formatTimestampShort(updatedAt, lang),
    updatedAt,
  };
}

/**
 * Derive the freshness key for FX exchange rates.
 *
 * `open.er-api.com` free-tier rates update approximately once per 24 hours.
 * When rates come from a local cache and are older than `FX_STALE_AFTER_MS`
 * (26 hours), the returned key is `'stale'` so callers can show a visible
 * label (AGENTS.md §6.2 — cached values must be labelled).
 *
 * @param {{ fxUpdatedAt?: string|Date|number|null, hasCacheFailure?: boolean, lang?: 'en'|'ar', staleAfterMs?: number }} [options]
 * @returns {{ key: 'live'|'cached'|'stale'|'unavailable', ageMs: number, ageText: string, timeText: string }}
 */
export function getFXFreshness({
  fxUpdatedAt,
  hasCacheFailure = false,
  lang = 'en',
  staleAfterMs = FX_MARKET.FX_STALE_AFTER_MS,
} = {}) {
  if (!fxUpdatedAt) {
    return {
      key: 'unavailable',
      ageMs: UNAVAILABLE_AGE_MS,
      ageText: '—',
      timeText: '—',
    };
  }

  const ageMs = getAgeMs(fxUpdatedAt);
  const key = ageMs > staleAfterMs ? 'stale' : hasCacheFailure ? 'cached' : 'live';

  return {
    key,
    ageMs,
    ageText: formatRelativeAge(ageMs, lang),
    timeText: formatTimestampShort(fxUpdatedAt, lang),
  };
}
