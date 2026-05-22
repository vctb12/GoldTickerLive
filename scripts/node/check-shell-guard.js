#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '../..');
const PUBLIC_HTML = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
  .map((entry) => path.join(ROOT, entry.name));

const EXPECTED_SURFACES = [
  '/index.html',
  '/tracker.html',
  '/calculator.html',
  '/countries/index.html',
  '/shops.html',
  '/learn.html',
  '/insights.html',
];

let errors = 0;
function fail(msg) {
  errors += 1;
  console.error(`❌ ${msg}`);
}
function pass(msg) {
  console.log(`✅ ${msg}`);
}

for (const file of PUBLIC_HTML) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  if (/<nav[^>]+class=["'][^"']*site-nav/i.test(html)) {
    fail(`${rel} contains static .site-nav markup; shell must remain shared/injected.`);
  }
  if (/<footer[^>]+class=["'][^"']*site-footer-global/i.test(html)) {
    fail(`${rel} contains static .site-footer-global markup; shell must remain shared/injected.`);
  }
}
pass(`Checked ${PUBLIC_HTML.length} top-level HTML files for duplicate shell markup.`);

const shellCssPath = path.join(ROOT, 'styles/partials/shell.css');
if (!fs.existsSync(shellCssPath)) {
  fail('styles/partials/shell.css is missing.');
} else {
  const css = fs.readFileSync(shellCssPath, 'utf8');
  // Flags raw color literals in shell.css.
  // - #[0-9a-fA-F]{3,8}\b  — hex literals (#fff, #ff0000, #rrggbbaa)
  // - rgba?\((?![^)]*var\(--) — rgb()/rgba() NOT followed by var(-- inside the parens
  // - hsla?\((?![^)]*var\(--) — hsl()/hsla() NOT followed by var(-- inside the parens
  // Token-driven calls like rgba(var(--color-primary), 0.5) are intentionally allowed.
  const colorLiteral = /(#[0-9a-fA-F]{3,8}\b|rgba?\((?![^)]*var\(--)|hsla?\((?![^)]*var\(--))/;
  if (colorLiteral.test(css)) {
    fail('styles/partials/shell.css must use design tokens only (no raw color literals).');
  } else {
    pass('styles/partials/shell.css token-only color check passed.');
  }
}

async function checkCanonicalSurfaces() {
  const navDataUrl = pathToFileURL(path.join(ROOT, 'src/components/nav-data.js')).href;
  const { NAV_DATA } = await import(navDataUrl);
  for (const lang of ['en', 'ar']) {
    const locale = NAV_DATA[lang];
    if (!locale) {
      fail(`NAV_DATA.${lang} missing.`);
      continue;
    }
    const configured = Array.isArray(locale.canonicalSurfaces) ? locale.canonicalSurfaces : [];
    if (JSON.stringify(configured) !== JSON.stringify(EXPECTED_SURFACES)) {
      fail(
        `NAV_DATA.${lang}.canonicalSurfaces does not exactly match EXPECTED_SURFACES ` +
          `(got [${configured.join(', ')}], expected [${EXPECTED_SURFACES.join(', ')}]).`
      );
    }
  }
  if (errors === 0) pass('Canonical 7-surface nav coverage check passed.');
}

checkCanonicalSurfaces()
  .then(() => {
    if (errors > 0) process.exit(1);
    console.log('\n✅ Shell guard passed');
  })
  .catch((err) => {
    fail(`Shell guard failed to load nav data: ${err.message}`);
    process.exit(1);
  });
