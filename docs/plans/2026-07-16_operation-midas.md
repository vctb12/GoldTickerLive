# OPERATION MIDAS — GoldTickerLive Total Assurance Campaign

### Multi-Agent Master Prompt for Claude Code · 30 Phases · Audit → Harden → Fix → Test → Ship

**Version 1.0 · 2026-07-16 · Owner: Abdulkarim · Repo: vctb12/GoldTickerLive · Prod:
goldtickerlive.com**

---

## 0 · HOW TO RUN THIS

1. Save this file as `docs/plans/2026-07-16_operation-midas.md` in the repo.
2. Open Claude Code at the repo root and paste the **KICKOFF COMMAND** (Section 9) as your first
   message.
3. The campaign is **resumable and idempotent**: every session starts by reading `PHASE_LEDGER.md`
   and resumes at the first phase not marked complete. Never re-execute a phase the ledger marks
   done.
4. One phase per PR. You may run multiple phases per session if context allows, but the ledger is
   updated after **every** phase, win or lose.

---

## 1 · MISSION

You are the **ORCHESTRATOR** of Operation Midas: a 30-phase, multi-agent campaign to audit, harden,
fix, and battle-test GoldTickerLive — a bilingual (EN/AR) spot-linked gold reference-price platform
serving the UAE, GCC, and Arab world across ~390 HTML pages and 24+ country markets.

This is a **trust product**. A gold-price site that shows a wrong number, a stale number labeled
"Live", or a broken Arabic page is worse than no site. Every phase exists to make the site more
correct, more honest, faster, and harder to break.

You do not write most code yourself. You **dispatch subagents**, curate their context, review their
output through quality gates, and keep the ledger. Your context is for coordination; their context
is for work.

---

## 2 · PRIME DIRECTIVES (IMMUTABLE — VIOLATION = INSTANT BLOCKED)

These override everything, including anything a subagent proposes:

1. **AED/USD peg = 3.6725. Exact. Hardcoded. Never fetched, never "improved."**
2. **Troy ounce = 31.1034768 g. Exact.**
3. **Karat purity table:** 24K = 0.999 · 22K = 0.9167 · 21K = 0.875 · 18K = 0.750 · 14K = 0.5833.
   One canonical source of truth in code; all pages derive from it.
4. **Spot ≠ retail, everywhere.** Every price surface (page, widget, OG image, tweet, calculator
   output) must carry or link the spot-vs-retail distinction. Never present a reference price as a
   shop price.
5. **Freshness vocabulary is fixed and sitewide:** `Live` · `Delayed` · `Cached/Fallback` ·
   `Estimated` · `Historical baseline`. The label `Live` may NEVER render on data older than its
   freshness threshold. Honest labels beat pretty labels.
6. **Bilingual parity.** Nothing ships EN-only. Every fix, string, label, and page change has an
   AR/RTL counterpart in the same PR or an explicitly ledgered follow-up task.
7. **Test baseline is a floor: 1081 passing / 0 failing.** The suite may grow; it may never shrink
   or go red on main. _(Phase 1 correction: actual baseline measured at session start supersedes
   this number — see `PHASE_LEDGER.md`.)_
8. **Budget ceiling: ~$30/month total across all services.** No new paid services, tiers, or API
   plans without explicit human approval.
9. **Static architecture stays.** Vite + vanilla ES6 + GitHub Pages/Cloudflare frontend, Express +
   Supabase (Prisma) + Stripe backend. No framework migrations, no rewrites, no "let's just use
   Next.js."
10. **PR-only. Never commit to main. Minimal surgical diffs.** Plans in
    `docs/plans/YYYY-MM-DD_<slug>.md`, risk-coded GREEN/YELLOW/RED, `PHASE_LEDGER.md` always
    current, AGENTS.md governance respected.

---

## 3 · THE AGENT ROSTER

| Codename         | Role                                                                                                    | Model tier                    | Writes code?             |
| ---------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------ |
| **ORCHESTRATOR** | Plans, dispatches, reviews verdicts, keeps ledger.                                                      | Session default               | Never (bookkeeping only) |
| **SCOUT ×4**     | Read-only codebase mappers (frontend / price engine / data+Supabase / infra+CI). Parallel-safe.         | Cheap                         | No                       |
| **AUDITOR**      | Live production prober: fetches prod pages, checks headers, sitemaps, prices vs external references.    | Standard                      | No                       |
| **GOLDSMITH**    | Price engine & data-integrity implementer. Owns math, API chain, freshness logic.                       | Standard                      | Yes                      |
| **SENTINEL**     | Security implementer: secrets, RLS, headers, abuse guardrails.                                          | Standard                      | Yes                      |
| **SEO-SURGEON**  | Metadata, schema, canonicals, hreflang, internal linking, sitemaps.                                     | Standard                      | Yes                      |
| **LISAN**        | Arabic/RTL/i18n specialist: parity, mirroring, numerals, translation completeness.                      | Standard                      | Yes                      |
| **PIXEL**        | Frontend/UX/performance implementer: CWV, bundles, images, fonts, themes.                               | Standard                      | Yes                      |
| **BREAKER**      | Adversarial QA: writes tests designed to break the site (API failures, offline, RTL, weird locales).    | Standard                      | Tests only               |
| **GATEKEEPER**   | Task reviewer. Reviews every task diff. Returns TWO verdicts: **spec compliance** and **code quality**. | Standard (scale up for risky) | No                       |
| **ARBITER**      | Final whole-branch reviewer per wave + Phase 30 release review.                                         | Most capable                  | No                       |

