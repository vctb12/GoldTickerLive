# Final Homepage Redesign Review — PR #642 (`redesign/home`)

**Reviewer:** autonomous production-readiness shift (resumed from committed state `812c91d84`)
**Date:** 2026-07-10 **Verdict:** ✅ **Ready for owner visual approval.** Do **NOT** merge until the
owner signs off on the visuals and the deferred decisions below. Three QA fixes were made and
validated during this shift (see §7).

---

## 1. Executive summary

The A‑synthesis homepage redesign replaces the old tool‑grid homepage with a warm editorial
"bullion‑terminal" identity: a canonical single‑source price surfaced consistently across every
surface, a signature interactive karat dial/ladder, an inline calculator, audience‑routing, a live
market‑read, Gulf‑market editorial, and a premium learn rail. All illustration/material/data visuals
— no stock/fake photography.

I independently re‑verified the prior session's headline claims (did not merely trust them):

- **Tests:** `npm test` → **1581/1581 pass, 0 fail, 0 skipped** (re‑run twice, after each of my
  fixes).
- **Build:** `npm run build` → clean (≈3.5s). **Lint:** `eslint .` → clean.
- **F‑1 canonical pricing:** proven live across 8+ homepage surfaces **and** the standalone
  calculator page, identical in EN and AR (§4).
- **Console:** **0 real console errors** across all captured pages (the only network noise is
  external Google Analytics beacons, which abort in the headless sandbox — not a page defect).
- **Accessibility (axe‑core WCAG2AA):** I found real violations the prior pa11y(htmlcs) pass missed.
  One was a **new serious regression in this PR** (karat ladder nested‑interactive) — **fixed and
  validated** this shift. The rest are **pre‑existing** (not redesign regressions): shared
  color‑contrast + a mobile scrollable‑region; footer items are covered by the deferred‑footer
  decision (§6, §8).

**Bottom line:** the redesign is coherent, the canonical pricing holds everywhere, EN/AR + mobile
are solid, and the three issues worth fixing before human review were fixed and validated. Remaining
items are pre‑existing debt, documented as follow‑ups.

---

## 2. Branch / PR facts (git‑verified)

| Item                 | Value                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Branch               | `redesign/home`                                                                                                                                                                                                                                        |
| PR                   | **#642** — OPEN, base `main`, "redesign(home): A‑synthesis homepage — WIP (do not merge)"                                                                                                                                                              |
| Latest commit        | `30f25152d` (this shift) on top of `812c91d84` (prior session)                                                                                                                                                                                         |
| `main`               | `d9c5d7d25` — **untouched**, `HEAD` is a clean descendant, **19 commits ahead**                                                                                                                                                                        |
| Diff vs main         | 49 files, **+2649 / −75** (incl. committed gate screenshots)                                                                                                                                                                                           |
| Source files changed | `index.html`, `public/sitemap.xml`, `src/components/QuickConvertWidget.js`, `src/config/translations.js`, `src/lib/spot-resolver.js`, `src/pages/home.js`, `styles/design-system.css`, `styles/pages/home-redesign.css`, `tests/spot-resolver.test.js` |
| Working tree         | clean except the untracked review folders (this doc + screenshots) and a prior stray `docs/design/reviews/footer-gate/AFTER_desktop_en.png`                                                                                                            |

No force‑push, no merge, `main` never modified.

---

## 3. Before / after verdict

Genuine full‑page BEFORE captures were taken from a temporary worktree of `main` (`d9c5d7d25`);
AFTER from `redesign/home`.

- **Identity:** generic light tool‑grid → warm editorial bullion‑terminal (serif display headings,
  gold accents, material/illustration system).
- **Hero:** on `main` the hero price rendered a **divergent** value (`4,105.40`) vs the committed
  spot — exactly the F‑1 problem this PR fixes. AFTER: one canonical value everywhere.
- **Sections:** "Live Gold Prices" grid / "Gold Price Chart" → editorial "Is today a high or a low?"
  market‑read, "Every karat, one live price" karat dial+ladder, inline quick‑convert, Gulf
  editorial, premium learn rail.
- **Verdict:** substantial, intentional visual + architectural upgrade. See `screens/BEFORE_*` vs
  `screens/AFTER_*`.

---

## 4. F‑1 canonical pricing proof

**Canonical source (committed fixture `data/gold_price.json`): `xau_usd_per_oz = 4107.2002`.**
Resolver `src/lib/spot-resolver.js` → `getCanonicalSpot()` (single‑flight memoized) is the single
read point; `fetchGold()` maps `price = xau_usd_per_oz`; every surface derives via
`usdPerGram = spot / TROY_OZ_GRAMS × purity` and `AED = usdPerGram × AED_PEG` (AED never taken from
the FX feed).

