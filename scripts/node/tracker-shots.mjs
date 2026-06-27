#!/usr/bin/env node
/**
 * tracker-shots.mjs — Tracker visual harness (S1).
 *
 * Captures the flagship Tracker across the full review matrix:
 *   lang  ∈ { en, ar }
 *   width ∈ { 390 (mobile), 1366 (desktop) }
 *   theme ∈ { light, dark }
 * for one or more modes, into a labelled directory so any phase can produce
 * paired before/after evidence.
 *
 * Usage:
 *   node scripts/node/tracker-shots.mjs --label baseline
 *   node scripts/node/tracker-shots.mjs --label after-phase6 --modes live,compare
 *   node scripts/node/tracker-shots.mjs --label x --variants en/mobile/light,ar/mobile/dark
 *
 * Requires the dev server (npm run dev → http://localhost:5000) already running,
 * or pass --base http://host:port. Chromium is resolved via Playwright
 * (PLAYWRIGHT_BROWSERS_PATH respected). Pure tooling: no app behaviour changes.
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

const BASE = arg('base', process.env.TRACKER_SHOTS_BASE || 'http://localhost:5000');
const LABEL = arg('label', 'shots');
const OUT_ROOT = resolve(arg('out', 'docs/plans/_artifacts/tracker-shots'));
const MODES = arg('modes', 'live,compare,archive,exports,method')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const FULL = argv.includes('--full');
const LANGS = ['en', 'ar'];
const WIDTHS = [
  { name: 'mobile', w: 390, h: 844 },
  { name: 'desktop', w: 1366, h: 900 },
];
const THEMES = ['light', 'dark'];

// Optional explicit variant filter: "en/mobile/light,ar/desktop/dark"
const variantFilter = arg('variants', '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function wanted(lang, width, theme) {
  if (!variantFilter.length) return true;
  return variantFilter.includes(`${lang}/${width}/${theme}`);
}

function hashFor(mode, lang) {
  return `#mode=${mode}&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=${lang}`;
}

const outDir = join(OUT_ROOT, LABEL);
mkdirSync(outDir, { recursive: true });

// Resolve a usable Chromium. In managed environments the pinned Playwright
// build may differ from the pre-installed browser; honour an explicit override.
const execPath = process.env.CHROMIUM_PATH || arg('chromium', '');
const browser = await chromium.launch(execPath ? { executablePath: execPath } : {});
const results = [];

for (const theme of THEMES) {
  for (const lang of LANGS) {
    for (const width of WIDTHS) {
      if (!wanted(lang, width.name, theme)) continue;
      const context = await browser.newContext({
        viewport: { width: width.w, height: width.h },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      });
      // Pin the theme before any app script runs.
      await context.addInitScript((t) => {
        try {
          const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
          prefs.theme = t;
          localStorage.setItem('user_prefs', JSON.stringify(prefs));
        } catch {
          /* ignore */
        }
      }, theme);
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text());
      });
      page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

      for (const mode of MODES) {
        const url = `${BASE}/tracker.html${hashFor(mode, lang)}`;
        await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});
        // Wait for the hero spot to resolve to a real price (not skeleton/em-dash).
        await page
          .waitForFunction(
            () => {
              const el = document.getElementById('tp-readout-spot-value');
              const t = el && el.textContent ? el.textContent.trim() : '';
              return t && t !== '—' && /\d/.test(t);
            },
            { timeout: 12000 }
          )
          .catch(() => {});
        // Scroll through the page to trigger IntersectionObserver lazy content
        // (chart, mode panels, reveal sections), then settle back to the top.
        await page.evaluate(async () => {
          const step = window.innerHeight * 0.8;
          for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(900); // settle count-up / animations

        // Primary artifact: readable above-the-fold viewport.
        const file = join(outDir, `${mode}__${lang}__${width.name}__${theme}.png`);
        await page.screenshot({ path: file });

        // Optional full-page (tall; for overall-layout review).
        if (FULL) {
          const fileFull = join(outDir, `${mode}__${lang}__${width.name}__${theme}__full.png`);
          try {
            await page.screenshot({ path: fileFull, fullPage: true });
          } catch {
            const h = await page.evaluate(() => Math.min(document.body.scrollHeight, 6000));
            await page.screenshot({ path: fileFull, clip: { x: 0, y: 0, width: width.w, height: h } });
          }
        }
        results.push({ mode, lang, width: width.name, theme, file, consoleErrors: consoleErrors.splice(0) });
        process.stdout.write(`✓ ${mode} ${lang} ${width.name} ${theme}\n`);
      }
      await context.close();
    }
  }
}

await browser.close();

const errCount = results.reduce((n, r) => n + r.consoleErrors.length, 0);
console.log(`\nCaptured ${results.length} shots → ${outDir}`);
if (errCount) {
  console.log(`\n⚠ ${errCount} console error(s):`);
  for (const r of results) {
    for (const e of r.consoleErrors) console.log(`  [${r.mode}/${r.lang}/${r.width}/${r.theme}] ${e}`);
  }
} else {
  console.log('No console errors captured. ✅');
}
