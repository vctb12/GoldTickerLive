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

const T = {
  en: {
    docTitle: 'Data Sources & Methodology | Gold Ticker Live',
    'method-hero-tag': 'Transparency & Trust',
    'method-h1': 'Data Sources & Methodology',
    'method-sub':
      'How we calculate every price you see — step by step, with full source attribution.',
    'overview-p3':
      'Historical views can mix live snapshots, browser cache checkpoints, and longer daily or monthly reference history. The tracker labels that resolution so monthly baselines are never presented as exact intraday history.',
    'fx-rates-update-p2':
      'Gold spot freshness and FX freshness do not always update at the same speed, so the tracker and exports label each layer separately.',
    'fallback-export-p':
      'CSV and JSON exports include generated timestamps, source notes, data-resolution context, and a reminder that values are reference prices rather than shop quotes.',
    'method-toc-label': 'Sections',
    'toc-overview': 'Overview',
    'toc-gold-data': 'Gold Price Data',
    'toc-fx-rates': 'FX Rates',
    'toc-aed-peg': 'AED Peg',
    'toc-karat': 'Karat Conversion',
    'toc-not-included': "What We Don't Include",
    'toc-fallback': 'Fallback & Reliability',
    'toc-disclaimer': 'Disclaimer',
    'overview-h2': 'Overview',
    'gold-data-h2': 'Gold Price Data',
    'gold-data-source-h3': 'Source',
    'gold-data-update-h3': 'Update Frequency',
    'gold-data-cache-h3': 'Caching',
    'gold-data-freshness-h3': 'Freshness Indicator',
    'fx-rates-h2': 'Foreign Exchange Rates',
    'fx-rates-source-h3': 'Source',
    'fx-rates-update-h3': 'Update Frequency',
    'aed-peg-h2': 'The AED Fixed Peg (Special Case)',
    'aed-peg-approach-h3': 'Our Approach',
    'aed-peg-effect-p':
      'This means the USD→AED conversion step itself carries no exchange-rate uncertainty — because the peg has held since 1997, the hardcoded value is more reliable than a free-tier API rate for that one step. The AED gold price is still only as fresh and accurate as the XAU/USD spot input it is built on, which is why every AED figure keeps a freshness label and remains a reference estimate, not a guaranteed price.',
    'karat-h2': 'Karat Conversion',
    'karat-formula-h3': 'The Price Formula',
    'not-included-h2': 'What Our Prices Are Not',
    'fallback-h2': 'Data Fallback & Reliability',
    'fallback-stale-h3': 'Stale Data Handling',
    'fallback-offline-h3': 'Offline Mode',
    'disclaimer-h2': 'Disclaimer',
  },
  ar: {
    docTitle: 'مصادر البيانات والمنهجية | Gold Ticker Live',
    'method-hero-tag': 'الشفافية والثقة',
    'method-h1': 'مصادر البيانات والمنهجية',
    'method-sub': 'كيف نحسب كل سعر تراه — خطوة بخطوة، مع الإسناد الكامل للمصادر.',
    'overview-p3':
      'قد تمزج العروض التاريخية بين اللقطات المباشرة ونقاط التخزين في المتصفح والسجل المرجعي اليومي أو الشهري للنطاقات الأطول. يوضّح المتتبع هذه الدقة حتى لا يظهر الخط الأساسي الشهري وكأنه سجل لحظي دقيق.',
    'fx-rates-update-p2':
      'لا تتحرك حداثة سعر الذهب وحداثة الصرف بالسرعة نفسها دائماً، لذلك يضع المتتبع وملفات التصدير وسمًا مستقلاً لكل طبقة.',
    'fallback-export-p':
      'تتبع ملفات CSV وJSON هذا الوضوح نفسه، إذ تتضمن وقت الإنشاء وملاحظات المصدر وسياق دقة البيانات وتذكيراً بأن القيم مرجعية وليست أسعار محلات.',
    'method-toc-label': 'الأقسام',
    'toc-overview': 'نظرة عامة',
    'toc-gold-data': 'بيانات سعر الذهب',
    'toc-fx-rates': 'أسعار الصرف',
    'toc-aed-peg': 'ربط الدرهم',
    'toc-karat': 'تحويل العيار',
    'toc-not-included': 'ما لا تشمله الأسعار',
    'toc-fallback': 'النسخ الاحتياطي والموثوقية',
    'toc-disclaimer': 'إخلاء المسؤولية',
    'overview-h2': 'نظرة عامة',
    'gold-data-h2': 'بيانات أسعار الذهب',
    'gold-data-source-h3': 'المصدر',
    'gold-data-update-h3': 'معدّل التحديث',
    'gold-data-cache-h3': 'التخزين المؤقت',
    'gold-data-freshness-h3': 'مؤشّر الحداثة',
    'fx-rates-h2': 'أسعار صرف العملات',
    'fx-rates-source-h3': 'المصدر',
    'fx-rates-update-h3': 'معدّل التحديث',
    'aed-peg-h2': 'ربط الدرهم الثابت (حالة خاصة)',
    'aed-peg-approach-h3': 'نهجنا',
    'aed-peg-effect-p':
      'هذا يعني أن خطوة التحويل من الدولار إلى الدرهم لا تحمل عدم يقين في سعر الصرف — وبما أن الربط ثابت منذ 1997، فالقيمة المُثبتة في الكود أكثر موثوقية من سعر واجهة برمجية مجانية لتلك الخطوة وحدها. ومع ذلك، يبقى سعر الذهب بالدرهم بقدر حداثة ودقة مدخل XAU/USD الذي يُبنى عليه، ولذلك يحتفظ كل رقم بالدرهم بوسم الحداثة ويبقى تقديراً مرجعياً وليس سعراً مضموناً.',
    'karat-h2': 'تحويل العيار',
    'karat-formula-h3': 'معادلة السعر',
    'not-included-h2': 'ما لا تمثّله أسعارنا',
    'fallback-h2': 'احتياطي البيانات والموثوقية',
    'fallback-stale-h3': 'معالجة البيانات القديمة',
    'fallback-offline-h3': 'وضع عدم الاتصال',
    'disclaimer-h2': 'إخلاء المسؤولية',
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
  // Load saved language preference
  const saved = localStorage.getItem('gp_pref_lang');
  if (saved === 'ar' || saved === 'en') STATE.lang = saved;

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
