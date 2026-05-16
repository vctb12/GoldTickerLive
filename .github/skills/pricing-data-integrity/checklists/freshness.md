# Freshness Checklist

```md
- [ ] Every visible price has a state: `live` / `cached` / `delayed` / `estimated` / `fallback` / `closed`
- [ ] State label rendered via the shared freshness component (not reinvented per page)
- [ ] Source name visible adjacent to price
- [ ] Timestamp in UTC, rendered in user locale via `Intl.DateTimeFormat`
- [ ] `live` budget defined (e.g. ≤ 60 s); beyond that → `delayed`
- [ ] `cached` set explicitly when SW / in-memory cache serves the response
- [ ] `fallback` set when provider failed and prior snapshot is used
- [ ] `estimated` set on calculator + retail-context surfaces (default)
- [ ] No silent stale: if no state can be determined, page shows a banner and skips the price
- [ ] `aria-live="polite"` on the price card so screen readers announce updates
- [ ] No layout shift when state changes (reserve space for the label)
- [ ] State labels translated for AR
```
