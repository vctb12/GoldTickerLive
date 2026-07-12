# Gold Ticker Live — 30-Phase Design Revamp

**File:** `docs/plans/2026-07-12_design-revamp-30-phases.md` **Scope:** Design, UI, visual system.
Not features, not data, not SEO. **Site:** goldtickerlive.com · **Repo:** `vctb12/GoldTickerLive`
**Mode:** PLAN. This document sequences work. It does not implement.

---

## The problem in one paragraph

GoldTickerLive does not have a design problem. It has a **design-system fork**. Two token
vocabularies and two page-CSS layers ship simultaneously on 11 of 12 pages; the flagship tracker
page is on neither; and the newer layer cannot render dark mode. Forty-two thousand lines of CSS are
fighting each other in the cascade. **Any new design work layered on top of this becomes a third
fork.** Phases 1–9 collapse the fork onto one contract. Phases 10–14 define the language. Phases
15–23 rebuild the surfaces. Phases 24–30 raise craft and lock it behind gates so it cannot fork
again.

---

## Verified current state (HEAD, 2026-07-12)

| Fact                    | Value                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| CSS files / total lines | 46 files / 41,885 lines                                                                                                   |
| Largest files           | `tracker-pro.css` 5,271 · `partials/components.css` 4,714 · `pages/home.css` 4,064 · `partials/utilities.css` 3,733       |
| Token source A          | `styles/partials/tokens.css` — 394 vars, semantic `--color-*`, WCAG-annotated, loaded via `global.css`                    |
| Token source B          | `styles/design-system.css` — 45 vars, primitive `--gtl-*` (type, space 1–10, radius, shadow, motion), loaded per-page     |
| Double-layer pages      | 11 of 12 load original page CSS **and** `-redesign.css`                                                                   |
| Excluded page           | `tracker.html` — no `design-system.css`, no redesign layer                                                                |
| Dead file               | `styles/pages/tracker-pro-v4.css` (491 lines), unreferenced                                                               |
| Dark-mode coverage      | 7 `data-theme` blocks in `tokens.css`; **1 of 12** `-redesign` files handles it                                           |
| Fonts                   | Playfair Display (EN display) · Source Sans 3 (EN body, tabular figures) · Cairo (AR; `[dir=rtl]` swaps `--font-display`) |
| RTL                     | 208 logical properties vs ~49 residual physical — cleanup, not rebuild                                                    |
| Emoji-as-icons          | Effectively solved: 0 in HTML, 5 in `src/**/*.js`                                                                         |
| SVG assets              | 3 total — no icon sprite system                                                                                           |

**Not verified:** no build run, no tests run, no screenshots, no Lighthouse. Test baseline (1282)
carried from a prior session and not re-confirmed. Re-establish it in Phase 1.

> **Phase-1 correction (see `docs/design/CSS_INVENTORY.md`):** several of the above have since been
> verified/corrected — total is **41,887** lines; the real test baseline is **1,656** (not 1282);
> emoji are **0/0** and an **icon sprite system already exists**; RTL measured 633 logical vs 58
> physical (same conclusion). The fork facts (double-layer on 11/12, tracker excluded, dead v4 file,
> 11/12 redesign files dark-blind) are all **confirmed**.

---

## Immutable invariants — never violate in any phase

1. **AED peg `1 USD = 3.6725 AED`** — fixed constant.
2. **Troy ounce `31.1034768 g`** — immutable.
3. **Spot ≠ retail.** Every price surface is a spot-linked bullion-equivalent estimate, never a
   jewellery-shop price. No redesign may blur, shrink, or bury this separation.
4. **Freshness labels are product, not chrome.** Estimated / derived / delayed / cached / stale
   states must remain visible and legible at every breakpoint, in both locales.
5. **`@GoldTickerLive` X bot is production-critical.** Out of scope. Do not touch.
6. **EN/AR parity.** Every visual change ships in both locales or it does not ship.
7. **Static-first architecture.** No framework migration. Vanilla ES6 + Vite stays.

---

## Risk legend

