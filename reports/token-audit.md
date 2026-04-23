# Design-token audit — §22b Phase 2

**Status:** _audit complete, promotion decisions captured below_ **Scope:** the three revamp
surfaces only — tracker (`styles/pages/tracker-pro.css`), homepage (inline via `styles/global.css`),
admin shell (`styles/admin.css`). **Out of scope:** `styles/pages/invest.css` (intentionally themed
dark page; retains its own `--invest-*` scale by product decision).

The purpose of Phase 2 is to **audit `--tp-*`, homepage hero tokens, and `admin.css` variables
against `styles/global.css`, and promote redefined tokens up without visual change.** This file is
the audit deliverable. It records what was found, what was already correct, and what must stay as-is
(and why).

## 1. Canonical token surface (`styles/global.css`)

| Category     | Canonical family                                                                                                                                                   | Count | Note                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------------------------------------------------- |
| Surfaces     | `--surface-canvas`, `--surface-primary`, `--surface-secondary`, `--surface-tertiary`, `--surface-accent`, `--surface-glass*`                                       | 7     | Light-mode base; dark override in same file       |
| Text tiers   | `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-accent`, `--text-on-dark`                                                                         | 5     | Semantic tiers (not hex values)                   |
| Borders      | `--border-default`, `--border-subtle`, `--border-strong`, `--border-accent`                                                                                        | 4     |                                                   |
| Gold palette | `--color-gold`, `--color-gold-light`, `--color-gold-bright`, `--color-gold-dark`, `--color-gold-deep`, `--color-gold-bg`, `--color-gold-tint`, `--color-gold-glow` | 8     |                                                   |
| Status       | `--color-live*`, `--color-daily*`, `--color-fixed*`, `--color-stale*`, `--color-up*`, `--color-down*`, `--color-error*`, `--color-warning*`                        | 24    |                                                   |
| Radii        | `--radius-xs/sm/md/lg/xl/pill` + `--radius-control/card/panel/badge` aliases                                                                                       | 10    |                                                   |
| Shadows      | `--shadow-xs/sm/md/lg/xl`, `--shadow-gold`, `--shadow-gold-lg`, `--shadow-card-hover`                                                                              | 8     |                                                   |
| Typography   | `--text-2xs` → `--text-5xl` (9 sizes), `--weight-*`, `--leading-*`, `--tracking-*`                                                                                 | —     | Added in this session; see "design tokens" memory |
| Layout       | `--content-max-width`, `--page-gutter`, `--nav-height`, `--focus-ring-*`, `--font-mono`, ease/duration primitives                                                  | —     | Added in this session                             |

## 2. Tracker (`styles/pages/tracker-pro.css`)

**Finding: ✅ already canonical.** The `:root` block at the top of the file
(`styles/pages/tracker-pro.css:6–50`) is a thin alias layer — every `--tp-*` maps through `var(--…)`
to a canonical token. An explicit header comment says _"Do not re-introduce hand-picked hex values
here."_

| `--tp-*` token       | Maps to                                              |
| -------------------- | ---------------------------------------------------- |
| `--tp-bg`            | `--surface-canvas`                                   |
| `--tp-panel`         | `--surface-primary`                                  |
| `--tp-panel-2`       | `--surface-secondary`                                |
| `--tp-border`        | `--border-default`                                   |
| `--tp-border-strong` | `--border-strong`                                    |
| `--tp-text`          | `--text-primary`                                     |
| `--tp-text-muted`    | `--text-secondary`                                   |
| `--tp-text-faint`    | `--text-tertiary`                                    |
| `--tp-gold`          | `--color-gold`                                       |
| `--tp-gold-strong`   | `--color-gold-dark`                                  |
| `--tp-gold-soft`     | `--color-gold-glow`                                  |
| `--tp-accent`        | `--color-gold-dark`                                  |
| `--tp-live`          | `--color-live`                                       |
| `--tp-live-soft`     | `--color-live-bg`                                    |
| `--tp-danger`        | `--color-error`                                      |
| `--tp-danger-soft`   | `--color-error-bg`                                   |
| `--tp-blue`          | `--color-fixed`                                      |
| `--tp-blue-soft`     | `--color-fixed-bg`                                   |
| `--tp-shadow-1`      | `--shadow-sm`                                        |
| `--tp-shadow-2`      | `--shadow-md`                                        |
| `--tp-radius-md`     | `--radius-md`                                        |
| `--tp-radius-sm`     | `--radius-sm`                                        |
| `--tp-shell`         | derived from `--content-max-width` + `--page-gutter` |

**Decision:** nothing to promote. The `--tp-*` indirection is deliberately kept so the tracker can
swap its own palette on a future "pro dark" theme without editing every rule. Ongoing Phase 14 work
(CSS split) will inherit these aliases.

