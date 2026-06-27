#!/usr/bin/env node
/**
 * One-off design audit screenshot capture.
 * Usage: node scripts/audit-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'http://localhost:5000';
const OUT = path.resolve('docs/audit-screenshots');

const PAGES = [
  { id: 'homepage', path: '/' },
  { id: 'country-uae', path: '/countries/uae/' },
  { id: 'city-dubai-gold-rate', path: '/countries/uae/dubai/gold-rate/' },
  { id: 'order-gold', path: '/content/order-gold/' },
  { id: 'chart', path: '/chart/' },
];

const VIEWPORTS = [
  { tag: 'desktop-1440', width: 1440, height: 900 },
  { tag: 'mobile-390', width: 390, height: 844 },
];

async function capture(page, pageId, viewport, lang) {
  const langSuffix = lang === 'ar' ? 'ar' : 'en';
  const url = lang === 'ar' ? `${BASE}${pageId === 'homepage' ? '/?lang=ar' : PAGES.find((p) => p.id === pageId).path + '?lang=ar'}` : `${BASE}${PAGES.find((p) => p.id === pageId).path}`;
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  if (lang === 'ar') {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  } else {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  }
  // Allow price hydration
  await page.waitForTimeout(3500);
  const filename = `${pageId}__${viewport.tag}__${langSuffix}.png`;
  await page.screenshot({ path: path.join(OUT, filename), fullPage: true });
  console.log('saved', filename);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const { id } of PAGES) {
    for (const vp of VIEWPORTS) {
      for (const lang of ['en', 'ar']) {
        try {
          await capture(page, id, vp, lang);
        } catch (err) {
          console.error('FAIL', id, vp.tag, lang, err.message);
        }
      }
    }
  }

  await browser.close();
}

main();
