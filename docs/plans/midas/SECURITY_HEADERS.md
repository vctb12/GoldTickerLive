# Operation Midas — Phase 12: Security Headers to Grade A

**Status:** repo-side ruleset ready. **Live application is owner-gated (Q5)** — the public site is
GitHub Pages behind Cloudflare, so `_headers` / `.htaccess` are **inert** on the live tier. The real
response headers are whatever Cloudflare (or the GH Pages edge) emits. Everything below is the exact
set the owner applies at **Cloudflare** (Transform Rule or Worker). This file is the source of
truth; `_headers` mirrors it for a future platform move but does not ship on GitHub Pages.

## Why this phase exists (live audit, `docs/plans/midas/AUDIT_LIVE.md`)

Probed production headers (2026-07-16) showed a realistic securityheaders.com grade of ~C/D:

- **No `Content-Security-Policy`** anywhere.
- **No `Permissions-Policy`** on the live tier.
- **`Strict-Transport-Security`** was a bare `max-age=…` (no `includeSubDomains`, no `preload`).
- Deprecated **`X-XSS-Protection`** and **`Expect-CT`** were still served.
- **`Access-Control-Allow-Origin: *`** on HTML documents (GH Pages sets this; see §7).

The fix is a header set applied at Cloudflare. CSP is rolled out **Report-Only first**, promoted to
enforce only after violation reports come back clean.

---

## 1. Evidence base (do not hand-edit — regenerate)

Run the inventory against the built site; it is the drift guard for the hashes below:

```bash
npm run build
node scripts/node/csp-inventory.js      # writes reports/csp-inventory.json, exits non-zero on drift
```

The inventory scans `dist/*.html` + `dist/assets/*.html` (built bytes, not source templates) and the
runtime fetch call-sites in `src/`. Findings that shape the policy:

- **Three** distinct inline (executable) `<script>` blocks exist across the built site. JSON-LD
  (`type="application/ld+json"`) blocks are data, not script, and CSP ignores them.
- The `gtl-theme-preinit` block is **byte-identical on every page** (a single hash spans all 19
  built HTML files — the inventory fails if that ever splits).
- `scripts/node/inject-price-snapshot.js` injects labeled price **text/attributes only** into
  `dist/index.html` — it adds **no** inline `<script>`, so it never changes the hash set.
- **Every** script/style/font/img the HTML loads is same-origin (`/assets/*`). No third-party
  resource is referenced from static markup — GA/Clarity are injected at runtime by
  `/assets/analytics.js` (same-origin), which then loads `googletagmanager.com` + `clarity.ms`.
- External absolute URLs in the HTML are `<a href>` navigation/attribution links, **not** resource
  loads — they need no CSP directive.
- Inline `<style>` blocks (404 + offline pages) and `style=` attributes are present → `style-src`
  uses `'unsafe-inline'` (see §4 justification).

### 1a. Allowed inline-script hashes (drift source of truth)

The inventory tool exits non-zero if the build produces an inline script whose hash is not listed
here. Keep this list and the `script-src` directive (§3) in sync.

| Inline script                      | Pages        | CSP hash                                              |
| ---------------------------------- | ------------ | ----------------------------------------------------- |
| `gtl-theme-preinit` (theme+reveal) | all          | `sha256-hwl6qY9HumTF1GNELc9W/mYDaRMlzIH+GSXNtBbn5rE=` |
| service-worker registration        | most         | `sha256-9JILtKd7BOhx0sG/TzkCDOlycX6n/Rq9jj4dioFmsYo=` |
| `offline.html` bilingual fallback  | offline.html | `sha256-yHJxga03lGua6eHcJx7xFPtoShrPnlgp1FoVGEsPL3A=` |

If Vite fingerprints or prettier reflows any inline block, the hash changes — rerun the inventory
and update this table (and the Cloudflare rule) in the same commit. Longer-term, prefer moving these
to external same-origin files so `script-src 'self'` alone suffices.

### 1b. Enumerated runtime connect origins (from `src/`)

`node scripts/node/csp-inventory.js` extracts these fetch/XHR origins from client JS. Each **must**
appear in `connect-src` (§3); `tests/midas-csp-inventory.test.js` locks this.

| Origin                                | Purpose                        | Source file                                        |
| ------------------------------------- | ------------------------------ | -------------------------------------------------- |
| `https://api.gold-api.com`            | primary XAU/USD spot           | `src/lib/quote-providers/gold-api-com-provider.js` |
| `https://mintedmetal.com`             | spot failover                  | `src/lib/quote-providers/minted-metal-provider.js` |
| `https://open.er-api.com`             | FX rates (non-AED)             | `src/config/constants.js` (`API_FX_URL`)           |
| `https://freegoldapi.com`             | optional reference history     | `src/lib/freegoldapi.js`                           |
| `https://api.gdeltproject.org`        | tracker news wire              | `src/tracker/wire.js`                              |
| `https://nominatim.openstreetmap.org` | shops reverse-geocode          | `src/pages/shops.js`                               |
| `https://*.supabase.co`               | public account + admin backend | `src/config/supabase.js` (`nebdpxjazlnsrfmlpgeq`)  |

