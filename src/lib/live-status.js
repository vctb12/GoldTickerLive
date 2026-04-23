import { formatTimestampShort } from './formatter.js';

export const GOLD_MARKET = {
  OPEN_SUN_MINUTES: 22 * 60,
  CLOSE_FRI_MINUTES: 21 * 60,
  STALE_AFTER_MS: 10 * 60 * 1000,
};

function toDate(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

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

export function getAgeMs(updatedAt, now = Date.now()) {
  const date = toDate(updatedAt);
  if (!date) return Number.POSITIVE_INFINITY;
  return Math.max(0, now - date.getTime());
}

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

export function getLiveFreshness({
  updatedAt,
  lang = 'en',
  hasLiveFailure = false,
  staleAfterMs = GOLD_MARKET.STALE_AFTER_MS,
} = {}) {
  if (!updatedAt) {
    return {
      key: 'unavailable',
      ageMs: Number.POSITIVE_INFINITY,
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
