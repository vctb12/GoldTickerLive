const ALLOWED_K = new Set(['24', '22', '21', '18', '14', '10', '9']);
const ALLOWED_C = new Set([
  'USD',
  'AED',
  'SAR',
  'KWD',
  'QAR',
  'BHD',
  'OMR',
  'EGP',
  'JOD',
  'MAD',
  'INR',
]);
const ALLOWED_MODE = new Set(['value', 'scrap', 'zakat', 'buying', 'convert']);

export function serializeCalculatorUrlState({
  weight = '',
  karat = '22',
  currency = 'AED',
  mode = 'value',
} = {}) {
  const params = new URLSearchParams();
  if (Number.isFinite(Number(weight)) && Number(weight) > 0) params.set('w', String(weight));
  if (ALLOWED_K.has(String(karat))) params.set('k', String(karat));
  if (ALLOWED_C.has(String(currency))) params.set('c', String(currency));
  if (ALLOWED_MODE.has(String(mode))) params.set('mode', String(mode));
  return `?${params.toString()}`;
}

export function parseCalculatorUrlState(search) {
  const params = new URLSearchParams(search || '');
  const w = Number(params.get('w'));
  const k = params.get('k');
  const c = params.get('c');
  const mode = params.get('mode');
  return {
    weight: Number.isFinite(w) && w > 0 ? String(w) : '',
    karat: ALLOWED_K.has(String(k)) ? String(k) : '22',
    currency: ALLOWED_C.has(String(c)) ? String(c) : 'AED',
    mode: ALLOWED_MODE.has(String(mode)) ? String(mode) : 'value',
  };
}
