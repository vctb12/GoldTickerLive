/**
 * branding/brand-config.js — white-label branding spike (Phase 44). DESIGN SPIKE ONLY.
 *
 * A non-functional exploration of how the site *could* be re-skinned for a white-label partner. It is
 * deliberately limited to static branding tokens — **no tenant system, no billing, no multi-tenancy
 * backend, and nothing wired to the live theme.** The master flag ships OFF, and while it is off the
 * resolver always returns the default brand, so this changes nothing at runtime. It exists to inform
 * the Phase 45 decision brief.
 *
 * Scope guard (enforced by tests): a brand descriptor carries only presentation tokens. It must NOT
 * grow tenant/billing/plan/pricing fields — that would cross from "design spike" into the productised
 * multi-tenant work this phase explicitly does not do.
 */

/** Master switch. White-label is a spike — OFF until (and unless) a decision green-lights it. */
export const WHITE_LABEL_ENABLED = false;

/** The real product brand. */
export const DEFAULT_BRAND_KEY = 'gold-ticker-live';

/**
 * @typedef {Object} BrandTokens
 * @property {string} primary
 * @property {string} primaryLight
 * @property {string} bg
 * @property {string} surface
 * @property {string} ink
 * @property {string} onPrimary
 */

/**
 * @typedef {Object} Brand
 * @property {string} key
 * @property {string} name
 * @property {{en:string, ar:string}} tagline
 * @property {string} logoGlyph  A single emoji/glyph standing in for a real logo asset in the spike.
 * @property {boolean} demo      True for the illustrative alternates (not real partners).
 * @property {BrandTokens} tokens
 */

/** @type {Record<string, Brand>} */
export const BRANDS = {
  'gold-ticker-live': {
    key: 'gold-ticker-live',
    name: 'Gold Ticker Live',
    tagline: {
      en: 'Reference gold prices for the UAE and the Arab world',
      ar: 'أسعار الذهب المرجعية للإمارات والعالم العربي',
    },
    logoGlyph: '🟡',
    demo: false,
    // Real palette, mirrored from styles/partials/tokens.css.
    tokens: {
      primary: '#b07d1f',
      primaryLight: '#ddb040',
      bg: '#fdfbf5',
      surface: '#ffffff',
      ink: '#0f0c06',
      onPrimary: '#1a1305',
    },
  },
  // ── Illustrative demo brands — NOT real partners, purely to show re-skinnability. ──
  'demo-silver-souk': {
    key: 'demo-silver-souk',
    name: 'Silver Souk (demo)',
    tagline: {
      en: 'Live silver & bullion reference — demo skin',
      ar: 'مرجع الفضة والسبائك المباشر — نموذج توضيحي',
    },
    logoGlyph: '⚪',
    demo: true,
    tokens: {
      primary: '#6b7a8f',
      primaryLight: '#9fb3c8',
      bg: '#f6f8fa',
      surface: '#ffffff',
      ink: '#10151b',
      onPrimary: '#ffffff',
    },
  },
  'demo-bourse-dor': {
    key: 'demo-bourse-dor',
    name: "Bourse d'Or (demo)",
    tagline: {
      en: 'Live bullion reference — demo skin',
      ar: 'مرجع السبائك المباشر — نموذج توضيحي',
    },
    logoGlyph: '🟢',
    demo: true,
    tokens: {
      primary: '#1f6b4a',
      primaryLight: '#3fa06f',
      bg: '#f4faf6',
      surface: '#ffffff',
      ink: '#0b1a12',
      onPrimary: '#ffffff',
    },
  },
};

/** All brand keys. */
export function brandKeys() {
  return Object.keys(BRANDS);
}

/** Look up a brand, falling back to the default brand for unknown keys. */
export function getBrand(key) {
  return BRANDS[key] || BRANDS[DEFAULT_BRAND_KEY];
}

/**
 * Resolve a requested brand key to an active one. While {@link WHITE_LABEL_ENABLED} is off this ALWAYS
 * returns the default brand — the spike is inert. (When a decision turns it on, a known key resolves
 * to itself.) Mirrors the locale resolver's fail-safe shape.
 */
export function resolveBrandKey(key) {
  if (!WHITE_LABEL_ENABLED) return DEFAULT_BRAND_KEY;
  return BRANDS[key] ? key : DEFAULT_BRAND_KEY;
}

/**
 * Map a brand's tokens to a `--brand-*` CSS custom-property set. This is a SPIKE namespace — it does
 * not touch the live `--color-*` tokens — so applying it (in a future phase) would be an opt-in skin,
 * not a change to the shipped theme.
 * @param {Brand} brand
 * @returns {Record<string, string>}
 */
export function brandToCssVars(brand) {
  const b = brand || getBrand(DEFAULT_BRAND_KEY);
  return {
    '--brand-name': JSON.stringify(b.name),
    '--brand-primary': b.tokens.primary,
    '--brand-primary-light': b.tokens.primaryLight,
    '--brand-bg': b.tokens.bg,
    '--brand-surface': b.tokens.surface,
    '--brand-ink': b.tokens.ink,
    '--brand-on-primary': b.tokens.onPrimary,
  };
}
