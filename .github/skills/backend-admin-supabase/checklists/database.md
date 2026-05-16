# Database Checklist

```md
- [ ] New table added with `create table if not exists …` (idempotent)
- [ ] RLS enabled on the new table
- [ ] Explicit policies: select / insert / update / delete with the right `using` / `with check`
- [ ] Primary key + timestamps (`created_at`, `updated_at`) + appropriate indexes
- [ ] Foreign keys cascade or restrict per intent
- [ ] Migration is additive (no DROP / ALTER … DROP COLUMN without owner approval)
- [ ] Migration documented in `docs/SUPABASE_SCHEMA.md`
- [ ] Repository implemented with Supabase-first + file-fallback
- [ ] Tests cover round-trip via the file fallback
- [ ] Schema diff reviewed for destructive operations
```
