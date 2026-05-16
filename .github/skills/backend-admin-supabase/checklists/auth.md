# Auth Checklist

```md
- [ ] Three auth realms kept distinct: user JWT, admin JWT, API key
- [ ] `server/lib/auth.js` throws at startup if `JWT_SECRET` / `ADMIN_PASSWORD` / `ADMIN_ACCESS_PIN` missing — preserve
- [ ] Passwords hashed with bcrypt (cost factor ≥ 10)
- [ ] JWT expiration set; refresh flow documented
- [ ] Sessions invalidated on password change / admin demotion
- [ ] CSRF protection on cookie-auth routes
- [ ] API key: stored hashed; raw value shown only once at creation
- [ ] API key context (`req.apiKeyContext`) includes entitlements (e.g. `historyDays`)
- [ ] OAuth (Supabase GitHub) state validated; nonces used
- [ ] Logout invalidates server-side session (if maintained) and clears client cookie
- [ ] Tests cover: missing token, expired token, wrong role, valid happy path
```