Analytics connect origins are added at runtime by `/assets/analytics.js` (not in `src/`, so the
drift test does not enforce them, but they are required for GA/Clarity to work):
`https://www.googletagmanager.com`, `https://www.google-analytics.com` (+
`https://*.google-analytics.com` for regional collect), `https://www.clarity.ms` (+
`https://*.clarity.ms`).

---

## 2. Rollout: Report-Only first, then enforce

Ship **`Content-Security-Policy-Report-Only`** (§3, Report-Only variant) first. It does not block
anything — the browser only reports would-be violations. Watch reports across **every template**
(home, tracker, calculator, compare, shops, learn, market, heatmap, portfolio, glossary,
methodology, privacy, terms, dubai-gold-price, 404, offline) in both EN and AR, JS-on and JS-off.

**Promotion criteria — flip Report-Only → enforce only when ALL hold:**

1. **Zero** CSP violation reports attributable to first-party templates for **≥ 7 consecutive days**
   of normal traffic (covering at least one full weekly cycle + one gold-price-pipeline commit).
2. Every template exercised at least once under Report-Only (spot, FX, tracker wire, shops geocode,
   supabase auth, GA/Clarity load).
3. Remaining reports are only from browser extensions / injected third-party junk (never from our
   own origins or the enumerated allowlist).
4. `node scripts/node/csp-inventory.js` is green in CI (no un-enumerated inline hash).

To enforce, rename the header `Content-Security-Policy-Report-Only` → `Content-Security-Policy`
(keeping `report-uri`/`report-to` so you keep getting telemetry after enforcing).

---

## 3. Content-Security-Policy

Single-line value (used for both the Report-Only and enforce headers — only the header **name**
differs). `report-to gtl-csp` / `report-uri` point at whatever collector the owner wires up
(Cloudflare `/cdn-cgi/...`, report-uri.com, or a Worker) — a placeholder is shown; set it or drop
the directive.

```
default-src 'self';
script-src 'self' 'sha256-hwl6qY9HumTF1GNELc9W/mYDaRMlzIH+GSXNtBbn5rE=' 'sha256-9JILtKd7BOhx0sG/TzkCDOlycX6n/Rq9jj4dioFmsYo=' 'sha256-yHJxga03lGua6eHcJx7xFPtoShrPnlgp1FoVGEsPL3A=' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline';
font-src 'self';
img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com https://c.clarity.ms;
connect-src 'self' https://api.gold-api.com https://mintedmetal.com https://open.er-api.com https://freegoldapi.com https://api.gdeltproject.org https://nominatim.openstreetmap.org https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://www.clarity.ms https://*.clarity.ms;
frame-ancestors 'self';
frame-src 'self';
base-uri 'self';
form-action 'self';
object-src 'none';
worker-src 'self' blob:;
manifest-src 'self';
report-to gtl-csp;
```

Notes:

- **`script-src`** — `'self'` + the three inline hashes (§1a) +
  `googletagmanager`/`google-analytics` (GA loader + gtag) + `clarity.ms` (Microsoft Clarity tag).
  No `'unsafe-inline'`, no `'unsafe-eval'`. `cdn.jsdelivr.net` is required **only** by the admin
  pages (§6, supabase-js UMD bundle); if admin lives on its own hostname, drop `cdn.jsdelivr.net`
  from the public policy and put it in the admin-scoped rule instead.
- **`connect-src`** — the seven enumerated first-party fetch origins (§1b) + GA/Clarity collect. The
  supabase project is covered by the `*.supabase.co` wildcard.
- **`img-src`** — `'self'` + `data:` (small inline data-URI images) + GA/Clarity beacon pixels. No
  wildcard `https:` (the audit-era `img-src https:` is unnecessary — no external `<img>` exists).
- **`frame-ancestors 'self'`** — per phase spec. NB: `server.js` (admin/API tier) and the current
  `_headers` use the **stricter** `frame-ancestors 'none'` / `X-Frame-Options: DENY`. The public
  site frames nothing of its own, so the owner MAY tighten this to `'none'` for parity; `'self'` is
  the specified floor and is safe. Whichever is chosen, keep `X-Frame-Options` consistent
  (`SAMEORIGIN` pairs with `'self'`, `DENY` pairs with `'none'`).
- **`base-uri`/`form-action`/`object-src`** — locked to `'self'`/`'none'` to blunt base-tag and form
  hijacking and legacy plugin embeds.

### Report-Only header (ship this first)

