# DataCore DC-1 live-state and continuity audit

**Audit time:** 2026-08-25 UTC

**Production activation:** none

**Evidence boundary:** GitHub Actions metadata/logs, configured anonymous Supabase REST surface,
committed data, and repository code. No service-role credential was read or printed, no database
write was attempted, and the migration was not applied.

## Result

The production gold quote pipeline is publishing current JSON, but there is no verified durable
observation history. Workflow conclusions report success while the optional Supabase step skips
every sampled write because its Node client dependency is unavailable. The configured Supabase Data
API returns `PGRST205` for every expected history/provider table, so full database inventory
requires an owner-authorized admin review after migration planning.

## Compact data-quality profile

| Measure                       |                            Verified value | Grain / denominator                                                           | Interpretation                                                                         |
| ----------------------------- | ----------------------------------------: | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Recent workflow conclusions   |                    100 success / 100 runs | Last 100 Gold Price Fetch runs                                                | Job success does not establish durable observation success                             |
| Workflow window               | 2026-08-20T12:17:04Z–2026-08-25T06:18:31Z | GitHub run creation timestamps                                                | Includes the weekend market closure                                                    |
| Expected open-market slots    |                                       793 | Five-minute UTC slots under the workflow's Sunday 21:00–Friday 20:59 contract | Schedule target                                                                        |
| Observed workflow-run slots   |                                       100 | Unique five-minute buckets                                                    | 693 expected slots had no workflow run                                                 |
| Missing open-market slot rate |                                    87.39% | 693 / 793 expected slots                                                      | GitHub schedule delivery is materially delayed/sparse                                  |
| Median run gap                |                             36.55 minutes | 99 adjacent run gaps                                                          | Far above the declared five-minute cadence                                             |
| Public Data API inventory     |              0 expected tables accessible | `price_history`, `price_snapshots`, `provider_runs`, `provider_health`        | Each returned `404 PGRST205`; missing vs unexposed cannot be distinguished anonymously |
| Sampled snapshot-sync success |                                     0 / 3 | Latest, mid-window, and earliest sampled runs                                 | All logged missing `@supabase/supabase-js` and `supabase_not_configured`               |
| Seeded static observations    |                                         1 | Verified committed XAU/USD quote at 2026-08-25T06:30:17Z                      | Honest bootstrap only; not claimed as continuous history                               |
| Seeded source transitions     |                                         0 | Chronological selected-provider changes in the one-point static bootstrap     | Metric is implemented; the bootstrap is too sparse to infer provider stability         |

## Findings

| Severity | File or page                                                                     | Issue                                                                                                                                                 | Impact                                                                                                                 | Exact fix                                                                                                                                                                                       | Repeat pattern                                                                        |
| -------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| block    | `.github/workflows/gold-price-fetch.yml` + `scripts/node/sync-price-snapshot.js` | The sync step imports an optional client that is not installed, catches the failure in non-strict mode, and lets the job finish green.                | Trust / data integrity: no durable raw observations, provider runs, health, or rollups accumulate.                     | Use the runtime's built-in `fetch` for dependency-free PostgREST writes; emit explicit schema, insert, duplicate, provider-run, and static-export outputs.                                      | Matches the repository pattern where a green workflow can mask an optional-path skip. |
| high     | Gold Price Fetch GitHub Actions schedule                                         | The declared five-minute cadence is not delivered: 87.39% of expected open-market slots were absent in the measured window.                           | Pricing / historical continuity: charts and quality rates cannot assume evenly spaced observations.                    | Compute slot identity from provider timestamps, report expected/observed/missing slots, and treat schedule completion separately from observation continuity. Do not synthesize missing prices. | New verified DataCore pattern.                                                        |
| high     | Configured Supabase Data API                                                     | Expected history/control tables return `PGRST205`; anonymous evidence cannot prove whether they are absent or intentionally unexposed.                | Reliability / operations: remote storage is not rollout-ready and static/API fallbacks cannot claim database coverage. | Author additive migration `006_datacore_observations.sql`; owner must back up, dry-run, apply, reload schema, and verify grants/RLS before strict sync.                                         | Matches prior Supabase owner-gate practice.                                           |
| high     | `supabase/schema.sql`                                                            | Existing definitions allow broad authenticated insert/update/delete on raw observations and provider telemetry.                                       | Security / data integrity: an authenticated client could mutate or delete market truth.                                | Revoke authenticated writes; grant intended public reads only; keep writes service-role-only; reject update/delete with append-only triggers.                                                   | Matches the protected RLS surface pattern.                                            |
| medium   | `server/routes/api-v1.js`                                                        | History falls from unavailable Supabase directly to a broad legacy baseline or one JSON point; no bounded DataCore manifest/rollup provenance exists. | Trust / API: consumers cannot audit coverage, reproducibility, or source mode.                                         | Prefer selected Supabase observations, then hashed static hourly/daily DataCore rollups, then explicitly labelled legacy/single-point fallbacks.                                                | Existing freshness-honesty pattern.                                                   |

## Supabase inventory and access limits

The configured anonymous REST surface returned the same `PGRST205` schema-cache error for all four
expected DataCore tables and the existing `shop_listings` probe. That is sufficient to prove the
public Data API is not currently a usable source, but not sufficient to assert that physical tables
do not exist. DC-1 therefore records the database observation count, first/last observation,
duplicate rate, and provider distribution as **unavailable pending owner migration/admin review**—
never as zero observed truth.

The migration explicitly grants exposed-table reads and RLS policies because Supabase changed new
projects so `public` tables are not automatically exposed to the Data API. See the official
[breaking-changes feed](https://supabase.com/changelog?types=breaking-change),
[database migrations guide](https://supabase.com/docs/guides/deployment/database-migrations), and
[RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Measurement definitions

- **Observation:** immutable normalized provider quote identified by schema version, symbol,
  provider, provider timestamp, and normalized USD/oz price.
- **Selected observation:** provider observation chosen by the existing gold consensus path. Only
  selected observations feed public rollups.
- **Five-minute slot:** provider timestamp floored in UTC to a five-minute boundary. Missing slots
  are reported; no price is imputed.
- **Duplicate:** a replay whose canonical observation ID already exists. The first immutable row is
  preserved.
- **Divergence event:** provider deviation greater than 300 basis points from the selected quote,
  matching the existing 3% consensus threshold.
- **Historical/static:** derived reference data. It must never be labelled live or treated as a
  retail quote.

## Limitations

- GitHub scheduled workflows are best-effort; the audit measures observed delivery, not a GitHub
  service guarantee.
- Provider telemetry was sampled from workflow logs and the current payload contract. Durable
  24-hour provider distributions cannot be reconstructed until DC-1 starts recording them.
- The single committed bootstrap point is real but too sparse for trend inference. It exists to
  prove schema/rollup/manifest reproducibility without fabricating history.
