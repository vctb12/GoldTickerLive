/**
 * Runtime structured-data helper for the learn hub guide.
 *
 * The build-time injector (`scripts/node/inject-schema.js`) emits an English-only
 * Article for learn.html, but the guide is bilingual and Arabic is a runtime
 * `?lang=ar` toggle on the same document — so the head Article stays English on
 * the Arabic view. This helper rebuilds the Article JSON-LD from the SAME shared
 * content model that renders the guide (`LEARN_ARTICLE` + `resolveLearnHubText`)
 * and injects the correct-language version at runtime, keeping EN/AR parity.
 *
 * It replaces (never stacks) the existing Article block, so exactly one Article
 * schema is present at any time. BreadcrumbList and the FAQPage microdata that
 * the renderer already emits are left untouched — no duplicate schema.
 *
 * Mirrors the shape/idempotency contract of `src/seo/faq-schema.js`.
 */

import { SITE } from '../config/site.js';

/**
 * Build an Article JSON-LD object from the shared learn-hub article model.
 *
 * @param {Object} options
 * @param {Object} options.article       - the LEARN_ARTICLE model (or compatible)
 * @param {'en'|'ar'} [options.lang]      - target language
 * @param {Function} options.resolveText  - `(key, lang) => string` resolver (resolveLearnHubText)
 * @param {string} [options.url]          - canonical page URL
 * @returns {Object|null} Article schema, or null when inputs are insufficient
 */
export function buildLearnArticleSchema({ article, lang = 'en', resolveText, url } = {}) {
  if (!article || typeof resolveText !== 'function') return null;

  const language = lang === 'ar' ? 'ar' : 'en';
  const headline = resolveText(article.titleKey, language);
  // Prefer the factual answer summary (also shown on the page) as the
  // description so the structured data matches the visible lead block; fall
  // back to the subtitle for models without a summary.
  const description = article.summaryKey
    ? resolveText(article.summaryKey, language)
    : resolveText(article.subtitleKey, language);

  const meta = article.metadata || {};
  const datePublished = meta.datePublished || meta.lastUpdated;
  const dateModified = meta.lastUpdated || meta.datePublished;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url: url || `${SITE.url}/learn.html`,
    author: { '@type': 'Organization', name: SITE.name },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}${SITE.logoPath}`,
        width: 512,
        height: 512,
      },
    },
    inLanguage: language,
  };

  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;

  return schema;
}

/**
 * Inject (or atomically replace) the learn Article JSON-LD in the document head.
 *
 * Removes any prior copy of ours (by id) AND the build-time Article block (which
 * carries no id) so exactly one Article schema remains. BreadcrumbList and every
 * other schema type are preserved. A null schema is a no-op.
 *
 * @param {Document} [doc]
 * @param {Object|null} schema
 * @param {string} [id]
 * @returns {HTMLScriptElement|null} the injected script, or null on no-op
 */
export function injectLearnArticleSchema(doc = document, schema, id = 'learn-article-schema') {
  if (!schema || !doc) return null;
  const head = doc.head;
  if (!head) return null;

  const existing = doc.querySelectorAll
    ? doc.querySelectorAll('script[type="application/ld+json"]')
    : [];
  for (const node of Array.from(existing)) {
    if (node.id === id) {
      node.remove();
      continue;
    }
    let type = '';
    try {
      type = JSON.parse(node.textContent || '{}')['@type'];
    } catch {
      type = '';
    }
    if (type === 'Article') node.remove();
  }

  const script = doc.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(schema);
  head.appendChild(script);
  return script;
}
