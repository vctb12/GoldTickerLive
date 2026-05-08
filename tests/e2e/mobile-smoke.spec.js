// @ts-check
const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740 },
  { name: '375x812', width: 375, height: 812 },
  { name: '390x844', width: 390, height: 844 },
  { name: '414x896', width: 414, height: 896 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
];

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/tracker.html', name: 'tracker' },
  { path: '/calculator.html', name: 'calculator' },
  { path: '/shops.html', name: 'shops' },
  { path: '/methodology.html', name: 'methodology' },
];

async function assertNoHorizontalOverflow(page, tolerancePx = 2) {
  const overflow = await page.evaluate(() => {
    const de = document.documentElement;
    const body = document.body;
    return {
      docOverflow: de.scrollWidth - de.clientWidth,
      bodyOverflow: body.scrollWidth - body.clientWidth,
      docScrollWidth: de.scrollWidth,
      docClientWidth: de.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
    };
  });

  expect(
    overflow.docOverflow,
    `documentElement overflow ${overflow.docScrollWidth} > ${overflow.docClientWidth}`
  ).toBeLessThanOrEqual(tolerancePx);
  expect(
    overflow.bodyOverflow,
    `body overflow ${overflow.bodyScrollWidth} > ${overflow.bodyClientWidth}`
  ).toBeLessThanOrEqual(tolerancePx);
}

test.describe('Mobile smoke — layout, nav, overflow', () => {
  for (const viewport of VIEWPORTS) {
    for (const { path, name } of PAGES) {
      test(`${name} — ${viewport.name}`, async ({ page, baseURL }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(String(err)));
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const url = (baseURL || '') + path;
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        await expect(page.locator('main')).toHaveCount(1);
        await expect(page.locator('nav.site-nav')).toHaveCount(1);

        // Bottom nav should exist on phone widths; on tablet width it may be hidden by CSS.
        if (viewport.width <= 480) {
          const bottomNav = page.locator('.mobile-bottom-nav');
          await expect(bottomNav).toHaveCount(1);
          await expect(bottomNav).toBeVisible();

          const menuBtn = page.locator('[data-mobile-nav="menu"]');
          await expect(menuBtn).toHaveCount(1);
          await menuBtn.click();

          const drawer = page.locator('#nav-drawer');
          await expect(drawer).toHaveAttribute('aria-hidden', 'false', { timeout: 5000 });

          await page.keyboard.press('Escape');
          await expect(drawer).toHaveAttribute('aria-hidden', 'true', { timeout: 5000 });
        }

        await assertNoHorizontalOverflow(page);

        // Trust/navigation sanity: methodology should remain reachable from core surfaces.
        if (path !== '/methodology.html') {
          await expect(page.locator('a[href*="methodology"]').first()).toBeAttached();
        }

        expect(errors, errors.join('\n')).toHaveLength(0);
      });
    }
  }

  test('RTL toggle works on mobile homepage', async ({ page, baseURL }) => {
    const url = (baseURL || '') + '/';
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('nav.site-nav')).toHaveCount(1);
    await page.waitForSelector('#nav-lang-toggle', { timeout: 10000 });

    await page.locator('#nav-lang-toggle').click();
    await page.waitForFunction(() => document.documentElement.dir === 'rtl', { timeout: 10000 });
    await assertNoHorizontalOverflow(page);
  });
});

