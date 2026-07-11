/**
 * components/priceProvenance.js — the shared "About this price" trust control.
 *
 * A COMPACT, progressive-disclosure provenance badge (Stage-2C): a small
 * summary line (a freshness chip + "About this price") that expands to disclose,
 * in one place, everything a user needs to judge the number:
 *   - Source      — where the spot price comes from (Gold-API.com) + cadence
 *   - Updated     — the data-source UTC timestamp + relative age (honest state)
 *   - Basis       — the fixed conversions every surface derives from
 *                   (troy-oz 31.1035 g, USD→AED peg 3.6725, karat purity = code/24)
 *   - Spot ≠ retail — the number is a spot-linked reference, not a shop quote
 *   - Methodology — link to the full write-up
 *
 * Design contract (per the trust-layer mission):
 *   - Progressive disclosure via native <details>/<summary> — keyboard
 *     accessible, NOT hover-only; the core price stays visually dominant.
 *   - No critical info is hover-only; the summary always shows the honest state.
 *   - Bilingual EN/AR (natural Arabic), RTL-aware, theme-aware (design-system
 *     tokens), mobile-friendly. `gtl-` namespaced, no `.ds-*` collisions.
 *   - Reusable: every price surface can mount the same control. This is the
 *     consolidation point for freshness+source+basis disclosure so surfaces stop
 *     each rolling their own scattered trust copy.
 *
 * Built entirely with safe-dom `el()` (no innerHTML sink).
 */

import { el, safeHref } from '../lib/safe-dom.js';
import { DATA_ATTRIBUTION, getRefreshStatement } from '../config/data-attribution.js';
import { getLiveFreshness, applyMarketClosedOverlay, formatRelativeAge } from '../lib/live-status.js';
import { formatTimestampShort } from '../lib/formatter.js';

// The immutable invariants (troy-oz 31.1035, peg 3.6725, karat÷24) are stated as
// prose in COPY below — they are constitutional constants, not runtime values.

const FRESHNESS_LABEL = {
  live: { en: 'Live', ar: 'مباشر' },
  delayed: { en: 'Delayed', ar: 'متأخر قليلاً' },
  cached: { en: 'Cached', ar: 'مخزن مؤقتاً' },
  stale: { en: 'Stale', ar: 'قديم' },
  fallback: { en: 'Fallback', ar: 'بديل احتياطي' },
  closed: { en: 'Closed', ar: 'مغلق' },
  unavailable: { en: 'Unavailable', ar: 'غير متاح' },
};

const COPY = {
  en: {
    summary: 'About this price',
    sourceLabel: 'Source',
    sourceRole: 'Gold spot price (XAU/USD)',
    updatedLabel: 'Updated',
    basisLabel: 'How it is derived',
    basisTroy: '1 troy ounce = 31.1035 g',
    basisPeg: 'USD → AED at the fixed peg 1 USD = 3.6725 AED',
    basisKarat: 'Karat purity = karat ÷ 24 (24K = pure)',
    spotVsRetail:
      'This is a spot-linked reference for the metal itself — not a shop retail quote. A jeweller adds making charges, dealer margin, and any VAT.',
    methodology: 'Full methodology',
  },
  ar: {
    summary: 'عن هذا السعر',
    sourceLabel: 'المصدر',
    sourceRole: 'سعر الذهب الفوري (XAU/USD)',
    updatedLabel: 'آخر تحديث',
    basisLabel: 'كيف يُحتسب',
    basisTroy: 'الأونصة التروية = 31.1035 غرام',
    basisPeg: 'تحويل الدولار إلى الدرهم بالربط الثابت: 1 دولار = 3.6725 درهم',
    basisKarat: 'نقاء العيار = العيار ÷ 24 (عيار 24 = خالص)',
    spotVsRetail:
      'هذا سعر مرجعي مرتبط بالسعر الفوري للمعدن نفسه — وليس سعر تجزئة من متجر. يضيف الصائغ أجور الصياغة وهامش التاجر وأي ضريبة قيمة مضافة.',
    methodology: 'المنهجية الكاملة',
  },
};

function freshnessLabel(key, lang) {
  return (FRESHNESS_LABEL[key] || FRESHNESS_LABEL.unavailable)[lang === 'ar' ? 'ar' : 'en'];
}

