# EXP-04 — Visual and integrated verification evidence

**Date:** 2026-08-11  
**Status:** PR_READY — VISUAL_CAPTURE_LIMIT RECORDED **Branch:** `ai/goal-gt-40b90823`  
**Scope:** flagship home, tracker, calculator, shared design tokens, and verification evidence

## Outcome

The selected **Market Desk** direction is implemented and passes repository verification. Fresh
in-app browser DOM QA covered the flagship pages in EN/LTR and AR/RTL, responsive widths from 390px
to 1440px, and light/dark states. One evidence-backed defect was found and repaired: the tracker
Language selector translated its content but did not update the root `lang` and `dir` attributes.

No pricing formula, pricing constant, provider, server, database, workflow, service-worker,
package-manifest, lockfile, or generated price-data change is included.

## Fresh browser QA matrix

| Surface    | EN / LTR             | AR / RTL             | Widths               | Theme evidence                    | Result                                      |
| ---------- | -------------------- | -------------------- | -------------------- | --------------------------------- | ------------------------------------------- |
| Home       | `lang=en`, `dir=ltr` | `lang=ar`, `dir=rtl` | 390, 768, 1024, 1440 | light + dark                      | DOM pass; capture limit                     |
| Tracker    | `lang=en`, `dir=ltr` | `lang=ar`, `dir=rtl` | 390, 1440            | light; shared dark shell verified | DOM pass after locale repair; capture limit |
| Calculator | `lang=en`, `dir=ltr` | `lang=ar`, `dir=rtl` | 390, 1440            | light + dark                      | DOM pass; capture limit                     |

At every measured width, `document.documentElement.scrollWidth === window.innerWidth`; no
document-level horizontal overflow was present. Mobile navigation, language switching, primary
price/status readouts, tracker controls, and calculator controls were present in the accessibility
tree. The repaired tracker switch was exercised live from AR/RTL to EN/LTR and returned
`{ lang: "en", dir: "ltr", width: 390, scrollWidth: 390 }`.

Diagnostic captures are stored in:

`/Users/abdulkarim/Documents/Codex/2026-08-10/build-a-feature-for/outputs/GT-40B90823-current-audit/`

The in-app browser returned Retina-scaled images clipped to half of the requested CSS viewport.
Those files were rejected as pixel-level acceptance evidence under the Product Design audit rules.
They remain useful diagnostics only. Responsive geometry, semantics, locale state, controls, and
overflow checks are valid browser evidence; a complete pixel-by-pixel screenshot audit remains a
named handoff limitation rather than an implied pass.

## Accessibility and semantics

- `npm run validate` passed with **0 errors and 0 warnings**.
- The repository basic accessibility gate passed, including WCAG AA token contrast checks for
  body/gold pairs and dark-mode status/signal colors.
- The static scan covered 15 public HTML files and found no missing required image treatment.
- Live DOM review confirmed landmark, heading, status, button, form-label, language, and RTL
  semantics on the three flagship surfaces.
- The tracker selector regression now has a deterministic Node guard in
  `tests/tracker-language-control.test.js` plus live browser proof.

A standalone headless axe run was not substituted for the user's in-app browser. The repository's
non-headless accessibility gates and live semantic inspection are the acceptance evidence for this
local handoff; CI may run the existing headless axe workflow independently.

## Integrated verification

| Command            | Result                              |
| ------------------ | ----------------------------------- |
| `npm run lint`     | Pass                                |
| `npm test`         | Pass — 1,846 tests, 0 failures      |
| `npm run validate` | Pass — 0 errors, 0 warnings         |
| `npm run build`    | Pass — Vite transformed 310 modules |

The production build introduced no new dependency or image asset. Relevant emitted CSS remained
bounded: home/index 91.98 kB (15.83 kB gzip), tracker 108.97 kB (18.12 kB gzip), calculator 25.64 kB
(5.08 kB gzip), and shared global CSS 182.94 kB (34.04 kB gzip). The in-app browser does not expose
Performance APIs, so no synthetic LCP/TTI number is claimed; the existing CI performance workflow
remains the authoritative lab budget gate.

## Repaired defect

**Finding:** switching the tracker toolbar from Arabic to English updated translated copy and the
page title but left the document at `lang="ar" dir="rtl"`.

**Repair:** the tracker control event now calls the existing locale synchronizer immediately after
the requested locale dictionary is ready, before repopulating and rerendering controls. The page
orchestrator explicitly provides that callback to the event module.

**Proof:** before switch `{lang: "ar", dir: "rtl"}`; after switch `{lang: "en", dir: "ltr"}` at
390px with no horizontal overflow.

## Product-design assessment

**AI-generic risk: 2 / 5.** The flagship identity is driven by GoldTicker-specific reference-price
hierarchy, source/freshness labels, market-state language, GCC context, price typography, and the
spot-versus-retail trust contract. It avoids a generic SaaS dashboard composition while reusing the
existing visual system and self-hosted assets.

No critical or high-severity issue was found in the valid DOM/semantic evidence or the inspected
parts of the rendered states. A complete uncropped screenshot set is still required for strict
pixel-level visual-audit sign-off. The worktree is ready for local PR handoff with that limitation
recorded; no remote push, PR creation, merge, deploy, or external write was performed.
