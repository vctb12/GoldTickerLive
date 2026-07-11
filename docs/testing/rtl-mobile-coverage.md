# RTL / mobile regression coverage

Arabic (RTL) mobile-layout integrity is a CI invariant, enforced by two complementary Playwright
specs that run in the `Playwright smoke` job of `.github/workflows/ci.yml` (`--project=chromium`
against the built `dist/`).

## The two specs

| Spec                                                   | Surfaces                                                            | Status           |
| ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------- |
| `tests/e2e/rtl-mobile-overflow.spec.js`                | Core 6: home, tracker, calculator, shops, methodology, compare      | added in PR #662 |
| `tests/e2e/rtl-mobile-public-surface-coverage.spec.js` | Remaining public families (below) + search overlay + RTL nav drawer | this file's PR   |

Together they cover every standard public page family. They are intentionally non-overlapping —
extend the second spec's `AR_SURFACES` matrix when a new public page family is added.

## Surfaces & width matrix (public-surface spec)

Each surface loads via its Arabic first-load path (`?lang=ar` — the URL shape the language switcher
and hreflang alternates link to).

| Surface         | Route                    | 390px | 320px |
| --------------- | ------------------------ | :---: | :---: |
| Learn hub       | `/learn.html`            |  ✅   |       |
| Glossary        | `/glossary.html`         |  ✅   |  ✅   |
| Market overview | `/market.html`           |  ✅   |  ✅   |
| Heatmap         | `/heatmap.html`          |  ✅   |  ✅   |
| Portfolio       | `/portfolio.html`        |  ✅   |  ✅   |
| Dubai landing   | `/dubai-gold-price.html` |  ✅   |  ✅   |
| Privacy         | `/privacy.html`          |  ✅   |       |
| Terms           | `/terms.html`            |  ✅   |       |
| 404             | `/404.html`              |  ✅   |       |

320px is added for the data/interaction-dense surfaces (tables/cards, charts, maps, dense indexes)
most likely to overflow. 390px is the broad baseline.

## Assertions (per surface × width)

1. Settled RTL — `documentElement` `dir=rtl`, `lang=ar` (waits for the page's own boot).
2. Shared shell mounted — `.site-nav` + `<main>` visible.
3. **No document-level horizontal overflow** — robust detector (below).
4. RTL-context a11y smoke — exactly one `<main>`, one `<h1>`, zero unnamed `<button>`.
5. No uncaught page error.

Plus two shared-shell interaction tests in Arabic at 390px:

- **Global search overlay**: trigger opens overlay, focus moves to the input, Arabic query ("ذهب")
  yields results or a valid empty-state, no overflow while open, `Escape` closes and returns focus
  to the trigger.
- **Mobile nav drawer**: hamburger toggles `aria-expanded`/`aria-hidden`, no overflow while open,
  `Escape` closes and releases the body scroll lock.

## Robust overflow detector

A bare `scrollWidth` check reports _that_ the page overflows; the detector also reports _which_
element does, while ignoring legitimate horizontal scroll containers (`overflow-x: auto|scroll` —
responsive tables, carousels, code blocks) and fixed-position chrome. It reports the offending
tag/id/class/overshoot for fast triage.

## Intentional exclusions

- **`offline.html`** — the service-worker offline fallback. It is a static page with **no ES-module
  shell boot** (must render with no network/modules), ships bilingual-static content, and hardcodes
  `<html lang="en" dir="ltr">`. It does not (and should not) respond to the `?lang=ar` runtime boot.
  This is a deliberate exclusion, not a masked defect.
- **Country/city pages** — none exist (removed in the 2026-07-04 IA reset), so there is no template
  family to sample.

## Commands

```bash
npm run build                                   # produce dist/
python3 -m http.server 8080 --directory dist &  # serve (CI serves dist on :8080)
npx playwright test --config=playwright.config.js --project=chromium \
  tests/e2e/rtl-mobile-public-surface-coverage.spec.js
```

Runtime: ~8s single-run (18 tests), chromium. Runs automatically in the existing CI
`Playwright smoke` job; no separate CI matrix added.
