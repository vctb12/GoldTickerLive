# Design Rationale — Area A (Tokens & Type System)

**Branch:** `cursor/design-feel-revamp-4d4a`  
**Date:** 2026-06-27

## What changed

### 1. Self-hosted typography
- Added **Source Sans 3** (Latin UI, tabular lining figures) + **Cairo** (Arabic) as subset woff2 under `assets/fonts/`.
- New `styles/partials/fonts.css` with `unicode-range` subsets (~180KB total).
- Wired via `styles/global.css` import (all pages loading `global.css` get self-hosted fonts).
- Homepage `index.html`: preloads critical woff2, removed Google Fonts stylesheet.

### 2. Unified font stacks (`tokens.css`)
| Token | Before | After |
|-------|--------|-------|
| `--font-main` | Cairo-only | Source Sans 3 (LTR) |
| `--font-display` | Georgia / serif | Same sans as UI — one authoritative voice |
| `--font-numeric` | Monospace stack | Source Sans 3 + `tnum`/`lnum` features |
| `[dir='rtl']` | display override only | Arabic-primary stack (Cairo → Source Sans 3) |

### 3. Modular type scale (ratio 1.25)
- Foundation: `--type-ratio: 1.25`, `--type-base: 1rem`.
- Bumped display steps (`--text-xl` … `--text-6xl`) to Major Third scale.
- Kept `--text-sm` / `--text-md` for dense tables and forms.
- UI/data aliases (`--text-ui-*`, `--text-data-*`) now reference scale tokens.

### 4. Spacing on 4px grid
- `--space-unit: 0.25rem` with `--space-0`, `--space-px`, `--space-0_5`.
- Existing `--space-1`…`--space-10` expressed as multiples of `--space-unit`.

### 5. Semantic aliases
New tokens for consistent component styling:
`--text-muted`, `--surface-raised`, `--price-up`, `--price-down`, `--price-up-bg`, `--price-down-bg`, `--price-up-border`, `--price-down-border`, `--font-feature-tabular`.

### 6. Price numerics (`base.css`)
Extended tabular lining rules to `.hlc-price`, `.cp-price-value`, `.order-price-badge`, `[data-testid='gold-price']`.

## Why

The audit identified a **serif/sans split** and **Cairo-only Latin** as cheap-feeling. Financial reference sites need:
- One typographic voice (sans, not editorial serif + UI sans).
- Lining tabular figures on every price surface.
- Self-hosted fonts to cut CDN latency and layout shift on first paint.

## Screenshots

| When | Path |
|------|------|
| Before (audit) | `docs/audit-screenshots/homepage__desktop-1440__en-v2.png` |
| After Area A | `docs/audit-screenshots/area-a-after/homepage-en.png` (+ AR, mobile) |

## Follow-up (not Area A)

- Remove duplicate Google Fonts `<link>` from ~390 HTML shells — see `OPEN_FOR_OWNER.md`.
- Area B: unified `.price-hero` component using `--text-data-*` and `--price-*` tokens.
- Rebase after PR #443 merges (`tokens.css` overlap).

## Verification

| Command | Result |
|---------|--------|
| `npm test` | **1240 pass / 0 fail** |
| `npm run lint` | pass |
| `npm run validate` | pass |
