// Freshness / label-honesty guard — the core trust promise.
//
// Every price surface must show WHERE the number came from and HOW FRESH it is, and must frame the
// spot value as a reference/estimate (never a shop/retail quote). This asserts, in a real browser on
// the primary price surfaces (home + tracker, EN + AR), that the `FreshnessBadge` renders with:
//   • a recognised freshness state (live/cached/delayed/fallback/stale/unavailable/estimated),
//   • a non-empty source attribution, and
//   • a UTC-stamped "updated" time,
// and that the page carries reference/estimate framing. A regression that dropped the badge, the
// source, the timestamp, or the reference framing — i.e. presented a number with no provenance —
// would fail here.
const { test, expect } = require('@playwright/test');

const KNOWN_STATES = ['live', 'cached', 'delayed', 'fallback', 'stale', 'unavailable', 'estimated'];
const SURFACES = ['/index.html', '/tracker.html', '/index.html?lang=ar'];

test.describe('Freshness / label honesty on price surfaces', () => {
  for (const path of SURFACES) {
    test(`freshness badge has state + source + UTC timestamp: ${path}`, async ({
      page,
      baseURL,
    }) => {
      await page.goto((baseURL || '') + path, { waitUntil: 'load' });
      // The badge is populated after the price snapshot resolves.
      await page.locator('[data-freshness-state]').first().waitFor({ timeout: 10_000 });

      const info = await page.evaluate(() => {
        const badge = document.querySelector('[data-freshness-state]');
        if (!badge) return null;
        return {
          state: badge.getAttribute('data-freshness-state'),
          source:
            badge.querySelector('.freshness-badge__source')?.textContent?.trim() ||
            (/source|المصدر/i.test(badge.textContent || '') ? badge.textContent.trim() : ''),
          timestamp: badge.querySelector('.freshness-badge__timestamp')?.textContent?.trim() || '',
          fullText: (badge.textContent || '').replace(/\s+/g, ' ').trim(),
          referenceFraming: /reference|estimate|estimat|تقدير|مرجع/i.test(
            document.body.textContent || ''
          ),
        };
      });

      expect(info, `no freshness badge on ${path}`).not.toBeNull();
      expect(KNOWN_STATES, `unknown freshness state "${info.state}" on ${path}`).toContain(
        info.state
      );
      // Source attribution must be present and name a source.
      expect(info.source.length, `no source attribution on ${path}`).toBeGreaterThan(0);
      // A UTC timestamp must be shown so users can judge freshness.
      expect(info.timestamp, `no UTC timestamp in badge on ${path}: "${info.fullText}"`).toMatch(
        /UTC/
      );
      // Spot must be framed as a reference/estimate, never presented as a retail/shop price.
      expect(info.referenceFraming, `no reference/estimate framing on ${path}`).toBe(true);
    });
  }
});
