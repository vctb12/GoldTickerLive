# Secret scan — full repository history

**Date:** 2026-04-25 · **Tool:** `gitleaks` v8.21.2 (default ruleset) · **Scope:** entire git
history after `git fetch --unshallow` (1487 commits) · **Branch scanned:**
`copilot/security-audit-find-fix-issues` and all reachable history.

> Per the prompt: **report only, no fixes pushed**. Recommended remediation steps below.

## TL;DR

**Verdict: no real secret leaks.** All seven gitleaks hits are the **Supabase _anon_ key** for the
project `nebdpxjazlnsrfmlpgeq`, which is **public-by-design** (Supabase RLS enforces access; the key
is meant to ship to browsers). No `service_role` key, Stripe secret, AWS key, or `.env` file has
ever been committed.

## How the scan was run

```bash
git fetch --unshallow origin
gitleaks detect --source . --no-banner --redact \
  --report-format json --report-path reports/gitleaks-history.json
```

Default gitleaks ruleset; full history rather than working tree only. JSON output preserved at
`/tmp/gitleaks-history.json` during the audit (not committed).

Supplementary checks (no findings):

```bash
git log --all -p -S 'service_role'   # only docs/SQL references, no values
git log --all -p -S 'sk_live_'       # nothing
git log --all -p -S 'sk_test_'       # only `sk_test_...` placeholder in docs
git log --all -p -S 'AKIA'           # nothing
git log --all --diff-filter=A --name-only | grep -E '^\.env|/\.env'  # nothing
```

## Findings — ranked

### Group 1 · Supabase anon JWTs in client config (×6) — **not a leak; public-by-design**

| Commit     | File                       | Date       | Author                    |
| ---------- | -------------------------- | ---------- | ------------------------- |
| `94c0f0af` | `lib/supabase-client.js`   | 2026-04-11 | Abdul                     |
| `79ea8064` | `admin/supabase-config.js` | 2026-04-13 | Abdul                     |
| `7a71a59a` | `config/supabase.js`       | 2026-04-13 | copilot-swe-agent[bot]    |
| `53e17fba` | `admin/supabase-config.js` | 2026-04-14 | anthropic-code-agent[bot] |
| `53e17fba` | `config/supabase.js`       | 2026-04-14 | anthropic-code-agent[bot] |
| `e5d8e1db` | `admin/supabase-config.js` | 2026-04-14 | Abdul                     |

JWT payload decoded for every match:

```json
{ "role": "anon", "iss": "supabase", "ref": "nebdpxjazlnsrfmlpgeq", "exp": 2091463190 }
```

**Why this is acceptable:**

- The `role: anon` Supabase JWT is the public key that ships in every Supabase web client. It is
  designed to be embedded in browser bundles. Authority comes from RLS policies, not from key
  secrecy.
- The repo documents this explicitly in `supabase/MASTERY.md` ("public, safe to commit") and in
  `docs/environment-variables.md`.
- The current canonical client config (`src/config/supabase.js`) still ships the same anon key —
  this is intentional and is captured as a stored agent memory ("Client-side Supabase config embeds
  SUPABASE_URL and SUPABASE_ANON_KEY in src/config/supabase.js; it's intended to be public with RLS
  enforcing access.").
- The repo's client/server boundary (ESLint `no-restricted-imports` + `typeof window` guard in
  `server/lib/supabase-client.js`) enforces that the **service-role** key cannot ship to browsers.
  This is the boundary that actually matters; gitleaks did not hit any service-role JWT in history.

### Group 2 · `supabase/MASTERY.md` "generic-api-key" hit (×1) — same anon key, in docs

| Commit     | File                  | Date       |
| ---------- | --------------------- | ---------- |
| `0c13f81c` | `supabase/MASTERY.md` | 2026-04-14 |

The hit is a documentation snippet that reproduces the same `eyJ…` anon key as Group 1, with the
inline note `"(public, safe to commit)"`. Same verdict as Group 1.

