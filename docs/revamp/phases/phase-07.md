# Phase 07 — Distinct Arabic URLs (static pre-render)

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 7 — Distinct Arabic URLs (static pre-render)
- **Maps to:** P0-1 (Arabic not indexable).
- **Branch:** `phase07-ar-routes` · **PR:** Generate static `/ar/...` pages
```
Today the Arabic experience is a client-side toggle with no separate URL (title/meta stay English). Without leaving the static Vite build, generate a distinct Arabic URL for every page at build time under /ar/ (e.g. /ar/, /ar/calculator, /ar/methodology, /ar/<country>). Each AR page must render server-side HTML with <html lang="ar" dir="rtl">, fully translated visible content reusing the existing AR string set, and the same data/freshness logic. Keep the in-page language toggle but make it NAVIGATE between the EN and AR URLs (not just swap client state). Read the i18n/string modules and the generation pipeline first. Open PR phase07-ar-routes. Do not regress EN pages; static stack only.
```
- **Accept:** `/ar/calculator` loads server-rendered Arabic with `lang=ar dir=rtl`; toggle navigates between EN/AR URLs.
