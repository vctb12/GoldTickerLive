# Phase 26 — Bidi isolation for mixed EN/AR strings

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 26 — Bidi isolation for mixed EN/AR strings
- **Maps to:** P2-8 (`AED 435.37 د.إ per gram` glitch).
- **Branch:** `phase26-bidi` · **PR:** Wrap currency/number tokens in bidi isolates
```
Fix mixed-direction rendering where currency glyphs/numbers are embedded in opposite-direction sentences (e.g. helper text "AED 435.37 د.إ per gram"). Wrap currency/amount tokens in <bdi> / unicode isolates and verify ordering in EN and AR across ticker, cards, calculator helper, exports. Read the formatting/number helper module first. Add a couple of tests. Open PR phase26-bidi. Static stack only.
```
- **Accept:** Currency+number tokens order correctly in both directions.
