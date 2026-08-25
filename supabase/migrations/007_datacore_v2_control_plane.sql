-- DataCore DC-1 v2: metal-neutral observations, correction lineage, and least-privilege reads.
-- Authoring only. Apply only after backup and owner approval.

begin;

alter table public.price_snapshots
    add column if not exists metal_symbol text,
    add column if not exists quote_currency text,
    add column if not exists price_usd_per_oz numeric,
    add column if not exists price_aed_per_gram numeric,
    add column if not exists provider_timestamp_utc timestamptz,
    add column if not exists ingested_at_utc timestamptz,
    add column if not exists slot_start_utc timestamptz,
    add column if not exists slot_resolution_seconds int,
    add column if not exists market_state text,
    add column if not exists freshness_state text,
    add column if not exists quality_flags text[],
    add column if not exists correction_of_observation_id text,
    add column if not exists is_correction boolean;

-- Legacy-compatible backfill. Existing XAU values remain XAU aliases; future non-gold rows use only
-- the neutral columns and must leave XAU-named columns null.
update public.price_snapshots
set metal_symbol = coalesce(metal_symbol, left(symbol, 3), 'XAU'),
    quote_currency = coalesce(quote_currency, currency, 'USD'),
    price_usd_per_oz = coalesce(price_usd_per_oz, xau_usd_per_oz),
    price_aed_per_gram = coalesce(price_aed_per_gram, xau_aed_per_gram),
    provider_timestamp_utc = coalesce(provider_timestamp_utc, timestamp_utc),
    ingested_at_utc = coalesce(ingested_at_utc, fetched_at_utc, created_at),
    slot_start_utc = coalesce(slot_start_utc, slot_5m_utc),
    slot_resolution_seconds = coalesce(slot_resolution_seconds, 300),
    market_state = coalesce(
        market_state,
        case when is_market_open is true then 'open'
             when is_market_open is false then 'closed'
             else 'unknown' end
    ),
    freshness_state = coalesce(
        freshness_state,
        case when is_market_open is false then 'closed'
             when is_fallback then 'fallback'
             when is_fresh then 'updated'
             else 'stale' end
    ),
    quality_state = case
        when quality_state in ('fresh', 'stale', 'fallback') then
            case when quality_state = 'fresh' then 'accepted' else 'warning' end
        else coalesce(quality_state, 'warning') end,
    quality_flags = coalesce(
        quality_flags,
        case when is_fallback then array['fallback']::text[]
             when not is_fresh and is_market_open is distinct from false then array['stale']::text[]
             else array[]::text[] end
    ),
    is_correction = coalesce(is_correction, correction_of_observation_id is not null),
    schema_version = greatest(schema_version, 2)
where metal_symbol is null
   or quote_currency is null
   or price_usd_per_oz is null
   or provider_timestamp_utc is null
   or ingested_at_utc is null
   or slot_start_utc is null
   or slot_resolution_seconds is null
   or market_state is null
   or freshness_state is null
   or quality_flags is null
   or is_correction is null
   or schema_version < 2
   or quality_state in ('fresh', 'stale', 'fallback');

alter table public.price_snapshots
    alter column metal_symbol set not null,
    alter column quote_currency set not null,
    alter column price_usd_per_oz set not null,
    alter column provider_timestamp_utc set not null,
    alter column ingested_at_utc set not null,
    alter column slot_start_utc set not null,
    alter column slot_resolution_seconds set not null,
    alter column market_state set not null,
    alter column freshness_state set not null,
    alter column quality_flags set default array[]::text[],
    alter column quality_flags set not null,
    alter column is_correction set default false,
    alter column is_correction set not null,
    alter column xau_usd_per_oz drop not null;

alter table public.price_snapshots
    drop constraint if exists price_snapshots_quality_state_check,
    drop constraint if exists price_snapshots_metal_symbol_check,
    add constraint price_snapshots_metal_symbol_check
        check (metal_symbol in ('XAU', 'XAG', 'XPT', 'XPD')) not valid,
    drop constraint if exists price_snapshots_quote_currency_check,
    add constraint price_snapshots_quote_currency_check
        check (quote_currency = 'USD') not valid,
    drop constraint if exists price_snapshots_price_positive_check,
    add constraint price_snapshots_price_positive_check
        check (price_usd_per_oz > 0) not valid,
    drop constraint if exists price_snapshots_slot_resolution_check,
    add constraint price_snapshots_slot_resolution_check
        check (slot_resolution_seconds in (300, 3600, 86400)) not valid,
    drop constraint if exists price_snapshots_market_state_check,
    add constraint price_snapshots_market_state_check
        check (market_state in ('open', 'closed', 'unknown')) not valid,
    drop constraint if exists price_snapshots_freshness_state_check,
    add constraint price_snapshots_freshness_state_check
        check (freshness_state in ('updated', 'delayed', 'cached', 'fallback', 'stale', 'unavailable', 'closed')) not valid,
    add constraint price_snapshots_quality_state_check
        check (quality_state in ('accepted', 'warning', 'rejected')) not valid,
    drop constraint if exists price_snapshots_correction_shape_check,
    add constraint price_snapshots_correction_shape_check
        check (
            (is_correction and correction_of_observation_id is not null)
            or (not is_correction and correction_of_observation_id is null)
        ) not valid,
    drop constraint if exists price_snapshots_xau_alias_check,
    add constraint price_snapshots_xau_alias_check
        check (
            metal_symbol = 'XAU'
            or (xau_usd_per_oz is null and xau_aed_per_gram is null)
        ) not valid;