```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'sha256-hwl6qY9HumTF1GNELc9W/mYDaRMlzIH+GSXNtBbn5rE=' 'sha256-9JILtKd7BOhx0sG/TzkCDOlycX6n/Rq9jj4dioFmsYo=' 'sha256-yHJxga03lGua6eHcJx7xFPtoShrPnlgp1FoVGEsPL3A=' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com https://c.clarity.ms; connect-src 'self' https://api.gold-api.com https://mintedmetal.com https://open.er-api.com https://freegoldapi.com https://api.gdeltproject.org https://nominatim.openstreetmap.org https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://www.clarity.ms https://*.clarity.ms; frame-ancestors 'self'; frame-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; worker-src 'self' blob:; manifest-src 'self'; report-to gtl-csp
```

---

## 4. `style-src 'unsafe-inline'` — justification

`style-src` keeps `'unsafe-inline'` rather than hashing. Rationale:

- The build emits inline `<style>` blocks (404 + offline standalone pages) **and** `style=`
  attributes on several elements; hashing every attribute is infeasible and would break on any
  visual tweak.
- Inline **styles** cannot execute JavaScript or exfiltrate data; the CSP threat model for styles is
  narrow (mainly UI-redressing), and `frame-ancestors` + `base-uri` already cover the higher-value
  vectors.
- This matches `server.js`, which already ships `style-src 'self' 'unsafe-inline'` in production.

A future hardening (nonce-based styles) is possible but out of scope; it needs per-request nonces,
which a static GH Pages tier cannot mint.

---

## 5. Other headers (full Cloudflare set)

Apply alongside CSP:

