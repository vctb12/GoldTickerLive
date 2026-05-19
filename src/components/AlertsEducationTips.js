import { el } from '../lib/safe-dom.js';

export function renderAlertsEducationTips({ t = (key) => key } = {}) {
  return el(
    'section',
    { class: 'tracker-addon-card', 'aria-labelledby': 'tracker-alerts-help-title' },
    [
      el('h3', { id: 'tracker-alerts-help-title' }, t('trackerAddons.alertsHelp.title')),
      el('ul', { class: 'tracker-addon-list' }, [
        el('li', null, t('trackerAddons.alertsHelp.tip1')),
        el('li', null, t('trackerAddons.alertsHelp.tip2')),
        el('li', null, t('trackerAddons.alertsHelp.tip3')),
      ]),
    ]
  );
}
