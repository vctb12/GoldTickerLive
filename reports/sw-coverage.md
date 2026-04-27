# Service-worker coverage audit (W-14)

**Date:** 2026-04-27 · **Scope:** read-only audit of root entry HTML pages.

`scripts/node/check-sw-coverage.js` enforces that every top-level entry HTML page either registers
the service worker (`navigator.serviceWorker.register`) or appears on a documented allow-list with a
rationale. The check runs as part of `npm run validate`.

---

## Snapshot — 2026-04-27

| Page               | SW registered?              | Notes                                                      |
| ------------------ | --------------------------- | ---------------------------------------------------------- |
| `index.html`       | ✅ via `src/pages/home.js`  | Canonical registration path.                               |
| `invest.html`      | ✅ inline `<script>`        | Self-contained registration.                               |
| `404.html`         | ⏸ allow-listed              | Error page. SW would self-cache before render.             |
| `offline.html`     | ⏸ allow-listed              | Served _by_ the SW; must not register itself.              |
| `privacy.html`     | ⏸ allow-listed              | Static legal page; low cache value.                        |
| `terms.html`       | ⏸ allow-listed              | Static legal page; low cache value.                        |
| `pricing.html`     | ⏸ allow-listed              | Subscription surface; SW caching could mask price changes. |
| `calculator.html`  | 🟡 allow-listed (TODO §22b) | Wiring not yet in place. Safe to add.                      |
| `insights.html`    | 🟡 allow-listed (TODO §22b) | Wiring not yet in place. Safe to add.                      |
| `learn.html`       | 🟡 allow-listed (TODO §22b) | Wiring not yet in place. Safe to add.                      |
| `methodology.html` | 🟡 allow-listed (TODO §22b) | Wiring not yet in place. Safe to add.                      |
| `shops.html`       | 🟡 allow-listed (TODO §22b) | Wiring not yet in place. Safe to add.                      |
| `tracker.html`     | 🟡 allow-listed (TODO §22b) | Wiring not yet in place. Safe to add.                      |

---

## What this audit does **not** cover

- Generated leaf pages under `countries/<slug>/.../index.html`. These are hydrated by
  `src/lib/page-hydrator.js` and don't register the SW today. Tracked as a separate §22b follow-up —
  adding registration to the hydrator would push offline support across the long tail of
  country/city pages and is out of scope for this batch.
- `content/` HTML pages. Same reasoning: leaf pages, separate work.

---

## How to add SW registration to an allow-listed page

Drop this snippet just before `</body>`:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
</script>
```

Then remove the file from the `ALLOW_LIST` map in `scripts/node/check-sw-coverage.js` (the script
will warn if a page that's on the allow-list now also registers the SW — that's the cue to tighten
the baseline).

---

## Action log

- 2026-04-27 — Audit script + this report added. Status: ✅ guard live; 6 entry pages flagged as
  TODO follow-ups in §22b.
