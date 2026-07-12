// Learn corpus lazy-split regression — the network-level guarantee unit tests can't give:
// (1) the English fast path (static fallback present) must NOT fetch the article corpus /
//     renderer modules (article-renderer.js + content-text.js) while the TOC still enhances,
//     and (2) the Arabic path must lazily fetch them and render the full Arabic article.
//
// Served the same way as the rest of the e2e suite: `python3 -m http.server 8080` at repo
// root, so `./src/pages/learn.js` (native ESM) hydrates directly with no build step. The
// URL pattern below also matches the built chunk names (assets/article-renderer-<hash>.js).
const { test, expect } = require('@playwright/test');

const CORPUS_MODULE_RE = /(article-renderer|content-text)[^/]*\.js(\?|$)/;

function watchPage(page) {
  const corpusRequests = [];
  const badErrors = [];
  page.on('request', (request) => {
    if (CORPUS_MODULE_RE.test(request.url())) corpusRequests.push(request.url());
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/\[learn\]|article-renderer|content-text|learn-hub/i.test(text)) badErrors.push(text);
  });
  page.on('pageerror', (error) => badErrors.push(`pageerror: ${error}`));
  return { corpusRequests, badErrors };
}

test.describe('Learn hub: corpus stays off the EN fast path, loads lazily for AR', () => {
  test('EN static path never fetches the corpus/renderer modules, TOC still works', async ({
    page,
    baseURL,
  }) => {
    const { corpusRequests, badErrors } = watchPage(page);

    await page.goto((baseURL || '') + '/learn.html', { waitUntil: 'domcontentloaded' });

    // Static fallback article is on screen (prerendered English copy).
    await expect(page.locator('#learn-article-root')).toHaveAttribute(
      'data-static-fallback',
      'true'
    );
    await expect(page.locator('#karats .learn-hub-section-title')).toHaveText(
      'Gold Karats Explained'
    );

    // Hydration finished: the catalog progress line is rendered by learn.js after
    // mountArticleExperience(), so the eager import graph has fully executed.
    await expect(page.locator('.learn-hub-progress')).toBeVisible({ timeout: 10_000 });

    // TOC enhancement still works without the corpus: clicking a TOC link scrolls
    // the section into view and the scroll-spy moves the active marker to it.
    await page.locator('a.learn-hub-toc-link[href="#zakat"]').click();
    await expect(page.locator('a.learn-hub-toc-link.is-active')).toHaveAttribute('href', '#zakat', {
      timeout: 10_000,
    });

    expect(
      corpusRequests,
      `EN fast path must not fetch corpus/renderer modules, got: ${corpusRequests.join(', ')}`
    ).toEqual([]);
    expect(badErrors, `unexpected learn errors: ${badErrors.join(' | ')}`).toEqual([]);
  });

  test('AR path lazily fetches the corpus and renders the Arabic article', async ({
    page,
    baseURL,
  }) => {
    const { corpusRequests, badErrors } = watchPage(page);

    await page.goto((baseURL || '') + '/learn.html?lang=ar', { waitUntil: 'domcontentloaded' });

    // Known Arabic corpus strings render verbatim (heading + body paragraph).
    await expect(page.locator('#karats .learn-hub-section-title')).toHaveText('شرح عيارات الذهب', {
      timeout: 10_000,
    });
    await expect(page.locator('#hallmark .learn-hub-paragraph').first()).toContainText(
      'تُشرف الجهات التنظيمية في الإمارات على دمغ الذهب'
    );
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    // The Arabic render is exactly what the lazy chunk exists for.
    expect(
      corpusRequests.length,
      'AR path must fetch the lazily imported corpus/renderer modules'
    ).toBeGreaterThan(0);
    expect(badErrors, `unexpected learn errors: ${badErrors.join(' | ')}`).toEqual([]);
  });
});
