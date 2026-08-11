'use strict';

// Authoritative troy-ounce conversion shared by Node/server pricing consumers.
const TROY_OZ_GRAMS = 31.1034768;

const ozToGram = (oz) => Number(oz) * TROY_OZ_GRAMS;
const gramToOz = (grams) => Number(grams) / TROY_OZ_GRAMS;

module.exports = { TROY_OZ_GRAMS, ozToGram, gramToOz };
