export function matchesQuery(country, query, lang) {
  if (!query || query.trim() === '') return true;
  const q = query.trim().toLowerCase();
  const name = lang === 'ar' ? country.nameAr : country.nameEn;
  if (name.toLowerCase().includes(q)) return true;
  if (country.currency.toLowerCase().includes(q)) return true;
  if (country.code.toLowerCase().includes(q)) return true;
  if (Array.isArray(country.searchAliases)) {
    return country.searchAliases.some((alias) => alias.toLowerCase().includes(q));
  }
  return false;
}
