'use strict';

/**
 * Tests for services/pricingEngine.js — pricing calculation logic.
 *
 * Because pricingEngine.js uses ES module syntax we inline the core
 * formulas here (same approach as price-calculator.test.js) to keep
 * tests runnable with plain `node --test` without a transpile step.
 *
 * Run with:  npm test
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Constants (from config)
// ---------------------------------------------------------------------------

const TROY_OZ_GRAMS = 31.1035;
const TOLA_GRAMS = 11.6638;
const AED_PEG = 3.6725;

// ---------------------------------------------------------------------------
// Inline formulas from pricingEngine.js
// ---------------------------------------------------------------------------

function calcPrice(spotUsdPerOz, karatCode, fxRate, unit = 'gram') {
    if (!spotUsdPerOz || !fxRate) return null;
    const purities = { '24': 1.0, '22': 22/24, '21': 21/24, '18': 0.75, '16': 16/24, '14': 14/24 };
    const purity = purities[String(karatCode)];
    if (!purity) return null;
    const usdPerGram = (spotUsdPerOz / TROY_OZ_GRAMS) * purity;
    switch (unit) {
        case 'oz':   return usdPerGram * TROY_OZ_GRAMS * fxRate;
        case 'tola': return usdPerGram * TOLA_GRAMS * fxRate;
        default:     return usdPerGram * fxRate;
    }
}

function calculateAllPrices(spotUsdPerOz, fxRates, karats, countries) {
    if (!spotUsdPerOz || spotUsdPerOz <= 0) return {};
    const prices = {};

    const baseUsd = {};
    for (const karat of karats) {
        const usdPerGram = (spotUsdPerOz / TROY_OZ_GRAMS) * karat.purity;
        baseUsd[karat.code] = {
            usdPerGram,
            usdPerOz: spotUsdPerOz * karat.purity,
            usdPerTola: usdPerGram * TOLA_GRAMS,
        };
    }

    for (const country of countries) {
        const isAED = country.currency === 'AED';
        const fxRate = isAED ? AED_PEG : (fxRates[country.currency] ?? null);
        const fxSource = isAED ? 'fixed-peg' : (fxRate ? 'api' : 'unavailable');

        for (const karat of karats) {
            const base = baseUsd[karat.code];
            const key = `${country.code}_${karat.code}`;
            prices[key] = {
                usdPerGram:    base.usdPerGram,
                usdPerOz:      base.usdPerOz,
                usdPerTola:    base.usdPerTola,
                localPerGram:  fxRate ? base.usdPerGram * fxRate : null,
                localPerOz:    fxRate ? base.usdPerOz * fxRate : null,
                localPerTola:  fxRate ? base.usdPerTola * fxRate : null,
                currency:      country.currency,
                karat:         karat.code,
                country:       country.code,
                fxRate,
                fxSource,
            };
        }
    }
    return prices;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('calcPrice', () => {
    const SPOT = 3100; // USD/oz

    test('returns correct per-gram price for 24K in AED', () => {
        const result = calcPrice(SPOT, '24', AED_PEG, 'gram');
        const expected = (SPOT / TROY_OZ_GRAMS) * 1.0 * AED_PEG;
        assert.ok(Math.abs(result - expected) < 0.001);
    });

    test('returns correct per-oz price for 22K', () => {
        const result = calcPrice(SPOT, '22', AED_PEG, 'oz');
        const expected = (SPOT / TROY_OZ_GRAMS) * (22/24) * TROY_OZ_GRAMS * AED_PEG;
        assert.ok(Math.abs(result - expected) < 0.01);
    });

    test('returns correct per-tola price for 18K', () => {
        const result = calcPrice(SPOT, '18', AED_PEG, 'tola');
        const expected = (SPOT / TROY_OZ_GRAMS) * 0.75 * TOLA_GRAMS * AED_PEG;
        assert.ok(Math.abs(result - expected) < 0.01);
    });

    test('returns null when spot is falsy', () => {
        assert.equal(calcPrice(0, '24', AED_PEG), null);
        assert.equal(calcPrice(null, '24', AED_PEG), null);
    });

    test('returns null when fxRate is falsy', () => {
        assert.equal(calcPrice(SPOT, '24', 0), null);
        assert.equal(calcPrice(SPOT, '24', null), null);
    });

    test('returns null for unknown karat code', () => {
        assert.equal(calcPrice(SPOT, '99', AED_PEG), null);
    });

    test('defaults to gram unit', () => {
        const gram = calcPrice(SPOT, '24', AED_PEG);
        const gramExplicit = calcPrice(SPOT, '24', AED_PEG, 'gram');
        assert.equal(gram, gramExplicit);
    });
});

describe('calculateAllPrices', () => {
    const SPOT = 3100;
    const FX = { SAR: 3.75, KWD: 0.307 };
    const KARATS = [
        { code: '24', purity: 1.0 },
        { code: '18', purity: 0.75 },
    ];
    const COUNTRIES = [
        { code: 'AE', currency: 'AED' },
        { code: 'SA', currency: 'SAR' },
        { code: 'KW', currency: 'KWD' },
        { code: 'XX', currency: 'XXX' }, // unknown currency
    ];

    test('returns empty object for zero spot', () => {
        assert.deepEqual(calculateAllPrices(0, FX, KARATS, COUNTRIES), {});
    });

    test('generates keys for all country × karat combinations', () => {
        const prices = calculateAllPrices(SPOT, FX, KARATS, COUNTRIES);
        assert.ok(prices['AE_24']);
        assert.ok(prices['AE_18']);
        assert.ok(prices['SA_24']);
        assert.ok(prices['KW_18']);
        assert.ok(prices['XX_24']);
    });

    test('AED uses fixed peg, not API rate', () => {
        const prices = calculateAllPrices(SPOT, { AED: 999 }, KARATS, COUNTRIES);
        assert.equal(prices['AE_24'].fxRate, AED_PEG);
        assert.equal(prices['AE_24'].fxSource, 'fixed-peg');
    });

    test('SAR uses API rate', () => {
        const prices = calculateAllPrices(SPOT, FX, KARATS, COUNTRIES);
        assert.equal(prices['SA_24'].fxRate, 3.75);
        assert.equal(prices['SA_24'].fxSource, 'api');
    });

    test('unknown currency has null local prices', () => {
        const prices = calculateAllPrices(SPOT, FX, KARATS, COUNTRIES);
        assert.equal(prices['XX_24'].localPerGram, null);
        assert.equal(prices['XX_24'].localPerOz, null);
        assert.equal(prices['XX_24'].fxSource, 'unavailable');
    });

    test('USD prices are consistent across countries for same karat', () => {
        const prices = calculateAllPrices(SPOT, FX, KARATS, COUNTRIES);
        assert.equal(prices['AE_24'].usdPerGram, prices['SA_24'].usdPerGram);
        assert.equal(prices['AE_18'].usdPerOz, prices['KW_18'].usdPerOz);
    });

    test('18K prices are 75% of 24K prices', () => {
        const prices = calculateAllPrices(SPOT, FX, KARATS, COUNTRIES);
        const ratio = prices['AE_18'].usdPerGram / prices['AE_24'].usdPerGram;
        assert.ok(Math.abs(ratio - 0.75) < 0.001);
    });

    test('local per gram = USD per gram × FX rate', () => {
        const prices = calculateAllPrices(SPOT, FX, KARATS, COUNTRIES);
        const saPrice = prices['SA_24'];
        const expected = saPrice.usdPerGram * 3.75;
        assert.ok(Math.abs(saPrice.localPerGram - expected) < 0.001);
    });

    test('tola calculation is correct', () => {
        const prices = calculateAllPrices(SPOT, FX, KARATS, COUNTRIES);
        const aePrice = prices['AE_24'];
        const expectedTola = aePrice.usdPerGram * TOLA_GRAMS;
        assert.ok(Math.abs(aePrice.usdPerTola - expectedTola) < 0.001);
    });
});
