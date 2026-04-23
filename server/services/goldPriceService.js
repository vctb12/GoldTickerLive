/**
 * services/goldPriceService.js
 * Reads the canonical gold-price payload written by
 * `scripts/fetch_gold_price.py` (source: goldpricez.com) from the
 * committed file `data/gold_price.json`.
 *
 * This module is Node-side; it reads the file from disk and returns the
 * same `{ price, updatedAt, source, fromCache? }` shape that callers
 * previously got from the external multi-provider fetch.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolve the data file relative to the repo root (two levels up from
 * server/services).
 */
const DATA_FILE = path.resolve(__dirname, '..', '..', 'data', 'gold_price.json');

/**
 * Fetch live gold spot price by reading the committed data file.
 * @returns {Promise<{ price: number, updatedAt: string, source: string, fromCache?: boolean }>}
 */
export async function fetchGoldPrice() {
  let raw;
  try {
    raw = await fs.readFile(DATA_FILE, 'utf8');
  } catch (err) {
    throw new Error(`Gold price data file not available: ${err.message}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Gold price data file is not valid JSON: ${err.message}`);
  }

  const price = data?.gold?.ounce_usd;
  if (typeof price !== 'number' || price <= 0) {
    throw new Error('Gold price data file missing or invalid gold.ounce_usd');
  }

  return {
    price,
    updatedAt: data.fetched_at_utc || new Date().toISOString(),
    source: 'goldpricez',
    fromCache: false,
  };
}
