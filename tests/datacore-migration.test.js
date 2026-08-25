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
const rlsTest = fs.readFileSync(
  path.join(root, 'supabase', 'tests', 'datacore_rls.test.sql'),
  'utf8'
);

test('clean migration chain creates all DataCore relations before v2 alters them', () => {
  for (const relation of ['price_snapshots', 'provider_runs', 'provider_health']) {
    assert.match(migration006, new RegExp(`create table if not exists public\\.${relation}`, 'i'));
    assert.match(schema, new RegExp(`create table if not exists public\\.${relation}`, 'i'));
  }
  assert.match(migration007, /^begin;/m);
  assert.match(migration007, /^commit;/m);
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

test('v2 SQL preserves XAU aliases without permitting future non-gold values in them', () => {
  assert.match(migration007, /metal_symbol = 'XAU'[\s\S]*xau_usd_per_oz is null/i);
  assert.match(migration007, /alter column xau_usd_per_oz drop not null/i);
  assert.match(migration007, /foreign key \(correction_of_observation_id\)/i);
  assert.match(migration007, /deferrable initially deferred/i);
});

test('RLS grants approved columns only and keeps raw attempts private', () => {
  assert.match(
    migration007,
    /revoke all on table public\.price_snapshots from anon, authenticated/i
  );
  assert.match(
    migration007,
    /grant select \([\s\S]*price_usd_per_oz[\s\S]*\) on public\.price_snapshots/i
  );
  const publicGrant = migration007.match(
    /grant select \(([\s\S]*?)\) on public\.price_snapshots to anon, authenticated/i
  )?.[1];
  assert.ok(publicGrant);
  assert.doesNotMatch(publicGrant, /raw_payload_hash|workflow_run_id/);
  assert.match(migration007, /revoke all on table public\.provider_runs from anon, authenticated/i);
  assert.doesNotMatch(migration007, /grant select on table public\.provider_runs to anon/i);
});

test('pgTAP proof covers relation presence, approved columns, private fields, and append-only trigger', () => {
  assert.match(rlsTest, /select plan\(14\)/i);
  assert.match(rlsTest, /raw_payload_hash/i);
  assert.match(rlsTest, /workflow_run_id/i);
  assert.match(rlsTest, /provider_runs/i);
  assert.match(rlsTest, /price_snapshots_reject_mutation/i);
  assert.match(rlsTest, /select \* from finish\(\)/i);
});
