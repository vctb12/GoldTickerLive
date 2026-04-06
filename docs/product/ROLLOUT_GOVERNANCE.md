# Rollout Governance (Phase 6)

## Purpose

Define a safe rollout sequence and release gate for multi-PR revamp work.

## Release waves

### Wave 1 — Shops

Scope:
- `shops.html`
- `shops.js`
- `shops.css`

Gate to move forward:
- Functional and trust checks pass for shops flows.
- No unresolved accessibility blockers in modal/filter path.

### Wave 2 — Tracker

Scope:
- `tracker.html`
- `tracker-pro.js`
- `tracker-pro.css`
- `tracker/` modules touched by tracker PRs

Gate to move forward:
- Onboarding and source-state clarity validated.
- Compare/archive/planner critical paths verified.

### Wave 3 — Country/City/Market templates

Scope:
- country/city/market HTML templates
- metadata/canonical/internal-link consistency

Gate to move forward:
- Metadata parity (title/description/canonical/OG/Twitter)
- Internal links and depth-relative assets verified.

## Merge gate checklist (all waves)

- [ ] PR is narrow and task-specific.
- [ ] Verification checklist completed (`docs/product/VERIFICATION.md`).
- [ ] Risks are documented (not hidden in summary copy).
- [ ] No unrelated cleanup/refactors included.

## Post-merge monitoring

After each wave merge:

1. Validate key pages render with expected assets.
2. Confirm no high-severity console/runtime breakage.
3. Confirm trust labels and disclaimers still present.
4. Confirm service worker update behavior is stable after refresh.

## Rollback guidance

Rollback if any of the following appears in production checks:

- Broken primary navigation or blocked core flow.
- Misleading trust wording (spot vs retail ambiguity).
- Major SEO regression (missing canonical/title/meta).
- Unrecoverable JS error affecting primary page content.

Prefer reverting the smallest offending PR, then re-shipping a focused fix.