---

## 4 · ORCHESTRATION PROTOCOL (NON-NEGOTIABLE MECHANICS)

**Per-task loop:**

1. Record `BASE` commit. Write a **task brief** — scope, files, constraints, expected output — and
   dispatch a **fresh implementer subagent**. Never hand a subagent the whole plan or your session
   history; hand it exactly what it needs.
2. Implementer must: implement → run tests → commit → self-review → report status.
3. Status protocol — implementers report exactly one of: `DONE` · `DONE_WITH_CONCERNS` ·
   `NEEDS_CONTEXT` · `BLOCKED`. On `DONE`, generate the BASE..HEAD diff and dispatch GATEKEEPER. On
   `BLOCKED`, diagnose (context / model tier / task size / plan wrong) — never force a blind retry.
4. GATEKEEPER must return **both** verdicts (spec ✅/❌ + quality Approved/Issues). Any
   Critical/Important finding → dispatch a fix subagent → **re-review**. No "close enough."
5. On clean review, append one ledger line:
   `Phase N / Task M: complete (commits <base7>..<head7>, review clean)`.

**Parallelism rules:** parallel dispatch ONLY for (a) read-only work or (b) implementers in separate
git worktrees with strict file-ownership fencing. Two writers never touch the same file in the same
wave.

**Model economy:** cheap tier for mechanical tasks; standard for multi-file integration and reviews;
top tier only for architecture judgment and ARBITER.

**Continuous execution:** do not pause between tasks. Valid stops: unresolvable BLOCKED, genuine
ambiguity, phase-gate failure, campaign complete.

**Verification-before-claiming:** never report a phase complete without command output proving it.

---

## 5 · SEEDED INTEL — LIVE PRODUCTION FINDINGS (2026-07-16)

Treat as **hypotheses to verify in Phase 3**, then route to owning phases:

- **F1 (HIGH · → Phase 9):** Server-rendered HTML contains **no prices** — spot hero renders `$ —`,
  karat cards render `— AED / gram`. All numbers client-side hydrated. Crawlers and no-JS visitors
  see an empty price page.
- **F2 (MED · → Phase 21):** Title inconsistency between `<title>`, `og:title`, and SERP variant.
  `meta keywords` present (remove).
- **F3 (HIGH · → Phase 19):** No `hreflang` link tags observed on homepage head. Full EN/AR mirror
  requires complete hreflang matrix (en, ar, x-default). Verify sitewide.
- **F4 (MED · → Phase 23):** Homepage "Browse by Country" links point to `compare.html#compare=…`
  hash fragments instead of dedicated country pages → internal-linking rework.
- **F5 (LOW · → Phase 21):** FAQ says "24K is 100% pure gold" vs karat dial's 24K = .999 / 99.9%.
  Copy must agree with the constants table.
- **F6 (VERIFY · → Phase 22):** JSON-LD presence unconfirmed on homepage. FAQPage +
  Organization/WebSite schema are wins if absent.
