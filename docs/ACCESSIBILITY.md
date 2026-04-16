# Accessibility Guide

**WCAG 2.1 AA Compliance for Gold-Prices Platform**

## Overview

This document outlines accessibility standards, patterns, and requirements for the Gold-Prices
platform. We aim for WCAG 2.1 Level AA compliance across all pages and components.

## Core Principles

### 1. Perceivable

- All information must be presentable to users in ways they can perceive
- Provide text alternatives for non-text content
- Ensure sufficient color contrast
- Make content adaptable to different presentations

### 2. Operable

- All functionality must be available from a keyboard
- Provide sufficient time for users to complete tasks
- Do not design content that could cause seizures
- Help users navigate and find content

### 3. Understandable

- Text must be readable and understandable
- Web pages must appear and operate in predictable ways
- Help users avoid and correct mistakes

### 4. Robust

- Content must be robust enough to be interpreted by a wide variety of user agents
- Maximize compatibility with current and future tools

## Implementation Checklist

### Color Contrast

**Minimum Requirements:**

- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
- UI components and graphics: 3:1 contrast ratio

**Status:**

```css
/* ✅ Good contrast examples */
/* --color-text: #1a1612 on --color-surface: #fff (16.9:1) */
/* --color-gold-dark: #8a6420 on --color-surface: #fff (5.2:1) */
/* ⚠️ Needs review */
/* --color-text-faint: #78685a on --color-surface: #fff (4.4:1) */
```

### Keyboard Navigation

**Requirements:**

- All interactive elements must be keyboard accessible
- Focus order must be logical and intuitive
- Focus indicators must be clearly visible
- No keyboard traps

**Implementation:**

```css
/* Standard focus ring */
*:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
  border-radius: inherit;
}

/* Skip to content link */
.skip-to-content {
  position: absolute;
  top: -100px;
  left: 0;
  z-index: 9999;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-primary);
  color: var(--text-primary);
}

.skip-to-content:focus {
  top: 0;
}
```

### ARIA Labels and Roles

**Required ARIA Attributes:**

#### Navigation

```html
<nav aria-label="Main navigation">
  <button aria-expanded="false" aria-controls="mobile-menu">Menu</button>
</nav>
```

#### Live Regions

```html
<div aria-live="polite" aria-atomic="true" role="status">Gold price updated: $2,450.00</div>
```

#### Form Labels

```html
<label for="country-select">Select Country</label>
<select id="country-select" aria-describedby="country-help">
  <option value="uae">United Arab Emirates</option>
</select>
<span id="country-help">Choose your country to see local prices</span>
```

#### Buttons

```html
<button aria-label="Close dialog" onclick="closeDialog()">
  <span aria-hidden="true">×</span>
</button>
```

### Semantic HTML

**Structure:**

```html
<header><!-- Site header --></header>
<nav><!-- Main navigation --></nav>
<main id="main-content">
  <article>
    <h1><!-- Page title --></h1>
    <section><!-- Content sections --></section>
  </article>
</main>
<aside><!-- Complementary content --></aside>
<footer><!-- Site footer --></footer>
```

### Screen Reader Support

**Best Practices:**

- Use semantic HTML elements
- Provide text alternatives for images
- Label form controls properly
- Use ARIA labels for dynamic content
- Announce live updates appropriately

**Example:**

```html
<!-- Price card with screen reader support -->
<div class="price-card" role="region" aria-labelledby="gold-24k-label">
  <h3 id="gold-24k-label">24 Karat Gold Price</h3>
  <p class="price" aria-live="polite" aria-atomic="true">
    <span class="visually-hidden">Current price:</span>
    <span class="price-value">$2,450.00</span>
    <span class="visually-hidden">per ounce</span>
  </p>
</div>
```

### Visual Hidden Utility

