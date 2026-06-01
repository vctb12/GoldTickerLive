#!/usr/bin/env node
/**
 * Basic accessibility gate for CI (npm run validate).
 * - Token contrast pairs used for gold/body text (WCAG AA 4.5:1 normal)
 * - <img> alt and loading="lazy" on public HTML
 * - <iframe> title + loading="lazy"
 * - Form controls: label association or aria-label
 * - No eager AdSense script when slots are unconfigured in constants.js
 *
 * Usage: node scripts/node/check-basic-a11y.js [--check]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const CONSTANTS_PATH = path.join(ROOT, 'src/config/constants.js');
const TOKENS_PATH = path.join(ROOT, 'styles/partials/tokens.css');

const INTERNAL_PREFIXES = [
  'admin/',
  'config/',
  'data/',
  'docs/',
  'scripts/',
  'server/',
  'src/',
  'styles/',
  'supabase/',
  'build/',
  'tests/',
  'node_modules/',
  'dist/',
  'playwright-report/',
  'test-results/',
  'content/embed/',
];

const EXEMPT_FILES = new Set(['404.html', 'offline.html']);

/** Pairs of CSS custom properties: foreground on background (normal text). */
const CONTRAST_PAIRS = [
  ['--color-text', '--color-bg'],
  ['--color-text-muted', '--color-bg'],
  ['--text-accent', '--color-bg'],
  ['--color-gold-dark', '--color-bg'],
  ['--color-gold-dark', '--color-surface'],
  ['--color-text', '--color-surface'],
];

const MIN_NORMAL_CONTRAST = 4.5;

let errors = 0;

function fail(msg) {
  console.error(`  ❌  ${msg}`);
  errors += 1;
}

function ok(msg) {
  console.log(`  ✅  ${msg}`);
}

function walkHtml(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (
        rel.startsWith('node_modules') ||
        rel.startsWith('dist') ||
        rel.startsWith('playwright-report') ||
        rel.startsWith('test-results') ||
        rel.startsWith('.git')
      ) {
        continue;
      }
      walkHtml(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(rel);
    }
  }
  return acc;
}

function isPublicHtml(rel) {
  if (EXEMPT_FILES.has(rel)) return false;
  return !INTERNAL_PREFIXES.some((p) => rel.startsWith(p));
}

