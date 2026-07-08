# Phase 21 — Homepage overhaul (Track F · Yellow — visual-regression gated)

The homepage is the flagship surface and has already been through many visual revamps, so a
speculative redesign would be high-risk and low-value. This phase instead (1) builds the
**visual-regression gate** the phase name references — which did not exist — and (2) ships a set of
**concrete, objectively-verifiable** homepage fixes surfaced by a full structured audit of
`index.html` / `src/pages/home.js` / `styles/pages/home.css`. No speculative aesthetic churn.

## 1. Visual-regression gate — `scripts/qa/home-visual-baseline.mjs`

Fully local, **$0** (no hosted visual-diff service — respects the cost constraint):

- Renders the built `dist/index.html` in headless Chromium across **3 viewports × {light, dark}**
  (mobile 390, tablet 768, desktop 1280) and writes two artefacts under `reports/visual/`:
  - **`home/*.png`** — full-page screenshots for human pixel review (git-ignored; regenerated on
    demand so the repo stays lean).
  - **`home-signature.json`** — a **committed, diffable** structural + dimensional digest: section
    id list, full heading outline, landmark/img/button/link counts, and the authoritative rendered
    full-page height per viewport (read from each screenshot's PNG IHDR — robust to the homepage's
    inner-scroll-container architecture, where `documentElement.scrollHeight` reports only the
    viewport).
- `--check` mode fails (exit 1) when the structure changes at all, or any viewport's rendered height
  drifts >12% from the committed baseline — the gate future homepage phases run.
- CodeQL-safe: constant out dir + in-memory-Map file server (`req.url` never reaches an `fs` call),
  matching the console/perf/axe harnesses.
- Handles headless scroll-reveal: forces `[data-reveal]` sections to their settled `.is-in-view`
  state before capture (the IntersectionObserver never fires during a fullPage screenshot).

Baseline captured this phase: 1 `h1`, 21 sections, clean h1→h6 outline (no skipped levels), 1 nav /
1 main / 1 footer, rendered heights 10903 (mobile) / 9592 (tablet) / 8131 (desktop) px.

**Proof the gate works:** after applying the fixes below, `--check` still passes against the
pre-edit baseline — confirming every change is structurally and dimensionally non-regressing.

## 2. Concrete fixes shipped

**Accessibility (objective WCAG defects):**

1. **Empty link with no discernible text** — `index.html` `#gcc-see-all` was `<a …></a>` (text only
   injected by JS). Fails WCAG 2.4.4 / 4.1.2 if JS defers/fails. Added the fallback text
   (`See all countries →`, matching the runtime `tx('seeAll')`) — consistent with its sibling
   section links, which already ship fallback text.
2. **Two top-level `<section>`s missing accessible names** — `#methodology` and `#location-guides`
   had no `aria-labelledby`, so they weren't exposed as named landmarks like every sibling section.
   Pointed each at its existing `<h2>` id.
3. **Tabpanel incomplete (ARIA tabs pattern)** — `#gcc-quick-grid` (`role="tabpanel"`) had no
   `aria-labelledby` and no `tabindex`. Added `aria-labelledby="gcc-tab-gcc"` + `tabindex="0"`, and
   the region-tab click handler in `home.js` now repoints `aria-labelledby` at the active tab on
   switch.
4. **Ignored `aria-label` + weak KPI semantics** — `.home-stats-grid` carried an `aria-label` that
   AT ignores on a role-less `<div>`, and its four KPI tiles were `<article>` (implies
   self-contained headed content). Gave the grid `role="list"` (so the label is now announced) and
   the tiles `role="listitem"`.

**Correctness / hygiene:**

5. **Undefined design token** — `styles/pages/home.css` karat tooltip used
   `background: var(--color-gray-900, #1a1a1a)`, but `--color-gray-900` is defined nowhere, so it
   silently relied on the literal. This tooltip is intentionally dark in both themes (paired with
   fixed white text), so made the intent explicit: `background: #1a1a1a` with a comment (matching
   the file's existing documented theme-invariant-literal pattern).
6. **Dead duplicate statement** — `src/pages/home.js` removed a doubled
   `priceEl.classList.remove('hlc-price--loading')`.

## 3. Registered follow-ups (deliberately not touched)

- **Trust-banner `<h3>` heading level** (`index.html` `#trust-banner-title`) reads as a subsection
  rather than a section peer (WCAG 1.3.1). Not a strict skipped level, and its styling is coupled to
  the `.trust-banner-content h3` selector — promoting the tag risks a visual regression, so it needs
  a coordinated CSS+visual pass. Left for a dedicated change.
- **Residual `var(--token, <literal>)` fallbacks** in `home.css` where the token name differs from
  the compared token (e.g. `--color-up`, `--surface-secondary`) — several of these tokens may be
  undefined-and-relying-on-the-fallback (as `--color-gray-900` was), so blind fallback removal is
  unsafe. Belongs with a token-definition audit (Phase 17 territory), not a homepage edit.

## Gate

`npm run build` + `npm run validate` + `npm test` (1286 pass) + `npm run lint` — all green.
`node scripts/qa/home-visual-baseline.mjs --check` passes against the committed baseline. Homepage
axe (A + AA) shows no new violations from the added ARIA semantics.