## Recommendations

These are filed for the maintainer; **no commits to the working tree are part of this PR**.

### Required (none)

No secret rotation is required. No service-role / Stripe / AWS / generic API token has ever been
committed.

### Recommended hardening (low priority)

1. **Add `gitleaks` to CI as a non-blocking advisory job.** Configure with a `.gitleaks.toml`
   allowlist for the `nebdpxjazlnsrfmlpgeq` anon JWT (`role:anon`) so future scans focus on real
   leaks. Suggested allowlist entry:

   ```toml
   [allowlist]
   description = "Supabase anon JWT — public-by-design"
   regexes = [
     '''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJ[A-Za-z0-9_-]*?cm9sZSI6ImFub24[A-Za-z0-9_-]+?\.[A-Za-z0-9_-]+'''
   ]
   ```

2. **Pre-commit hook.** Add `gitleaks protect --staged` to `.husky/pre-commit` (advisory, can be
   bypassed with `--no-verify` if needed).
3. **Document the anon-key allowlist in `supabase/MASTERY.md`** so future contributors know why
   gitleaks flags it and that the rotation path differs from real secrets.

### Rotation playbook (for the future, if a real key ever leaks)

If a `service_role` key, Stripe secret, JWT signing secret, or other credential is ever committed,
the response is **rotate first, then rewrite history**, in this order:

1. **Rotate at the issuer immediately** — Supabase dashboard → Settings → API → Reset `service_role`
   key; Stripe → API keys → Roll; GitHub → repo Settings → Secrets → update workflow secrets. The
   leaked value is permanently public and cannot be redacted from third-party mirrors / forks /
   search caches; rotation is the only real fix.
2. **Update GitHub Actions secrets** — `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
   `JWT_SECRET`, `ADMIN_PASSWORD`, `ADMIN_ACCESS_PIN`, `STRIPE_WEBHOOK_SECRET`. Verify each workflow
   that consumes them still runs.
3. **Bump deployed `JWT_SECRET`** if it leaked — this invalidates every existing admin session (the
   `tokenVersion` claim in `server/lib/auth.js` continues to apply on top of this).
4. **Remove the value from current files** with a follow-up commit; this prevents the next
   contributor from copy-pasting it back.
5. **Optionally rewrite history** with `git filter-repo --replace-text` (preferred over
   `git filter-branch`). Communicate the force-push to the team; coordinate with the in-flight PR
   list because every PR base will need to be re-anchored. **Do this only after rotation; rewriting
   history without rotation is theatre.**
6. **Add a regression rule** to `.gitleaks.toml` that matches the leaked pattern shape so the same
   class of leak is caught next time.

### Secret-manager guidance

- Server runtime secrets live in **GitHub Actions Secrets** (CI) and **Vercel / hosting env vars**
  (deploy). They are never in git, never echoed to logs, never logged via `morgan` or `console.log`.
- Local development uses `.env` files (already in `.gitignore`: `.env`, `.env.local`, `*.env.*`).
  `server/lib/auth.js` throws at module load if `JWT_SECRET` / `ADMIN_PASSWORD` / `ADMIN_ACCESS_PIN`
  are missing, so a dev environment without them fails fast rather than running with insecure
  defaults.
- Public client-side credentials (Supabase URL, anon key, Stripe publishable key) are explicitly
  embedded in client modules and tracked in `docs/environment-variables.md`.

## Sign-off

- Verified by decoding every JWT match's payload — every hit is `role: anon` for project
  `nebdpxjazlnsrfmlpgeq`. No service-role JWT in history.
- Verified by `git log -S` searches for `service_role`, `sk_live_`, `sk_test_`, and `AKIA` — no real
  values found, only docs/SQL references and placeholders.
- No `.env*` file has ever been committed (`.gitignore` covers them; `git log --diff-filter=A`
  confirms).
- **No rotation required. No fixes pushed.**
