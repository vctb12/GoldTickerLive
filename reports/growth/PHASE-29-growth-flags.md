# Phase 29 — Additive growth (flags only) (Track G · Yellow)

Establishes a **client-side, $0 growth-experiment registry** — flags only, everything OFF, nothing
wired into the live UI. It gives future growth work a safe, no-cost place to land behind a flag, and
a guard test so nothing ships on by accident.

## Why a new registry (and not the existing flags)

The site already has a feature-flag system in `src/lib/site-settings.js`, but it is
**Supabase-backed and owner-controlled** (admin panel `features`: `darkMode`, `newsletter:false`,
`portfolioTracker`, `orderGold`, `priceAlerts`). That is owner-gated — this phase does **not** touch
Supabase, the admin, or those flags. Instead it adds a separate, purely client-side layer for **$0
growth experiments** that need no backend, account, or recurring cost.

## `src/config/growth-experiments.js`

- `GROWTH_EXPERIMENTS` — a documented registry; each entry has `enabled` (default **false**),
  `summary`, `rationale`, and `readiness` (what building it would touch when turned on).
- `isGrowthExperimentEnabled(key)` — live default is always the registry value (false for everything
  today). A `?growth=<key>` URL param can force one on **for local testing only** — it never
  persists and is ignored for unknown keys, so it can't accidentally ship anything.
- The module is **not imported anywhere**, so the bundler tree-shakes it out — zero bytes and zero
  behaviour change on the live site. This is literally "flags only".

Registered experiments (all OFF; each is a considered, ready-to-build $0 lever):

| Key                  | What it would add                                              | $0 lever                                                                                 |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `shareNudge`         | Dismissible "share this tool" prompt on result surfaces        | Word-of-mouth; reuses the native Web Share path from Phase 23                            |
| `relatedToolsRail`   | Cross-tool recommendation rail                                 | Session depth via internal links only                                                    |
| `priceMoveBadge`     | Subtle "▲ x% today" badge on landing surfaces                  | Retention; reuses the tracker's existing move engine (same reference-estimate labelling) |
| `saveComparisonLink` | One-tap "save this comparison" copying the URL-state deep link | Return visits; reuses existing deep-link serialisation + copy toast                      |

## Guard test — `tests/growth-experiments.test.js`

Five assertions that make the "flags only, $0" contract enforceable in CI:

1. The registry is a non-empty object.
2. **Every experiment defaults to `enabled:false`** — the build fails if any flips to `true`.
3. Each experiment carries the documented `summary`/`rationale`/`readiness` fields.
4. **No experiment references a forbidden monetization/cost surface** (regex guard against
   `newsletter` / `whatsapp business` / `stripe` / `payment` / `subscription billing`) — protects
   the $0 / no-resurrected-monetization guardrail.
5. `isGrowthExperimentEnabled()` returns `false` for every key (and unknown keys) with no URL
   override.

## Constraints honoured

- $0 / no new recurring cost — every experiment is client-side only.
- No newsletter automation, WhatsApp Business API, or payments — the guard test blocks them.
- No Supabase / admin / owner-gated changes.
- No live UI change — the registry is unwired and tree-shaken out.

## Gate

`npm run build` + `npm run validate` + `npm test` (1291 pass, +5) + `npm run lint` — all green.
