'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const migration006 = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '006_datacore_observations.sql'),
  'utf8'
);
const migration007 = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '007_datacore_v2_control_plane.sql'),
  'utf8'
);
const schema = fs.readFileSync(path.join(root, 'supabase', 'schema.sql'), 'utf8');
const schemaV1 = schema.slice(
  schema.indexOf('-- PRICE SNAPSHOTS'),
  schema.indexOf('-- DATACORE V2 CONTROL PLANE')
);
const schemaV2 = schema.slice(schema.indexOf('-- DATACORE V2 CONTROL PLANE'));
const rlsTest = fs.readFileSync(
  path.join(root, 'supabase', 'tests', 'datacore_rls.test.sql'),
  'utf8'
);

function statementOffset(sql, pattern, label) {
  const match = pattern.exec(sql);
  assert.ok(match, `${label} statement is present`);
  return match.index;
}

function selectedColumns(sql, table) {
  const grant = sql.match(
    new RegExp(`grant select \\(([\\s\\S]*?)\\) on public\\.${table} to anon, authenticated`, 'i')
  );
  assert.ok(grant, `${table} uses an explicit public column grant`);
  return grant[1];
}

function policyDefinition(sql, name) {
  const policy = sql.match(new RegExp(`create policy "${name}"[\\s\\S]*?;`, 'i'));
  assert.ok(policy, `${name} policy is present`);
  return policy[0];
}

test('clean migration chain creates all DataCore relations before v2 alters them', () => {
  for (const relation of ['price_snapshots', 'provider_runs', 'provider_health']) {
    assert.match(migration006, new RegExp(`create table if not exists public\\.${relation}`, 'i'));
    assert.match(schema, new RegExp(`create table if not exists public\\.${relation}`, 'i'));
  }
  assert.match(migration007, /^begin;/m);
  assert.match(migration007, /^commit;/m);
  assert.match(schemaV2, /^begin;/m);
  assert.match(schemaV2, /^commit;/m);
});

test('legacy migration path is additive and backfills every required v2 field', () => {
  for (const column of [
    'metal_symbol',
    'quote_currency',
    'price_usd_per_oz',
    'provider_timestamp_utc',
    'ingested_at_utc',
    'slot_start_utc',
    'slot_resolution_seconds',
    'market_state',
    'freshness_state',
    'quality_flags',
    'is_correction',
  ]) {
    assert.match(migration007, new RegExp(`add column if not exists ${column}\\b`, 'i'), column);
    assert.match(migration007, new RegExp(`${column} = coalesce|${column} = case`, 'i'), column);
  }
  assert.match(migration007, /add column if not exists correction_of_observation_id text/i);
  assert.match(
    migration007,
    /is_correction = coalesce\(is_correction, correction_of_observation_id is not null\)/i
  );
  assert.match(migration007, /schema_version = greatest\(schema_version, 2\)/i);
});

test('append-only triggers are removed before each legacy backfill and restored afterward', () => {
  for (const [sql, table, trigger] of [
    [migration006, 'price_snapshots', 'price_snapshots_reject_mutation'],
    [migration006, 'provider_runs', 'provider_runs_reject_mutation'],
    [migration007, 'price_snapshots', 'price_snapshots_reject_mutation'],
    [migration007, 'provider_runs', 'provider_runs_reject_mutation'],
    [schemaV2, 'price_snapshots', 'price_snapshots_reject_mutation'],
    [schemaV2, 'provider_runs', 'provider_runs_reject_mutation'],
  ]) {
    const drop = statementOffset(
      sql,
      new RegExp(`drop trigger if exists ${trigger} on public\\.${table}`, 'i'),
      `${trigger} drop`
    );
    const backfill = statementOffset(
      sql,
      new RegExp(`update public\\.${table}\\b`, 'i'),
      `${table} backfill`
    );
    const restore = statementOffset(
      sql,
      new RegExp(`create trigger ${trigger}\\b`, 'i'),
      `${trigger} restore`
    );
    assert.ok(drop < backfill, `${trigger} is removed before the backfill`);
    assert.ok(backfill < restore, `${trigger} is restored after the backfill`);
  }
  assert.match(
    migration007,
    /lock table public\.price_snapshots, public\.provider_runs in access exclusive mode/i
  );
  assert.match(
    schemaV2,
    /lock table public\.price_snapshots, public\.provider_runs in access exclusive mode/i
  );
});

test('v2 SQL preserves XAU aliases without permitting future non-gold values in them', () => {
  assert.match(migration007, /metal_symbol = 'XAU'[\s\S]*xau_usd_per_oz is null/i);
  assert.match(migration007, /alter column xau_usd_per_oz drop not null/i);
  assert.match(migration007, /foreign key \(correction_of_observation_id\)/i);
  assert.match(migration007, /deferrable initially deferred/i);
});

test('every public observation policy hides unselected provider rows', () => {
  for (const stage of [migration006, schemaV1]) {
    const v1Policy = policyDefinition(stage, 'Public read price snapshots');
    assert.match(v1Policy, /using \(is_selected\)/i);
    assert.doesNotMatch(v1Policy, /using \(true\)/i);
  }
  const v2Policy = policyDefinition(migration007, 'Public read selected price snapshots');
  assert.match(v2Policy, /using \(is_selected and quality_state in \('accepted', 'warning'\)\)/i);
});

