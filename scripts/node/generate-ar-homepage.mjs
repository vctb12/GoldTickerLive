#!/usr/bin/env node
/**
 * Generate the indexable Arabic homepage at `ar/index.html` from `index.html`.
 *
 * The homepage app (`src/pages/home.js`) renders in Arabic when served at
 * `/ar/` — see `getLang()` / `getDepth()` in that file. This generator keeps
 * the Arabic homepage's structure in lock-step with the English one; only the
 * language/SEO metadata and the relative asset depth differ. Re-run it whenever
 * `index.html` changes (or wire it into the build).
 *
 * Usage:
 *   node scripts/node/generate-ar-homepage.mjs          # write ar/index.html
 *   node scripts/node/generate-ar-homepage.mjs --check  # fail if out of date
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'index.html');
const OUT = path.join(ROOT, 'ar', 'index.html');

const AR_TITLE = 'أسعار الذهب اليوم في الإمارات والخليج | Gold Ticker Live';
const AR_DESC =
  'سعر جرام الذهب اليوم في الإمارات بالدرهم — أسعار مرجعية لعيار 24 و22 و21 و18 لدول الخليج وأكثر من 20 دولة عربية، مع تحديث تلقائي ووسم يوضّح حداثة السعر. الأسعار مرجعية وليست أسعار تجزئة.';

function build() {
  let html = fs.readFileSync(SRC, 'utf8');

  // 1. Document language + direction.
  html = html.replace('<html lang="en" dir="ltr">', '<html lang="ar" dir="rtl">');

  // 2. Self-canonical + og:url to /ar/ (this IS the canonical Arabic homepage).
  html = html.replace(
    'rel="canonical" href="https://goldtickerlive.com/"',
    'rel="canonical" href="https://goldtickerlive.com/ar/"'
  );
  html = html.replace(
    'property="og:url" content="https://goldtickerlive.com/"',
    'property="og:url" content="https://goldtickerlive.com/ar/"'
  );

  // 3. Reciprocal hreflang: ar → /ar/ (x-default + en stay at the root /).
  html = html.replace(
    'hreflang="ar" href="https://goldtickerlive.com/?lang=ar"',
    'hreflang="ar" href="https://goldtickerlive.com/ar/"'
  );

  // 4. Open Graph locale.
  html = html.replace(
    'property="og:locale" content="en_US"',
    'property="og:locale" content="ar_AE"'
  );
  html = html.replace(
    'property="og:locale:alternate" content="ar_AE"',
    'property="og:locale:alternate" content="en_US"'
  );

  // 5. Localized title + meta description.
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${AR_TITLE}</title>`);
  html = html.replace(/(name="description"\s+content=")[^"]*(")/, `$1${AR_DESC}$2`);

  // 6. This page lives one directory deep (/ar/). Prepend ../ to every RELATIVE
  //    href/src so assets/scripts/links still resolve. Absolute URLs (scheme:,
  //    //, /), hashes, and the canonical/hreflang URLs above are left untouched.
  html = html.replace(
    /((?:href|src)=")(?![a-z][a-z0-9+.-]*:|\/\/|\/|#)([^"]*)"/gi,
    '$1../$2"'
  );

  // 7. Provenance marker.
  html = html.replace(
    '<head>',
    '<head>\n    <!-- Generated from index.html by scripts/node/generate-ar-homepage.mjs — do not edit by hand. -->'
  );

  return html;
}

const out = build();
const check = process.argv.includes('--check');
const existing = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';

if (check) {
  if (existing.trimEnd() !== out.trimEnd()) {
    console.error('✖ ar/index.html is out of date. Run: node scripts/node/generate-ar-homepage.mjs');
    process.exit(1);
  }
  console.log('✓ ar/index.html is up to date.');
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, out);
  console.log(`✓ Wrote ar/index.html from index.html (${out.length} bytes).`);
}
