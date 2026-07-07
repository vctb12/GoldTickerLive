# Phase 17 — Design-token consolidation (Track E · 🟡)

Analysed every hardcoded hex in the stylesheets against the token system. **Key finding: a blind
hex→token mass-replace is _unsafe_ here** — it would silently break dark mode or re-colour
intentional components. This phase applies the **one** provably-safe replacement and documents the
safe methodology + the dual-theme visual-regression gate any real consolidation needs.

## Hex inventory

| Bucket                                     |   Count | Notes                                                             |
| ------------------------------------------ | ------: | ----------------------------------------------------------------- |
| Total hex literals in `styles/**`          |     478 |                                                                   |
| In `styles/partials/tokens.css`            |     174 | **token definitions — the source of truth; must NOT be replaced** |
| Usages elsewhere                           |    ~300 | the consolidation candidates                                      |
| Tokens overridden in `[data-theme='dark']` | **276** | i.e. most tokens are **theme-variant**                            |

## Why a mechanical replace is unsafe

Cross-referencing every hex _usage_ (excluding `tokens.css`, and the intentionally off-canonical
`invest.css` dark-premium identity and `admin/*`) against the `:root` token values:

- **1** usage matches a **theme-invariant** token → provably safe (fixed below).
- **10** usages match a **theme-variant** token → replacing them would **change the dark-mode
  colour** (e.g. `--color-gold` is `#b07d1f` in light but `#ddb040` in dark). That's a re-theme, not
  a refactor — it needs design intent + a visual-regression diff, not a blind swap.
- The remaining ~290 are **intentional one-offs**: component-identity colours, hardcoded _dark_ card
  blocks (e.g. `components.css` `#1a1a2e`/`#e0e0e0` — deliberately dark in both themes), brand
  shades, and gradient stops. Tokenising these would either be a no-op-with-churn or an unwanted
  recolour.

So the backlog "565 hardcoded hex" is large-effort precisely because **each instance needs
per-element judgment**; it cannot be safely mechanised.

## Applied — the one provably-safe replacement

`styles/components/alert-manager.css`: `border-color: #25d366` → `var(--brand-whatsapp)`. The token
`--brand-whatsapp` is `#25d366` in **both** themes (theme-invariant), so the rendered colour is
identical everywhere — a pure maintainability win, zero visual risk. (It's a WhatsApp **share-link**
accent, unrelated to the parked WhatsApp Business API.)

## Safe methodology for future consolidation (recommended, not mechanised here)

1. **Exact-match to theme-invariant tokens only** → provable no-op (what was done above). A tiny
   set.
2. **Intentional re-theming** (mapping a hex to a theme-variant token so an element _starts_
   adapting to dark mode): treat as a design change, one component at a time, **gated by a
   dual-theme visual-regression screenshot diff** (light + dark, before/after). Requires design
   sign-off because the dark-mode appearance genuinely changes.
3. Never touch `tokens.css` definitions, `invest.css` (intentional identity), or `admin/*`.

## Verification

`npm run validate` / `npm test` / `npm run build` green; the single replacement resolves to an
identical colour in both themes (token value == the former hex).
