/**
 * Gold Glossary page entry point.
 *
 * The glossary content is authored as static, bilingual HTML in glossary.html
 * (twin `data-lang-block` en/ar blocks toggled purely by CSS on `html[lang]`),
 * so it renders with zero JavaScript. This entry only mounts the shared shell,
 * breadcrumbs, and the language toggle, and localizes the hero + jump-nav.
 */

import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { syncGlossarySchema } from '../seo/glossary-schema.js';
import * as cache from '../lib/cache.js';
import { initPageEnter } from '../lib/page-enter.js';

const STATE = { lang: 'en' };

const T = {
  en: {
    'glossary-h1': 'Gold Glossary',
    'glossary-sub':
      'Plain-English definitions of the gold pricing, purity, product and market terms used across Gold Ticker Live.',
    'glossary-jump-label': 'Jump to a section',
    docTitle: 'Gold Glossary — Key Terms Explained | Gold Ticker Live',
  },
  ar: {
    'glossary-h1': 'مسرد مصطلحات الذهب',
    'glossary-sub':
      'تعريفات مبسّطة لمصطلحات تسعير الذهب ونقاوته ومنتجاته وأسواقه المستخدمة في Gold Ticker Live.',
    'glossary-jump-label': 'الانتقال إلى قسم',
    docTitle: 'مسرد مصطلحات الذهب — شرح المصطلحات الرئيسية | Gold Ticker Live',
  },
};

function t(key) {
  return T[STATE.lang]?.[key] ?? T.en[key] ?? key;
}

function applyLang() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  ['glossary-h1', 'glossary-sub', 'glossary-jump-label'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = t(id);
  });
  document.title = t('docTitle');

  // Emit DefinedTermSet JSON-LD for the ACTIVE locale, built from the same DOM
  // terms the reader sees, so EN and AR stay in parity. Idempotent by id, so a
  // language toggle swaps the schema rather than stacking duplicates. The
  // existing static BreadcrumbList JSON-LD is untouched.
  syncGlossarySchema(document, STATE.lang, {
    name: t('glossary-h1'),
    description: t('glossary-sub'),
  });
}

function init() {
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'ar' || urlLang === 'en') STATE.lang = urlLang;
  else if (cache.getPreference('lang') === 'ar') STATE.lang = 'ar';

  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  const shell = mountSharedShell({ lang: STATE.lang, depth: 0 });
  initPageEnter('#main-content');
  injectBreadcrumbs('glossary');

  shell.navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      shell.updateLang(STATE.lang);
      applyLang();
    });
  });

  applyLang();
}

init();
