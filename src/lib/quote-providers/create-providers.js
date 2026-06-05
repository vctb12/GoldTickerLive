import { ChainedQuoteProvider } from './chained-provider.js';
import { GoldApiComQuoteProvider } from './gold-api-com-provider.js';
import { MintedMetalQuoteProvider } from './minted-metal-provider.js';
import { LastGoldPriceQuoteProvider } from './last-gold-price-provider.js';
import { PrimaryQuoteProvider } from './primary-provider.js';
import { SecondaryQuoteProvider } from './secondary-provider.js';

/**
 * Primary chain — five browser-safe sources before localStorage fallback:
 *  1. gold-api.com (seconds-level CORS spot)
 *  2. mintedmetal.com (LBMA twice-daily CORS reference)
 *  3. backend API / committed gold_price.json (hourly cron)
 *  4. last_gold_price.json (recent committed snapshot)
 *  5. (secondary) recent localStorage only
 */
export function createPrimaryQuoteProvider() {
  return new ChainedQuoteProvider({
    providerId: 'live-primary',
    providers: [
      new GoldApiComQuoteProvider(),
      new MintedMetalQuoteProvider(),
      new PrimaryQuoteProvider(),
      new LastGoldPriceQuoteProvider(),
    ],
  });
}

/** Recent localStorage snapshot — always labelled fallback in UI. */
export function createSecondaryQuoteProvider() {
  return new SecondaryQuoteProvider();
}
