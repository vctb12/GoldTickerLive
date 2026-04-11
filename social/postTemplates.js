/**
 * social/postTemplates.js
 * Post template definitions and generation logic for the X/Twitter post generator.
 * Templates are designed to fit within X's 280-character limit.
 * Note: X wraps all URLs to ~23 characters (t.co), so raw char counts may be higher.
 *
 * Dependencies: none (pure functions)
 */

const SITE_URL = 'https://vctb12.github.io/Gold-Prices/';
// X wraps any URL to this length (t.co shortening)
const X_URL_LENGTH = 23;

/**
 * Format a price number with commas.
 * @param {number} n
 * @param {number} decimals
 * @returns {string}
 */
function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Format a change value with sign and percentage.
 * @param {number} change  Absolute change in USD
 * @param {number} pct     Percentage change
 * @returns {string}
 */
function fmtChange(change, pct) {
  if (change == null || isNaN(change)) return '—';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${fmt(change)} (${sign}${fmt(pct)}%)`;
}

/**
 * Get a trend emoji based on percentage change.
 * @param {number} pct
 * @returns {string}
 */
function trendEmoji(pct) {
  if (pct == null || isNaN(pct)) return '➡️';
  if (pct > 1) return '🚀';
  if (pct > 0) return '📈';
  if (pct < -1) return '📉';
  if (pct < 0) return '🔻';
  return '➡️';
}

/**
 * Get a trend text label based on percentage change.
 * @param {number} pct
 * @returns {string}
 */
function trendText(pct) {
  if (pct == null || isNaN(pct)) return 'Steady';
  if (pct > 1) return 'Surging';
  if (pct > 0) return 'Rising';
  if (pct < -1) return 'Falling';
  if (pct < 0) return 'Slipping';
  return 'Steady';
}

/**
 * Calculate prices for a given karat purity using the standard formula.
 * @param {number} spotUsdPerOz   XAU/USD spot price
 * @param {number} purity         Karat purity (0–1)
 * @param {number} aedPeg         AED/USD fixed peg
 * @returns {{ usdPerOz: number, aedPerGram: number }}
 */
function calcKarat(spotUsdPerOz, purity, aedPeg = 3.6725) {
  const TROY_OZ_GRAMS = 31.1035;
  const usdPerOz = spotUsdPerOz * purity;
  const usdPerGram = (spotUsdPerOz / TROY_OZ_GRAMS) * purity;
  const aedPerGram = usdPerGram * aedPeg;
  return { usdPerOz, usdPerGram, aedPerGram };
}

// ---------------------------------------------------------------------------
// Template: Daily Price Update
// ---------------------------------------------------------------------------
function generateDaily(data) {
  const { spotUsdPerOz, dayOpenUsdPerOz, generatedAt } = data;
  const AED_PEG = 3.6725;

  const k24 = calcKarat(spotUsdPerOz, 1.0,      AED_PEG);
  const k22 = calcKarat(spotUsdPerOz, 22 / 24,  AED_PEG);
  const k21 = calcKarat(spotUsdPerOz, 21 / 24,  AED_PEG);
  const k18 = calcKarat(spotUsdPerOz, 18 / 24,  AED_PEG);

  const change   = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct = dayOpenUsdPerOz ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100 : null;
  const sign      = change != null && change >= 0 ? '+' : '';
  const changeStr = change != null ? ` (${sign}${fmt(changePct)}%)` : '';

  const date = new Date(generatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const trend = trendEmoji(changePct);

  const lines = [
    `🥇 Gold Prices Today — ${date}`,
    `24K: $${fmt(k24.usdPerOz)}/oz${changeStr}`,
    `22K: $${fmt(k22.usdPerOz)}/oz`,
    `21K: $${fmt(k21.usdPerOz)}/oz`,
    `18K: $${fmt(k18.usdPerOz)}/oz`,
    `🇦🇪 UAE (AED/g):`,
    `24K: ${fmt(k24.aedPerGram)} | 22K: ${fmt(k22.aedPerGram)}`,
    `21K: ${fmt(k21.aedPerGram)} | 18K: ${fmt(k18.aedPerGram)}`,
    `${trend} ${trendText(changePct)}`,
    `📊 ${SITE_URL}`,
    `#GoldPrice #Gold #UAE #Dubai`,
  ];

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Template: Price Alert (big move)
// ---------------------------------------------------------------------------
function generateAlert(data) {
  const { spotUsdPerOz, dayOpenUsdPerOz, generatedAt } = data;
  const AED_PEG = 3.6725;

  const k24 = calcKarat(spotUsdPerOz, 1.0, AED_PEG);
  const change    = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct = dayOpenUsdPerOz ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100 : null;
  const direction = change == null ? '⚡' : change >= 0 ? '⬆️' : '⬇️';
  const absPct    = changePct != null ? Math.abs(changePct).toFixed(2) : '?';
  const sign      = change != null && change >= 0 ? '+' : '';
  const changeStr = change != null ? `${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : '?';

  const lines = [
    `🚨 Gold ${direction} ${absPct}% today!`,
    `Now:  $${fmt(spotUsdPerOz)}/oz`,
    dayOpenUsdPerOz ? `Open: $${fmt(dayOpenUsdPerOz)}/oz` : null,
    change != null ? `Change: ${changeStr}` : null,
    `🇦🇪 24K Dubai: AED ${fmt(k24.aedPerGram)}/g`,
    `📊 Track live → ${SITE_URL}`,
    `#GoldPrice #Alert`,
  ].filter(Boolean);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Template: Weekly Summary
