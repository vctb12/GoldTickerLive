# Secrets Checklist

```md
- [ ] No real-looking values in `.env.example` (use `<placeholder>` or `change-me`)
- [ ] No `SECRET=` / `KEY=` / `TOKEN=` lines in committed `.env*` files (`.env.example` only)
- [ ] No secrets in tests / fixtures / docs / screenshots
- [ ] `grep -rE '(api[_-]?key|secret|password|token)[\"\\']?\s*[:=]\s*[\"\\'][^<\\$]' .` produces no real-looking hits
- [ ] After `npm run build`, no service-role / JWT / Stripe secret in `dist/`
- [ ] If a secret leaked: rotated + history purged + issue opened
- [ ] Secret-scanning alerts in GitHub triaged within 24h
- [ ] `.env*` files in `.gitignore` (except `.env.example`)
- [ ] MCP config in `.vscode/mcp.example.json` (placeholder only); real `.vscode/mcp.json` gitignored
```
