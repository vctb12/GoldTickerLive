# Tracker.html Redesign Plan

**Created:** 2026-04-24 **Task:** Redesign tracker.html UI/UX to fix scattered data and information
architecture **Issue:** [BUG] tracker.html page has scattered data and info

## Problem Statement

The tracker.html page has become overly complex and scattered through multiple iterations by
different agents and developers. The current implementation has:

1. **241 tracker-specific CSS classes** — indicating significant fragmentation
2. **Overly dense hero section** with too many competing elements:
   - 4 status badges
   - Title and subtitle
   - Description
   - Hero stats grid
   - 4 selector dropdowns
   - 4 action buttons
   - 4 hint chips
   - Keyboard shortcuts hint
   - Live desk sidebar
   - Explore links sidebar
3. **Scattered information architecture**:
   - Trust banner separate from hero
   - Welcome strip (conditionally shown)
   - Hero split between main and aside
   - Mode tabs immediately after hero
   - Multiple overlapping toolbars
4. **Visual hierarchy issues**:
   - Too many elements competing for attention
   - Inconsistent spacing and grouping
   - Unclear primary action flow
   - Badge overload in hero

## Design Goals

Per the Autonomy Contract in AGENTS.md §4–§5, we will:

1. **Simplify visual hierarchy** — establish clear primary/secondary/tertiary levels
2. **Consolidate related controls** — group selectors, reduce redundancy
3. **Improve information flow** — guide users from overview → action → data
4. **Maintain all functionality** — no features removed, only reorganized
5. **Preserve product-trust guardrails** — all §6 trust elements stay visible
6. **Enhance mobile experience** — better responsive behavior at 360px+
7. **Improve bilingual parity** — verify EN/AR RTL consistency

## Measurable Outcomes

- Lighthouse Performance ≥ current baseline
- No new DOM-safety sinks
- Zero test regressions
- Hero section reduced from ~140 lines to ~80 lines
- Visual hierarchy scores improved (via manual assessment)
- Mobile viewport usability improved (via 360px testing)
- Build and validation green

## Implementation Strategy

### Phase 1: Hero Section Redesign

**Files:** `tracker.html` (lines 197–320), `styles/pages/tracker-pro.css`

**Changes:**

1. Consolidate status badges from 4 to 2:
   - Keep: Live status badge, XAU/USD price badge
   - Move: Market status → inline with refresh time
   - Remove: Redundant refresh badge (show in live badge)
2. Simplify hero content structure:
   - Title + subtitle: keep
   - Description: tighten to 1 line
   - Hero stats: keep but redesign as 3-column instead of grid
   - Selectors: consolidate into single row with better labels
   - Actions: reduce to 2 primary buttons (Refresh + Chart scroll)
   - Hint chips: reduce from 4 to 2, move non-critical to methodology link
3. Redesign hero aside:
   - Merge "Live desk" and "Explore more" into single sidebar
   - Reduce vertical height
   - Better visual separation from main content

**Result:** Hero section from 140 lines → ~80 lines, clearer visual flow

### Phase 2: Information Architecture Consolidation

**Files:** `tracker.html`, `styles/pages/tracker-pro.css`

**Changes:**

1. Trust banner:
   - Keep at top but reduce vertical padding
   - Simplify copy while maintaining §6.2 compliance
2. Welcome strip:
   - Keep conditional logic
   - Reduce visual weight when shown
3. Mode navigation:
   - Improve tab visual design
   - Better active state indication
   - Clearer workspace level toggle

**Result:** Clearer page-level hierarchy, reduced visual noise

### Phase 3: Component Design Refinement

**Files:** `styles/pages/tracker-pro.css`, `tracker.html`

**Changes:**

1. Update design tokens usage:
   - Use `--text-4xl` and `--text-5xl` for display-level headings
   - Apply `--space-*` tokens consistently
   - Use `--radius-*` tokens for all border-radius
2. Improve card/panel hierarchy:
   - Reduce shadow weight on non-critical panels
   - Better border treatment
   - Consistent padding scale
3. Typography rhythm:
   - Apply heading scale consistently
   - Improve line-height for readability
   - Better text color contrast

**Result:** More cohesive visual design, better token usage

