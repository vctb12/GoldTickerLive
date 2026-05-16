# Supabase Checklist

```md
- [ ] Service-role key used only on the server (never in `src/`, `admin/` browser bundle)
- [ ] `dist/` does NOT contain `SUPABASE_SERVICE_ROLE_KEY` after `npm run build`
- [ ] Anon key in browser is fine — but RLS policies enforce row access
- [ ] Every new table has RLS enabled (`alter table … enable row level security`)
- [ ] Every new table has explicit policies (select / insert / update / delete)
- [ ] Service-role queries scoped (no `select * from users` without a filter)
- [ ] No SQL string concatenation — use Supabase client param binding
- [ ] Migration is additive, OR includes a rollback plan
- [ ] Schema changes documented in `docs/SUPABASE_SCHEMA.md`
- [ ] Repository file-fallback (`data/*.json`) implemented for tests
- [ ] Audit log writes for admin mutations
```
