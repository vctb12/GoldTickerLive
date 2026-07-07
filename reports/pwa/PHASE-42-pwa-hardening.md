# Phase 42 — PWA hardening / installability (Green)

The "mobile app" is the PWA (React Native remains out of scope). This phase hardens installability
with **additive, tested tooling** plus a small safe manifest improvement — and, because `sw.js` is
owner-gated, records service-worker suggestions as **recommend-only**.

## What shipped

- **`manifest.json`** — two safe hardening additions:
  - `"id": "/"` — a stable app identity (prevents the browser treating scope/start_url changes as a
    different app; recommended by Chromium).
  - `"dir": "ltr"` — declared base direction.
  - Everything else was already solid (name/short_name, `display: standalone`, 192 + 512 +
    **maskable 512** icons, `theme_color`, categories, shortcuts).
- **`src/pwa/manifest-audit.js`** — a pure installability auditor. `auditManifest(manifest)` →
  `{ installable, errors, warnings }` against the Chromium/A2HS criteria (name/short_name,
  start_url, installable `display`, ≥192 & ≥512 icons) with recommended-hardening warnings (maskable
  icon, `theme_color`, `background_color`, `id`, `short_name`, `screenshots`, `categories`). No I/O,
  no DOM.
- **`src/pwa/install-controller.js`** — a reusable, dependency-injected A2HS controller: the shared
  version of the inline `beforeinstallprompt` handling. `createInstallController({ win })` →
  `{ init, canInstall, isInstalled, promptInstall, getState, subscribe }`. Suppresses the
  mini-infobar, stores the deferred prompt (single-use), and detects installed state via
  `display-mode: standalone` **and** iOS `navigator.standalone`. SSR/no-DOM safe. Does **not** touch
  the service worker.

Both modules are additive/unimported → tree-shaken; the existing home-page install banner is left
untouched (it belongs to the homepage surface).

## Audit result for the committed manifest

`auditManifest(manifest.json)` → **installable: true**, no `id`/`maskable`/`theme_color` warnings
after this phase. The one remaining recommendation is **`screenshots`** (still empty) — populating
it enriches the desktop/Android install dialog. Not added here because it needs real,
license-registered device screenshots (see `assets/MANIFEST.md`), which is an asset-pipeline task.

## Recommend-only (owner-gated `sw.js`)

Not modified. Suggestions for the owner, to be applied to `sw.js` directly:

- Confirm the offline fallback (`offline.html`) is precached and served for navigations when the
  network is unavailable — the biggest installed-app reliability win.
- Consider a `navigationPreload` + stale-while-revalidate strategy for the shell so the installed
  app opens instantly, and versioned cache names so old caches are cleaned on activate.
- Keep the SW scope aligned with the manifest `scope` (`/`).

## Constraints honoured

$0 / no dependency; `sw.js` untouched (recommend-only); RN out of scope; additive modules; no other
phase's page files touched; manifest change limited to safe identity/direction fields.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1298 pass, +12**) + `npm run lint` — all green.
