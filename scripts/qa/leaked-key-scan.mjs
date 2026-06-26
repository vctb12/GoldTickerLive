// Runtime leaked-i18n-key scan. Loads each page in EN and AR and asserts no
// visible text is a raw translation key (namespace.key.key or UPPER.CASE.DOT) —
// the signature of a fail-open lookup (`?? key`). Catches leaks from ANY helper
// (global TRANSLATIONS or a page's local dict). Run against the :8080 dev server.
//   node scripts/qa/leaked-key-scan.mjs
import { chromium } from '@playwright/test';

// Requires the repo root served on :8080 (same as the Playwright e2e config):
//   python3 -m http.server 8080 &   # then:
//   node scripts/qa/leaked-key-scan.mjs
const BASE = 'http://127.0.0.1:8080';
const PAGES = [
  { name: 'home', path: '/index.html' },
  { name: 'tracker', path: '/tracker.html' },
  { name: 'calculator', path: '/calculator.html' },
  { name: 'shops', path: '/shops.html' },
  { name: 'methodology', path: '/methodology.html' },
  { name: 'country-uae', path: '/countries/uae/' },
];
// AR is selected via ?lang=ar everywhere except the tracker, which reads the hash.
function urlFor(p, lang) {
  if (lang === 'en') return BASE + p.path;
  if (p.name === 'tracker') return `${BASE}${p.path}#mode=live&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=ar`;
  return `${BASE}${p.path}?lang=ar`;
}

const NAMESPACES =
  'home|tracker|calc|calculator|shops|country|methodology|method|nav|footer|common|source|freshness|status|compare|invest|learn|account|dashboard|terms|privacy|markets|alerts|planner|exports|archive|chart|karat|liveToolbar|watchlist|decision|controls|summary|hints|quickTools|mobile|welcome|referenceBanner';
const EXT = 'html|js|json|jsonc|yml|yaml|css|svg|png|jpg|webp|com|org|net|io|md';
const LOWER = new RegExp(`\\b(?:${NAMESPACES})\\.[a-zA-Z][\\w]*(?:\\.[a-zA-Z][\\w]*)+\\b`, 'g');
const UPPER = /\b[A-Z][A-Z0-9]*(?:\.[A-Z][A-Z0-9]*){2,}\b/g;
const isFileLike = (s) => new RegExp(`\\.(?:${EXT})$`, 'i').test(s);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const report = [];
for (const p of PAGES) {
  for (const lang of ['en', 'ar']) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 1200 } });
    const page = await ctx.newPage();
    await page.goto(urlFor(p, lang), { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {});
    await page.waitForSelector('h1, main', { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1800);
    const text = await page.evaluate(() => document.body.innerText);
    const hits = new Set();
    for (const re of [LOWER, UPPER]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        const tok = m[0];
        if (!isFileLike(tok)) hits.add(tok);
      }
    }
    report.push({ page: p.name, lang, leaks: [...hits] });
    await ctx.close();
  }
}
await browser.close();

const totalLeaks = report.reduce((n, r) => n + r.leaks.length, 0);
for (const r of report) {
  console.log(`${r.page.padEnd(12)} ${r.lang}  ${r.leaks.length ? '⚠ ' + r.leaks.join(', ') : 'clean'}`);
}
console.log(`\nTOTAL leaked keys: ${totalLeaks}`);
process.exitCode = totalLeaks > 0 ? 1 : 0;
