import { el } from '../lib/safe-dom.js';
import { formatUtcTimestamp, getFreshnessMeta } from '../lib/freshness.js';

export function renderFreshnessBadge({
  lang = 'en',
  state = 'estimated',
  source = 'Gold Ticker Live',
  updatedAt = null,
  marketOpen = true,
  className = '',
  t = (key) => key,
} = {}) {
  const meta = getFreshnessMeta({ state, source, updatedAt, marketOpen });
  const badgeLabel = t(meta.translationKey);
  const sourcePrefix = t('freshness.sourceLabel');
  const updatedPrefix = t('freshness.updatedUtcLabel');

  return el(
    'div',
    {
      class: `freshness-badge freshness-badge--${meta.tone}${className ? ` ${className}` : ''}`,
      role: 'status',
      'aria-live': 'polite',
      dataset: { freshnessState: meta.state, freshnessTone: meta.tone },
    },
    [
      el('span', { class: 'freshness-badge__state' }, badgeLabel),
      el('span', { class: 'freshness-badge__dot', 'aria-hidden': 'true' }, '•'),
      el('span', { class: 'freshness-badge__source' }, `${sourcePrefix}: ${meta.source}`),
      el('span', { class: 'freshness-badge__dot', 'aria-hidden': 'true' }, '•'),
      el(
        'span',
        { class: 'freshness-badge__timestamp' },
        `${updatedPrefix}: ${formatUtcTimestamp(meta.updatedAt, lang)} UTC`
      ),
    ]
  );
}
