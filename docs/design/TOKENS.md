# Unified Token Contract — Phase 3

> **Plan:** `docs/plans/2026-07-12_design-revamp-30-phases.md` → **Act I, Phase 3** (🟢 spec only,
> no migration). This document decides the **one** token vocabulary and publishes the complete
> `--gtl-*` → canonical mapping that Phases 4 (land primitives), 5 (codemod), and 6 (retire
> `design-system.css`) execute. **No CSS changes in this phase.**

**Snapshot:** on top of Phase 2 · branch `claude/gold-ticker-design-system-iin2va`.

---

## The decision

**`styles/partials/tokens.css` is the single canonical token system.** It is the mature,
WCAG-annotated, dark-mode-complete vocabulary already loaded on every page via `global.css`. The
`--gtl-*` layer in `styles/design-system.css` is **retired**: it is a thin re-labelling of
tokens.css (13 of its 45 vars are already `var(--color-*)` aliases) plus a parallel primitive scale
that mostly duplicates values tokens.css already defines.

**Namespace = keep the existing `--*` names.** No renaming of the canonical system — it is the
larger, more-consumed vocabulary (258 unique vars used across 40+ files vs. 45 `--gtl-*` in 12
files). The `--gtl-*` primitives fold into the canonical scales that already exist:

| Concern                      | Canonical namespace (tokens.css)                                 | Example                                               |
| ---------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| Color (semantic)             | `--color-*`                                                      | `--color-ink-data`, `--color-gold`, `--color-move-up` |
| Text (roles)                 | `--text-*`                                                       | `--text-primary`, `--text-on-dark`                    |
| Type scale                   | `--text-2xs … --text-6xl`, `--type-ratio`                        | modular ×1.25                                         |
| Spacing                      | `--space-0 … --space-10` (`--space-unit` 0.25rem)                | 4px base                                              |
| Radius                       | `--radius-xs … --radius-full`, semantic `--radius-card/panel/…`  |                                                       |
| Shadow / elevation           | `--shadow-*`, `--elev-1..5`, `--shadow-gold*`                    |                                                       |
| Weight / leading / tracking  | `--weight-*`, `--leading-*`, `--tracking-*`                      |                                                       |
| Duration / ease / transition | `--duration-*`, `--ease-*`, `--transition-*`                     |                                                       |
| Motion (named)               | `--motion-*`                                                     | `--motion-spot-ring`                                  |
| Font family                  | `--font-display / --font-sans / --font-numeric`                  | RTL swaps `--font-display`                            |
| Layout / focus / z           | `--content-max-width`, `--nav-height`, `--focus-ring-*`, `--z-*` |                                                       |

---

## Complete `--gtl-*` → canonical mapping (all 45)

**Action legend:**

- **ALIAS-drop** — `--gtl-*` is already `var(--color-*)`; Phase 5 replaces the reference with the
  target directly. Zero value change.
- **EXACT** — value is identical to an existing canonical token; Phase 5 is a pure rename. Zero
  value change.
- **ADD (P4)** — no canonical token holds this value and it is structurally needed; Phase 4 adds it
  as a canonical token _preserving the value_, then Phase 5 renames. Zero value change.
- **HARMONIZE (P7)** — a near-duplicate that differs from its nearest canonical token by a small
  delta. **Not** folded in Phase 5 (which stays value-preserving); the delta is absorbed when the
  surface is rebuilt in Phase 7 ("redesign wins"), so no rename smuggles a visual change.

### Semantic aliases → drop to the `--color-*` target (13) · ALIAS-drop

| `--gtl-*`         | → canonical             |
| ----------------- | ----------------------- |
| `--gtl-paper`     | `--color-bg`            |
| `--gtl-surface`   | `--color-surface`       |
| `--gtl-ink`       | `--color-text`          |
| `--gtl-ink-muted` | `--color-text-muted`    |
| `--gtl-ink-faint` | `--color-text-faint`    |
| `--gtl-ink-data`  | `--color-ink-data`      |
| `--gtl-gold`      | `--color-gold`          |
| `--gtl-gold-deep` | `--color-gold-dark`     |
| `--gtl-gold-soft` | `--color-gold-tint`     |
| `--gtl-line`      | `--color-border`        |
| `--gtl-line-soft` | `--color-border-subtle` |
| `--gtl-up`        | `--color-move-up`       |
| `--gtl-down`      | `--color-move-down`     |

