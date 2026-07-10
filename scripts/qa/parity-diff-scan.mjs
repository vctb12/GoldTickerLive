// Runtime EN↔AR parity-diff scan. Loads each page in EN and AR, walks visible
// text nodes, and reports leaf strings that render BYTE-IDENTICALLY in both
// languages AND contain Latin letters — the signature of a hardcoded English
// literal that bypassed the i18n dict (an EN/AR parity bug that does NOT leak a
// raw key, so leaked-key-scan.mjs reports it clean).
//
//   python3 -m http.server 8080 &
//   node scripts/qa/parity-diff-scan.mjs            # summary counts
//   node scripts/qa/parity-diff-scan.mjs --list     # + every candidate string
import { chromium } from '@playwright/test';

const BASE = 'http://127.0.0.1:8080';
const LIST = process.argv.includes('--list');
const PAGES = [
  { name: 'home', path: '/index.html' },
  { name: 'tracker', path: '/tracker.html' },
  { name: 'calculator', path: '/calculator.html' },
  { name: 'shops', path: '/shops.html' },
  { name: 'methodology', path: '/methodology.html' },
  { name: 'country-uae', path: '/countries/uae/' },
];
function urlFor(p, lang) {
  if (lang === 'en') return BASE + p.path;
  if (p.name === 'tracker')
    return `${BASE}${p.path}#mode=live&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=ar`;
  return `${BASE}${p.path}?lang=ar`;
}

// Tokens that legitimately render identically in EN and AR (brand, tickers,
// units, currency/karat codes, source proper-nouns, symbols). Lower-cased compare.
const ALLOW_EXACT = new Set(
  [
    'Gold Ticker Live',
    'GoldTickerLive',
    'goldtickerlive.com',
    'XAU/USD',
    'XAU',
    'USD',
    'AED',
    'SAR',
    'KWD',
    'QAR',
    'BHD',
    'OMR',
    'EGP',
    'JOD',
    'CSV',
    'JSON',
    'VAT',
    'PWA',
    'API',
    'FX',
    'UTC',
    'GDELT',
    'DataHub',
    'ExchangeRate-API',
    'Supabase',
    'WhatsApp',
    'Leaflet',
    'OpenStreetMap',
    '·',
    '→',
    '←',
    '—',
    '•',
    '%',
    '24K',
    '22K',
    '21K',
    '20K',
    '18K',
    '16K',
    '14K',
    'g',
    'oz',
    'tola',
    'kg',
    '3.6725',
    '31.1035',
  ].map((s) => s.toLowerCase())
);
// A candidate must contain a Latin letter and at least one "word" of length ≥ 3,
// and not be a pure number / price / code.
const hasLatin = (s) => /[A-Za-z]/.test(s);
const isNumeric = (s) => /^[\s\d.,:/%+\-$()]+$/.test(s);
const isCodey = (s) => /^[A-Z0-9/.\-]+$/.test(s) && s.length <= 6; // AED, 24K, XAU/USD
const looksAllow = (s) => {
  const t = s.trim();
  if (ALLOW_EXACT.has(t.toLowerCase())) return true;
  // strip a trailing arrow/punct then re-check
  const core = t.replace(/[→←—•·:]+$/g, '').trim();
  if (ALLOW_EXACT.has(core.toLowerCase())) return true;
  return false;
};

async function visibleStrings(page) {
  return page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const el = n.parentElement;
      if (!el) continue;
      const tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const txt = n.nodeValue.replace(/\s+/g, ' ').trim();
      if (txt) out.push(txt);
    }
    return out;
  });
}

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const report = [];
for (const p of PAGES) {
  const sets = {};
  for (const lang of ['en', 'ar']) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 1400 } });
    const page = await ctx.newPage();
    await page
      .goto(urlFor(p, lang), { waitUntil: 'domcontentloaded', timeout: 25000 })
      .catch(() => {});
    await page.waitForSelector('h1, main', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2200);
    sets[lang] = await visibleStrings(page);
    await ctx.close();
  }
  // Candidates: strings present in BOTH en and ar, Latin-bearing, not allow-listed.
  const arSet = new Set(sets.ar.map((s) => s));
  const seen = new Set();
  const candidates = [];
  for (const s of sets.en) {
    if (seen.has(s)) continue;
    seen.add(s);
    if (!hasLatin(s)) continue;
    if (isNumeric(s)) continue;
    if (isCodey(s)) continue;
    if (looksAllow(s)) continue;
    if (arSet.has(s)) candidates.push(s);
  }
  report.push({ page: p.name, count: candidates.length, candidates });
}
await browser.close();

let total = 0;
for (const r of report) {
  total += r.count;
  console.log(`${r.page.padEnd(12)} identical-EN/AR Latin strings: ${r.count}`);
  if (LIST) for (const c of r.candidates) console.log(`    · ${c}`);
}
console.log(`\nTOTAL candidate unhydrated strings: ${total}`);