- 🟢 **GREEN** — additive, reversible, no visual regression risk.
- 🟡 **YELLOW** — touches shared surfaces. Needs screenshot diff before merge.
- 🔴 **RED** — high blast radius. Feature-flag or branch-isolate. Owner review required.

## Session protocol

- One phase per session. PR-only. No direct commits to `main`.
- Gate every phase on `npm run validate && npm test` (delete `playwright-report/` first).
- Every 🟡/🔴 phase ships with screenshots: **EN light, EN dark, AR light, AR dark** × mobile +
  desktop.
- Log outcome to `PHASE_LEDGER.md` before ending the session.
- If a phase exceeds one session, split it — never carry half-applied cascade changes.

---

# ACT I — COLLAPSE THE FORK (Phases 1–9)

_Goal: make exactly one design system exist. No new design in this act._

### Phase 1 — Design inventory & baseline 🟢

**Do:** Audit-only, zero code change. Build `docs/design/CSS_INVENTORY.md`: every CSS file, line
count, which pages load it, which selectors are actually matched in the DOM. Re-establish the real
test baseline. Capture the 8-shot screenshot grid as "before". **Done when:** Inventory committed;
baseline number confirmed; before-shots archived. **Rollback:** N/A (no code change).

### Phase 2 — Quarantine dead CSS 🟢

**Do:** Delete `styles/pages/tracker-pro-v4.css`. Run a coverage pass to find unmatched selectors
across all 46 files; move confirmed-dead rules to `styles/_graveyard/` (not deleted, for one release
cycle). **Done when:** Dead file gone; graveyard documented; zero visual diff in the 8-shot grid.
**Rollback:** `git revert`.

### Phase 3 — Write the unified token contract 🟢

**Do:** Spec only, no migration. Define one vocabulary in `docs/design/TOKENS.md`. Decide the
namespace (recommend keeping `--color-*` semantic naming — it's the mature, WCAG-annotated system —
and folding `--gtl-*` primitives in as `--space-*`, `--text-*`, `--radius-*`, `--shadow-*`,
`--motion-*`). Publish the full old→new mapping table. **Done when:** Every one of the 439 existing
vars maps to exactly one contract entry. **Rollback:** N/A.

### Phase 4 — Land the primitives in `tokens.css` 🟡

**Do:** Add the space/type/radius/shadow/motion primitives to `partials/tokens.css` per the Phase 3
contract. Do **not** remove `--gtl-*` yet — both resolve, aliased. Additive only. **Done when:** All
new tokens resolve; `--gtl-*` still resolves; zero visual diff. **Rollback:** Revert the token
block.

### Phase 5 — Codemod consumers off `--gtl-*` 🟡

**Do:** Mechanical find-replace across all consuming CSS using the Phase 3 mapping. One commit per
file for reviewable diffs. No value changes — names only. **Done when:** Zero `--gtl-*` references
outside `design-system.css`; zero visual diff. **Rollback:** Revert per-file commits.

### Phase 6 — Retire `design-system.css` 🟡

**Do:** Remove the `<link>` from all 11 pages. Delete the file. `tokens.css` (via `global.css`) is
now the single token source. **Done when:** One token file. Pages render identically. Grep for
`design-system.css` returns nothing. **Rollback:** Revert; re-add links.

### Phase 7 — Fold the `-redesign` layer 🔴

**Do:** The big one. For each page, merge `<page>-redesign.css` into `pages/<page>.css` so one file
expresses the intended design, then delete the redesign file and its `<link>`. **Do not batch — one
page per session.** Where the original and the redesign conflict, the redesign wins (it is the newer
intent); record every conflict resolved in the PR body. **Order:** glossary → market → methodology →
heatmap → portfolio → compare → calculator → dubai-gold-price → learn → shops → home (easiest to
hardest, by line count). **Done when:** Zero `-redesign.css` files. Each page has exactly one page
stylesheet. 8-shot grid matches pre-fold output. **Rollback:** Per-page revert. Never leave a page
half-folded across sessions.

### Phase 8 — Dark-theme parity 🟡

