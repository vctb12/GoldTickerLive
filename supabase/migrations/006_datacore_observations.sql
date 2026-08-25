-- DataCore DC-1: immutable XAU/USD observations and provider control plane.
-- Authoring only. Do not apply to production without the documented owner rollout gate.

begin;

create table if not exists public.price_snapshots (
    id                          uuid primary key default gen_random_uuid(),
    observation_id              text,
    symbol                      text not null default 'XAUUSD',
    xau_usd_per_oz              numeric not null,
    xau_aed_per_gram            numeric,
    currency                    text not null default 'USD',
    source_provider             text not null,
    provider_chain              text,
    timestamp_utc               timestamptz not null,
    fetched_at_utc               timestamptz not null,
    slot_5m_utc                 timestamptz,
    freshness_seconds           int,
    is_fresh                    boolean not null default false,
    is_fallback                 boolean not null default false,
    is_market_open              boolean,
    is_selected                 boolean not null default true,
    selection_method            text,
    deviation_bps               numeric,
    provider_response_time_ms   int,
    quality_state               text,
    raw_payload_hash            text not null,
    workflow_run_id             text,
    schema_version              smallint not null default 1,
    created_at                  timestamptz not null default now()
);

alter table public.price_snapshots
    add column if not exists observation_id text,
    add column if not exists symbol text not null default 'XAUUSD',
    add column if not exists slot_5m_utc timestamptz,
    add column if not exists is_selected boolean not null default true,
    add column if not exists selection_method text,
    add column if not exists deviation_bps numeric,
    add column if not exists provider_response_time_ms int,
    add column if not exists quality_state text,
    add column if not exists workflow_run_id text,
    add column if not exists schema_version smallint not null default 1;

-- An earlier schema bootstrap may already have installed the append-only trigger. Remove it
-- inside this transaction before the legacy backfill; it is restored before commit below.
drop trigger if exists price_snapshots_reject_mutation on public.price_snapshots;

update public.price_snapshots
set observation_id = coalesce(observation_id, 'legacy:' || id::text),
    slot_5m_utc = coalesce(
        slot_5m_utc,
        date_trunc('hour', timestamp_utc)
            + floor(date_part('minute', timestamp_utc) / 5) * interval '5 minutes'
    ),
    quality_state = coalesce(
        quality_state,
        case
            when is_fallback then 'fallback'
            when is_fresh then 'fresh'
            else 'stale'
        end
    )
where observation_id is null
   or slot_5m_utc is null
   or quality_state is null;

alter table public.price_snapshots
    alter column observation_id set not null,
    alter column slot_5m_utc set not null,
    alter column quality_state set not null;

create unique index if not exists idx_price_snapshots_observation_id
    on public.price_snapshots(observation_id);
create index if not exists idx_price_snapshots_symbol_selected_timestamp
    on public.price_snapshots(symbol, is_selected, timestamp_utc desc);
create index if not exists idx_price_snapshots_symbol_slot
    on public.price_snapshots(symbol, slot_5m_utc desc);

alter table public.price_snapshots
    drop constraint if exists price_snapshots_symbol_check,
    add constraint price_snapshots_symbol_check
        check (symbol ~ '^[A-Z0-9]{3,20}$') not valid,
    drop constraint if exists price_snapshots_quality_state_check,
    add constraint price_snapshots_quality_state_check
        check (quality_state in ('fresh', 'stale', 'fallback')) not valid,
    drop constraint if exists price_snapshots_schema_version_check,
    add constraint price_snapshots_schema_version_check
        check (schema_version >= 1) not valid;

create or replace function public.reject_datacore_raw_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
    raise exception '% is append-only; update/delete is not allowed', tg_table_name;
end;
$$;

-- Trigger functions are internal implementation details, not Data API RPC endpoints.
revoke execute on function public.reject_datacore_raw_mutation()
    from public, anon, authenticated;

create trigger price_snapshots_reject_mutation
    before update or delete on public.price_snapshots
    for each row execute function public.reject_datacore_raw_mutation();

alter table public.price_snapshots enable row level security;
drop policy if exists "Public read price snapshots" on public.price_snapshots;
drop policy if exists "Admin insert price snapshots" on public.price_snapshots;
drop policy if exists "Admin update price snapshots" on public.price_snapshots;
drop policy if exists "Admin delete price snapshots" on public.price_snapshots;
create policy "Public read price snapshots"
    on public.price_snapshots for select
    to anon, authenticated
    using (true);
revoke all on table public.price_snapshots from anon, authenticated;
grant select (
    observation_id,
    symbol,
    xau_usd_per_oz,
    xau_aed_per_gram,
    currency,
    source_provider,
    timestamp_utc,
    fetched_at_utc,
    slot_5m_utc,
    freshness_seconds,
    is_fresh,
    is_fallback,
    is_market_open,
    is_selected,
    selection_method,
    deviation_bps,
    quality_state,
    schema_version
) on public.price_snapshots to anon, authenticated;
grant all on table public.price_snapshots to service_role;

