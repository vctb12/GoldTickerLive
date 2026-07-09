/**
 * Learn page entry point.
 * Mounts shared shell and renders learn-hub article content from the shared model.
 * English static HTML in learn.html is preserved on first paint; JS enhances or
 * re-renders for Arabic / missing fallback.
 */

import * as cache from '../lib/cache.js';
import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { getArticle } from '../learn-hub/content-registry.js';
import { resolveLearnHubText } from '../learn-hub/content-model.js';
import { renderArticle } from '../learn-hub/article-renderer.js';
import { createTocRenderer } from '../learn-hub/toc-renderer.js';
import { mountLearnHubCatalog } from './learn-hub-ui.js';
import { initPageEnter } from '../lib/page-enter.js';
import { mountRelatedGuides } from '../components/RelatedGuides.js';
import { initInsightsFeed } from './insights/insights-feed.js';
import { buildLearnArticleSchema, injectLearnArticleSchema } from '../seo/learn-schema.js';
import { TRANSLATIONS } from '../config/index.js';

const STATE = {
  lang: 'en',
  goldPriceUsdPerOz: 0,
  rates: {},
  fxMeta: { nextUpdateUtc: 0 },
  status: { goldStale: false, fxStale: false },
  freshness: { goldUpdatedAt: null },
  favorites: [],
  history: [],
  activeTab: 'gcc',
  sortOrder: 'default',
  searchQuery: '',
  dayOpenGoldPriceUsdPerOz: 0,
  selectedKaratSpotlight: '22',
  selectedKaratCountries: '22',
  selectedUnitTable: 'gram',
};

function normalizeLang(value) {
  return value === 'ar' ? 'ar' : 'en';
}

function hasStaticFallback() {
  return document.getElementById('learn-article-root')?.dataset?.staticFallback === 'true';
}

function applyLang(renderer) {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  renderer?.setLanguage(STATE.lang);
}

function scrollToHashTarget() {
  if (!location.hash || location.hash.length < 2) return;
  const id = decodeURIComponent(location.hash.slice(1));
  const target = document.getElementById(id);
  if (!target) return;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
  });
}

function renderMissingArticle() {
  const root = document.getElementById('learn-article-root');
  if (!root) return;
  root.textContent = '';
  const message = document.createElement('p');
  message.className = 'learn-hub-missing-article';
  message.textContent =
    STATE.lang === 'ar'
      ? 'تعذّر تحميل محتوى مركز التعلّم حالياً. يرجى إعادة المحاولة بعد قليل.'
      : 'Learn Hub content is temporarily unavailable. Please try again shortly.';
  root.appendChild(message);
}

function mountArticleExperience(article) {
  if (!article) {
    applyLang(null);
    renderMissingArticle();
    console.error('[learn] Missing learn article model in learn-hub registry');
    return { renderer: null, toc: null };
  }

  if (hasStaticFallback() && STATE.lang === 'en') {
    const toc = createTocRenderer({
      article,
      language: STATE.lang,
      container: '#learn-toc-root',
    });
    toc.enhanceStatic();
    applyLang(null);
    return { renderer: null, toc };
  }

  const renderer = renderArticle({
    article,
    language: STATE.lang,
    articleContainer: '#learn-article-root',
    tocContainer: '#learn-toc-root',
  });
  applyLang(renderer);
  return { renderer, toc: null };
}

// Hub strings live in src/config/translations.js (bilingual policy) — the
// feed component owns its own search label internally.
function hubTx(lang, key) {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
}

// Keep the Article JSON-LD language-correct. The build-time injector emits an
// English-only Article; here we rebuild it from the shared learn model for the
// active language and atomically replace it (BreadcrumbList + FAQ microdata are
// left intact), so the Arabic view no longer advertises English structured data.
function syncArticleSchema(article, lang) {
  if (!article) return;
  const canonical =
    document.querySelector('link[rel="canonical"]')?.getAttribute('href') || undefined;
  const schema = buildLearnArticleSchema({
    article,
    lang,
    resolveText: resolveLearnHubText,
    url: canonical,
  });
  injectLearnArticleSchema(document, schema);
}

function applyInsightsHeading(lang) {
  const title = document.getElementById('insights-feed-heading');
  const sub = document.getElementById('insights-feed-sub');
  if (title) title.textContent = hubTx(lang, 'learn.insightsFeedTitle');
  if (sub) sub.textContent = hubTx(lang, 'learn.insightsFeedSub');
  document.querySelectorAll('[data-learn-tool]').forEach((node) => {
    node.textContent = hubTx(lang, `learn.tools.${node.getAttribute('data-learn-tool')}`);
  });
}

function init() {
  cache.loadState(STATE);

  const savedLang = cache.getPreference('lang');
  if (savedLang === 'ar' || savedLang === 'en') STATE.lang = savedLang;

  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'ar' || urlLang === 'en') STATE.lang = urlLang;
  STATE.lang = normalizeLang(STATE.lang);

  const shell = mountSharedShell({ lang: STATE.lang, depth: 0 });
  const navCtrl = shell.navCtrl;
  injectBreadcrumbs('learn');

  mountLearnHubCatalog({ lang: STATE.lang, container: '#learn-catalog-root' });
  const insightsFeed = initInsightsFeed(STATE.lang);
  applyInsightsHeading(STATE.lang);
  initPageEnter('#main-content');

  const article = getArticle('learn');
  let experience = mountArticleExperience(article);
  syncArticleSchema(article, STATE.lang);

  navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      shell.updateLang(STATE.lang);
      experience.toc?.destroy();
      experience = mountArticleExperience(article);
      syncArticleSchema(article, STATE.lang);
      mountLearnHubCatalog({ lang: STATE.lang, container: '#learn-catalog-root' });
      insightsFeed?.setLang(STATE.lang);
      applyInsightsHeading(STATE.lang);
      scrollToHashTarget();
    });
  });

  scrollToHashTarget();
  mountRelatedGuides({ lang: STATE.lang });
}

init();
