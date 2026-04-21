/**
 * Export utilities — CSV, JSON, Archive, Historical
 * ═══════════════════════════════════════════════════════════════════════════
 * Supports:
 *   exportCSV(countries, karatCode, prices, lang)   — current price snapshot
 *   exportJSON(STATE, prices)                        — full structured snapshot
 *   exportArchiveCSV(history, karatCode, aedPeg)     — cached daily archive
 *   exportHistoricalCSV(records, karatCode)          — monthly baseline + cached
 */

import { CONSTANTS } from '../config/index.js';
import { KARATS } from '../config/index.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvRow(cells) {
  return cells.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENT PRICE SNAPSHOT
// ─────────────────────────────────────────────────────────────────────────────

export function exportCSV(countries, karatCode, prices, lang = 'en') {
  if (!prices || !prices[karatCode]) return;
  const karat = KARATS.find((k) => k.code === karatCode);
  const karatLabel = lang === 'ar' ? karat?.labelAr : karat?.labelEn;
  const ts = new Date().toISOString();
  const purity = ((parseInt(karatCode, 10) / 24) * 100).toFixed(1);

  const header = [
    `# GoldPrices — ${karatLabel} Snapshot`,
    `# Exported: ${ts}`,
    '# Source: gold-api.com / open.er-api.com',
    `# AED peg: ${CONSTANTS.AED_PEG} fixed (UAE Central Bank)`,
    '# Note: Estimated bullion-equivalent values. Not financial advice.',
    '',
    csvRow(['Country', 'Currency', 'Price per Gram', 'Price per Ounce', 'Karat', 'Purity %']),
  ];

  const dataRows = [];
  for (const country of countries) {
    const priceData = prices[karatCode]?.[country.currency];
    if (priceData) {
      dataRows.push(
        csvRow([
          lang === 'ar' ? country.nameAr : country.nameEn,
          country.currency,
          priceData.gram?.toFixed(country.decimals) ?? '—',
          priceData.oz?.toFixed(country.decimals) ?? '—',
          `${karatCode}K`,
          `${purity}%`,
        ])
      );
    }
  }

  downloadFile(
    [...header, ...dataRows].join('\n'),
    `gold-prices-${karatCode}k-${isoDate()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON SNAPSHOT
// ─────────────────────────────────────────────────────────────────────────────

export function exportJSON(STATE, prices) {
  const payload = {
    exportedAt: new Date().toISOString(),
    goldPriceUsdPerOz: STATE.goldPriceUsdPerOz,
    goldUpdatedAt: STATE.freshness.goldUpdatedAt,
    fxUpdatedAt: STATE.freshness.fxUpdatedAt,
    dataSource: 'gold-api.com / open.er-api.com',
    aedPeg: CONSTANTS.AED_PEG,
    aedPegNote: 'Fixed UAE Central Bank rate since 1997',
    troyOzGrams: CONSTANTS.TROY_OZ_GRAMS,
    prices,
    rates: STATE.rates,
    disclaimer:
      'Estimated bullion-equivalent values only. Retail prices may differ. Not financial advice.',
  };
  downloadFile(
    JSON.stringify(payload, null, 2),
    `gold-prices-${isoDate()}.json`,
    'application/json'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVE CSV — daily cached snapshots (up to 90 days)
// ─────────────────────────────────────────────────────────────────────────────

export function exportArchiveCSV(history, karatCode = '24', aedPeg = CONSTANTS.AED_PEG) {
  if (!history?.length) {
    alert(
      'No cached history available yet. Visit the tracker daily to build a price archive, or export the full historical baseline instead.'
    );
    return;
  }

  const TROY = CONSTANTS.TROY_OZ_GRAMS;
  const purity = parseInt(karatCode, 10) / 24;

  const lines = [
    `# GoldPrices — Daily Archive (${karatCode}K)`,
    `# Exported: ${new Date().toISOString()}`,
    '# Source: locally cached snapshots (up to 90 days)',
    `# AED peg: ${aedPeg} fixed (UAE Central Bank)`,
    '# Note: Derived from XAU/USD spot. Not financial advice.',
    '',
    csvRow([
      'Date',
      'XAU/USD (spot)',
      `${karatCode}K USD/gram`,
      `${karatCode}K AED/gram`,
      `${karatCode}K USD/oz`,
      `${karatCode}K AED/oz`,
      'Data Source',
    ]),
  ];

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  for (const entry of sorted) {
    if (!entry.price) continue;
    const usdGram = (entry.price * purity) / TROY;
    const aedGram = usdGram * aedPeg;
    const usdOz = entry.price * purity;
    const aedOz = usdOz * aedPeg;
    lines.push(
      csvRow([
        entry.date,
        entry.price.toFixed(2),
        usdGram.toFixed(3),
        aedGram.toFixed(3),
        usdOz.toFixed(2),
        aedOz.toFixed(2),
        'local-snapshot',
      ])
    );
  }

  downloadFile(
    lines.join('\n'),
    `gold-archive-${karatCode}k-${isoDate()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL BASELINE CSV — monthly 2019-present + daily cache merged
// ─────────────────────────────────────────────────────────────────────────────

export function exportHistoricalCSV(records, karatCode = '24') {
  if (!records?.length) return;

  const TROY = CONSTANTS.TROY_OZ_GRAMS;
  const AED = CONSTANTS.AED_PEG;
  const purity = parseInt(karatCode, 10) / 24;

  const lines = [
    `# GoldPrices — Historical Gold Prices (${karatCode}K)`,
    `# Exported: ${new Date().toISOString()}`,
    '# Monthly averages: LBMA PM fix (2019–present, public domain records)',
    '# Daily entries: locally cached snapshots (recent 90 days)',
    `# AED peg: ${AED} fixed (UAE Central Bank since 1997)`,
    '# Note: Bullion-equivalent estimates. Not financial advice.',
    '',
    csvRow([
      'Date',
      'Granularity',
      'XAU/USD',
      `${karatCode}K USD/gram`,
      `${karatCode}K AED/gram`,
      'Source',
    ]),
  ];

  for (const r of records) {
    const usdGram = (r.price * purity) / TROY;
    const aedGram = usdGram * AED;
    lines.push(
      csvRow([
        r.date,
        r.granularity,
        r.price.toFixed(2),
        usdGram.toFixed(3),
        aedGram.toFixed(3),
        r.source,
      ])
    );
  }

  downloadFile(
    lines.join('\n'),
    `gold-history-${karatCode}k-${isoDate()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHART CSV — currently visible chart slice
// ─────────────────────────────────────────────────────────────────────────────

export function exportChartCSV(rows, range, karatCode = '24') {
  if (!rows?.length) return;
  const TROY = CONSTANTS.TROY_OZ_GRAMS;
  const AED = CONSTANTS.AED_PEG;
  const purity = parseInt(karatCode, 10) / 24;

  const lines = [
    `# GoldPrices — Visible Chart Slice (${karatCode}K, ${range || 'ALL'})`,
    `# Exported: ${new Date().toISOString()}`,
    `# Range filter: ${range || 'ALL'} · points: ${rows.length}`,
    `# AED peg: ${AED} fixed (UAE Central Bank)`,
    '# Note: Spot-linked estimates only. Not financial advice.',
    '',
    csvRow([
      'Date',
      'XAU/USD (spot)',
      `${karatCode}K USD/gram`,
      `${karatCode}K AED/gram`,
      'Source',
    ]),
  ];

  const sorted = [...rows].sort((a, b) => {
    const da = a.date instanceof Date ? a.date : new Date(a.date);
    const db = b.date instanceof Date ? b.date : new Date(b.date);
    return da - db;
  });

  for (const r of sorted) {
    const spot = r.spot ?? r.price;
    if (!spot) continue;
    const dateStr = r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date);
    const usdGram = (spot * purity) / TROY;
    const aedGram = usdGram * AED;
    lines.push(
      csvRow([
        dateStr,
        spot.toFixed(2),
        usdGram.toFixed(3),
        aedGram.toFixed(3),
        r.source || 'baseline',
      ])
    );
  }

  downloadFile(
    lines.join('\n'),
    `gold-chart-${karatCode}k-${range || 'all'}-${isoDate()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST CSV — favorite currencies at current prices
// ─────────────────────────────────────────────────────────────────────────────

export function exportWatchlistCSV({
  favorites,
  countries,
  karatCode,
  priceFor,
  spot,
  selectedUnit,
  selectedCurrency,
  lang = 'en',
}) {
  if (!favorites?.length || !spot) return;

  const karat = KARATS.find((k) => k.code === String(karatCode));
  const karatLabel = lang === 'ar' ? karat?.labelAr : karat?.labelEn;
  const _purity = parseInt(karatCode, 10) / 24;

  const lines = [
    `# GoldPrices — Market Watchlist (${karatCode}K, ${selectedUnit})`,
    `# Exported: ${new Date().toISOString()}`,
    `# XAU/USD at export time: ${spot.toFixed(2)}`,
    `# Karat: ${karatLabel || karatCode + 'K'} · Unit: ${selectedUnit}`,
    '# Note: Spot-linked estimates. Not financial advice.',
    '',
    csvRow(['Currency', 'Country', 'Price', 'Unit', 'Karat', 'Is selected view']),
  ];

  for (const cur of favorites) {
    const country = countries.find((c) => c.currency === cur);
    const p = priceFor({ currency: cur, karat: karatCode, unit: selectedUnit, spot });
    const name = lang === 'ar' ? country?.nameAr || country?.nameEn : country?.nameEn;
    lines.push(
      csvRow([
        cur,
        name || '—',
        p ? p.toFixed(country?.decimals ?? 2) : '—',
        selectedUnit,
        `${karatCode}K`,
        cur === selectedCurrency ? 'yes' : 'no',
      ])
    );
  }

  downloadFile(
    lines.join('\n'),
    `gold-watchlist-${karatCode}k-${isoDate()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRENT VIEW CSV — all markets at current prices (compare-board snapshot)
// ─────────────────────────────────────────────────────────────────────────────

export function exportCurrentViewCSV({
  countries,
  karatCode,
  priceFor,
  spot,
  selectedUnit,
  selectedCurrency,
  lang = 'en',
}) {
  if (!spot) return;

  const karat = KARATS.find((k) => k.code === String(karatCode));
  const karatLabel = lang === 'ar' ? karat?.labelAr : karat?.labelEn;

  const lines = [
    `# GoldPrices — Current View Snapshot (${karatCode}K, ${selectedUnit})`,
    `# Exported: ${new Date().toISOString()}`,
    `# XAU/USD at export time: ${spot.toFixed(2)}`,
    `# Karat: ${karatLabel || karatCode + 'K'} · Unit: ${selectedUnit}`,
    '# Note: Spot-linked estimates only. Not financial advice.',
    '',
    csvRow(['Country', 'Currency', 'Price', 'Unit', 'Is selected currency']),
  ];

  for (const c of countries) {
    const p = priceFor({ currency: c.currency, karat: karatCode, unit: selectedUnit, spot });
    const name = lang === 'ar' ? c.nameAr || c.nameEn : c.nameEn;
    lines.push(
      csvRow([
        name,
        c.currency,
        p ? p.toFixed(c.decimals ?? 2) : '—',
        selectedUnit,
        c.currency === selectedCurrency ? 'yes' : 'no',
      ])
    );
  }

  downloadFile(
    lines.join('\n'),
    `gold-current-view-${karatCode}k-${isoDate()}.csv`,
    'text/csv;charset=utf-8;'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIEF TEXT — market brief as plain text file
// ─────────────────────────────────────────────────────────────────────────────

export function exportBriefText(headline, body) {
  if (!headline) return;
  const content = [
    'GoldPrices — Market Brief',
    `Exported: ${new Date().toISOString()}`,
    '',
    headline,
    '',
    body || '',
    '',
    'Source: gold-api.com / open.er-api.com · Not financial advice.',
  ].join('\n');
  downloadFile(content, `gold-brief-${isoDate()}.txt`, 'text/plain;charset=utf-8;');
}
