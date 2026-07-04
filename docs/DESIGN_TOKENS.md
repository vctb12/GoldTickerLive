# Design Token System

**Complete Reference for Gold-Prices CSS Custom Properties**

## Overview

This document describes the design token system implemented across the Gold Ticker Live platform.
Tokens are defined in `styles/partials/tokens.css` (imported via `styles/global.css`).

> ⚠️ **Source of truth: `styles/partials/tokens.css`.** This reference is hand-maintained — always
> verify against `tokens.css`. Reconciled 2026-07-04 against the shipped Precision Instrument values
> (`redesign/DESIGN-SYSTEM.md`): cooled canvas `#fdfbf5`, struck-metal `--color-gold #b07d1f`,
> `--color-ink-data`, `--color-rule`, `--readout-*`/`--rim-inset` readout chrome, and
> `--font-numeric-features` (slashed-zero). An auto-generation step is still staged in
> `PROGRESS.md`.

## Color Tokens

### Surface Colors

```css
--color-bg: #fdfbf5; /* Canvas background (warm parchment) */
--color-surface: #fff; /* Primary surface */
--color-surface-2: #faf7ee; /* Secondary surface */
--color-surface-3: #f3eedd; /* Tertiary surface */
--color-border: #d9cfb6; /* Default border */
--color-border-subtle: #ece5d2; /* Subtle border */
```

### Text Colors

```css
--color-text: #15110a; /* Primary text */
--color-text-muted: #6a5c48; /* Muted text */
--color-text-faint: #6f6350; /* Faint text */
```

### Gold Palette

```css
--color-gold: #b07d1f; /* Primary gold */
--color-gold-light: #ddb040; /* Light gold */
--color-gold-bright: #f0ca5c; /* Bright gold */
--color-gold-dark: #7e5912; /* Dark gold */
--color-gold-deep: #6b4a0e; /* Deep gold */
--color-gold-bg: #fdf8e8; /* Gold background */
--color-gold-tint: #f8f2dc; /* Gold tint */
--color-gold-glow: rgb(196 144 46 / 16%); /* Gold glow */
```

### Status Colors

```css
--color-live: #1a7a32; /* Live indicator */
--color-live-bg: rgb(26 122 50 / 9%);
--color-live-border: rgb(26 122 50 / 25%);

--color-stale: #a84000; /* Stale indicator */
--color-up: #176832; /* Price up */
--color-down: #b81428; /* Price down */
--color-error: #b81428; /* Error state */
```

## Semantic Tokens

### Semantic Surfaces

```css
--surface-canvas: var(--color-bg);
--surface-primary: var(--color-surface);
--surface-secondary: var(--color-surface-2);
--surface-tertiary: var(--color-surface-3);
--surface-accent: var(--color-gold-bg);
```

### Semantic Text

```css
--text-primary: var(--color-text);
--text-secondary: var(--color-text-muted);
--text-tertiary: var(--color-text-faint);
--text-accent: var(--color-gold-dark);
--text-on-dark: #fff;
```

### Semantic Borders

```css
--border-default: var(--color-border);
--border-subtle: var(--color-border-subtle);
--border-strong: #d6ccb4;
--border-accent: var(--color-gold);
```

## Typography Tokens

### Font Stacks

```css
--font-main: var(--font-latin); /* Source Sans 3; Cairo under [dir='rtl'] via --font-arabic swap */
--font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
```

### Type Scale

Implemented in [`styles/global.css`](../styles/global.css). Body scale is tight (16–20 px) for dense
price-data UI; display tier (`--text-4xl` / `--text-5xl`) is reserved for hero headings.

```css
--text-2xs: 0.625rem; /* 10px */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-md: 1.0625rem; /* 17px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px — display tier, hero headings */
--text-5xl: 3rem; /* 48px — display tier, hero headings */
```

### Font Weights

```css
--weight-light: 300;
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
--weight-extrabold: 800;
```

### Line Heights

```css
--leading-none: 1;
--leading-tight: 1.2;
--leading-snug: 1.35;
--leading-normal: 1.5;
--leading-relaxed: 1.65;
--leading-loose: 2;
```

### Letter Spacing

```css
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-caps: 0.1em;
```

## Spacing Scale

```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.5rem; /* 24px */
--space-6: 2rem; /* 32px */
--space-7: 3rem; /* 48px */
--space-8: 4rem; /* 64px */
```

## Border Radius

```css
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 22px;
--radius-pill: 999px;
```

### Semantic Radius

```css
--radius-control: var(--radius-sm); /* Inputs, buttons */
--radius-card: var(--radius-lg); /* Cards */
--radius-panel: var(--radius-xl); /* Large panels */
--radius-badge: var(--radius-pill); /* Badges, pills */
```

## Shadows

