/**
 * calculator/utils.js - Shared utilities for calculator modules
 * Extracts common conversion and formatting logic
 */

// Weight unit conversions (to grams)
export const UNIT_TO_GRAMS = {
  gram: 1,
  oz: 31.1035,
  kg: 1000,
  tola: 11.6638,
  masha: 0.972,
  baht: 15.244,
  taels: 37.429,
};

export const UNIT_LABELS = {
  gram: 'Gram (g)',
  oz: 'Troy Ounce (ozt)',
  kg: 'Kilogram (kg)',
  tola: 'Tola',
  masha: 'Masha',
  baht: 'Baht (Thai)',
  taels: 'Taels (Chinese)',
};

export function toGrams(amount, unit) {
  return amount * (UNIT_TO_GRAMS[unit] ?? 1);
}

export function getPurityForKarat(code, KARATS) {
  const k = KARATS.find((k) => k.code === String(code));
  if (k) return k.purity;

  const n = parseInt(code, 10);
  if (n > 0 && n <= 24) return n / 24;
  return 1;
}

export function renderBreakdownRows(container, rows) {
  if (!container) return;
  container.replaceChildren();

  for (const [label, value] of rows) {
    const row = document.createElement('div');
    row.className = 'calc-result-row';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;

    const valueStrong = document.createElement('strong');
    valueStrong.textContent = value;

    row.appendChild(labelSpan);
    row.appendChild(valueStrong);
    container.appendChild(row);
  }
}
