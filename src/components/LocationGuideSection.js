import { el } from '../lib/safe-dom.js';
import guides from '../data/location-guides.json' with { type: 'json' };

function pickText(item, lang, enKey, arKey) {
  return lang === 'ar' ? item[arKey] || item[enKey] : item[enKey] || item[arKey];
}

export function renderLocationGuideSection({ lang = 'en', t = (key) => key, className = '' } = {}) {
  const cards = guides.map((guide) => {
    const checklist = lang === 'ar' ? guide.checklistAr || [] : guide.checklistEn || [];
    return el('article', { class: 'location-guide-card' }, [
      el('h3', { class: 'location-guide-card__title' }, pickText(guide, lang, 'city', 'cityAr')),
      el('p', { class: 'location-guide-card__karats' }, [
        `${t('locationGuides.commonKarats')}: `,
        (guide.commonKarats || []).join(' · '),
      ]),
      el(
        'p',
        { class: 'location-guide-card__context' },
        pickText(guide, lang, 'buyingHabitsEn', 'buyingHabitsAr')
      ),
      el(
        'h4',
        { class: 'location-guide-card__checklist-title' },
        `${pickText(guide, lang, 'city', 'cityAr')} — ${t('locationGuides.checklistTitle')}`
      ),
      el(
        'ul',
        { class: 'location-guide-card__checklist' },
        checklist.map((item) => el('li', null, item))
      ),
      el('div', { class: 'location-guide-card__links' }, [
        el('a', { href: 'tracker.html' }, t('locationGuides.linkTracker')),
        el('a', { href: 'calculator.html' }, t('locationGuides.linkCalculator')),
        el('a', { href: 'methodology.html' }, t('locationGuides.linkMethodology')),
      ]),
    ]);
  });

  return el(
    'section',
    {
      class: `location-guides-section${className ? ` ${className}` : ''}`,
      id: 'location-guides',
      'aria-labelledby': 'location-guides-title',
    },
    [
      el('div', { class: 'section-intro' }, [
        el(
          'h2',
          { id: 'location-guides-title', class: 'home-section-title' },
          t('locationGuides.title')
        ),
        el('p', { class: 'home-section-sub' }, t('locationGuides.sub')),
      ]),
      el('div', { class: 'location-guides-grid' }, cards),
    ]
  );
}
