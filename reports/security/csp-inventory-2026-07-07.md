# CSP dry-run inventory — 2026-07-07

Inventory of inline scripts and external origins so a Content-Security-Policy can be shipped on the
static host (see `phase3-security-audit-2026-07-07.md` S-2). **Dry-run only — no CSP is enforced by
this phase.** Derived from a static scan of the HTML + `src/` and the live-capture network log.

## Inline scripts (need a hash or nonce under a strict CSP)

| Type                                                                       | Count / page        | CSP handling                                                                   |
| -------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| Theme pre-init `<script>` (build-injected, no `src`)                       | 1 per page          | Move to an external file **or** add its `sha256-…` hash to `script-src`        |
| `<script type="application/ld+json">` (JSON-LD)                            | 1–2 per page        | Data, not executable — allowed by CSP without a hash                           |
| Inline event handler `onclick="…"`                                         | 1 total (site-wide) | Refactor to `addEventListener` so `script-src` needn't allow `'unsafe-inline'` |
| `<script src="assets/analytics.js">`, `<script type="module" src="src/…">` | —                   | Same-origin `'self'` — fine                                                    |

The site is already close to CSP-ready: the build's `externalize-analytics` step means **no inline
analytics** (validate confirms "CSP can drop 'unsafe-inline'"). The only executable inline is the
theme-preinit; hashing it (or externalizing it) removes the last `'unsafe-inline'` need.

## External origins by CSP directive

| Directive     | Origins observed                                                                                         | Purpose                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `connect-src` | `https://api.gold-api.com`, `https://gold-api.com`, `https://freegoldapi.com`, `https://mintedmetal.com` | gold price primary + fallbacks                                     |
|               | `https://open.er-api.com`, `https://www.exchangerate-api.com`                                            | FX rates                                                           |
|               | `https://*.supabase.co`                                                                                  | shop data / site settings (anon, RLS)                              |
|               | `https://www.google-analytics.com`, `https://www.clarity.ms`                                             | analytics                                                          |
|               | `https://nominatim.openstreetmap.org`                                                                    | shops geocoding                                                    |
| `script-src`  | `https://cdn.jsdelivr.net`, `https://unpkg.com`                                                          | Leaflet (lazy, shops/heatmap map)                                  |
|               | `https://www.googletagmanager.com`, `https://www.clarity.ms`, `https://www.google-analytics.com`         | analytics                                                          |
|               | `https://pagead2.googlesyndication.com`                                                                  | ads                                                                |
| `frame-src`   | `https://www.tradingview.com`                                                                            | homepage price chart embed                                         |
|               | `https://pagead2.googlesyndication.com`                                                                  | ads                                                                |
| `img-src`     | `https:` (incl. `commons.wikimedia.org`, `openstreetmap.org` tiles), `data:`                             | flags / map tiles / inline SVG                                     |
| `style-src`   | `'self'`, `'unsafe-inline'`, `https://fonts.googleapis.com`                                              | (fonts are actually self-hosted woff2 — see note)                  |
| `font-src`    | `'self'`                                                                                                 | self-hosted Source Sans 3 + Cairo woff2 (no external font request) |

## Proposed static-host CSP (ship via Cloudflare `_headers`, or a build-injected `<meta>`)

```
default-src 'self';
script-src 'self' 'sha256-<theme-preinit-hash>' https://cdn.jsdelivr.net https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://pagead2.googlesyndication.com;
style-src 'self' 'unsafe-inline';
font-src 'self';
img-src 'self' data: https:;
connect-src 'self' https://api.gold-api.com https://gold-api.com https://freegoldapi.com https://mintedmetal.com https://open.er-api.com https://www.exchangerate-api.com https://*.supabase.co https://www.google-analytics.com https://www.clarity.ms https://nominatim.openstreetmap.org;
frame-src 'self' https://www.tradingview.com https://pagead2.googlesyndication.com;
frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';
```

### Deltas vs the server (`server.js`) Helmet CSP, and hardening opportunities

1. **Add the gold providers to `connect-src`** — the browser fetches
   gold-api/freegoldapi/mintedmetal directly; the server CSP omits them because the admin server
   doesn't.
2. **Drop Stripe origins** (`js.stripe.com`, `api.stripe.com`, `hooks.stripe.com`) — billing is
   parked; don't allowlist a parked lane.
3. **Self-host Leaflet** (Phase 16 candidate) to remove `cdn.jsdelivr.net` + `unpkg.com` from
   `script-src` entirely — smaller attack surface and one fewer third-party.
4. **`style-src`** can likely drop `https://fonts.googleapis.com` since fonts are self-hosted;
   verify no Google Fonts `<link>` remains before tightening.
5. Keep `'unsafe-inline'` out of `script-src` by hashing the theme-preinit (last inline executable).

**Owner gate:** shipping this requires the Cloudflare-front (S-2) or a build-step `<meta>` injection
that must land with a matching `tests/csp-regression.test.js` update in the same commit — deferred
to that decision, not applied here.