### Fonts (3) · EXACT

| `--gtl-*`     | value                    | → canonical      | note                                                                                                   |
| ------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------ |
| `--gtl-serif` | Playfair Display … serif | `--font-display` | primary face identical; canonical stack adds the Cairo fallback (better AR) — an improvement, adopt it |
| `--gtl-sans`  | `var(--font-sans …)`     | `--font-sans`    | already the same                                                                                       |
| `--gtl-num`   | `var(--gtl-sans)`        | `--font-numeric` | canonical has a dedicated numeric alias                                                                |

### Spacing (10) · EXACT except one ADD

| `--gtl-*`  | value | → canonical      | action                                                                                                   |
| ---------- | ----- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `--gtl-1`  | 4px   | `--space-1`      | EXACT                                                                                                    |
| `--gtl-2`  | 8px   | `--space-2`      | EXACT                                                                                                    |
| `--gtl-3`  | 12px  | `--space-3`      | EXACT                                                                                                    |
| `--gtl-4`  | 16px  | `--space-4`      | EXACT                                                                                                    |
| `--gtl-5`  | 24px  | `--space-5`      | EXACT                                                                                                    |
| `--gtl-6`  | 32px  | `--space-6`      | EXACT                                                                                                    |
| `--gtl-7`  | 48px  | `--space-7`      | EXACT                                                                                                    |
| `--gtl-8`  | 64px  | `--space-8`      | EXACT                                                                                                    |
| `--gtl-9`  | 96px  | **`--space-10`** | EXACT — note: maps to `--space-10` (96px), **not** `--space-9` (80px); the two scales diverge above 64px |
| `--gtl-10` | 128px | **`--space-11`** | **ADD (P4)** — extend the canonical scale one rung (32 units)                                            |

### Radius (4) · 1 EXACT, 3 HARMONIZE

| `--gtl-*`      | value | → canonical          | action               |
| -------------- | ----- | -------------------- | -------------------- |
| `--gtl-r-sm`   | 10px  | `--radius-md` (12px) | HARMONIZE (P7), +2px |
| `--gtl-r-md`   | 14px  | `--radius-lg` (16px) | HARMONIZE (P7), +2px |
| `--gtl-r-lg`   | 18px  | `--radius-xl` (22px) | HARMONIZE (P7), +4px |
| `--gtl-r-pill` | 999px | `--radius-pill`      | EXACT                |

### Shadow (2) · HARMONIZE

| `--gtl-*`        | value                    | → canonical   | action                                                                                    |
| ---------------- | ------------------------ | ------------- | ----------------------------------------------------------------------------------------- |
| `--gtl-shadow-1` | subtle + inset hairline  | `--shadow-xs` | HARMONIZE (P7) — the inset top-light is a redesign flourish; re-add per surface if wanted |
| `--gtl-shadow-2` | `0 18px 44px -26px` deep | `--shadow-lg` | HARMONIZE (P7) — closest deep elevation                                                   |

### Type roles (7) · 3 ADD, 2 EXACT, 2 HARMONIZE

| `--gtl-*`          | value                     | → canonical                 | action                                                             |
| ------------------ | ------------------------- | --------------------------- | ------------------------------------------------------------------ |
| `--gtl-price-hero` | `clamp(3.25rem,…,6.5rem)` | **`--text-price-hero`**     | **ADD (P4)** — the signature numeral; Phase 12 owns its final form |
| `--gtl-display-1`  | `clamp(2rem,…,3rem)`      | **`--text-display-1`**      | **ADD (P4)** — fluid serif H1                                      |
| `--gtl-display-2`  | `clamp(1.5rem,…,2rem)`    | **`--text-display-2`**      | **ADD (P4)** — fluid serif H2                                      |
| `--gtl-title`      | 1.25rem                   | `--text-lg` (1.25rem)       | EXACT                                                              |
| `--gtl-body`       | 1rem                      | `--text-base` (1rem)        | EXACT                                                              |
| `--gtl-meta`       | 0.8125rem (13px)          | `--text-sm` (0.875rem/14px) | HARMONIZE (P7), +1px                                               |
| `--gtl-kicker`     | 0.72rem                   | `--text-xs` (0.75rem)       | HARMONIZE (P7), +~0.5px                                            |

