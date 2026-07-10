// Accurate full-page BEFORE capture that reflects the REAL rendered page.
// Why this exists: this site's scroll container is <body> (height:100vh; overflow-y:auto), so
// Playwright fullPage:true cannot expand it — only the first viewport paints and the rest reads blank.
// Method: load with NORMAL motion (the real default experience), measure body.scrollHeight, resize the
// viewport to that full height so ALL sections lay out in one paintable frame, then scroll body top→
// bottom→top to trigger every IntersectionObserver / lazy-hydrated section (opacity 0→1), wait for
// settle, and screenshot the whole frame. No CSS is altered; this is the page as a user sees it.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = 'docs/design/reviews/before';
const BASE = 'http://localhost:8080';
mkdirSync(OUT, { recursive: true });

const TARGETS = [
  ['home', 'index.html', ['en', 'ar'], ['desktop', 'mobile']],
  ['calculator', 'calculator.html', ['en'], ['desktop']],
  ['compare', 'compare.html', ['en'], ['desktop']],
  ['tracker', 'tracker.html', ['en'], ['desktop']],
  ['learn', 'learn.html', ['en'], ['desktop']],
  ['shops', 'shops.html', ['en'], ['desktop']],
  ['country-dubai', 'dubai-gold-price.html', ['en'], ['desktop']],
  ['portfolio', 'portfolio.html', ['en'], ['desktop']],
];
const VW = { desktop: 1440, mobile: 390 };

const browser = await chromium.launch();
for (const [name, file, langs, vps] of TARGETS) {
  for (const vp of vps) {
    for (const lang of langs) {
      const ctx = await browser.newContext({
        viewport: { width: VW[vp], height: 900 },
        reducedMotion: 'no-preference', // REAL default experience (reveals animate, then settle visible)
      });
      const p = await ctx.newPage();
      const url = `${BASE}/${file}${lang === 'ar' ? '?lang=ar' : ''}`;
      await p.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      await p.waitForTimeout(1400);
      // full height of the real content
      const h = await p.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
      // resize viewport to full height so body's 100vh becomes the full page and everything paints
      await p.setViewportSize({ width: VW[vp], height: Math.min(h, 20000) });
      // scroll through to trigger any remaining lazy/reveal sections, then back to top
      await p.evaluate(async () => {
        const sc = document.scrollingElement || document.documentElement;
        const el = document.body.scrollHeight > sc.scrollHeight ? document.body : sc;
        const H = el.scrollHeight;
        for (let y = 0; y <= H; y += Math.round(window.innerHeight * 0.9)) {
          el.scrollTop = y;
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        el.scrollTop = 0;
        window.scrollTo(0, 0);
      });
      await p.waitForTimeout(1200);
      const vis = await p.evaluate(() => {
        const secs = [...document.querySelectorAll('main section')];
        const shown = secs.filter((s) => {
          const cs = getComputedStyle(s);
          return +cs.opacity > 0.05 && cs.visibility !== 'hidden' && s.getBoundingClientRect().height > 8;
        }).length;
        return `${shown}/${secs.length} sections visible`;
      });
      await p.screenshot({ path: `${OUT}/${name}_${vp}_${lang}_full.png`, fullPage: false });
      console.log(`accurate ${name}_${vp}_${lang} · h=${h} · ${vis}`);
      await ctx.close();
    }
  }
}
await browser.close();
console.log('DONE accurate full-page captures');
