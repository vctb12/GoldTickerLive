# PR Backlog Convergence Report — 2026-07-10

**Coordinator:** Claude Code (sole coordinator, owner-authorized backlog integration) **Protected
checkpoint:** branch `integration/pre-60-pr-convergence` + annotated tag
`pre-pr-convergence-2026-07-10` (both at `origin/main` = `7dd6f1997`). **Auth:** `gh` CLI =
**vctb12**, scopes `repo` + `workflow` → can merge PRs. Never `--dangerously-skip-permissions`;
never force-push main. **Canonical tracker:** `docs/AGENT_MASTER_TRACKER.md` (do not fork). This
report is the working ledger; final dispositions are mirrored into the tracker.

> STATUS: **PART I complete (inventory + freeze). Awaiting owner go-ahead before any merge.** No PR
> has been merged by this coordinator. CI columns are the current GitHub rollup (non-Cursor checks);
> "conflict" / "independent rerun" columns are filled during Part II execution.

## Environment snapshot (VERIFIED)

- `git worktree list`: main worktree `/Users/abdulkarim/GoldTickerLive` (this coordinator); a
  **separate** worktree `~/Documents/Codex/.../GoldTickerLive-fix` holds
  `codex/fix-overnight-agent-automation` — different working directory, never shared my index. Left
  untouched.
- Open PRs: **41**. Recently merged by the other fleet: **#608–#611** (learn-hub scroll-dwell,
  freshness-badge metadata lock, karat purity-map lock, batch-review guide) — main has moved; my
  guards must be re-checked against current main for overlap.
- `main` HEAD `7dd6f1997` (tip is routine `chore(data)` price commits).
- 3 open PRs currently show a **failing non-Cursor check** and must be triaged before merge: **#593,
  #596, #612**.

## Immutable invariants enforced during convergence

AED peg **3.6725**; troy oz = repo canonical constant (do not introduce a competing rounded value in
production); karat purity = karat÷24; spot/reference ≠ retail; never invent a price (missing →
unavailable/pending/delayed/cached/estimated, honestly labeled); EN/AR parity + RTL; AI text
descriptive/backward-looking only; **all** multi-metal/crypto production feeds and pilots stay OFF;
no secrets; no prod DB writes; no `--dangerously-skip-permissions`; no force-push main.

---

## Disposition legend

`merge` = ready, land as-is after rebase + revalidate · `update-then-merge` = needs a
fix/rebase/flag check first · `combine` = fold into a sibling · `close-superseded` = valid work
already landed elsewhere · `close-invalid` = broken/duplicate/unsafe · `blocked` = owner-gated
activation.

## Per-PR table (Part I inventory; CI = non-Cursor rollup)

