/**
 * Calculator panel: reference (raw gold) vs illustrative shop range.
 * Making charges are estimates only — never presented as live shop prices.
 */
import { el, clear } from '../lib/safe-dom.js';
import { formatPrice } from '../lib/formatter.js';

/** Typical jewellery making-charge range (illustrative; matches the 5–25% band cited in the FAQ). */
const MAKING_LOW = 0.05;
const MAKING_HIGH = 0.25;

/**
 * @param {{
 *   referenceLocal: number,
 *   currency: string,
 *   decimals?: number,
 *   t: (key: string) => string,
 * }} options
 * @returns {HTMLElement}
 */
export function renderShopVsReferencePanel({ referenceLocal, currency, decimals = 2, t }) {
  const root = el('div', { class: 'shop-vs-reference', 'aria-labelledby': 'shop-vs-ref-heading' });
  const heading = el('h3', { class: 'shop-vs-reference__title', id: 'shop-vs-ref-heading' }, [
    t('title'),
  ]);
  const intro = el('p', { class: 'shop-vs-reference__intro' }, [t('intro')]);

  const refFormatted = formatPrice(referenceLocal, currency, decimals);
  const lowFormatted = formatPrice(referenceLocal * (1 + MAKING_LOW), currency, decimals);
  const highFormatted = formatPrice(referenceLocal * (1 + MAKING_HIGH), currency, decimals);

  const bars = el('div', { class: 'shop-vs-reference__bars' }, [
    buildBarRow(t('reference'), refFormatted, 100, 'reference'),
    buildBarRow(t('low'), lowFormatted, 100 + MAKING_LOW * 100, 'low'),
    buildBarRow(t('high'), highFormatted, 100 + MAKING_HIGH * 100, 'high'),
  ]);

  const disclaimer = el('p', { class: 'shop-vs-reference__disclaimer' }, [t('disclaimer')]);
  const link = el(
    'a',
    {
      class: 'shop-vs-reference__link',
      // Leading `./` is required: safe-dom's safeHref() drops bare-relative
      // hrefs, which would otherwise render this trust link with no href.
      href: './methodology.html',
    },
    [t('link')]
  );

  root.append(heading, intro, bars, disclaimer, link);
  return root;
}

function buildBarRow(label, valueText, widthPct, tone) {
  return el('div', { class: `shop-vs-reference__row shop-vs-reference__row--${tone}` }, [
    el('div', { class: 'shop-vs-reference__row-head' }, [
      el('span', { class: 'shop-vs-reference__row-label' }, [label]),
      el('strong', { class: 'shop-vs-reference__row-value' }, [valueText]),
    ]),
    el('div', { class: 'shop-vs-reference__track', 'aria-hidden': 'true' }, [
      el('div', {
        class: 'shop-vs-reference__fill',
        style: `--bar-width: ${Math.min(widthPct, 130)}%`,
      }),
    ]),
  ]);
}

/**
 * Replace children of mount with updated panel.
 */
export function updateShopVsReferenceMount(mount, options) {
  if (!mount) return;
  clear(mount);
  mount.appendChild(renderShopVsReferencePanel(options));
}
