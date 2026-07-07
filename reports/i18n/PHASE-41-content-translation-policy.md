# Phase 41 — Content translation policy + first FR batch (Yellow)

Codifies **how translated content is produced and whether it may be indexed**, and ships the first
French _content_ batch under that policy. The governing rule — _machine/agent-drafted content is
never indexed until a human reviews it_ — is enforced in code, not just documented.

> **Stacks on [#577](https://github.com/vctb12/GoldTickerLive/pull/577) → #576 → #575.** Continues
> the i18n chain (38→39→40→41); based on the Phase-40 branch. Merge order: #575 → #576 → #577 →
> this.

## What shipped

- **`docs/i18n/content-translation-policy.md`** — the policy: two tiers (UI shell vs content), the
  MT+human-review workflow, the noindex-until-reviewed rule, and the invariants a reviewer must
  verify.
- **`src/i18n/review-status.js`** — shared `REVIEW_STATUS` constants (`PENDING`, `REVIEWED`).
- **`src/i18n/translation-status.js`** — the enforceable half:
  - `MT_ONLY_INDEXABLE = false` — the single source of truth for the rule.
  - `isContentIndexable(status)` — true **only** for `human-reviewed`.
  - `isBatchIndexable(id)` — per-batch, fails **closed** for unknown ids.
  - `indexableContentLocales()` — locales with ≥1 reviewed batch (what the SEO layer may index).
- **`src/i18n/fr-content-batch-1.js`** — the first French **content** batch: the reference
  methodology (23 keys), translated to French, registered as `pending-human-review` → **not
  indexed**.

## The "no auto-only indexed" guarantee (enforced)

The French methodology renders for a user who chooses French, but because the batch is
`pending-human-review`, `isBatchIndexable(...) === false` and `indexableContentLocales() === []` —
so the SEO layer emits `noindex`, omits it from the sitemap, and drops the indexable hreflang
alternate. Only a human flipping the status to `human-reviewed` opens the gate. Unknown batch ids
fail closed.

## Invariants preserved verbatim in French (asserted while still pending)

- Troy-ounce constant **31.1035** (`methodology.stepGram`) and AED peg **3.6725**
  (`methodology.stepLocal`).
- The pricing formula preserved character-for-character.
- Reference-estimate framing ("Estimation de référence", not retail) — the surface stays a
  spot-linked bullion-equivalent reference estimate.

## Tests — `tests/translation-status.test.js` (7)

MT-only is never indexable and only `human-reviewed` is; the FR batch ships pending → not indexable
and no content locale is indexable yet; unknown batch → not indexable; the sign-off path opens the
gate; every batch key exists in `TRANSLATIONS.en` and is a `methodology.*` key; the invariants
(31.1035 / 3.6725 / formula / reference framing) hold in French; values are non-empty and (bar the
formula) differ from English.

## Adoption (not done here)

The robots/sitemap/hreflang emitters call `isBatchIndexable(id)` / `indexableContentLocales()` when
deciding indexability for translated surfaces. This phase adds the decision layer + first batch and
touches no other phase's files.

## Constraints honoured

$0 / no dependency; EN/AR untouched; UI-shell pilots unaffected; **no unreviewed content is
indexable**; immutable invariants preserved in the French copy; additive modules only.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1315 pass, +7**) + `npm run lint` — all green.
