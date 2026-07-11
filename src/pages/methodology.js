/**
 * Methodology page entry point.
 * Injects shared nav/footer and wires language toggle.
 */

import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { initMethodologyLive } from './methodology-live.js';
import { initPageEnter } from '../lib/page-enter.js';
import { mountRelatedGuides } from '../components/RelatedGuides.js';

const STATE = { lang: 'en' };

// Local dict for the STRUCTURAL, text-only surfaces still driven by id + textContent:
// the hero (tag/h1/sub) and the sticky section nav (TOC). All rich body prose is
// authored bilingually in methodology.html as twin `data-lang-block` en/ar blocks
// toggled purely by CSS on html[lang='ar'] (see methodology-redesign.css) — so it is
// deliberately NOT duplicated here. Keys must stay identical across en/ar
// (tests/i18n-local-dict-parity.test.js enforces parity).
const T = {
  en: {
    docTitle: 'Data Sources & Methodology | Gold Ticker Live',
    'method-hero-tag': 'Transparency & Trust',
    'method-h1': 'Data Sources & Methodology',
    'method-sub':
      'How we calculate every price you see — step by step, with full source attribution.',
    'method-toc-label': 'Sections',
    'toc-overview': 'Overview',
    'toc-live-formula': 'Live formula',
    'toc-resolver': 'Canonical resolver',
    'toc-gold-data': 'Gold Price Data',
    'toc-fx-rates': 'FX Rates',
    'toc-aed-peg': 'AED Peg',
    'toc-karat': 'Karat Conversion',
    'toc-not-included': "What We Don't Include",
    'toc-fallback': 'Fallback & Reliability',
    'toc-tracker': 'Live Tracker exception',
    'toc-freshness-states': 'Freshness states',
    'toc-method-faq': 'FAQ',
    'toc-disclaimer': 'Disclaimer',
  },
  ar: {
    docTitle: 'مصادر البيانات والمنهجية | Gold Ticker Live',
    'method-hero-tag': 'الشفافية والثقة',
    'method-h1': 'مصادر البيانات والمنهجية',
    'method-sub': 'كيف نحسب كل سعر تراه — خطوة بخطوة، مع الإسناد الكامل للمصادر.',
    'method-toc-label': 'الأقسام',
    'toc-overview': 'نظرة عامة',
    'toc-live-formula': 'المعادلة المباشرة',
    'toc-resolver': 'المُحلِّل المرجعي',
    'toc-gold-data': 'بيانات سعر الذهب',
    'toc-fx-rates': 'أسعار الصرف',
    'toc-aed-peg': 'ربط الدرهم',
    'toc-karat': 'تحويل العيار',
    'toc-not-included': 'ما لا تشمله الأسعار',
    'toc-fallback': 'الاحتياطي والموثوقية',
    'toc-tracker': 'استثناء المتتبع',
    'toc-freshness-states': 'حالات الحداثة',
    'toc-method-faq': 'الأسئلة الشائعة',
    'toc-disclaimer': 'إخلاء المسؤولية',
  },
};

function t(key) {
  return T[STATE.lang]?.[key] ?? T.en[key] ?? key;
}

function applyLanguage() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  document.title = t('docTitle');
  Object.keys(T.en).forEach((key) => {
    // `docTitle` is a virtual key (no matching element id) — used only above.
    const el = document.getElementById(key);
    if (el) el.textContent = t(key);
  });
}

function init() {
  // Honor an explicit ?lang= first (matches home/content-page-boot precedence, so a
  // switcher/hreflang link like methodology.html?lang=ar renders Arabic on first load), then
  // fall back to the saved preference, then English.
  const urlLang = new URLSearchParams(location.search).get('lang');
  const saved = localStorage.getItem('gp_pref_lang');
  if (urlLang === 'ar' || urlLang === 'en') STATE.lang = urlLang;
  else if (saved === 'ar' || saved === 'en') STATE.lang = saved;

  const shell = mountSharedShell({ lang: STATE.lang, depth: 0 });
  const navCtrl = shell.navCtrl;
  injectBreadcrumbs('methodology');
  navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      localStorage.setItem('gp_pref_lang', STATE.lang);
      shell.updateLang(STATE.lang);
      applyLanguage();
      initMethodologyLive(STATE.lang);
    });
  });

  applyLanguage();
  initPageEnter('#main-content');
  mountRelatedGuides({ lang: STATE.lang });
  initMethodologyLive(STATE.lang);
}

document.addEventListener('DOMContentLoaded', init);
