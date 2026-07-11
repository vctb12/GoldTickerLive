/**
 * search/searchEngine.js
 * Bilingual fuzzy search over the SEARCH_INDEX.
 * Scoring: exact > starts-with > contains > keyword match > fuzzy
 */
import { SEARCH_INDEX } from './searchIndex.js';

// Type boost scores (higher = appears first)
const TYPE_BOOST = { country: 5, city: 3, page: 2, guide: 2, karat: 1, shop: 0 };

/**
 * Normalise a string for matching. Lowercases (a no-op on Arabic script) and
 * folds the common Arabic orthographic variants so that queries match regardless
 * of how the term was typed:
 *   - strip tatweel (ـ) and harakat/diacritics + superscript alef
 *   - alef forms (آ أ إ ٱ) → ا, taa marbuta (ة) → ه, alef maqsura (ى) → ي
 *   - hamza-carriers (ؤ ئ) → و / ي
 * Without this, "دبى" vs "دبي" or a diacritic'd/tatweel'd query silently misses.
 * Latin text is unaffected (the Arabic ranges never appear in it).
 */
function norm(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/ـ/g, '')
    .replace(/[ً-ْٰ]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
}

/**
 * Calculate relevance score for a query against an entry.
 * @param {string} q  normalised query (see norm())
 * @param {object} entry
 * @returns {number}
 */
function score(q, entry) {
  const label = norm(entry.label);
  const labelAr = norm(entry.labelAr);
  const kws = (entry.keywords || []).map((k) => norm(k));
  const boost = TYPE_BOOST[entry.type] || 0;

  // Exact match in label
  if (label === q || labelAr === q) return 100 + boost;
  // Starts-with in label
  if (label.startsWith(q) || labelAr.startsWith(q)) return 80 + boost;
  // Contains in label
  if (label.includes(q) || labelAr.includes(q)) return 50 + boost;
  // Keyword exact match
  if (kws.some((k) => k === q)) return 35 + boost;
  // Keyword starts-with
  if (kws.some((k) => k.startsWith(q))) return 25 + boost;
  // Keyword contains
  if (kws.some((k) => k.includes(q))) return 15 + boost;
  // Fuzzy: allow 1-char tolerance (substring within 1 edit)
  if (q.length >= 3) {
    const fuzzy = [...new Set([label, labelAr, ...kws])].some((s) => {
      for (let i = 0; i <= s.length - q.length + 1; i++) {
        const sub = s.slice(i, i + q.length + 1);
        if (levenshtein(q, sub) <= 1) return true;
      }
      return false;
    });
    if (fuzzy) return 8 + boost;
  }
  return 0;
}

/** Simplified Levenshtein distance (max 2 for performance). */
function levenshtein(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  if (a === b) return 0;
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/**
 * Search the index.
 * @param {string} query
 * @param {number} limit
 * @returns {Array<{ label, labelAr, url, type, icon, score }>}
 */
export function search(query, limit = 10) {
  const q = norm(query);
  if (q.length < 2) return [];

  return SEARCH_INDEX.map((entry) => ({ ...entry, _score: score(q, entry) }))
    .filter((r) => r._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...rest }) => rest);
}
