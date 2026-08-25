# ADR 0008 — Metal-neutral immutable observations with derived public history

**Status:** accepted for draft DC-1 implementation; production rollout owner-gated
**Date:** 2026-08-25

## Context

GoldTickerLive needs one auditable shared history for the existing gold workflow without creating a
gold-only schema that later stores silver or platinum values in XAU-named columns. Provider quotes
can arrive late, out of order, more than once, or corrected. Public static files and an optional API
need bounded, reproducible aggregates, while raw payload hashes, workflow identifiers, and provider
error detail must remain operational-only.

## Decision

1. `price_snapshots` remains the compatibility table name, but schema v2 canonical fields are
   `metal_symbol`, `quote_currency`, `price_usd_per_oz`, provider/fetch/ingest UTC timestamps,
   `slot_start_utc`, resolution, market/freshness/quality state, and correction linkage.
2. Raw observations are append-only. Exact replay uses the same content identity and is ignored. A
   changed provider value at the same provider timestamp is a new observation linked by
   `correction_of_observation_id`; the predecessor remains intact.
3. XAU compatibility aliases remain for existing consumers and are populated only when
   `metal_symbol = 'XAU'`. The database check requires them to be null for non-gold rows.
4. Provider attempts are immutable and private. Provider health is a mutable derived table with
   approved public columns. Selected accepted/warning observations have column-limited public reads.
5. The raw archive is the source of truth for deterministic 7-day intraday, 90-day hourly, and
   five-year daily static outputs. Rollups do not fill gaps and retain contributor IDs/hashes,
   provider distribution, completeness, and quality flags.
6. DC-1 writes XAU only. Accepting other symbols in the schema is forward compatibility, not
   production activation or provider approval.

## Alternatives considered

- **Keep XAU-specific canonical columns:** rejected because later metals would require parallel
  tables or semantically false XAU fields.
- **Overwrite corrected rows:** rejected because it destroys replay and audit evidence.
- **Store rollups as source truth:** rejected because contributor lineage and alternate rollups
  would become unverifiable.
- **Fill missing scheduled slots:** rejected because GitHub scheduling is sparse and interpolation
  would invent market observations.
- **Expose raw tables broadly:** rejected because hashes, workflow IDs, and provider failure detail
  are not required by public consumers.

## Consequences

- Migration 007 performs an additive legacy backfill after migration 006, changes provider-health
  identity to metal + provider, and narrows public grants to approved columns.
- Existing XAU consumers can transition incrementally through compatibility aliases.
- Static history may remain sparse and its quality gate may warn or fail; that is an honest result.
- Database application, enforcement progression, and every non-gold production decision require
  explicit owner action.

## Rollback

Disable or retain `observe-only`, freeze public exports, preserve raw rows/exports, and revert the
application/workflow through a PR. Do not delete the tables or correction chain during incident
response. A later owner-approved cleanup migration may remove v2 structures only after all readers
are reverted and backups are verified.
