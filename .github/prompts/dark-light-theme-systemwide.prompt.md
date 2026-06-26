---
mode: agent
description: Make dark/light mode and color theming correct, flash-free, and WCAG-AA across every Gold Ticker Live surface — all landing pages plus the flagship Tracker.
related_skills:
  - frontend-design-system
  - mobile-ux-review
  - gold-ticker-live-audit
related_instructions:
  - .github/instructions/frontend-mobile.instructions.md
  - .github/instructions/accessibility.instructions.md
---

# Prompt: Site-wide Dark / Light Mode + Color Correctness

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)

Theming is product quality, not paint. A page that flashes the wrong theme, keeps a panel light in
dark mode, or drops text below readable contrast erodes the same trust the freshness labels and
reference-vs-retail rules protect. Treat every color the same way you treat a price: it must be
correct, intentional, and consistent across both themes and both languages (EN/AR · LTR/RTL).

## Goal

Across **every** public surface — `index.html`, `tracker.html` (flagship · highest scrutiny),
`calculator.html`, `invest.html`, `learn.html`, `methodology.html`, `pricing.html`, `shops.html`,
`insights.html`, `compare.html`, `developer.html`, `dashboard.html`, `account.html`, the
`countries/` · `gold-price/` · `chart/` · `methodology/` page families, and `ar/` mirrors — guarantee:

1. **No theme flash (FOUC).** The chosen theme is painted on the very first frame. A user who picked
   dark while their OS is light (or vice-versa) never sees a wrong-theme flash.
2. **Full theme flip.** Every surface, panel, table, card, badge, border, shadow, gradient, and text
   tier changes correctly between light and dark. Nothing is stranded light-in-dark or dark-in-light.
3. **AA contrast in both modes.** Body text ≥ 4.5:1, large/icon ≥ 3:1, on the actual surface it sits
   on, in light AND dark. The CI gate (`scripts/node/check-basic-a11y.js`) stays green and is
   extended to lock in every pair you fix.
4. **One token source of truth.** Colors come from `styles/partials/tokens.css` semantic tokens —
   not hand-picked hex scattered through page CSS. Intentional exceptions (always-dark heroes,
   code blocks, the `invest.css` dark page) are documented, not accidental.
5. **EN/AR + RTL parity.** Every visual change is spot-checked at 360 px in AR/RTL as well as EN.

## Mental model — how theming works here (read before touching anything)

```
First paint ─┐
             ├─ styles/critical.css        (render-blocking, FIRST; above-fold tokens + html/body/a/.btn)
             ├─ styles/global.css ─ @import partials/tokens.css   (canonical token system)
             │                     ─ @import partials/base.css     (body{background:var(--color-bg);color:var(--color-text)})
             │                     ─ @import partials/{layout,components,utilities,shell,skeleton,motion,...}
             └─ styles/pages/<page>.css     (per-page; may alias tokens, e.g. tracker --tp-*)

Theme selection (src/components/nav.js, ~L525–627):
  - <html data-theme="light|dark" data-theme-mode="auto|light|dark"> set by JS after the module loads
  - user choice persisted: localStorage.user_prefs.theme ∈ {auto, light, dark}
  - "auto" follows window.matchMedia('(prefers-color-scheme: dark)') live

Token layers (styles/partials/tokens.css):
  :root { … }                                   ← light values
  [data-theme='dark'] { … }                     ← dark overrides
  @media (prefers-color-scheme: dark) :root:not([data-theme]) { … }   ← OS-pref FIRST-PAINT fallback only
```

**The single most important structural fact:** `data-theme` is set by a *deferred ES module*
(`nav.js`). Unless a **blocking inline `<head>` script** sets `data-theme`/`data-theme-mode` from
`localStorage` *before first paint*, the page paints in the OS-default (or light) and then snaps to
the user's chosen theme when the module runs — the classic dark-mode flash. The OS-preference
`@media` block only saves OS-dark users; it does nothing for a user who *chose* a theme that differs
from their OS. The flash-free fix is the inline script, not more `@media` blocks.

## Required inspection (do this first, every run)

1. `styles/partials/tokens.css` — the whole token system; confirm every light token that affects a
   visible color has a `[data-theme='dark']` counterpart, and that the dark block and the
   `@media prefers-color-scheme` block do not drift apart.
2. `styles/critical.css` — it hardcodes light `--tp-bg` / `--tp-text` / `--tp-accent` and applies
   them to `html, body, a, .btn` **with no dark override**. Decide: add dark overrides for those
   `--tp-*` first-paint tokens (both `[data-theme='dark']` and the OS-pref fallback), or drive
   first-paint off the canonical `--color-bg`/`--color-text`/`--color-gold-dark` tokens.
