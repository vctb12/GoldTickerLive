# Operation Midas — Risk Register & Plan Ratification (Phase 4, 2026-07-16)

Sources: Phase 1 baseline, Phase 2 `ARCHITECTURE_MAP.md`, Phase 3 `AUDIT_LIVE.md`.

## Risk register

| ID  | Risk                                                                                                                                                                                                                                                                                             | Sev     | Phase         | Status                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ------------- | ----------------------------------------------------------------------- |
| R1  | **Main branch has no merge gate**: `ci.yml` `disabled_manually` since 2026-04-24 (with `health_check.yml`, `spike_alert.yml`); everything merged since then went in ungated. `agent-ci.yml` covers agent branches only.                                                                          | RED     | 4b + owner    | ci.yml e2e bug fixed in Phase 4b; **re-enable is owner-gated (Q1)**     |
| R2  | **Supabase: ~30 admin policies are `to authenticated using (true)`** incl. `site_settings` writes, orders w/ customer PII, pricing_overrides. Fix migrations 002–005 staged, never applied. Second project (`lulqcy…`) RLS disabled on 5 tables. Prod admin authz is client-side only.           | RED     | 11            | verify + harness executable; **applying migrations owner-gated (Q2)**   |
| R3  | **Zero indexable Arabic content** while advertising ar_AE three ways; `?lang=ar` alternates canonicalize to EN (contradictory signals); `/ar/` mirror designed in code but never deployed.                                                                                                       | HIGH    | 19 (rescoped) | **strategy owner-gated (Q3)**                                           |
| R4  | **No prices in served HTML, no `<noscript>`** — crawlers/no-JS see an empty price page (F1).                                                                                                                                                                                                     | HIGH    | 9             | executable; approach ratified below                                     |
| R5  | **No CSP / Permissions-Policy; weak HSTS; deprecated headers; ACAO:\*** — grade ~C/D, and GH Pages ignores `_headers`; only Cloudflare rules (console) or meta-CSP can fix.                                                                                                                      | HIGH    | 12            | repo-side executable; **Cloudflare rules owner-applied (Q5)**           |
| R6  | Troy-ounce **3-way constant drift**: pipeline 31.1034768 (Directive-2 exact) vs client `constants.js:10` 31.1035 (deny-listed file) vs mixed script copies; ~14 duplicated peg/troy literals.                                                                                                    | MED     | 5             | script consolidation executable; **constants.js edit owner-gated (Q4)** |
| R7  | Freshness classification split: `spot-resolver.classifyFreshness` trusts frozen commit-time `freshness_seconds` (file is "live" forever on that path); two threshold systems (`freshness-policy.js` vs `live-status.js`). Labels honest on probed paths today — lock with tests before touching. | MED     | 6–7           | executable                                                              |
| R8  | deploy.yml raw-copies `src/`+`data/` into dist → internal automation state public (`last_tweet_state.json` etc.); bundled-vs-raw drift; stale "6-min" comment; 30-min cron redeploys identical content.                                                                                          | MED     | 10/13/24      | executable                                                              |
| R9  | Homepage realtime engine hits `api.gold-api.com` directly from browsers as PRIMARY, contradicting `spot-resolver.js` documented invariant; UI leaks "PrimaryProvider" identifier; "$ —" placeholder artifact beside hydrated price; tracker banner duplicated.                                   | MED     | 6, 14–17      | executable                                                              |
| R10 | FX single provider (open.er-api.com) for ~40 currencies; volatile-currency honesty (LBP/EGP/TRY official vs street) unaddressed; fx-integrity sanitizer wiring unverified.                                                                                                                       | MED     | 8             | executable                                                              |
| R11 | Country links crawl-invisible (`compare.html#…`, F4); prefetch of hashed compare HTML duplicate; og:description leaks internals; meta keywords remnants; F5 24K copy contradiction.                                                                                                              | MED/LOW | 21–24         | executable                                                              |
| R12 | sw.js hand-maintained precache + `.catch(warn)` install; **sw.js is deny-listed** for agents.                                                                                                                                                                                                    | LOW     | 26            | tests executable; **sw.js edits owner-gated (Q6)**                      |
| R13 | Vite treats any stray `.html` repo-wide as an entry → build breaks (hit in Phase 1).                                                                                                                                                                                                             | LOW     | 24/25         | executable (config exclude for docs/)                                   |
| R14 | freegoldapi historical feed 5 months stale at $5,059 (27% off spot) — verify no chart splices it as recent.                                                                                                                                                                                      | LOW     | 6             | executable                                                              |
| R15 | Soft CI gates (`lighthouse warn`, `npm audit \|\| true`, `check-links \|\| true`) pass regressions silently.                                                                                                                                                                                     | LOW     | 17/25         | executable                                                              |

