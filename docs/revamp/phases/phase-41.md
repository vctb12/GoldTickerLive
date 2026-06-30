# Phase 41 — Caching, headers & service worker

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 41 — Caching, headers & service worker
- **Branch:** `phase41-caching` · **PR:** Cache headers + offline SW review
```
Review Express/static hosting headers: long cache for hashed assets, short/validated cache for HTML, correct content-types. Review the existing service worker/offline behavior so cached prices are served labeled and the SW never serves stale HTML indefinitely. Add a cache-busting/version strategy. Open PR phase41-caching. Static stack only; never serve stale data as live.
```
- **Accept:** Correct cache headers; SW serves labeled offline data; HTML updates on deploy.
