import { ChainedQuoteProvider } from './chained-provider.js';
import { GoldApiComQuoteProvider } from './gold-api-com-provider.js';
import { PrimaryQuoteProvider } from './primary-provider.js';
import { SecondaryQuoteProvider } from './secondary-provider.js';

/**
 * Primary chain: live browser API → committed static JSON/backend path.
 */
export function createPrimaryQuoteProvider() {
  return new ChainedQuoteProvider({
    providerId: 'live-primary',
    providers: [new GoldApiComQuoteProvider(), new PrimaryQuoteProvider()],
  });
}

/**
 * Secondary chain: recent last-known snapshot → recent localStorage only.
 */
export function createSecondaryQuoteProvider() {
  return new SecondaryQuoteProvider();
}