```css
--shadow-xs: 0 1px 2px rgb(0 0 0 / 4%), 0 1px 1px rgb(0 0 0 / 2%);
--shadow-sm: 0 1px 3px rgb(0 0 0 / 6%), 0 2px 8px rgb(0 0 0 / 3%);
--shadow-md: 0 4px 14px rgb(0 0 0 / 8%), 0 2px 4px rgb(0 0 0 / 4%);
--shadow-lg: 0 10px 30px rgb(0 0 0 / 10%), 0 4px 10px rgb(0 0 0 / 5%);
--shadow-xl: 0 20px 50px rgb(0 0 0 / 12%), 0 8px 20px rgb(0 0 0 / 6%);
--shadow-gold: 0 4px 18px rgb(196 153 62 / 22%), 0 1px 4px rgb(196 153 62 / 10%);
--shadow-gold-lg: 0 8px 32px rgb(196 153 62 / 28%), 0 2px 8px rgb(196 153 62 / 12%);
```

### Semantic Elevation

```css
--elev-1: var(--shadow-xs);
--elev-2: var(--shadow-sm);
--elev-3: var(--shadow-md);
--elev-4: var(--shadow-lg);
--elev-5: var(--shadow-xl);
--elev-accent: var(--shadow-gold);
--elev-accent-strong: var(--shadow-gold-lg);
```

## Gradients

```css
--gradient-gold: linear-gradient(135deg, #c4993e 0%, #e0b84a 50%, #c4993e 100%);
--gradient-gold-subtle: linear-gradient(135deg, rgb(196 153 62 / 8%) 0%, rgb(224 184 74 / 4%) 100%);
--gradient-dark: linear-gradient(155deg, #3d2005 0%, #1e0e03 45%, #0c0802 100%);
--gradient-surface: linear-gradient(180deg, #fff 0%, #fdfbf7 100%);
```

## Layout

```css
--content-max-width: 1280px;
--page-gutter: 1.5rem;
--nav-height: 64px;
```

## Focus Ring

```css
--focus-ring-color: var(--color-gold);
--focus-ring-width: 3px;
--focus-ring-offset: 2px;
```

## Transitions

### Durations

```css
--duration-fast: 0.12s;
--duration-normal: 0.2s;
--duration-md: 0.3s;
--duration-slow: 0.45s;
```

### Easing Curves

```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Combined Transitions

```css
--transition: 0.2s ease;
--transition-md: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
--transition-slow: 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
--transition-bounce: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
```

## Breakpoints (Reference)

```css
--bp-xs: 380px;
--bp-sm: 480px;
--bp-md: 640px;
--bp-lg: 768px;
--bp-xl: 1024px;
--bp-2xl: 1280px;
```

## Dark Mode

All color tokens automatically adapt when `[data-theme='dark']` or `prefers-color-scheme: dark` is
active.

## Usage Guidelines

### ✅ DO

- Use semantic tokens (`--surface-primary`, `--text-secondary`) over direct color tokens
- Use spacing scale tokens instead of hardcoded values
- Use typography scale tokens for consistent sizing
- Leverage easing and duration tokens for smooth transitions

### ❌ DON'T

- Hardcode colors (use tokens instead)
- Create page-specific color variables that duplicate global tokens
- Use arbitrary spacing values (stick to the scale)
- Mix hardcoded values with token-based styles

## Migration Guide

### Before

```css
.card {
  background: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  color: #1a1612;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}
```

### After

```css
.card {
  background: var(--surface-primary);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-card);
  box-shadow: var(--elev-3);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  transition: all var(--transition);
}
```

## Button system (Bullion Desk — intentional two-tier)

The redesign uses a deliberate two-tier primary-action system. Keep it consistent:

| Tier               | Treatment                                                   | Use for                                                                              |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Flagship / ink** | `--color-text` bg, `--surface-canvas` text (theme-adaptive) | The single "enter the live product" command — nav "Live Tracker", homepage hero CTA. |
| **Primary / gold** | `.btn-primary` — solid `--color-gold-dark`                  | The standard in-app / in-page action (tools, forms, alerts). The brand action color. |
| **Outline**        | `.btn-outline` — gold border, transparent                   | Secondary actions.                                                                   |
| **Ghost**          | `.btn-ghost` — text only                                    | Tertiary / low-emphasis.                                                             |
| **Gold foil**      | `--rule-foil`, `--foil-underline`, active underlines        | Accents, rules, active states — never a fill wash.                                   |

Rationale: gold reads as a **foil accent** and ink carries the one flagship command, so the product
avoids the "gold-everywhere template" look while staying on-brand. Do **not** flip the global
`.btn-primary` to ink — it appears on dark tracker panels / the shops gold-vault hero where ink
would fail contrast; those dark surfaces use scoped overrides (`.hero .btn-primary`,
`.tracker-hero-wrap .btn.btn-primary`).

## Benefits

1. **Consistency**: All components use the same values
2. **Maintainability**: Change once, apply everywhere
3. **Theming**: Dark mode and custom themes work automatically
4. **Accessibility**: Centralized control over colors and contrast
5. **Performance**: Browser can optimize repeated values
6. **Developer Experience**: Autocomplete and intellisense support

## Token Status

✅ **Completed**: global.css, city-page.css, market-page.css, country-page.css, guide-page.css,
terms.css, learn.css, methodology.css, calculator.css

🚧 **In Progress**: insights.css, invest.css, home.css, shops.css, tracker-pro.css, order.css,
admin.css

---

Last updated: Phase 1 - Foundation & Design System Completion