Invariants confirmed in code: **AED peg 3.6725** (`src/config/constants.js`), **troy 31.1035 g**,
**purity = code/24** (`src/config/karats.js`), spot ≠ retail (labeled throughout).

Live cross‑surface capture (settled, `screens/` + `f1-surfaces.json`) — **EN ≡ AR, one value
everywhere:**

| Surface                                       | Value                                          | Check                                    |
| --------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| Nav price‑pill (XAU/USD)                      | **$4,107.20**                                  | = canonical spot                         |
| Nav price‑pill (24K AED/g)                    | **484.95**                                     | = 4107.2002/31.1035×3.6725               |
| Hero spot                                     | 4,107.20 (per troy oz)                         | = canonical spot                         |
| Audience‑routing "buy" 24K                    | **484.95**                                     | matches                                  |
| Karat dial (24K, purity .999)                 | **484.95 د.إ**                                 | matches                                  |
| Karat ladder 24 / 22 / 21 / 18 / 14           | **484.95 / 444.54 / 424.33 / 363.71 / 282.89** | each = 484.95 × karat/24                 |
| Inline quick‑convert (10 g, 24K)              | **4,849.52 د.إ**                               | = 10 × 484.95                            |
| Gulf grid (22K/g)                             | **444.54**                                     | = ladder 22K                             |
| **Calculator page** `calculator.html` (24K/g) | **484.95**                                     | **homepage ↔ calculator do not diverge** |

Math spot‑check (Python): 24K/g 484.952; 22K 444.54; 21K 424.33; 18K 363.71; 14K 282.89 — all match
rendered values. **F‑1 holds.**

> Note: the committed fixture also carries a convenience field `usd_per_gram_24k: 132.049553`; the
> resolver does **not** read it (it derives from `xau_usd_per_oz`), so it cannot cause surface
> divergence. Both round to the same displayed value.

---

## 5. Freshness — honest live / delayed / cached / stale

Freshness is driven by real‑time age (`getLiveFreshness`) + upstream truth flags, with an
anti‑mislabel guarantee (an explicit fallback/`is_fresh:false` always downgrades; stale is never
shown as live). Captured evidence (`screens/freshness_*`), driven by intercepting the data file with
real committed prices and varied timestamps/flags:

| State          | Nav pill dot       | Label                                         |
| -------------- | ------------------ | --------------------------------------------- |
| Live           | green (base)       | "Live · Gold‑API.com · 4 sec. ago"            |
| Delayed/Cached | amber (`--cached`) | "Delayed …" / "Cached …"                      |
| Fallback       | red (`--fallback`) | "Fallback …"                                  |
| Stale          | red (`--stale`)    | "Stale · 6 hr. ago" / AR "قديم · قبل 6 ساعات" |

**Offline‑sandbox honesty:** the client's third‑party live‑liveness probe to gold‑api.com cannot
complete in the QA sandbox, so some surfaces honestly degrade to **Cached/Delayed** even with a
fresh timestamp — the committed price stays correct and consistent; this is the anti‑mislabel guard
working, not a defect. In production (hourly refresh + reachable probe) these read Live.

---

## 6. Accessibility (axe‑core WCAG2A/2AA)

Ran axe‑core (stricter than the prior pa11y/htmlcs pass) on homepage **desktop + mobile × EN + AR**
(`axe-results.json`). Passes ≈36–37 rules per variant.

**After my fix — remaining violations (all PRE‑EXISTING on `main`, not redesign regressions):**

| Rule                        | Impact  | Nodes      | Selectors                             | Scope                                                     |
| --------------------------- | ------- | ---------- | ------------------------------------- | --------------------------------------------------------- |
| color-contrast              | serious | 2–6        | `#trust-*-sub`, `#hfb-text`           | Pre‑existing (defined in unchanged CSS; `main == branch`) |
| color-contrast              | serious | mobile     | `.footer-col-heading`, `.footer-copy` | **Footer — deferred decision #3** (keep as‑is)            |
| scrollable-region-focusable | serious | 1 (mobile) | `.trust-inner`                        | Pre‑existing (shared trust strip horizontal scroller)     |

I verified these are pre‑existing: the failing selectors are **not** defined in the two CSS files
this PR changed, and don't exist in `main`'s copies of those files → their styling comes from
unchanged files. Recommended as follow‑ups (§8), not blockers for the redesign.

**Manual checks:** one `<h1>`, single `<main>`, `html[lang]`/`dir` correct (EN ltr / AR rtl), skip
link present, karat ladder is a proper **radiogroup** (after fix — arrow keys move selection +
dial + focus, exactly one radio checked), copy buttons have accessible names and don't hijack
selection, decorative dial is `aria-hidden` with the rungs as the SR/keyboard path.

---

## 7. Fixes made during this shift (both committed + validated)

