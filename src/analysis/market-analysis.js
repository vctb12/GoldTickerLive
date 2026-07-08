/**
 * analysis/market-analysis.js — template-based, descriptive market-analysis text (Phase 43).
 *
 * Turns factual gold price data into a plain-language *description* of what the numbers are — never a
 * forecast, a recommendation, or an invented cause. It mirrors the honesty rules of the backend
 * `server/services/ai-drafts.js` on the client:
 *
 *   - **No LLM.** Pure string templates filled from data. Deterministic.
 *   - **No forecasts / no advice.** It states what happened, not what will happen or what to do.
 *   - **No invented causes.** It never says *why* a price moved. A caller may pass an explicit
 *     `reason`, which is rendered with an "unconfirmed" label — factual observation only.
 *   - **Always disclosed.** Every result carries the spot-linked reference-estimate disclaimer.
 *
 * The generator is deliberately conservative: `assertDescriptiveOnly()` (used by tests) scans output
 * for forecast/advice vocabulary so a regression that introduces "will rise", "buy", "bullish", etc.
 * fails CI.
 */

const FORECAST_PATTERNS =
  /\b(will|won't|going to|expected to|forecast|predict|projection|outlook|likely to|could (?:rise|fall|reach|hit)|should (?:buy|sell|invest)|buy|sell|target price|undervalued|overvalued|bullish|bearish|rally ahead|set to)\b/i;

const CAUSE_PATTERNS =
  /\b(because|due to|driven by|on the back of|thanks to|owing to|as a result of)\b/i;

/** Movement magnitude bands by absolute % change — descriptive only, never predictive. */
const MAGNITUDE = [
  { key: 'unchanged', max: 0.05, en: 'unchanged', ar: 'دون تغيير' },
  { key: 'little-changed', max: 0.25, en: 'little changed', ar: 'شبه مستقر' },
  { key: 'modest', max: 1, en: 'modestly', ar: 'بشكل طفيف' },
  { key: 'notable', max: 2.5, en: 'notably', ar: 'بشكل ملحوظ' },
  { key: 'sharp', max: Infinity, en: 'sharply', ar: 'بشكل حاد' },
];

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

function fmtUsd(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(n) {
  return `${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function classifyMagnitude(pct) {
  const mag = Math.abs(pct);
  return MAGNITUDE.find((band) => mag < band.max) || MAGNITUDE[MAGNITUDE.length - 1];
}

const DISCLAIMER = {
  en: 'Spot-linked bullion-equivalent reference estimate only — not retail pricing, not a forecast, and not financial advice.',
  ar: 'تقدير مرجعي مبني على السعر الفوري وما يعادله من السبائك فقط — وليس سعر تجزئة ولا توقعًا ولا نصيحة مالية.',
};

const DIRECTION = {
  up: { en: 'higher than', ar: 'أعلى من' },
  down: { en: 'lower than', ar: 'أقل من' },
};

/**
 * Build a descriptive market-analysis view model from factual price data.
 *
 * @param {object} input
 * @param {number} input.price          Current reference XAU/USD per ounce (required, > 0).
 * @param {number} [input.previous]     Previous reference reading (for change).
 * @param {number} [input.dayOpen]      Session-open reference (for vs-open change).
 * @param {number} [input.high]         Range high over `rangeDays`.
 * @param {number} [input.low]          Range low over `rangeDays`.
 * @param {number} [input.rangeDays]    Window length for the range sentence.
 * @param {string} [input.timestamp]    Data timestamp to echo (as given, not generated).
 * @param {string} [input.reason]       OPTIONAL caller-supplied context; rendered as unconfirmed.
 * @param {{lang?: 'en'|'ar'}} [options]
 * @returns {{
 *   status: 'ok'|'unavailable',
 *   headline?: string,
 *   sentences?: string[],
 *   movement?: { key: string, direction: 'up'|'down'|'flat', pctChange: number|null, absChange: number|null },
 *   dataTimestamp?: string|null,
 *   disclaimer: string,
 * }}
 */
export function buildMarketAnalysis(input = {}, options = {}) {
  const lang = pickLang(options.lang);
  const disclaimer = DISCLAIMER[lang];
  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0) {
    return { status: 'unavailable', disclaimer };
  }

  const sentences = [];
  const headline =
    lang === 'ar'
      ? `السعر المرجعي للذهب: ${fmtUsd(price)} للأونصة.`
      : `Gold reference price: ${fmtUsd(price)} per ounce.`;
  sentences.push(headline);

  // Change vs previous reading.
  let movement = { key: 'unchanged', direction: 'flat', pctChange: null, absChange: null };
  const previous = Number(input.previous);
  if (Number.isFinite(previous) && previous > 0) {
    const absChange = price - previous;
    const pctChange = (absChange / previous) * 100;
    const band = classifyMagnitude(pctChange);
    const direction = pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'flat';
    movement = { key: band.key, direction, pctChange, absChange };

    if (band.key === 'unchanged' || direction === 'flat') {
      sentences.push(
        lang === 'ar'
          ? 'وهو دون تغيير عن القراءة المرجعية السابقة.'
          : 'That is unchanged from the previous reference reading.'
      );
    } else {
      const dir = DIRECTION[direction];
      sentences.push(
        lang === 'ar'
          ? `وهو ${fmtUsd(Math.abs(absChange))} (${fmtPct(pctChange)}) ${dir.ar} القراءة المرجعية السابقة، متغيرًا ${band.ar}.`
          : `That is ${fmtUsd(Math.abs(absChange))} (${fmtPct(pctChange)}) ${dir.en} the previous reference reading — a ${band.en} move.`
      );
    }
  }

  // Change vs session open.
  const dayOpen = Number(input.dayOpen);
  if (Number.isFinite(dayOpen) && dayOpen > 0) {
    const pct = ((price - dayOpen) / dayOpen) * 100;
    const dir = pct > 0 ? DIRECTION.up : pct < 0 ? DIRECTION.down : null;
    if (dir) {
      sentences.push(
        lang === 'ar'
          ? `ومقارنةً بافتتاح جلسة دبي، فهو ${dir.ar} الافتتاح بنسبة ${fmtPct(pct)}.`
          : `Against the Dubai session open it is ${dir.en} the open by ${fmtPct(pct)}.`
      );
    } else {
      sentences.push(
        lang === 'ar'
          ? 'وهو عند مستوى افتتاح جلسة دبي نفسه.'
          : 'It is at the same level as the Dubai session open.'
      );
    }
  }

  // Reference range.
  const high = Number(input.high);
  const low = Number(input.low);
  if (Number.isFinite(high) && Number.isFinite(low) && high > 0 && low > 0) {
    const days = Number.isFinite(input.rangeDays) ? input.rangeDays : null;
    const window =
      days != null
        ? lang === 'ar'
          ? `آخر ${days} يومًا`
          : `the last ${days} days`
        : lang === 'ar'
          ? 'الفترة المرصودة'
          : 'the observed window';
    sentences.push(
      lang === 'ar'
        ? `وخلال ${window} تراوح النطاق المرجعي بين ${fmtUsd(low)} و${fmtUsd(high)}.`
        : `Over ${window} the reference range was ${fmtUsd(low)} to ${fmtUsd(high)}.`
    );
  }

  // Optional caller-supplied context — explicitly labelled unconfirmed, never asserted as cause.
  if (input.reason && typeof input.reason === 'string') {
    sentences.push(
      lang === 'ar'
        ? `[سياق غير مؤكد، وليس تفسيرًا للسبب: ${input.reason}]`
        : `[Unconfirmed context, not a stated cause: ${input.reason}]`
    );
  }

  return {
    status: 'ok',
    headline,
    sentences,
    movement,
    dataTimestamp: input.timestamp || null,
    disclaimer,
  };
}

/**
 * Guard: throw if any string contains forecast/advice or invented-cause language. Used by tests to
 * lock the descriptive-only contract; also exported so a caller can validate injected `reason` text.
 * @param {string|string[]} text
 */
export function assertDescriptiveOnly(text) {
  const parts = Array.isArray(text) ? text : [text];
  for (const part of parts) {
    if (FORECAST_PATTERNS.test(part)) {
      throw new Error(`forecast/advice language is not allowed: ${part}`);
    }
    if (CAUSE_PATTERNS.test(part)) {
      throw new Error(`invented-cause language is not allowed: ${part}`);
    }
  }
  return true;
}

export { FORECAST_PATTERNS, CAUSE_PATTERNS };
