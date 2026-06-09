import { ChainedQuoteProvider } from './chained-provider.js';
import { GoldApiComQuoteProvider } from './gold-api-com-provider.js';
import { MintedMetalQuoteProvider } from './minted-metal-provider.js';
import { LastGoldPriceQuoteProvider } from './last-gold-price-provider.js';
import { ParallelQuoteRaceProvider } from './parallel-race-provider.js';
import { PrimaryQuoteProvider } from './primary-provider.js';
import { SecondaryQuoteProvider } from './secondary-provider.js';

const LIVE_RACE_TIMEOUT_MS = 2000;
const LIVE_RACE_MASTER_MS = 5000;
const FALLBACK_JSON_TIMEOUT_MS = 1500;

/**
 * Primary chain — live lane first, then fast file fallbacks:
 *  1. Parallel race: gold-api.com + mintedmetal.com (2 s each, 5 s master budget)
 *  2. backend API / committed gold_price.json (1.5 s cap)
 *  3. last_gold_price.json
 * Secondary provider (localStorage) is wired separately on the engine.
 */
export function createPrimaryQuoteProvider() {
  return new ChainedQuoteProvider({
    providerId: 'live-primary',
    providers: [
      new ParallelQuoteRaceProvider({
        providerId: 'live-race',
        providers: [
          new GoldApiComQuoteProvider({ timeoutMs: LIVE_RACE_TIMEOUT_MS }),
          new MintedMetalQuoteProvider({ timeoutMs: LIVE_RACE_TIMEOUT_MS }),
        ],
        raceTimeoutMs: LIVE_RACE_TIMEOUT_MS,
        masterTimeoutMs: LIVE_RACE_MASTER_MS,
      }),
      new PrimaryQuoteProvider({ timeoutMs: FALLBACK_JSON_TIMEOUT_MS }),
      new LastGoldPriceQuoteProvider(),
    ],
  });
}

/** Recent localStorage snapshot — always labelled fallback in UI. */
export function createSecondaryQuoteProvider() {
  return new SecondaryQuoteProvider();
}
