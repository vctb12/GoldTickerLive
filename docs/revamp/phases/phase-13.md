# Phase 13 — AR content parity sweep

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 13 — AR content parity sweep

- **Maps to:** P0-1 parity, P2-6 numerals.
- **Branch:** `phase13-ar-parity` · **PR:** Fill AR translation gaps

```
Compare EN vs AR strings across all surfaces; list any untranslated/missing AR copy (headings, buttons, freshness labels, disclaimers, methodology). Fill gaps with proper Arabic (do not leave English fallback visible in AR mode). Decide and document one numeral convention per locale (recommend Arabic-Indic for AR, Latin for EN) and apply consistently. Read the i18n source. Open PR phase13-ar-parity with a parity checklist. Static stack only.
```

- **Accept:** No English leakage in AR; numerals consistent per locale.
