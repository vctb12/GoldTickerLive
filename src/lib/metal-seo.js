/**
 * lib/metal-seo.js — registry-driven per-metal SEO / JSON-LD view-model (Phase 61, Theme B).
 *
 * The metals registry (`metals.js`) describes every metal — name (EN/AR), spot symbol, purity grades.
 * This module turns that into per-metal page metadata (title, description) and a schema.org `WebPage`
 * JSON-LD, so metal pages get consistent, bilingual, registry-driven SEO instead of hand-maintained
 * inline tags. Adding or renaming a metal/grade in the registry updates its SEO automatically.
 *
 * Honesty first: the JSON-LD describes the *page* (`WebPage` about the metal as a `Thing`) and
 * carries **no `Offer` / price** — the site publishes spot-linked *reference estimates*, not offers to
 * sell, so a Product/Offer schema would be a false claim. The "live" wording is used only for gold
 * (the metal with a live feed); other metals are described as reference resources, not live prices.
 * Pure and side-effect-free; prices nothing; peg / troy-oz / framing untouched.
 */

import { getMetal, metalKeys } from '../config/metals.js';

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

/**
 * Build the SEO view-model for one metal.
 *
 * @param {string} metalKey
 * @param {{ lang?: 'en'|'ar', siteName?: string }} [options]
 * @returns {{ metal: string, lang: string, title: string, description: string, jsonLd: object }}
 */
export function buildMetalSeo(metalKey, options = {}) {
  const lang = pickLang(options.lang);
  const metal = getMetal(metalKey);
  const name = lang === 'ar' ? metal.nameAr : metal.nameEn;
  const grades = metal.purities.map((p) => p.code).join(', ');
  const isPrimary = Boolean(metal.primary); // gold has a live feed today

  const title =
    lang === 'ar'
      ? `سعر ${name} اليوم — تقدير مرجعي لكل جرام (${metal.symbol})`
      : `${name} Price Today — ${isPrimary ? 'Live ' : ''}${metal.symbol}/USD Reference per Gram`;

  const description =
    lang === 'ar'
      ? `${isPrimary ? 'تقدير مرجعي مباشر' : 'تقدير مرجعي'} لسعر ${name} (${metal.symbol}) لكل جرام حسب العيار (${grades}) — تقدير مرجعي وليس سعر تجزئة ولا نصيحة مالية.`
      : `${isPrimary ? 'Live ' : ''}${name} (${metal.symbol}) reference estimate per gram by grade (${grades}). Reference estimate — not retail pricing and not financial advice.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    inLanguage: lang,
    // The subject is the metal as a substance — deliberately NOT an Offer/Product with a price.
    about: {
      '@type': 'Thing',
      name,
      alternateName: metal.symbol,
    },
  };
  if (options.siteName) {
    jsonLd.isPartOf = { '@type': 'WebSite', name: String(options.siteName) };
  }

  return { metal: metal.key, lang, title, description, jsonLd };
}

/** SEO view-models for every metal, gold first. */
export function buildAllMetalSeo(options = {}) {
  return metalKeys().map((key) => buildMetalSeo(key, options));
}

/** Serialize a metal's JSON-LD for a `<script type="application/ld+json">` tag. */
export function renderMetalJsonLd(seo) {
  if (!seo || !seo.jsonLd) return '';
  return JSON.stringify(seo.jsonLd);
}
