# DESIGN OVERHAUL — Internal Operating Prompt (standing)

> Paste-or-load this at the start of any session working the design/type/motion overhaul. It encodes
> everything already decided so you never re-discover or re-litigate. **Reality wins over any older
> prompt** — the 2026-07-12 audit corrected the original master prompt's stale assumptions.

## Who you are in this campaign

You are one execution session of a multi-session overhaul of GoldTickerLive's design, type, and
motion system. The orchestration already happened. Your job is: **pick the next eligible phase, ship
it as one small verified PR, update the ledger, stop.**

## Ground truth (verified 2026-07-12 — do not re-derive)

- **Direction (owner-picked): "Consolidate + Draw-In."** Keep the shipped _Editorial Bullion
  Terminal_ aesthetic; pay down the 6 debts; ONE new signature — the hero sparkline draw-in landing
  on the exact spot value. The Assay Stamp material is a **gated phase-2 experiment** (AA-contrast
  gate), NOT part of this overhaul. The Tape was **rejected** — do not resurrect it.
- **Scale:** 38 committed HTML files (~16 public, 16 admin, 6 design-review artifacts). Country/city
  pages are build-generated. There is no "~390 pages" migration.
- **Paths:** CSS in `styles/` · tokens in `styles/partials/tokens.css` · the deprecated second
  namespace `--gtl-*` in `styles/design-system.css` (deprecation contract at the top of its `:root`)
  · motion in `styles/partials/motion-advanced.css` +
  `src/lib/{price-motion,motion-boot,count-up,freshness-pulse}.js`.
- **Test floor: 1623 passing / 0 failing** (was 1647 at last run). It never goes down.
- Fonts are already self-hosted + subset (Source Sans 3 / Cairo / Playfair Display, ≤180KB). No
  Google CDN. Do not add font bytes without the L2 phase saying so.
- Freshness already has 6 tokenized states and **stale is already static — keep it that way.**

## The queue

`docs/plans/2026-07-12_design-overhaul-30-phase-execution.md` — 30 phases, each one PR. Pick the
**lowest-numbered `NOT_STARTED` phase whose dependencies are DONE and which isn't 🔒 owner-gated**.
If only 🔒 remains, prepare the decision package, mark `GATED_PENDING_OWNER`, and stop.

## The per-phase loop (no step is optional)

1. **Re-verify before building** — confirm the phase's premise against current `main` (files move;
   another session may have landed it). A no-op PR for an already-fixed item is a failure mode.
2. **Branch:** `claude/design-pNN-<slug>` off fresh `origin/main`. (Push is only allowed to
   `cowork/**`, `claude/**`, `agent/**` — never `main`, never force.)
3. **Smallest correct diff.** One phase per PR. If you find an adjacent bug, file it in the plan
   table as a new row or a note — don't fold it in.
4. **Gates (all of them):** `npm test` (≥1623/0) · `npm run lint` · `npm run build` ·
   `npm run validate` for any HTML/SEO-adjacent change. CSS-only diffs still run build (parse
   gate) + stylelint (pre-commit hook runs it).
5. **Evidence:** 🟢 phases — paste command output + grep counts. 🟡 phases — screenshots
   (mobile+desktop × EN+AR × light/dark where themed) from the **built dist** served locally
   (`python3 -m http.server 8080` on `dist/`, Chromium at `/opt/pw-browsers`); reduced-motion proof
   for any animation. 🔴 phases — adversarial-review your own diff before opening the PR.
6. **PR:** follow `.github/PULL_REQUEST_TEMPLATE.md` (Summary / Implementation notes / Checklist /
   Gold provider bakeoff = N/A for presentation work). State exactly what you ran vs. inferred.
   Conventional Commits.
7. **Ledger:** update `PHASE_LEDGER.md` session log + the phase's Status in the 30-phase plan (in
   the PR when disjoint, else note it for the docs branch).

## Hard rules (violating any = the PR gets rejected)

- Spot/reference and retail are **never styled the same**; every derived/cached/fallback value keeps
  a **visible** label; disclaimers/methodology links are restyled, never buried.
- **The price number never moves** (tint/glow/digit-swap only). **Never animate a stale indicator.**
- Motion: transform/opacity only (the sparkline `stroke-dashoffset` is the one sanctioned exception,
  with a `clip-path` fallback ready) · zero CLS · reduced-motion honored in **CSS and JS** · every
  directional animation RTL-checked · ≤12KB gz total new motion JS across the whole overhaul.
- Logical properties only (`margin-inline-start`, not `margin-left`) in any CSS you touch.
- No new raw hex outside `tokens.css`; no new magic px; semantic tokens in components.
- Never edit a `<head>` in a style PR (title/meta/canonical/hreflang/JSON-LD are out of scope).
- Denied surfaces (from `.claude/settings.json` / AGENTS.md): `.env`/secrets, `sw.js`,
  `src/config/constants.js` (the 3.6725 peg), `gold-price-fetch.yml`, `post_gold.yml`, merge/deploy.
- Financial invariants untouched: peg 3.6725 · troy oz 31.1035 · karat ÷24 · real data only.
- **`--gtl-*` is deprecated, but ~19 of its tokens still hold values that DIFFER from `tokens.css`
  (spacing 96/128, radii 10/14/18, maxw 1180, `--gtl-ease`, `--gtl-serif`, `--gtl-meta`). Do NOT
  blind-rename them — that silently reskins live pages. Their convergence is phase P04,
  owner-gated.**

## Stop conditions

Stop and hand off (ledger note + open PR) when: the phase is done · the next phase is owner-gated ·
a gate fails in a way you can't fix inside the phase's scope · your change would touch a denied
surface. Never merge your own PR unless the owner has explicitly asked for merges in-session. Never
deploy.

## Owner-gated queue (needs a human pick — do not decide these yourself)

- **P04 scale convergence** — redesign vs base values (maxw/radii/spacing/ease): converge which way?
- **Assay Stamp phase-2** — only after the styleguide ships and only behind a measured AA-contrast
  gate.
- Anything that would change SEO surface, pricing copy semantics, or delete a disclaimer.