| PR   | Title (short)                                            | Head branch                       | Files | CI      | Overlap / dependency                   | Owner-gate / flag                                                                        | Proposed disposition                                               |
| ---- | -------------------------------------------------------- | --------------------------------- | ----- | ------- | -------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| #589 | Ph46 footer/favicon/history backfill                     | claude/revamp-phase-46-…          | 12    | 7/0     | history/footer; wave A                 | none (verify no live-workflow edit)                                                      | update-then-merge (A)                                              |
| #590 | Ph47 freshness hysteresis flap fix                       | …phase-47-freshness-hardening     | 3     | 7/0     | freshness; wave A; rel #609(merged)    | none                                                                                     | update-then-merge (A)                                              |
| #591 | Ph48 data-source health dashboard                        | …phase-48-datasource-health       | 4     | 7/0     | feature-flags.js (wave D)              | flag OFF                                                                                 | update-then-merge (D)                                              |
| #592 | Ph49 price-calc audit trail                              | …phase-49-price-audit-trail       | 3     | 7/0     | pricing display; wave D                | flag OFF                                                                                 | update-then-merge (D)                                              |
| #593 | T1.1 secondary-source cross-val (live lane)              | claude/t11-secondary-…            | 7     | **6/1** | cross-validation; wave D               | **flag OFF; live=owner-gated**                                                           | update-then-merge (fix failing check; keep OFF)                    |
| #594 | Ph50 stale-price protection                              | …phase-50-stale-price             | 4     | 7/0     | freshness; wave D                      | flag OFF                                                                                 | update-then-merge (D)                                              |
| #595 | CSS token cleanup slice 1                                | css-token-cleanup-01              | —     | 7/0     | design tokens; wave F                  | none                                                                                     | update-then-merge (undraft after lint/stylelint/visual)            |
| #596 | Ph52 FX-rate integrity                                   | …phase-52-fx-integrity            | 4     | **6/1** | FX; wave D                             | flag OFF                                                                                 | update-then-merge (fix failing check)                              |
| #597 | CSS admin badge → --purple token                         | css-token-cleanup-02              | —     | 7/0     | design tokens; wave F                  | none                                                                                     | update-then-merge (undraft after validation)                       |
| #598 | Ph53 country retail-premium model                        | …phase-53-country-premium         | 3     | 7/0     | pricing model; wave D                  | flag OFF (premium≠spot)                                                                  | update-then-merge (D)                                              |
| #599 | Ph54 karat-formula regression lock                       | …phase-54-karat-formula-tests     | 2     | 5/0     | **overlaps merged #610 + my #621**     | none                                                                                     | update-then-merge / combine (dedup vs #610/#621)                   |
| #600 | Ph55 calculator localized numeric input                  | …phase-55-calculator-edge         | 5     | 7/0     | calculator; wave D                     | flag OFF                                                                                 | update-then-merge (D)                                              |
| #601 | Ph56 multi-metal comparison view-model                   | …phase-56-metal-comparison        | 3     | 7/0     | multi-metal wave E                     | **pilot OFF; no XAG/XPT/XPD data**                                                       | update-then-merge (E, flags OFF)                                   |
| #602 | Ph57 multi-metal feed adapter                            | …phase-57-metal-feed-adapter      | 3     | 7/0     | multi-metal wave E                     | pilot OFF; no fabricated feed                                                            | update-then-merge (E)                                              |
| #603 | Ph58 per-metal freshness view-model                      | …phase-58-metal-freshness         | 3     | 7/0     | multi-metal wave E                     | pilot OFF                                                                                | update-then-merge (E)                                              |
| #604 | Ph59 metal+grade selection state/URL                     | …phase-59-metal-selector          | 3     | 7/0     | multi-metal wave E                     | pilot OFF                                                                                | update-then-merge (E)                                              |
| #605 | Ph60 multi-metal comparison render                       | …phase-60-metal-render            | 3     | 7/0     | multi-metal wave E                     | pilot OFF                                                                                | update-then-merge (E)                                              |
| #606 | Ph61 per-metal SEO/JSON-LD view-model                    | …phase-61-metal-seo               | 3     | 7/0     | multi-metal wave E                     | pilot OFF                                                                                | update-then-merge (E)                                              |
| #607 | Ph62 gold-vs-crypto snapshot                             | …phase-62-crypto-snapshot         | 3     | 7/0     | crypto wave E                          | **CRYPTO_PILOT OFF; no fake BTC/ETH; no predictions**                                    | update-then-merge (E, flag OFF)                                    |
| #612 | motion: guard View-Transition aborts                     | claude/g3-motion-guard            | 3     | **6/1** | console stability; wave A; rel my #617 | none                                                                                     | update-then-merge (fix failing check)                              |
| #613 | SEO: glossary DefinedTermSet schema                      | claude/g16-glossary-definedterm   | 4     | 7/0     | rel #632 (glossary); wave C            | none                                                                                     | update-then-merge (C)                                              |
| #614 | docs: cowork audit + 70-phase cross-walk                 | cowork/2026-07-10-audit-crosswalk | 3     | 1/0     | **tracker/audit — conflicts #615**     | none                                                                                     | reconcile→merge as authoritative tracker                           |
| #615 | docs: living tracker board + PR inventory                | claude/blissful-meitner           | 2     | 1/0     | **tracker/audit — conflicts #614**     | none                                                                                     | reconcile→close-superseded (fold unique content into #614)         |
| #616 | Phase 37 Hindi (hi) pilot                                | cowork/phase-37-hindi-pilot       | 4     | 7/0     | i18n; wave C                           | none (MT noindex policy)                                                                 | merge (C)                                                          |
| #617 | e2e learn progress + console (DP-1)                      | cowork/dp1-learn-progress-e2e     | 1     | 5/0     | test suite (wave B)                    | none                                                                                     | merge (B)                                                          |
| #618 | Setup overnight-agent automation                         | claude/overnight-agent-automation | 11    | 7/0     | CI/agent config; wave F                | **security audit: no main-run, deny rules, no secret, no deploy, no live-workflow edit** | update-then-merge (F, after security audit)                        |
| #619 | a11y WCAG 2.2 tap-targets                                | claude/g6-tap-targets             | 6     | 7/0     | CSS/a11y; wave C                       | none                                                                                     | update-then-merge (C, visual matrix 320–1440 × EN/AR × light/dark) |
| #620 | e2e console/network cleanliness (DP-2)                   | cowork/dp2-console-clean-e2e      | 1     | 5/0     | test suite (B)                         | none                                                                                     | merge (B)                                                          |
| #621 | pricing-invariant lock peg/troy/karat + copy-sync (DP-3) | cowork/dp3-pricing-invariants     | 1     | 5/0     | **overlaps merged #610 + open #599**   | none                                                                                     | update-then-merge / combine (keep copy-sync; dedup karat vs #610)  |
| #622 | RTL ?lang= fix terms/privacy/methodology (DP-4)          | cowork/dp4-nav-mobile-rtl         | 4     | 7/0     | RTL bugfix; wave A                     | none                                                                                     | merge (A)                                                          |
| #623 | e2e freshness/label-honesty (DP-5)                       | cowork/dp5-freshness-label-guard  | 1     | 5/0     | rel merged #609 (unit) — e2e layer     | none                                                                                     | merge (B)                                                          |
| #624 | RTL ?lang= fix tracker (DP-4b)                           | cowork/dp4b-tracker-lang-param    | 2     | 7/0     | RTL bugfix; wave A                     | none                                                                                     | merge (A)                                                          |
| #625 | docs multi-metal go-live checklist (DP-6)                | cowork/dp6-multimetal-golive      | 1     | 1/0     | docs; wave C                           | none                                                                                     | merge (C)                                                          |
| #626 | e2e a11y baseline (DP-7)                                 | cowork/dp7-a11y-baseline-guard    | 1     | 5/0     | test suite (B)                         | none                                                                                     | merge (B)                                                          |
| #627 | e2e SEO-head integrity (DP-8)                            | cowork/dp8-seo-surface-guard      | 1     | 5/0     | test suite (B)                         | none                                                                                     | merge (B)                                                          |
| #628 | e2e theme-toggle (DP-9)                                  | cowork/dp9-theme-toggle-check     | 1     | 5/0     | test suite (B)                         | none                                                                                     | merge (B)                                                          |
| #629 | e2e offline/PWA (DP-10)                                  | cowork/dp10-offline-verify        | 1     | 5/0     | test suite (B)                         | none                                                                                     | merge (B)                                                          |
| #630 | e2e calculator accuracy (DP-11)                          | cowork/dp11-calculator-accuracy   | 1     | 5/0     | test suite (B); trust-critical         | none                                                                                     | merge (B)                                                          |
| #631 | e2e portfolio persistence (DP-12)                        | cowork/dp12-portfolio-persistence | 1     | 5/0     | test suite (B)                         | none                                                                                     | merge (B)                                                          |
| #632 | e2e glossary+compare (DP-13)                             | cowork/dp13-glossary-compare      | 1     | 5/0     | test suite (B); rel #613               | none                                                                                     | merge (B)                                                          |
| #633 | e2e heatmap+shops (DP-14)                                | cowork/dp14-heatmap-shops         | 1     | 5/0     | test suite (B)                         | none                                                                                     | merge (B)                                                          |

