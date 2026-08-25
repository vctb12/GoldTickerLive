# DataCore DC-1 migration, rollout, and rollback

DC-1 authors `supabase/migrations/006_datacore_observations.sql`; it does **not** apply it. The
migration is additive, backfills legacy rows with stable `legacy:<uuid>` identities, locks raw
observations/provider runs to append-only behavior, and makes writes service-role-only.

## Owner rollout gate

1. Export/back up `price_snapshots`, `provider_runs`, and `provider_health`, including row counts,
   first/last timestamps, and a content hash or database backup identifier.
2. Confirm the target Supabase project. Do not rely on the public URL alone.
3. Install/use the approved Supabase CLI outside this PR environment, then run the normal local
   migration workflow and inspect the SQL diff. The CLI was not available in the DC-1 workspace.
4. Run `supabase db push --dry-run` against the linked target and review locks, grants, policies,
   backfill duration, and trigger creation.
5. Apply only after owner approval. Reload the PostgREST schema cache if the project does not do so
   automatically.
6. Dispatch one manual Gold Price Fetch run. Verify:
   - schema state `ready`;
   - at least one canonical observation or a correctly reported duplicate;
   - provider-run and provider-health rows;
   - static manifest hashes and historical labels;
   - no secret values in logs;
   - production gold quote value/provider remains governed by the existing fetch path.
7. Observe at least 24 open-market hours before enabling `SNAPSHOT_SYNC_STRICT=true`.

Official references:
[Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations),
[CLI workflows](https://supabase.com/docs/guides/local-development/cli-workflows), and
[RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Rollback triggers

Rollback if inserts fail repeatedly, observation identity conflicts appear, existing selected gold
quotes change source/value unexpectedly, public grants exceed the documented read surface, static
artifacts lose reproducibility, or any historical/stale value is labelled live.

## Application rollback

1. Set/keep `SNAPSHOT_SYNC_STRICT=false` so remote storage cannot fail the quote publication path.
2. Revert the DC-1 workflow/sync/API commit through a PR. Do not edit `post_gold.yml`.
3. Preserve the last verified `data/history/**` and `data/provider-health/**` files for audit; do
   not rewrite them as live data.
4. Confirm `data/gold_price.json` still follows the existing production provider path and immutable
   price constants/formulas.

## Database rollback without data loss

Do not drop the three tables as the first response. Preserve raw truth and remove behavior in this
order:

1. Export the tables again and compare counts/hashes with the pre-rollout backup.
2. Drop the two append-only triggers only if an owner-approved recovery operation requires it:
   `price_snapshots_reject_mutation` and `provider_runs_reject_mutation`.
3. Revoke DataCore writer access or rotate/disable the workflow credential in GitHub Secrets; never
   print the credential.
4. Restore prior policies/grants only from a reviewed migration. Do not grant authenticated users
   update/delete access merely to make rollback convenient.
5. Leave additive columns and raw rows in place during the observation window. They are backward
   compatible and preserve audit evidence.
6. Remove new indexes/columns/functions in a later owner-approved cleanup migration only after all
   consumers are reverted and exports are verified. Table drops are a separate destructive action.

## Migration verification queries

Run these through the approved SQL tooling after rollout; they are read-only:

```sql
select count(*) as observations,
       min(timestamp_utc) as first_observation,
       max(timestamp_utc) as last_observation,
       count(*) - count(distinct observation_id) as duplicate_observation_ids
from public.price_snapshots;

select provider_name,
       count(*) as attempts,
       count(*) filter (where status = 'success') as successes,
       percentile_cont(0.95) within group (order by latency_ms)
           filter (where latency_ms is not null) as p95_latency_ms
from public.provider_runs
where attempted_at_utc >= now() - interval '24 hours'
group by provider_name
order by provider_name;
```
