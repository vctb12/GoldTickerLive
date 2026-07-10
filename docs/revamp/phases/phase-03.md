# Phase 03 — Design tokens single source of truth

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 3 — Design tokens single source of truth

- **Maps to:** P1-4 contrast, P2-5 vocabulary, brand consistency.
- **Branch:** `phase03-design-tokens` · **PR:** Centralize color/spacing/type tokens

```
Read the CSS (critical.css, global.css, index.css) and any inline styles. Extract the de-facto design system into a single tokens layer (CSS custom properties): color (light + dark themes), spacing scale, type scale, radii, shadows, z-index, and freshness-state colors. Replace hardcoded hex/spacing in the shared shell (nav/footer/ticker/spot bar) with tokens. DO NOT change visual output yet — this is a refactor; screenshots before/after must match. Document tokens in docs/DESIGN-TOKENS.md. Open PR phase03-design-tokens. Static stack only; no visual regressions.
```

- **Accept:** Pixel-equivalent before/after; all shell colors reference tokens.
