// Offline / PWA fallback guard (verify-only — does NOT touch sw.js).
//
// The service worker precaches `/offline.html` and serves it (or cached content) for navigations
// when the network is unavailable (network-first → cache → offline.html). Two deterministic facts
// underpin that story, asserted here:
//   1. the service worker registers and activates on a normal page, and
//   2. `offline.html` is a valid, self-contained fallback — substantive content + a way back home,
//      with no first-party resource errors (if the fallback page itself is broken, offline is broken).
//
// The live offline-interception navigation was verified manually during authoring (SW active + context
// offline → `/index.html` still rendered app content); it is intentionally NOT asserted here because
// SW activation/precache timing is browser-dependent and would make the guard flaky across the
// chromium/firefox/webkit CI matrix. This spec keeps only the deterministic guarantees.
const { test, expect } = require('@playwright/test');

test.describe('Offline / PWA fallback', () => {
  test('service worker registers and activates', async ({ page, baseURL }) => {
    await page.goto((baseURL || '') + '/index.html', { waitUntil: 'load' });
    const reg = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      try {
        const r = await navigator.serviceWorker.ready;
        return { supported: true, active: Boolean(r.active), scope: r.scope };
      } catch (e) {
        return { supported: true, active: false, error: String(e) };
      }
    });
    test.skip(!reg.supported, 'no service worker support in this browser');
    expect(reg.active, `service worker must activate (scope ${reg.scope})`).toBe(true);
  });

  test('offline.html is a valid self-contained fallback', async ({ page, baseURL }) => {
    const firstPartyErrors = [];
    page.on('response', (r) => {
      try {
        if (r.status() >= 400 && new URL(r.url()).host === new URL(baseURL).host) {
          firstPartyErrors.push(`HTTP ${r.status()} ${r.url()}`);
        }
      } catch {
        /* ignore */
      }
    });

    await page.goto((baseURL || '') + '/offline.html', { waitUntil: 'load' });
    await page.waitForTimeout(600);

    const info = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      textLen: (document.body.textContent || '').replace(/\s+/g, ' ').trim().length,
      hasHomeLink: Boolean(
        document.querySelector('a[href="/"], a[href="/index.html"], a[href*="index.html"]')
      ),
    }));

    expect(info.h1, 'offline.html must have a heading').toBeGreaterThanOrEqual(1);
    expect(info.textLen, 'offline.html must have substantive content').toBeGreaterThan(200);
    expect(info.hasHomeLink, 'offline.html must offer a way back home').toBe(true);
    expect(
      firstPartyErrors,
      `offline.html has first-party errors: ${firstPartyErrors.join(' | ')}`
    ).toEqual([]);
  });
});
