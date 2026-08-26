/**
 * Provider-neutral precious-metal history contract.
 *
 * The module is deliberately pure: it validates and annotates observations but never fetches,
 * interpolates, rebases, or shifts a provider's history. All values are USD per troy ounce; UI
 * conversion happens after this layer.
 */

import { getMetal, metalKeys } from '../config/metals.js';

export const METAL_SERIES_RESOLUTIONS = Object.freeze([
  '5m',
  '15m',
  '1h',
  '4h',
  '1d',
  '1w',
  '1mo',
  'live',
]);

export const METAL_SERIES_FRESHNESS_STATES = Object.freeze([
  'live',
  'updated',
  'delayed',
  'cached',
  'stale',
  'fallback',
  'historical',
  'estimated',
  'closed',
  'unavailable',
]);

export const METAL_SERIES_RANGE_DAYS = Object.freeze({
  '1D': 1,
  '24H': 1,
  '1W': 7,
  '7D': 7,
  '1M': 30,
  '30D': 30,
  '3M': 90,
  '90D': 90,
  '6M': 183,
  '1Y': 365,
  '3Y': 365 * 3,
  '5Y': 365 * 5,
});

export const METAL_SERIES_QUALITY = Object.freeze({
  gapMultiplier: 3,
  materialOutlierRatio: 0.25,
  sourceTransitionRatio: 0.03,
  staleFinalPointMs: 15 * 60 * 1000,
});

const RESOLUTION_ALIASES = Object.freeze({
  '5min': '5m',
  '15min': '15m',
  hourly: '1h',
  daily: '1d',
  weekly: '1w',
  monthly: '1mo',
});

const RESOLUTION_MS = Object.freeze({
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1mo': 30 * 24 * 60 * 60 * 1000,
});

const FRESHNESS_RANK = Object.freeze({
  live: 0,
  updated: 1,
  delayed: 2,
  cached: 3,
  historical: 4,
  estimated: 5,
  stale: 6,
  fallback: 7,
  closed: 8,
  unavailable: 9,
});

function toIsoUtc(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01T00:00:00.000Z`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00.000Z`;
  }
  const numeric = typeof value === 'number' ? value : Number.NaN;
  const normalized =
    Number.isFinite(numeric) && numeric > 0 && numeric < 1e12 ? numeric * 1000 : value;
  const date = normalized instanceof Date ? normalized : new Date(normalized);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function normalizeMetalSymbol(value) {
  const candidate = String(value || '').trim();
  for (const key of metalKeys()) {
    const metal = getMetal(key);
    if (candidate.toLowerCase() === key || candidate.toUpperCase() === metal.symbol) {
      return metal.symbol;
    }
  }
  return null;
}

function normalizeResolution(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  const normalized = RESOLUTION_ALIASES[raw] || raw;
  return METAL_SERIES_RESOLUTIONS.includes(normalized) ? normalized : null;
}

function normalizeFreshness(value, resolution) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (METAL_SERIES_FRESHNESS_STATES.includes(raw)) return raw;
  return resolution === 'live' ? null : 'historical';
}

function uniqueFlags(values = []) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()))].sort();
}

function withFlags(point, flags) {
  return Object.freeze({ ...point, qualityFlags: uniqueFlags(flags) });
}

/**
 * Normalize one raw provider/history observation.
 *
 * @param {object} raw
 * @param {object} defaults
 * @returns {object|null}
 */
export function normalizeMetalPoint(raw = {}, defaults = {}) {
  if (!raw || typeof raw !== 'object') return null;
  const timestamp = toIsoUtc(raw.timestamp ?? raw.date ?? raw.time);
  const valueUsdPerOz = Number(raw.valueUsdPerOz ?? raw.price ?? raw.spot ?? raw.value);
  const metal = normalizeMetalSymbol(raw.metal ?? defaults.metal);
  const resolution = normalizeResolution(raw.resolution ?? raw.granularity ?? defaults.resolution);
  const freshnessState = normalizeFreshness(
    raw.freshnessState ?? raw.state ?? defaults.freshnessState,
    resolution
  );
  const ingestedAt = toIsoUtc(raw.ingestedAt ?? raw.fetchedAt ?? defaults.ingestedAt);

  if (
    !timestamp ||
    !Number.isFinite(valueUsdPerOz) ||
    valueUsdPerOz <= 0 ||
    !metal ||
    !resolution ||
    !freshnessState ||
    !ingestedAt
  ) {
    return null;
  }

  const sourceId = String(raw.sourceId ?? raw.source ?? defaults.sourceId ?? '').trim();
  const flags = uniqueFlags([
    ...(Array.isArray(raw.qualityFlags) ? raw.qualityFlags : []),
    ...(sourceId ? [] : ['source-missing']),
  ]);

  return Object.freeze({
    timestamp,
    valueUsdPerOz,
    metal,
    resolution,
    sourceId: sourceId || 'unknown',
    ...(toIsoUtc(raw.providerTimestamp)
      ? { providerTimestamp: toIsoUtc(raw.providerTimestamp) }
      : {}),
    ingestedAt,
    freshnessState,
    derived: raw.derived === true,
    verified: raw.verified === true,
    isCurrentAnchor: raw.isCurrentAnchor === true,
    qualityFlags: flags,
  });
}