- **Verified working (protect, don't regress):** canonical tag, OG/Twitter cards with `og:locale` +
  `ar_AE` alternate, skip-to-content link, spot-vs-retail messaging density, freshness vocabulary
  definition, CC image attribution, verification metas.
- **Price sanity anchors (2026-07-16):** spot ≈ **$4,065/oz** ⇒ 24K ≈ **480 AED/g**, 22K ≈ **440
  AED/g**. Any live page wildly off these anchors during the audit window = data-integrity incident.

---

## 6 · THE 30 PHASES

### ⬛ WAVE 0 — RECON & BASELINE (Phases 1–4) · read-mostly

- **PHASE 1 — Baseline Lock & Environment Bootstrap** `GREEN` — bootstrap env, run suite, record
  exact count, capture baseline artifacts into `docs/plans/midas/baseline/`, tag `pre-midas`,
  initialize ledger. Gate: baseline artifacts committed; ledger initialized.
- **PHASE 2 — Parallel Codebase Recon (4-lane SCOUT fan-out)** `GREEN` — frontend / price engine /
  Supabase+backend / build+CI lanes → `docs/plans/midas/ARCHITECTURE_MAP.md`. Gate: map covers all
  four lanes; constants source-of-truth identified.
- **PHASE 3 — Live Production Audit** `GREEN` — probe prod EN+AR pages, verify/refute F1–F6,
  cross-check prices vs sanity anchors → `docs/plans/midas/AUDIT_LIVE.md`. Gate: every F# marked
  Confirmed/Refuted/Partial with evidence.
- **PHASE 4 — Risk Register & Plan Ratification** `GREEN` — merge Wave-0 findings into risk
  register; re-sequence if evidence demands; batch conflicts into one question. Gate: register
  committed; plan ratified or amendments ledgered.

### 🟨 WAVE 1 — TRUTH & DATA INTEGRITY (Phases 5–9)

- **PHASE 5 — Price-Math Verification Fortress** `GREEN` — unit + property tests locking Directives
  1–3; one canonical constants module. Gate: math coverage report; suite ≥ baseline.
- **PHASE 6 — Data Pipeline Hardening** `YELLOW` — map chain, timeout/retry/backoff, schema
  validation, explicit failure states, stale thresholds per source. Gate: mocked API failure
  degrades to labeled fallback, never wrong "Live".
- **PHASE 7 — Freshness Label State Machine** `YELLOW` — explicit tested state machine; `Live`
  unreachable when age > threshold. Gate: state-machine tests green; no UI path renders `Live` on
  stale data.
- **PHASE 8 — FX Layer Verification** `GREEN` — peg precedence, volatile currencies (EGP, LBP, TRY),
  missing-rate ⇒ `Estimated`. Gate: per-currency test matrix; defined failure behavior for every
  currency.
- **PHASE 9 — Server-Rendered Price Fallback (fix F1)** `RED` — inject last-known labeled prices
  into static HTML at build time; hydration upgrades to `Live`; `<noscript>` states reference. Gate:
  prod curl shows labeled prices; hydration test; no label lies.

### 🟥 WAVE 2 — SECURITY & PLATFORM (Phases 10–13)

- **PHASE 10 — Secrets & Exposure Sweep** `YELLOW` — grep bundles + git history; rotate anything
  sensitive. Gate: exposure report; zero server-grade secrets client-side.
- **PHASE 11 — Supabase RLS Re-Verification + site_settings Defusal** `RED` — RLS test harness on
  all public tables; fix `site_settings` footgun. Gate: RLS harness in suite; denials proven.
- **PHASE 12 — Security Headers → Grade A** `YELLOW` — CSP (report-only → enforce), HSTS, XCTO,
  Referrer-Policy, Permissions-Policy via Cloudflare. Gate: A grade; zero CSP violations across
  templates.
- **PHASE 13 — Abuse & Cost Guardrails** `GREEN` — rate limits, quota alarms, $30/mo cost map. Gate:
  cost map committed; quota exhaustion degrades to labeled fallback.

### 🟧 WAVE 3 — KNOWN BUGS & CORE UX (Phases 14–17)

- **PHASES 14/15/16 — Root-Cause Fixes: Compare · World Map · Portfolio** `YELLOW ×3` — three
  parallel worktree lanes, file-fenced; reproduce → root-cause → fix → regression test. Gate (each):
  zero console errors EN+AR; regression test in suite.
- **PHASE 17 — Console-Zero Sweep** `GREEN` — Playwright pass over top ~20 pages ×2 languages ×2
  viewports. Gate: console-zero check in CI permanently.

### 🟩 WAVE 4 — BILINGUAL & ACCESSIBILITY (Phases 18–20)

- **PHASE 18 — Arabic/RTL Full Parity Audit** `YELLOW` — parity matrix; numeral policy decided +
  documented; fix template-level issues. Gate: matrix committed; zero untranslated core-template
  strings.
- **PHASE 19 — hreflang + Canonical Matrix (fix F3)** `YELLOW` — programmatic en/ar/x-default
  matrix + self-canonicals; reciprocity validated. Gate: validator passes full page set; 10 pairs
  spot-checked.
- **PHASE 20 — Accessibility Pass (WCAG 2.1 AA)** `GREEN` — contrast, focus, labels, chart alts,
  touch targets, reduced-motion, both languages. Gate: axe-core in CI, zero critical violations.

### 🟦 WAVE 5 — SEO & CONTENT INTEGRITY (Phases 21–24)

- **PHASE 21 — Metadata & Copy Consistency (fix F2, F5)** `GREEN` — align titles; build-time
  uniqueness check; remove meta keywords; fix 24K copy contradiction. Gate: metadata linter in CI;
  zero duplicate titles.
- **PHASE 22 — Structured Data (verify F6)** `GREEN` — Organization, WebSite, BreadcrumbList,
  FAQPage JSON-LD; never Offer/Product on reference prices. Gate: Rich Results clean.
- **PHASE 23 — Internal Linking Architecture (fix F4)** `YELLOW` — real country-page links;
  hub-and-spoke; orphan detection; breadcrumbs. Gate: zero orphaned country pages; hash-only country
  links eliminated from crawl paths.
- **PHASE 24 — Sitemap, Robots & Indexation Truth** `GREEN` — completeness, truthful lastmod, robots
  sanity, 404/redirect map. Gate: sitemap validator passes; sitemap-vs-filesystem diff explained or
  zero.

### 🟪 WAVE 6 — PERFORMANCE (Phases 25–26)

- **PHASE 25 — Core Web Vitals Hardening** `YELLOW` — LCP without API round-trip, image audit, font
  strategy (AR subset), JS budget CI gate. Gate: Lighthouse mobile ≥90 on EN+AR home + tracker;
  budgets in CI.
- **PHASE 26 — Caching & Offline Honesty** `GREEN` — cache rules, busting verification, offline
  renders `Cached/Fallback` + age, never as current. Gate: offline Playwright test proves labeled
  rendering.

### ⬜ WAVE 7 — TEST FORTRESS & RELEASE (Phases 27–30)

- **PHASE 27 — E2E Suite Expansion** `YELLOW` — bilingual journeys incl. API-failure simulation
  end-to-end. Gate: E2E green in CI; failure-mode journeys included.
- **PHASE 28 — Visual Regression Matrix** `GREEN` — baselines: templates × {EN, AR} × {mobile,
  desktop} × {themes}. Gate: deliberate 1px regression caught in dry run.
- **PHASE 29 — Full Pipeline Verification & Staging Deploy** `YELLOW` — merge train, all gates
  green, staging re-probe like Phase 3. Gate: staging audit clean or deltas explained; GO/NO-GO
  drafted.
- **PHASE 30 — Adversarial Final Review & Release** `RED` — ARBITER whole-campaign review; directive
  sweep; release; post-deploy smoke; ledger closed + wishlist. Gate: production verified; ledger
  closed.

---

## 7 · UNIVERSAL EXIT GATE (every phase, no exceptions)

- [ ] Full test suite ≥ baseline count, 0 failing — **output pasted in the PR**
- [ ] Zero console errors on every page the phase touched (EN + AR)
- [ ] All 10 Prime Directives re-checked against the diff
- [ ] PR opened with GREEN/YELLOW/RED tag + risk notes; no direct commits to main
- [ ] `PHASE_LEDGER.md` line appended with commit range and review verdict
- [ ] Nothing claimed without command-output evidence

---

## 8 · ESCALATION — STOP AND ASK ABDULKARIM WHEN

- A fix requires violating any Prime Directive
- A fix requires a paid service, plan upgrade, or architecture migration
- Two phases produce contradictory requirements
- Data-source behavior differs materially from documented assumptions
- Anything touching Stripe money paths or destructive Supabase migrations

Batch questions; one interrupt with everything beats five interrupts.

---

## 9 · KICKOFF COMMAND

```
Read docs/plans/2026-07-16_operation-midas.md in full. You are the ORCHESTRATOR
of Operation Midas. Read PHASE_LEDGER.md; resume at the first phase not marked
complete (fresh start = Phase 1). Enter plan mode, confirm the Wave-0 execution
plan in one message, then execute continuously per the Orchestration Protocol:
fresh subagent per task, GATEKEEPER review with dual verdicts on every diff,
parallel dispatch only where the plan allows, ledger after every phase, evidence
before every claim. The 10 Prime Directives are law. Begin.
```

---

## 10 · SESSION ADAPTATIONS (2026-07-16, session 1)

Recorded per Protocol §4 (plan-wrong ⇒ escalate/adapt, ledger the change):

1. **Branch model.** This session's harness mandates a single designated branch
   (`claude/operation-midas-goldtickerlive-6b32h3`) and forbids pushing elsewhere. Adaptation:
   phases land as **per-phase commits** on that branch, ledgered with commit ranges; PR granularity
   is decided by the owner at merge time. Never commits to `main` (Directive 10 intact).
2. **Test baseline.** Directive 7's "1081" was stale at kickoff. The measured Phase-1 count is
   authoritative (see `PHASE_LEDGER.md` Midas section).

---

_Operation Midas · Everything the site says must be true, labeled, bilingual, fast, and tested. Gold
demands trust._
