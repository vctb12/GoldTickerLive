// Per-locale dictionary split — the network-level guarantee unit tests can't give:
// (1) an English route must NEVER fetch the Arabic dictionary module, while the page
//     still hydrates its dictionary-driven strings (data-i18n), and
// (2) an Arabic route fetches the AR module exactly once and renders real Arabic
//     from the global dictionary (data-i18n element + breadcrumbs).
//
// Served the same way as the rest of the e2e suite: `python3 -m http.server 8080` at
// repo root, so pages hydrate from native ESM. The URL pattern below also matches the
// built chunk name (assets/translations.ar-<hash>.js).
const { test, expect } = require('@playwright/test');

const AR_DICT_RE = /translations\.ar[^/]*\.js(\?|$)/;

function watchPage(page) {
  const arDictRequests = [];
  const badErrors = [];
  page.on('request', (request) => {
    if (AR_DICT_RE.test(request.url())) arDictRequests.push(request.url());
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/\[i18n\]|translations|ensureLocale/i.test(text)) badErrors.push(text);
  });
  page.on('pageerror', (error) => badErrors.push(`pageerror: ${error}`));
  return { arDictRequests, badErrors };
}

test.describe('Per-locale dictionary split: EN never fetches AR; AR loads it once', () => {
  test('EN home hydrates its data-i18n strings without fetching the AR dictionary', async ({
    page,
    baseURL,
  }) => {
    const { arDictRequests, badErrors } = watchPage(page);

    await page.goto((baseURL || '') + '/index.html', { waitUntil: 'domcontentloaded' });

    // Dictionary-driven hydration ran: the skip link is a data-i18n element
    // resolved from TRANSLATIONS.en ('home.skipLink').
    await expect(page.locator('a.skip-link[data-i18n="skipLink"]')).toHaveText(
      'Skip to main content'
    );
    // The shared shell (nav) is mounted, so init() has passed ensureLocale().
    await expect(page.locator('header nav').first()).toBeVisible({ timeout: 10_000 });

    expect(
      arDictRequests,
      `EN route must not fetch the AR dictionary, got: ${arDictRequests.join(', ')}`
    ).toEqual([]);
    expect(badErrors, `unexpected i18n errors: ${badErrors.join(' | ')}`).toEqual([]);
  });

  test('AR home fetches the AR dictionary once and renders Arabic from data-i18n', async ({
    page,
    baseURL,
  }) => {
    const { arDictRequests, badErrors } = watchPage(page);

    await page.goto((baseURL || '') + '/index.html?lang=ar', { waitUntil: 'domcontentloaded' });

    // A known global-dictionary string rendered into a data-i18n element
    // (AR value of 'home.skipLink' — byte-identical to the pre-split table).
    await expect(page.locator('a.skip-link[data-i18n="skipLink"]')).toHaveText(
      'تخطّ إلى المحتوى الرئيسي',
      { timeout: 10_000 }
    );
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    expect(
      arDictRequests.length,
      'AR route must fetch the on-demand AR dictionary module exactly once'
    ).toBe(1);
    expect(badErrors, `unexpected i18n errors: ${badErrors.join(' | ')}`).toEqual([]);
  });

  test('AR calculator renders Arabic breadcrumbs from the grafted dictionary', async ({
    page,
    baseURL,
  }) => {
    const { arDictRequests, badErrors } = watchPage(page);

    await page.goto((baseURL || '') + '/calculator.html?lang=ar', {
      waitUntil: 'domcontentloaded',
    });

    // Breadcrumb labels resolve from the global dictionary (nav.calculator /
    // nav.home) — the boot awaits ensureLocale() before injecting them.
    await expect(
      page.locator('.breadcrumbs-current [itemprop="name"]'),
      'current breadcrumb must be the AR value of nav.calculator'
    ).toHaveText('حاسبة', { timeout: 10_000 });
    await expect(page.locator('.breadcrumbs-link [itemprop="name"]').first()).toHaveText(
      'الرئيسية'
    );

    expect(arDictRequests.length, 'AR dictionary fetched exactly once').toBe(1);
    expect(badErrors, `unexpected i18n errors: ${badErrors.join(' | ')}`).toEqual([]);
  });
});
