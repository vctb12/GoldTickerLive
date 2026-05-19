import { el } from '../lib/safe-dom.js';

export function renderTrackerCompareHints({ t = (key) => key } = {}) {
  return el(
    'section',
    { class: 'tracker-addon-card', 'aria-labelledby': 'tracker-compare-hints-title' },
    [
      el('h3', { id: 'tracker-compare-hints-title' }, t('trackerAddons.compareHints.title')),
      el('ul', { class: 'tracker-addon-list' }, [
        el('li', null, t('trackerAddons.compareHints.hint1')),
        el('li', null, t('trackerAddons.compareHints.hint2')),
        el('li', null, t('trackerAddons.compareHints.hint3')),
      ]),
    ]
  );
}
