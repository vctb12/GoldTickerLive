# Historical Data Checklist

```md
- [ ] Time-series response declares resolution: `1m` / `5m` / `1h` / `1d` / `1w`
- [ ] Range presets snap to provider-available resolutions, not arbitrary windows
- [ ] Gaps (market closed, outages) are visible — null / undefined rendered as gap, not interpolated
- [ ] If interpolation is intentional, data is labelled `interpolated`
- [ ] Timestamps in UTC; client formats to user locale
- [ ] No "today's open / yesterday's close" without a clear timezone reference
- [ ] Chart axis label includes the resolution
- [ ] Archive / historical pages link to methodology
- [ ] If aggregating (e.g. minute → hour), the aggregation rule is documented
- [ ] Resolution > 1d uses provider's daily close, not synthetic averaging
- [ ] Unit tests cover an empty range, a single-point range, and a range crossing a gap
```
