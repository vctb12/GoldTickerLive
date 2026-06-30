# Phase 08 — Localized titles & meta per locale

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 8 — Localized titles & meta per locale
- **Maps to:** P0-1 (English title in AR mode).
- **Branch:** `phase08-localized-meta` · **PR:** Per-locale `<title>`/description/OG
```
For every AR page from Phase 7, emit Arabic <title>, meta description, og:title/description/locale (ar_AE), and twitter card. EN pages keep English equivalents with og:locale en_AE plus og:locale:alternate ar_AE. Centralize the per-page, per-locale metadata in one data source so titles/descriptions are authored once. Read how meta is emitted before editing. Open PR phase08-localized-meta. Static stack; no behavior change beyond meta.
```
- **Accept:** `document.title` is Arabic on AR pages; OG locale correct both sides.
