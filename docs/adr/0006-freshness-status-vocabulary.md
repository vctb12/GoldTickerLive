# ADR-0006 — Data freshness & status vocabulary

**Status:** Accepted (codifies shipped architecture) · **Date:** 2026-07-11

## Context

Trust is the product. Users must always know whether a number is live, recently updated, cached,
delayed, stale, or from a failed provider — never be shown cached data labelled "live". The charter
(`AGENTS.md`) makes freshness labels non-negotiable and defines exact terms. This needs one shared
vocabulary and one set of components, not per-page ad-hoc wording.

## Decision

A single freshness system evaluates state and renders it consistently:

- **Policy/evaluation** — `src/lib/freshness-policy.js` (`evaluateFreshnessState`, budgets) and
  `src/lib/live-status.js` (age thresholds, market open/closed).
- **Shared UI** — `src/lib/data-status-banner.js` (offline/error banner),
  `src/components/FreshnessBadge.js`, `MarketStatusPanel.js`, `QuoteMetaPanel.js`.
- **Contract** — `docs/freshness-contract.md` plus the terminology in `AGENTS.md`: `live`,
  `updated`, `cached`, `delayed`, and also `estimated`, `fallback`, `stale`, `unavailable`,
  `closed`.

Every price surface shows source, timestamp, and state. Status is never communicated by colour alone
(icon + text + timestamp + accessible label). Degraded states render honestly (e.g. "Live feed
unavailable — showing last cached price" when the provider is unreachable).

## Alternatives considered

- **Per-page freshness copy** — rejected: drift and the risk of mislabelling cached as live.
- **Colour-only status** — rejected: fails accessibility and the charter's non-colour requirement.
- **Hiding staleness for a "cleaner" look** — explicitly forbidden by the charter.

## Consequences

- New price surfaces reuse the shared freshness components + vocabulary; new wording is a review
  smell.
- Freshness labels/methodology links/reference-vs-retail disclaimers must remain visible; removing
  them "to look cleaner" is a block-level violation.

## Invariants

- If data is not truly live, it is not labelled live. Cached/fallback/estimated/delayed values show
  source + timestamp + state. Non-colour status indicators. EN/AR parity of freshness meaning.

## Relevant files

`src/lib/freshness-policy.js`, `src/lib/live-status.js`, `src/lib/data-status-banner.js`,
`src/components/FreshnessBadge.js`, `MarketStatusPanel.js`, `QuoteMetaPanel.js`,
`docs/freshness-contract.md`, terminology in `AGENTS.md`.

## Verification mechanism

`npm run validate` includes freshness-metadata / reference-language sweeps; `tests/` cover freshness
policy; `tests/e2e/freshness-labels.spec.js` asserts labels in the live DOM. Offline/degraded state
observed in browser renders.

## Supersession policy

If the vocabulary or components change (e.g. new state, a provider with documented lag), update
`docs/freshness-contract.md` + `AGENTS.md` and supersede this ADR. The policy modules are
authoritative.
