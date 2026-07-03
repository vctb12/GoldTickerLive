/**
 * src/config/site.js — Central site identity.
 *
 * Single source of truth for brand / canonical-origin values that runtime
 * modules share. `src/seo/canonical.js` derives `CANONICAL_BASE` from here.
 *
 * The build-time schema injector (`scripts/node/inject-schema.js`) is a
 * CommonJS script that keeps its own literal copies of these values;
 * `tests/site-config.test.js` guards against drift between the two.
 *
 * Changing `url` is a canonical-origin change — see the technical SEO policy
 * in AGENTS.md before touching it.
 */
export const SITE = Object.freeze({
  name: 'Gold Ticker Live',
  url: 'https://goldtickerlive.com',
  description:
    'Spot-linked reference gold prices for GCC, Arab world and global markets — with visible freshness labels',
  logoPath: '/assets/favicon-512x512.png',
  twitterHandle: '@GoldTickerLive',
  sameAs: Object.freeze(['https://twitter.com/goldtickerlive', 'https://x.com/GoldTickerLive']),
  languages: Object.freeze(['en', 'ar']),
});
