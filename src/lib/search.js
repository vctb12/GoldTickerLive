/**
 * Return `true` if `country` matches `query` in the given display language.
 * An empty or whitespace-only query always returns `true` (show all).
 *
 * Matching is case-insensitive and checks against the country name, currency
 * code, ISO country code, and any entries in `country.searchAliases`.
 *
 * @param {{ nameEn: string, nameAr: string, currency: string, code: string, searchAliases?: string[] }} country
 * @param {string}      query  User-supplied search string.
 * @param {'en'|'ar'}   lang   Display language (determines which name field to check first).
 * @returns {boolean}
 */
export function matchesQuery(country, query, lang) {
  if (!query || query.trim() === '') return true;
  const q = query.trim().toLowerCase();
  const name = lang === 'ar' ? country.nameAr : country.nameEn;
  if ((name || '').toLowerCase().includes(q)) return true;
  if (country.currency.toLowerCase().includes(q)) return true;
  if (country.code.toLowerCase().includes(q)) return true;
  if (Array.isArray(country.searchAliases)) {
    return country.searchAliases.some((alias) => alias.toLowerCase().includes(q));
  }
  return false;
}
