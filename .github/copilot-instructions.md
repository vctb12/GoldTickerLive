# Copilot instructions — Gold Ticker Live

> Read `AGENTS.md` first. For pricing work, also follow `.github/instructions/gold-pricing.instructions.md`; for metadata/canonical/sitemap work, follow `.github/instructions/seo.instructions.md`.

Gold Ticker Live (`goldtickerlive.com`) is a **bilingual (EN/AR) gold-price website** for reference pricing, retail-quote context (shops/making charges), calculators, and SEO content.
The homepage shows spot-linked XAU/USD reference pricing and UAE/GCC karat tables with visible freshness state and trust disclaimers.

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
- **No secrets in git.** Never commit or echo real or real-looking keys, tokens, passwords, or PINs; follow `.github/instructions/security.instructions.md`.
- **No invented data.** Never fabricate prices, sources, stats, or production copy. Use `TODO(content)` and flag gaps.

## Trust rules (load-bearing)
- Keep **spot/reference** and **retail/jewelry-shop** prices visually + semantically distinct.
- **Freshness is first-class:** every price surface must show a visible timestamp + state: `live`, `delayed`, `cached`, `stale`, `estimated`, `fallback`, `closed`, `unavailable`.
- **Required freshness labels:** `live` = fresh near-real-time source (~60s only when truly live); `updated` = periodic refresh/timestamp wording, not a substitute for `live`; `delayed` = provider lag; `cached` = stored value; `stale` = too old; `estimated` = derived reference; `fallback` = last known value; `closed` = market closed; `unavailable` = no valid data. Never present non-live values as live.
- Keep methodology + disclaimers reachable from every price surface.
- **Canonical formula:** `price_per_gram_AED = (XAU/USD ÷ 31.1034768) × 3.6725 × karat_purity_factor`.
- **Local currency:** `price_per_gram_LOCAL = price_per_gram_USD × current_FX(USD→cur)` — never USD → AED → local. Timestamp FX; label fallback when stale.
- **Karat factors:** 24K=1.000, 22K=0.9167, 21K=0.875, 18K=0.750, 14K=0.5833, 9K=0.375.
- **Immutable constants:** AED/USD peg = `3.6725`; 1 troy ounce = `31.1034768 g`.

## SEO rules
- Canonical host is `https://goldtickerlive.com/`; legacy GitHub Pages URLs under `/Gold-Prices/` must redirect and must not become duplicate content.
- Never change a URL/slug without 301 redirect + canonical update + internal link update.
- Preserve title, meta description, canonical, OG/Twitter, hreflang (EN/AR), and JSON-LD/schema on each page.
- `sitemap.xml` is generated; never hand-edit it. Keep `scripts/node/generate-sitemap.js` and `scripts/node/seo-governance.js` aligned with any SEO policy change.
- Keep internal linking intact. Important pages need unique H1s and real local context; country/city pages must not be thin clones.
- Schema must match visible content. Keep key content statically crawlable; don’t hide price content behind client-only rendering.
- Avoid Core Web Vitals regressions (LCP/CLS/INP).

## Bilingual / RTL rules
- Arabic is full RTL: mirror layout, not just strings. Ensure correct `dir`/`lang`.
- All user-visible strings live in `src/config/translations.js` — never hard-code UI text in HTML/JS.
- EN and AR must match in meaning: natural GCC/Arab commercial phrasing, not English-shaped Arabic. One language must not promise more than the other.
- Prefer CSS logical properties (`margin-inline`, `inset-inline`, `text-align: start`) so LTR/RTL stay aligned.
- Test RTL at 360px minimum.

## Design & motion rules
- Style target: premium financial-data product; restrained gold accents; no generic flashy SaaS look.
- Use design tokens (CSS custom properties) for color/type/spacing/motion; support light + dark themes.
- Use tabular numerals for price/table UI (`font-variant-numeric: tabular-nums`).
- Movement up/down cues must be colorblind-safe (pair color with signs/icons/shapes).
- Animate only `transform`/`opacity`; use `IntersectionObserver` for reveal patterns and respect `prefers-reduced-motion`.
- Meet WCAG 2.2 AA: semantic landmarks, visible focus, keyboard support, accurate ARIA, sufficient contrast, truthful alt text.

## Architecture constraints
- Keep static-first architecture.
- Do not migrate framework/bundler/hosting without explicit approval.
- Keep existing build/deploy/GitHub Actions pipeline intact.
- Do not modify backend/data/automation except minimal presentation wiring needed to surface existing data safely.