create table if not exists public.provider_runs (
    id                          uuid primary key default gen_random_uuid(),
    run_key                     text,
    workflow_run_id             text,
    provider_name               text not null,
    status                      text not null,
    selected                    boolean not null default false,
    attempted_at_utc             timestamptz not null default now(),
    provider_timestamp_utc      timestamptz,
    normalized_price_usd_per_oz numeric,
    deviation_bps               numeric,
    latency_ms                  int,
    http_status                 int,
    error_code                  text,
    error_message               text,
    freshness_seconds           int,
    circuit_state               text,
    created_at                  timestamptz not null default now()
);

alter table public.provider_runs
    add column if not exists run_key text,
    add column if not exists workflow_run_id text,
    add column if not exists selected boolean not null default false,
    add column if not exists attempted_at_utc timestamptz not null default now(),
    add column if not exists provider_timestamp_utc timestamptz,
    add column if not exists normalized_price_usd_per_oz numeric,
    add column if not exists deviation_bps numeric;

-- Preserve idempotent upgrade behavior if an earlier bootstrap already installed this trigger.
drop trigger if exists provider_runs_reject_mutation on public.provider_runs;

update public.provider_runs
set run_key = coalesce(run_key, 'legacy:' || id::text),
    attempted_at_utc = coalesce(attempted_at_utc, created_at)
where run_key is null;

alter table public.provider_runs alter column run_key set not null;
create unique index if not exists idx_provider_runs_run_key
    on public.provider_runs(run_key);
create index if not exists idx_provider_runs_attempted_desc
    on public.provider_runs(attempted_at_utc desc);
create index if not exists idx_provider_runs_provider_attempted
    on public.provider_runs(provider_name, attempted_at_utc desc);

alter table public.provider_runs
    drop constraint if exists provider_runs_status_check,
    add constraint provider_runs_status_check
        check (status in ('success', 'error', 'stale', 'fallback', 'circuit_open')) not valid;

create trigger provider_runs_reject_mutation
    before update or delete on public.provider_runs
    for each row execute function public.reject_datacore_raw_mutation();

alter table public.provider_runs enable row level security;
drop policy if exists "Admin read provider runs" on public.provider_runs;
drop policy if exists "Admin insert provider runs" on public.provider_runs;
drop policy if exists "Admin update provider runs" on public.provider_runs;
drop policy if exists "Admin delete provider runs" on public.provider_runs;
revoke all on table public.provider_runs from anon, authenticated;
grant all on table public.provider_runs to service_role;

create table if not exists public.provider_health (
    provider_name                   text primary key,
    last_success_at                 timestamptz,
    last_failure_at                 timestamptz,
    success_rate_24h                numeric,
    avg_latency_24h                 numeric,
    p95_latency_24h                 numeric,
    p95_freshness_seconds_24h       numeric,
    attempt_count_24h               int not null default 0,
    success_count_24h               int not null default 0,
    stale_count_24h                 int not null default 0,
    fallback_count_24h              int not null default 0,
    divergence_count_24h            int not null default 0,
    circuit_transition_count_24h    int not null default 0,
    current_status                  text,
    circuit_state                   text,
    updated_at                      timestamptz not null default now()
);

alter table public.provider_health
    add column if not exists p95_latency_24h numeric,
    add column if not exists p95_freshness_seconds_24h numeric,
    add column if not exists attempt_count_24h int not null default 0,
    add column if not exists success_count_24h int not null default 0,
    add column if not exists stale_count_24h int not null default 0,
    add column if not exists fallback_count_24h int not null default 0,
    add column if not exists divergence_count_24h int not null default 0,
    add column if not exists circuit_transition_count_24h int not null default 0;

alter table public.provider_health enable row level security;
drop policy if exists "Public read provider health" on public.provider_health;
drop policy if exists "Admin insert provider health" on public.provider_health;
drop policy if exists "Admin update provider health" on public.provider_health;
drop policy if exists "Admin delete provider health" on public.provider_health;
create policy "Public read provider health"
    on public.provider_health for select
    to anon, authenticated
    using (true);
revoke all on table public.provider_health from anon, authenticated;
grant select on table public.provider_health to anon, authenticated;
grant all on table public.provider_health to service_role;

comment on table public.price_snapshots is
    'Append-only DataCore observations. XAU/USD is the only production writer enabled in DC-1.';
comment on column public.price_snapshots.is_selected is
    'True only for the provider observation selected for the public gold reference quote.';
comment on table public.provider_runs is
    'One immutable provider-attempt record per workflow run and provider.';

commit;
