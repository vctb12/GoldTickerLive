# Content Translation Policy

_Phase 41. Governs how translated **content** is produced, reviewed, and — critically — whether it
may be indexed. Enforced in code by `src/i18n/translation-status.js`; guarded by
`tests/translation-status.test.js`._

## The one hard rule

> **Machine-translated (or agent-drafted) content is never indexed until a human reviews it.**

Encoded as `MT_ONLY_INDEXABLE = false`. A translation surface is indexable **only** when its review
status is `human-reviewed`. Anything else (`pending-human-review`, unknown) is treated as `noindex`.

## Two tiers of translation

| Tier         | What                                  | Examples                         | Indexing                                            |
| ------------ | ------------------------------------- | -------------------------------- | --------------------------------------------------- |
| **UI shell** | Hand-authored chrome / labels         | nav, footer, buttons, freshness  | Not indexable _content_ — chrome, not a page's body |
| **Content**  | Prose that is the substance of a page | methodology, learn articles, FAQ | Governed here — **noindex until human-reviewed**    |

The Phase 39 (French) and Phase 40 (Urdu) pilots are **UI shell**. This phase introduces the first
**content** batch.

## Workflow for a content batch

1. **Draft** — produce the translation (machine translation or agent-drafted). Register it via a
   `*_META` descriptor with `status: REVIEW_STATUS.PENDING`.
2. **Ship dark** — the batch renders for users who explicitly choose the locale, but the SEO layer
   reads `isBatchIndexable(id) === false` and emits `noindex` (and omits it from the sitemap and
   from indexable `hreflang` alternates). No unreviewed content reaches search engines.
3. **Human review** — a human checks the copy — especially the immutable invariants (see below) —
   and flips the descriptor to `REVIEW_STATUS.REVIEWED`.
4. **Indexable** — `isBatchIndexable(id)` and `indexableContentLocales()` now include it; the SEO
   layer may index it and add it to the sitemap / hreflang set.

## Invariants that a reviewer MUST verify before sign-off

Translated content must preserve, verbatim:

- The troy-ounce constant **31.1035** and the AED peg **3.6725**.
- The pricing formula `price_per_gram_local = (XAU/USD ÷ 31.1035) × karat_factor × local_fx`.
- The **reference-estimate** framing — every price surface is a spot-linked, bullion-equivalent
  reference estimate, **not** a retail quote — and "not financial advice".

The Phase 41 tests assert these hold in the first French batch even while it is still `pending`.

## First French content batch

`src/i18n/fr-content-batch-1.js` — the reference **methodology** (23 keys), translated to French.
Ships `pending-human-review` → **not indexed**. It is a translation of existing `TRANSLATIONS.en`
keys only (no new strings), and preserves every invariant above.

## How the SEO layer consumes this (adoption)

When emitting robots meta / sitemap entries / hreflang alternates for a translated surface, call
`isBatchIndexable(id)` (per batch) or `indexableContentLocales()` (per locale). This phase adds the
decision layer and the first batch; wiring it into the robots/sitemap/hreflang emitters is left to
the SEO-governance surface so this phase touches no other phase's files.

## $0 / constraints

No dependency, no service, no build cost. Additive modules only; EN/AR untouched; UI-shell pilots
unaffected.
