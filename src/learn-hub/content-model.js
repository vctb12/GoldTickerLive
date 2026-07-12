/**
 * Shared learn-hub article definitions and localized copy — compatibility barrel.
 *
 * The model is physically split so the English learn.html fast path never
 * downloads copy it does not render:
 *   - content-structure.js — article structure (ids + translation keys, no copy)
 *   - content-text.js      — localized corpus + resolveLearnHubText
 * Node consumers (scripts/node/render-learn-static-fallback.mjs) keep importing
 * everything from here unchanged. Browser modules must import the split module
 * they actually need so the eager learn.html graph stays corpus-free.
 */

export {
  LEARN_HUB_TRANSLATIONS,
  resolveLearnHubText,
  getLearnHubTranslations,
} from './content-text.js';
export { LEARN_ARTICLE, LEARN_HUB_ARTICLES } from './content-structure.js';
