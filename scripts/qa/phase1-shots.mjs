import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT =
  process.env.SHOT_DIR ||
  '/tmp/claude-0/-home-user-GoldTickerLive/ae77ae43-5aeb-52ab-9499-da63bc7738e0/scratchpad/phase1-shots';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:5000';

const shots = [
  {
    name: 'home-en-light-desktop',
    url: '/',
    viewport: { width: 1366, height: 920 },
    colorScheme: 'light',
    clip: { x: 0, y: 0, width: 1366, height: 920 },
  },
  {
    name: 'home-en-light-mobile',
    url: '/',
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    full: false,
  },
  {
    name: 'home-en-dark-desktop',
    url: '/',
    viewport: { width: 1366, height: 920 },
    colorScheme: 'dark',
    clip: { x: 0, y: 0, width: 1366, height: 920 },
  },
  {
    name: 'home-ar-light-desktop',
    url: '/?lang=ar',
    viewport: { width: 1366, height: 920 },
    colorScheme: 'light',
    clip: { x: 0, y: 0, width: 1366, height: 920 },
  },
];

// PW_CHROMIUM lets CI / sandboxes point at a pre-installed Chromium when the
// bundled browser version doesn't match @playwright/test (else Playwright's
// default resolution is used).
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
    if (m.type() === 'error') errors.push(m.text().slice(0, 160));
  });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 160)));
  await page
    .goto(BASE + s.url, { waitUntil: 'networkidle', timeout: 30000 })
    .catch((e) => errors.push('GOTO: ' + e.message));
  await page.waitForTimeout(1800); // let price hydrate + animations settle
  // probe key invariant-bearing text
  const probe = await page
    .evaluate(() => {
      const dir = document.documentElement.getAttribute('dir') || 'ltr';
      const lang = document.documentElement.getAttribute('lang');
      const theme = document.documentElement.getAttribute('data-theme');
      const hasFreshness = !!document.querySelector(
        '[data-freshness-key],[data-freshness-age],.freshness-badge,.freshness,[class*="freshness"]'
      );
      const priceEl = document.querySelector(
        '.hlc-price, [class*="price-hero"], [class*="hero-price"], [data-price], .price-value'
      );
      return {
        dir,
        lang,
        theme,
        hasFreshness,
        priceSample: priceEl ? priceEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : null,
      };
    })
    .catch(() => ({}));
  const path = `${OUT}/${s.name}.png`;
  await page.screenshot({ path, fullPage: !!s.full, clip: s.clip }).catch(async () => {
    await page.screenshot({ path });
  });
  results.push({ name: s.name, errors: errors.slice(0, 6), probe });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
