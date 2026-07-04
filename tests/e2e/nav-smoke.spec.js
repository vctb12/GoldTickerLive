// phx/12: Nav smoke coverage.
// Validates the main navigation is present on key pages and that the primary
// nav links resolve to non-error pages.
const { test, expect } = require('@playwright/test');

const navPages = [
  '/',
  '/tracker.html',
  '/shops.html',
  '/calculator.html',
  '/compare.html',
  '/heatmap.html',
  '/portfolio.html',
  '/learn.html',
  '/methodology.html',
];

test.describe('Nav: present on key pages', () => {
  for (const path of navPages) {
    test(`nav element on ${path}`, async ({ page, baseURL }) => {
      const res = await page.goto((baseURL || '') + path, { waitUntil: 'domcontentloaded' });
      expect(res, `no response for ${path}`).not.toBeNull();
      expect(res.status()).toBeLessThan(400);

      // The nav is injected client-side via src/components/nav.js — wait for it.
      const navSelector = 'nav, [role="navigation"], .nav, .site-nav, header nav';
      await page.waitForSelector(navSelector, { timeout: 5000 }).catch(() => {
        /* fall through to explicit assertion */
      });
      const count = await page.locator(navSelector).count();
      expect(count, `no nav element rendered on ${path}`).toBeGreaterThan(0);
    });
  }
});

test.describe('Homepage nav: primary links resolve', () => {
  test('internal nav links point to kept pages that load without 404', async ({
    page,
    baseURL,
  }) => {
    const homeUrl = (baseURL || 'http://localhost:8080') + '/';
    await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });

    // The surviving public surfaces after the 2026-07-04 page reduction.
    const kept = [
      '/tracker.html',
      '/calculator.html',
      '/compare.html',
      '/heatmap.html',
      '/portfolio.html',
      '/shops.html',
      '/learn.html',
      '/methodology.html',
    ];

    // Resolve hrefs against the page URL to handle absolute, root-relative, and relative forms.
    const urls = await page.$$eval(
      'a[href]',
      (as, args) => {
        const [pageUrl, keptPaths] = args;
        return Array.from(
          new Set(
            as
              .map((a) => {
                try {
                  return new URL(a.getAttribute('href') || '', pageUrl).pathname;
                } catch {
                  return '';
                }
              })
              .filter((p) => keptPaths.includes(p))
          )
        );
      },
      [homeUrl, kept]
    );

    expect(urls.length, 'no kept-page nav links found on homepage').toBeGreaterThan(0);

    for (const p of urls) {
      const res = await page.request.get((baseURL || 'http://localhost:8080') + p);
      expect(res.status(), `broken nav link: ${p}`).toBeLessThan(400);
    }
  });
});
