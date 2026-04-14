/**
 * Terms of Service page entry point.
 * Injects shared nav/footer and wires language toggle.
 */

import { injectNav, updateNavLang } from '../components/nav.js';
import { injectFooter } from '../components/footer.js';
import { injectTicker, updateTickerLang } from '../components/ticker.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';

const STATE = { lang: 'en' };

const T = {
  en: {
    'legal-hero-tag': 'Legal',
    'legal-h1': 'Terms of Service',
    'legal-sub': 'Please read these terms carefully before using GoldPrices.app.',
    'legal-toc-label': 'Sections',
    'toc-acceptance': 'Acceptance',
    'toc-service': 'The Service',
    'toc-disclaimer': 'Disclaimer',
    'toc-data': 'Data & Sources',
    'toc-use': 'Acceptable Use',
    'toc-ip': 'Intellectual Property',
    'toc-liability': 'Liability',
    'toc-changes': 'Changes',
    'toc-contact': 'Contact',
    'meta-effective-label': 'Effective:',
    'meta-updated-label': 'Last updated:',
    'meta-lang-label': 'Also available in:',
  },
  ar: {
    'legal-hero-tag': 'قانوني',
    'legal-h1': 'شروط الخدمة',
    'legal-sub': 'يرجى قراءة هذه الشروط بعناية قبل استخدام GoldPrices.app.',
    'legal-toc-label': 'الأقسام',
    'toc-acceptance': 'القبول',
    'toc-service': 'الخدمة',
    'toc-disclaimer': 'إخلاء المسؤولية',
    'toc-data': 'البيانات والمصادر',
    'toc-use': 'الاستخدام المقبول',
    'toc-ip': 'الملكية الفكرية',
    'toc-liability': 'المسؤولية',
    'toc-changes': 'التغييرات',
    'toc-contact': 'التواصل',
    'meta-effective-label': 'تاريخ السريان:',
    'meta-updated-label': 'آخر تحديث:',
    'meta-lang-label': 'متاح أيضًا بـ:',
  },
};

function t(key) {
  return T[STATE.lang]?.[key] ?? T.en[key] ?? key;
}

function applyLanguage() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  Object.keys(T.en).forEach((key) => {
    const el = document.getElementById(key);
    if (el) el.textContent = t(key);
  });
}

function init() {
  const saved = localStorage.getItem('gp_pref_lang');
  if (saved === 'ar' || saved === 'en') STATE.lang = saved;

  const navCtrl = injectNav(STATE.lang, 0);
  injectBreadcrumbs('terms');
  navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      localStorage.setItem('gp_pref_lang', STATE.lang);
      updateNavLang(STATE.lang);
      updateTickerLang(STATE.lang);
      applyLanguage();
    });
  });
  injectFooter(STATE.lang, 0);
  injectTicker(STATE.lang, 0);

  applyLanguage();
}

document.addEventListener('DOMContentLoaded', init);
