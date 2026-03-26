import { calculateVolatility } from './price-calculator.js';

export function updateVolatility(STATE) {
  STATE.volatility7d = calculateVolatility(STATE.history, 7);
  STATE.volatility30d = calculateVolatility(STATE.history, 30);
}

export function getVolatilityLabel(pct, lang) {
  if (pct === null || pct === undefined) return '';
  const formatted = pct.toFixed(1);
  if (lang === 'ar') return `تقلب ${formatted}%`;
  return `${formatted}% vol`;
}
