# Phase 34 — Screen-reader pass for live prices

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 34 — Screen-reader pass for live prices

- **Branch:** `phase34-sr-live` · **PR:** aria-live for price/freshness updates

```
Make auto-updating prices and freshness changes announce sensibly to screen readers using polite aria-live regions (avoid spamming on every ~1s tick — throttle/announce meaningful changes). Ensure the ticker is labeled and not a focus trap. Test with VoiceOver/NVDA notes. Open PR phase34-sr-live. Static stack only.
```

- **Accept:** Meaningful, non-spammy SR announcements; ticker labeled.