**(a) `3d04c5a02` — nav price‑pill dot now reflects real‑time freshness.** The pill dot used the
resolver's `classifyFreshness` (which trusts the file's stored `freshnessSeconds`). If the hourly
refresh stalls, that value freezes small while real age grows — the pill would keep signalling green
"live" while the freshness bar/HLC correctly read "Stale." Now the dot is driven by the same
age‑based `getFreshnessMeta()` as the bar/HLC and re‑synced on the freshness timer. Adds a
`gtl-dot--stale` tier. _Validated:_ pill dot matches label in every state, EN + AR; 1581/1581 tests.

**(b) `59c88c67d` — karat ladder nested‑interactive (WCAG serious) resolved.** This PR made each
`.karat-strip-item` a `role="radio"` but the tile still contained the role=button rung **and** the
copy `<button>` — interactive controls nested inside a radio (a **new** regression vs `main`, where
tiles were plain divs). Moved the radio semantics (role, aria‑checked, roving tabindex,
Enter/Space + arrow nav) onto the inner `.karat-strip-k` rung so the copy button is a **sibling**,
not a descendant; dropped the redundant role=button and the invalid `aria-pressed`; call
`initKaratDial()` at init so keyboard access exists even if the resolve later fails. _Validated:_
axe nested‑interactive **cleared** on all 4 variants; 1581/1581 tests; keyboard nav + dial sync +
copy independence confirmed in a live browser.

**(c) `30f25152d` — opaque sticky freshness banner (responsive fix, found in the §13 width pass).**
The freshness banner is `position: sticky` (z‑index 100) and floats over the sections scrolling
beneath it, but its token backgrounds are 9%‑alpha tints — so content **bled through** and collided
with the banner text, most visibly on narrow (360) / tablet (768) widths where the banner wraps to
multiple lines over the karat ladder / calculator / Gulf cards (only in delayed/cached/stale
states). Composited the tint over the opaque page background in the PR‑owned `home-redesign.css`.
_Validated:_ 1581/1581 tests, build + stylelint clean; axe shows **no new** violations (and the
opaque bg lets axe correctly clear the prior `#hfb-text` contrast flag); before/after re‑captured.

---

## 8. Known deviations, deferred decisions, risks, follow‑ups

**Ratified deferred decisions (unchanged this shift):**

1. **Dark mode — DEFERRED.** No dark variant in this PR. (A nav theme‑toggle button exists as a
   pre‑existing site control; no dark styling shipped here.)
2. **"Major Gold Markets" licensed photo section — KEPT** (present on the live page,
   `screens/sec_markets_photo_*`), decision deferred to final review with 3 options (keep+restyle /
   retire since Gulf editorial replaces it / move to a deeper market page). **Not deleted.**
3. **Footer — KEPT as‑is.** Dark/multi‑column footer is a post‑homepage site‑wide follow‑up; footer
   contrast items above fall under this.

**Known deviations:**

- Mobile hero: the mobile CTA sits below the editorial block (known, per prior session). Reviewed;
  acceptable within the approved direction — see `screens/AFTER_home_mobile_en`.
- "Live" screenshots use the real committed **prices** with the fixture **timestamp set to now** to
  represent the hourly‑refreshed production state; documented in §5.

