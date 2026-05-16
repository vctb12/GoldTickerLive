---
applyTo: "sw.js,manifest.*,vite.config.*,src/**/*pwa*,scripts/**/*cache*,assets/**"
---

# PWA / Service Worker Instructions

`sw.js` is the most easily-broken file in the repo: a bad cache strategy ships stale data as
"live", and a base-path mismatch breaks both the custom domain and the legacy GitHub Pages path.

## 1. Base-path safety

Gold Ticker Live serves from two paths in practice:

- `https://goldtickerlive.com/` (custom domain — canonical)
- `https://vctb12.github.io/Gold-Prices/` (legacy GitHub Pages path — still resolves)

Service-worker scope and asset URLs must work on **both**. Rules:

- `navigator.serviceWorker.register('/sw.js', { scope: '/' })` works on the custom domain.
  Legacy path uses `'./sw.js'` with `{ scope: './' }` — current `sw.js` handles this with a path
  detection block at the top.
- All cached URLs in the SW must be **relative** to the SW's scope. Never hard-code
  `https://goldtickerlive.com/...` inside the SW.
- `vite.config.js` `base` value defaults to `/` for the custom domain. If you ever need to build
  for the legacy path, document it in the PR.

## 2. Cache versioning

- The SW maintains a versioned cache name (e.g. `gtl-cache-v17`). **Bump the version on every PR
  that changes a cached asset's content or the SW's cache strategy.**
- On activation, the SW deletes caches that don't match the current version.
- Don't share cache names across major SW rewrites — naming collisions cause stale responses to
  survive.

## 3. Strategies (current)

- **HTML pages**: network-first with offline fallback to `offline.html`.
- **Static assets** (CSS, JS, fonts, images): cache-first with revalidation.
- **API / price data**: network-first, short TTL; cached responses **must surface a `cached`
  freshness label** when served.

Never cache a price response and serve it as "live". The freshness label propagates with the
response.

## 4. Offline behaviour

- `offline.html` is the user-facing offline page. Keep it lightweight, branded, and link back to
  the homepage.
- Offline must not show a fake current price. If the only data is cached, label it.

## 5. Cached price honesty

- The SW exposes a header (or response metadata) indicating cache age.
- The UI inspects this and renders the freshness component with `cached` state and the original
  timestamp.
- Stripping this label to "look cleaner" is a trust violation (see
  [`gold-pricing.instructions.md`](./gold-pricing.instructions.md) §3).

## 6. Asset caching

- Cache CSS, JS, fonts, and OG images.
- Don't cache:
  - `/admin/**` (admin panel; needs fresh auth)
  - Analytics endpoints
  - Stripe / webhook routes
- Asset URLs in HTML use cache-busting via Vite's content hashing during the build.

## 7. Deployment testing

After any SW change:

```bash
npm run build
npm run preview     # serves dist/ locally
# Open in browser → DevTools → Application → Service Workers
# Verify: new SW is "installed and activated", old cache versions are deleted
# Hard-reload → verify pages load, then offline-toggle in DevTools and confirm offline.html
```

## 8. Cache busting

- Vite content-hashes built assets in `dist/`. Reference these hashed paths from HTML
  automatically.
- Manual cache-bust query strings (`?v=2`) are a code smell — use hashed filenames instead.

## 9. SW update flow

- New SW installed → `waiting` state → activates when all tabs are closed (or via `skipWaiting`).
- For high-impact updates (cache schema change, freshness logic), use `clients.claim()` after
  `skipWaiting()` so users get the new SW on the next navigation.
- Surface a "refresh to update" UI hint only for breaking SW changes — don't nag users on every
  cache version bump.

## 10. Common PWA mistakes to avoid

- Hard-coding `https://goldtickerlive.com/...` inside `sw.js` (breaks legacy GitHub Pages path).
- Forgetting to bump the cache version after changing a cached asset.
- Caching admin / API routes that should always hit the network.
- Showing a cached price without a freshness label.
- Caching `index.html` aggressively with no revalidation (users see weeks-old homepage).
- Not testing offline mode after a change.

## 11. Manifest

- `manifest.json` declares the PWA name, icons, theme color, start_url.
- Theme color tokens in `manifest.json` must match the dark/gold identity in `styles/global.css`.
- Icons live in `assets/` — add the full size matrix (192, 256, 384, 512) when changing branding.

See [`docs/PERFORMANCE.md`](../../docs/PERFORMANCE.md) for cache-strategy rationale and budgets.
