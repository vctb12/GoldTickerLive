// Glossary + Compare "no empty render" surface guards.
//
// Two content/tool surfaces that hydrate client-side and could silently render empty on a data or
// boot regression. This locks their substance:
//   • Glossary — a substantial set of terms, each with a name AND a definition, in EN and AR
//     (the glossary is a static bilingual list, not a search UI).
//   • Compare — the comparison table renders rows with price-formatted numbers, and the add-country
//     control is present.
// A 2026-07-10 sweep: 52 glossary terms (all named+defined, EN & AR); compare 89 rows / 28 prices.
const { test, expect } = require('@playwright/test');

test.describe('Glossary renders a substantive bilingual term list', () => {
  for (const lang of ['en', 'ar']) {
    test(`glossary terms have names + definitions (${lang})`, async ({ page, baseURL }) => {
      await page.goto((baseURL || '') + '/glossary.html' + (lang === 'ar' ? '?lang=ar' : ''), {
        waitUntil: 'load',
      });
      await page.waitForTimeout(1000);
      const g = await page.evaluate(() => {
        const terms = [...document.querySelectorAll('.gloss-term')];
        return {
          count: terms.length,
          withName: terms.filter(
            (t) => (t.querySelector('.gloss-term-name')?.textContent || '').trim().length > 0
          ).length,
          withDef: terms.filter(
            (t) => (t.querySelector('.gloss-term-def')?.textContent || '').trim().length > 10
          ).length,
        };
      });
      expect(
        g.count,
        `${lang}: glossary must render a substantial term list`
      ).toBeGreaterThanOrEqual(40);
      expect(g.withName, `${lang}: every term needs a name`).toBe(g.count);
      expect(g.withDef, `${lang}: every term needs a definition`).toBe(g.count);
    });
  }
});

test.describe('Compare tool renders a populated comparison', () => {
  test('comparison table has rows with prices and an add-country control', async ({
    page,
    baseURL,
  }) => {
    await page.goto((baseURL || '') + '/compare.html', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const c = await page.evaluate(() => ({
      tableRows: document.querySelectorAll('table tbody tr, table tr').length,
      priceNums: ((document.body.textContent || '').match(/\d[\d,]*\.\d{2}/g) || []).length,
      addSel: Boolean(document.querySelector('#compare-add-select')),
    }));
    expect(c.tableRows, 'compare must render comparison rows').toBeGreaterThan(3);
    expect(c.priceNums, 'compare must show price-formatted numbers').toBeGreaterThan(3);
    expect(c.addSel, 'compare must expose the add-country control').toBe(true);
  });
});
