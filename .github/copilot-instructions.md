# Copilot instructions — Gold Ticker Live

Gold Ticker Live (`goldtickerlive.com`) is a **bilingual (EN/AR) gold-price website** for reference pricing, retail context, calculators, and SEO content.
The homepage shows a live spot-linked XAU/USD card plus UAE/GCC/Arab-market karat reference pricing with visible freshness state and trust disclaimers.

## Stack & commands
- Stack: static-first multi-page site on **Vite + vanilla JS**, optional **Node/Express admin** with **Supabase-backed** data/services, deployed to **GitHub Pages** on `goldtickerlive.com`.
- Build: `npm run build` · Dev: `npm run dev` · Preview: `npm run preview` · Tests: `npm test`.
- Quality/validation: `npm run lint`, `npm run validate`.
- Detect real commands from `package.json`; never guess. Run build + tests (and matching quality checks) before claiming changes work.

## How to work here (always)
- **Read before editing.** Inspect files first. Make the smallest correct change.
- **Preserve working behavior.** Live pricing, fetch/transform pipeline, deploy, GitHub Actions, X bot, and Supabase flows must keep working.
- **Plan first on multi-step work, then wait for approval.** Work on a branch, use logical commits, never force-push `main`.
- **Verify, don’t claim.** Label outcomes as **VERIFIED** vs **UNVERIFIED**. Capture screenshots for UI changes.
- **No invented data.** Never fabricate prices, sources, stats, or production copy. Use `TODO(content)` and flag gaps.

## Trust rules (load-bearing)
- Keep **spot/reference** and **retail/jewelry-shop** prices visually + semantically distinct.
- **Freshness is first-class:** every price surface must show visible timestamp + state (live/stale/delayed/etc.).
- **Label non-live values:** estimated, derived, delayed, fallback, cached. Never present cached as live.
- Keep methodology + disclaimers reachable from every price surface.
- **Immutable constants:** AED/USD peg = `3.6725`; 1 troy ounce = `31.1035 g`.

## SEO rules
- Never change a URL/slug without 301 redirect + canonical update + internal link update.
- Preserve title, meta description, canonical, OG/Twitter, hreflang (EN/AR), and JSON-LD/schema on each page.
- Keep internal linking intact. Keep key content statically crawlable (don’t hide price content behind client-only render).
- Avoid Core Web Vitals regressions (LCP/CLS/INP).

## Bilingual / RTL rules
- Arabic is full RTL: mirror layout, not just strings.
- Ensure correct `dir`/`lang`.
- Prefer CSS logical properties (`margin-inline`, `inset-inline`, `text-align: start`) so LTR/RTL stay aligned.
- Keep Arabic quality natural and semantically equal to English.

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