test('every migration stage grants approved columns only and keeps raw attempts private', () => {
  for (const migration of [migration006, migration007]) {
    assert.match(
      migration,
      /revoke all on table public\.price_snapshots from anon, authenticated/i
    );
    assert.doesNotMatch(
      migration,
      /grant select on table public\.price_snapshots to anon, authenticated/i
    );
    const publicGrant = selectedColumns(migration, 'price_snapshots');
    assert.doesNotMatch(publicGrant, /raw_payload_hash|workflow_run_id|provider_chain/);
  }
  assert.match(selectedColumns(migration006, 'price_snapshots'), /xau_usd_per_oz/i);
  assert.match(selectedColumns(migration007, 'price_snapshots'), /price_usd_per_oz/i);
  assert.doesNotMatch(
    schema,
    /grant select on table public\.price_snapshots to anon, authenticated/i
  );
  const schemaGrants = [
    ...schema.matchAll(
      /grant select \(([\s\S]*?)\) on public\.price_snapshots to anon, authenticated/gi
    ),
  ];
  assert.equal(schemaGrants.length, 2, 'schema bootstrap has restricted v1 and v2 grants');
  for (const grant of schemaGrants) {
    assert.doesNotMatch(grant[1], /raw_payload_hash|workflow_run_id|provider_chain/);
  }
  assert.match(migration007, /revoke all on table public\.provider_runs from anon, authenticated/i);
  assert.doesNotMatch(migration007, /grant select on table public\.provider_runs to anon/i);
});

test('service_role can append raw history but cannot rewrite or truncate it', () => {
  const stages = [migration006, migration007, schemaV1, schemaV2];
  for (const sql of stages) {
    for (const table of ['price_snapshots', 'provider_runs']) {
      const revoke = statementOffset(
        sql,
        new RegExp(`revoke all on table public\\.${table} from service_role`, 'i'),
        `${table} service-role revoke`
      );
      const grant = statementOffset(
        sql,
        new RegExp(`grant select,\\s*insert on table public\\.${table} to service_role`, 'i'),
        `${table} append-only service-role grant`
      );
      assert.ok(revoke < grant, `${table} broad privileges are revoked before append access`);
    }
    const healthRevoke = statementOffset(
      sql,
      /revoke all on table public\.provider_health from service_role/i,
      'provider_health service-role revoke'
    );
    const healthGrant = statementOffset(
      sql,
      /grant select,\s*insert,\s*update on table public\.provider_health to service_role/i,
      'provider_health upsert grant'
    );
    assert.ok(healthRevoke < healthGrant, 'provider_health grants only upsert privileges');
  }
  assert.doesNotMatch(
    [migration006, migration007, schema].join('\n'),
    /grant all on table public\.(?:price_snapshots|provider_runs|provider_health) to service_role/i
  );
});

test('the internal append-only function is not exposed as a Data API RPC', () => {
  for (const migration of [migration006, migration007, schemaV2]) {
    assert.match(
      migration,
      /revoke execute on function public\.reject_datacore_raw_mutation\(\)\s+from public, anon, authenticated/i
    );
  }
  assert.equal(
    [
      ...schema.matchAll(
        /revoke execute on function public\.reject_datacore_raw_mutation\(\)\s+from public, anon, authenticated/gi
      ),
    ].length,
    2,
    'schema bootstrap revokes function RPC access in both DataCore stages'
  );
});

test('pgTAP proof exercises role visibility, write denial, and both append-only triggers', () => {
  assert.match(rlsTest, /select plan\(54\)/i);
  assert.match(rlsTest, /raw_payload_hash/i);
  assert.match(rlsTest, /workflow_run_id/i);
  assert.match(rlsTest, /provider_runs/i);
  assert.match(rlsTest, /price_snapshots_reject_mutation/i);
  assert.match(rlsTest, /provider_runs_reject_mutation/i);
  assert.match(rlsTest, /set local role service_role/i);
  assert.match(rlsTest, /set local role anon/i);
  assert.match(rlsTest, /set local role authenticated/i);
  assert.match(rlsTest, /pgtap:unselected/i);
  assert.match(rlsTest, /pgtap:rejected/i);
  assert.match(rlsTest, /final public observation policy filters selected accepted\/warning rows/i);
  assert.match(rlsTest, /anon cannot insert observations/i);
  assert.match(rlsTest, /authenticated clients cannot insert provider runs/i);
  assert.match(rlsTest, /authenticated clients cannot update provider health/i);
  assert.match(rlsTest, /service_role can upsert provider health without delete or truncate/i);
  assert.match(rlsTest, /service_role cannot truncate observations/i);
  assert.match(rlsTest, /service_role cannot truncate provider runs/i);
  assert.match(rlsTest, /append-only trigger rejects owner observation updates/i);
  assert.match(rlsTest, /append-only trigger rejects owner provider-run deletes/i);
  assert.match(rlsTest, /select \* from finish\(\)/i);
});
