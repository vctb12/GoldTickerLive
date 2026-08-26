# OSS Tooling Foundation — 2026-08-17

## Goal

Add high-value open-source tooling around GoldTickerLive without changing production pricing
semantics, the static multi-page architecture, or production-critical writers.

## Guardrails

- Read and obey `AGENTS.md` and `PLAN.md` before work.
- No direct commits to `main`; PR-only.
- Do not edit `gold-price-fetch.yml`, `post_gold.yml`, `sw.js`, AED/USD peg, troy-ounce constant,
  karat factors, price formulas, provider priority, or production writer behavior in this wave.
- No new runtime dependency without an explicit advisory review and owner approval.
- Prefer MCP, project skills, external services, and test tooling over vendoring third-party
  repositories.
- Keep services fail-closed and secrets out of git.

## Mac operating constraint

Primary workstation is an Apple-silicon Mac with limited unified memory. The development path must
keep GoldTickerLive lightweight and run heavier Docker services on demand, not all at once. Local
large-language-model hosting is not required for this program.

## Wave 1 — Codex + browser QA

1. Verify baseline: `npm run lint && npm test && npm run validate && npm run build`.
2. Add/verify Playwright MCP for Codex externally; do not add it as a GoldTicker runtime dependency.
3. Create project-scoped Codex skills for:
   - browser/flow QA;
   - EN/AR semantic parity;
   - freshness/reference-vs-retail integrity;
   - SEO implementation review.
4. Run a read-only exploratory browser audit against local development and production.
5. Convert confirmed findings into small, bounded PR tasks.

## Wave 2 — content/research quality

Evaluate project-scoped use of:

- `petergyang/no-ai-slop` for editorial quality;
- selected `affaan-m/ECC` reviewer/research patterns only;
- `virgiliojr94/book-to-skill` for turning GoldTicker documentation into reusable Codex skills.

Do not replace the repository root `AGENTS.md`.

## Wave 3 — external intelligence

Evaluate as sidecars/services, not vendored code:

- OpenSEO for keyword/rank/backlink/competitor intelligence;
- Firecrawl for structured research ingestion;
- changedetection.io for competitor/regulatory/market-page monitoring.

External intelligence must never become an authoritative live gold-price source.

## Wave 4 — defensive security

Layer existing security controls with:

1. existing validation + CodeQL;
2. OWASP ZAP against local/staging surfaces;
3. Strix for controlled AI-assisted security assessment.

Initial security mode is scan/report/review. No autonomous production patching or deployment.

## Wave 5 — automation

Use n8n only for genuinely new workflows. Do not duplicate current GitHub Actions writers,
gold-price fetch, X posting, CI, deploy, sitemap, or uptime workflows.

## Success criteria

- Existing verification gate remains green.
- No production-critical pricing/writer behavior changed.
- Codex can inspect real browser flows through Playwright.
- At least one project-specific skill is proven useful.
- External tools are documented as sidecars with clear ownership and no duplicate writer paths.
- Findings are converted into bounded PRs instead of accumulating another giant roadmap.