alter table public.price_snapshots
    drop constraint if exists price_snapshots_correction_of_observation_id_fkey,
    add constraint price_snapshots_correction_of_observation_id_fkey
        foreign key (correction_of_observation_id)
        references public.price_snapshots(observation_id)
        deferrable initially deferred
        not valid;

create index if not exists idx_price_snapshots_metal_selected_provider_time
    on public.price_snapshots(metal_symbol, quote_currency, is_selected, provider_timestamp_utc desc);
create index if not exists idx_price_snapshots_metal_slot
    on public.price_snapshots(metal_symbol, quote_currency, slot_start_utc desc);
create index if not exists idx_price_snapshots_correction
    on public.price_snapshots(correction_of_observation_id)
    where correction_of_observation_id is not null;

alter table public.provider_runs
    add column if not exists metal_symbol text,
    add column if not exists quote_currency text;

update public.provider_runs
set metal_symbol = coalesce(metal_symbol, 'XAU'),
    quote_currency = coalesce(quote_currency, 'USD')
where metal_symbol is null or quote_currency is null;

alter table public.provider_runs
    alter column metal_symbol set not null,
    alter column quote_currency set not null;

create index if not exists idx_provider_runs_metal_provider_attempted
    on public.provider_runs(metal_symbol, provider_name, attempted_at_utc desc);

alter table public.provider_health
    add column if not exists metal_symbol text;

update public.provider_health
set metal_symbol = coalesce(metal_symbol, 'XAU')
where metal_symbol is null;

alter table public.provider_health alter column metal_symbol set not null;
alter table public.provider_health drop constraint if exists provider_health_pkey;
alter table public.provider_health
    add constraint provider_health_pkey primary key (metal_symbol, provider_name);

-- Raw attempt data remains private. Selected accepted/warning observations and bounded health
-- columns are the only anonymous/authenticated Data API surface.
drop policy if exists "Public read price snapshots" on public.price_snapshots;
create policy "Public read selected price snapshots"
    on public.price_snapshots for select
    to anon, authenticated
    using (is_selected and quality_state in ('accepted', 'warning'));

revoke all on table public.price_snapshots from anon, authenticated;
grant select (
    observation_id,
    metal_symbol,
    quote_currency,
    price_usd_per_oz,
    price_aed_per_gram,
    source_provider,
    provider_timestamp_utc,
    fetched_at_utc,
    ingested_at_utc,
    slot_start_utc,
    slot_resolution_seconds,
    market_state,
    freshness_state,
    freshness_seconds,
    is_selected,
    selection_method,
    deviation_bps,
    quality_state,
    quality_flags,
    correction_of_observation_id,
    is_correction,
    schema_version
) on public.price_snapshots to anon, authenticated;
grant all on table public.price_snapshots to service_role;

revoke all on table public.provider_runs from anon, authenticated;
grant all on table public.provider_runs to service_role;

drop policy if exists "Public read provider health" on public.provider_health;
create policy "Public read provider health"
    on public.provider_health for select
    to anon, authenticated
    using (true);
revoke all on table public.provider_health from anon, authenticated;
grant select (
    metal_symbol,
    provider_name,
    last_success_at,
    last_failure_at,
    success_rate_24h,
    avg_latency_24h,
    p95_latency_24h,
    p95_freshness_seconds_24h,
    attempt_count_24h,
    success_count_24h,
    stale_count_24h,
    fallback_count_24h,
    divergence_count_24h,
    circuit_transition_count_24h,
    current_status,
    circuit_state,
    updated_at
) on public.provider_health to anon, authenticated;
grant all on table public.provider_health to service_role;

comment on table public.price_snapshots is
    'Append-only metal-neutral provider observations. DC-1 production writer is XAU only.';
comment on column public.price_snapshots.correction_of_observation_id is
    'Optional link to the immutable predecessor; corrections append and never overwrite.';
comment on column public.price_snapshots.quality_flags is
    'Machine-readable validation warnings retained with the immutable observation.';

commit;
