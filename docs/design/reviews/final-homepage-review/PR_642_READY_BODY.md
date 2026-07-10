# PR #642 — proposed body (paste into GitHub if `gh` cannot update it)

---

## redesign(home): A‑synthesis homepage — WIP (DO NOT MERGE until owner visual approval)

Warm editorial "bullion‑terminal" homepage on a single canonical price source, with a signature
interactive karat dial/ladder, inline calculator, audience‑routing, live market‑read, Gulf
editorial, and a premium learn rail. Custom illustration/material/data visuals — **no stock/fake
photography**. `main` untouched.

### Scope

- New/restyled homepage sections: hero · nav price‑pill · audience‑routing band · market‑read
  (+trust) · karat ladder + interactive dial · inline quick‑convert · Gulf‑market editorial · learn
  rail. Footer kept as‑is.
- New canonical resolver `src/lib/spot-resolver.js` (F‑1): one memoized read point every surface
  derives from — homepage and calculator cannot diverge.
- Touched: `index.html`, `src/pages/home.js`, `src/components/QuickConvertWidget.js`,
  `src/config/translations.js`, `src/lib/spot-resolver.js`, `styles/design-system.css`,
  `styles/pages/home-redesign.css`, `public/sitemap.xml`, `tests/spot-resolver.test.js`. **16
  commits ahead of `main`; +2649/−75.**

### Evidence

Full review + screenshots (before/after, EN/AR, desktop/mobile, per‑section, freshness states,
reduced‑motion):

- `docs/design/reviews/final-homepage-review/FINAL_HOME_REDESIGN_REVIEW.md`
- `docs/design/reviews/final-homepage-review/screens/`
- per‑section gate evidence under
  `docs/design/reviews/{hero,nav,routing,market,karat,calc,gulf,learn}-gate/`

### F‑1 pricing proof (canonical spot 4107.2002)

One value across nav pill, hero, routing, karat dial, karat ladder, inline calc, Gulf grid **and**
`calculator.html`, identical EN/AR: 24K/g **484.95 AED**; ladder 484.95 / 444.54 / 424.33 / 363.71 /
282.89. Invariants: peg **3.6725**, troy **31.1035 g**, purity **karat/24**, AED never from the FX
feed, spot ≠ retail. (See review §4.)

### Validation

- **Tests 1581/1581 pass**, lint clean, build clean (≈3.5s).
- **0 real console errors** (only external GA beacons abort in the headless sandbox).
- **axe‑core WCAG2AA** on desktop+mobile EN/AR: `nested-interactive` regression fixed this branch;
  remaining contrast/scrollable‑region items are **pre‑existing** (not redesign regressions) and
  documented as follow‑ups.
- RTL/Arabic, mobile, and reduced‑motion validated (review §9).

### Fixes in the latest 2 commits

- `fix(home)`: nav price‑pill dot now reflects real‑time freshness (was trusting stored
  `freshnessSeconds`, could falsely show "live" if the hourly refresh stalls).
- `fix(a11y,home)`: karat ladder `nested-interactive` resolved — radio moved onto the
  `.karat-strip-k` rung so the copy button is a sibling, not a nested descendant.

### Deferred decisions (need owner)

1. **Dark mode** — deferred (none in this PR).
2. **"Major Gold Markets" photo section** — kept; decide keep+restyle / retire / move.
3. **Footer** — kept as‑is; dark/multi‑column footer is a site‑wide follow‑up.

### Known deviations / risks

- Mobile hero CTA sits below the editorial block (reviewed, acceptable).
- Pre‑existing a11y contrast + one mobile scrollable‑region → follow‑ups (`POST_HOME_FOLLOWUPS.md`).
- Risk low: fixes localized to `home.js`, fully validated; no pricing‑constant/workflow/SW changes.

### Reviewer checklist

- [ ] Visual approval of hero, karat dial/ladder, market‑read, Gulf editorial, learn rail (EN + AR,
      desktop + mobile).
- [ ] Confirm F‑1 values match `calculator.html`.
- [ ] Decide the 3 deferred items above.
- [ ] Confirm the mobile hero CTA placement is acceptable.

> **DO NOT MERGE until owner visual approval.**
