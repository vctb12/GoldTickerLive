/**
 * Country-hub hero media band — bilingual copy sync.
 *
 * The EN alt/label ships in the static markup; the AR copy rides in
 * data-alt-ar / data-label-ar. Both templates (cp-hero via
 * countries/country-page.js, legacy country-hero via src/lib/page-hydrator.js)
 * call this one helper so the two paths cannot drift.
 *
 * Deliberately independent of price data — call it during hydration
 * regardless of fetch/cache state so alt language is right even offline.
 */
export function syncHeroMediaAlts(lang) {
  document.querySelectorAll('.cp-hero-media img[data-alt-ar]').forEach((img) => {
    if (!img.dataset.altEn) img.dataset.altEn = img.getAttribute('alt') || '';
    img.setAttribute('alt', lang === 'ar' ? img.dataset.altAr : img.dataset.altEn);
  });
  document.querySelectorAll('.cp-hero-media [data-label-ar]').forEach((node) => {
    if (!node.dataset.labelEn) node.dataset.labelEn = node.textContent;
    node.textContent = lang === 'ar' ? node.dataset.labelAr : node.dataset.labelEn;
  });
  // Static hub context copy (EN in markup, AR in data-copy-ar) rides the same
  // mechanism so crawlers see real copy and readers see their language.
  document.querySelectorAll('.cp-hero-context[data-copy-ar]').forEach((node) => {
    if (!node.dataset.copyEn) node.dataset.copyEn = node.textContent;
    node.textContent = lang === 'ar' ? node.dataset.copyAr : node.dataset.copyEn;
  });
}