### Phase 4: Responsive Optimization

**Files:** `styles/pages/tracker-pro.css`

**Changes:**

1. Mobile-first breakpoints:
   - Test at 360px, 768px, 1024px, 1440px
   - Improve hero stacking on mobile
   - Better selector layout on narrow viewports
2. Touch targets:
   - Ensure 44px minimum for interactive elements
   - Better spacing between controls
3. RTL support:
   - Verify all flexbox/grid layouts work in RTL
   - Test Arabic language rendering
   - Fix any mirroring issues

**Result:** Flawless mobile experience, better RTL support

### Phase 5: Motion and Interaction Polish

**Files:** `styles/pages/tracker-pro.css`, `src/tracker/render.js`

**Changes:**

1. Apply motion primitives from `styles/global.css`:
   - Use `[data-reveal]` for progressive disclosure
   - Apply `data-flash` for value changes
   - Respect `prefers-reduced-motion`
2. Improve interactive states:
   - Better hover/focus states on buttons
   - Clearer active states on selectors
   - Smooth transitions (use `--ease-*` and `--duration-*`)

**Result:** Polished, accessible interactions

## Impacted Files

### HTML

- `tracker.html` (lines 140–410 primarily)

### CSS

- `styles/pages/tracker-pro.css` (hero section, panels, responsive)

### JavaScript (minimal changes)

- `src/pages/tracker-pro.js` (element references if needed)
- `src/tracker/ui-shell.js` (verify no breaking changes)

### Tests

- `tests/tracker-hash.test.js` (verify URL state still works)
- `tests/tracker-modes.test.js` (verify mode registry intact)

## Rollback Points

1. After Phase 1: Hero redesign can be reverted as single commit
2. After Phase 2: Info arch changes can be reverted independently
3. After Phase 3: Design token updates can be reverted
4. After Phase 4: Responsive changes isolated in media queries
5. After Phase 5: Motion polish is additive only

## Done Checklist

- [ ] Phase 1: Hero section redesigned and simplified
- [ ] Phase 2: Information architecture consolidated
- [ ] Phase 3: Component design tokens applied
- [ ] Phase 4: Responsive behavior verified at 360px, 768px, 1024px
- [ ] Phase 5: Motion primitives applied
- [ ] `npm test` passes (no test regressions)
- [ ] `npm run lint` passes
- [ ] `npm run validate` passes (no DOM-safety regression)
- [ ] `npm run build` succeeds
- [ ] Before/after screenshots captured (desktop 1440px + mobile 360px)
- [ ] RTL spot-check completed (Arabic language + dir=rtl)
- [ ] Lighthouse performance ≥ baseline
- [ ] Trust elements verified per §6.2 (freshness labels, disclaimers)
- [ ] Bilingual EN/AR parity confirmed
- [ ] Manual testing: all modes (Live, Compare, Archive, Exports, Method)
- [ ] Manual testing: all overlays (Alerts, Planner)
- [ ] Manual testing: keyboard shortcuts still work
- [ ] Manual testing: responsive behavior smooth

## Evidence

Screenshots to capture:

1. Hero section before/after (desktop 1440px)
2. Hero section before/after (mobile 360px)
3. Full page before/after (desktop, scrolled)
4. RTL mode verification (Arabic)
5. Mode navigation before/after
6. Trust banner before/after

## Risks

1. **Breaking URL state** — hash-based state might be affected
   - Mitigation: Keep all state.js logic unchanged, only UI changes
2. **Test failures** — existing tests might expect specific DOM structure
   - Mitigation: Run tests early, update only if structure changed semantically
3. **Bilingual regression** — RTL layout might break
   - Mitigation: Test Arabic mode explicitly at each phase
4. **Mobile usability regression** — hero might not stack well
   - Mitigation: Mobile-first approach, test at 360px throughout

## Notes

- This is a **visual and UX redesign only** — no functional changes
- All existing features preserved (modes, overlays, charts, exports, etc.)
- Focus is on **consolidation and hierarchy**, not feature addition
- Follows AGENTS.md §4 Autonomy Contract: Explore → Expand → Plan → Implement → Verify → Ship
- Preserves all §6 product-trust guardrails
- Maintains static multi-page architecture (§6.5)
