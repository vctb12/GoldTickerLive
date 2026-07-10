# Phase 48 — Data-source health dashboard (Theme A · flagged OFF)

A read-only operator/observability view model that surfaces the per-provider health diagnostics
(added in Phase 47) plus the current freshness state. Feature-flagged OFF; pure and tested; shows no
user-facing price and touches no pricing math.

## Shipped

- **`src/config/feature-flags.js`** — new `DATASOURCE_HEALTH_DASHBOARD_ENABLED: false`.
- **`src/lib/datasource-health-dashboard.js`**
  - `buildDatasourceHealthModel({ providers, freshness, activeProviderId }, { lang })` — turns an
    array of `ProviderHealthMonitor.getSnapshot()` results into display rows (status, success %,
    median/p95 latency, timeouts, rate-limits, consecutive fail/success) + an `overall` summary +
    the freshness state + a bilingual descriptive disclaimer.
  - `isDashboardEnabled()` / `renderDatasourceHealthDashboard(model)` — the render returns `''`
    while the flag is off, so nothing mounts by default.
- Pure, no DOM/fetch; HTML render escapes text.

## Forward-compatible with Phase 47

Phase 47's richer snapshot (`timeoutCount` / `rateLimitedCount` / `failureCount` /
`consecutiveSuccesses`) isn't on `main` yet (PR #590 pending). So the model reads **every** field
defensively (`?? 0` / `?? null`): against the current snapshot shape those diagnostics show `0`, and
they light up automatically once #590 lands — no code change, no crash. A test locks this in with a
pre-Phase-47 snapshot fixture.

## Tests — `tests/datasource-health-dashboard.test.js` (6)

Ships gated OFF (render empty); builds rows with formatted rate/latency; **forward-compatible** with
old snapshots (missing fields → 0, no crash); overall "degraded" when any provider is unhealthy;
Arabic localisation of status + disclaimer; empty-providers edge case.

## How it's wired (adoption)

A page/operator surface calls `buildDatasourceHealthModel(...)` with the live health snapshots and
mounts `renderDatasourceHealthDashboard(model)` only when the flag is on. This phase ships the
model + render + flag; enabling it and choosing where to mount is an owner decision (it's a
diagnostics panel, not a user price surface).

## Constraints honoured

$0; flag OFF by default; no owner-gated files touched; no user-facing price; pricing math / peg /
troy-oz / framing untouched; additive module.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1398 pass, +6**) + `npm run lint` — all green.
