# Phase 38 — favicon & PWA icon fix

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 38 — favicon & PWA icon fix
- **Maps to:** P2-1 (favicon.svg 404).
- **Branch:** `phase38-favicon` · **PR:** Add favicon + manifest icons
```
/assets/favicon.svg returns 404. Add a proper favicon set (SVG + ICO + apple-touch + maskable PNGs) and wire them in <head> and the web manifest. Verify no 404s in network. Open PR phase38-favicon. Static stack only.
```
- **Accept:** No favicon 404; tab/PWA icons present.
