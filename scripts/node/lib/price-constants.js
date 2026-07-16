/**
 * scripts/node/lib/price-constants.js — canonical price-math constants for Node scripts.
 *
 * Single source of truth for the script tier (tweet/notify/RSS/newsletter/spike-alert).
 * These values are immutable product facts — see AGENTS.md:
 *
 *   - AED_PEG: the UAE Dirham is pegged to USD at exactly 3.6725 (UAE Central Bank).
 *     No fetched FX rate may ever override it.
 *   - TROY_OZ_GRAMS: pipeline-exact troy ounce, 31.1034768 g — the same value the
 *     Python pipeline writers use (scripts/python/gold_providers/base.py,
 *     post_gold_price.py). NOTE: src/config/constants.js still carries the rounded
 *     31.1035 for the client pending owner decision Q4 in
 *     docs/plans/midas/RISK_REGISTER.md — do NOT change that file here.
 */
'use strict';

const AED_PEG = 3.6725;
const TROY_OZ_GRAMS = 31.1034768;

module.exports = { AED_PEG, TROY_OZ_GRAMS };
