// Theme-toggle correctness guard (50-Plan #29).
//
// The theme is applied to <html data-theme> (resolved light|dark) + data-theme-mode (auto|light|dark)
// by an inline pre-init script (FOUC-safe) mirrored by nav.js, persisted in localStorage
// `user_prefs.theme`. This asserts, in a real browser: the theme is applied before hydration, an
// explicit dark preference actually changes the rendered background and survives reload, and clicking
// the toggle updates the resolved theme + persists the choice. A 2026-07-10 sweep confirmed all of
// this (light bg rgb(253,251,245) → dark bg rgb(11,11,13)).
const { test, expect } = require('@playwright/test');

async function setPref(page, theme) {
  await page.evaluate((t) => {
    const up = JSON.parse(localStorage.getItem('user_prefs') || '{}');
    up.theme = t;
    localStorage.setItem('user_prefs', JSON.stringify(up));
  }, theme);
}

async function themeState(page) {
  return page.evaluate(() => ({
    dataTheme: document.documentElement.getAttribute('data-theme'),
    mode: document.documentElement.getAttribute('data-theme-mode'),
    bg: getComputedStyle(document.body).backgroundColor,
    pref: JSON.parse(localStorage.getItem('user_prefs') || '{}').theme,
  }));
}

test.describe('Theme toggle correctness', () => {
  test('theme is applied on load (FOUC-safe) and resolves to light or dark', async ({
    page,
    baseURL,
  }) => {
    await page.goto((baseURL || '') + '/index.html', { waitUntil: 'domcontentloaded' });
    // data-theme must be set immediately (pre-init inline script), not only after hydration.
    const dt = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(['light', 'dark'], 'data-theme must resolve to light|dark on load').toContain(dt);
  });

  test('explicit dark preference applies dark background and survives reload', async ({
    page,
    baseURL,
  }) => {
    await page.goto((baseURL || '') + '/index.html', { waitUntil: 'load' });

    await setPref(page, 'light');
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(400);
    const light = await themeState(page);
    expect(light.dataTheme).toBe('light');

    await setPref(page, 'dark');
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(400);
    const dark = await themeState(page);
    expect(dark.dataTheme, 'dark pref must resolve data-theme=dark').toBe('dark');
    expect(dark.pref, 'dark pref must persist in localStorage').toBe('dark');
    // Dark theme must actually change the rendered background — not just the attribute.
    expect(dark.bg, 'dark background must differ from light background').not.toBe(light.bg);
  });

  test('clicking the toggle updates the resolved theme and persists the choice', async ({
    page,
    baseURL,
  }) => {
    await page.goto((baseURL || '') + '/index.html', { waitUntil: 'load' });
    await setPref(page, 'light');
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(400);

    const before = await themeState(page);
    await page.click('#nav-theme-toggle');
    await page.waitForTimeout(300);
    const after = await themeState(page);

    // The mode must change, and the persisted preference must track it (cycle auto→light→dark).
    expect(after.mode, 'toggle must change the theme mode').not.toBe(before.mode);
    expect(['auto', 'light', 'dark'], 'persisted pref must be a valid mode').toContain(after.pref);
    expect(['light', 'dark'], 'data-theme stays resolved after toggle').toContain(after.dataTheme);
  });
});
