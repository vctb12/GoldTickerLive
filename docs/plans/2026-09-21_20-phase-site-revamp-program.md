# 20-Phase Site Revamp — Program Run (opened 2026-09-21)

**Owner:** vctb12 · **Driver:** Claude Code · **Branch:** `claude/vibrant-darwin-6g0u9k` **Status:**
ACTIVE · **Phase 1 of 20 shipped in this document's own commit.**

---

## 1. What this is, and what it is not

This is **not a new plan**. `AGENTS.md` and the master tracker both forbid competing trackers and
duplicate roadmaps, and the repository already contains a well-specified, genuinely-unstarted
20-phase program:

> `docs/audits/MASTER_GOLDTICKERLIVE_WEBSITE_AUDIT_AND_20_PHASE_PLAN.md` § 11 — "Net-new 20-phase
> plan", phases **A1 … F20** across six waves.

This document **activates** that plan as a tracked program run: it records the verification that the
plan is still valid, fixes its per-phase status honestly, and logs execution as phases land.

Writing a 21st competing plan would have been the wrong move. The existing one was written against a
real audit, is numbered to avoid collision with the 50-phase revamp, and is scoped to $0-to-run,
non-owner-gated work. It just never got started.

### Verification that the plan is genuinely unstarted

Checked on 2026-09-21 against `origin/main`:

| Plan artifact                            | Present before this run? |
| ---------------------------------------- | ------------------------ |
| `scripts/node/check-internal-hrefs.js`   | ❌ missing               |
| `scripts/node/check-anchor-integrity.js` | ❌ missing               |
| `tests/e2e/console-budget.spec.js`       | ❌ missing               |

The master tracker's section D listed all waves as `not-started`, and that was accurate.

---

## 2. Phase ledger

Statuses are `done` / `in-progress` / `not-started` / `gated-pending-owner-decision`.

### Wave A — Site correctness & regression guards

| Phase | Short name                                      | Status      | Evidence                                             |
| ----- | ----------------------------------------------- | ----------- | ---------------------------------------------------- |
| A1    | Internal-link / `safeHref` integrity + CI guard | **done**    | This run — see §3. 13 live defects fixed + CI guard. |
| A2    | Deep-link / anchor-integrity checker            | not-started | `scripts/node/check-anchor-integrity.js`             |
| A3    | Console-error / unhandled-rejection budget gate | not-started | `tests/e2e/console-budget.spec.js`                   |
| A4    | JS-hydration fail-open contract for all hubs    | not-started | generalizes the learn-only contract                  |
| A5    | View-Transitions & motion robustness matrix     | not-started | documents + tests `motion-boot.js` contract          |

### Wave B — Content discoverability & learn engagement

| Phase | Short name                                       | Status      |
| ----- | ------------------------------------------------ | ----------- |
| B6    | Learn article scroll-spy TOC + reading progress  | not-started |
| B7    | Learn hub read-state UX: resume, reset, complete | not-started |
| B8    | On-site content search ($0, build-time index)    | not-started |
| B9    | Glossary auto-cross-linking in body content      | not-started |
| B10   | Contextual "try in calculator/tracker" CTAs      | not-started |

### Wave C — Trust & content quality

| Phase | Short name                                       | Status      |
| ----- | ------------------------------------------------ | ----------- |
| C11   | Editorial "last reviewed" dates                  | not-started |
| C12   | Jargon / glossary-coverage linter                | not-started |
| C13   | Educational JSON-LD (Article / LearningResource) | not-started |

### Wave D — $0 privacy-friendly quality & performance

| Phase | Short name                                | Status      |
| ----- | ----------------------------------------- | ----------- |
| D14   | Save-Data / slow-connection mode          | not-started |
| D15   | Privacy-friendly local engagement signals | not-started |
| D16   | Back-to-top + scroll restoration          | not-started |

### Wave E — Accessibility not covered by 50-phase 31–36

| Phase | Short name                                       | Status      |
| ----- | ------------------------------------------------ | ----------- |
| E17   | Focus management for hash nav & hydration        | not-started |
| E18   | Accessible read/unread semantics for guide cards | not-started |

### Wave F — Documentation & durable verification

| Phase | Short name                          | Status      |
| ----- | ----------------------------------- | ----------- |
| F19   | Audit/plan index & supersession map | not-started |
| F20   | Durable mobile-viewport harness     | not-started |

---