**Follow-up rows for Phase 14:** when splitting `tracker-pro.css`, keep this `:root` alias block in
the shared file it becomes (`_tokens.css` or equivalent).

## 3. Homepage (inline under `styles/global.css`)

**Finding: ✅ already canonical.** The homepage does not carry a page-scoped `:root` of hero tokens
— `index.html` + `src/pages/home.js` consume `--surface-*`, `--text-*`, `--color-gold-*`,
`--shadow-*`, `--radius-*` directly. No hand-picked hex values appear in `#hero-live-card` /
`#hlc-*` / ticker styling.

The only homepage-specific surface is the cached-value styling, which already uses
`--color-warning*` / `--color-stale*`.

**Decision:** nothing to promote.

**Follow-up rows for Phases 15–22:** when the above-the-fold rebuild lands, wire count-up and
sparkline colors through `--color-up*` / `--color-down*` rather than introducing bespoke hex pairs.

## 4. Admin (`styles/admin.css`)

**Finding: intentionally divergent.** `styles/admin.css:9–44` defines its own 32-token palette
(hex-based) for the admin dark theme. Values are **deliberately different** from `styles/global.css`
equivalents:

| Token                                          | admin.css value               | global.css value                                                                  | Diff rationale                                                                               |
| ---------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--bg`                                         | `#080f1a`                     | `--color-bg` `#f5f2eb`                                                            | dark surface                                                                                 |
| `--surface`                                    | `#0d1526`                     | `--color-surface` `#fff`                                                          | dark surface                                                                                 |
| `--radius`                                     | `10px`                        | _none; global uses `--radius-md: 12px`_                                           | admin's default radius is tighter than site                                                  |
| `--radius-sm`                                  | `6px`                         | `--radius-sm: 8px`                                                                | admin's is intentionally tighter (dense UI)                                                  |
| `--radius-lg`                                  | `16px`                        | `--radius-lg: 18px`                                                               | admin's is intentionally tighter                                                             |
| `--shadow-sm`                                  | `0 2px 8px rgb(0 0 0 / 35%)`  | `0 1px 3px …, 0 2px 8px …`                                                        | admin needs heavier shadows on dark backdrops                                                |
| `--shadow-md`                                  | `0 8px 24px rgb(0 0 0 / 45%)` | `0 4px 14px …, 0 2px 4px …`                                                       | admin needs heavier shadows on dark backdrops                                                |
| `--gold`                                       | `#f59e0b` (warm amber)        | `--color-gold` `#c4993e` (brass)                                                  | admin uses a "status amber", site uses brass                                                 |
| `--primary`                                    | `#6366f1` (indigo)            | _not defined_                                                                     | admin-only primary accent                                                                    |
| `--success`, `--danger`, `--info`, `--warning` | hex status                    | `--color-live`, `--color-error`, `--color-fixed`, `--color-warning` (site labels) | semantic difference: admin's "success" is always live-green; site's "live" is price-specific |

**Decision:** do **not** promote. Admin's palette is intentionally its own surface because:

1. Admin is always dark-themed; site supports auto/light/dark via `prefers-color-scheme`.
2. Admin uses a tighter radius scale for dense CRUD forms.
3. Admin's accent (`--primary: #6366f1` indigo) does not appear anywhere on the public site.
4. Mechanically substituting any of the admin tokens with global equivalents would change the visual
   output, violating Phase 2's "no visual change" constraint.

**Follow-up rows for Phases 23–28:** when each admin page is individually revamped, consider
**renaming** admin's tokens to a `--admin-*` prefix to make the "separate surface" explicit. No
value promotion.

## 5. Summary of Phase 2 deliverables

- [x] Enumerate canonical tokens in `styles/global.css` — this file, §1.
- [x] Audit `--tp-*` aliases — §2; already 100% aliased to canonical tokens.
- [x] Audit homepage hero tokens — §3; no page-scoped tokens, consumes canonical directly.
- [x] Audit `admin.css` variables — §4; documented intentional divergence with rationale.
- [x] Capture follow-up rows for later phases (14, 15–22, 23–28).
- [x] Net promotable tokens: **0**. Nothing to mechanically substitute without visual regression.

## 6. Conclusion

Phase 2 can be closed: the three revamp surfaces are already in one of two correct states — either
(tracker, homepage) already consume canonical tokens, or (admin) deliberately carry a separate
palette whose divergence is documented here for downstream phases.

Any future audit must **re-open** Phase 2 only if a new page-scoped `:root { --foo: #hex }` block
re-introduces hand-picked values that could instead alias to `styles/global.css`.
