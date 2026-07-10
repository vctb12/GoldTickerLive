# Phase 29 — Theme toggle correctness (light/dark/system)

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 29 — Theme toggle correctness (light/dark/system)

- **Branch:** `phase29-theme-toggle` · **PR:** Robust theme switching

```
Audit the theme toggle: ensure it respects system preference on first load, persists choice, applies before first paint (no flash), and that BOTH themes meet the contrast targets from Phase 30. Verify the toggle icon state matches actual theme. Read the theme module. Open PR phase29-theme-toggle. Static stack only.
```

- **Accept:** No theme flash; persisted; icon matches state.
