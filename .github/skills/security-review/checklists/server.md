# Server Checklist

```md
- [ ] Every route has explicit auth (`requireUser` / `requireAdmin` / `requireApiKey` / none-but-rate-limited)
- [ ] Every mutating route validates body against an expected shape (reject unknown fields)
- [ ] Numbers parsed safely (`Number()` + `Number.isFinite`)
- [ ] URLs / paths validated against an allowlist
- [ ] Errors returned with appropriate status codes — never `200 OK` on failure
- [ ] Error responses don't leak stack traces / SQL / internal paths
- [ ] Logs redact passwords / tokens / PINs / OTPs / Stripe secrets
- [ ] `helmet()` defaults not weakened
- [ ] CSP allowlist updated only with reason
- [ ] `app.set('trust proxy', ...)` configured correctly for the deploy environment
- [ ] Rate limiter mounted globally; tighter limits on POST/PATCH/DELETE
- [ ] CSRF protection on cookie-auth routes (where applicable)
- [ ] No `eval()` / `Function(string)` / `child_process` with user input
- [ ] `npm audit` HIGH/CRITICAL triaged
```
