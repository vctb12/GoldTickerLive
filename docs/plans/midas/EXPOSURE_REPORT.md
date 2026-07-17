# Operation Midas — Phase 10: Secrets & Exposure Sweep

**Risk tier:** YELLOW **Date:** 2026-07-17 **Branch:**
`claude/operation-midas-goldtickerlive-6b32h3` **Scope:** Working tree, built `dist/`, bounded git
history, and public `data/` exposure via `deploy.yml`.

All credential-like values in this report are redacted to `first4…last4` + location. No secret value
is reproduced.

---

## 1. Executive summary

- **No live credential values are committed** anywhere in the working tree, the built `dist/`
  bundle, or (per bounded probes) git history. Every `sk_live` / `service_role` / `whsec_` / `AKIA`
  / `ghp_` match is an **env-var name reference, documentation example, SQL role name, or test
  placeholder** — not a real secret.
- **The only real key material shipped to the browser is the Supabase _anon_ JWT** in
  `src/config/supabase.js` and `admin/supabase-config.js`. Decoding its payload confirms
  `"role":"anon"` — **public-by-design, not `service_role`**. Accepted, no action.
- **Primary exposure (fixed here):** `deploy.yml` ran `cp -r data dist/`, raw-copying the entire
  `data/` tree onto the public CDN — publishing **13 internal automation/persistence files** that no
  browser fetches (billing, leads, newsletter subscribers, audit logs, alerts, automation runs,
  tweet history, provider state, etc.). Replaced with an **explicit public allowlist**.
- **Historically-disclosed PII** (emails inside the internal files that were on the public CDN
  before this fix) **cannot be un-published**, but contains **no credentials** → **no credential
  rotation required**. See §5.

---

## 2. Findings table