**Pre‑existing a11y follow‑ups (not this PR's regressions):**

- Contrast on `#trust-*-sub` and `#hfb-text` (raise to ≥4.5:1).
- `.trust-inner` mobile horizontal scroller needs `tabindex="0"` for keyboard scroll access.
- Footer contrast (rolls into the deferred footer redesign).

**Risks:** low. Both fixes are localized to `src/pages/home.js`, fully test/axe/keyboard‑validated.
No pricing‑path, workflow, or `constants.js` changes.

---

## 9. Validation matrix

| Check                       | Result                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Unit tests (`npm test`)     | 1581/1581 pass, 0 fail/skip                                                                                            |
| Lint (`eslint .`)           | clean                                                                                                                  |
| Build (`npm run build`)     | clean (≈3.5s); fixes confirmed present in the production bundle                                                        |
| Console errors              | 0 real (only external GA beacons abort in sandbox)                                                                     |
| F‑1 pricing consistency     | ✅ 8+ surfaces + calculator, EN ≡ AR                                                                                   |
| Accessibility (axe WCAG2AA) | 0 nested‑interactive after fix; remainder pre‑existing (documented)                                                    |
| RTL / Arabic                | ✅ mirrored layout, Arabic copy, bidi‑isolated numerals, honest Arabic freshness                                       |
| Mobile (390)                | ✅ EN + AR full‑page + axe                                                                                             |
| Reduced motion              | ✅ `prefers-reduced-motion` honored; 18 reveals, 0 stuck‑hidden (no info lost)                                         |
| Device widths               | ✅ **360 · 390 · 768 · 1440 · 1920, EN + AR** (screens + overflow probe; axe on 360/390/768/1440/1920 EN+AR) — see §13 |

---

## 10. Coverage honesty / limitations

- Screenshots were captured against a **production‑faithful static server** (repo‑root, unbundled =
  the same source the Vite bundle compiles; I separately verified the production `dist/` bundle
  contains both fixes). `vite preview` was **not** used for evidence because its SPA fallback
  mis‑serves `/data/*.json` and `/src/*` — an artifact that does not exist under GitHub Pages static
  hosting or the project's own Playwright config.
- Responsive widths are now fully covered (§13): 360 / 390 / 768 / 1440 / 1920, EN + AR.
- The `/ar/` route is served client‑side (path/`?lang=ar` detection); AR evidence uses the canonical
  `?lang=ar` switch (the same target the `hreflang="ar"` tag points to).

---

## 11. Screenshot index (`docs/design/reviews/final-homepage-review/screens/`)

**Before/after full pages:** `BEFORE_home_desktop_en|ar.png`, `BEFORE_home_mobile_en|ar.png`,
`AFTER_home_desktop_en|ar.png`, `AFTER_home_mobile_en|ar.png`,
`AFTER_home_desktop_en_reducedmotion.png`. **Sections (EN + AR):** `sec_hero_*`, `sec_nav_pill_*`,
`sec_routing_*`, `sec_market_chart_*`, `sec_trend_*`, `sec_karat_*`, `sec_dial_*`,
`sec_quickconvert_*`, `sec_gulf_*`, `sec_learn_*`, `sec_markets_photo_*` (deferred photo section),
`sec_footer_*`. **Freshness states:** `freshness_{live,cached,stale}_navpill.png`,
`freshness_{live,cached,stale}_label.png`. **Responsive widths (§13):**
`AFTER_home_{narrow360,tablet768,wide1920}_{en,ar}.png` and
`sec_{karat,gulf,quickconvert}_{narrow360,tablet768}_{en,ar}.png`. **Data:** `axe-results.json`,
`console-errors.json`, `f1-surfaces.json`.

---

## 12. Final PR‑readiness verdict

✅ **Ready for owner visual approval.** Redesign is coherent, F‑1 holds everywhere, EN/AR + mobile +
reduced‑motion + responsive widths validated, tests/lint/build green, console clean, and the three
pre‑merge‑worthy issues were fixed and validated. **Keep #642 do‑not‑merge until the owner approves
the visuals and resolves the three deferred decisions.**

---

## 13. Responsive‑width QA (added pass)

Dedicated width sweep across **360 (narrow mobile), 390, 768 (tablet), 1440, 1920 (wide)** in **EN
and AR** — full‑page captures + a programmatic overflow/tap‑target/nav probe
(`responsive-diag.json`) + layout‑sensitive section closeups (karat ladder, Gulf grid, calculator)
at 360/768.

**Checked per width × locale:** horizontal overflow, cramped spacing, tap targets, sticky‑nav
overlap, karat dial/ladder layout, calculator inputs, Gulf tabs/cards, learn rail, footer, RTL
composition.

**Findings:**

- **No page‑level horizontal overflow at any width or locale**
  (`documentElement.scrollWidth == viewport` everywhere). The elements that extend past the viewport
  are all inside intentional horizontal scrollers (the ticker marquee and market‑strip carousel),
  which are correctly clipped — the body never scrolls sideways.
- **Layouts adapt correctly:** narrow/mobile stacks to a single column (Gulf cards stack, karat
  ladder wraps to a 3+2 grid); tablet is a comfortable 2‑column hero; desktop/wide are max‑width
  capped so 1920 becomes centered content with side gutters (no over‑stretch).
- **RTL is correct at every width** (mirrored hero, karat dial at the RTL‑start, correct tile order,
  bidi‑isolated numerals, Arabic freshness).
- **Calculator** inputs fit and stay legible at 360 (weight + unit side‑by‑side, formula visible,
  spot≠retail note intact); **F‑1 holds at every width** (24K/g 484.95; 10 g → 4,849.52).
- **One issue found & fixed (§7c, `30f25152d`):** the sticky freshness banner bled content through
  its 9%‑alpha background on narrow/tablet in delayed/cached/stale states — made opaque.
- **Tap targets:** the only sub‑24px interactive controls are inline text links (exempt from
  min‑target‑size) and the pre‑existing `.gcc-copy-btn` (22 px wide × 44 tall — 2 px under the AA
  target; pre‑existing, shared, noted in `POST_HOME_FOLLOWUPS.md`).

**Verdict:** the redesign is responsive‑clean across the full width range; the one real defect found
was fixed and re‑validated (tests/build/stylelint green, axe no new violations).
