# API Checklist

```md
- [ ] Route lives in `server/routes/<domain>.js` (thin)
- [ ] Logic in `server/lib/` and `server/repositories/`
- [ ] Validation: body / query / params explicitly checked; unknown fields rejected
- [ ] Auth applied (`requireUser` / `requireAdmin` / `requireApiKey` / `none` + rate limit)
- [ ] Tier / entitlement check via `server/lib/entitlements.js` where applicable
- [ ] Response shape: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`
- [ ] HTTP status matches outcome (201 on POST create, 204 on DELETE, etc.)
- [ ] Errors logged server-side with correlation id; client sees safe summary
- [ ] Rate limit set
- [ ] Documented in the matching `docs/*.md` file (route table)
- [ ] OpenAPI / API docs updated if developer-facing (`docs/API_PRODUCT.md`)
- [ ] Tests: success + auth failure + validation failure + rate-limit edge
```
