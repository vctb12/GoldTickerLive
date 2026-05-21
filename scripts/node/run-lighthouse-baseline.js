#!/usr/bin/env node
/**
 * scripts/node/run-lighthouse-baseline.js
 *
 * Phase 0 — capture Lighthouse metrics for the 7 target pages
 * (mobile + desktop) against the live site.
 *
 * Outputs JSON to reports/baseline-2026-05/lighthouse/
 *
 * Usage: node scripts/node/run-lighthouse-baseline.js [--locale ar]
 *        (default locale: en)
 *
 * Requires: lighthouse (npm install -g lighthouse) and chromium.
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'reports', 'baseline-2026-05', 'lighthouse');
fs.mkdirSync(OUT_DIR, { recursive: true });

const LOCALE = process.argv.includes('--locale')
  ? process.argv[process.argv.indexOf('--locale') + 1]
  : 'en';
const BASE_URL = process.argv.includes('--base-url')
  ? process.argv[process.argv.indexOf('--base-url') + 1]
  : 'https://goldtickerlive.com';

const PAGES = [
  { slug: 'home', path: '/' },
  { slug: 'tracker', path: '/tracker.html' },
  { slug: 'calculator', path: '/calculator.html' },
  { slug: 'learn', path: '/learn.html' },
  { slug: 'shops', path: '/shops.html' },
  { slug: 'countries-uae', path: '/countries/uae/' },
  { slug: 'countries-saudi-arabia', path: '/countries/saudi-arabia/' },
];

const FORM_FACTORS = ['mobile', 'desktop'];

const CHROME_FLAGS = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
].join(',');

function lighthouseBin() {
  // Try global, then local npx
  try {
    execSync('lighthouse --version', { stdio: 'pipe' });
    return 'lighthouse';
  } catch {
    return 'npx lighthouse';
  }
}

const lhBin = lighthouseBin();
console.log(`Using Lighthouse: ${lhBin}`);
console.log(`Locale: ${LOCALE}`);
console.log(`Output: ${OUT_DIR}\n`);

const summary = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  locale: LOCALE,
  baseUrl: BASE_URL,
  phase: 'Phase 0 — baseline lock 2026-05',
  pages: [],
};

for (const page of PAGES) {
  for (const formFactor of FORM_FACTORS) {
    const url = `${BASE_URL}${page.path}${LOCALE === 'ar' ? '?lang=ar' : ''}`;
    const outFile = path.join(OUT_DIR, `${page.slug}-${formFactor}-${LOCALE}.json`);

    console.log(`\n▶ ${page.slug} [${formFactor}/${LOCALE}] → ${url}`);

    if (fs.existsSync(outFile)) {
      console.log('  ↩ Already exists, skipping.');
      continue;
    }

    const args = [
      url,
      '--output=json',
      `--output-path=${outFile}`,
      `--form-factor=${formFactor}`,
      `--locale=${LOCALE}`,
      `--chrome-flags="${CHROME_FLAGS}"`,
      '--only-categories=performance,accessibility,best-practices,seo',
      '--quiet',
    ];

    if (formFactor === 'mobile') {
      args.push('--preset=perf');
    } else {
      args.push('--screenEmulation.mobile=false');
      args.push('--screenEmulation.width=1350');
      args.push('--screenEmulation.height=940');
      args.push('--screenEmulation.deviceScaleFactor=1');
    }

    const cmd = `${lhBin} ${args.join(' ')}`;
    const result = spawnSync(cmd, { shell: true, encoding: 'utf8', timeout: 120000 });

    if (result.status !== 0) {
      console.error(`  ✗ Lighthouse failed for ${page.slug} [${formFactor}/${LOCALE}]`);
      if (result.stderr) console.error(`  ${result.stderr.slice(0, 300)}`);
      summary.pages.push({
        slug: page.slug,
        formFactor,
        locale: LOCALE,
        url,
        success: false,
        error: result.stderr ? result.stderr.slice(0, 300) : 'unknown',
      });
      continue;
    }

    // Parse scores
    let scores = null;
    let lcp = null;
    let cls = null;
    let tbt = null;
    try {
      const lhJson = JSON.parse(fs.readFileSync(outFile, 'utf8'));
      scores = {
        performance: Math.round((lhJson.categories?.performance?.score ?? 0) * 100),
        accessibility: Math.round((lhJson.categories?.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((lhJson.categories?.['best-practices']?.score ?? 0) * 100),
        seo: Math.round((lhJson.categories?.seo?.score ?? 0) * 100),
      };
      lcp = lhJson.audits?.['largest-contentful-paint']?.displayValue ?? null;
      cls = lhJson.audits?.['cumulative-layout-shift']?.displayValue ?? null;
      tbt = lhJson.audits?.['total-blocking-time']?.displayValue ?? null;
    } catch {
      // scores remain null
    }

    console.log(
      `  ✓ Performance: ${scores?.performance} | A11y: ${scores?.accessibility} | SEO: ${scores?.seo}`
    );
    console.log(`    LCP: ${lcp} | CLS: ${cls} | TBT: ${tbt}`);

    summary.pages.push({
      slug: page.slug,
      formFactor,
      locale: LOCALE,
      url,
      success: true,
      reportFile: path.relative(ROOT, outFile),
      scores,
      lcp,
      cls,
      tbt,
    });
  }
}

const summaryPath = path.join(OUT_DIR, `summary-${LOCALE}.json`);
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
console.log(`\n✅ Lighthouse summary written → ${path.relative(ROOT, summaryPath)}`);
