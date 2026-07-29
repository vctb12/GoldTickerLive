#!/usr/bin/env node
/**
 * Reproducible audit for UAE homepage historical chart data sources.
 * Run: node scripts/node/audit-uae-history-source.js
 * Output: reports/uae-history-source-audit-YYYY-MM-DD.md (and JSON alongside)
 */

const fs = require('fs');
const path = require('path');

const ENDPOINT = 'https://freegoldapi.com/data/latest.json';
const TRUSTED_SOURCES = new Set(['yahoo_finance', 'worldbank']);
const SANITY_MIN = 1000;
const SANITY_MAX = 10000;

const RANGE_DAYS = { '1M': 30, '3M': 90, '6M': 180, '12M': 365 };

function isoTodayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ms = new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

function isSane(price) {
  return Number.isFinite(price) && price >= SANITY_MIN && price <= SANITY_MAX;
}

function normalizeFreegoldRow(row) {
  if (!row?.date || !isSane(Number(row.price))) return null;
  if (row.date < '2019-01-01') return null;
  if (!TRUSTED_SOURCES.has(row.source)) return null;
  return {
    date: row.date.slice(0, 10),
    price: Number(row.price),
    source: 'freegoldapi-reference',
    upstreamSource: row.source,
    granularity: 'daily',
    derived: true,
  };
}

function baselineToRecord(entry) {
  return {
    date: entry.date.length === 7 ? `${entry.date}-01` : entry.date.slice(0, 10),
    price: Number(entry.price),
    source: entry.estimated ? 'estimated' : 'monthly-baseline-embedded',
    granularity: 'monthly',
    derived: false,
  };
}

function loadBaseline() {
  const file = path.join(__dirname, '../../src/data/historical-baseline.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')).map(baselineToRecord);
}