## 3. Phase A1 — shipped

**Premise, re-verified rather than trusted.** The audit claimed `safeHref()` rejects bare-relative
URLs. Confirmed by reading `src/lib/safe-dom.js` and by the repo's own CI-run assertions in
`tests/safe-dom.test.js` (`/internal/path`, `./rel`, `#section` accepted — no bare-relative form).

**The defect is worse than the audit described.** `el()` does:

```js
const safeValue = safeHref(String(value), keyLower);
if (safeValue) node.setAttribute(key, safeValue);
```

When `safeHref()` returns `''` the attribute is **never set at all**. So
`el('a', { href: 'tracker.html' }, 'Tracker')` ships `<a>Tracker</a>` — not a dead link but a
**non-link**: not focusable, not keyboard-reachable, and not announced as a link by assistive
technology. It breaches the internal-linking rule (`AGENTS.md` rule 4) _and_ basic accessibility.

**13 live defects fixed** (the audit predicted ~12; a 13th surfaced only once the guard ran):

| File                                     | Count | Links                                                 |
| ---------------------------------------- | ----- | ----------------------------------------------------- |
| `src/components/LocationGuideSection.js` | 4     | tracker, calculator, methodology, dubai-gold-price    |
| `src/components/MethodologySection.js`   | 3     | methodology, calculator, tracker                      |
| `src/components/QuickConvertWidget.js`   | 1     | calculator                                            |
| `src/pages/heatmap.js`                   | 2     | calculator + **compare** (the 13th, template-literal) |
| `src/tracker/archive.js`                 | 1     | methodology                                           |
| `src/tracker/decision.js`                | 1     | methodology                                           |
| `src/tracker/onboarding.js`              | 1     | methodology                                           |

All converted to root-relative (`/page.html`), matching the existing convention in
`src/components/RelatedGuides.js`.

**CI guard added:** `scripts/node/check-internal-hrefs.js`, wired into `npm run validate` between
`check-unsafe-dom` and `check-shell-guard`, plus `npm run check-internal-hrefs`.

The guard makes two deliberate carve-outs, both unit-tested, because static scanning cannot
otherwise distinguish markup from data:

1. **Value-shape filter.** `action` is a real URL attribute, but `src/components/nav.js` has
   `{ action: 'menu', icon, label, key }` — a nav-item descriptor, not an `el()` attribute object.
   Only values that look like a URL path (name a file, contain `/`, or open `?`/`#`) are checked.
2. **Undecidable template prefixes.** `` `${canonical}?lang=ar` `` has no statically-known prefix
   and is skipped; `` `compare.html#k=${karat}` `` has one and is still checked — which is exactly
   how the 13th defect was caught.

**Explicitly out of scope, and why.** Builders in `src/lib/cross-page-links.js` default to
bare-relative bases (`base = 'methodology.html'`, `` return `tracker.html#…` ``). Those are **not**
defects: their consumers assign via `link.href = …`, which bypasses `safeHref()` and resolves
correctly in the browser. Changing those defaults would touch many call sites and their existing
`./`-prefix workarounds, for no user-visible gain. Left alone deliberately.

**Verified:** guard proven in both directions (fails on an injected regression, passes once
reverted); `npm test` 1867 pass / 0 fail; lint, `format:check`, stylelint, `validate`, `build`
green.

---

## 4. Operating rules for this program

- **One phase per PR.** Small logical commits, full gate before push.
- **Verify premises.** Every phase in the source plan was written months ago. Re-check its claim
  against current `main` before building on it, and say so in the phase record — A1's premise held,
  but its defect count did not.
- **Never widen.** If a phase uncovers adjacent work, record it as out-of-scope with a reason rather
  than absorbing it.
- **Owner-gated stays gated.** Nothing in A1–F20 should touch `post_gold.yml`,
  `gold-price-fetch.yml`, `sw.js`, `src/config/constants.js`, or billing/Supabase surfaces. If a
  phase turns out to need one, mark it `gated-pending-owner-decision` and move on.
- **Status lives here and in the master tracker.** Update both on start and finish.

## 5. Next phase

**A2 — deep-link / anchor-integrity checker.** Build-time check that every internal `#anchor`
referenced by nav, cards, or TOC resolves to a real `id` in the target page. Natural follow-on from
A1: same class of silent-breakage, same guard-shaped fix, and A1's scanner already establishes the
file-walking pattern to reuse.
