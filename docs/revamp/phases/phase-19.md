# Phase 19 — Spot-vs-retail trust chip (sitewide)

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 19 — Spot-vs-retail trust chip (sitewide)
- **Maps to:** strengthens core trust promise (audit §5 idea).
- **Branch:** `phase19-trust-chip` · **PR:** Persistent freshness+source chip linking methodology
```
Add a small, consistent "reference price · source · freshness" chip to every price card (homepage spot, calculator result, country cards) that deep-links to the relevant methodology anchor (spot -> #live-formula, AED -> #aed-peg). Reuse FreshnessBadge from Phase 17. Keep it lightweight and accessible. Localize. Open PR phase19-trust-chip. Static stack only.
```
- **Accept:** Every price card shows source+freshness and links to methodology; works EN/AR.