function mergeUnified(baseline, freegold) {
  const monthMap = new Map();
  for (const r of baseline) monthMap.set(r.date.slice(0, 7), r);
  const dayMap = new Map();
  for (const r of freegold) {
    const month = r.date.slice(0, 7);
    if (monthMap.has(month)) monthMap.delete(month);
    dayMap.set(r.date, r);
  }
  return [...monthMap.values(), ...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function maxConsecutiveGap(dates) {
  if (dates.length < 2) return 0;
  let max = 0;
  for (let i = 1; i < dates.length; i++) {
    max = Math.max(max, daysBetween(dates[i - 1], dates[i]));
  }
  return max;
}

function filterByRange(points, days) {
  if (!points.length) return [];
  const latest = points[points.length - 1].date;
  const cutoff = new Date(`${latest}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= cutoffStr);
}

function classifyFreshness(latestDate, auditDate) {
  const age = daysBetween(latestDate, auditDate);
  if (age <= 7) return 'current';
  if (age <= 60) return 'delayed';
  return 'stale';
}

async function fetchEndpoint() {
  const started = Date.now();
  const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(15000) });
  const headers = {};
  res.headers.forEach((v, k) => {
    headers[k] = v;
  });
  const raw = await res.json();
  return {
    status: res.status,
    headers,
    raw,
    elapsedMs: Date.now() - started,
  };
}

async function main() {
  const auditDate = isoTodayUtc();
  const auditTs = new Date().toISOString();

  const fetchResult = await fetchEndpoint();
  const rawRows = Array.isArray(fetchResult.raw) ? fetchResult.raw : [];

  const accepted = [];
  const rejected = { pre2019: 0, badSource: 0, badPrice: 0, badDate: 0 };

  for (const row of rawRows) {
    if (!row?.date) {
      rejected.badDate++;
      continue;
    }
    if (row.date < '2019-01-01') {
      rejected.pre2019++;
      continue;
    }
    if (!TRUSTED_SOURCES.has(row.source)) {
      rejected.badSource++;
      continue;
    }
    if (!isSane(Number(row.price))) {
      rejected.badPrice++;
      continue;
    }
    accepted.push(normalizeFreegoldRow(row));
  }

  const baseline = loadBaseline();
  const unified = mergeUnified(baseline, accepted);
  const latestAccepted = unified.length ? unified[unified.length - 1].date : null;
  const earliestAccepted = unified.length ? unified[0].date : null;
  const ageDays = latestAccepted ? daysBetween(latestAccepted, auditDate) : null;
  const freshness = latestAccepted ? classifyFreshness(latestAccepted, auditDate) : 'unavailable';

  const sourceCounts = {};
  const granularityCounts = {};
  for (const r of unified) {
    sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
    granularityCounts[r.granularity] = (granularityCounts[r.granularity] || 0) + 1;
  }

  const rangeAnalysis = {};
  for (const [key, days] of Object.entries(RANGE_DAYS)) {
    const slice = filterByRange(unified, days);
    const dailyCount = slice.filter((r) => r.granularity === 'daily').length;
    rangeAnalysis[key] = {
      totalObservations: slice.length,
      dailyObservations: dailyCount,
      monthlyObservations: slice.length - dailyCount,
      windowEnd: slice.length ? slice[slice.length - 1].date : null,
      windowStart: slice.length ? slice[0].date : null,
      endsNearAuditDate: slice.length ? daysBetween(slice[slice.length - 1].date, auditDate) <= 7 : false,
    };
  }

  const y2025 = accepted.filter((r) => r.date >= '2025-01-01');
  const sourceBreakdown2025 = {};
  for (const r of y2025) {
    const k = r.upstreamSource || r.source;
    sourceBreakdown2025[k] = (sourceBreakdown2025[k] || 0) + 1;
  }

  const report = {
    auditTimestampUtc: auditTs,
    auditDate,
    endpoint: ENDPOINT,
    httpStatus: fetchResult.status,
    cors: fetchResult.headers['access-control-allow-origin'] || null,
    cacheControl: fetchResult.headers['cache-control'] || null,
    lastModified: fetchResult.headers['last-modified'] || null,
    etag: fetchResult.headers['etag'] || null,
    fetchElapsedMs: fetchResult.elapsedMs,
    rawRecordCount: rawRows.length,
    acceptedRecordCount: accepted.length,
    rejected,
    freegoldLatestRaw: rawRows.length ? rawRows[rawRows.length - 1] : null,
    unifiedEarliest: earliestAccepted,
    unifiedLatest: latestAccepted,
    latestAgeDays: ageDays,
    freshnessClassification: freshness,
    sourceCounts,
    granularityCounts,
    maxConsecutiveDayGap: maxConsecutiveGap(unified.map((r) => r.date)),
    rangeAnalysis,
    y2025Plus: {
      count: y2025.length,
      first: y2025[0] || null,
      last: y2025[y2025.length - 1] || null,
      sources: sourceBreakdown2025,
    },
    baseline: {
      file: 'src/data/historical-baseline.json',
      count: baseline.length,
      earliest: baseline[0]?.date,
      latest: baseline[baseline.length - 1]?.date,
      provenanceNote:
        'Embedded monthly XAU/USD rows. Original upstream source not documented in git history; do not label as verified LBMA/public-domain without owner confirmation.',
    },
    conclusion:
      freshness === 'stale'
        ? 'Historical daily reference ends months before audit date. Chart must show stale/delayed coverage — not present as current.'
        : 'Review range usability before release.',
  };

  const outDir = path.join(__dirname, '../../reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const stamp = auditDate;
  const jsonPath = path.join(outDir, `uae-history-source-audit-${stamp}.json`);
  const mdPath = path.join(outDir, `uae-history-source-audit-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const md = `# UAE History Source Audit — ${stamp}

**Audit UTC:** ${auditTs}

## Endpoint

| Field | Value |
|-------|-------|
| URL | ${ENDPOINT} |
| HTTP status | ${report.httpStatus} |
| CORS | ${report.cors} |
| Cache-Control | ${report.cacheControl} |
| Last-Modified | ${report.lastModified} |
| Fetch time | ${report.fetchElapsedMs}ms |

## Raw vs accepted (freegoldapi)

| Metric | Value |
|--------|-------|
| Raw records | ${report.rawRecordCount} |
| Accepted (repo normalizer) | ${report.acceptedRecordCount} |
| Rejected pre-2019 | ${report.rejected.pre2019} |
| Rejected bad source | ${report.rejected.badSource} |
| Rejected bad price | ${report.rejected.badPrice} |

**Latest raw row:** \`${JSON.stringify(report.freegoldLatestRaw)}\`

## Unified history (baseline + accepted freegold)

| Metric | Value |
|--------|-------|
| Earliest | ${report.unifiedEarliest} |
| Latest | ${report.unifiedLatest} |
| Age of latest (days) | ${report.latestAgeDays} |
| Freshness | **${report.freshnessClassification}** |
| Max consecutive-day gap | ${report.maxConsecutiveDayGap} |

### Source counts

${Object.entries(report.sourceCounts)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

### Granularity counts

${Object.entries(report.granularityCounts)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

## 2025+ accepted freegold rows

- Count: ${report.y2025Plus.count}
- First: ${report.y2025Plus.first?.date}
- Last: ${report.y2025Plus.last?.date}
- Sources: ${JSON.stringify(report.y2025Plus.sources)}

## Range usability (anchored on latest unified record)

| Range | Observations | Daily | Monthly | Window | Ends near today? |
|-------|-------------|-------|---------|--------|------------------|
${Object.entries(report.rangeAnalysis)
  .map(
    ([k, v]) =>
      `| ${k} | ${v.totalObservations} | ${v.dailyObservations} | ${v.monthlyObservations} | ${v.windowStart} → ${v.windowEnd} | ${v.endsNearAuditDate ? 'yes' : 'no'} |`
  )
  .join('\n')}

## Baseline provenance

- File: \`${report.baseline.file}\`
- Rows: ${report.baseline.count} (${report.baseline.earliest} → ${report.baseline.latest})
- **${report.baseline.provenanceNote}**

## Conclusion

${report.conclusion}
`;

  fs.writeFileSync(mdPath, md);
  console.log('Wrote', jsonPath);
  console.log('Wrote', mdPath);
  console.log(JSON.stringify({ latest: report.unifiedLatest, ageDays: report.latestAgeDays, freshness }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
