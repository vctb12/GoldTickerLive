# Premium Dark/Gold Design System — Spec (feat/ui-overhaul)

```yaml
date: 2026-07-06
brief: owner "Premium Dark/Gold Design Revamp" (frontend design lane)
status: Phase 1 shipped — tokens + theme default + display serif
supersedes:
  the 2026-06-29 "extend warm parchment, no re-theme" gate decision and the matching guidance in
  docs/design-language.md — superseded BY OWNER for the dark identity. The parchment palette
  survives intact as the explicit LIGHT theme behind the toggle.
```

## Identity

Dark is the brand default. New visitors get the premium near-black/gold theme; the pre-paint script
still honors a saved `light`/`auto` preference, and the toggle continues to work. The warm-parchment
light theme is unchanged.

## Palette (dark theme — the premium identity)

| Role             | Token                   | Value     | Notes                                                                  |
| ---------------- | ----------------------- | --------- | ---------------------------------------------------------------------- |
| Base canvas      | `--color-bg`            | `#0b0b0d` | layered near-black, never dead `#000`                                  |
| Raised surface 1 | `--color-surface`       | `#141418` | cards                                                                  |
| Raised surface 2 | `--color-surface-2`     | `#1c1c22` | chips, stat rows                                                       |
| Raised surface 3 | `--color-surface-3`     | `#26262c` | zebra, skeletons                                                       |
| Hairline         | `--color-border`        | `#2e2b24` | warm — reads as low-alpha gold on black                                |
| Subtle hairline  | `--color-border-subtle` | `#211f1b` |                                                                        |
| Strong border    | `--border-strong`       | `#3d3830` |                                                                        |
| Body/data ink    | `--color-text`          | `#f2eedd` | near-white; **all body text, tables, prices, fine print — never gold** |
| Readout ink      | `--color-ink-data`      | `#f7f3e6` | brightest mark = the price                                             |
| Muted ink        | `--color-text-muted`    | `#a09890` |                                                                        |
| Faint ink        | `--color-text-faint`    | `#988e83` | brightened for AA on the raised surface-3                              |

**Disciplined gold (3 tiers, restraint = luxury):**

| Tier            | Token                  | Value     | Allowed use                                    |
| --------------- | ---------------------- | --------- | ---------------------------------------------- |
| Metallic accent | `--color-gold`         | `#ddb040` | CTAs, active states, focus ring, live dot      |
| Muted antique   | `--color-gold-antique` | `#b5945c` | **large headings only** (≥24px / ≥18.5px bold) |
| Bright emphasis | `--color-gold-bright`  | `#fad97a` | sparing emphasis marks                         |

Semantic movement stays the AA-locked desaturated pair `#5dd98b` / `#f87171` (colour + glyph, never
colour alone). The freshness state machine and all trust chips are untouched.

## Verified contrast (WCAG 2.1 AA, computed not guessed)

| Pair                                                | Ratio              | Requirement                   |
| --------------------------------------------------- | ------------------ | ----------------------------- |
| body `#f2eedd` on `#0b0b0d` / `#141418` / `#1c1c22` | 16.9 / 15.8 / 14.6 | 4.5 ✓                         |
| muted `#a09890` on bg / surface-2 / surface-3       | 6.9 / 6.0 / 5.3    | 4.5 ✓                         |
| faint `#988e83` on surface-3                        | 4.68               | 4.5 ✓ (was 4.16 — brightened) |
| readout `#f7f3e6` on bg                             | 17.7               | 4.5 ✓                         |
| gold CTA `#ddb040` as text on bg                    | 9.7                | 4.5 ✓                         |
| antique heading `#b5945c` on bg / surface (large)   | 6.9 / 6.4          | 3.0 ✓                         |
| on-gold ink `#1a1305` on `#ddb040`                  | 9.1                | 4.5 ✓                         |
| movement `#5dd98b` / `#f87171` on surface           | 10.3 / 6.6         | 4.5 ✓                         |
| warning `#e0b060` on surface-2                      | 8.5                | 4.5 ✓                         |

`scripts/node/check-basic-a11y.js` (CI gate) passes on the retuned values.

## Typography

- **Display serif:** Playfair Display 600/700, self-hosted latin subset (~23 KB/weight, OFL),
  `font-display: swap`, wired as `--font-serif-display` → `--font-display` (38 existing consumers
  pick it up). `[dir='rtl']` swaps `--font-display` to Cairo — Arabic headings stay native.
- **UI/data:** Source Sans 3 unchanged; prices keep `tabular-nums` (`--font-feature-tabular`).
- Scale: existing Major-Third modular scale retained.

## Theme default mechanics

- `scripts/node/inject-theme-preinit.js` + `generate-internal-index-stubs.js`: unset preference now
  resolves to `dark` (was `auto`); saved `light`/`auto` prefs still honored.
- `styles/critical.css`: dark-first first paint (`:root` = dark, `[data-theme='light']` override);
  hero scaffolds flipped the same way. No-JS users get dark.
- `manifest.json` background `#0b0b0d`.

## Surfaces & depth

Hierarchy on dark = raised surface tints + warm hairlines, not drop shadows. No glassmorphism.
Motion: 150–250 ms ease-out, transform/opacity only, existing `prefers-reduced-motion` guards.

## Trust rules (unchanged, enforced)

Freshness pills, estimate/cached/fallback markers, disclaimers, methodology links, and the
spot-vs-retail split render in near-white ink tiers on dark — never gold, never lowered in contrast.
Peg 3.6725 / troy oz 31.1035 / spot≠retail untouched.