function collisionScore(point) {
  return [
    point.verified ? 1 : 0,
    point.derived ? 0 : 1,
    point.isCurrentAnchor ? 1 : 0,
    -(FRESHNESS_RANK[point.freshnessState] ?? 99),
    new Date(point.ingestedAt).getTime(),
  ];
}

function compareScores(left, right) {
  const a = collisionScore(left);
  const b = collisionScore(right);
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return right.sourceId.localeCompare(left.sourceId);
}

function annotateQuality(points, options) {
  if (!points.length) return [];
  const gapMultiplier = options.gapMultiplier ?? METAL_SERIES_QUALITY.gapMultiplier;
  const outlierRatio = options.materialOutlierRatio ?? METAL_SERIES_QUALITY.materialOutlierRatio;
  const generatedAtMs = new Date(options.generatedAt).getTime();
  const staleFinalPointMs = options.staleFinalPointMs ?? METAL_SERIES_QUALITY.staleFinalPointMs;

  const annotated = points.map((point, index) => {
    const flags = [...point.qualityFlags];
    const previous = points[index - 1];
    if (previous) {
      const gapMs = new Date(point.timestamp).getTime() - new Date(previous.timestamp).getTime();
      const expectedMs = RESOLUTION_MS[previous.resolution] || RESOLUTION_MS[point.resolution];
      if (expectedMs && gapMs > expectedMs * gapMultiplier) flags.push('gap-before');
      const relativeMove =
        Math.abs(point.valueUsdPerOz - previous.valueUsdPerOz) / previous.valueUsdPerOz;
      if (relativeMove > outlierRatio) flags.push('material-outlier-review');
    }
    if (
      index === points.length - 1 &&
      !['historical', 'estimated', 'closed'].includes(point.freshnessState) &&
      generatedAtMs - new Date(point.timestamp).getTime() > staleFinalPointMs
    ) {
      flags.push('stale-final-point');
    }
    return withFlags(point, flags);
  });
  return annotated;
}

function expectedStartForRange(points, requestedRange) {
  if (!points.length) return null;
  const days = METAL_SERIES_RANGE_DAYS[String(requestedRange || '').toUpperCase()];
  if (!days) return null;
  return new Date(new Date(points.at(-1).timestamp).getTime() - days * 86400000).toISOString();
}

/**
 * Normalize, sort, de-duplicate, and describe a complete series.
 *
 * @param {object[]} rawPoints
 * @param {object} options
 * @returns {{ points: object[], metadata: object }}
 */
export function buildMetalSeries(rawPoints = [], options = {}) {
  const generatedAt = toIsoUtc(options.generatedAt ?? new Date()) || new Date().toISOString();
  const metal = normalizeMetalSymbol(options.metal);
  const normalized = (Array.isArray(rawPoints) ? rawPoints : [])
    .map((point) =>
      normalizeMetalPoint(point, {
        metal,
        resolution: options.resolution,
        freshnessState: options.freshnessState,
        sourceId: options.sourceId,
        ingestedAt: generatedAt,
      })
    )
    .filter((point) => !metal || point.metal === metal)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp));

  const byTimestamp = new Map();
  for (const point of normalized) {
    const existing = byTimestamp.get(point.timestamp);
    if (!existing) {
      byTimestamp.set(point.timestamp, point);
      continue;
    }
    const winner = compareScores(point, existing) > 0 ? point : existing;
    byTimestamp.set(
      point.timestamp,
      withFlags(winner, [...winner.qualityFlags, 'timestamp-collision-deduped'])
    );
  }

  const points = Object.freeze(
    annotateQuality([...byTimestamp.values()], { ...options, generatedAt }).sort((left, right) =>
      left.timestamp.localeCompare(right.timestamp)
    )
  );
  const sourceIds = [...new Set(points.map((point) => point.sourceId))].sort();
  const resolutions = [...new Set(points.map((point) => point.resolution))];
  const expectedStart =
    toIsoUtc(options.expectedStart) || expectedStartForRange(points, options.requestedRange);
  const partiallyCovered = Boolean(
    points.length && expectedStart && new Date(points[0].timestamp) > new Date(expectedStart)
  );
  const warnings = uniqueFlags([
    ...(!points.length ? ['no-data'] : []),
    ...(partiallyCovered ? ['partial-coverage'] : []),
    ...(sourceIds.length > 1 ? ['mixed-sources'] : []),
    ...(points.some((point) => point.qualityFlags.includes('gap-before')) ? ['gaps-detected'] : []),
    ...(points.some((point) => point.qualityFlags.includes('material-outlier-review'))
      ? ['material-outlier-review']
      : []),
    ...(points.some((point) => point.qualityFlags.includes('stale-final-point'))
      ? ['stale-final-point']
      : []),
    ...(Array.isArray(options.warnings) ? options.warnings : []),
  ]);

  return Object.freeze({
    points,
    metadata: Object.freeze({
      metal: metal || points[0]?.metal || null,
      requestedRange: String(options.requestedRange || 'ALL').toUpperCase(),
      effectiveStart: points[0]?.timestamp || null,
      effectiveEnd: points.at(-1)?.timestamp || null,
      pointCount: points.length,
      effectiveResolution:
        resolutions.length === 1 ? resolutions[0] : resolutions.length ? 'mixed' : 'unavailable',
      currency: options.currency || 'USD',
      unit: options.unit || 'oz',
      ...(options.purityCode ? { purityCode: String(options.purityCode) } : {}),
      sourceIds,
      mixedSources: sourceIds.length > 1,
      partiallyCovered,
      delayed: points.some((point) =>
        ['delayed', 'cached', 'stale', 'fallback'].includes(point.freshnessState)
      ),
      derived: points.some((point) => point.derived),
      generatedAt,
      ...(toIsoUtc(options.nextExpectedUpdate)
        ? { nextExpectedUpdate: toIsoUtc(options.nextExpectedUpdate) }
        : {}),
      warnings,
    }),
  });
}