```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Touch Target Size

**Minimum Requirements:**

- Touch targets should be at least 44×44px
- Spacing between adjacent targets should be at least 8px

```css
.button,
.link-button,
.interactive {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-3) var(--space-4);
}
```

### Language Attributes

```html
<html lang="en" dir="ltr">
  <!-- English content -->
  <p lang="ar" dir="rtl">نص عربي</p>
</html>
```

### Bilingual Considerations

**RTL Support:**

```css
[dir='rtl'] .component {
  /* RTL-specific styles */
  text-align: right;
  margin-inline-start: 0;
  margin-inline-end: var(--space-4);
}
```

### Form Validation

**Accessible Error Messages:**

```html
<label for="email">Email Address</label>
<input type="email" id="email" aria-invalid="true" aria-describedby="email-error" required />
<span id="email-error" role="alert"> Please enter a valid email address </span>
```

### Modal Dialogs

**Focus Management:**

```javascript
// Trap focus inside modal
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    }

    if (e.key === 'Escape') {
      closeModal();
    }
  });
}
```

### Data Tables

**Accessible Table Structure:**

```html
<table>
  <caption>
    Gold Prices by Karat
  </caption>
  <thead>
    <tr>
      <th scope="col">Karat</th>
      <th scope="col">Purity</th>
      <th scope="col">Price per Gram (AED)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">24K</th>
      <td>99.9%</td>
      <td>250.00</td>
    </tr>
  </tbody>
</table>
```

### Charts and Visualizations

**Requirements:**

- Provide text alternatives
- Use patterns in addition to color
- Ensure keyboard navigation
- Provide data tables as alternatives

```html
<figure role="img" aria-labelledby="chart-title" aria-describedby="chart-desc">
  <figcaption id="chart-title">Gold Price Trend (7 Days)</figcaption>
  <div id="chart-desc" class="visually-hidden">
    Gold prices have increased from $2,400 to $2,450 over the past week, with a peak of $2,470 on
    Day 5.
  </div>
  <canvas id="price-chart"></canvas>
  <!-- Provide data table alternative -->
  <details>
    <summary>View data table</summary>
    <table>
      <!-- Accessible data table -->
    </table>
  </details>
</figure>
```

## Testing Checklist

### Manual Testing

- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators are clearly visible
- [ ] Skip to content link works
- [ ] All images have appropriate alt text
- [ ] All form inputs have associated labels
- [ ] Color is not the only means of conveying information
- [ ] Text can be resized to 200% without loss of functionality
- [ ] Content works in both light and dark mode

### Screen Reader Testing

- [ ] Test with NVDA (Windows)
- [ ] Test with JAWS (Windows)
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with TalkBack (Android)

### Automated Testing

- [ ] Run Lighthouse accessibility audit (score 95+)
- [ ] Run axe DevTools scan (0 violations)
- [ ] Run WAVE browser extension
- [ ] Validate HTML with W3C validator

### Browser Testing

- [ ] Chrome + ChromeVox
- [ ] Firefox
- [ ] Safari + VoiceOver
- [ ] Edge

## Common Issues and Fixes

### Issue: Low Contrast

**Fix:** Use design tokens with verified contrast ratios

### Issue: Missing Alt Text

**Fix:** Add descriptive alt attributes to all images

### Issue: Non-Descriptive Links

**Bad:** `<a href="/learn">Click here</a>` **Good:**
`<a href="/learn">Learn about gold investing</a>`

### Issue: No Focus Indicators

**Fix:** Ensure `:focus-visible` styles are applied globally

### Issue: Empty Button Labels

**Bad:** `<button><i class="icon-close"></i></button>` **Good:**
`<button aria-label="Close dialog"><i class="icon-close" aria-hidden="true"></i></button>`

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

## Accessibility Statement

We are committed to ensuring digital accessibility for people with disabilities. We are continually
improving the user experience for everyone and applying relevant accessibility standards.

If you encounter accessibility barriers, please contact us at accessibility@goldtickerlive.com.

---

Last updated: Phase 2 - Accessibility Overhaul
