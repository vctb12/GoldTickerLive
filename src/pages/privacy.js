/**
 * Privacy Policy page entry point.
 * Injects shared nav/footer and wires language toggle.
 */

import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';

const STATE = { lang: 'en' };

const T = {
  en: {
    'legal-hero-tag': 'Legal',
    'legal-h1': 'Privacy Policy',
    'legal-sub': 'How Gold Ticker Live handles your data and privacy.',
    'legal-toc-label': 'Sections',
    'toc-overview': 'Overview',
    'toc-data': 'Data Collected',
    'toc-storage': 'Local Storage',
    'toc-third': 'Third Parties',
    'toc-analytics': 'Analytics',
    'toc-rights': 'Your Rights',
    'toc-security': 'Security',
    'toc-children': 'Children',
    'toc-changes': 'Changes',
    'toc-contact': 'Contact',
    'meta-effective-label': 'Effective:',
    'meta-updated-label': 'Last updated:',
    'meta-lang-label': 'Also available in:',
  },
  ar: {
    'legal-hero-tag': 'قانوني',
    'legal-h1': 'سياسة الخصوصية',
    'legal-sub': 'كيف تتعامل Gold Ticker Live مع بياناتك وخصوصيتك.',
    'legal-toc-label': 'الأقسام',
    'toc-overview': 'نظرة عامة',
    'toc-data': 'البيانات المجمّعة',
    'toc-storage': 'التخزين المحلي',
    'toc-third': 'أطراف ثالثة',
    'toc-analytics': 'التحليلات',
    'toc-rights': 'حقوقك',
    'toc-security': 'الأمان',
    'toc-children': 'الأطفال',
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

  const shell = mountSharedShell({ lang: STATE.lang, depth: 0 });
  const navCtrl = shell.navCtrl;
  injectBreadcrumbs('privacy');
  navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      localStorage.setItem('gp_pref_lang', STATE.lang);
      shell.updateLang(STATE.lang);
      applyLanguage();
    });
  });

  applyLanguage();
}

document.addEventListener('DOMContentLoaded', init);
