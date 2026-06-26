// Ad-hoc Playwright QA harness for the overhaul. Not part of the test suite.
// Usage: node scripts/qa/tracker-shot.mjs <outDir> <label>
import { chromium } from '@playwright/test';
import path from 'node:path';

const OUT = process.argv[2] || 'docs/plans/_artifacts/2026-06-26-overhaul-qa';
const LABEL = process.argv[3] || 'baseline';
const JSON_OUT = process.argv[4] || null;
const BASE = 'http://127.0.0.1:8080';
const fsp = await import('node:fs/promises');

const PAGES = [
  { name: 'tracker', url: '/tracker.html' },
  { name: 'home', url: '/index.html' },
];
const VIEWPORTS = [
  { tag: '390', width: 390, height: 844 },
  { tag: '1366', width: 1366, height: 900 },
];
const LANGS = ['en', 'ar'];

function isNoise(text) {
  return /google|gtag|gtm|collect|clarity|analytics|ERR_ABORTED|favicon|net::ERR_BLOCKED/i.test(
    text
  );
}

const report = [];
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
for (const pg of PAGES) {
  for (const lang of LANGS) {
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await ctx.newPage();
      const consoleErrors = [];
      const leakedKeys = new Set();
      page.on('console', (m) => {
        if (m.type() === 'error' && !isNoise(m.text())) consoleErrors.push(m.text());
      });
      page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
      const url = `${BASE}${pg.url}${lang === 'ar' ? '?lang=ar' : ''}`;
      // Appendix A: never networkidle (tracker polls forever). domcontentloaded
      // + wait for a real element + a short settle for JS hydration/first price.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
      await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1600);
      // D4: horizontal overflow
      const metrics = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        dir: document.documentElement.getAttribute('dir') || 'ltr',
        lang: document.documentElement.getAttribute('lang') || '',
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().replace(/\s+/g, ' ')),
        h1count: document.querySelectorAll('h1').length,
      }));
      // D8: leaked UPPER.CASE.DOT or tracker.* raw keys in visible text
      const bodyText = await page.evaluate(() => document.body.innerText);
      const keyMatches = bodyText.match(/\b[a-zA-Z]+(?:\.[a-zA-Z]+){2,}\b/g) || [];
      for (const k of keyMatches) {
        if (/^(tracker|common|nav|footer|home|calc)\./i.test(k) || /^[A-Z.]+$/.test(k))
          leakedKeys.add(k);
      }
      const shot = path.join(OUT, `${LABEL}-${pg.name}-${lang}-${vp.tag}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      const overflow = metrics.scrollW - metrics.clientW;
      report.push({
        page: pg.name,
        lang,
        vp: vp.tag,
        dir: metrics.dir,
        scrollW: metrics.scrollW,
        clientW: metrics.clientW,
        overflowPx: overflow,
        overflow: overflow > 4,
        h1count: metrics.h1count,
        h1: metrics.h1,
        consoleErrors,
        leakedKeys: [...leakedKeys],
      });
      await ctx.close();
    }
  }
}
await browser.close();
const out = JSON.stringify(report, null, 2);
if (JSON_OUT) await fsp.writeFile(JSON_OUT, out);
console.log(out);
