# Architecture Decision Records (ADR)

This directory records the **foundational, already-implemented** architecture decisions of Gold
Ticker Live so future contributors and agents do not re-litigate settled choices. Each ADR describes
the system **as it exists today** (verified against the code), not aspirational design.

> These ADRs are descriptive/codifying, not proposals. They were written after the fact to capture
> decisions that are already shipped and gated by CI. Do not change production code to "match" an
> ADR — if code and ADR disagree, the code is the source of truth and the ADR must be corrected (see
> each ADR's supersession policy).

Related, non-duplicating docs:

- Verified current state:
  [`../agent/GOLDTICKERLIVE_REVAMP_STATE.md`](../agent/GOLDTICKERLIVE_REVAMP_STATE.md)
- Canonical charter: [`../../AGENTS.md`](../../AGENTS.md)
- Design tokens reference: [`../DESIGN_TOKENS.md`](../DESIGN_TOKENS.md)
- Freshness contract: [`../freshness-contract.md`](../freshness-contract.md)
- Ad-hoc decision briefs: [`../decisions/`](../decisions/) (phase-specific notes; this ADR series is
  the durable, numbered record of the foundational architecture)

## Index

| ADR                                                  | Title                                        | Status   |
| ---------------------------------------------------- | -------------------------------------------- | -------- |
| [ADR-0001](./0001-design-token-architecture.md)      | Canonical design-token architecture          | Accepted |
| [ADR-0002](./0002-typography-bilingual-fonts.md)     | Typography & bilingual (EN/AR) font strategy | Accepted |
| [ADR-0003](./0003-theme-dark-mode-preinit.md)        | Theme & dark-mode with FOUC pre-init         | Accepted |
| [ADR-0004](./0004-shared-shell-injection.md)         | Shared shell (nav/footer) injection          | Accepted |
| [ADR-0005](./0005-spot-resolver-tracker-engine.md)   | Canonical spot resolver ⟂ tracker engine     | Accepted |
| [ADR-0006](./0006-freshness-status-vocabulary.md)    | Data freshness & status vocabulary           | Accepted |
| [ADR-0007](./0007-rtl-mobile-regression-strategy.md) | RTL & mobile regression strategy             | Accepted |

## Format

Each ADR uses: Status · Context · Decision · Alternatives considered · Consequences · Invariants ·
Relevant files · Verification mechanism · Date · Supersession policy.
