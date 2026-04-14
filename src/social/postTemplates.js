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
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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

  const k24 = calcKarat(spotUsdPerOz, 1.0, AED_PEG);
  const k22 = calcKarat(spotUsdPerOz, 22 / 24, AED_PEG);
  const k21 = calcKarat(spotUsdPerOz, 21 / 24, AED_PEG);
  const k18 = calcKarat(spotUsdPerOz, 18 / 24, AED_PEG);

  const change = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct = dayOpenUsdPerOz
    ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100
    : null;
  const sign = change != null && change >= 0 ? '+' : '';
  const changeStr = change != null ? ` (${sign}${fmt(changePct)}%)` : '';

  const date = new Date(generatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const trend = trendEmoji(changePct);

  const lines = [
    `🥇 Gold Prices Today — ${date}`,
    `24K: $${fmt(k24.usdPerOz)}/oz${changeStr}`,
    `22K: $${fmt(k22.usdPerOz)}/oz`,
    `21K: $${fmt(k21.usdPerOz)}/oz`,
    `18K: $${fmt(k18.usdPerOz)}/oz`,
    '🇦🇪 UAE (AED/g):',
    `24K: ${fmt(k24.aedPerGram)} | 22K: ${fmt(k22.aedPerGram)}`,
    `21K: ${fmt(k21.aedPerGram)} | 18K: ${fmt(k18.aedPerGram)}`,
    `${trend} ${trendText(changePct)}`,
    `📊 ${SITE_URL}`,
    '#GoldPrice #Gold #UAE #Dubai',
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
  const change = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct = dayOpenUsdPerOz
    ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100
    : null;
  const direction = change == null ? '⚡' : change >= 0 ? '⬆️' : '⬇️';
  const absPct = changePct != null ? Math.abs(changePct).toFixed(2) : '?';
  const sign = change != null && change >= 0 ? '+' : '';
  const changeStr = change != null ? `${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : '?';

  const lines = [
    `🚨 Gold ${direction} ${absPct}% today!`,
    `Now:  $${fmt(spotUsdPerOz)}/oz`,
    dayOpenUsdPerOz ? `Open: $${fmt(dayOpenUsdPerOz)}/oz` : null,
    change != null ? `Change: ${changeStr}` : null,
    `🇦🇪 24K Dubai: AED ${fmt(k24.aedPerGram)}/g`,
    `📊 Track live → ${SITE_URL}`,
    '#GoldPrice #Alert',
  ].filter(Boolean);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Template: Hourly Snapshot (designed for automated posting)
// ---------------------------------------------------------------------------
function generateHourly(data) {
  const { spotUsdPerOz, dayOpenUsdPerOz, generatedAt } = data;
  const AED_PEG = 3.6725;

  const k24 = calcKarat(spotUsdPerOz, 1.0, AED_PEG);
  const k22 = calcKarat(spotUsdPerOz, 22 / 24, AED_PEG);
  const k21 = calcKarat(spotUsdPerOz, 21 / 24, AED_PEG);

  const change = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct = dayOpenUsdPerOz
    ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100
    : null;
  const sign = change != null && change >= 0 ? '+' : '';
  const changeStr = change != null ? ` ${sign}${fmt(changePct)}%` : '';

  const time = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
    hour12: true,
  });

  const lines = [
    `🥇 Gold Now (${time} UAE) ${trendEmoji(changePct)}`,
    `Spot: $${fmt(spotUsdPerOz)}/oz${changeStr}`,
    `24K: AED ${fmt(k24.aedPerGram)}/g`,
    `22K: AED ${fmt(k22.aedPerGram)}/g`,
    `21K: AED ${fmt(k21.aedPerGram)}/g`,
    `📊 ${SITE_URL}`,
    '#GoldPrice #Gold #UAE #Dubai',
  ];

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Template: Morning Market Open
// ---------------------------------------------------------------------------
function generateMorning(data) {
  const { spotUsdPerOz, dayOpenUsdPerOz, generatedAt } = data;
  const AED_PEG = 3.6725;

  const k24 = calcKarat(spotUsdPerOz, 1.0, AED_PEG);
  const k22 = calcKarat(spotUsdPerOz, 22 / 24, AED_PEG);
  const change = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct = dayOpenUsdPerOz
    ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100
    : null;
  const sign = change != null && change >= 0 ? '+' : '';

  const date = new Date(generatedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const lines = [
    `☀️ Good Morning — Gold Opens ${date}`,
    `Spot: $${fmt(spotUsdPerOz)}/oz ${trendEmoji(changePct)}`,
    change != null ? `vs Yesterday Open: ${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : null,
    '',
    `🇦🇪 24K UAE: AED ${fmt(k24.aedPerGram)}/g`,
    `🇦🇪 22K UAE: AED ${fmt(k22.aedPerGram)}/g`,
    '',
    `Track live → ${SITE_URL}`,
    '#GoldPrice #GoldMarket #Dubai #GCC',
  ].filter((l) => l !== null);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Template: Evening / End-of-Day Summary
// ---------------------------------------------------------------------------
function generateEvening(data) {
  const { spotUsdPerOz, dayOpenUsdPerOz, dayHighUsdPerOz, dayLowUsdPerOz, generatedAt } = data;
  const AED_PEG = 3.6725;

  const k24 = calcKarat(spotUsdPerOz, 1.0, AED_PEG);
  const change = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct = dayOpenUsdPerOz
    ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100
    : null;
  const sign = change != null && change >= 0 ? '+' : '';

  const date = new Date(generatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const lines = [
    `🌙 Gold End of Day — ${date}`,
    `Close:  $${fmt(spotUsdPerOz)}/oz ${trendEmoji(changePct)}`,
    dayOpenUsdPerOz ? `Open:   $${fmt(dayOpenUsdPerOz)}/oz` : null,
    change != null ? `Change: ${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : null,
    dayHighUsdPerOz ? `High:   $${fmt(dayHighUsdPerOz)}/oz` : null,
    dayLowUsdPerOz ? `Low:    $${fmt(dayLowUsdPerOz)}/oz` : null,
    `🇦🇪 24K Dubai close: AED ${fmt(k24.aedPerGram)}/g`,
    `Charts → ${SITE_URL}`,
    '#GoldClose #GoldPrice #Dubai',
  ].filter(Boolean);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Template: Arabic (for GCC / Arabic-speaking audience)
// ---------------------------------------------------------------------------
function generateArabic(data) {
  const { spotUsdPerOz, dayOpenUsdPerOz, generatedAt } = data;
  const AED_PEG = 3.6725;

  const k24 = calcKarat(spotUsdPerOz, 1.0, AED_PEG);
  const k22 = calcKarat(spotUsdPerOz, 22 / 24, AED_PEG);
  const k21 = calcKarat(spotUsdPerOz, 21 / 24, AED_PEG);
  const k18 = calcKarat(spotUsdPerOz, 18 / 24, AED_PEG);

  const change = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct = dayOpenUsdPerOz
    ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100
    : null;

  const date = new Date(generatedAt).toLocaleDateString('ar-AE', {
    month: 'short',
    day: 'numeric',
  });

  const trend = changePct == null ? '➡️' : changePct > 0 ? '📈' : changePct < 0 ? '📉' : '➡️';
  const sign = change != null && change >= 0 ? '+' : '';

  const lines = [
    `🥇 أسعار الذهب اليوم — ${date} ${trend}`,
    `عيار 24: ${fmt(k24.aedPerGram)} درهم/جرام`,
    `عيار 22: ${fmt(k22.aedPerGram)} درهم/جرام`,
    `عيار 21: ${fmt(k21.aedPerGram)} درهم/جرام`,
    `عيار 18: ${fmt(k18.aedPerGram)} درهم/جرام`,
    change != null ? `التغيير: ${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : null,
    `📊 ${SITE_URL}`,
    '#سعر_الذهب #ذهب #الإمارات #دبي',
  ].filter(Boolean);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Template: Investment Angle
// ---------------------------------------------------------------------------
function generateInvestment(data) {
  const { spotUsdPerOz, dayOpenUsdPerOz, weekLowUsdPerOz, weekHighUsdPerOz, generatedAt } = data;
  const AED_PEG = 3.6725;

  const k24 = calcKarat(spotUsdPerOz, 1.0, AED_PEG);
  const change = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct = dayOpenUsdPerOz
    ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100
    : null;
  const sign = change != null && change >= 0 ? '+' : '';

  // Estimate how far from week high/low
  const fromWeekHigh = weekHighUsdPerOz
    ? ((spotUsdPerOz - weekHighUsdPerOz) / weekHighUsdPerOz) * 100
    : null;
  const fromWeekLow = weekLowUsdPerOz
    ? ((spotUsdPerOz - weekLowUsdPerOz) / weekLowUsdPerOz) * 100
    : null;

  const lines = [
    '💰 Gold as Investment — Right Now',
    `Spot: $${fmt(spotUsdPerOz)}/oz ${trendEmoji(changePct)}`,
    change != null ? `Today: ${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : null,
    weekHighUsdPerOz
      ? `Wk High: $${fmt(weekHighUsdPerOz)} (${fromWeekHigh != null ? fmt(fromWeekHigh) : '?'}% away)`
      : null,
    weekLowUsdPerOz ? `Wk Low:  $${fmt(weekLowUsdPerOz)}` : null,
    `AED cost for 1g of 24K: ${fmt(k24.aedPerGram)}`,
    `📊 Full analysis → ${SITE_URL}`,
    '#GoldInvestment #Gold #XAU #StoreOfValue',
  ].filter(Boolean);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Template: Milestone / Record Alert
// ---------------------------------------------------------------------------
function generateMilestone(data) {
  const { spotUsdPerOz, milestoneLabel, generatedAt } = data;
  const AED_PEG = 3.6725;
  const k24 = calcKarat(spotUsdPerOz, 1.0, AED_PEG);

  const label = milestoneLabel || 'New Price Level';

  const date = new Date(generatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const lines = [
    `🏆 ${label} — ${date}`,
    `Gold hits $${fmt(spotUsdPerOz)}/oz`,
    '',
    `🇦🇪 24K Dubai: AED ${fmt(k24.aedPerGram)}/g`,
    '',
    'A historic moment for the gold market.',
    `📊 Track it live → ${SITE_URL}`,
    '#GoldATH #GoldRecord #GoldPrice #XAU',
  ].filter((l) => l !== null);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Template: Weekend Edition (Friday/Saturday summary)
// ---------------------------------------------------------------------------
function generateWeekend(data) {
  const { spotUsdPerOz, weekHistory, weekHighUsdPerOz, weekLowUsdPerOz, generatedAt } = data;
  const AED_PEG = 3.6725;

  const k24 = calcKarat(spotUsdPerOz, 1.0, AED_PEG);
  const k22 = calcKarat(spotUsdPerOz, 22 / 24, AED_PEG);

  let monPrice = null,
    friPrice = null;
  if (Array.isArray(weekHistory) && weekHistory.length >= 2) {
    monPrice = weekHistory[0].price;
    friPrice = weekHistory[weekHistory.length - 1].price;
  }
  const weekChange = monPrice && friPrice ? friPrice - monPrice : null;
  const weekChangePct = monPrice && friPrice ? ((friPrice - monPrice) / monPrice) * 100 : null;
  const sign = weekChange != null && weekChange >= 0 ? '+' : '';

  const lines = [
    `🌅 Weekend Gold Wrap-Up ${trendEmoji(weekChangePct)}`,
    `Current:  $${fmt(spotUsdPerOz)}/oz`,
    weekChange != null
      ? `Week:     ${sign}$${fmt(weekChange)} (${sign}${fmt(weekChangePct)}%)`
      : null,
    weekHighUsdPerOz ? `Wk High:  $${fmt(weekHighUsdPerOz)}` : null,
    weekLowUsdPerOz ? `Wk Low:   $${fmt(weekLowUsdPerOz)}` : null,
    '',
    `🇦🇪 24K: AED ${fmt(k24.aedPerGram)}/g | 22K: AED ${fmt(k22.aedPerGram)}/g`,
    `📊 ${SITE_URL}`,
    '#GoldWeekend #GoldPrice #GCC',
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
  let monPrice = null,
    friPrice = null,
    highPrice = null,
    lowPrice = null;
  let highDay = '',
    lowDay = '';

  if (Array.isArray(weekHistory) && weekHistory.length >= 2) {
    monPrice = weekHistory[0].price;
    friPrice = weekHistory[weekHistory.length - 1].price;

    weekHistory.forEach((h) => {
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

  const weekChange = monPrice && friPrice ? friPrice - monPrice : null;
  const weekChangePct = monPrice && friPrice ? ((friPrice - monPrice) / monPrice) * 100 : null;
  const sign = weekChange != null && weekChange >= 0 ? '+' : '';

  // Build the week range label: "Apr 7–11" style
  const now = new Date(generatedAt);
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
    weekChange != null
      ? `Change: ${sign}$${fmt(weekChange)} (${sign}${fmt(weekChangePct)}%)`
      : null,
    highPrice ? `High: $${fmt(highPrice)}${highDay ? ` (${highDay})` : ''}` : null,
    lowPrice ? `Low:  $${fmt(lowPrice)}${lowDay ? ` (${lowDay})` : ''}` : null,
    `📈 Charts & history → ${SITE_URL}`,
    '#GoldPrice #WeeklyUpdate',
  ].filter(Boolean);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** All available templates, in display order. */
export const TEMPLATES = [
  {
    id: 'hourly',
    label: 'Hourly Snapshot',
    description: 'Compact real-time snapshot — ideal for automated hourly posts.',
    generate: generateHourly,
  },
  {
    id: 'daily',
    label: 'Daily Price Update',
    description: 'Full karat breakdown with AED prices and day change.',
    generate: generateDaily,
  },
  {
    id: 'morning',
    label: 'Morning Market Open',
    description: 'Good-morning post showing the opening price and direction.',
    generate: generateMorning,
  },
  {
    id: 'evening',
    label: 'Evening / End-of-Day',
    description: 'Close-of-day recap with high, low, and net change.',
    generate: generateEvening,
  },
  {
    id: 'arabic',
    label: 'Arabic Edition (عربي)',
    description: 'Full Arabic-language post for GCC/Arab audience.',
    generate: generateArabic,
  },
  {
    id: 'investment',
    label: 'Investment Angle',
    description: 'Frames gold as a store-of-value with 52-week context.',
    generate: generateInvestment,
  },
  {
    id: 'milestone',
    label: 'Milestone / Record Alert',
    description: 'Celebratory post for ATH, round-number, or historic levels.',
    generate: generateMilestone,
  },
  {
    id: 'weekend',
    label: 'Weekend Edition',
    description: 'Friday/Saturday wrap-up with weekly range and both karats.',
    generate: generateWeekend,
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
  return TEMPLATES.find((t) => t.id === id);
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
