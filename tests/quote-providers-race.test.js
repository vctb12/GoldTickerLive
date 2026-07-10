'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadRace() {
  const url = new URL(
    'file://' +
      path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'parallel-race-provider.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

function makeQuote(providerId, price = 2500) {
  return {
    price,
    providerTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    providerId,
    source: providerId,
    providerPathSuccessful: true,
    isFresh: true,
    isFallback: false,
  };
}

test('ParallelQuoteRaceProvider returns the first successful quote', async () => {
  const { ParallelQuoteRaceProvider } = await loadRace();

  const slow = {
    providerId: 'slow',
    fetchQuote: () =>
      new Promise((resolve) => {
        setTimeout(() => resolve(makeQuote('slow', 2400)), 1500);
      }),
  };
  const fast = {
    providerId: 'fast',
    fetchQuote: async () => makeQuote('fast', 2500),
  };

  const race = new ParallelQuoteRaceProvider({
    providers: [slow, fast],
    raceTimeoutMs: 2000,
    masterTimeoutMs: 5000,
  });

  const quote = await race.fetchQuote();
  assert.equal(quote.providerId, 'fast');
  assert.equal(quote.price, 2500);
});

test('ParallelQuoteRaceProvider fails when every racer fails within budget', async () => {
  const { ParallelQuoteRaceProvider } = await loadRace();

  const race = new ParallelQuoteRaceProvider({
    providers: [
      {
        providerId: 'a',
        fetchQuote: async () => {
          throw new Error('a down');
        },
      },
      {
        providerId: 'b',
        fetchQuote: async () => {
          throw new Error('b down');
        },
      },
    ],
    raceTimeoutMs: 100,
    masterTimeoutMs: 200,
  });

  await assert.rejects(() => race.fetchQuote(), /a down|b down|race failed/);
});
