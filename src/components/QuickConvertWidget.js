/**
 * Homepage quick-convert: weight + karat → live reference value in AED.
 */
import { CONSTANTS, KARATS } from '../config/index.js';
import { usdPerGram } from '../lib/price-calculator.js';
import { formatPrice } from '../lib/formatter.js';
import { countUp } from '../lib/count-up.js';
import { el, clear } from '../lib/safe-dom.js';
import { serializeCalculatorUrlState } from '../pages/calculator/url-state.js';

const UNIT_TO_GRAMS = {
  gram: 1,
  tola: 11.6638,
  oz: CONSTANTS.TROY_OZ_GRAMS,
};

/**
 * @param {{
 *   lang: string,
 *   spotUsdPerOz?: number,
 *   getSpot?: () => (number|null),
 *   t: (key: string, params?: Record<string, string>) => string,
 *   mount: HTMLElement,
 * }} options
 *
 * Pass `getSpot` when the spot price arrives after mount (the homepage case):
 * recalc() reads it live, so the widget fills in as soon as a price exists
 * instead of staying stuck on the placeholder. `spotUsdPerOz` is a static
 * fallback for callers that already have the value.
 */
export function mountQuickConvertWidget({ lang, spotUsdPerOz, getSpot, t, mount }) {
  if (!mount) return null;

  let weight = 10;
  let unit = 'gram';
  let karat = '22';

  const root = el('section', {
    class: 'quick-convert-widget',
    'aria-labelledby': 'home-quick-convert-title',
  });

  const title = el('h3', { class: 'quick-convert-widget__title', id: 'home-quick-convert-title' }, [
    t('quickConvertTitle'),
  ]);
  const sub = el('p', { class: 'quick-convert-widget__sub' }, [t('quickConvertSub')]);

  const weightInput = el('input', {
    type: 'number',
    class: 'quick-convert-widget__input',
    id: 'home-quick-weight',
    min: '0',
    step: '0.1',
    value: String(weight),
    inputmode: 'decimal',
    'aria-label': t('quickConvertWeight'),
  });

  const unitSelect = el(
    'select',
    {
      class: 'quick-convert-widget__select',
      id: 'home-quick-unit',
      'aria-label': t('quickConvertUnit'),
    },
    [
      el('option', { value: 'gram' }, [t('unitGram')]),
      el('option', { value: 'tola' }, [t('unitTola')]),
      el('option', { value: 'oz' }, [t('unitOz')]),
    ]
  );

  const karatSelect = el(
    'select',
    {
      class: 'quick-convert-widget__select',
      id: 'home-quick-karat',
      'aria-label': t('quickConvertKarat'),
    },
    ['24', '22', '21', '18'].map((code) => {
      const k = KARATS.find((item) => item.code === code);
      const pct = k ? `${(k.purity * 100).toFixed(1)}%` : '';
      return el('option', { value: code }, [`${code}K (${pct})`]);
    })
  );

  const resultValue = el(
    'div',
    {
      class: 'quick-convert-widget__result-value',
      id: 'home-quick-result',
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    },
    ['—']
  );
  const resultHint = el('p', {
    class: 'quick-convert-widget__result-hint',
    id: 'home-quick-hint',
    hidden: true,
  });
  const resultNote = el('p', { class: 'quick-convert-widget__result-note' }, [
    t('quickConvertNote'),
  ]);
  // Explicit reference (spot) vs retail (shop) distinction — trust guardrail.
  const retailNote = el('p', { class: 'quick-convert-widget__retail-note' }, [
    t('quickConvertRetail'),
  ]);

  const calcLink = el(
    'a',
    {
      class: 'btn btn-outline btn-sm quick-convert-widget__cta',
      id: 'home-quick-calc-link',
      href: 'calculator.html',
    },
    [t('quickConvertCta')]
  );

  const form = el('div', { class: 'quick-convert-widget__form' }, [
    el('div', { class: 'quick-convert-widget__field' }, [
      el('label', { for: 'home-quick-weight' }, [t('quickConvertWeight')]),
      el('div', { class: 'quick-convert-widget__row' }, [weightInput, unitSelect]),
    ]),
    el('div', { class: 'quick-convert-widget__field' }, [
      el('label', { for: 'home-quick-karat' }, [t('quickConvertKarat')]),
      karatSelect,
    ]),
  ]);

  const resultBlock = el('div', { class: 'quick-convert-widget__result' }, [
    el('span', { class: 'quick-convert-widget__result-label' }, [t('quickConvertResult')]),
    resultValue,
    resultHint,
    resultNote,
    retailNote,
    calcLink,
  ]);

  root.append(title, sub, form, resultBlock);
  clear(mount);
  mount.appendChild(root);

  function gramsFromInput() {
    const w = parseFloat(weightInput.value);
    if (!Number.isFinite(w) || w <= 0) return 0;
    return w * (UNIT_TO_GRAMS[unit] || 1);
  }

  function recalc() {
    weight = parseFloat(weightInput.value) || 0;
    unit = unitSelect.value;
    karat = karatSelect.value;
    const k = KARATS.find((item) => item.code === karat);
    const spot = typeof getSpot === 'function' ? getSpot() : spotUsdPerOz;
    const grams = gramsFromInput();
    const raw = String(weightInput.value).trim();
    // Validation / error states (explicit, not just a dash).
    if (!spot || !k) {
      resultValue.textContent = '—';
      resultHint.textContent = t('quickConvertUnavailable');
      resultHint.hidden = false;
      weightInput.setAttribute('aria-invalid', 'false');
      return;
    }
    if (raw === '' || grams <= 0) {
      resultValue.textContent = '—';
      resultHint.textContent = t('quickConvertHint');
      resultHint.hidden = false;
      // Only flag as invalid when the user typed something unusable (not when empty).
      weightInput.setAttribute('aria-invalid', raw !== '' && grams <= 0 ? 'true' : 'false');
      return;
    }
    resultHint.hidden = true;
    weightInput.setAttribute('aria-invalid', 'false');
    const aedPerGram = usdPerGram(spot, k.purity) * CONSTANTS.AED_PEG;
    const total = aedPerGram * grams;
    countUp(resultValue, total, {
      decimals: 2,
      format: (n) => formatPrice(n, 'AED', 2),
    });
    calcLink.href = `calculator.html${serializeCalculatorUrlState({
      weight: String(weight),
      karat,
      currency: 'AED',
      mode: 'value',
    })}${lang === 'ar' ? '&lang=ar' : ''}`;
  }

  weightInput.addEventListener('input', recalc);
  unitSelect.addEventListener('change', recalc);
  karatSelect.addEventListener('change', recalc);

  recalc();

  return { recalc, root };
}
