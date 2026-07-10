#!/usr/bin/env node
/**
 * home-visual-baseline.mjs — visual-regression signal for the homepage, fully local ($0, no hosted
 * visual-diff service).
 *
 * Renders the built `dist/index.html` in headless Chromium across three viewports × {light, dark}
 * and produces two artefacts under `reports/visual/`:
 *   1. PNG screenshots (`reports/visual/home/*.png`) — for human pixel review. Git-ignored so the
 *      repo stays lean; regenerate on demand.
 *   2. `home-signature.json` — a committed, diffable structural + dimensional digest (section ids,
 *      heading outline, landmark/img/button counts, full-page pixel height per viewport, screenshot
 *      byte size). A regression that adds/drops a section, breaks the heading order, or blows up page
 *      height shows as a JSON diff in review, and `--check` fails CI when it drifts from the
 *      committed baseline.
 *
 * Usage:
 *   npm run build && cp -r assets/. dist/assets/ && cp -r data/. dist/data/ && cp -f favicon.svg manifest.json dist/
 *   node scripts/qa/home-visual-baseline.mjs            # write baseline (signature + screenshots)
 *   node scripts/qa/home-visual-baseline.mjs --check    # compare signature to committed baseline, exit 1 on drift
 *
 * Security: the out dir is constant, and the local server resolves requests against an in-memory file
 * map (req.url never reaches an fs call), matching the console/perf/axe harnesses.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import {
  createReadStream,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { extname, join, resolve, sep, relative } from 'node:path';

const CHECK = process.argv.includes('--check');
const SERVE_DIR = 'dist';
const OUT_DIR = 'reports/visual';
const SHOT_DIR = join(OUT_DIR, 'home');
const SIGNATURE_PATH = join(OUT_DIR, 'home-signature.json');
const PORT = 8302;

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];
const THEMES = ['light', 'dark'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function resolveChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
    if (dir) {
      const p = join(root, dir, 'chrome-linux', 'chrome');
      if (existsSync(p)) return p;
    }
  } catch {
    /* fall through to default */
  }
  return undefined;
}

function loadTree(dir) {
  const root = resolve(dir);
  const map = new Map();
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const f = join(d, n);
      if (statSync(f).isDirectory()) walk(f);
      else map.set('/' + relative(root, f).split(sep).join('/'), f);
    }
  };
  walk(root);
  return map;
}

function startServer(tree) {
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url || '/').split('?')[0]);
    if (u.endsWith('/')) u += 'index.html';
    const f = tree.get(u);
    if (!f) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
    createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(PORT, () => r(server)));
}

/** Structural digest of the rendered homepage — stable across cosmetic edits, sensitive to structure. */
async function structuralDigest(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    const sections = Array.from(main.querySelectorAll('section')).map(
      (s) => s.id || s.getAttribute('aria-labelledby') || s.className.split(' ')[0] || 'section'
    );
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
      level: Number(h.tagName[1]),
      text: (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
    }));
    return {
      h1Count: document.querySelectorAll('h1').length,
      sections,
      headingOutline: headings,
      landmarks: {
        nav: document.querySelectorAll('nav').length,
        main: document.querySelectorAll('main').length,
        footer: document.querySelectorAll('footer').length,
      },
      counts: {
        img: document.querySelectorAll('img').length,
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a[href]').length,
      },
    };
  });
}

async function main() {
  if (!existsSync(SERVE_DIR)) {
    console.error(`serve dir not found: ${SERVE_DIR} (run npm run build first)`);
    process.exit(2);
  }
  const tree = loadTree(SERVE_DIR);
  const server = await startServer(tree);
  const browser = await chromium.launch({
    executablePath: resolveChromium(),
    args: ['--no-sandbox'],
  });

  mkdirSync(SHOT_DIR, { recursive: true });
  const viewportSig = {};
  let sharedDigest = null;

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });
      try {
        await page.goto(`http://localhost:${PORT}/index.html`, {
          waitUntil: 'load',
          timeout: 25000,
        });
      } catch {
        /* screenshot whatever rendered */
      }
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
        document.documentElement.setAttribute('data-theme-mode', t);
      }, theme);
      // Force scroll-reveal to its settled state. Headless Chromium never fires the reveal
      // IntersectionObserver during a fullPage screenshot (no real scroll/paint), so [data-reveal]
      // sections stay stranded at opacity:0. Real users see them fade in on scroll — capture that
      // final state, not the transient hidden one.
      await page.evaluate(() => {
        document.querySelectorAll('[data-reveal]').forEach((n) => n.classList.add('is-in-view'));
      });
      await page.waitForTimeout(1400);

      const shotPath = join(SHOT_DIR, `home-${vp.name}-${theme}.png`);
      const buf = await page.screenshot({ fullPage: true });
      writeFileSync(shotPath, buf);
      // Authoritative rendered full-page height: the PNG's own pixel height (IHDR height field,
      // big-endian at byte offset 20). This is exactly what Playwright's fullPage capture measured,
      // and is robust to the page's inner-scroll-container architecture (documentElement.scrollHeight
      // reports only the viewport there).
      const renderedHeight = buf.readUInt32BE(20);

      viewportSig[`${vp.name}-${theme}`] = {
        pageHeight: renderedHeight,
        screenshotBytes: buf.length,
      };
      // The structural digest is theme/viewport-invariant; capture once on desktop-light.
      if (vp.name === 'desktop' && theme === 'light') sharedDigest = await structuralDigest(page);
      await page.close();
      process.stdout.write('.');
    }
  }
  process.stdout.write('\n');
  await browser.close();
  server.close();

  const signature = { structure: sharedDigest, viewports: viewportSig };

  if (CHECK) {
    if (!existsSync(SIGNATURE_PATH)) {
      console.error(`no baseline at ${SIGNATURE_PATH}; run without --check to write one`);
      process.exit(1);
    }
    const baseline = JSON.parse(readFileSync(SIGNATURE_PATH, 'utf8'));
    // Structure must match exactly; page heights may drift within ±12% (fonts, live data).
    const structDrift = JSON.stringify(baseline.structure) !== JSON.stringify(signature.structure);
    const heightDrift = Object.entries(signature.viewports).filter(([k, v]) => {
      const base = baseline.viewports[k];
      return !base || Math.abs(v.pageHeight - base.pageHeight) / base.pageHeight > 0.12;
    });
    if (structDrift || heightDrift.length) {
      console.error('Homepage visual signature drifted from baseline:');
      if (structDrift) console.error('  · structure changed (sections/headings/landmarks/counts)');
      for (const [k] of heightDrift) console.error(`  · ${k} page height drifted >12%`);
      console.error('Review reports/visual/home/*.png, then re-baseline if intended.');
      process.exit(1);
    }
    console.log('Homepage visual signature matches baseline.');
    return;
  }

  writeFileSync(SIGNATURE_PATH, JSON.stringify(signature, null, 2) + '\n');
  console.log(
    `Wrote ${SIGNATURE_PATH} + ${VIEWPORTS.length * THEMES.length} screenshots under ${SHOT_DIR}/`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
