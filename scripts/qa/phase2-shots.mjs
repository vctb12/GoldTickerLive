import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT =
  process.env.SHOT_DIR ||
  '/tmp/claude-0/-home-user-GoldTickerLive/ae77ae43-5aeb-52ab-9499-da63bc7738e0/scratchpad/phase2-shots';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5000';

const shots = [
  {
    name: 'home-en-light',
    url: '/',
    viewport: { width: 1366, height: 940 },
    colorScheme: 'light',
    clip: { x: 700, y: 150, width: 640, height: 640 },
  },
  {
    name: 'home-en-light-full',
    url: '/',
    viewport: { width: 1366, height: 940 },
    colorScheme: 'light',
    clip: { x: 0, y: 100, width: 1366, height: 760 },
  },
  {
    name: 'home-ar-light',
    url: '/?lang=ar',
    viewport: { width: 1366, height: 940 },
    colorScheme: 'light',
    clip: { x: 0, y: 100, width: 1366, height: 760 },
  },
  {
    name: 'home-en-dark',
    url: '/',
    viewport: { width: 1366, height: 940 },
    colorScheme: 'dark',
    clip: { x: 0, y: 100, width: 1366, height: 760 },
  },
  {
    name: 'country-uae-dubai-gold-rate',
    url: '/countries/uae/dubai/gold-rate/',
    viewport: { width: 1366, height: 1100 },
    colorScheme: 'light',
    full: true,
  },
];

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const results = [];
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: s.viewport,
    colorScheme: s.colorScheme,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 140));
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 140)));
  await page
    .goto(BASE + s.url, { waitUntil: 'networkidle', timeout: 30000 })
    .catch((e) => errors.push('GOTO: ' + e.message));
  await page.waitForTimeout(2000);
  const probe = await page
    .evaluate(() => {
      const t = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : null;
      };
      return {
        dir: document.documentElement.getAttribute('dir') || 'ltr',
        price: t('#hlc-price, .cp-price-value'),
        freshness: t('#hlc-updated, .cp-update-time'),
        retailRow: t('#hlc-retail'),
        retailCard: t('.cp-mi-stat--retail'),
        hasFoilOrOrb: !!document.querySelector('.hero-live-card::before'),
      };
    })
    .catch(() => ({}));
  const path = `${OUT}/${s.name}.png`;
  await page.screenshot({ path, fullPage: !!s.full, clip: s.clip }).catch(async () => {
    await page.screenshot({ path });
  });
  results.push({ name: s.name, errorsCount: errors.length, sampleErr: errors.slice(0, 2), probe });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
