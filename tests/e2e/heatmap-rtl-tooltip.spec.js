// Heatmap tooltip must track the pointer in BOTH directions (ltr + rtl).
//
// Regression guard: showTooltipFor() computes x as a physical offset from the
// wrapper's LEFT edge (clientX - wrapRect.left). It must therefore be applied
// with physical `left`, not `inset-inline-start` — under dir="rtl" the logical
// property resolves to the RIGHT edge and mirrors the tooltip across the map
// (observed pre-fix: ~430px away from the pointer at 1280px wide).
const { test, expect } = require('@playwright/test');

// The mirrored-bug displacement is hundreds of px; the correct offset is ~+12px
// (clamped near edges). 80px keeps the assertion meaningful without flaking on
// clamp/subpixel differences.
const NEAR_POINTER_PX = 80;

for (const { lang, dir } of [
  { lang: 'ar', dir: 'rtl' },
  { lang: 'en', dir: 'ltr' },
]) {
  test(`tooltip appears near the pointer (${lang}, dir=${dir})`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseURL || ''}/heatmap.html?lang=${lang}`, { waitUntil: 'load' });

    // Deterministic readiness: country regions carry data-code once the map renders.
    const region = page.locator('#heatmap-map-wrap svg [data-code="SA"]').first();
    await region.waitFor({ state: 'visible', timeout: 15000 });
    await expect(page.locator('html')).toHaveAttribute('dir', dir);

    const box = await region.boundingBox();
    expect(box, 'SA region must have a bounding box').toBeTruthy();
    const px = box.x + box.width / 2;
    const py = box.y + box.height / 2;

    // Synthetic pointer movement fires the svg's pointermove handler.
    await page.mouse.move(px - 5, py - 5);
    await page.mouse.move(px, py);

    const tip = page.locator('#heatmap-tooltip');
    await expect(tip).toBeVisible();

    const tipBox = await tip.boundingBox();
    expect(tipBox, 'tooltip must have a bounding box').toBeTruthy();

    // Tooltip's left edge sits at pointer + ~12px (clamped inside the wrapper).
    // A mirrored (RTL-buggy) tooltip lands hundreds of px away.
    expect(
      Math.abs(tipBox.x - px),
      `tooltip left edge (${tipBox.x.toFixed(1)}) must be near pointer x (${px.toFixed(1)})`
    ).toBeLessThanOrEqual(NEAR_POINTER_PX);

    // Positioning must never create horizontal document overflow.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, 'no horizontal document overflow').toBeLessThanOrEqual(0);
  });
}
