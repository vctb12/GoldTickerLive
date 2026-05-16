---
name: security-review
description: Use for secrets handling, workflows, server / Supabase / API routes, environment variables, GitHub secret-scanning remediation, and any PR that touches the security boundary.
when_to_use:
  - Adding / changing an API route
  - Touching Supabase access patterns
  - Editing workflows that reference secrets
  - Reviewing `.env.example` changes
  - Triaging a secret-scanning alert
related_files:
  - server/**
  - supabase/**
  - .github/workflows/**
  - .env.example
  - docs/SECURITY_NOTES.md
  - docs/environment-variables.md
related_prompts:
  - .github/prompts/pr-review.prompt.md
  - .github/prompts/backend-admin-supabase.prompt.md
---

# Skill: Security Review

Public repo, public site, public X channel. Security failures are public failures.

## Threat model (top 6)

1. Secret in git history (commit, fixture, doc, screenshot)
2. Service-role Supabase key in browser bundle
3. Unauthenticated / under-authenticated admin route
4. Missing input validation → injection / SSRF / path traversal
5. Workflow logs leaking secrets (via `set -x`, `env | sort`, echo)
6. Dependency CVE in production package

## Workflow

1. **Diff scan**: search the diff for secret-like strings (`key`, `secret`, `token`, `password`,
   `webhook`, `service_role`).
2. **Env scan**: any new env var documented in `.env.example` + `docs/environment-variables.md`?
3. **Auth scan**: any new route — auth applied? Rate limit applied? Input validated?
4. **Browser bundle scan**: `npm run build` → grep `dist/` for `SERVICE_ROLE_KEY`, `STRIPE_SECRET`,
   `JWT_SECRET`, etc.
5. **Workflow scan**: any `set -x` or `env | sort` near `${{ secrets.* }}`?
6. **Dependency scan**: `gh-advisory-database` on any added dep; `npm audit` for HIGH/CRITICAL.
7. **Report** findings as Blocking / Important / Nice-to-have.

## Checklists in this skill

- [`checklists/secrets.md`](./checklists/secrets.md)
- [`checklists/server.md`](./checklists/server.md)
- [`checklists/supabase.md`](./checklists/supabase.md)
- [`checklists/workflows.md`](./checklists/workflows.md)

## Common mistakes

- Real-looking placeholders in `.env.example` that someone copy-pastes into prod.
- Returning `err.message` directly to the client (info leak).
- Trusting `X-Forwarded-For` without configuring `app.set('trust proxy', ...)` correctly.
- `VITE_SUPABASE_SERVICE_ROLE_KEY` — never a thing.
- Webhook handler that doesn't verify the signature.

See [`.github/instructions/security.instructions.md`](../../instructions/security.instructions.md).
