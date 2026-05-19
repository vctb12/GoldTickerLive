import { el } from '../lib/safe-dom.js';
import { getMarketStatus } from '../lib/live-status.js';

export function renderMarketStatusPanel({
  lang = 'en',
  now = new Date(),
  className = '',
  t = (key) => key,
} = {}) {
  const market = getMarketStatus(now);
  const title = market.isOpen ? t('marketStatus.openTitle') : t('marketStatus.closedTitle');
  const body = market.isOpen ? t('marketStatus.openBody') : t('marketStatus.closedBody');
  const note = t('marketStatus.note');
  return el(
    'section',
    {
      class: `market-status-panel market-status-panel--${market.isOpen ? 'open' : 'closed'}${
        className ? ` ${className}` : ''
      }`,
      role: 'status',
      'aria-live': 'polite',
      dataset: { market: market.isOpen ? 'open' : 'closed', lang },
    },
    [
      el('h3', { class: 'market-status-panel__title' }, title),
      el('p', { class: 'market-status-panel__body' }, body),
      el('p', { class: 'market-status-panel__note' }, note),
    ]
  );
}
