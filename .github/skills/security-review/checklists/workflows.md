# Workflow Security Checklist

```md
- [ ] `permissions:` block explicit and minimal
- [ ] No `set -x` on steps that touch `${{ secrets.* }}`
- [ ] No `env | sort` / `cat .env*` / `echo ${{ secrets.X }}`
- [ ] Boolean inputs handled as strings (`!= 'true'`)
- [ ] Webhook URLs (Telegram / Discord) treated as secrets — never echoed
- [ ] State commits use `[skip ci]` to avoid feedback loops
- [ ] `pull_request` workflows that need write scope use `pull_request_target` only with strict review
- [ ] Third-party Actions pinned to a commit SHA (not a floating tag) for high-privilege jobs
- [ ] Cache key includes lockfile hash (no stale cache cross-Node-version)
- [ ] Artifact retention reasonable (7d logs, 30d reports)
- [ ] CodeQL findings on `main` triaged
```
