/**
 * Gold Market page entry point ("How gold is priced, spot to street").
 *
 * The explanatory content is authored as static, bilingual HTML in market.html
 * (twin `data-lang-block` en/ar blocks toggled purely by CSS on `html[lang]`),
 * so it renders with zero JavaScript. This entry only mounts the shared shell,
 * breadcrumbs, and the language toggle, and localizes the hero + jump-nav.
 */

import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import * as cache from '../lib/cache.js';
import { initPageEnter } from '../lib/page-enter.js';

const STATE = { lang: 'en' };

const T = {
  en: {
    'market-eyebrow': 'How gold pricing works',
    'market-h1': 'How gold is priced',
    'market-sub':
      'Follow a single global number — the spot price — as it becomes the figure on your local jeweller’s counter. This is the chain, the marketplaces behind it, and why retail rarely matches spot.',
    docTitle: 'How Gold Is Priced — Spot to Street | Gold Ticker Live',
  },
  ar: {
    'market-eyebrow': 'كيف يعمل تسعير الذهب',
    'market-h1': 'كيف يُسعَّر الذهب',
    'market-sub':
      'تابع رقماً عالمياً واحداً — السعر الفوري — وهو يتحوّل إلى الرقم المعروض على واجهة صائغك المحلي. هذه هي السلسلة، والأسواق الكامنة وراءها، ولماذا نادراً ما يطابق سعر التجزئة السعر الفوري.',
    docTitle: 'كيف يُسعَّر الذهب — من السوق العالمي إلى المحل | Gold Ticker Live',
  },
};

function t(key) {
  return T[STATE.lang]?.[key] ?? T.en[key] ?? key;
}

function applyLang() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  ['market-eyebrow', 'market-h1', 'market-sub'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = t(id);
  });
  document.title = t('docTitle');
}

function init() {
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'ar' || urlLang === 'en') STATE.lang = urlLang;
  else if (cache.getPreference('lang') === 'ar') STATE.lang = 'ar';

  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  const shell = mountSharedShell({ lang: STATE.lang, depth: 0 });
  initPageEnter('#main-content');
  injectBreadcrumbs('market');

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
