/**
 * Gold Glossary page entry point.
 *
 * The glossary content is authored as static, bilingual HTML in glossary.html
 * (twin `data-lang-block` en/ar blocks toggled purely by CSS on `html[lang]`),
 * so it renders fully with zero JavaScript. This entry mounts the shared shell,
 * breadcrumbs and language toggle, localizes the hero + jump-nav, and layers on
 * a progressive-enhancement toolbar: a bilingual, Arabic-normalized search
 * filter, an A–Z index built from the live DOM, and an honest result count.
 * Filtering only toggles CSS classes — no term is ever removed from the DOM, so
 * the DefinedTermSet schema and the static term list stay intact.
 */

import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { syncGlossarySchema } from '../seo/glossary-schema.js';
import * as cache from '../lib/cache.js';
import { initPageEnter } from '../lib/page-enter.js';

const STATE = { lang: 'en', query: '', letter: null };

const T = {
  en: {
    'glossary-h1': 'Gold Glossary',
    'glossary-sub':
      'Plain-English definitions of the gold pricing, purity, product and market terms used across Gold Ticker Live.',
    'glossary-jump-label': 'Jump to a section',
    docTitle: 'Gold Glossary — Key Terms Explained | Gold Ticker Live',
    eyebrow: 'Reference',
    searchPlaceholder: 'Search terms — e.g. spot, karat, tola',
    searchLabel: 'Search glossary terms',
    clearLabel: 'Clear search',
    azLabel: 'Filter by first letter',
    azAll: 'All',
    noResults: 'No terms match your search. Try another word.',
    unitTerm: 'term',
    unitTerms: 'terms',
    ofWord: 'of',
  },
  ar: {
    'glossary-h1': 'مسرد مصطلحات الذهب',
    'glossary-sub':
      'تعريفات مبسّطة لمصطلحات تسعير الذهب ونقاوته ومنتجاته وأسواقه المستخدمة في Gold Ticker Live.',
    'glossary-jump-label': 'الانتقال إلى قسم',
    docTitle: 'مسرد مصطلحات الذهب — شرح المصطلحات الرئيسية | Gold Ticker Live',
    eyebrow: 'مرجع',
    searchPlaceholder: 'ابحث في المصطلحات — مثل: فوري، عيار، تولة',
    searchLabel: 'ابحث في مصطلحات المسرد',
    clearLabel: 'مسح البحث',
    azLabel: 'التصفية بالحرف الأول',
    azAll: 'الكل',
    noResults: 'لا توجد مصطلحات تطابق بحثك. جرّب كلمة أخرى.',
    unitTerm: 'مصطلح',
    unitTerms: 'مصطلحاً',
    ofWord: 'من',
  },
};

function t(key) {
  return T[STATE.lang]?.[key] ?? T.en[key] ?? key;
}

/**
 * Arabic-aware normalization for search + A–Z (mirrors the site search engine):
 * lowercase, strip tatweel + harakat, unify alef/hamza carriers, taa-marbuta,
 * and alef-maqsura, and collapse whitespace. Deterministic + side-effect free.
 * @param {string} s
 */
function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[ـ]/g, '') // tatweel
    .replace(/[ً-ْٰ]/g, '') // harakat / superscript alef
    .replace(/[آأإٱ]/g, 'ا') // آأإٱ → ا
    .replace(/ة/g, 'ه') // ة → ه
    .replace(/ى/g, 'ي') // ى → ي
    .replace(/[ؤئ]/g, '') // ؤئ hamza carriers → drop hamza
    .replace(/\s+/g, ' ')
    .trim();
}

/** First significant grapheme of a term name, normalized + uppercased (Latin). */
function initialOf(name) {
  const n = normalize(name).replace(/^[^\p{L}\p{N}]+/u, '');
  return n ? n[0].toUpperCase() : '';
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

// SVG magnifier built without innerHTML (repo forbids trusted-HTML sinks).
function magnifier() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'gloss-search-ico');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const circle = document.createElementNS(NS, 'circle');
  circle.setAttribute('cx', '11');
  circle.setAttribute('cy', '11');
  circle.setAttribute('r', '7');
  const line = document.createElementNS(NS, 'line');
  line.setAttribute('x1', '21');
  line.setAttribute('y1', '21');
  line.setAttribute('x2', '16.65');
  line.setAttribute('y2', '16.65');
  svg.append(circle, line);
  return svg;
}

let ui = null; // cached toolbar element refs

