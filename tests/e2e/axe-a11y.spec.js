// @ts-check
// Permanent axe-core accessibility gate (Operation Midas phase 20, WCAG 2.1 AA).
//
// Runs the axe-core engine against the BUILT, hydrated DOM of every flagship
// template, in both languages (EN / AR via ?lang=ar) and both site themes
// (light / dark via the user_prefs preinit token), and fails the build on any
// axe violation of impact `critical` or `serious`. `moderate` / `minor`
// findings are printed for triage but do not gate — the long tail is tracked
// as followups (see the phase-20 summary), not swept in one pass.
//
// Why axe *and* pa11y: `.pa11yci.js` (htmlcs runner, 3 static URLs) audits the
// pre-hydration source markup; this spec audits the live client-rendered DOM in
// every lang×theme permutation. They are complementary — this spec does NOT
// replace pa11y and the pa11y config is intentionally left in place.
//
// Serving: playwright's webServer serves the repo root locally; CI serves the
// built `dist/`. Either way the templates below render. External origins are
// aborted so the scan is deterministic and never hangs on a provider timeout.
const { test, expect } = require('@playwright/test');
const axePath = require.resolve('axe-core');

// Flagship templates the phase-20 gate protects.
const PAGES = [
  '/index.html',
  '/tracker.html',
  '/calculator.html',
  '/compare.html',
  '/portfolio.html',
  '/methodology.html',
  '/shops.html',
];
const LANGS = ['en', 'ar'];
const THEMES = ['light', 'dark'];

// axe rules that gate the build.
const BLOCKING_IMPACTS = new Set(['critical', 'serious']);

/**
 * Navigate to a template with an explicit language + theme, wait for hydration,
 * inject axe-core, and return the violations array.
 */
async function scan(page, path, lang, theme) {
  // Kill external requests so init never hangs on provider / Supabase timeouts.
  await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => route.abort());
  const url = `${path}${lang === 'ar' ? '?lang=ar' : ''}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Set the site theme the same way the app does (user_prefs → preinit token).
  await page.evaluate((t) => {
    const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
    prefs.theme = t;
    localStorage.setItem('user_prefs', JSON.stringify(prefs));
  }, theme);
  await page.reload({ waitUntil: 'load' });
  // Let hydration inject nav/footer/controls and paint the theme.
  await page.waitForTimeout(1500);
  if (lang === 'ar') {
    await page
      .waitForFunction(() => document.documentElement.dir === 'rtl', undefined, { timeout: 10000 })
      .catch(() => {});
  }
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    // @ts-ignore — injected global
    const res = await window.axe.run(document, { resultTypes: ['violations'] });
    return res.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => ({
        target: n.target.join(' '),
        summary: (n.failureSummary || '').replace(/\s+/g, ' ').trim().slice(0, 200),
      })),
    }));
  });
}

test.describe('axe-core WCAG 2.1 AA gate (critical + serious)', () => {
  for (const path of PAGES) {
    for (const lang of LANGS) {
      for (const theme of THEMES) {
        test(`no critical/serious axe violations: ${path} [${lang}/${theme}]`, async ({ page }) => {
          const violations = await scan(page, path, lang, theme);
          const blocking = violations.filter((v) => BLOCKING_IMPACTS.has(v.impact));
          const advisory = violations.filter((v) => !BLOCKING_IMPACTS.has(v.impact));
          if (advisory.length) {
            // Triage-only: surfaced in the report, does not gate the build.
            console.log(
              `[axe advisory] ${path} [${lang}/${theme}]:`,
              advisory.map((v) => `${v.impact}:${v.id}(${v.nodes.length})`).join(', ')
            );
          }
          const detail = blocking
            .map(
              (v) =>
                `\n  • [${v.impact}] ${v.id} — ${v.help}\n` +
                v.nodes.map((n) => `      ${n.target} :: ${n.summary}`).join('\n')
            )
            .join('');
          expect(blocking, `axe critical/serious on ${path} [${lang}/${theme}]:${detail}`).toEqual(
            []
          );
        });
      }
    }
  }
});
