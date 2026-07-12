// @ts-check
// Container-scoped chart theming guard (audit A / work-queue #6).
//
// The tracker's chart terminal (.tracker-chart-wrap) is styled always-dark in
// BOTH site themes, so chart colors must resolve from the CONTAINER's CSS
// context (src/lib/chart-theme.js), never from the document root. Before this
// guard existed, the light site theme handed root-scoped parchment ink
// (#6a5c48 text / #ece5d2 grid) to a near-black panel, and the SVG fallback
// hardcoded its own hex palette (#b08a3e / #9d8c72), blind to tokens.
//
// Asserts in a real browser, in light AND dark site themes, EN and AR:
//   - the SVG first-paint chart's stroke/fill attrs equal the wrap's computed
//     chart tokens (container derivation, not hardcoded, not root-scoped);
//   - the GoldChart canvas is configured with the same container palette;
//   - toggling [data-theme] does not repaint the terminal's charts (its
//     tokens are theme-invariant by design) — no flash of root-theme colors.
//
// NOTE: the GoldChart half needs the BUILT dist (bare `lightweight-charts`
// import). CI serves dist (see .github/workflows/ci.yml); source-served local
// runs soft-skip only that half via the load-error fallback.
const { test, expect } = require('@playwright/test');

// r=1Y guarantees >=2 rows from the bundled monthly baseline so the SVG
// polyline renders even fully offline (no Supabase, no /data feed).
const trackerUrl = (lang) => `/tracker.html?lang=${lang}#mode=live&r=1Y`;

async function openTracker(page, { theme, lang = 'en' }) {
  // Kill external requests so init never hangs on provider/Supabase timeouts.
  await page.route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => route.abort());
  await page.goto(trackerUrl(lang), { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
    prefs.theme = t;
    localStorage.setItem('user_prefs', JSON.stringify(prefs));
  }, theme);
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#tp-chart polyline', { timeout: 45000 });
}

/** Chart tokens as computed ON the wrap (the container the reader consumes). */
async function readWrapTokens(page) {
  return page.evaluate(() => {
    const wrap = document.querySelector('.tracker-chart-wrap');
    const root = document.documentElement;
    const pick = (el, token) => getComputedStyle(el).getPropertyValue(token).trim();
    return {
      dataTheme: root.getAttribute('data-theme'),
      panelBg: getComputedStyle(wrap).backgroundColor,
      wrap: {
        text: pick(wrap, '--text-secondary'),
        grid: pick(wrap, '--border-subtle'),
        line: pick(wrap, '--color-gold'),
      },
      root: {
        text: pick(root, '--text-secondary'),
        grid: pick(root, '--border-subtle'),
        line: pick(root, '--color-gold'),
      },
    };
  });
}

async function readSvgColors(page) {
  return page.evaluate(() => {
    const svg = document.getElementById('tp-chart');
    return {
      polylineStroke: svg.querySelector('polyline')?.getAttribute('stroke'),
      textFill: svg.querySelector('text')?.getAttribute('fill'),
      gridStroke: svg.querySelector('line')?.getAttribute('stroke'),
      gradientStop: svg.querySelector('stop')?.getAttribute('stop-color'),
    };
  });
}

/**
 * Mount GoldChart via the manual trigger and return the colors it was
 * configured with, or null when the library can't load (source-served run).
 */
async function mountGoldChart(page) {
  await page.waitForFunction(() => typeof window.__installGoldChartNow === 'function', null, {
    timeout: 45000,
  });
  await page.evaluate(() => window.__installGoldChartNow());
  await page.waitForFunction(
    () =>
      (window.__GOLD_CHART && window.__GOLD_CHART._ready) || window.__GOLD_CHART?._fallbackReason,
    null,
    { timeout: 45000 }
  );
  return page.evaluate(() => {
    const chart = window.__GOLD_CHART;
    if (!chart || !chart._ready) return null;
    const opts = chart._chart.options();
    const seriesOpts = chart._series.options();
    return {
      text: opts.layout.textColor,
      grid: opts.grid.horzLines.color,
      border: opts.rightPriceScale.borderColor,
      line: seriesOpts.lineColor,
    };
  });
}

