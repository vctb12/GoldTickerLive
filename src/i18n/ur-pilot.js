/**
 * i18n/ur-pilot.js — Urdu pilot dictionary (Phase 40, RTL).
 *
 * The same curated **core-pages** surface as the French pilot (shared shell + homepage price
 * surface), translated into Urdu. Urdu is right-to-left and **reuses the exact RTL infrastructure
 * Arabic already uses** — `getLocaleDir('ur') === 'rtl'` / `isRtlLocale('ur') === true`, so the
 * document direction, mirrored layout, and RTL CSS apply with no new plumbing.
 *
 * Like the French pilot it is kept OUT of the parity-guarded `src/config/translations.js` (EN/AR are
 * held to exact key parity; Urdu is a partial pilot). Every key here MUST exist in `TRANSLATIONS.en`
 * (guarded by tests); uncovered keys fall back to English via the shared `translate()` helper. The
 * reference-estimate framing (bullion-equivalent, "not financial advice") is preserved in Urdu.
 */

/** @type {Record<string, string>} — Urdu strings, keyed by the existing EN translation key. */
export const UR_PILOT = {
  // ── Header / language ──────────────────────────────────────────────────────
  'header.title': 'سونے کی قیمتیں براہِ راست',
  'header.subtitle': 'قیراط اور کرنسی کے مطابق اسپاٹ سے منسلک بُلین تخمینے',
  'lang.toggle': 'English',

  // ── Primary navigation ─────────────────────────────────────────────────────
  'nav.home': 'ہوم',
  'nav.tracker': 'براہِ راست ٹریکر',
  'nav.calculator': 'کیلکولیٹر',
  'nav.learn': 'سیکھنے کا مرکز',
  'nav.shops': 'دکانیں اور بازار',
  'nav.methodology': 'طریقہ کار',
  'nav.terms': 'شرائطِ خدمات',
  'nav.privacy': 'رازداری کی پالیسی',
  'nav.invest': 'سرمایہ کاری',
  'nav.insights': 'مارکیٹ تجزیہ',
  'nav.countries': 'ممالک',
  'nav.compare': 'ممالک کا موازنہ',
  'nav.heatmap': 'عالمی نقشہ',
  'nav.glossary': 'لغت',
  'nav.market': 'سونے کی قیمت کیسے طے ہوتی ہے',
  'nav.portfolio': 'پورٹ فولیو',
  'nav.dubai': 'دبئی اور یو اے ای میں سونے کی قیمت',
  'nav.country': 'ملک',
  'breadcrumbs.ariaLabel': 'بریڈ کرمب',

  // ── Footer ─────────────────────────────────────────────────────────────────
  'footer.goldSource': 'سونے کا ڈیٹا: Gold-API.com (gold-api.com)',
  'footer.fxSource': 'زرِ مبادلہ ڈیٹا: ExchangeRate-API (open.er-api.com)',
  'footer.disclaimer':
    'صرف بُلین کے مساوی تخمینی اقدار۔ خوردہ اور زیورات کی قیمتیں نمایاں طور پر مختلف ہو سکتی ہیں۔ یہ مالی مشورہ نہیں ہے۔',

  // ── Gold / FX / AED freshness + badges ─────────────────────────────────────
  'gold.freshness.label': 'سونا اپ ڈیٹ ہوا:',
  'gold.countdown.label': 'اگلی تازہ کاری:',
  'gold.badge': 'براہِ راست',
  'fx.freshness.label': 'زرِ مبادلہ کی شرحیں اپ ڈیٹ ہوئیں:',
  'fx.next.label': 'اگلی زرِ مبادلہ تازہ کاری:',
  'fx.badge': 'روزانہ',
  'aed.badge': 'مقررہ پیگ',
  'aed.note': 'یو اے ای مرکزی بینک کی امریکی ڈالر سے سرکاری پیگ',

  // ── Homepage spotlight ─────────────────────────────────────────────────────
  'spotlight.title': 'یو اے ای میں سونے کی قیمتیں',
  'spotlight.note': 'بُلین کے مساوی تخمینی قدر',
  'spotlight.perOzUsd': 'فی اونس (USD)',
  'spotlight.perOzAed': 'فی اونس (AED)',
  'spotlight.perGramUsd': 'فی گرام (USD)',
  'spotlight.perGramAed': 'فی گرام (AED)',
  'spotlight.karat.label': 'قیراط:',

  // ── Price movement ─────────────────────────────────────────────────────────
  'change.title': 'قیمت میں تبدیلی',
  'change.vsPrev': 'پچھلے ریکارڈ کے مقابلے میں',
  'change.vsOpen': 'دبئی کی ابتدائی قیمت کے مقابلے میں',
  'change.note': '24 قیراط فی اونس · USD · اسپاٹ سے منسلک تخمینہ',

  // ── Price-by-karat table ───────────────────────────────────────────────────
  'karat.title': 'قیراط کے حساب سے قیمت',
  'karat.col.karat': 'قیراط',
  'karat.col.usd': 'USD',
  'karat.col.aed': 'AED (مقررہ پیگ)',
  'karat.disclaimer':
    'بُلین کے مساوی تخمینی اقدار۔ خوردہ اور زیورات کی قیمتیں مختلف ہو سکتی ہیں۔ یہ مالی مشورہ نہیں ہے۔',

  // ── Units ──────────────────────────────────────────────────────────────────
  'unit.gram': 'فی گرام',
  'unit.oz': 'فی اونس',

  // ── Country / price cards ──────────────────────────────────────────────────
  'card.perGram': 'فی گرام',
  'card.perOz': 'فی اونس',
  'card.copy': 'کاپی',
  'card.copied': 'کاپی ہو گیا!',
  'card.stale': 'پرانا',
  'card.noData': 'کوئی ڈیٹا نہیں',
  'card.addFavorite': 'پسندیدہ میں شامل کریں',
  'card.removeFavorite': 'پسندیدہ سے ہٹائیں',

  // ── Status / freshness messages ────────────────────────────────────────────
  'status.loading': 'قیمتیں لوڈ ہو رہی ہیں...',
  'status.offline': 'آپ آف لائن ہیں۔ محفوظ شدہ ڈیٹا دکھایا جا رہا ہے۔',
  'status.goldStale': 'سونے کا ڈیٹا پرانا ہو سکتا ہے۔ محفوظ شدہ قیمت استعمال کی جا رہی ہے۔',
  'status.fxStale': 'زرِ مبادلہ کی شرحیں پرانی ہو سکتی ہیں۔ محفوظ شدہ شرحیں استعمال کی جا رہی ہیں۔',
  'status.goldError':
    'سونے کی قیمت تازہ نہیں کی جا سکی۔ دستیاب ہونے پر آخری محفوظ شدہ قدر دکھائی جا رہی ہے۔',
  'status.fxError':
    'زرِ مبادلہ کی شرحیں تازہ نہیں کی جا سکیں۔ دستیاب ہونے پر آخری محفوظ شدہ شرحیں دکھائی جا رہی ہیں۔',
  'status.noData':
    'قیمتیں اس وقت دستیاب نہیں ہیں۔ اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں دبائیں۔',
  'status.retry': 'دوبارہ کوشش کریں',
  'status.cacheHealth': 'ڈیٹا کی تازگی:',
};

/** Keys covered by the Urdu pilot. Everything else falls back to English. */
export const UR_PILOT_KEYS = Object.keys(UR_PILOT);

/**
 * Return a translations map with the Urdu pilot grafted on as the `ur` locale, so
 * `translate(withUrduPilot(TRANSLATIONS), 'ur', key)` yields Urdu for covered keys and English for
 * the rest. The input map is not mutated.
 *
 * @param {Record<string, Record<string, string>>} translations  e.g. `TRANSLATIONS`.
 * @returns {Record<string, Record<string, string>>}
 */
export function withUrduPilot(translations) {
  return { ...(translations || {}), ur: UR_PILOT };
}
