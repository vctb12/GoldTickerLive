/**
 * Parse `/data/last_gold_price.json` — tweet-guard schema and legacy nested shape.
 * @param {unknown} payload
 * @returns {{ price: number, providerTimestamp: string|null, providerRaw: object }|null}
 */
export function parseLastGoldPriceSnapshot(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const nested = payload?.gold?.ounce_usd;
  const flat = payload?.price;
  const rawPrice = Number.isFinite(Number(nested)) && Number(nested) > 0 ? nested : flat;
  const price = Number(rawPrice);

  if (!Number.isFinite(price) || price <= 0) return null;

  const providerTimestamp =
    payload?.posted_at_utc ||
    payload?.updatedAt ||
    payload?.timestamp_utc ||
    payload?.fetched_at_utc ||
    null;

  return { price, providerTimestamp, providerRaw: payload };
}