/** Filter on the latest observed point, not wall-clock time. */
export function filterMetalSeriesByRange(points = [], range = 'ALL') {
  const normalizedRange = String(range || 'ALL').toUpperCase();
  if (normalizedRange === 'ALL') return [...points];
  const days = METAL_SERIES_RANGE_DAYS[normalizedRange];
  if (!days || !points.length) return [...points];
  const latestMs = new Date(points.at(-1).timestamp).getTime();
  const cutoff = latestMs - days * 86400000;
  return points.filter((point) => new Date(point.timestamp).getTime() >= cutoff);
}

function addMetadataWarning(series, warning) {
  const warnings = uniqueFlags([...(series.metadata?.warnings || []), warning]);
  return Object.freeze({
    points: series.points,
    metadata: Object.freeze({ ...series.metadata, warnings }),
  });
}

/**
 * Append a distinct current quote without altering any historical value.
 *
 * @param {{ points: object[], metadata: object }} series
 * @param {object} quote
 * @param {object} options
 */
export function appendCurrentAnchor(series, quote = {}, options = {}) {
  const base = series?.points && series?.metadata ? series : buildMetalSeries([], options);
  const expectedMetal = normalizeMetalSymbol(options.metal ?? base.metadata.metal);
  const quoteMetal = normalizeMetalSymbol(quote.metal ?? expectedMetal);
  if (!expectedMetal || quoteMetal !== expectedMetal)
    return addMetadataWarning(base, 'current-anchor-metal-mismatch');

  const freshnessState = normalizeFreshness(
    quote.freshnessState ?? quote.state ?? quote.status,
    'live'
  );
  if (!freshnessState || freshnessState === 'unavailable') {
    return addMetadataWarning(base, 'current-anchor-freshness-unknown');
  }

  const anchor = normalizeMetalPoint(
    {
      timestamp: quote.providerTimestamp ?? quote.updatedAt ?? quote.timestamp,
      valueUsdPerOz: quote.valueUsdPerOz ?? quote.price ?? quote.spot,
      metal: expectedMetal,
      resolution: 'live',
      sourceId: quote.sourceId ?? quote.source ?? quote.providerId,
      providerTimestamp: quote.providerTimestamp ?? quote.updatedAt ?? quote.timestamp,
      ingestedAt: quote.ingestedAt ?? quote.fetchedAt ?? options.generatedAt,
      freshnessState,
      derived: quote.derived === true,
      verified: quote.verified === true,
      isCurrentAnchor: true,
      qualityFlags: quote.qualityFlags,
    },
    { ingestedAt: options.generatedAt ?? base.metadata.generatedAt }
  );
  if (!anchor) return addMetadataWarning(base, 'current-anchor-invalid');

  const last = base.points.at(-1);
  if (last && new Date(anchor.timestamp) <= new Date(last.timestamp)) {
    return addMetadataWarning(base, 'current-anchor-not-newer');
  }

  let nextAnchor = anchor;
  const transitionRatio =
    options.sourceTransitionRatio ?? METAL_SERIES_QUALITY.sourceTransitionRatio;
  const extraWarnings = [];
  if (last) {
    const ratio = Math.abs(anchor.valueUsdPerOz - last.valueUsdPerOz) / last.valueUsdPerOz;
    if (ratio > transitionRatio) {
      nextAnchor = withFlags(anchor, [...anchor.qualityFlags, 'source-transition-discrepancy']);
      extraWarnings.push('source-transition-discrepancy');
    }
  }

  return buildMetalSeries([...base.points, nextAnchor], {
    ...options,
    metal: expectedMetal,
    requestedRange: base.metadata.requestedRange,
    currency: base.metadata.currency,
    unit: base.metadata.unit,
    purityCode: base.metadata.purityCode,
    generatedAt: options.generatedAt ?? base.metadata.generatedAt,
    warnings: [...(base.metadata.warnings || []), ...extraWarnings],
  });
}
