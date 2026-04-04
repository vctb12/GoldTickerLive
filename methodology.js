/**
 * Methodology page entry point.
 * Injects shared nav/footer and wires language toggle.
 */

import * as cache from './lib/cache.js';
import { injectNav, updateNavLang } from './components/nav.js';
import { injectFooter } from './components/footer.js';
import { injectTicker, updateTickerLang } from './components/ticker.js';
import { injectBreadcrumbs } from './components/breadcrumbs.js';

const STATE = { lang: 'en' };

const T = {
  en: {
    'method-hero-tag':   'Transparency & Trust',
    'method-h1':         'Data Sources & Methodology',
    'method-sub':        'How we calculate every price you see — step by step, with full source attribution.',
    'method-toc-label':  'Sections',
    'toc-overview':      'Overview',
    'toc-gold-data':     'Gold Price Data',
    'toc-fx-rates':      'FX Rates',
    'toc-aed-peg':       'AED Peg',
    'toc-karat':         'Karat Conversion',
    'toc-not-included':  "What We Don't Include",
    'toc-fallback':      'Fallback & Reliability',
    'toc-disclaimer':    'Disclaimer',
  },
  ar: {
    'method-hero-tag':   'الشفافية والثقة',
    'method-h1':         'مصادر البيانات والمنهجية',
    'method-sub':        'كيف نحسب كل سعر تراه — خطوة بخطوة، مع الإسناد الكامل للمصادر.',
    'method-toc-label':  'الأقسام',
    'toc-overview':      'نظرة عامة',
    'toc-gold-data':     'بيانات سعر الذهب',
    'toc-fx-rates':      'أسعار الصرف',
    'toc-aed-peg':       'ربط الدرهم',
    'toc-karat':         'تحويل العيار',
    'toc-not-included':  'ما لا تشمله الأسعار',
    'toc-fallback':      'النسخ الاحتياطي والموثوقية',
    'toc-disclaimer':    'إخلاء المسؤولية',
  },
};

function t(key) {
  return T[STATE.lang]?.[key] ?? T.en[key] ?? key;
}

function applyLanguage() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  Object.keys(T.en).forEach(key => {
    const el = document.getElementById(key);
    if (el) el.textContent = t(key);
  });
}

function init() {
  // Load saved language preference
  const saved = localStorage.getItem('gp_pref_lang');
  if (saved === 'ar' || saved === 'en') STATE.lang = saved;

  const navCtrl = injectNav(STATE.lang, 0);
  injectBreadcrumbs('methodology');
  navCtrl.getLangToggleButtons().forEach(btn => {
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