## Key overlaps / decisions to make during Part II

1. **Trackers #614 ↔ #615** — both edit `docs/AGENT_MASTER_TRACKER.md` (mutual conflict). Plan: make
   #614 the authoritative update (it carries the full DP-1…DP-14 record + Section G + control log),
   fold any unique content from #615 in, close #615 superseded. Reconcile the tracker to the REAL
   post-convergence PR inventory (not the stale 19-PR snapshot on main).
2. **Karat/pricing test triple #599 / merged #610 / #621** — #610 (karat purity-map lock) already on
   main. Rebase #599 and #621 on main; keep only assertions #610 doesn't already cover. #621's
   constant↔disclaimer copy-sync is distinct and worth keeping; its raw karat-ratio assertions may
   now duplicate #610. Dedup deliberately.
3. **Freshness #590 / merged #609 / my #623** — #609 (unit metadata lock) merged; #590 (hysteresis)
   and #623 (e2e label-honesty) are distinct layers — keep, verify no redundancy.
4. **feature-flags.js conflict cluster (#591,#592,#593,#594,#596,#598,#600)** — sequential merges
   will collide on the flags file. Resolve by **retaining every distinct flag, turning NONE on**.
5. **Multi-metal #601–#606 + crypto #607** — merge code with `METALS_PILOT_ENABLED=false` /
   `CRYPTO_PILOT` off and NO fabricated XAG/XPT/XPD/BTC/ETH data (go-live path documented in #625).
6. **#618 overnight-agent automation** — merge only after a security audit: refuses to run on main,
   deny rules effective, no secret exposure, branch-scoped CI, no deploy, does not edit
   `gold-price-fetch.yml`/`post_gold.yml`, preserves logs on failure.
7. **Failing checks #593/#596/#612** — identify the failing job and fix before merge (do not merge
   red).

## Proposed merge waves (per mandate, refined by real deps)

- **A (bugfixes/stability):** #622, #624, #612*, #589, #590 (*fix #612 red first)
- **B (regression-test suite):** #617, #620, #621†, #623, #626, #627, #628, #629, #630, #631, #632,
  #633, #599† (†dedup karat vs merged #610) — then run full Playwright matrix, measure
  runtime/flake.
- **C (content/i18n/a11y/docs):** #613, #616, #619, #625, reconciled #614 (close #615).
- **D (data/pricing, flags OFF):** #591, #592, #593*, #594, #596*, #598, #600 (resolve flags
  conflict; none ON).
- **E (multi-metal/crypto, pilots OFF):** #601, #602, #603, #604, #605, #606, #607.
- **F (shared tokens/governance/agent config, late):** #595, #597, #618 (after security audit).

## Integrated-main gate (Part II exit criteria)

`gh pr list --state open` for backlog → 0; no unpushed unique branches; from clean worktree:
`npm ci`, `npm audit`, lint, format:check, `npm run validate`, full unit tests, full Playwright
(chromium/firefox/webkit), build, link/SEO/a11y/manifest checks, pricing/data-invariant checks, live
smoke matrix — all green; record exact counts; then tag `post-pr-convergence-pre-60-2026-07-10`.
