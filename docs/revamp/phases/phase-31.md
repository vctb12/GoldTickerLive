# Phase 31 — Light-mode contrast fix

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 31 — Light-mode contrast fix

- **Maps to:** P1-4 (muted `rgb(160,152,144)` ≈ 2.7:1 on cream).
- **Branch:** `phase31-contrast` · **PR:** WCAG AA text contrast (light theme)

```
Using the Phase 3 tokens, darken muted/secondary text so it meets ≥4.5:1 on the cream light background (current ~2.7:1) and fix small gold/amber label text on cream (~2.8:1). Re-verify dark mode separately. Run axe + a contrast checker on homepage, calculator, methodology, a country page in EN/AR. Open PR phase31-contrast with computed ratios before/after. Use the `a11y-audit` skill conventions. Static stack only.
```

- **Accept:** All body/secondary text ≥4.5:1, large text ≥3:1, both themes.