function row(dict, labelText, valueNode) {
  return el('div', { class: 'gtl-provenance__row' }, [
    el('dt', { class: 'gtl-provenance__key' }, labelText),
    el('dd', { class: 'gtl-provenance__val' }, valueNode),
  ]);
}

/**
 * Build the "About this price" control.
 *
 * @param {{
 *   lang?: 'en'|'ar',
 *   depth?: number,
 *   updatedAt?: string|null,
 *   hasLiveFailure?: boolean,
 *   isFallback?: boolean|null,
 *   isFresh?: boolean|null,
 *   open?: boolean,
 * }} opts
 * @returns {HTMLElement} a <details class="gtl-provenance"> element
 */
export function renderPriceProvenance(opts = {}) {
  const lang = opts.lang === 'ar' ? 'ar' : 'en';
  const depth = Number.isInteger(opts.depth) ? opts.depth : 0;
  const c = COPY[lang];
  // safeHref only accepts explicitly-relative (`./`, `../`) or absolute URLs, so
  // depth 0 must be `./methodology.html`, not a bare `methodology.html`.
  const prefix = depth > 0 ? '../'.repeat(depth) : './';

  // Resolve freshness through the shared label layer + market-closed overlay so
  // the summary chip is honest and never claims "Live" while the market is shut.
  const fresh = getLiveFreshness({
    updatedAt: opts.updatedAt ?? null,
    lang,
    hasLiveFailure: Boolean(opts.hasLiveFailure),
    isFallback: opts.isFallback ?? null,
    isFresh: opts.isFresh ?? null,
  });
  const stateKey = applyMarketClosedOverlay(fresh.key);
  const stateLabel = freshnessLabel(stateKey, lang);

  const details = el('details', {
    class: 'gtl-provenance',
    'data-freshness': stateKey,
  });
  if (opts.open) details.setAttribute('open', '');

  // Summary: freshness chip + affordance. The chip carries the honest state so
  // the key info is visible without expanding.
  const summary = el('summary', { class: 'gtl-provenance__summary' }, [
    el('span', { class: 'gtl-provenance__chip' }, [
      el('span', { class: 'gtl-provenance__dot', 'aria-hidden': 'true' }),
      el('span', { class: 'gtl-provenance__state' }, stateLabel),
    ]),
    el('span', { class: 'gtl-provenance__cta' }, c.summary),
    el('span', { class: 'gtl-provenance__chevron', 'aria-hidden': 'true' }),
  ]);
  details.appendChild(summary);

  const body = el('div', { class: 'gtl-provenance__body' });

  // Source
  const sourceLink = el(
    'a',
    {
      class: 'gtl-provenance__link',
      href: safeHref(DATA_ATTRIBUTION.gold.url),
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    DATA_ATTRIBUTION.gold.label
  );
  const dl = el('dl', { class: 'gtl-provenance__list' }, [
    row(c, c.sourceLabel, el('span', null, [sourceLink, el('span', { class: 'gtl-provenance__muted' }, ` · ${c.sourceRole}`)])),
  ]);

  // Updated — timestamp + relative age
  if (opts.updatedAt) {
    const timeText = formatTimestampShort(opts.updatedAt, lang);
    const ageText = formatRelativeAge(fresh.ageMs, lang);
    dl.appendChild(
      row(c, c.updatedLabel, el('span', null, `${timeText} · ${ageText}`))
    );
  }

  // Basis — the fixed conversions
  dl.appendChild(
    row(
      c,
      c.basisLabel,
      el('ul', { class: 'gtl-provenance__basis' }, [
        el('li', null, c.basisTroy),
        el('li', null, c.basisPeg),
        el('li', null, c.basisKarat),
      ])
    )
  );
  body.appendChild(dl);

  // Refresh cadence (from the single attribution source of truth)
  body.appendChild(el('p', { class: 'gtl-provenance__note' }, getRefreshStatement(lang)));

  // Spot vs retail — the honest non-negotiable
  body.appendChild(el('p', { class: 'gtl-provenance__retail' }, c.spotVsRetail));

  // Methodology link
  body.appendChild(
    el(
      'a',
      { class: 'gtl-provenance__method', href: safeHref(`${prefix}methodology.html`) },
      `${c.methodology} →`
    )
  );

  details.appendChild(body);
  return details;
}