function parseHexColor(value) {
  const hex = value.trim();
  const m = hex.match(/^#([0-9a-f]{3,8})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (h.length === 6) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

function relativeLuminance({ r, g, b }) {
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(fg, bg) {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function loadTokenMap() {
  const css = fs.readFileSync(TOKENS_PATH, 'utf8');
  const map = new Map();
  const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/);
  if (!rootBlock) {
    fail('Could not parse :root block in styles/partials/tokens.css');
    return map;
  }
  const declRe = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = declRe.exec(rootBlock[1])) !== null) {
    map.set(m[1].trim(), m[2].trim());
  }
  return map;
}

function resolveColor(tokenName, map, stack = new Set()) {
  const raw = map.get(tokenName);
  if (!raw) return null;
  if (stack.has(tokenName)) return null;
  if (raw.startsWith('var(')) {
    const inner = raw.match(/var\(\s*(--[a-z0-9-]+)/i);
    if (!inner) return null;
    stack.add(tokenName);
    return resolveColor(inner[1], map, stack);
  }
  return parseHexColor(raw);
}

function checkContrastPairs() {
  const map = loadTokenMap();
  if (!map.size) return;

  for (const [fgName, bgName] of CONTRAST_PAIRS) {
    const fg = resolveColor(fgName, map);
    const bg = resolveColor(bgName, map);
    if (!fg || !bg) {
      fail(`Could not resolve contrast pair ${fgName} on ${bgName}`);
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    if (ratio < MIN_NORMAL_CONTRAST) {
      fail(
        `Contrast ${ratio.toFixed(2)}:1 for ${fgName} on ${bgName} is below WCAG AA ${MIN_NORMAL_CONTRAST}:1`
      );
    }
  }
  if (errors === 0) ok('Gold/body token contrast pairs meet WCAG AA (4.5:1)');
}

function isMonetizationConfigured() {
  const src = fs.readFileSync(CONSTANTS_PATH, 'utf8');
  const pubMatch = src.match(/ADSENSE_PUBLISHER_ID:\s*'([^']*)'/);
  const publisherId = pubMatch ? pubMatch[1].trim() : '';
  if (publisherId) return true;
  const slotsBlock = src.match(/AD_SLOTS:\s*\{([\s\S]*?)\n\s*\},/);
  if (!slotsBlock) return false;
  return /:\s*'[^']+'/.test(slotsBlock[1].replace(/:\s*''/g, ''));
}

function checkHtmlSurfaces(files) {
  let imgCount = 0;
  let iframeCount = 0;

  for (const rel of files) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');

    if (!isMonetizationConfigured() && /adsbygoogle\.js/i.test(html)) {
      fail(`${rel}: inline AdSense script present but AD_CONFIG slots are unconfigured`);
    }

    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    for (const tag of imgTags) {
      imgCount += 1;
      if (!/\balt\s*=/i.test(tag)) {
        fail(`${rel}: <img> missing alt attribute`);
      }
      const isPriority =
        /\bfetchpriority\s*=\s*["']high["']/i.test(tag) || /\bloading\s*=\s*["']eager["']/i.test(tag);
      if (!isPriority && !/\bloading\s*=\s*["']lazy["']/i.test(tag)) {
        fail(`${rel}: <img> must use loading="lazy" (or fetchpriority="high" for LCP)`);
      }
      if (!/\bwidth\s*=/i.test(tag) || !/\bheight\s*=/i.test(tag)) {
        fail(`${rel}: <img> must include width and height to prevent CLS`);
      }
    }

    const iframeTags = html.match(/<iframe\b[^>]*>/gi) || [];
    for (const tag of iframeTags) {
      iframeCount += 1;
      if (!/\btitle\s*=/i.test(tag) && !/\baria-label\s*=/i.test(tag)) {
        fail(`${rel}: <iframe> missing title or aria-label`);
      }
      if (!/\bloading\s*=\s*["']lazy["']/i.test(tag)) {
        fail(`${rel}: <iframe> must use loading="lazy"`);
      }
    }

    const inputRe = /<input\b[^>]*>/gi;
    let inputMatch;
    while ((inputMatch = inputRe.exec(html)) !== null) {
      const tag = inputMatch[0];
      const tagIndex = inputMatch.index;
      const typeMatch = tag.match(/\btype\s*=\s*["']([^"']+)["']/i);
      const type = (typeMatch ? typeMatch[1] : 'text').toLowerCase();
      if (['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) continue;

      let hasLabel = /\baria-label\s*=/i.test(tag);
      if (!hasLabel && /\baria-labelledby\s*=/i.test(tag)) {
        const labelledBy = tag.match(/\baria-labelledby\s*=\s*["']([^"']+)["']/i);
        if (labelledBy) {
          const refRe = new RegExp(`\\bid\\s*=\\s*["']${labelledBy[1]}["']`, 'i');
          hasLabel = refRe.test(html);
        }
      }

      const idMatch = tag.match(/\bid\s*=\s*["']([^"']+)["']/i);
      if (idMatch && !hasLabel) {
        const id = idMatch[1];
        const labelFor = new RegExp(`<label[^>]+for\\s*=\\s*["']${id}["']`, 'i');
        const wrapLabel = new RegExp(
          `<label[^>]*>[\\s\\S]{0,800}?<input[^>]*\\bid\\s*=\\s*["']${id}["']`,
          'i'
        );
        hasLabel = labelFor.test(html) || wrapLabel.test(html);
      }

      if (!hasLabel) {
        const before = html.slice(Math.max(0, tagIndex - 400), tagIndex);
        const lastLabelOpen = before.lastIndexOf('<label');
        const lastLabelClose = before.lastIndexOf('</label>');
        hasLabel = lastLabelOpen > lastLabelClose;
      }

      if (!hasLabel) {
        fail(`${rel}: <input> (type=${type}) missing associated <label> or aria-label`);
      }
    }
  }

  ok(`Scanned ${files.length} public HTML files (${imgCount} images, ${iframeCount} iframes)`);
}

function checkGlobalCssImports() {
  const globalPath = path.join(ROOT, 'styles/global.css');
  const css = fs.readFileSync(globalPath, 'utf8');
  const required = [
    'tokens.css',
    'base.css',
    'layout.css',
    'components.css',
    'utilities.css',
  ];
  for (const partial of required) {
    if (!css.includes(partial)) {
      fail(`styles/global.css must import partials/${partial}`);
    }
    const partialPath = path.join(ROOT, 'styles/partials', partial);
    if (!fs.existsSync(partialPath)) {
      fail(`Missing ${path.relative(ROOT, partialPath)}`);
    }
  }
  if (required.every((p) => css.includes(p))) {
    ok('styles/global.css imports all core partials');
  }
}

function main() {
  console.log('\n♿ Basic accessibility gate\n');
  checkGlobalCssImports();
  checkContrastPairs();

  const allHtml = walkHtml(ROOT, []);
  const publicHtml = allHtml.filter(isPublicHtml);
  checkHtmlSurfaces(publicHtml);

  if (!isMonetizationConfigured()) {
    ok('AdSense inactive in AD_CONFIG — inline script tags must stay absent');
  }

  if (errors > 0) {
    console.error(`\nBasic a11y gate failed with ${errors} error(s).\n`);
    process.exit(1);
  }
  console.log('\nBasic a11y gate passed.\n');
}

main();
