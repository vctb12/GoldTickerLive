/**
 * calculator/value-calculator.js - Gold value calculator logic
 * Extracted from main calculator.js for better modularity
 */

import { toGrams, getPurityForKarat, renderBreakdownRows } from './utils.js';
import { usdPerGram } from '../../lib/price-calculator.js';
import { formatPrice } from '../../lib/formatter.js';

export function calculateValue(STATE, CONSTANTS, KARATS, getRate) {
  const weightRaw = parseFloat(document.getElementById('val-weight')?.value);
  const unit = document.getElementById('val-unit')?.value ?? 'gram';
  const karat = document.getElementById('val-karat')?.value ?? '22';
  const currency = document.getElementById('val-currency')?.value ?? 'AED';

  const result = document.getElementById('val-result');
  if (!result) return;

  if (isNaN(weightRaw) || weightRaw <= 0 || !STATE.spotUsdPerOz) {
    result.hidden = true;
    return;
  }

  const weightGrams = toGrams(weightRaw, unit);
  const purity = getPurityForKarat(karat, KARATS);
  const rate = getRate(currency);

  if (!rate) {
    result.hidden = true;
    return;
  }

  const gramPriceUsd = usdPerGram(STATE.spotUsdPerOz, purity);
  const totalUsd = gramPriceUsd * weightGrams;
  const totalLocal = totalUsd * rate;

  const decimals = ['KWD', 'BHD', 'OMR', 'JOD'].includes(currency) ? 3 : 2;

  document.getElementById('val-result-value').textContent = formatPrice(
    totalLocal,
    currency,
    decimals
  );

  const breakdown = document.getElementById('val-result-breakdown');
  renderBreakdownRows(breakdown, [
    ['Weight', `${weightGrams.toFixed(3)} g`],
    [`Purity (${karat}K)`, `${(purity * 100).toFixed(1)}%`],
    [`Spot price per gram (${currency})`, formatPrice(gramPriceUsd * rate, currency, decimals)],
    ['USD equivalent', formatPrice(totalUsd, 'USD', 2)],
  ]);

  result.hidden = false;
}