3. `src/components/nav.js` theme block — persistence keys, cycle order, `aria-label`s, drawer sync.
4. The `<head>` of `index.html` and `tracker.html` — confirm whether a pre-paint theme script exists.
   (At time of writing: it does **not**.)
5. `scripts/node/check-basic-a11y.js` — the CI contrast gate. Read `CONTRAST_PAIRS` and
   `DARK_CONTRAST_PAIRS`; these MUST stay ≥ 4.5:1. Extend them with the pairs you fix.
6. Per-page CSS under `styles/pages/` and `styles/` — grep for hardcoded color literals
   (`#hex`, `rgb(`, `hsl(`, `white`, `black`) outside `[data-theme='dark']` blocks and outside
   intentional always-dark contexts. Each is a theme-flip candidate.
7. `docs/DESIGN_TOKENS.md`, `reports/token-audit.md`, and the active tracker plans under
   `docs/plans/2026-06-2*_tracker-*` — do not re-litigate decisions already recorded there
   (e.g. `invest.css` is an intentional dark page; the tracker hero terminal is intentionally dark).

## Defect taxonomy — what to hunt for

| # | Class | Symptom | Fix shape |
|---|-------|---------|-----------|
| D1 | **FOUC / theme flash** | Wrong theme on first frame, then snaps | Blocking inline `<head>` script sets `data-theme`/`data-theme-mode` from `localStorage` pre-paint |
| D2 | **Missing dark override** | Token/element only defined for light → falls back to light value in dark | Add value under `[data-theme='dark']` (and OS-pref block if it is a first-paint token) |
| D3 | **Hardcoded theme-blind color** | Same `#hex`/`rgb()` in both themes on a themeable surface | Replace with the correct semantic token; if none fits, add a token with light+dark values |
| D4 | **Stranded surface** | A panel/table/card stays light in dark mode (or dark in light) | Trace its `background`/`color`/`border` to a non-theme-aware value; route through tokens |
| D5 | **Contrast failure** | Text < 4.5:1 (or large/icon < 3:1) in one mode | Re-pick the token hex to pass; lock it with a new pair in `check-basic-a11y.js` |
| D6 | **Invisible border/shadow** | Border or shadow vanishes or glares in one mode | Use `--border-*` / `--shadow-*` tokens that already have dark variants |
| D7 | **First-paint mismatch** | `critical.css` above-fold color differs from settled theme | Give `critical.css` first-paint tokens dark overrides matching the canonical palette |

## Permission (Level 4 — system-wide visual correctness)

You **may**: add the pre-paint inline theme script to every public page; add dark overrides and new
semantic tokens (with light+dark values and a rationale comment); replace hardcoded colors with
tokens; retune token hex to pass contrast; extend `check-basic-a11y.js` pairs; bump the service
worker cache version if cached CSS/HTML changes.

You **may not**: change pricing formulas, AED peg (`3.6725`), troy-oz (`31.1035`), or karat factors;
remove or weaken freshness pills, methodology links, source attribution, or reference-vs-retail
disclaimers "to look cleaner"; ship a stronger claim in one language than the other; add a runtime
framework or CSS-in-JS; hand-edit `sitemap.xml`; change canonical/OG/Twitter/CNAME; introduce
`innerHTML` sinks (the `check-unsafe-dom` baseline must not grow).

## Implementation playbook (phased — one concern per commit)

1. **Kill the flash (D1/D7).** Add the smallest possible blocking inline script to the `<head>` of
   every public page (ideally via the shared head partial / generator if one exists, else each file),
   reading `user_prefs.theme` and applying `data-theme` + `data-theme-mode` before the first
   stylesheet paints; mirror the `auto` → `prefers-color-scheme` resolution `nav.js` uses so the two
   never disagree. Give `critical.css` first-paint tokens (`--tp-bg`/`--tp-text`/`--tp-accent`) dark
   overrides under both `[data-theme='dark']` and `@media (prefers-color-scheme: dark) :root:not([data-theme])`.
2. **Close token gaps (D2/D6).** In `tokens.css`, ensure every visible-color light token has a dark
   counterpart and that the dark block and OS-pref block stay in sync (DRY them if practical). Verify
   border/shadow tokens read correctly on dark surfaces.
3. **De-hardcode page CSS (D3/D4).** Walk each `styles/pages/*.css` and `styles/*.css`; replace
   theme-blind literals with semantic tokens. Leave documented always-dark contexts alone but add a
   one-line comment marking them intentional.
