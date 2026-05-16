# Provider Bakeoff / Smoke Checklist

```md
## Adapter
- [ ] New provider adapter implements the shared interface
- [ ] Provider keys via env, never inline
- [ ] Timestamps surfaced from upstream (don't fabricate)
- [ ] Failure modes mapped to repo's states (`live`/`cached`/`delayed`/`fallback`)

## Smoke (`pr-provider-smoke.yml`)
- [ ] Job runs on PR
- [ ] Hits provider with a low-volume probe
- [ ] Reports freshness, latency, response size
- [ ] Fails the PR if response is empty or > 60s stale

## Bakeoff (`gold-provider-bakeoff.yml`)
- [ ] Scheduled run produces a scorecard (freshness, latency, cost, gap behaviour)
- [ ] Scorecard written to `reports/`
- [ ] Migration note in `docs/gold-price-provider-bakeoff.md`

## Migration discipline
- [ ] New provider does NOT replace production in the same PR
- [ ] At least one full bakeoff window observed before switching
- [ ] `docs/gold-price-provider-migration.md` updated when switching
```

See [`docs/gold-price-provider-bakeoff.md`](../../../../docs/gold-price-provider-bakeoff.md).