| #   | Location                                                                                                                                                                      | Type                                               | Severity        | Redacted fingerprint                               | Action                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | --------------- | -------------------------------------------------- | -------------------------------------------------------- |
| 1   | `deploy.yml` `Copy root-level statics` step (`cp -r data dist/`)                                                                                                              | Public exposure of internal state files on CDN     | **High**        | n/a (config)                                       | **Remove** — replaced with public allowlist (this PR)    |
| 2   | `src/config/supabase.js:13`, `admin/supabase-config.js:21`                                                                                                                    | Supabase **anon** JWT in browser bundle            | Info / accepted | `eyJh…DnNA` (payload `role:anon`, ref `nebd…pgeq`) | **Accepted-public** (publishable by design)              |
| 3   | `data/billing.json` (was CDN-served)                                                                                                                                          | Billing record incl. 1 email (PII)                 | Medium          | 1 email; no card/token data; `sk_/whsec_` absent   | **Remove from deploy** (this PR); historically disclosed |
| 4   | `data/audit-logs.json` (was CDN-served)                                                                                                                                       | Audit trail incl. 1 email (PII)                    | Medium          | 1 email; no credentials                            | **Remove from deploy** (this PR); historically disclosed |
| 5   | `data/alerts-v1.json` (was CDN-served)                                                                                                                                        | Alert subscriptions incl. 2 emails (PII)           | Medium          | 2 emails; no credentials                           | **Remove from deploy** (this PR); historically disclosed |
| 6   | `data/automation_runs.json`, `tweet_posts.json`, `tweet_failures.json`, `last_tweet_state.json`, `provider_state.json`, `link-audit.json`, `shops-data.json` (was CDN-served) | Internal automation/persistence state              | Low             | no emails, no credentials                          | **Remove from deploy** (this PR)                         |
| 7   | `data/leads.json`, `data/newsletter-subscribers.json`, `data/ai-drafts.json` (was CDN-served)                                                                                 | Internal capture files, currently **empty** (`[]`) | Low             | 0 records                                          | **Remove from deploy** (this PR)                         |
| 8   | Server code, docs, workflows, tests (`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `STRIPE_*`)                                                                               | Env-var **names** / placeholders — not values      | Info            | n/a                                                | **Accepted** (no secret present)                         |

### Verification of the anon key (finding #2)

Base64-decoding the JWT's middle segment yields:

```
{"iss":"supabase","ref":"nebdpxjazlnsrfmlpgeq","role":"anon","iat":1775887190,"exp":2091463190}
```

`role: anon` → this is the publishable/anonymous key, **not** the service-role key. Shipping it to
the browser is expected. `tests/supabase-data.test.js` already asserts the built bundle contains no
`service_role`; the `dist/` grep in this sweep confirms it (only the anon JWT appears).

---

## 3. What was swept (method)

1. **Working tree** — `grep -rniE` for
   `sk_live|sk_test|service_role|whsec_|xoxb|AKIA|ghp_|github_pat_|-----BEGIN|password[:=]|eyJhbGciOi`
   (excluding `node_modules`, `dist`, `.git`). All hits triaged: env-var names, docs, SQL role
   names, test placeholders, and the anon JWT (§2).
2. **Built output** — `npm run build` then the same greps over `dist/`. Result: **only** the anon
   JWT (bundled from `src/config/supabase.js` into `dist/assets/freegoldapi-*.js`). No
   `service_role`, `sk_live`, `whsec_`, `AKIA`, or PEM material.
3. **Git history (bounded)** —
   - `git log --all --diff-filter=A --name-only` for `.env`/key-like filenames → only
     `.env.example`, docs, checklists, and reports (all example/doc files); **no real `.env`,
     `.pem`, `.key`, `id_rsa`** ever committed.
   - `git log --all -S 'service_role'` / `-S 'sk_live'` → one large tooling/docs commit (`fa65714`);
     the token additions are confined to docs, skills, SQL migrations (the Postgres `service_role`
     role name is normal), reports, and tests — **no credential values**. No blobs dumped.
4. **Public data exposure** — enumerated `data/*.json`, then traced every consumer across `src/`,
   `admin/`, `sw.js`, `server/`, and `scripts/`; cross-checked against `/data/` string literals in
   the built `dist/` (ground truth for what a deployed browser fetches).

---

## 4. `data/` deploy allowlist — rationale + per-file consumer citations

`deploy.yml` previously ran `cp -r data dist/`, publishing **every** file under `data/`. The fix
ships an **explicit allowlist** — only files a deployed browser actually loads. Ground truth: the
built `dist/` references exactly `/data/gold_price.json` and `/data/last_gold_price.json`
(`/data/latest.json` in the bundle is `https://freegoldapi.com/data/latest.json`, an **external**
host, not ours).

### PUBLIC-NEEDED — kept in the allowlist

| File                   | Classification          | Client consumers (file:line)                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gold_price.json`      | PUBLIC-NEEDED           | `src/lib/api.js:111,206`; `src/lib/spot-resolver.js:7,89`; `src/lib/metal-feed-adapter.js:5,32`; `src/lib/visibility-refresh.js:6`; `src/pages/home.js:1620`; `src/pages/portfolio.js:343`; `src/pages/tracker-pro.js:248`; `src/config/constants.js:7` (`API_GOLD_URL`); `admin/pricing/index.html:774`; `admin/shared/admin-data.js:7`; `admin/social/index.html:1912`; **precached by `sw.js:36`** |
| `last_gold_price.json` | PUBLIC-NEEDED           | `src/pages/market.js:212,221` (`fetch(...)`); `src/lib/quote-providers/last-gold-price-provider.js:6`; `src/lib/quote-providers/last-gold-price-parse.js:4`; **precached by `sw.js:36`**                                                                                                                                                                                                              |
| `shops.js`             | PUBLIC-SAFE (fail-open) | Public shop directory. Imported/**bundled at build** by `src/pages/shops.js:2` and `src/search/searchIndex.js:8`, and read by `scripts/node/inject-schema.js:54` for JSON-LD. **Not runtime-fetched** from `/data/`, so strictly redundant — but it is already-public, non-sensitive data, so it is kept **fail-open** to avoid breaking any relative-path leaf-page loader. Flagged.                 |
| `index.html`           | PUBLIC (directory stub) | The `noindex,nofollow` "Not a public page" `/data/` directory index. Vite also emits it as an HTML entry (`data/` is not in `EXCLUDE_DIRS`); the explicit copy keeps behavior deterministic. Task requirement: preserve `dist/data/index.html`.                                                                                                                                                       |

### INTERNAL — removed from the deploy (never client-fetched)

Each is read **only** by `server/` routes or `scripts/` — never by a browser:

| File                                      | Sole consumer(s)                                                                                                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `billing.json`                            | `server/lib/billing-repository.js:9,28`                                                                                                                       |
| `leads.json`                              | `server/repositories/leads.repository.js:7,17`                                                                                                                |
| `newsletter-subscribers.json`             | `server/repositories/newsletter.repository.js:7,19`; `server/routes/newsletter.js:13`                                                                         |
| `audit-logs.json`                         | `server/lib/audit-log.js:10`; `server/repositories/audit.repository.js:7,22`                                                                                  |
| `alerts-v1.json`                          | `server/routes/alerts.js:56`; `server/routes/admin/index.js:33`                                                                                               |
| `automation_runs.json`                    | `scripts/python/post_gold_price.py:50`; `server/routes/admin/index.js:30`                                                                                     |
| `ai-drafts.json`                          | `server/repositories/ai-drafts.repository.js:8,38`                                                                                                            |
| `shops-data.json`                         | `server/lib/admin/shop-manager.js:11`; `server/repositories/shops.repository.js:7,28`; `scripts/node/pre-deploy-check.js`; `server/scripts/verify-shops.js:4` |
| `last_tweet_state.json`                   | `scripts/python/tweet_guard.py:3`; `scripts/python/post_gold_price.py`; `scripts/python/gold_bakeoff_readiness.py`                                            |
| `provider_state.json`                     | `scripts/python/fetch_gold_price.py:11`; `scripts/python/gold_bakeoff_readiness.py`                                                                           |
| `tweet_posts.json`, `tweet_failures.json` | Python automation persistence (X-post pipeline); no browser reference                                                                                         |
| `link-audit.json`                         | `scripts/node/link-audit.js:5` (build/CI artifact)                                                                                                            |

> `last_gold_price.json` is the **only** overlap between "written by automation" and "fetched by the
> client" — it is the published fallback reference price, so it stays PUBLIC-NEEDED.

**Fail-open note:** where a file's consumption was arguably ambiguous (`shops.js`), it was
**included** in the allowlist rather than dropped, per the phase directive. No file whose only
readers are `server/`/`scripts/` was kept.

The guard test `tests/deploy-data-allowlist-guard.test.js` locks this in: it fails on any
reintroduced blanket `cp -r data dist/`, any missing public file, or any copy of an internal file.

---

## 5. Rotation & owner-queue recommendations

- **Credential rotation: NOT required.** No credential value (Stripe key, service-role key, webhook
  secret, admin password, X/Twitter token) is present in the working tree, `dist/`, git history, or
  inside any `data/*.json` file. The only browser-shipped key is the Supabase **anon** JWT, which is
  publishable by design.
- **Historically-disclosed PII (owner-gated, informational).** Before this fix, the CDN served
  internal files containing emails: `billing.json` (1), `audit-logs.json` (1), `alerts-v1.json` (2).
  These were publicly reachable at `goldtickerlive.com/data/<file>.json` and **cannot be
  un-published retroactively** (CDN/caches/archives). This PR stops future exposure. Because the
  disclosed data is PII (emails) and **not credentials**, the remediation is: (a) confirm the fix
  deploys, (b) optionally request cache/Archive purge for those `/data/` paths, (c) note the
  disclosure in the owner privacy log. No key rotation.
- **Owner queue:**
  1. Merge + deploy this PR so the allowlist takes effect (removes 13 internal files from the CDN).
  2. Consider purging CDN/`web.archive.org` copies of the historically-served internal `/data/` JSON
     paths.
  3. Longer term: migrate the remaining server-persistence JSON files off the repo tree entirely
     (they are Supabase-backed already per `server/lib/*-repository.js`), so no future `deploy.yml`
     regression can republish them.

---

## 6. Files changed by this phase

- `.github/workflows/deploy.yml` — replaced the blanket `cp -r data dist/` with an explicit,
  commented public allowlist (**data copy step only**; triggers/cron/permissions untouched).
- `tests/deploy-data-allowlist-guard.test.js` — new tripwire test (4 assertions).
- `docs/plans/midas/EXPOSURE_REPORT.md` — this report.