## Plan amendments (ratified this session, evidence-driven)

1. **Directive 7 floor = 1668/0** (was 1081, stale).
2. **Directive 3 correction:** the repo's canonical purity convention is **code/24** (`karats.js`,
   exact fractions; pipeline + client + displayed values all consistent with it). The campaign's
   table (.999/.9167/.875/.750/.5833) is itself the drifted artifact — its 22K/21K/18K/14K values
   _are_ code/24 rounded, only "24K = .999" diverges. Ratified: canonical source stays
   `src/config/karats.js` (code/24); **copy** must say "99.9%"-style fineness language consistently
   (F5 fix: FAQ "100%" → "99.9%", EN+AR). Math untouched — changing basis would silently change
   every displayed price.
3. **Scale correction:** ~17 pages, not ~390; no country-page files; Phases 19/23/24 rescoped to the
   real page set (country experience lives in compare/heatmap/market + config).
4. **Phase 9 approach ratified:** build-time injection of last-known labeled prices from
   `data/gold_price.json` into static HTML. The delivery loop already exists — every hourly price
   commit triggers `deploy.yml` — so baked prices refresh hourly with **zero new services/cost**
   (Directives 8–9 satisfied). Injected markup carries a visible `Delayed/Cached` label + timestamp;
   JS hydration upgrades honestly; add `<noscript>` note.
5. **Phase 4b added (this phase):** surgical `ci.yml` repair — the e2e job's `cp -r countries dist/`
   (deleted tree) is removed so the workflow is green-able the moment the owner re-enables it. No
   behavior change while disabled.
6. **Phases 14–16 re-pointed:** live probes found console-zero on home/tracker; the "known bugs"
   lanes start from the audit's concrete defect list (PrimaryProvider leak, "$ —" artifact,
   duplicate tracker banner, compare/world-map/portfolio verification) with a reproduce-first
   protocol; anything that doesn't reproduce is marked Refuted, not "fixed".
7. **Execution mechanics:** single designated branch (harness), per-phase commits, sequential
   implementers with file fencing (repo denies `git merge`, so parallel worktree lanes are replaced
   by sequential fenced tasks; parallel dispatch reserved for read-only work).

## Owner-Gated Decision Queue (batched — one interrupt)

| Q   | Decision needed                                                                                                                                                            | Recommendation                                                                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Re-enable `ci.yml` (Actions → CI → Enable) once Phase 4b lands                                                                                                             | **Yes** — main is ungated today; e2e blocker is fixed by 4b                                                                        |
| Q2  | Apply staged Supabase migrations 002–005 (+ decide on second project `lulqcy…`)                                                                                            | **Yes, after Phase 11 harness demonstrates current holes**; can be applied via Supabase MCP on approval                            |
| Q3  | Arabic SEO: (a) ship a real pre-rendered `/ar/` mirror at build time, or (b) stop advertising AR to crawlers (drop ar hreflang/og alternate, keep client toggle)           | **(a)** — Arabic is the region's dominant search language; (b) is honest but concedes the market. Until decided, Phase 19 is GATED |
| Q4  | Align `src/config/constants.js` TROY_OZ_GRAMS 31.1035 → 31.1034768 (file is agent-deny-listed)                                                                             | **Yes** — matches pipeline + Directive 2; display impact ≤ rounding; test fixtures updated in same change                          |
| Q5  | Apply Cloudflare header rules (CSP report-only → enforce, HSTS upgrade, Permissions-Policy, drop deprecated headers) — console action; exact ruleset delivered by Phase 12 | **Yes, staged** (report-only first)                                                                                                |
| Q6  | sw.js changes for Phase 26 (deny-listed file)                                                                                                                              | Decide when Phase 26 presents a concrete diff                                                                                      |

**Ratification result:** plan proceeds with amendments 1–7. Wave 1 (Phases 5–8 order: 5, 8, 6, 7,
then 9) next. Phases 19 GATED_PENDING_OWNER; 11/12 split into executable + gated halves.