| Header                         | Value                                                                                                                               | Note                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `Strict-Transport-Security`    | `max-age=31536000; includeSubDomains`                                                                                               | Add `; preload` **only** as an explicit owner opt-in (§5a).          |
| `Permissions-Policy`           | `accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()` | Minimal-deny; matches `server.js` + `_headers`.                      |
| `X-Content-Type-Options`       | `nosniff`                                                                                                                           |                                                                      |
| `X-Frame-Options`              | `SAMEORIGIN` (pairs with `frame-ancestors 'self'`; use `DENY` if you pick `'none'`)                                                 |                                                                      |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`                                                                                                   |                                                                      |
| `Cross-Origin-Opener-Policy`   | `same-origin`                                                                                                                       |                                                                      |
| `Cross-Origin-Resource-Policy` | `same-origin`                                                                                                                       | Loosen to `cross-origin` only if another origin must hotlink assets. |

### 5a. HSTS preload — explicit owner opt-in

`preload` is a **one-way, hard-to-reverse** commitment (submits the apex + all subdomains to the
browser preload list). Ship `max-age=31536000; includeSubDomains` first; add `; preload` and submit
to hstspreload.org **only** after confirming every subdomain (including any staging/admin host) is
HTTPS-only and will stay that way. This is an owner decision, not an automatic default.

### 5b. Remove deprecated headers

Cloudflare currently (or GH Pages / an old rule) emits headers that lower the grade and signal
staleness. **Remove** them in the Transform Rule (set to empty / remove action):

- **`X-XSS-Protection`** — deprecated; modern browsers ignore it and it has known bypass/XS-leak
  footguns. CSP replaces it. Remove entirely (do **not** set `0` via a lingering rule; just delete).
- **`Expect-CT`** — obsolete (Certificate Transparency is now always-on in browsers). Remove.

---

## 6. Admin (`/admin/*`) scope

Admin pages differ from the public site:

- They load the **supabase-js UMD bundle from `https://cdn.jsdelivr.net`** (a real third-party
  `<script src>` — unlike the public pages). So `script-src` for admin **must** include
  `https://cdn.jsdelivr.net`, and `connect-src` must include `https://*.supabase.co` (already in the
  shared policy).
- Admin must stay **non-indexable**: `X-Robots-Tag: noindex, nofollow` and
  `Cache-Control: private, no-store` (already in `_headers`).

**Recommendation:** give `/admin/*` its own Cloudflare rule. If admin moves to a separate hostname,
keep `cdn.jsdelivr.net` out of the **public** `script-src` and scope it to the admin host only.
Until then, the shared policy above already covers admin because it includes `cdn.jsdelivr.net`.

---

## 7. `Access-Control-Allow-Origin: *` on HTML — honesty note

The live `ACAO: *` on HTML documents is set by **GitHub Pages**, which serves a permissive CORS
header on every response and gives site owners no knob to change it. It is largely harmless for
public, non-credentialed HTML (it lets other origins `fetch()` the already-public markup; it does
not expose anything private and does not apply to the credentialed admin/API tier on `server.js`),
but it costs grade points and looks sloppy.

- **It can only be changed at the Cloudflare layer** (a Transform Rule that removes or scopes
  `Access-Control-Allow-Origin` on document responses), **not** in this repo. There is no GH Pages
  setting for it.
- Recommended Cloudflare action: **remove** `Access-Control-Allow-Origin` from `text/html` document
  responses (the site does not need cross-origin reads of its own HTML). Leave asset CORS alone if
  anything legitimately hotlinks `/assets/*` (nothing currently does).

---

## 8. Application checklist (owner, at Cloudflare — Q5)

1. Create a Cloudflare **Transform Rule → Modify Response Header** (or the Worker in §9) that, for
   all responses on the zone:
   - sets `Content-Security-Policy-Report-Only` (§3 Report-Only) — **not** enforce yet;
   - sets HSTS/Permissions-Policy/XCTO/XFO/Referrer/COOP/CORP (§5);
   - **removes** `X-XSS-Protection` and `Expect-CT` (§5b);
   - **removes/scopes** `Access-Control-Allow-Origin` on HTML (§7).
2. Add an `/admin/*` rule (§6): `X-Robots-Tag`, `Cache-Control: private, no-store`.
3. Watch CSP reports; meet the §2 promotion criteria.
4. Flip Report-Only → enforce (rename the header).
5. (Optional, later) Add `; preload` to HSTS and submit (§5a).
6. Re-scan on securityheaders.com; target **A**.

---

## 9. Cloudflare Worker snippet (alternative to Transform Rules)

Equivalent to §3–§7 as a Worker. Use this if you prefer code over the rules UI (e.g. to compute
`report-to` or scope by path more expressively).

```js
// Cloudflare Worker — GoldTickerLive security headers (phase 12).
// Deploy on a route covering the zone. Report-Only first; see §2 to promote.
const CSP =
  "default-src 'self'; " +
  "script-src 'self' " +
  "'sha256-hwl6qY9HumTF1GNELc9W/mYDaRMlzIH+GSXNtBbn5rE=' " +
  "'sha256-9JILtKd7BOhx0sG/TzkCDOlycX6n/Rq9jj4dioFmsYo=' " +
  "'sha256-yHJxga03lGua6eHcJx7xFPtoShrPnlgp1FoVGEsPL3A=' " +
  'https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://cdn.jsdelivr.net; ' +
  "style-src 'self' 'unsafe-inline'; " +
  "font-src 'self'; " +
  "img-src 'self' data: https://www.google-analytics.com https://www.googletagmanager.com https://c.clarity.ms; " +
  "connect-src 'self' https://api.gold-api.com https://mintedmetal.com https://open.er-api.com " +
  'https://freegoldapi.com https://api.gdeltproject.org https://nominatim.openstreetmap.org ' +
  'https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com ' +
  'https://*.google-analytics.com https://www.clarity.ms https://*.clarity.ms; ' +
  "frame-ancestors 'self'; frame-src 'self'; base-uri 'self'; form-action 'self'; " +
  "object-src 'none'; worker-src 'self' blob:; manifest-src 'self'; report-to gtl-csp";

export default {
  async fetch(request, env, ctx) {
    const response = await fetch(request);
    const h = new Headers(response.headers);

    // Roll out Report-Only first; switch the header name to enforce (see §2).
    h.set('Content-Security-Policy-Report-Only', CSP);
    // h.set('Content-Security-Policy', CSP); // <- flip to this after promotion criteria are met

    h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); // add '; preload' as owner opt-in (§5a)
    h.set(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()'
    );
    h.set('X-Content-Type-Options', 'nosniff');
    h.set('X-Frame-Options', 'SAMEORIGIN'); // DENY if frame-ancestors 'none'
    h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    h.set('Cross-Origin-Opener-Policy', 'same-origin');
    h.set('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove deprecated / grade-lowering headers (§5b, §7).
    h.delete('X-XSS-Protection');
    h.delete('Expect-CT');
    const isHtml = (h.get('content-type') || '').includes('text/html');
    if (isHtml) h.delete('Access-Control-Allow-Origin');

    // Admin: keep non-indexable + uncached (§6).
    if (new URL(request.url).pathname.startsWith('/admin/')) {
      h.set('X-Robots-Tag', 'noindex, nofollow');
      h.set('Cache-Control', 'private, no-store');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: h,
    });
  },
};
```

---

## 10. Repo-side artifacts (this phase)

- `scripts/node/csp-inventory.js` — scans the built site, emits `reports/csp-inventory.json`, and
  **fails on drift** (un-enumerated inline hash or a split theme-preinit).
- `tests/midas-csp-inventory.test.js` — unit-tests the parser/hasher on fixtures + a drift-lock test
  asserting every `src/` fetch origin is in this doc's `connect-src`.
- `_headers` — mirrors this recommended set (with a loud comment that GitHub Pages ignores it). It
  is the source of truth for a future platform move to Netlify / Cloudflare Pages, **not** the live
  header source. `_redirects` is untouched.
