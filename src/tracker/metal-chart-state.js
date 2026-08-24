import { getMetal, PRIMARY_METAL } from '../config/metals.js';
import { isMetalsPilotEnabled } from '../config/metals-flags.js';
import { normalizeMetalSelection } from '../lib/metal-selector-state.js';

export function getActiveTrackerMetal(state) {
  if (!isMetalsPilotEnabled()) return PRIMARY_METAL;
  return normalizeMetalSelection({
    metal: state?.selectedMetal,
    grade: state?.selectedMetalPurity,
  }).metal;
}

export function getTrackerMetalQuote(state, currentGoldSpot) {
  const metalKey = getActiveTrackerMetal(state);
  if (metalKey === PRIMARY_METAL) {
    const price = Number(currentGoldSpot?.());
    if (!Number.isFinite(price) || price <= 0) return null;
    return {
      price,
      metalKey,
      symbol: getMetal(metalKey).symbol,
      providerTimestamp: state?.live?.sourceTimestamp || state?.live?.updatedAt || null,
      fetchedAt: state?.live?.fetchedAt || state?.live?.updatedAt || null,
      providerId: state?.live?.providerId || state?.live?.source || 'gold-reference',
      source: state?.live?.source || state?.live?.providerId || 'gold-reference',
      freshnessState: state?.live?.status || null,
      verified: state?.live?.isFresh === true,
      derived: false,
    };
  }
  return state?.metalQuotes?.[metalKey] || null;
}
