# Exports Checklist

For CSV / JSON exports from the tracker / calculator / developer API.

```md
- [ ] CSV: header row present, UTF-8 encoding, fields RFC 4180 quoted where needed
- [ ] JSON: stable schema, versioned (`schema_version: "1.0"`)
- [ ] Source field included (`source: "<provider>"`)
- [ ] Timezone field included (default: `UTC`)
- [ ] Resolution field included for time series
- [ ] Disclaimer field included (`disclaimer: "Reference estimate, not retail."`)
- [ ] State field included per row for time-series exports (`state: "live"|"cached"|...`)
- [ ] Numbers preserve precision (don't toFixed before export)
- [ ] Filename includes date + symbol (`gold-aed-2026-05-16.csv`)
- [ ] Content-Disposition / Content-Type set correctly for HTTP delivery
- [ ] Large exports streamed, not buffered fully in memory
- [ ] Rate-limited (API key tier-aware)
- [ ] Unit test covers: empty result, single row, > 10k rows
```