### Motion (4) · 2 EXACT, 1 ADD, 1 HARMONIZE

| `--gtl-*`      | value                         | → canonical             | action                                                                 |
| -------------- | ----------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `--gtl-t-fast` | 120ms                         | `--duration-fast`       | EXACT                                                                  |
| `--gtl-t-base` | 200ms                         | `--duration-normal`     | EXACT                                                                  |
| `--gtl-t-slow` | 320ms                         | `--duration-md` (300ms) | HARMONIZE (P7), −20ms                                                  |
| `--gtl-ease`   | `cubic-bezier(0.2,0.7,0.2,1)` | **`--ease-tick`**       | **ADD (P4)** — signature tick easing (Phase 12/26); no canonical equal |

### Layout (2) · 1 ADD, 1 HARMONIZE

| `--gtl-*`       | value  | → canonical                    | action                                                                                         |
| --------------- | ------ | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `--gtl-maxw`    | 1180px | `--content-max-width` (1280px) | HARMONIZE (P7), −100px — the redesign's narrower shell; Phase 7/15 decides the canonical width |
| `--gtl-measure` | 66ch   | **`--measure`**                | **ADD (P4)** — no canonical reading-measure token exists                                       |

---

## Roll-up — every one of the 45 `--gtl-*` maps to exactly one entry

| Action                             |  Count | When                          |
| ---------------------------------- | -----: | ----------------------------- |
| ALIAS-drop (→ `--color-*`)         |     13 | Phase 5                       |
| EXACT rename                       |     17 | Phase 5                       |
| ADD then rename (value-preserving) |      6 | Phase 4 adds, Phase 5 renames |
| HARMONIZE (small delta)            |      9 | Phase 7 per surface           |
| **Total**                          | **45** |                               |

**Phase 4 adds exactly these 6 canonical tokens** (values copied verbatim, so nothing changes until
adopted): `--space-11` (128px), `--text-price-hero`, `--text-display-1`, `--text-display-2`,
`--ease-tick`, `--measure`.

**Phase 7 harmonization backlog** (9 near-duplicates, deltas ≤ 4px / ≤ 20ms, applied when each
surface is rebuilt so the redesign's intent wins): `--gtl-r-sm/md/lg`, `--gtl-shadow-1/2`,
`--gtl-meta`, `--gtl-kicker`, `--gtl-t-slow`, `--gtl-maxw`.

The remaining canonical vars (258 unique in `tokens.css`) are the contract as-is — they map to
themselves. No canonical var is renamed or removed by this contract.

---

## Why this is low-risk (contra the plan's assumption)

The plan framed the token merge as significant work. The measurement says otherwise: **30 of 45
`--gtl-*` are already either color-aliases (13) or exact-value duplicates (17)**, so two-thirds of
the codemod is a pure find-replace with provably zero visual change. Only **6 need a new
(value-identical) token** and **9 are near-duplicates** whose sub-pixel deltas are best absorbed
during the Act III surface rebuilds rather than forced now. That is why Act I's Phases 4–6 are 🟡,
not 🔴.

## Next

- **Phase 4** — add the 6 tokens above to `tokens.css` (additive; `--gtl-*` still resolves,
  aliased).
- **Phase 5** — codemod the 12 `--gtl-*` consumer files (see `docs/design/CSS_INVENTORY.md` §4)
  using the ALIAS-drop + EXACT + ADD targets; one commit per file; zero value change.
- **Phase 6** — remove the `design-system.css` `<link>` from 11 pages and delete it.
