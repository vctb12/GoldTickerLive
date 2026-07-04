/**
 * Dubai / UAE gold-rate landing page entry point.
 *
 * Content is authored as static, bilingual HTML in dubai-gold-price.html
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
    'dubai-eyebrow': 'UAE · Dubai gold rate',
    'dubai-h1': 'Gold Rate in Dubai & the UAE',
    'dubai-sub':
      'A spot-linked reference for the gold price in Dubai and across the UAE, in AED and USD — plus how the dirham peg, karats, making charges and VAT shape the number you actually pay at the counter.',
    'dubai-jump-label': 'Jump to a section',
    docTitle:
      'Gold Rate in Dubai & UAE — Price per Gram in AED (24K/22K/21K/18K) | Gold Ticker Live',
  },
  ar: {
    'dubai-eyebrow': 'الإمارات · سعر الذهب في دبي',
    'dubai-h1': 'سعر الذهب في دبي والإمارات',
    'dubai-sub':
      'مرجع مرتبط بالسعر الفوري لسعر الذهب في دبي وعبر الإمارات، بالدرهم والدولار — مع شرح كيف يشكّل ربط الدرهم والعيارات وأجور الصياغة وضريبة القيمة المضافة الرقم الذي تدفعه فعلاً.',
    'dubai-jump-label': 'الانتقال إلى قسم',
    docTitle: 'سعر الذهب في دبي والإمارات — سعر الجرام بالدرهم (24/22/21/18) | Gold Ticker Live',
  },
};

function t(key) {
  return T[STATE.lang]?.[key] ?? T.en[key] ?? key;
}

function applyLang() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  ['dubai-eyebrow', 'dubai-h1', 'dubai-sub', 'dubai-jump-label'].forEach((id) => {
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
  injectBreadcrumbs('dubai');

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
