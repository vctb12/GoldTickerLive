# Dead-CSS Quarantine — Phase 2

> **Plan:** `docs/plans/2026-07-12_design-revamp-30-phases.md` → **Act I, Phase 2** (🟢 quarantine
> dead CSS). **Result:** 388 confirmed-dead CSS rules relocated from 13 stylesheets into
> `styles/_graveyard/` (reversible; the graveyard is imported/linked by nothing, so it ships zero
> bytes). Shipped CSS dropped **41,887 → 39,336 lines (−2,551, ~6.1%)** with **zero live-rule
> changes** and **zero test/build/validate regressions**.

**Snapshot:** on top of `4b299c4` (post-Phase-1) · branch `claude/gold-ticker-design-system-iin2va`.

---

## What "dead" means here, and the plan correction

A CSS class is **dead** only if no HTML element ever carries it — in committed HTML, in
build-generated HTML, or via runtime JS. This phase moves only rules that are **all-dead,
class-only, and top-level** (see gates below). Element/attribute/id selectors and any rule with a
single live class were left in place.

> **Plan correction (carried from the Phase-2 coverage pass):** the plan named
> `styles/pages/tracker-pro-v4.css` (491 lines) as a dead file to delete. It is **not dead** — it
> has no HTML `<link>` but is `@import`-ed at `tracker-pro.css:5`, so it ships on `tracker.html`. It
> was **not** deleted. Consolidating that `-v4` split is Phase 16 (tracker rebuild).

---

## How deadness was established — two independent methods, both required

1. **Deterministic coverage** (`scripts/design/css-coverage.mjs`, postcss-based). Corpus = all
   committed HTML + all JS/TS/MJS source **+ the built `dist/` HTML** (`npm run build` first). A
   class is "used" if its exact literal appears, or a BEM/hyphen stem appears (covers class names
   built by string concatenation like `'gtl-dot--' + state`). The dist pass matters: it rescued
   **13** rules that looked dead in source but appear in build-generated markup.
2. **Adversarial verification** (13-agent workflow, one per file). Each agent tried to **refute**
   deadness — grepping the whole repo for literal use, dynamic construction, `classList` /
   `querySelector` / `matches` / `closest` calls, Playwright/unit-test references, and generation
   scripts — and returned `KEEP` on any evidence or any doubt.

**Verdict: 388 candidates, 388 CONFIRM_DEAD, 0 KEEP.** The agents drew exactly the distinctions a
literal grep would miss, e.g.:

| Rule                  | Why it's dead (agent evidence)                                                 |
| --------------------- | ------------------------------------------------------------------------------ |
| `.chip-label`         | only ever appears as `insights-chip-label` (a different token)                 |
| `.status-banner`      | only `data-status-banner` (an attribute name) exists; the class does not       |
| `.section-header`     | only prefixed variants used (`card-section-header`, `insights-section-header`) |
| `.unit-btn`           | only `kstrip-unit-btn` used; the bare class is gone                            |
| `.country-card`       | only `country-cards-*` **ids** exist; the class does not                       |
| `.footer-newsletter*` | superseded by the JS-rendered footer (`src/components/footer.js`), 0 hits      |

These are coherent **stranded design blocks** (an old insights hero + price-bar, the pre-JS footer
newsletter, old freshness chips, an old status/offline banner, an old country-card grid), not
scattered selectors — consistent with them being whole features that were redesigned away.

## Safety proof

- **Zero live-rule content changed.** A normalized rule-set diff (old vs new, per file) shows every
  remaining rule is byte-identical; only the 388 dead rules left. (The small `+` counts in
  `git diff` are blank-line boundary re-pairing, not content.)
- **Moving a rule that matches no element cannot change rendering** — the entire risk reduces to "is
  the deadness call correct?", which two independent methods confirm.
- **Gates (all green):** `npm run build` ✅ · `npm test` **1656/1656** ✅ · `npm run validate` ✅ ·
  `stylelint` ✅ (source **and** graveyard).

---

## What moved

| File                                  | before | after | rules moved | graveyard file                             |
| ------------------------------------- | -----: | ----: | ----------: | ------------------------------------------ |
| `styles/partials/components.css`      |  4,714 | 3,655 |         148 | `_graveyard/partials__components.css`      |
| `styles/partials/utilities.css`       |  3,733 | 3,313 |          81 | `_graveyard/partials__utilities.css`       |
| `styles/pages/insights.css`           |  1,296 |   738 |          74 | `_graveyard/pages__insights.css`           |
| `styles/admin.css`                    |  3,013 | 2,836 |          30 | `_graveyard/admin.css`                     |
| `styles/pages/tracker-pro.css`        |  5,271 | 5,119 |          20 | `_graveyard/pages__tracker-pro.css`        |
| `styles/partials/skeleton.css`        |    185 |   127 |          13 | `_graveyard/partials__skeleton.css`        |
| `styles/partials/base.css`            |    890 |   860 |           5 | `_graveyard/partials__base.css`            |
| `styles/pages/compare.css`            |    875 |   848 |           4 | `_graveyard/pages__compare.css`            |
| `styles/partials/layout.css`          |    382 |   357 |           4 | `_graveyard/partials__layout.css`          |
| `styles/partials/motion-advanced.css` |    380 |   356 |           4 | `_graveyard/partials__motion-advanced.css` |
| `styles/design-system.css`            |    351 |   339 |           3 | `_graveyard/design-system.css`             |
| `styles/pages/shops.css`              |  2,890 | 2,885 |           1 | `_graveyard/pages__shops.css`              |
| `styles/partials/shell.css`           |     51 |    47 |           1 | `_graveyard/partials__shell.css`           |
| **Total**                             |        |       |     **388** | 13 files                                   |

**Biggest win is the shared base:** `components` + `utilities` + `skeleton` + `base` + `layout` +
`motion-advanced` are `@import`-ed on **every page** — this removed **~1,616 lines from the shared
base that every page downloads** (11,509 → ~9,893).

---

## What was deliberately NOT touched

- **`tracker-pro-v4.css`** — live via `@import` (see correction above).
- **162 "REVIEW" rules** — rules with dead classes that are _not_ auto-movable because they contain
  a bare element/attribute/id selector (could match without the class) or mix a live and a dead
  class. These need per-rule human judgement; deferred, listed by
  `node scripts/design/css-coverage.mjs --with-dist`.
- **`#id` selectors** — excluded from the automated pass (hex literals in property values pollute
  static id detection; ids need manual review).

## Reversing / retiring

- **To restore a rule:** copy it from its `styles/_graveyard/*.css` file back into the source file
  it names in the header. The graveyard preserves the exact rule text.
- **To retire the graveyard:** delete `styles/_graveyard/` after one release cycle with no
  regression reports. It is linked/imported by nothing, so deletion is a no-op for the shipped site.
- **To re-audit at any time:** `npm run build && node scripts/design/css-coverage.mjs --with-dist`.
