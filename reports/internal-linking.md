# Internal-linking audit (Track 2.3)

**Date:** 2026-04-27 · **Scope:** read-only audit of static internal-link density on top-level entry
HTML pages. **Audit-only — no link edits in this batch.**

This report sketches where the internal-link graph is dense vs. sparse, so a follow-up PR can target
the weak hubs without reshuffling the whole internal-linking surface.

---

## Snapshot — link counts

Counts come from `<a …>` tags in the source HTML (excluding nav/footer, which inject identical link
sets on every page). They reflect the _page-body_ internal-link density — i.e. what content authors
have linked to from the page itself.

| Page               | Body `<a>` count (approx) | Hub strength                                                                                               |
| ------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `index.html`       | ~39                       | Strong — homepage already links to tracker, calculator, shops, learn, country pages, content guides.       |
| `tracker.html`     | ~16                       | Medium — links to methodology and calculator from the trust copy; light on outbound to country pages.      |
| `methodology.html` | ~20                       | Medium — references sources and tracker; could link to specific country/karat guides.                      |
| `shops.html`       | ~10                       | **Weak** — directory page; mostly internal filter chips, very few outbound to country/methodology context. |
| `calculator.html`  | ~6                        | **Weak** — almost no outbound; should at minimum link to methodology, tracker, and 22K/24K guides.         |
| `learn.html`       | not surveyed              | —                                                                                                          |
| `insights.html`    | not surveyed              | —                                                                                                          |
| `invest.html`      | not surveyed              | —                                                                                                          |

Nav + footer inject ~30 additional links via `src/components/nav.js` and `src/components/footer.js`
on every page; those are uniform and out of scope for this audit.

---

## Weak hubs flagged for a follow-up PR

**`calculator.html`**

- Add an inline "Reference price source" link → `methodology.html`.
- Add a "Why karats matter" link → `content/guides/24k-vs-22k.html`.
- Add a "Live tracker" CTA → `tracker.html` (already in nav, but a body link reinforces the user
  journey).

**`shops.html`**

- Each city filter chip should link out to the matching country page (`/countries/<slug>/`) in a
  "View live rates for <city>" affordance.
- Add a "How shop prices differ from spot" body link → `content/spot-vs-retail-gold-price/`.

**Country landing pages (`/countries/<slug>/`)**

- Currently link mostly to their own city/karat children. Should also link to:
  - `methodology.html` (source/spot disclosure).
  - `calculator.html` (karat/quantity calc using the same currency).
  - The matching content guide if one exists (`content/uae-gold-buying-guide/`,
    `content/dubai-gold-rate-guide/`, etc.).

---

## Orphan / under-linked content

Pages that exist in the deployed sitemap but appear in **fewer than 2 inbound body links** from
entry pages (rough estimate from a grep over the top-level entry pages):

- `content/22k-gold-price-guide/` — only linked from nav.
- `content/24k-gold-price-guide/` — only linked from nav.
- `content/spot-vs-retail-gold-price/` — only linked from nav and methodology.
- `content/gold-making-charges-guide/` — only linked from nav.
- `content/zakat-gold-guide/` — only linked from nav.
- `content/changelog/` — only linked from footer.

The fix is **not** "spam links into every page". The fix is to link from the natural anchor surface
— e.g. `calculator.html` mentions making charges, so it should link to `gold-making-charges-guide/`
from that sentence; `methodology.html` distinguishes spot vs. retail, so it should link to
`spot-vs-retail-gold-price/` from the corresponding paragraph.

---

## Out of scope for this audit

- Touching links — no edits in this batch (Track 2.3 is audit-only).
- Generated leaf pages (`countries/<slug>/<city>/.../index.html`) — those are hydrated by
  `src/lib/page-hydrator.js` and use a shared template; changing their internal-link surface is a
  separate effort tracked in §22b.
- Cross-language linking parity — handled by `src/lib/seo` hreflang emitters and not part of this
  hub audit.

---

## Action log

- 2026-04-27 — Audit produced. Status: ✅ baseline captured; follow-up edits queued in
  `docs/REVAMP_PLAN.md` §22b internal-linking row.
