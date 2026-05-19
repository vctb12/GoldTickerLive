import { el } from '../lib/safe-dom.js';

export function renderExportHelpTips({ t = (key) => key } = {}) {
  return el(
    'section',
    { class: 'tracker-addon-card', 'aria-labelledby': 'tracker-export-help-title' },
    [
      el('h3', { id: 'tracker-export-help-title' }, t('trackerAddons.exportHelp.title')),
      el('ul', { class: 'tracker-addon-list' }, [
        el('li', null, t('trackerAddons.exportHelp.tip1')),
        el('li', null, t('trackerAddons.exportHelp.tip2')),
        el('li', null, t('trackerAddons.exportHelp.tip3')),
      ]),
    ]
  );
}
