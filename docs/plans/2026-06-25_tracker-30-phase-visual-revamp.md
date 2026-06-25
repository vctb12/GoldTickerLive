# Tracker HTML 30-Phase Visual Revamp — Gold Command Center

```yaml
plan-status: complete
priority: P0
class: A
owner: cursor-agent
created: 2026-06-25
completed: 2026-06-25
extends:
  - docs/plans/2026-06-09_realtime-tracker-motion-revamp-20-phase.md
  - docs/tracker-rebrand-spec.md
  - reports/tracker-ux-audit.md
guardrails_reviewed: true
branch: cursor/tracker-30-phase-revamp-3c60
pr: "#440"
```

**Goal:** Full visual, color, typography, and layout revamp of `tracker.html` — from trust banner through hero terminal, workspace modes, and mobile command center — while preserving DOM contracts, freshness labels, EN/AR parity, and pricing integrity.

**Non-negotiables:** Reference ≠ retail; freshness never hidden; frozen element IDs; `translations.js` for UI strings; design tokens from `styles/partials/tokens.css`; RTL @ 360px; `prefers-reduced-motion` respected.

---

## Phase map

| Phase | Focus | Primary files | Status |
| ----- | ----- | ------------- | ------ |
| **0** | Baseline audit + branch | `reports/tracker-ux-audit.md`, tests | ✅ |
| **1** | Tracker token harmonization — map `--tp-*` to global tokens | `tracker-pro.css` `:root` | ✅ |
| **2** | Hero terminal color system — midnight gold mesh gradient | `tracker-pro.css`, `tracker.html` | ✅ |
| **3** | Ambient glow + foil top rule on hero | `tracker-pro.css`, `tracker.html` | ✅ |
| **4** | Badge row — semantic status colors, scroll-safe wrap | `tracker-pro.css` | ✅ |
| **5** | Hero typography — display scale, kicker foil, title shimmer | `tracker-pro.css` | ✅ |
| **6** | Hero stats grid — glass cards, gold edge hover | `tracker-pro.css` | ✅ |
| **7** | Control toolbar — glass selects, gold CTA hierarchy | `tracker-pro.css` | ✅ |
| **8** | Hero aside — live desk + tools cards elevation | `tracker-pro.css` | ✅ |
| **9** | Trust banner — premium gold wash, dismiss affordance | `tracker-pro.css` | ✅ |
| **10** | Welcome strip — stagger chips, foil border | `tracker-pro.css` | ✅ |
| **11** | Mode shell — frosted sticky bar, gold foil accent | `tracker-pro.css` | ✅ |
| **12** | Mode tabs — pill groups, active gold fill + underline | `tracker-pro.css` | ✅ |
| **13** | Workspace toggle — pressed state, icon rhythm | `tracker-pro.css` | ✅ |
| **14** | Panel card system — gradient border, hover lift | `tracker-pro.css` | ✅ |
| **15** | Toolbar card + range pills — segmented control look | `tracker-pro.css` | ✅ |
| **16** | Chip row — toggle chips with gold active state | `tracker-pro.css` | ✅ |
| **17** | Chart container — dark inset terminal frame | `tracker-pro.css` | ✅ |
| **18** | Karat table + watchlist desk styling | `tracker-pro.css`, `tracker.html` | ✅ |
| **19** | Mobile command center cards + action rail | `tracker-pro.css` | ✅ |
| **20** | Compare mode — card grid premium borders | `tracker-pro.css` | ✅ |
| **21** | Archive mode — row cards, pagination chrome | `tracker-pro.css` | ✅ |
| **22** | Alerts overlay — drawer surface + live region | `tracker-pro.css` | ✅ |
| **23** | Planner overlay — calculator panel trust cues | `tracker-pro.css` | ✅ |
| **24** | Exports mode — readiness pill + download cards | `tracker-pro.css`, `tracker.html` | ✅ |
| **25** | Method mode — methodology link cards | `tracker-pro.css` | ✅ |
| **26** | RTL — badge row, tabs, chart meta mirroring | `tracker-pro.css` | ✅ |
| **27** | Dark mode — hero + panel parity via `[data-theme=dark]` | `tracker-pro.css` | ✅ |
| **28** | Motion — hero reveal, tab transitions, reduced-motion | `tracker-pro.css` | ✅ |
| **29** | A11y — focus rings, contrast, touch targets ≥44px | `tracker-pro.css` | ✅ |
| **30** | Verification — lint, test, validate, build, PR | CI | ✅ |

---

## Design direction

### Color palette

- **Canvas:** warm parchment (`--surface-canvas`) below hero; deep midnight (`--gradient-hero-dark`) in hero terminal.
- **Gold accent:** `--color-gold` → `--color-gold-bright` foil gradients; never flat yellow.
- **Status:** semantic tokens only (`--color-live`, `--color-stale`, `--color-error`) — no ad-hoc hex on badges.
- **Panels:** `--gradient-card` wash, `--border-accent` on hover, `--shadow-gold` elevation.

### Typography

- Hero title: `--font-display`, `clamp(2.4rem, 5.2vw, 3.8rem)`, `--tracking-tighter`.
- Prices: `--font-numeric`, `font-variant-numeric: tabular-nums`.
- Kickers: uppercase, `--tracking-caps`, gold foil underline via `--foil-underline`.

### Layout

- Hero: 2-col grid → single column @ 1024px; aside stacks below main.
- Mode bar: sticky under nav + spot bar; horizontal scroll with hidden scrollbar.
- Live workspace: toolbar → chart → karat desk → watchlist (command center order preserved).

### Motion budget

| Element | Duration | Property |
| ------- | -------- | -------- |
| Badge pulse | 2s loop | `transform`, `opacity` |
| Tab underline | 200ms | `transform` |
| Card hover | 280ms | `box-shadow`, `border-color` |
| Welcome chips | 350ms stagger | `opacity`, `translateY` |
| Mode panel enter | 320ms | `opacity`, `translateY` |
| Reduced motion | instant | opacity only |

---

## Frozen contracts (do not break)

- Element IDs listed in `tests/tracker-dom.test.js`, `tests/tracker-modes.test.js`, `tests/tracker-hash.test.js`
- URL hash contract in `docs/tracker-state.md`
- Freshness badge slots: `#tp-live-badge`, `#tp-source-state-badge`, `#tp-freshness-badge-slot`
- `aria-live="polite"` on price surfaces

---

## Verification gate (Phase 30)

```bash
rm -rf playwright-report test-results
export JWT_SECRET=test-secret-32chars-minimum-length-ok
export ADMIN_PASSWORD=test
npm run lint && npm test && npm run validate && npm run build
```

Spot-check: 360px EN, 360px AR (`?lang=ar`), 430px EN — hero, tabs, live chart, compare.

---

## Follow-up (out of scope)

- Wire `tracker.html` hardcoded EN strings → `translations.js` (separate i18n pass)
- Split `tracker-pro.css` into `styles/pages/tracker/` partials (maintenance)
- Lighthouse before/after capture for PR proof gallery