**Do:** The redesign layer was dark-mode-blind (1 of 12 files). Now that it is folded, every page
stylesheet must honour the 7 `data-theme` blocks in `tokens.css`. Hunt hard-coded hex values — they
are the tell. **Done when:** Zero hard-coded colours outside `tokens.css`. All four locale×theme
combos correct on every page. **Rollback:** `git revert`.

### Phase 9 — Lock it: CSS budget gate in CI 🟢

**Do:** Add a CI check that fails the build if (a) total CSS exceeds a ceiling set from the
post-fold number, (b) any new `*-redesign.css` or second token file appears, (c) a hard-coded hex
lands outside `tokens.css`. **This is the gate that prevents a fourth fork.** **Done when:** CI
fails on a deliberately-introduced violation. **Rollback:** Disable the check.

> **End of Act I.** One token contract. One stylesheet per page. Dark mode works everywhere. CSS is
> measurably smaller and can no longer silently regrow. _Now_ design can start.

---

# ACT II — THE DESIGN LANGUAGE (Phases 10–14)

_Goal: decide what the thing looks like, and build the components that carry it._

### Phase 10 — Design language spec 🟢

**Do:** Write `DESIGN_RATIONALE.md` properly. The direction is already latent in your tokens and is
a good one — commit to it explicitly:

> **Struck metal on parchment.** The page is paper (`--color-bg #fdfbf5`). The data is the darkest
> mark on it (`--color-ink-data #0f0c06`). Gold (`--color-gold #b07d1f`) is a **value signal, never
> a fill** — it appears only as a dot, ring, or rule, never as a background, never as small text.
> Restraint is the brand: a gold site that does not look gaudy is a gold site you can trust with
> your money.

**The signature element is the numeral, not the ornament.** For a price tracker, the single most
characteristic thing in the subject's world is the _number changing_. That is where the boldness
gets spent (Phase 12). Everything else stays quiet. **Done when:** Spec written, with the anti-goals
listed explicitly (no gradient hero, no gold gradients, no glassmorphism, no floating cards on
cream).

### Phase 11 — Type scale & tabular numerals 🟡

**Do:** Set one modular scale from the Phase 3 tokens. Enforce `font-variant-numeric: tabular-nums`
on **every** price, delta, and table cell — non-negotiable, it is why digits don't jitter on tick.
Audit Playfair usage: display only, ≥24px, never for data. **Done when:** Type scale applied
sitewide; no digit-width shift on live price update (record a screen capture as proof).

### Phase 12 — The price mark (signature component) 🟡

**Do:** Build one canonical price component used by every surface. This is the hero of the whole
site and deserves the most craft in the entire plan: the numeral in `--color-ink-data`, tabular,
optically aligned; the karat and unit as quiet meta; the delta as the only coloured element; a tick
animation that is _felt, not seen_ (respect `prefers-reduced-motion`). Everything else on the page
defers to it. **Done when:** One component, consumed by tracker/home/calculator/compare/country
pages. No page hand-rolls a price display. **Rollback:** Component is additive until adopted; adopt
page-by-page.

### Phase 13 — The trust surface 🟡

**Do:** Freshness, provenance, and **spot-vs-retail** are your product's core differentiator —
design them as first-class UI, not fine print. One component: source, timestamp, freshness state
(live / delayed / cached / estimated), and the retail disclaimer. Legible at 360px. Legible in AR.
**Done when:** Every price surface carries it. Invariants 3 and 4 hold at every breakpoint in both
locales.

### Phase 14 — Global shell 🟡

**Do:** Header, nav, language toggle, theme toggle, footer. The language toggle is a primary control
on this site — treat it as such, not as a hidden dropdown. Focus states visible everywhere. **Done
when:** Shell identical across all 16 pages; keyboard-navigable; AR mirror correct.

---

# ACT III — REBUILD THE SURFACES (Phases 15–23)

_One page per phase. Each consumes Act II components; none invents new CSS vocabulary._

### Phase 15 — Home 🔴

Largest surface (4,064 + 1,085 lines pre-fold). Hero = the live price mark, not a marketing banner.
Above the fold: price, freshness, karat table, one chart. Nothing else.

### Phase 16 — Tracker 🔴

