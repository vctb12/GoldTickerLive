/**
 * i18n/fr-pilot.js — French pilot dictionary (Phase 39, LTR).
 *
 * A curated **core-pages** translation set: the shared site shell (nav, footer, header, breadcrumbs)
 * plus the homepage price surface (spotlight, karat table, change, freshness/status). It is kept
 * OUT of the parity-guarded `src/config/translations.js` on purpose — French is a *pilot* with
 * deliberate partial coverage, whereas EN/AR are held to exact key parity. Any key not covered here
 * falls back to English through the shared `translate()` helper, so nothing renders as a raw key.
 *
 * Every key below MUST exist in `TRANSLATIONS.en` (guarded by tests) — this is a translation of an
 * existing surface, never a new string. The reference-estimate framing (spot-linked,
 * bullion-equivalent, "not financial advice") is preserved in the French copy.
 *
 * Full-content French (all 1200+ keys) is Phase 41's job (MT + human review); this pilot is the
 * hand-checked shell + homepage core that proves the scaffolding end-to-end.
 */

/** @type {Record<string, string>} — French strings, keyed by the existing EN translation key. */
export const FR_PILOT = {
  // ── Header / language ──────────────────────────────────────────────────────
  'header.title': "Cours de l'or en direct",
  'header.subtitle': 'Estimations pour lingots indexées sur le cours spot, par carat et devise',
  'lang.toggle': 'English',

  // ── Primary navigation ─────────────────────────────────────────────────────
  'nav.home': 'Accueil',
  'nav.tracker': 'Suivi en direct',
  'nav.calculator': 'Calculatrice',
  'nav.learn': "Centre d'apprentissage",
  'nav.shops': 'Boutiques et marchés',
  'nav.methodology': 'Méthodologie',
  'nav.terms': "Conditions d'utilisation",
  'nav.privacy': 'Politique de confidentialité',
  'nav.invest': 'Investir',
  'nav.insights': 'Analyses de marché',
  'nav.countries': 'Pays',
  'nav.compare': 'Comparer les pays',
  'nav.heatmap': 'Carte du monde',
  'nav.glossary': 'Glossaire',
  'nav.market': "Comment l'or est coté",
  'nav.portfolio': 'Portefeuille',
  'nav.dubai': "Cours de l'or à Dubaï et aux Émirats",
  'nav.country': 'Pays',
  'breadcrumbs.ariaLabel': "Fil d'Ariane",

  // ── Footer ─────────────────────────────────────────────────────────────────
  'footer.goldSource': 'Données or : Gold-API.com (gold-api.com)',
  'footer.fxSource': 'Données de change : ExchangeRate-API (open.er-api.com)',
  'footer.disclaimer':
    'Valeurs estimées équivalentes en lingots uniquement. Les prix de détail et en bijouterie peuvent différer sensiblement. Ne constitue pas un conseil financier.',

  // ── Gold / FX / AED freshness + badges ─────────────────────────────────────
  'gold.freshness.label': 'Or mis à jour :',
  'gold.countdown.label': 'Prochaine actualisation dans :',
  'gold.badge': 'EN DIRECT',
  'fx.freshness.label': 'Taux de change mis à jour :',
  'fx.next.label': 'Prochaine actualisation des taux :',
  'fx.badge': 'QUOTIDIEN',
  'aed.badge': 'PARITÉ FIXE',
  'aed.note': "Parité officielle de la Banque centrale des Émirats avec l'USD",

  // ── Homepage spotlight ─────────────────────────────────────────────────────
  'spotlight.title': "Cours de l'or aux Émirats",
  'spotlight.note': 'Valeur estimée équivalente en lingots',
  'spotlight.perOzUsd': 'Par once (USD)',
  'spotlight.perOzAed': 'Par once (AED)',
  'spotlight.perGramUsd': 'Par gramme (USD)',
  'spotlight.perGramAed': 'Par gramme (AED)',
  'spotlight.karat.label': 'Carat :',

  // ── Price movement ─────────────────────────────────────────────────────────
  'change.title': 'Évolution du cours',
  'change.vsPrev': 'par rapport au relevé précédent',
  'change.vsOpen': "par rapport à l'ouverture à Dubaï",
  'change.note': '24 carats par once · USD · Estimation indexée sur le cours spot',

  // ── Price-by-karat table ───────────────────────────────────────────────────
  'karat.title': 'Cours par carat',
  'karat.col.karat': 'Carat',
  'karat.col.usd': 'USD',
  'karat.col.aed': 'AED (parité fixe)',
  'karat.disclaimer':
    'Valeurs estimées équivalentes en lingots. Les prix de détail et en bijouterie peuvent différer. Ne constitue pas un conseil financier.',

  // ── Units ──────────────────────────────────────────────────────────────────
  'unit.gram': 'Par gramme',
  'unit.oz': 'Par once',

  // ── Country / price cards ──────────────────────────────────────────────────
  'card.perGram': 'par gramme',
  'card.perOz': 'par once',
  'card.copy': 'Copier',
  'card.copied': 'Copié !',
  'card.stale': 'Obsolète',
  'card.noData': 'Aucune donnée',
  'card.addFavorite': 'Ajouter aux favoris',
  'card.removeFavorite': 'Retirer des favoris',

  // ── Status / freshness messages ────────────────────────────────────────────
  'status.loading': 'Chargement des cours...',
  'status.offline': 'Vous êtes hors ligne. Affichage des données en cache.',
  'status.goldStale': "Les données sur l'or peuvent être obsolètes. Utilisation du cours en cache.",
  'status.fxStale': 'Les taux de change peuvent être obsolètes. Utilisation des taux en cache.',
  'status.goldError':
    "Impossible d'actualiser le cours de l'or. Affichage de la dernière valeur en cache si disponible.",
  'status.fxError':
    "Impossible d'actualiser les taux de change. Affichage des derniers taux en cache si disponibles.",
  'status.noData':
    'Les cours ne sont pas disponibles pour le moment. Vérifiez votre connexion et appuyez sur Réessayer.',
  'status.retry': 'Réessayer',
  'status.cacheHealth': 'Fraîcheur des données :',
};

/** Keys covered by the French pilot. Everything else falls back to English. */
export const FR_PILOT_KEYS = Object.keys(FR_PILOT);

/**
 * Return a translations map with the French pilot grafted on as the `fr` locale, so
 * `translate(withFrenchPilot(TRANSLATIONS), 'fr', key)` yields French for covered keys and English
 * for the rest. The input map is not mutated.
 *
 * @param {Record<string, Record<string, string>>} translations  e.g. `TRANSLATIONS`.
 * @returns {Record<string, Record<string, string>>}
 */
export function withFrenchPilot(translations) {
  return { ...(translations || {}), fr: FR_PILOT };
}
