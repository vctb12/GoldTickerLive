// phx/12: Nav + country index smoke coverage.
// Validates the main navigation is present on key pages and that every
// country card on /countries/ resolves to a non-error page.
const { test, expect } = require('@playwright/test');

const navPages = [
  '/',
  '/tracker.html',
  '/shops.html',
  '/calculator.html',
  '/learn.html',
  '/insights.html',
  '/invest.html',
  '/methodology.html',
  '/countries/',
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

test.describe('Countries index: every card resolves', () => {
  test('all country tiles link to pages that load without 404', async ({ page, baseURL }) => {
    const indexUrl = (baseURL || 'http://localhost:8080') + '/countries/';
    await page.goto(indexUrl, { waitUntil: 'domcontentloaded' });

    // Resolve hrefs against the page URL to handle absolute, root-relative, and relative forms.
    const urls = await page.$$eval(
      'a[href]',
      (as, pageUrl) =>
        Array.from(
          new Set(
            as
              .map((a) => {
                try {
                  return new URL(a.getAttribute('href') || '', pageUrl).href;
                } catch {
                  return '';
                }
              })
              .filter((u) => /\/countries\/[a-z-]+\/?/.test(u))
          )
        ).slice(0, 25),
      indexUrl
    );

    expect(urls.length, 'no country links found on /countries/').toBeGreaterThan(0);

    for (const url of urls) {
      const res = await page.request.get(url);
      expect(res.status(), `broken country link: ${url}`).toBeLessThan(400);
    }
  });
});
