---
name: frontend-design-system
description: Use for design-token work, CSS architecture, shared UI patterns, visual consistency, and responsive layout cleanup.
when_to_use:
  - Consolidating duplicated card / button / panel variants
  - Adding a new design token
  - Auditing CSS for off-token values
  - Building a new reusable component
related_files:
  - styles/global.css
  - styles/pages/**
  - docs/DESIGN_TOKENS.md
  - docs/PERFORMANCE.md
related_prompts:
  - .github/prompts/mobile-ux-audit.prompt.md
  - .github/prompts/tracker-flagship-revamp.prompt.md
---

# Skill: Frontend Design System

Keeps Gold Ticker Live's UI coherent. Consolidate before you create.

## Tokens (source of truth: `styles/global.css`)

| Category   | Prefix         |
| ---------- | -------------- |
| Color      | `--color-*`    |
| Surface    | `--surface-*`  |
| Text       | `--text-*`     |
| Space      | `--space-*`    |
| Radius     | `--radius-*`   |
| Shadow     | `--shadow-*`   |
| Easing     | `--ease-*`     |
| Duration   | `--duration-*` |

When you find yourself reaching for a hex / raw rem / arbitrary cubic-bezier, **stop** — check
whether a token already covers it. If not, add the token (with rationale in a comment) and use it.

## Workflow

1. **Inventory** the surfaces you're touching. Where do current styles diverge from tokens?
2. **Consolidate.** If 3+ pages share a pattern, lift it to a shared component / global rule.
3. **Replace** off-token values with token references.
4. **Verify** at 360/390/430/768/1024+. EN + AR.
5. **Document** any new token in `docs/DESIGN_TOKENS.md`.

## Checklists in this skill

- [`checklists/tokens.md`](./checklists/tokens.md)
- [`checklists/components.md`](./checklists/components.md)
- [`checklists/responsive-layout.md`](./checklists/responsive-layout.md)
- [`checklists/accessibility.md`](./checklists/accessibility.md)

## Common mistakes

- Adding a 7th `.card` variant instead of a token-driven size prop.
- Inline `style="..."` for "just this one place".
- Magic z-index numbers without using `--z-*` (or a documented stacking order).
- New animation that ignores `prefers-reduced-motion`.

See [`docs/DESIGN_TOKENS.md`](../../../docs/DESIGN_TOKENS.md).
