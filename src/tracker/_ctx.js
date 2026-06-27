// tracker/_ctx.js — shared render context for tracker submodules
import { TRANSLATIONS } from '../config/index.js';

export let _state = null;
export let _el = null;
export let _priceFor = null;
export let _currentSpot = null;
export let _showToast = null;

export function _setCtx({ state, el, priceFor, currentSpot, showToast }) {
  _state = state;
  _el = el;
  _priceFor = priceFor;
  _currentSpot = currentSpot;
  _showToast = showToast;
}

export function tx(key, params = {}) {
  const lang = _state?.lang ?? 'en';
  const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.en ?? {};
  const fullKey = key.startsWith('tracker.') ? key : `tracker.${key}`;
  let str = dict[fullKey];
  if (typeof str !== 'string') {
    str = key.split('.').reduce((o, k) => (o != null ? o[k] : undefined), dict);
  }
  if (typeof str !== 'string') str = TRANSLATIONS.en?.[fullKey] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : ''));
}

export function formatUsd(value, decimals = 2) {
  if (!Number.isFinite(value)) return '—';
  return `$${value.toLocaleString('en', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatUnitLabel(unit) {
  if (_state?.lang !== 'ar') return unit;
  if (unit === 'gram') return 'غرام';
  if (unit === 'oz') return 'أوقية';
  if (unit === 'tola') return 'تولة';
  if (unit === 'kg') return 'كيلوغرام';
  return unit;
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Direction of a price delta with an explicit *flat* band, so a change that
// rounds to zero never reads as an up-move ("don't default up = green").
// Pass the value you actually display (amount or percent) with a matching
// epsilon — flat is returned when |value| would render as 0.00.
export const DELTA_FLAT_EPSILON = 0.005;
export function classifyDelta(value, epsilon = DELTA_FLAT_EPSILON) {
  if (!Number.isFinite(value) || Math.abs(value) < epsilon) return 'flat';
  return value > 0 ? 'up' : 'down';
}

// Non-colour cue for each direction — paired with sign + colour so up/down/flat
// stay legible without relying on colour alone.
export const DIRECTION_GLYPH = { up: '▲', down: '▼', flat: '•' };
