# Phase 50 — Launch, monitoring & docs

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 50 — Launch, monitoring & docs

- **Branch:** `phase50-launch` · **PR:** Sitemap submit, monitoring, runbook

```
Finalize: confirm sitemaps/robots, prepare Search Console submission notes (EN+AR), add basic uptime/freshness monitoring (alert if all price sources fail or data is "Unavailable" beyond a threshold), and write docs/RUNBOOK.md (data pipeline, freshness logic, deploy, rollback) and docs/CONTRIBUTING.md (the static-stack guardrails). Update README with the new architecture overview. Open PR phase50-launch. Static stack only; no behavior change beyond monitoring.
```

- **Accept:** Monitoring live; docs complete; submission checklist ready.

---

## Dependency / sequencing notes

- **Run 00 → 1–5 first** (map + safety + tokens) — everything else leans on tokens (Phase 3) and
  tests (Phase 1).
- **Wave 1 (6–14)** is the highest-ROI block (Arabic indexability + canonical/hreflang). Phase 7
  blocks 8, 9, 10, 13, 14.
- **Wave 2 (15–22)** depends on Phase 3 tokens + Phase 1 tests; Phase 17 blocks 19, 22.
- **Phase 31 (contrast)** should land before/with Phases 44–46 (visual) so art is built against
  final tokens.
- **Phase 4 budgets** start report-only and become blocking in Phase 49.

## Skills / connectors to lean on per wave

- SEO waves: `seo-audit`, `schema`, `programmatic-seo`, `ai-seo` skill conventions.
- A11y waves: `a11y-audit` / `accesslint-scan`.
- Assets: **Higgsfield** (`generate_image`) for OG/hero; `image` skill for optimization/export
  (WebP/AVIF, OG sizing).
- Testing: `webapp-testing` (Playwright) for the regression gate (Phase 49).
- Each phase prompt already instructs Claude Code to read first, branch, implement minimally,
  self-verify, and open one PR.

```

```