function buildToolbar() {
  const hero = document.querySelector('.glossary-hero');
  const main = document.getElementById('main-content');
  if (!hero || !main || document.querySelector('.gloss-toolbar')) return;

  // Hero eyebrow (kept out of static HTML so the no-JS hero stays minimal).
  const inner = hero.querySelector('.glossary-hero-inner');
  const h1 = document.getElementById('glossary-h1');
  if (inner && h1 && !inner.querySelector('.glossary-eyebrow')) {
    inner.insertBefore(el('p', { class: 'glossary-eyebrow', id: 'glossary-eyebrow' }), h1);
  }

  const input = el('input', {
    type: 'search',
    class: 'gloss-search-input',
    id: 'gloss-search-input',
    autocomplete: 'off',
    autocapitalize: 'none',
    spellcheck: 'false',
    'aria-controls': 'main-content',
  });
  const clearBtn = el('button', { type: 'button', class: 'gloss-search-clear', 'aria-label': '' }, '×');
  const field = el('div', { class: 'gloss-search-field' }, [magnifier(), input]);
  const search = el('div', { class: 'gloss-search' }, [field, clearBtn]);
  const count = el('p', { class: 'gloss-count', id: 'gloss-count', role: 'status', 'aria-live': 'polite' });
  const az = el('div', { class: 'gloss-az', id: 'gloss-az', role: 'group', 'aria-label': '' });
  const toolbar = el('div', { class: 'gloss-toolbar', role: 'search' }, [search, count, az]);

  hero.after(toolbar);

  // Honest empty state, before the footer.
  const foot = document.querySelector('.glossary-foot');
  const empty = el('p', { class: 'gloss-empty', id: 'gloss-empty', role: 'status', 'aria-live': 'polite' });
  if (foot) foot.before(empty);
  else main.append(empty);

  input.addEventListener('input', () => {
    STATE.query = input.value;
    STATE.letter = null;
    applyFilter();
  });
  clearBtn.addEventListener('click', () => {
    STATE.query = '';
    STATE.letter = null;
    input.value = '';
    applyFilter();
    input.focus();
  });

  ui = { toolbar, input, clearBtn, count, az, empty };
  localizeToolbar();
  applyFilter();
}

function localizeToolbar() {
  if (!ui) return;
  const eye = document.getElementById('glossary-eyebrow');
  if (eye) eye.textContent = t('eyebrow');
  ui.input.setAttribute('placeholder', t('searchPlaceholder'));
  ui.input.setAttribute('aria-label', t('searchLabel'));
  ui.clearBtn.setAttribute('aria-label', t('clearLabel'));
  ui.az.setAttribute('aria-label', t('azLabel'));
  ui.empty.textContent = t('noResults');
  buildAzRail();
}

function activeTerms() {
  return [...document.querySelectorAll(`[data-lang-block="${STATE.lang}"] .gloss-term`)];
}

function buildAzRail() {
  if (!ui) return;
  const letters = [...new Set(activeTerms().map((n) => initialOf(n.querySelector('.gloss-term-name')?.textContent)))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, STATE.lang === 'ar' ? 'ar' : 'en'));

  ui.az.replaceChildren();
  const all = el('button', { type: 'button', class: 'gloss-az-btn', 'data-letter': '' }, t('azAll'));
  all.addEventListener('click', () => {
    STATE.letter = null;
    STATE.query = '';
    ui.input.value = '';
    applyFilter();
  });
  ui.az.append(all);
  for (const L of letters) {
    const b = el('button', { type: 'button', class: 'gloss-az-btn', 'data-letter': L }, L);
    b.addEventListener('click', () => {
      STATE.letter = STATE.letter === L ? null : L;
      STATE.query = '';
      ui.input.value = '';
      applyFilter();
    });
    ui.az.append(b);
  }
}

function makeCount(shown, total) {
  const frag = document.createDocumentFragment();
  const strong = (n) => el('strong', {}, String(n));
  if (shown === total) {
    frag.append(strong(total), ' ', total === 1 ? t('unitTerm') : t('unitTerms'));
  } else {
    frag.append(strong(shown), ' ', t('ofWord'), ' ', strong(total), ' ', t('unitTerms'));
  }
  return frag;
}

function applyFilter() {
  if (!ui) return;
  const nq = normalize(STATE.query);
  const terms = activeTerms();
  const total = terms.length;
  let shown = 0;

  for (const term of terms) {
    const name = term.querySelector('.gloss-term-name')?.textContent || '';
    const def = term.querySelector('.gloss-term-def')?.textContent || '';
    const hay = normalize(`${name} ${def}`);
    let match = true;
    if (nq) match = hay.includes(nq);
    if (match && STATE.letter) match = initialOf(name) === STATE.letter;
    term.classList.toggle('is-filtered', !match);
    if (match) shown += 1;
  }

  // Hide a group only when its ACTIVE-language terms are all filtered out.
  for (const group of document.querySelectorAll('.gloss-group')) {
    const groupTerms = group.querySelectorAll(`[data-lang-block="${STATE.lang}"] .gloss-term`);
    const anyVisible = [...groupTerms].some((tn) => !tn.classList.contains('is-filtered'));
    group.classList.toggle('is-empty', groupTerms.length > 0 && !anyVisible);
  }

  const filtering = !!nq || !!STATE.letter;
  ui.clearBtn.classList.toggle('is-shown', filtering);
  ui.empty.classList.toggle('is-shown', shown === 0);
  ui.count.replaceChildren(makeCount(shown, total));

  for (const btn of ui.az.querySelectorAll('.gloss-az-btn')) {
    const isAll = btn.getAttribute('data-letter') === '';
    btn.setAttribute('aria-pressed', String(isAll ? !filtering : btn.getAttribute('data-letter') === STATE.letter));
  }
}

function applyLang() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  ['glossary-h1', 'glossary-sub', 'glossary-jump-label'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = t(id);
  });
  document.title = t('docTitle');

  // Re-localize + rebuild the toolbar/A–Z for the new language, preserving the
  // query, then re-run the filter so counts and visibility stay in sync.
  if (ui) {
    localizeToolbar();
    applyFilter();
  }

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

  buildToolbar();
  applyLang();
}

init();
