# Tracker shared-primitive adoption map

_Phase 3 deliverable for the 20-phase tracker redesign track. Catalogues every tracker-surface site
that should consume a shared primitive instead of an ad-hoc string / formatter / observer. Drives
Phases 4, 6, 9, 16, 18._

## Primitives in play

| Primitive                                                                             | Surface role                                                            |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/lib/live-status.js` (`getLiveFreshness`, `getMarketStatus`, `formatRelativeAge`) | Canonical freshness / market-open / relative-age strings.               |
| `src/lib/freshness-pulse.js` (`pulseFreshness`)                                       | 600 ms attribute toggle, 90 s throttle, reduced-motion safe.            |
| `src/lib/reveal.js` (`observeReveal`, auto-init)                                      | Fade-in-up for `[data-reveal]` via one shared `IntersectionObserver`.   |
| `src/lib/count-up.js` (`countUp`)                                                     | rAF easeOutQuad numeric counter, auto directional `data-flash=up/down`. |
| `src/lib/safe-dom.js` (`el`, `clear`, `escape`, `safeHref`, `safeTel`)                | DOM-safe builders — the only home for `innerHTML`.                      |

## Tracker-surface adoption map

| Site                                                                                                | Target primitive                                | Status                                                                            |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/tracker/render.js` — hero badges (`#tp-live-badge`, `#tp-market-badge`, `#tp-refresh-badge`)   | `getLiveFreshness` + `getMarketStatus`          | ✅ Adopted (render.js:7,62,127,173).                                              |
| `src/tracker/render.js` — `#tp-xauusd-value`                                                        | `countUp`                                       | ⚠️ Not adopted — raw `setText`. Phase 17 adoption target.                         |
| `src/tracker/render.js` — karat strip cells                                                         | `countUp` + `pulseFreshness`                    | ⚠️ Not adopted — Phase 17 target.                                                 |
| `src/tracker/render.js` — `#tp-chart-stats`                                                         | `countUp`                                       | ⚠️ Not adopted — Phase 9 / Phase 17 target.                                       |
| `src/tracker/render.js` — archive table rendering                                                   | `safe-dom.el()` + `clear()`                     | ❌ Ad-hoc `innerHTML` — Phase 11 target (biggest reduction opportunity).          |
| `src/tracker/render.js` — compare results table                                                     | `safe-dom.el()`                                 | ❌ Ad-hoc `innerHTML` — Phase 10 target.                                          |
| `src/tracker/wire.js` — live-wire items                                                             | `safe-dom.el()` + `formatRelativeAge`           | ⚠️ 3 sinks pending Phase 9 pass.                                                  |
| `src/tracker/events.js` — welcome-strip + trust-banner                                              | `observeReveal` (data-reveal attribute in HTML) | ⚠️ Welcome strip dismissal logic correct; no `[data-reveal]` tag. Phase 6 opt-in. |
| `src/pages/tracker-pro.js` — side-effect `reveal.js` import                                         | `observeReveal` auto-init                       | ✅ Imported (`tracker-pro.js:5`).                                                 |
| Tracker "just-refreshed" cells (hero + karat strip + compare)                                       | `pulseFreshness(el, {})`                        | ⚠️ Not adopted — Phase 9 / Phase 18 target.                                       |
| Tracker mode-tab registry                                                                           | `src/tracker/modes.js` (new in Phase 7)         | 🟡 This PR — introduced as a table-driven registry consumed by `ui-shell.js`.     |
| Tracker sections below the fold (`#mode-compare`, `#mode-archive`, `#mode-exports`, `#mode-method`) | `[data-reveal]` HTML attribute                  | 🟡 This PR — opted in via HTML attribute; primitive auto-observes.                |

## Legend

- ✅ — Already using the canonical primitive; no work required.
- 🟡 — Work in progress in the current PR.
- ⚠️ — Adoption pending in a later phase (own commit).
- ❌ — Actively divergent (`innerHTML` sink to retire).

## Invariant

Any future change on the tracker surface **must** check this map before introducing a local helper.
If the primitive does not cover the new case, add a row to this table and extend the primitive (do
not fork a sibling in `src/tracker/`).