**The most important phase in this plan.** 5,271 lines, currently on the old system, excluded from
every prior redesign. Rebuild on the unified contract. Expect this to need 2–3 sessions — split it
and say so in the ledger.

### Phase 17 — Calculator 🟡

The one page where the user does work. Input ergonomics over decoration. Mobile keypad behaviour.

### Phase 18 — Compare 🟡

Dense tabular data. Tabular numerals, zebra restraint, sticky header, honest column alignment.

### Phase 19 — Heatmap 🟡

The colour scale must survive dark mode and be colour-blind-safe. Do not use the brand gold in the
scale — it collides with Phase 10's "gold is a signal, never a fill" rule.

### Phase 20 — Portfolio 🟡

Gains/losses need a red/green that works in both themes and is not the only signal (add glyph/sign).

### Phase 21 — Shops directory 🟡

2,890 lines pre-fold. Cards, map, filters. Highest risk of "template card grid" — resist it; the
listing is a directory, so let density and scanability win over decoration.

### Phase 22 — Editorial cluster: Learn + Glossary + Methodology 🟡

This is where Playfair earns its keep. Long-form measure (65–75ch), real hierarchy. Methodology is a
trust document — design it like one.

### Phase 23 — Country / market pages 🟡

15 markets on one template. Fix the template, all 15 improve. Verify the AR + RTL render for at
least three Arabic-first markets.

---

# ACT IV — CRAFT & PROOF (Phases 24–30)

### Phase 24 — Icon system 🟢

Only 3 SVGs exist today. Build one sprite, `currentColor`-driven, sized on the type scale.
Emoji-as-icons is already ~solved (5 left in `src/**/*.js`) — finish it.

> **Phase-1 note:** an icon sprite system already exists (`src/components/icon-sprite.js`,
> `scripts/node/sync-icon-sprite.js`, wired into `npm run validate`) and emoji are already 0/0.
> Re-scope this phase from "build a sprite" to "audit/extend the existing sprite."

### Phase 25 — Chart restyle 🟡

Charts must speak the token language: same gold rule, same ink, same tabular axis labels. Gridlines
quiet. No default library colours.

### Phase 26 — Motion discipline 🟡

One orchestrated moment (the price tick, Phase 12) beats scattered effects. Audit and _delete_
animation that doesn't serve the data. `prefers-reduced-motion` honoured everywhere.

### Phase 27 — State design 🟡

Loading, skeleton, empty, error, **stale**. Stale is the one most sites get wrong and the one that
matters most here — a stale gold price must _look_ stale, not merely be labelled stale.

### Phase 28 — RTL debt & Arabic typographic parity 🟡

Pay down the ~49 residual physical properties. Then the harder question: EN gets a display serif
(Playfair), AR gets Cairo for both roles. That asymmetry is documented and intentional, but it means
the AR site has less typographic personality than the EN site. Evaluate an Arabic display face (e.g.
a naskh or kufi display cut) so both locales feel equally designed.

### Phase 29 — Accessibility AA sweep 🟢

Contrast (your tokens already carry ratio annotations — verify them), focus visibility, 44px
targets, heading order, `aria-live` on the price. Both locales, both themes.

### Phase 30 — Visual regression harness 🟢

Playwright screenshot diffs across the 8-shot grid, wired into CI. **Phase 9 stops the CSS forking;
Phase 30 stops the design drifting.** Without this, phases 1–29 decay.

---

## Sequencing rules

- **Acts are ordered dependencies, not preferences.** Doing Act III before Act I means rebuilding
  every page twice.
- Phases 1–9 are unglamorous and produce almost no visible change. Do them anyway. They are the
  entire reason the rest of the plan is affordable.
- If time is short, the highest-value subset is **1, 2, 6, 7, 8, 9, 12, 13, 16, 30**.

## Success criteria for the whole revamp

1. One token file. One stylesheet per page. Zero `-redesign` files.
2. Total CSS materially below 41,885 lines, with a CI ceiling preventing regrowth.
3. All four locale×theme combinations correct on all 16 pages.
4. Spot-vs-retail and freshness are more prominent after the revamp than before.
5. The price numeral is the most confident thing on the page.