function expectSvgMatchesWrap(svgColors, tokens) {
  expect(svgColors.polylineStroke, 'SVG series stroke must come from the container').toBe(
    tokens.wrap.line
  );
  expect(svgColors.gradientStop, 'SVG gradient fill must come from the container').toBe(
    tokens.wrap.line
  );
  expect(svgColors.textFill, 'SVG label ink must come from the container').toBe(tokens.wrap.text);
  expect(svgColors.gridStroke, 'SVG gridlines must come from the container').toBe(tokens.wrap.grid);
}

test.describe('Chart theming is container-scoped on the tracker terminal', () => {
  test('light site theme: charts use the dark terminal palette, not root tokens', async ({
    page,
  }) => {
    await openTracker(page, { theme: 'light' });
    const tokens = await readWrapTokens(page);

    expect(tokens.dataTheme).toBe('light');
    // The terminal is dark even in light site theme — that is WHY root tokens
    // are the wrong source here.
    expect(tokens.panelBg).toBe('rgb(14, 14, 17)');
    // Container scoping must actually diverge from the root in light theme.
    expect(tokens.wrap.line).not.toBe(tokens.root.line);
    expect(tokens.wrap.text).not.toBe(tokens.root.text);

    expectSvgMatchesWrap(await readSvgColors(page), tokens);

    const canvasColors = await mountGoldChart(page);
    test.skip(canvasColors === null, 'GoldChart needs the built dist (CI serves dist)');
    expect(canvasColors.text, 'canvas ink must be the container value').toBe(tokens.wrap.text);
    expect(canvasColors.grid, 'canvas grid must be the container value').toBe(tokens.wrap.grid);
    expect(canvasColors.line, 'canvas series must be the container value').toBe(tokens.wrap.line);
    // Regression core: none of the light-root parchment palette on the panel.
    expect(canvasColors.text).not.toBe(tokens.root.text);
    expect(canvasColors.grid).not.toBe(tokens.root.grid);
  });

  test('dark site theme: same terminal palette (theme-invariant container)', async ({ page }) => {
    await openTracker(page, { theme: 'dark' });
    const tokens = await readWrapTokens(page);

    expect(tokens.dataTheme).toBe('dark');
    expectSvgMatchesWrap(await readSvgColors(page), tokens);

    const canvasColors = await mountGoldChart(page);
    test.skip(canvasColors === null, 'GoldChart needs the built dist (CI serves dist)');
    expect(canvasColors.text).toBe(tokens.wrap.text);
    expect(canvasColors.grid).toBe(tokens.wrap.grid);
    expect(canvasColors.line).toBe(tokens.wrap.line);
  });

  test('theme toggle does not repaint the terminal charts (no wrong-color flash)', async ({
    page,
  }) => {
    await openTracker(page, { theme: 'light' });
    const before = await readSvgColors(page);
    const canvasBefore = await mountGoldChart(page);

    // Flip the resolved theme exactly like nav.js does; both chart theme
    // observers watch this attribute.
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(250);

    const after = await readSvgColors(page);
    expect(after, 'SVG palette must not change — the terminal is theme-invariant').toEqual(before);

    test.skip(canvasBefore === null, 'GoldChart needs the built dist (CI serves dist)');
    const canvasAfter = await page.evaluate(() => {
      const chart = window.__GOLD_CHART;
      const opts = chart._chart.options();
      return { text: opts.layout.textColor, line: chart._series.options().lineColor };
    });
    expect(canvasAfter.text).toBe(canvasBefore.text);
    expect(canvasAfter.line).toBe(canvasBefore.line);
  });

  test('AR: container-scoped chart colors are direction-independent', async ({ page }) => {
    await openTracker(page, { theme: 'light', lang: 'ar' });
    expect(await page.evaluate(() => document.documentElement.dir)).toBe('rtl');

    const tokens = await readWrapTokens(page);
    expect(tokens.wrap.line).not.toBe(tokens.root.line);
    expectSvgMatchesWrap(await readSvgColors(page), tokens);
  });
});
