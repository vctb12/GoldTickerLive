const { test, expect } = require('@playwright/test');

const MOBILE = { width: 360, height: 800 };

test.describe('Multi-metal local pilot mobile controls', () => {
  test.use({ viewport: MOBILE });

  test('keeps gold-only summary out of the Silver view and localizes Arabic chrome', async ({
    page,
  }) => {
    await page.goto('/tracker.html?metals=preview&lang=en');
    await page.waitForSelector('#tp-metal-chart-workspace:not([hidden])', { timeout: 15000 });

    await page.locator('#tp-workspace-toggle').click();
    await page.locator('#tp-language').selectOption('ar');
    await expect(page.locator('#tp-workspace-toggle')).toHaveText('استخدام مساحة العمل الأساسية');
    await page.getByRole('tab', { name: 'الفضة', exact: true }).click();
    await expect(page.locator('#tp-mini-strip')).toBeHidden();
    await expect(page.locator('#tp-metal-tabs-hint')).toBeVisible();
    await expect(page.locator('#tp-metal-tabs-hint')).toContainText('المعادن الأربعة');
  });

  test('reveals the focused fourth metal and disables smooth motion when requested', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      window.__metalTabScrollCalls = [];
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function scrollIntoView(options) {
        if (this.classList?.contains('tracker-metal-tab')) {
          window.__metalTabScrollCalls.push(options);
        }
        return original.call(this, options);
      };
    });
    await page.goto('/tracker.html?metals=preview&lang=en');
    await page.waitForSelector('#tp-metal-chart-workspace:not([hidden])', { timeout: 15000 });

    const gold = page.getByRole('tab', { name: 'Gold', exact: true });
    await gold.focus();
    await gold.press('End');
    await expect(page.getByRole('tab', { name: 'Palladium', exact: true })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    const state = await page.evaluate(() => {
      const tablist = document.getElementById('tp-metal-tabs');
      const selected = tablist?.querySelector('[aria-selected="true"]');
      const listRect = tablist?.getBoundingClientRect();
      const tabRect = selected?.getBoundingClientRect();
      return {
        behavior: window.__metalTabScrollCalls.at(-1)?.behavior,
        selectedVisible:
          Boolean(listRect && tabRect) &&
          tabRect.left >= listRect.left - 1 &&
          tabRect.right <= listRect.right + 1,
      };
    });

    expect(state.behavior).toBe('auto');
    expect(state.selectedVisible).toBeTruthy();
  });

  for (const locale of [
    { lang: 'en', tab: 'Palladium' },
    { lang: 'ar', tab: 'البلاديوم' },
  ]) {
    test(`reveals an initial Palladium deep link [${locale.lang}]`, async ({ page }) => {
      await page.goto(
        `/tracker.html?metals=preview&lang=${locale.lang}#mode=live&metal=palladium&grade=999`
      );
      await page.waitForSelector('#tp-metal-chart-workspace:not([hidden])', { timeout: 15000 });

      const selected = page.getByRole('tab', { name: locale.tab, exact: true });
      await expect(selected).toHaveAttribute('aria-selected', 'true');
      const visible = await selected.evaluate((tab) => {
        const list = tab.closest('[role="tablist"]');
        const listRect = list.getBoundingClientRect();
        const tabRect = tab.getBoundingClientRect();
        return tabRect.left >= listRect.left - 1 && tabRect.right <= listRect.right + 1;
      });
      expect(visible).toBeTruthy();
    });
  }
});
