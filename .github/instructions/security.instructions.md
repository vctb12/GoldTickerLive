---
applyTo: "server/**,supabase/**,scripts/**,.github/workflows/**,config/**,.env*,**/*secret*,**/*token*,**/*key*"
---

# Security Instructions

This is a **public** repo. The threat surface is wide: secrets in git history, secrets in logs,
unscoped admin routes, Supabase service-role key in the browser, missing input validation. Read
this before touching server, workflows, env handling, or Supabase access.

## 1. Secrets — non-negotiable rules

- **Never commit a real secret.** Not in code, not in tests, not in fixtures, not in screenshots,
  not in error messages, not in markdown examples.
- `.env.example` documents **variable names only**. Use placeholders like `<your-stripe-key>`,
  not real-looking values.
- `JWT_SECRET`, `ADMIN_PASSWORD`, `ADMIN_ACCESS_PIN`, `SUPABASE_SERVICE_ROLE_KEY`, X / Twitter
  OAuth tokens, Telegram bot token, Discord webhook URL, Resend API key, Stripe secrets — all are
  **GitHub Secrets** or runtime env only.
- If a secret leaks (commit, log, screenshot), **rotate immediately** and force-purge from git
  history. Open a high-priority issue describing the rotation.
- `git secrets` / GitHub secret-scanning alerts must be triaged within 24h.

## 2. Environment variables

- Server reads env at startup. `server/lib/auth.js` throws if `JWT_SECRET`, `ADMIN_PASSWORD`, or
  `ADMIN_ACCESS_PIN` is missing — keep this behaviour.
- Frontend env (Vite `VITE_*`) is **embedded in the bundle and public**. Never put server-only
  secrets behind `VITE_*`. The Supabase **anon** key may be public; the **service-role** key
  must never be.
- Document any new env var in `docs/environment-variables.md` and `.env.example` in the same PR.

## 3. Client / server boundaries

- Browser code never imports `server/**` or `supabase/admin/**`.
- Browser uses the Supabase anon key + RLS policies.
- Admin endpoints (`/api/v1/admin/**`) are authenticated, rate-limited, and audit-logged.
- `/api/v1/public/**` is open but rate-limited and entitlement-gated.
- Public account routes (`/api/v1/me/**`) require user JWT; admin routes require admin JWT — do
  not blur.

## 4. Supabase

- Service-role key: **server-only**, never logged, never echoed, never sent over the wire to the
  browser.
- All tables that hold user data have RLS policies; never disable RLS to "make it work".
- Schema migrations: write them as SQL files under `supabase/`; review for destructive operations
  (DROP, TRUNCATE) carefully.
- Service-role queries from server code must validate inputs before composing SQL (use parameter
  binding from the Supabase client — never string-concatenate SQL).

## 5. Input validation

- All API routes validate body / query / params before use. Reject unknown fields rather than
  pass-through.
- File paths: never accept user input directly as a path. Always normalize and check against an
  allowlist root.
- URLs: validate scheme (`http`/`https` only where appropriate) and reject `javascript:`,
  `data:` for hrefs (`safeHref()` already does this for the browser).
- Numbers: parse with `Number()` + range check; reject `NaN` / `Infinity` explicitly.
- Emails: regex + length cap; do not roll a custom validator that allows control chars.

## 6. Rate limiting

- `express-rate-limit` is mounted globally. Routes that mutate (POST/PATCH/DELETE) get tighter
  limits.
- Webhooks have a separate, very narrow rate limit (and verify provider signatures).
- Avoid IP-based bypass — proxy headers are `trust proxy` aware; configure once, in `server.js`.

## 7. Dependencies

- Before adding any new dependency: run `gh-advisory-database` check.
- Pin to a specific major; let Dependabot offer minors.
- Drop unused dependencies — every dep is a future CVE.
- `npm audit` results are not blocking by default; HIGH/CRITICAL on a production dep should open
  an issue within 48h.

## 8. Path traversal / SSRF

- Never let user input reach `fs.readFile` / `fs.writeFile` / `fetch()` without an allowlist.
- HTTP fetches from server code: timeout (default 10 s), max body size, reject redirects to
  private IP ranges.

## 9. Headers (Express)

- `helmet()` is mounted. Don't disable the defaults globally.
- CSP: strict by default; if you need to allow a new origin (e.g. a new analytics provider),
  update the policy in `server.js` and document why.
- `X-Powered-By` removed.
- HSTS configured at the CDN / Pages level.

## 10. Common security mistakes to avoid

- Logging the full request body (may contain passwords, OTPs).
- Catching errors and returning the raw `err.message` to the client (info leak).
- Trusting `X-Forwarded-*` headers from an untrusted proxy.
- Using `eval()` / `Function()` on any input.
- Storing tokens in `localStorage` when an httpOnly cookie is appropriate.
- Disabling CSRF protection because "JWT in header is fine" — verify CSRF for cookie-auth routes.

## 11. Security PR checklist

```md
- [ ] No new secrets in code / fixtures / docs
- [ ] `.env.example` updated for any new env var
- [ ] All new routes have auth + rate limit + input validation
- [ ] No service-role key reaches the browser bundle
- [ ] No `eval` / `Function(string)` / `child_process` with user input
- [ ] `npm audit` and `gh-advisory-database` clean (or justified)
- [ ] Helmet / CSP not weakened
- [ ] Errors do not leak stack traces / internal paths to clients
- [ ] Tests cover the auth boundary (`tests/*auth*.test.js` style)
```

See [`docs/SECURITY_NOTES.md`](../../docs/SECURITY_NOTES.md),
[`docs/environment-variables.md`](../../docs/environment-variables.md),
[`docs/SUPABASE_SCHEMA.md`](../../docs/SUPABASE_SCHEMA.md).
