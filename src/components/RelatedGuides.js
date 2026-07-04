import { el } from '../lib/safe-dom.js';

const GUIDES_EN = [
  {
    href: '/learn.html#faq',
    title: 'GCC gold buying guide',
    desc: 'Weights, karats, and shop checklist',
  },
  {
    href: '/learn.html#pricing',
    title: 'Spot vs retail',
    desc: 'Why shop quotes differ from reference',
  },
  { href: '/learn.html#pricing', title: 'Making charges', desc: 'Fees shops add on top of spot' },
  { href: '/learn.html#karats', title: '24K vs 22K vs 18K', desc: 'Purity and resale value' },
];

const GUIDES_AR = [
  {
    href: '/learn.html?lang=ar#faq',
    title: 'دليل شراء الذهب في الخليج',
    desc: 'الأوزان والعيارات وقائمة التحقق',
  },
  {
    href: '/learn.html?lang=ar#pricing',
    title: 'السعر الفوري مقابل التجزئة',
    desc: 'لماذا تختلف أسعار المحلات',
  },
  {
    href: '/learn.html?lang=ar#pricing',
    title: 'رسوم المصنعية',
    desc: 'ما تضيفه المحلات فوق السعر المرجعي',
  },
  {
    href: '/learn.html?lang=ar#karats',
    title: '24 مقابل 22 مقابل 18',
    desc: 'النقاء وقيمة إعادة البيع',
  },
];

/**
 * @param {{ lang?: 'en'|'ar', heading?: string }} [options]
 */
export function renderRelatedGuides(options = {}) {
  const lang = options.lang === 'ar' ? 'ar' : 'en';
  const items = lang === 'ar' ? GUIDES_AR : GUIDES_EN;
  const heading = options.heading ?? (lang === 'ar' ? 'أدلة ذات صلة' : 'Related guides');

  const list = el(
    'ul',
    { class: 'related-guides-list' },
    items.map((item) =>
      el('li', { class: 'related-guides-item' }, [
        el('a', { href: item.href, class: 'related-guides-link' }, [
          el('strong', null, item.title),
          el('span', { class: 'related-guides-desc' }, item.desc),
        ]),
      ])
    )
  );

  return el(
    'section',
    { class: 'related-guides card card--bordered', 'aria-labelledby': 'related-guides-heading' },
    [el('h2', { id: 'related-guides-heading', class: 'related-guides-title' }, heading), list]
  );
}

/**
 * Mount related guides before footer inside `main` when slot exists or at end of main.
 */
export function mountRelatedGuides(options = {}) {
  const slot = document.getElementById('related-guides-slot');
  const node = renderRelatedGuides(options);
  if (slot) {
    slot.replaceChildren(node);
    return;
  }
  const main = document.querySelector('main');
  if (main) main.appendChild(node);
}
