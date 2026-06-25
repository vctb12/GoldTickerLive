import { ChainedQuoteProvider } from './chained-provider.js';
import { GoldApiComQuoteProvider } from './gold-api-com-provider.js';
import { MintedMetalQuoteProvider } from './minted-metal-provider.js';
import { LastGoldPriceQuoteProvider } from './last-gold-price-provider.js';
import { PrimaryQuoteProvider } from './primary-provider.js';
import { SecondaryQuoteProvider } from './secondary-provider.js';

const LIVE_PRIMARY_TIMEOUT_MS = 2000;
const MINTED_FAILOVER_TIMEOUT_MS = 2000;
const FALLBACK_JSON_TIMEOUT_MS = 1500;

/**
 * Wrap a provider so its own timeout cap can never be exceeded by the engine's
 * inbound budget. The realtime engine calls the whole chain with a single
 * ~5 s `fetchTimeoutMs` (`realtime-pricing-engine.js`), and the live providers
 * otherwise prefer that inbound value over their constructor `timeoutMs` — which
 * would let a slow live source burn the full budget before failover. Pinning the
 * cap here restores the per-step 2 s caps the old parallel race enforced, while
 * still honouring a tighter inbound budget if one is ever set. Only the wait
 * window changes; quote data and freshness labelling are untouched.
 * @param {{ providerId: string, fetchQuote: Function }} provider
 * @param {number} capMs
 */
export function withTimeoutCap(provider, capMs) {
  return {
    providerId: provider.providerId,
    fetchQuote(context = {}) {
      const inbound = Number(context?.timeoutMs);
      const timeoutMs = Number.isFinite(inbound) && inbound > 0 ? Math.min(inbound, capMs) : capMs;
      return provider.fetchQuote({ ...context, timeoutMs });
    },
  };
}

/**
 * Primary chain — live source first, then sequential failovers:
 *  1. gold-api.com live spot (2 s cap)
 *  2. mintedmetal.com LBMA reference — failover only, reached when gold-api.com
 *     fails. Its data is twice-daily, so it is a backstop rather than a live
 *     racer; fetching it lazily (only on primary failure) keeps it off the
 *     network path on every page load while preserving it as the documented
 *     Tier-2 source in `methodology.html`.
 *  3. backend API / committed gold_price.json (1.5 s cap)
 *  4. last_gold_price.json
 *
 * The live providers are wrapped with `withTimeoutCap` so the engine's inbound
 * fetch budget can't relax their 2 s caps. Each provider also keeps its own
 * freshness gate (gold-api rejects >15 min, mintedmetal rejects >4 h), so a
 * failover quote is still age-checked and labelled by the engine exactly as
 * before — this change alters *when* mintedmetal is fetched, not how its
 * freshness is computed.
 *
 * Secondary provider (localStorage) is wired separately on the engine.
 */
export function createPrimaryQuoteProvider() {
  return new ChainedQuoteProvider({
    providerId: 'live-primary',
    providers: [
      withTimeoutCap(
        new GoldApiComQuoteProvider({ timeoutMs: LIVE_PRIMARY_TIMEOUT_MS }),
        LIVE_PRIMARY_TIMEOUT_MS
      ),
      withTimeoutCap(
        new MintedMetalQuoteProvider({ timeoutMs: MINTED_FAILOVER_TIMEOUT_MS }),
        MINTED_FAILOVER_TIMEOUT_MS
      ),
      new PrimaryQuoteProvider({ timeoutMs: FALLBACK_JSON_TIMEOUT_MS }),
      new LastGoldPriceQuoteProvider(),
    ],
  });
}

/** Recent localStorage snapshot — always labelled fallback in UI. */
export function createSecondaryQuoteProvider() {
  return new SecondaryQuoteProvider();
}
