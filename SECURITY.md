# Security Policy

Gold Ticker Live is a bilingual gold-price reference platform. User trust is the product promise —
security reports are taken seriously.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

- Preferred: use GitHub's private vulnerability reporting — **Security → Report a vulnerability** on
  the [repository security page](https://github.com/vctb12/GoldTickerLive/security).
- Include reproduction steps, affected URLs/files, and impact. Reports on the public site
  (https://goldtickerlive.com/), the Express admin backend, the Supabase integration, or the GitHub
  Actions automation are all in scope.

You should receive an acknowledgement within a few days. Please allow reasonable time for a fix
before any public disclosure.

## Scope notes

- The deployed site is static (GitHub Pages); the Supabase **anon** key visible in client code is
  public by design and gated by Row Level Security. A working RLS bypass, however, **is** a valid
  finding.
- Secrets are never committed — production credentials live in GitHub Actions Secrets. Any secret
  found in the repository history should be reported.
- The hourly price-fetch and X-posting workflows are production-critical; vulnerabilities in those
  pipelines are high priority.

## Supporting documentation

| Doc                                                                | Contents                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| [`docs/SECURITY.md`](./docs/SECURITY.md)                           | Secret-scanning + push-protection runbook, secrets inventory (names only) |
| [`docs/SECURITY_NOTES.md`](./docs/SECURITY_NOTES.md)               | CodeQL and DOM-safety notes                                               |
| [`docs/environment-variables.md`](./docs/environment-variables.md) | Full env-var and secrets registry                                         |

Only the latest deployed version of the site is supported with security fixes.
