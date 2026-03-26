import { CONSTANTS } from '../config/index.js';
import { KARATS } from '../config/index.js';

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

export function exportCSV(countries, karatCode, prices, lang = 'en') {
  if (!prices || !prices[karatCode]) return;
  const karat = KARATS.find(k => k.code === karatCode);
  const karatLabel = lang === 'ar' ? karat?.labelAr : karat?.labelEn;
  const timestamp = new Date().toISOString();

  const rows = [
    [`Gold Prices Export — ${karatLabel} — ${timestamp}`],
    ['Country', 'Currency', 'Price per Gram', 'Price per Ounce'],
  ];

  for (const country of countries) {
    const priceData = prices[karatCode]?.[country.currency];
    if (priceData) {
      rows.push([
        lang === 'ar' ? country.nameAr : country.nameEn,
        country.currency,
        priceData.gram?.toFixed(country.decimals) ?? '—',
        priceData.oz?.toFixed(country.decimals) ?? '—',
      ]);
    }
  }

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadFile(csv, `gold-prices-${karatCode}k-${Date.now()}.csv`, 'text/csv');
}

export function exportJSON(STATE, prices) {
  const payload = {
    exportedAt: new Date().toISOString(),
    goldPriceUsdPerOz: STATE.goldPriceUsdPerOz,
    goldUpdatedAt: STATE.freshness.goldUpdatedAt,
    fxUpdatedAt: STATE.freshness.fxUpdatedAt,
    aedPeg: CONSTANTS.AED_PEG,
    prices,
    rates: STATE.rates,
    note: 'Estimated bullion-equivalent values only. Not financial advice.',
  };
  const json = JSON.stringify(payload, null, 2);
  downloadFile(json, `gold-prices-${Date.now()}.json`, 'application/json');
}
