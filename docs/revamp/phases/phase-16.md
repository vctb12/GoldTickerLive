# Phase 16 — Chart price reconciliation

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 16 — Chart price reconciliation
- **Maps to:** P1-2 (TradingView ~5059 vs spot ~4022).
- **Branch:** `phase16-chart-source` · **PR:** Reconcile/label homepage chart
```
The homepage chart (TradingView) shows a "last" price that differs from the site's spot value, creating two conflicting current prices. Read how the chart is embedded. Implement the cleanest option that keeps the static stack: prefer feeding the chart from the same gold-api series used sitewide; if not feasible, clearly label the chart as an independent third-party feed, visually separate it from the official spot value, and add a freshness/source caption using the sitewide vocabulary. The headline spot must remain the single source of truth. Open PR phase16-chart-source. Static stack only.
```
- **Accept:** No two unlabeled conflicting "current" prices; chart has source/freshness caption.
