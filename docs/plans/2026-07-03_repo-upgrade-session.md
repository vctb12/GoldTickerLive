# 2026-07-03 — Repo-upgrade session (docs, integration map, helper layer, test hardening)

```yaml plan-status
status: shipped
priority: P2
class: repo-hygiene
owner: @vctb12
created: "2026-07-03"
last_updated: "2026-07-03"
branch: claude/goldticketlive-repo-upgrade-asqsfw
```

## Goal

Owner asked for a deep, additive repo upgrade: resources, integrations documentation, agent
readiness, and practical helpers — **without removing or weakening anything**. The repo already has
an extensive docs/agents/skills system, so this session filled only verified gaps instead of
recreating pointer stubs (which the 2026-04 agent refresh deliberately consolidated away).

## Gap analysis (what was checked before writing anything)

- Full docs tree, `.github/` prompts/skills/instructions, `.cursor/` rules, `.claude/` workflows —
  the requested README / ARCHITECTURE / DESIGN / SEO / AGENT docs already exist; not duplicated.
- `docs/environment-variables.md` had drifted badly from `.env.example` (~35 real vars undocumented;
  three client-side constants mislabeled as env vars).
- No root `SECURITY.md` (GitHub-convention policy); `docs/SECURITY.md` is a secret-scanning runbook,
  not a disclosure policy.
- MCP/connector guidance scattered across three files; no single integrations map.
- `src/lib` audit: no central site-identity config (origin/name/description duplicated in
  `src/seo/canonical.js` and `scripts/node/inject-schema.js`); no global error handler
  (`EVENTS.ERROR` existed in the analytics catalog but nothing emitted it); no locale-aware generic
  number/currency/relative-time formatters; runtime SEO modules
  (`canonical.js`/`hreflang.js`/`faq-schema.js`) had zero direct unit tests.
- Plan reconciliation: PROGRESS.md "69-city CSS path" latent bug and PLAN.md "3 pre-existing test
  failures" notes were stale — both re-verified as resolved in the current tree.

## Shipped

### Code (additive; no behavior removed)

- `src/config/site.js` — frozen `SITE` identity (name, url, description, logoPath, twitterHandle,
  sameAs, languages); re-exported from `src/config/index.js`; `src/seo/canonical.js` now derives
  `CANONICAL_BASE` from it (same value, single source).
- `src/lib/error-reporter.js` — `installErrorReporter()` listens for window `error` +
  `unhandledrejection` and forwards `{ type, where }` to the governed analytics `error` event.
  PII-safe (no messages/stacks; pathname:line bucket only), deduped, capped at 5/page, idempotent.
  Wired in `src/components/site-shell.js` (`mountSharedShell`).
- `src/lib/formatter.js` — added `formatNumber`, `formatCurrency` (Intl, falls back to the symbol
  map on invalid codes), `formatCompactNumber`, `formatRelativeTime` (EN/AR via
  `Intl.RelativeTimeFormat`). Existing exports untouched.

### Tests (new: 4 files)

- `tests/site-config.test.js` — SITE shape + **drift guard**: fails if `inject-schema.js` literals
  (URL/name/description/logo path) diverge from `src/config/site.js`, or if `SITE.logoPath` stops
  pointing at a committed asset.
- `tests/seo-runtime-helpers.test.js` — first direct unit tests for `normalizePathname`,
  `buildCanonicalUrl`, `enforceCanonicalOnDocument`, `buildHreflangAlternates`,
  `enforceHreflangAlternates`, `buildMethodologyFaqSchema`, `injectFaqSchema` (minimal DOM stub, no
  jsdom), including a reference-vs-retail trust-copy assertion in both languages.
- `tests/error-reporter.test.js` — install/idempotency, uncaught + rejection forwarding, resource
  -error exclusion, dedupe + cap.
- `tests/formatter-locale.test.js` — the new formatter helpers, EN + AR.

### Docs

- Root `SECURITY.md` — vulnerability disclosure policy (GitHub private reporting), scope notes,
  links to the runbooks.
- `docs/INTEGRATIONS.md` — one map of integrations/connectors/MCP: live vs scaffolded vs inert,
  unlock conditions, MCP config rules, add-an-integration checklist.
- `docs/environment-variables.md` — rewritten: provider-adapter block, pricing/freshness knobs,
  tweet knobs, Stripe, newsletter/leads/alerts, `SITE_URL`; new "client-side config constants (not
  env vars)" section correcting `ALLOWED_EMAIL` / GA4 / AdSense rows.
- Index updates: `docs/README.md` + root `README.md` developer-doc tables.
- Reconciliations: PLAN.md header + Recently Completed + stale "Pre-existing" notes; PROGRESS.md
  69-city path note marked fixed with fresh evidence.

## Explicitly not done (and why)

- No pointer-stub docs (DEVELOPMENT/DESIGN_SYSTEM/SEO/AGENT_GUIDE/NEXT_STEPS…) — repo convention
  removed these in the 2026-04 refresh; content already lives in existing canonical docs.
- No new `.ai/skills/` folder — `.github/skills/` + `.cursor/skills/` + `.claude/workflows/` already
  cover the requested skill set; a fourth location would fragment governance.
- No runtime Organization/WebSite JSON-LD helper — build-time injection already covers all pages; a
  runtime duplicate would risk double schema.
- No edits to production-critical files (`post_gold.yml`, `gold-price-fetch.yml`,
  `data/gold_price.json`, `sw.js`, `src/config/constants.js`) per AGENTS.md guardrails.

## Verification

`npm test` (1282 baseline + new tests), `npm run lint`, `npm run validate`, `npm run build` — run on
the session branch; results recorded in the PR body.
