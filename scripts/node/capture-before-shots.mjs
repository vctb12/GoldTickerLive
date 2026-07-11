// One-off: capture BEFORE screenshots of the production dist for the Visual Transformation audit.
// Serves nothing itself — expects a static server already running at http://localhost:8080 (dist root).
// Usage: node scripts/node/capture-before-shots.mjs <outDir>
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = process.argv[2] || 'docs/design/reviews/before';
const BASE = 'http://localhost:8080';

const PAGES = [
  ['home', 'index.html'],
  ['calculator', 'calculator.html'],
  ['compare', 'compare.html'],
  ['tracker', 'tracker.html'],
  ['portfolio', 'portfolio.html'],
  ['shops', 'shops.html'],
  ['learn', 'learn.html'],
  ['country-dubai', 'dubai-gold-price.html'],
  ['glossary', 'glossary.html'],
  ['market', 'market.html'],
  ['heatmap', 'heatmap.html'],
];

const VIEWPORTS = [
  ['desktop', 1440, 900],
  ['mobile', 390, 844],
];
const LANGS = [
  ['en', ''],
  ['ar', '?lang=ar'],
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let n = 0;
for (const [vpName, w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce', // deterministic; capture the static composition
  });
  for (const [pName, file] of PAGES) {
    for (const [langName, q] of LANGS) {
      const page = await ctx.newPage();
      const url = `${BASE}/${file}${q}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
      } catch {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        } catch (e) {
          console.log(`SKIP ${pName} ${vpName} ${langName}: ${e.message}`);
          await page.close();
          continue;
        }
      }
      await page.waitForTimeout(1600); // let hydration + price render settle
      const stub = `${pName}_${vpName}_${langName}`;
      // full-page for the record
      await page.screenshot({ path: `${OUT}/${stub}_full.png`, fullPage: true });
      // above-the-fold viewport crop (what a visitor sees first)
      await page.screenshot({ path: `${OUT}/${stub}_fold.png`, fullPage: false });
      n += 2;
      console.log(`shot ${stub}`);
      await page.close();
    }
  }
  await ctx.close();
}

// Mobile nav menu open state (home, EN + AR)
const navCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
for (const [langName, q] of LANGS) {
  const page = await navCtx.newPage();
  try {
    await page.goto(`${BASE}/index.html${q}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1200);
    const btn = page.locator(
      'button[aria-label*="menu" i], button[aria-controls], .nav-toggle, .hamburger, [data-nav-toggle], button.menu-toggle'
    ).first();
    if (await btn.count()) {
      await btn.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(700);
    }
    await page.screenshot({ path: `${OUT}/nav-menu_mobile_${langName}_fold.png`, fullPage: false });
    n += 1;
    console.log(`shot nav-menu_mobile_${langName}`);
  } catch (e) {
    console.log(`SKIP nav-menu ${langName}: ${e.message}`);
  }
  await page.close();
}
await navCtx.close();
await browser.close();
console.log(`DONE: ${n} screenshots -> ${OUT}`);
