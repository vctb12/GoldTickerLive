/**
 * Learn page entry point.
 * Mounts shared shell and renders learn-hub article content from the shared model.
 */

import * as cache from '../lib/cache.js';
import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { getArticle } from '../learn-hub/content-registry.js';
import { renderArticle } from '../learn-hub/article-renderer.js';

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

  const article = getArticle('learn');
  const renderer =
    article &&
    renderArticle({
      article,
      language: STATE.lang,
      articleContainer: '#learn-article-root',
      tocContainer: '#learn-toc-root',
    });

  navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      STATE.lang = normalizeLang(STATE.lang);
      cache.savePreference('lang', STATE.lang);
      shell.updateLang(STATE.lang);
      applyLang(renderer);
      scrollToHashTarget();
    });
  });

  applyLang(renderer);
  scrollToHashTarget();
}

init();
