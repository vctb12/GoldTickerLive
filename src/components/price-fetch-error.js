/**
 * Inline empty state when gold/FX fetch fails and no cache is available.
 */

import { TRANSLATIONS } from '../config/translations.js';
import { el, clear } from '../lib/safe-dom.js';
import { iconUseElement } from './icon-sprite.js';

function tx(lang, key) {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
}

/**
 * @param {HTMLElement} container
 * @param {{ lang?: 'en'|'ar', onRetry?: () => void }} opts
 */
export function renderPriceFetchError(container, { lang = 'en', onRetry } = {}) {
  if (!container) return;
  clear(container);
  container.classList.add('price-fetch-error');
  container.hidden = false;

  const icon = el('span', { class: 'price-fetch-error__icon', 'aria-hidden': 'true' });
  icon.append(iconUseElement('i-warning'));
  const message = el('p', { class: 'price-fetch-error__message' }, tx(lang, 'status.noData'));

  container.append(icon, message);

  if (typeof onRetry === 'function') {
    const btn = el(
      'button',
      { type: 'button', class: 'btn btn-secondary btn-sm price-fetch-error__retry' },
      tx(lang, 'status.retry')
    );
    btn.addEventListener('click', onRetry);
    container.append(btn);
  }
}

export function hidePriceFetchError(container) {
  if (!container) return;
  container.hidden = true;
  container.classList.remove('price-fetch-error');
  clear(container);
}
