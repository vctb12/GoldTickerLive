begin;

select plan(33);

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
    (select relrowsecurity from pg_class where oid = 'public.price_snapshots'::regclass),
    'price_snapshots has RLS enabled'
);
select ok(
    (select relrowsecurity from pg_class where oid = 'public.provider_runs'::regclass),
    'provider_runs has RLS enabled'
);
select ok(
    (select relrowsecurity from pg_class where oid = 'public.provider_health'::regclass),
    'provider_health has RLS enabled'
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
    not has_column_privilege(
        'authenticated',
        'public.price_snapshots',
        'workflow_run_id',
        'select'
    ),
    'authenticated clients cannot read workflow identifiers'
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
    not has_table_privilege('anon', 'public.provider_health', 'select'),
    'provider health uses explicit column grants rather than table-wide select'
);
select ok(
    not exists (
        select 1
        from pg_proc as proc
        cross join lateral aclexplode(
            coalesce(proc.proacl, acldefault('f', proc.proowner))
        ) as expanded_acl
        where proc.oid = 'public.reject_datacore_raw_mutation()'::regprocedure
          and expanded_acl.grantee = 0
          and expanded_acl.privilege_type = 'EXECUTE'
    ),
    'PUBLIC cannot execute the internal trigger function'
);
select ok(
    not has_function_privilege(
        'anon',
        'public.reject_datacore_raw_mutation()',
        'execute'
    ),
    'anon cannot execute the internal trigger function'
);
select ok(
    not has_function_privilege(
        'authenticated',
        'public.reject_datacore_raw_mutation()',
        'execute'
    ),
    'authenticated clients cannot execute the internal trigger function'
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
select ok(
    exists (
        select 1
        from pg_trigger
        where tgrelid = 'public.provider_runs'::regclass
          and tgname = 'provider_runs_reject_mutation'
          and not tgisinternal
    ),
    'provider_runs append-only trigger is installed'
);

set local role service_role;
select lives_ok(
    $sql$
        insert into public.price_snapshots (
            observation_id,
            xau_usd_per_oz,
            xau_aed_per_gram,
            source_provider,
            timestamp_utc,
            fetched_at_utc,
            slot_5m_utc,
            is_selected,
            quality_state,
            raw_payload_hash,
            schema_version,
            metal_symbol,
            quote_currency,
            price_usd_per_oz,
            price_aed_per_gram,
            provider_timestamp_utc,
            ingested_at_utc,
            slot_start_utc,
            slot_resolution_seconds,
            market_state,
            freshness_state,
            quality_flags,
            is_correction
        ) values
            (
                'pgtap:visible', 3400, 401, 'pgtap',
                '2026-08-25 12:00:00+00', '2026-08-25 12:00:05+00',
                '2026-08-25 12:00:00+00', true, 'accepted', 'pgtap-visible', 2,
                'XAU', 'USD', 3400, 401, '2026-08-25 12:00:00+00',
                '2026-08-25 12:00:05+00', '2026-08-25 12:00:00+00', 300,
                'open', 'updated', array[]::text[], false
            ),
            (
                'pgtap:unselected', 3399, 400, 'pgtap',
                '2026-08-25 12:00:01+00', '2026-08-25 12:00:06+00',
                '2026-08-25 12:00:00+00', false, 'accepted', 'pgtap-unselected', 2,
                'XAU', 'USD', 3399, 400, '2026-08-25 12:00:01+00',
                '2026-08-25 12:00:06+00', '2026-08-25 12:00:00+00', 300,
                'open', 'updated', array[]::text[], false
            ),
            (
                'pgtap:rejected', 1, 1, 'pgtap',
                '2026-08-25 12:00:02+00', '2026-08-25 12:00:07+00',
                '2026-08-25 12:00:00+00', true, 'rejected', 'pgtap-rejected', 2,
                'XAU', 'USD', 1, 1, '2026-08-25 12:00:02+00',
                '2026-08-25 12:00:07+00', '2026-08-25 12:00:00+00', 300,
                'open', 'updated', array['rejected']::text[], false
            )
    $sql$,
    'service_role can append observations'
);
select lives_ok(
    $sql$
        insert into public.provider_runs (
            run_key,
            provider_name,
            status,
            metal_symbol,
            quote_currency
        ) values ('pgtap:run', 'pgtap', 'success', 'XAU', 'USD')
    $sql$,
    'service_role can append provider runs'
);
select lives_ok(
    $sql$
        insert into public.provider_health (
            metal_symbol,
            provider_name,
            success_rate_24h,
            current_status
        ) values ('XAU', 'pgtap', 99, 'healthy')
    $sql$,
    'service_role can write provider health'
);
reset role;

set local role anon;
select results_eq(
    $sql$
        select observation_id
        from public.price_snapshots
        where observation_id like 'pgtap:%'
        order by observation_id
    $sql$,
    array['pgtap:visible']::text[],
    'anon sees selected accepted/warning rows but not unselected or rejected rows'
);
reset role;

set local role authenticated;
select results_eq(
    $sql$
        select observation_id
        from public.price_snapshots
        where observation_id like 'pgtap:%'
        order by observation_id
    $sql$,
    array['pgtap:visible']::text[],
    'authenticated clients see only the approved public observation row'
);
reset role;

set local role anon;
select results_eq(
    $sql$
        select success_rate_24h
        from public.provider_health
        where metal_symbol = 'XAU' and provider_name = 'pgtap'
    $sql$,
    array[99::numeric],
    'anon can read an approved provider-health column through RLS'
);
select throws_ok(
    $sql$insert into public.price_snapshots (observation_id) values ('pgtap:anon-write')$sql$,
    '42501',
    null,
    'anon cannot insert observations'
);
reset role;

set local role authenticated;
select throws_ok(
    $sql$insert into public.provider_runs (run_key) values ('pgtap:auth-write')$sql$,
    '42501',
    null,
    'authenticated clients cannot insert provider runs'
);
select throws_ok(
    $sql$
        update public.provider_health
        set success_rate_24h = 0
        where metal_symbol = 'XAU' and provider_name = 'pgtap'
    $sql$,
    '42501',
    null,
    'authenticated clients cannot update provider health'
);
reset role;

set local role service_role;
select throws_ok(
    $sql$
        update public.price_snapshots
        set quality_state = 'warning'
        where observation_id = 'pgtap:visible'
    $sql$,
    'P0001',
    'price_snapshots is append-only; update/delete is not allowed',
    'append-only trigger rejects service-role observation updates'
);
select throws_ok(
    $sql$delete from public.provider_runs where run_key = 'pgtap:run'$sql$,
    'P0001',
    'provider_runs is append-only; update/delete is not allowed',
    'append-only trigger rejects service-role provider-run deletes'
);
reset role;

select * from finish();
rollback;
