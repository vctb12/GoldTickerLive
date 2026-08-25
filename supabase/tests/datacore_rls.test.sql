begin;

select plan(14);

select has_table('public', 'price_snapshots', 'price_snapshots exists');
select has_table('public', 'provider_runs', 'provider_runs exists');
select has_table('public', 'provider_health', 'provider_health exists');
select col_is_not_null(
    'public',
    'price_snapshots',
    'metal_symbol',
    'canonical metal is required'
);
select col_is_not_null(
    'public',
    'price_snapshots',
    'provider_timestamp_utc',
    'provider time is required'
);
select col_is_not_null(
    'public',
    'price_snapshots',
    'ingested_at_utc',
    'ingestion time is required'
);
select has_function(
    'public',
    'reject_datacore_raw_mutation',
    array[]::text[],
    'append-only trigger function exists'
);
select ok(
    has_column_privilege('anon', 'public.price_snapshots', 'price_usd_per_oz', 'select'),
    'anon can read approved normalized price'
);
select ok(
    not has_column_privilege('anon', 'public.price_snapshots', 'raw_payload_hash', 'select'),
    'anon cannot read raw payload hash'
);
select ok(
    not has_column_privilege('anon', 'public.price_snapshots', 'workflow_run_id', 'select'),
    'anon cannot read workflow identifier'
);
select ok(
    not has_table_privilege('anon', 'public.provider_runs', 'select'),
    'anon cannot read provider attempt detail'
);
select ok(
    not has_table_privilege('authenticated', 'public.provider_runs', 'insert'),
    'authenticated clients cannot insert provider attempts'
);
select ok(
    has_column_privilege('anon', 'public.provider_health', 'success_rate_24h', 'select'),
    'anon can read approved provider health'
);
select ok(
    exists (
        select 1
        from pg_trigger
        where tgrelid = 'public.price_snapshots'::regclass
          and tgname = 'price_snapshots_reject_mutation'
          and not tgisinternal
    ),
    'price_snapshots append-only trigger is installed'
);

select * from finish();
rollback;
