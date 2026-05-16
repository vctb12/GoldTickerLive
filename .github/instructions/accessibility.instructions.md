---
applyTo: "**/*.html,styles/**/*.css,src/**/*.js"
---

# Accessibility Instructions

Accessibility is product quality, not a checklist. Gold Ticker Live serves users with diverse
abilities, languages (EN/AR), and devices. Read this before changing HTML, CSS, or interactive JS.

## 1. Semantics first

- Use the correct element. `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`,
  `<header>`, `<footer>`, `<section>` for landmarks.
- Don't `div + onclick` what should be a button.
- One `<h1>` per page. Hierarchy without skipped levels.
- Lists use `<ul>` / `<ol>`; tables use `<table>` with `<th scope="...">`.

## 2. Keyboard navigation

- Every interactive element reachable via `Tab`. Focus order matches visual order.
- Skip link to `<main id="main">` is present on every page (already in the layout).
- `Esc` closes modals / drawers; focus returns to the trigger.
- No keyboard trap. Don't manage `tabindex` beyond `0` / `-1` unless absolutely needed.

## 3. Focus rings

- Visible focus on every interactive element. Don't `outline: none` without an equivalent
  replacement (`:focus-visible { box-shadow: 0 0 0 2px var(--color-focus); }`).
- Focus contrast: minimum 3:1 against the adjacent surface.

## 4. ARIA only when semantics aren't enough

- Prefer native semantics. Use ARIA when you must (e.g. live regions for price updates).
- `aria-live="polite"` for the tracker's freshness label; `aria-live="assertive"` only for errors
  the user must act on.
- Don't double up — `<button role="button">` is wrong.
- Custom widgets (dropdowns, tabs, dialogs) follow WAI-ARIA Authoring Practices patterns or use
  vetted primitives.

## 5. Color contrast

- Body text: ≥ 4.5:1 against background.
- Large text (≥ 18.66 px regular or 14 px bold): ≥ 3:1.
- Non-text UI (icons, focus rings, form borders): ≥ 3:1.
- Tokens in `styles/global.css` are already AA-compliant; don't introduce off-token greys for
  "subtle" labels — they'll fail contrast on the dark theme.

## 6. Reduced motion

- Global reset in `styles/global.css` sets `transition: none` / `animation: none` when
  `prefers-reduced-motion: reduce`. **Don't override.**
- Don't auto-play decorative animations.

## 7. Forms

- Every input has a programmatically associated `<label for="...">` (or wraps it).
- Required fields: `aria-required="true"` + visible indicator (`*`).
- Errors: `aria-invalid="true"` + `aria-describedby` pointing at the error message.
- Help text: also `aria-describedby`.
- `inputmode` set for mobile keyboards: `numeric`, `decimal`, `email`, `tel`.

## 8. Tables

- `<caption>` (visible or visually hidden) describes the table.
- `<th scope="col">` / `<th scope="row">` for header semantics.
- Sortable columns use `aria-sort="ascending|descending|none"`.
- On mobile, tables that convert to cards must still expose row/header relationships.

## 9. Charts

- Provide a tabular fallback. A `<table class="visually-hidden">` alongside the canvas is
  acceptable.
- Don't rely on color alone (line up/down, gain/loss). Use shape, label, or icon as well.
- Axis labels and tick values must be screen-reader accessible.

## 10. Modals / drawers / dropdowns

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing at the title.
- Trap focus inside; restore focus on close.
- Backdrop click + `Esc` both close.
- Don't disable background scroll without a body-class strategy (avoid layout shift).

## 11. Language attributes

- `<html lang="en">` for English pages, `<html lang="ar" dir="rtl">` for Arabic.
- Inline language switches use `<span lang="ar">…</span>` so screen readers switch voices.
- Numbers in Arabic content: decide once whether to use Arabic-Indic digits and apply
  consistently.

## 12. Screen reader testing surface

- VoiceOver (macOS / iOS), NVDA (Windows), TalkBack (Android). Smoke-test the tracker page after
  any significant tracker change.
- Don't ship `aria-hidden="true"` on a parent that contains focusable descendants.

## 13. RTL accessibility

- Mirror chevrons and progress indicators. A11y software respects logical order, but human
  cognition relies on visual cues.
- Tab order in RTL = right-to-left for inline rows.

## 14. Common accessibility mistakes to avoid

- `alt=""` on a meaningful image (use `alt="<description>"`); `alt="image"` on a decorative image
  (use `alt=""` instead).
- Placeholder as label (placeholders disappear on input).
- Color-only state ("red text = error" with no icon or copy).
- Inaccessible custom dropdowns (use `<select>` unless there's a real reason).
- `<a href="#">` triggers for non-link actions (use `<button>`).
- Auto-focus on page load (disorienting for keyboard / screen-reader users).

## 15. Validation commands

```bash
npm run a11y                # pa11y-ci with .pa11yci.js
npm run validate            # includes SEO + analytics + DOM-safety
npm test                    # tests/*a11y*.test.js where present
```

See [`docs/ACCESSIBILITY.md`](../../docs/ACCESSIBILITY.md),
[`.pa11yci.js`](../../.pa11yci.js).