// ---------------------------------------------------------------------------
function generateWeekly(data) {
  const { spotUsdPerOz, weekHistory, generatedAt } = data;

  // weekHistory: array of { date: 'YYYY-MM-DD', price: number } sorted ascending
  // Derive Mon/Fri and high/low from history if available; fall back to estimates.
  let monPrice = null, friPrice = null, highPrice = null, lowPrice = null;
  let highDay = '', lowDay = '';

  if (Array.isArray(weekHistory) && weekHistory.length >= 2) {
    monPrice = weekHistory[0].price;
    friPrice = weekHistory[weekHistory.length - 1].price;

    weekHistory.forEach(h => {
      if (highPrice == null || h.price > highPrice) {
        highPrice = h.price;
        highDay = new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' });
      }
      if (lowPrice == null || h.price < lowPrice) {
        lowPrice = h.price;
        lowDay = new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' });
      }
    });
  } else {
    // No weekly data — use spot as current endpoint, estimate others
    friPrice = spotUsdPerOz;
    monPrice = null;
  }

  const weekChange    = (monPrice && friPrice) ? friPrice - monPrice : null;
  const weekChangePct = (monPrice && friPrice) ? ((friPrice - monPrice) / monPrice) * 100 : null;
  const sign          = weekChange != null && weekChange >= 0 ? '+' : '';

  // Build the week range label: "Apr 7–11" style
  const now    = new Date(generatedAt);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const monLabel = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const friLabel = friday.toLocaleDateString('en-US', { day: 'numeric' });
  const weekRange = `${monLabel}–${friLabel}`;

  const lines = [
    `📊 Gold Week in Review (${weekRange})`,
    monPrice ? `Mon: $${fmt(monPrice)}` : null,
    friPrice ? `Fri: $${fmt(friPrice)}` : null,
    weekChange != null ? `Change: ${sign}$${fmt(weekChange)} (${sign}${fmt(weekChangePct)}%)` : null,
    highPrice ? `High: $${fmt(highPrice)}${highDay ? ` (${highDay})` : ''}` : null,
    lowPrice  ? `Low:  $${fmt(lowPrice)}${lowDay  ? ` (${lowDay})` : ''}` : null,
    `📈 Charts & history → ${SITE_URL}`,
    `#GoldPrice #WeeklyUpdate`,
  ].filter(Boolean);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All available templates, in display order. */
export const TEMPLATES = [
  {
    id: 'daily',
    label: 'Daily Price Update',
    description: 'Full karat breakdown with AED prices and day change.',
    generate: generateDaily,
  },
  {
    id: 'alert',
    label: 'Price Alert (Big Move)',
    description: 'Urgent post for significant price movements.',
    generate: generateAlert,
  },
  {
    id: 'weekly',
    label: 'Weekly Summary',
    description: 'Week-in-review with high/low and overall change.',
    generate: generateWeekly,
  },
];

/**
 * Find a template by id.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id);
}

/**
 * Count characters as X does:
 * - URLs are counted as X_URL_LENGTH (23) regardless of actual length
 * - Emojis count as 2 characters
 * @param {string} text
 * @returns {number}
 */
export function xCharCount(text) {
  // Replace URLs with 23-char placeholders for counting
  const urlPattern = /https?:\/\/\S+/g;
  const normalized = text.replace(urlPattern, '_'.repeat(X_URL_LENGTH));
  // Count code points (handles emoji correctly)
  return [...normalized].length;
}

export { SITE_URL };