4. **Tracker deep pass (flagship).** `tracker.html` + `styles/pages/tracker-pro.css` (+ imported
   `tracker-pro-v4.css`). Separate the intentionally-dark hero/terminal from the rest of the UI
   (tabs, tables, cards, panels, overlays, alerts) which MUST flip. Fix every stranded surface and
   contrast miss. This is the user's explicit focus — be exhaustive.
5. **Contrast lock (D5).** Retune any failing token; add the fixed pairs to `CONTRAST_PAIRS` /
   `DARK_CONTRAST_PAIRS` in `check-basic-a11y.js` so regressions fail CI.
6. **RTL/AR + reduced-motion pass.** Re-check every changed area at 360 px in AR/RTL; respect
   `prefers-reduced-motion` for any theme-transition animation.

## Token governance (hold the line)

- New color → a semantic token in `tokens.css` with BOTH a `:root` (light) and a `[data-theme='dark']`
  value, plus a comment on intent. Never a bare hex in a page file unless it is an intentional,
  commented always-dark context.
- Page-local alias layers (e.g. tracker `--tp-*`) must map through `var(--canonical-token)` — never
  re-introduce hand-picked hex there (the existing header comment in `tracker-pro.css` says so).
- Status/signal colors (live/daily/fixed/stale/up/down/error/warning/success) have separate
  light/dark hex because the saturated light mid-tones fail AA on dark cards — keep that split.

## Verification (run what you touched; state ran vs. inferred)

```bash
npm run lint
npm run style            # stylelint over all CSS
npm test
npm run validate         # includes check-basic-a11y.js contrast gate + shell-guard + a11y + SEO
npm run build            # required for any HTML/CSS/JS change
npm run preview          # spot-check the built pages
```

Manual proof matrix (capture before/after):

- Theme flash: hard-reload `index.html` and `tracker.html` with `user_prefs.theme` set to the
  OPPOSITE of the OS preference — there must be no visible flash.
- Each landing page + tracker in **light** and **dark**, at 360 px and 1280 px.
- Tracker in dark: hero terminal legible; tabs/tables/cards/overlays/alerts all dark-correct.
- AR/RTL at 360 px for every changed surface.
- `prefers-reduced-motion: reduce` honored.

## Known remaining scope (deliberately deferred)

The generated country/content **hub pages** (`countries/**/{gold-rate,gold-shops}/index.html`,
`content/**`, ~138 noindex pages) each carry a self-contained inline `<style>` block plus inline
`style="…"` attributes using a parallel, theme-blind palette (~47 distinct hardcoded hex:
slate greys `#64748b`/`#94a3b8`/`#1e293b`/`#475569`/`#e2e8f0`, golds `#b08a3e`/`#c9b26c`, status
greens/reds, etc.). The site-wide pre-paint script already sets `data-theme` on these pages, so the
nav/body/global surfaces flip; only the inline blocks stay light in dark mode. Re-theming them is a
bounded but large mechanical job (map each hex → semantic token, per-template, with visual
verification across all 138 pages). Template source for regeneration: `build/generatePages.js`
(a manual scaffolder, not wired into `npm run build`). Do this as its own commit/PR — do not fold a
138-file mechanical diff into a focused theming fix. Suggested map: greys → `--text-secondary`/
`--text-tertiary`/`--surface-secondary`/`--border-default`; golds → `--color-gold-dark`/`--color-gold`;
status → `--color-live`/`--color-error`/`--color-daily` families; chip text on tinted bg →
`--text-primary`/`--color-warning-text`.

## Return format

```md
# Site-wide Dark/Light Mode + Color Fix — PR <#>

## What
<one-line summary>

## Why
<the trust/UX gap closed — FOUC, stranded surfaces, contrast, hardcoded colors>

## Structure (one concern per commit)
- Commit 1: pre-paint theme script + critical.css dark first-paint tokens — <summary>
- Commit 2: tokens.css dark-gap closure — <summary>
- Commit 3: de-hardcode page CSS — <files>
- Commit 4: tracker deep theme pass — <summary>
- Commit 5: contrast lock in check-basic-a11y.js — <pairs added>

## Verification
- lint / style / test / validate / build: green (commands + counts)
- Contrast gate: pairs added, all ≥ 4.5:1 (light + dark)
- Screenshots: light+dark for each page at 360px & 1280px; AR/RTL at 360px
- No-flash proof: <how verified>
- DOM safety: check-unsafe-dom baseline unchanged

## Risks
- <e.g. first-paint script must stay in sync with nav.js auto-resolution>

## Follow-ups
- <anything deferred, with file/line>
```
