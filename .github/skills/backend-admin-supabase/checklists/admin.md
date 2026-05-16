# Admin Checklist

```md
- [ ] Route under `/api/v1/admin/**`
- [ ] Auth: `requireAdmin` (admin JWT, not user JWT)
- [ ] Rate-limited (tighter than public)
- [ ] Audit log write for any mutation (actor id, route, resource id, action, timestamp)
- [ ] Confirmation required on destructive operations (UI + server double-check)
- [ ] Admin UI under `admin/` — separate assets, not bundled with public site
- [ ] Admin UI shows clear "Admin mode" indicator
- [ ] Errors don't leak SQL / Supabase internals
- [ ] Tests cover: success, missing auth, wrong-role auth (user JWT), validation failure
- [ ] Documented in `docs/ADMIN_GUIDE.md` or `docs/ADMIN_OPERATIONS_DASHBOARD.md`
```
