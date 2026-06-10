# Copilot instructions — Gold Ticker Live

> Read `AGENTS.md` first. For path-specific details, follow `.github/instructions/seo.instructions.md`, `.github/instructions/gold-pricing.instructions.md`, and `.github/instructions/security.instructions.md`.

Gold Ticker Live (`goldtickerlive.com`) is a **bilingual (EN/AR) gold-price website** for reference pricing, retail-quote context, calculators, and SEO content.
The homepage shows spot-linked XAU/USD reference pricing and UAE/GCC/Arab-market karat reference pricing with visible freshness state and trust disclaimers.

## Stack & commands
- Stack: static-first multi-page site on **Vite + vanilla JS**, optional **Node/Express admin** with **Supabase-backed** data/services, deployed to **GitHub Pages** on `goldtickerlive.com`.
- Build: `npm run build` · Dev: `npm run dev` · Preview: `npm run preview` · Tests: `npm test`.
- Quality/validation: `npm run lint`, `npm run validate`.
- Detect real commands from `package.json`; never guess. Before `npm test` or `npm run validate`, delete `playwright-report/` and `test-results/` to avoid false positives from scanned HTML reports.

## How to work here (always)
- **Read before editing.** Inspect files first. Make the smallest correct change.
- **Preserve working behavior.** Live pricing, fetch/transform pipeline, deploy, GitHub Actions, X bot, and Supabase flows must keep working.
- **Plan first on multi-step work, then wait for approval.** Work on a branch, use logical commits, never force-push `main`.
- **Verify, don’t claim.** Label outcomes as **VERIFIED** vs **UNVERIFIED**. Capture screenshots for UI changes.
- **No invented data.** Never fabricate prices, sources, stats, or production copy. Use `TODO(content)` and flag gaps.

## Trust rules (load-bearing)
- Keep **spot/reference** and **retail/jewelry-shop** prices visually + semantically distinct.
- **Freshness is first-class:** every price surface must show visible timestamp + state.
- **Required freshness labels:** `live` (fresh source, near-real-time ~60s), `updated` (periodic refresh timestamp, not continuous and not a substitute for `live`), `cached` (stored value), `delayed` (provider lag), `stale` (older than threshold), `estimated` (derived), `fallback` (last known), `closed` (market closed), `unavailable` (no usable value). Never present non-live values as live.
- Keep methodology + disclaimers reachable from every price surface.
- **Local currency:** `price_per_gram_LOCAL = price_per_gram_USD × current_FX(USD→cur)` — never USD → AED → local. Timestamp FX; label fallback when stale.
- **Canonical formula:** `price_per_gram_AED = (XAU/USD ÷ 31.1034768) × 3.6725 × karat_purity_factor`.
- **Karat factors:** 24K=1.000, 22K=0.9167, 21K=0.875, 18K=0.750, 14K=0.5833, 9K=0.375.
- **Immutable constants:** AED/USD peg = `3.6725`; 1 troy ounce = `31.1034768 g`.
- Public repository safety: never commit secrets, keys, tokens, or secret-like placeholders in code/docs/log examples.

## SEO rules
- Canonical host is `https://goldtickerlive.com/`; legacy `/Gold-Prices/*` must 301 or canonicalize to custom-domain URLs.
- Sitemap is generated (`scripts/node/generate-sitemap.js`) — never hand-edit `sitemap.xml`.
- `noindex` changes must be reflected in `scripts/node/seo-governance.js` in the same PR.
- Never change a URL/slug without 301 redirect + canonical update + internal link update.
- Preserve title, meta description, canonical, OG/Twitter, hreflang (EN/AR), and JSON-LD/schema on each page.
- Keep internal linking intact. Keep key content statically crawlable (don’t hide price content behind client-only render).
- Avoid Core Web Vitals regressions (LCP/CLS/INP).

## Bilingual / RTL rules
- All user-visible strings live in `src/config/translations.js` — never hard-code UI text.
- Arabic is full RTL: mirror layout, not just strings.
- Ensure correct `dir`/`lang`.
- Prefer CSS logical properties (`margin-inline`, `inset-inline`, `text-align: start`) so LTR/RTL stay aligned.
- EN/AR semantic parity: natural GCC/Arab phrasing; one language must not make stronger promises than the other.
- Test RTL layouts at 360px minimum.

## Design & motion rules
- Style target: premium financial-data product; restrained gold accents; no generic flashy SaaS look.
- Use design tokens (CSS custom properties) for color/type/spacing/motion; support light + dark themes.
- Use tabular numerals for price/table UI (`font-variant-numeric: tabular-nums`).
- Movement up/down cues must be colorblind-safe (pair color with signs/icons/shapes).
- Animate only `transform`/`opacity`. Use `IntersectionObserver` for reveal patterns.
- Load animation libraries conditionally, only where needed.
- Respect `prefers-reduced-motion`; never block/delay showing prices for animation.
- Meet WCAG 2.2 AA: semantic landmarks, visible focus, keyboard support, accurate ARIA, sufficient contrast, truthful alt text.

## Architecture constraints
- Keep static-first architecture.
- Do not migrate framework/bundler/hosting without explicit approval.
- Keep existing build/deploy/GitHub Actions pipeline intact.
- Do not modify backend/data/automation except minimal presentation wiring needed to surface existing data safely.
