/**
 * search/searchEngine.js
 * Bilingual fuzzy search over the SEARCH_INDEX.
 * Scoring: exact > starts-with > contains > keyword match > fuzzy
 */
import { SEARCH_INDEX } from './searchIndex.js';
import { normalizeSearchQuery, scoreSearchEntry } from './query-match.js';

/**
 * Search the index.
 * @param {string} query
 * @param {number} limit
 * @returns {Array<{ label, labelAr, url, type, icon, score }>}
 */
export function search(query, limit = 10) {
  const q = normalizeSearchQuery(query);
  if (q.length < 2) return [];

  return SEARCH_INDEX.map((entry) => ({ ...entry, _score: scoreSearchEntry(q, entry) }))
    .filter((r) => r._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...rest }) => rest);
}
