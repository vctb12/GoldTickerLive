/**
 * i18n/fr-content-batch-1.js — first French *content* batch (Phase 41): the reference methodology.
 *
 * Unlike the Phase 39 UI-shell pilot, this is long-form *content* (prose that explains how prices are
 * derived). Per the content-translation policy (`docs/i18n/content-translation-policy.md`) content
 * translations ship at review status `pending-human-review` and are therefore **not indexable** until
 * a human signs off — machine/agent-drafted content is never auto-indexed. Users who choose French
 * still see it; search engines do not until it is reviewed.
 *
 * The immutable invariants are preserved verbatim in the French copy: the troy-ounce constant
 * `31.1035`, the AED peg `3.6725`, the pricing formula, and the reference-estimate framing (these are
 * asserted by tests). Every key exists in `TRANSLATIONS.en`.
 */

import { REVIEW_STATUS } from './review-status.js';

/** @type {Record<string, string>} — French methodology content, keyed by the existing EN key. */
export const FR_CONTENT_BATCH_1 = {
  'methodology.sectionTitle': 'La méthodologie en bref',
  'methodology.sectionSub':
    'Cours spot → gramme → carat → devise locale, avec des mentions de transparence explicites à chaque étape.',
  'methodology.title': 'Méthodologie de référence',
  'methodology.sub': 'Comment nous établissons chaque estimation de référence publiée.',
  'methodology.stepSpot': 'Partez du cours spot XAU/USD en direct par once troy.',
  'methodology.stepGram': "Convertissez l'once en gramme à l'aide de 31.1035.",
  'methodology.stepKarat': 'Appliquez le facteur de pureté du carat pour le titre sélectionné.',
  'methodology.stepLocal':
    "Convertissez l'USD/gramme en devise locale (l'AED utilise une parité fixe de 3.6725).",
  'methodology.formula': 'price_per_gram_local = (XAU/USD ÷ 31.1035) × karat_factor × local_fx',
  'methodology.karatTableCaption': 'Facteurs de pureté du carat pour les calculs de référence',
  'methodology.karatHeader': 'Carat',
  'methodology.purityHeader': 'Pureté',
  'methodology.factorHeader': 'Facteur',
  'methodology.referenceDisclaimer':
    'Estimation de référence uniquement. Les devis en boutique et en bijouterie peuvent inclure des frais de façonnage, des primes et des taxes.',
  'methodology.vatDisclaimer':
    'Les hypothèses de TVA et de frais de façonnage doivent être vérifiées sur la facture finale du vendeur.',
  'methodology.compareChecklistTitle': 'Comment comparer avec un devis en boutique',
  'methodology.compareChecklist1':
    "Faites d'abord correspondre le carat et l'unité (gramme/tola/once).",
  'methodology.compareChecklist2': "Séparez la valeur de l'or pur des frais de façonnage.",
  'methodology.compareChecklist3': 'Confirmez le traitement de la TVA/taxe sur la facture.',
  'methodology.compareChecklist4': "Vérifiez l'horodatage et l'état de fraîcheur avant de décider.",
  'methodology.fullPageLink': 'Ouvrir la méthodologie complète →',
  'methodology.calculatorLink': 'Ouvrir la calculatrice →',
  'methodology.trackerLink': 'Ouvrir le suivi →',
};

/** Keys covered by this batch. */
export const FR_CONTENT_BATCH_1_KEYS = Object.keys(FR_CONTENT_BATCH_1);

/** Batch descriptor consumed by the translation-status governance. */
export const FR_CONTENT_BATCH_1_META = {
  id: 'fr-content-batch-1-methodology',
  locale: 'fr',
  tier: 'content',
  sourceLocale: 'en',
  // Ships un-reviewed → NOT indexable until a human reviewer flips this. This is the policy default.
  status: REVIEW_STATUS.PENDING,
  keyCount: FR_CONTENT_BATCH_1_KEYS.length,
};
