/**
 * Glossary structured data — schema.org `DefinedTermSet` / `DefinedTerm`.
 *
 * The glossary is authored as static bilingual HTML (twin `data-lang-block`
 * en/ar blocks toggled purely by CSS on `html[lang]`), served from a single URL
 * where Arabic is reached via `?lang=ar`. Because one HTML file renders both
 * locales, the term schema cannot be baked statically without hardcoding one
 * language into the other's view. Instead we build it at runtime for the ACTIVE
 * locale, reading terms from the SAME DOM the reader sees — so EN and AR stay in
 * strict parity and neither page ever emits the other language's definitions.
 *
 * Mirrors the runtime pattern in `src/seo/faq-schema.js` (build → inject, keyed
 * by a stable id so it is idempotent across language toggles). The existing
 * static `BreadcrumbList` JSON-LD is left untouched — this is additive.
 */

const CANONICAL_BASE = 'https://goldtickerlive.com';
const GLOSSARY_PATH = '/glossary.html';
export const GLOSSARY_SCHEMA_ID = 'glossary-definedtermset-schema';

// Fallback set name/description per locale. Callers should pass the localized
// hero copy (from the page's own dictionary) so the set label matches the
// visible H1/sub; these defaults keep the builder usable on its own.
const DEFAULT_SET_META = {
  en: {
    name: 'Gold Glossary',
    description:
      'Plain-English definitions of the gold pricing, purity, product and market terms used across Gold Ticker Live.',
  },
  ar: {
    name: 'مسرد مصطلحات الذهب',
    description:
      'تعريفات مبسّطة لمصطلحات تسعير الذهب ونقاوته ومنتجاته وأسواقه المستخدمة في Gold Ticker Live.',
  },
};

function normalizeText(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLocale(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

function setUrlFor(locale) {
  return locale === 'ar'
    ? `${CANONICAL_BASE}${GLOSSARY_PATH}?lang=ar`
    : `${CANONICAL_BASE}${GLOSSARY_PATH}`;
}

/**
 * Collect the visible glossary terms for `lang` straight from the rendered DOM.
 * Only the matching `[data-lang-block]` is read, so EN and AR never
 * cross-contaminate. Terms missing a name or definition are skipped.
 *
 * @param {Document} [doc]
 * @param {'en'|'ar'} [lang]
 * @returns {Array<{name: string, description: string, id?: string}>}
 */
export function collectGlossaryTerms(doc = document, lang = 'en') {
  const locale = normalizeLocale(lang);
  if (!doc || typeof doc.querySelectorAll !== 'function') return [];

  const nodes = doc.querySelectorAll(`[data-lang-block="${locale}"] .gloss-term`);
  const terms = [];
  nodes.forEach((node) => {
    const nameNode = node.querySelector ? node.querySelector('.gloss-term-name') : null;
    const defNode = node.querySelector ? node.querySelector('.gloss-term-def') : null;
    const name = normalizeText(nameNode && nameNode.textContent);
    const description = normalizeText(defNode && defNode.textContent);
    if (!name || !description) return;

    const term = { name, description };
    const id = node.id || (node.getAttribute && node.getAttribute('id')) || '';
    if (id) term.id = id;
    terms.push(term);
  });
  return terms;
}

/**
 * Build a schema.org `DefinedTermSet` (each term a `DefinedTerm`) for a
 * localized term list. Pure — no DOM access — so it is trivially testable and
 * reused for both locales.
 *
 * @param {Array<{name: string, description: string, id?: string}>} terms
 * @param {'en'|'ar'} [lang]
 * @param {{name?: string, description?: string}} [meta]  Localized set label.
 * @returns {object} DefinedTermSet JSON-LD object
 */
export function buildGlossaryTermSetSchema(terms = [], lang = 'en', meta = {}) {
  const locale = normalizeLocale(lang);
  const name = normalizeText(meta.name) || DEFAULT_SET_META[locale].name;
  const description = normalizeText(meta.description) || DEFAULT_SET_META[locale].description;
  const setUrl = setUrlFor(locale);
  const setId = `${CANONICAL_BASE}${GLOSSARY_PATH}#definedtermset-${locale}`;

  const hasDefinedTerm = (Array.isArray(terms) ? terms : [])
    .filter((t) => t && t.name && t.description)
    .map((t) => {
      const term = {
        '@type': 'DefinedTerm',
        name: t.name,
        description: t.description,
        inDefinedTermSet: setId,
      };
      // Only EN term blocks carry stable anchor ids; link the term to its
      // in-page fragment when one exists (AR blocks have no ids to reuse).
      // `setUrl` already carries the `?lang=ar` suffix for the AR locale.
      if (t.id) {
        term.url = `${setUrl}#${t.id}`;
      }
      return term;
    });

  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': setId,
    name,
    description,
    url: setUrl,
    inLanguage: locale,
    hasDefinedTerm,
  };
}

/**
 * Inject (or replace) the glossary `DefinedTermSet` JSON-LD in `doc.head`.
 * Idempotent by id, so a language toggle swaps the schema instead of stacking
 * duplicates. A schema with no terms is treated as a no-op.
 *
 * @param {Document} [doc]
 * @param {object} schema  DefinedTermSet object from {@link buildGlossaryTermSetSchema}
 * @param {string} [id]
 * @returns {Element|null} the injected `<script>` node, or null on no-op
 */
export function injectGlossarySchema(doc = document, schema, id = GLOSSARY_SCHEMA_ID) {
  if (!schema || !Array.isArray(schema.hasDefinedTerm) || schema.hasDefinedTerm.length === 0) {
    return null;
  }
  const existing = doc.getElementById(id);
  if (existing) existing.remove();

  const script = doc.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(schema);
  doc.head.appendChild(script);
  return script;
}

/**
 * Convenience: collect the active-locale terms from the DOM, build the
 * `DefinedTermSet`, and inject it. Returns the injected script node (or null
 * when there are no terms to describe).
 *
 * @param {Document} [doc]
 * @param {'en'|'ar'} [lang]
 * @param {{name?: string, description?: string}} [meta]  Localized set label.
 * @returns {Element|null}
 */
export function syncGlossarySchema(doc = document, lang = 'en', meta = {}) {
  const terms = collectGlossaryTerms(doc, lang);
  if (!terms.length) return null;
  const schema = buildGlossaryTermSetSchema(terms, lang, meta);
  return injectGlossarySchema(doc, schema);
}
