---
applyTo: "countries/**,content/**,learn.html,insights.html"
---

# Content / Country Pages Instructions

Country, city, and content hub pages carry the long-tail SEO and a large share of trust. Read this
before adding or significantly editing any page under `countries/` or `content/`.

## 1. Country / city / karat pages — minimum bar

Every page that aspires to be indexed must have:

- A **local-context paragraph** that is genuinely about that location: currency, common karats
  bought locally, market structure (e.g. gold souks, malls, online platforms), VAT / import duties
  if relevant.
- A live karat table with current freshness label (uses the shared component, don't reinvent).
- Methodology link, in-context (e.g. "How we estimate prices →").
- Internal links: country index, neighbouring countries, top cities in that country, calculator,
  related guides.
- Hreflang pair if an Arabic equivalent exists.
- Unique title, unique H1, unique meta description — never the templated swap-the-country-name
  variant.
- Schema (`Place`, `BreadcrumbList`, plus `FAQPage` if the page has an FAQ).

If a page can't meet the local-context bar, it should be `noindex` (and added to the governance
allowlist in `scripts/node/seo-governance.js`).

## 2. Reference vs. retail wording

- "Estimated reference price" / "spot-linked estimate" / "before retail premiums" — yes
- "Today's gold rate in <city>" without disclaimer — no
- Always make clear: shop prices include making charges, dealer premium, VAT.

## 3. Local currency

- Country pages show prices in local currency, converted via current FX from USD/gram, **not**
  through the AED peg (unless the country is the UAE).
- If FX is unavailable, surface `fallback` state with the last known rate timestamp.

## 4. Karat tables

- Always show 24K, 22K, 21K, 18K. Show 14K/9K if they're locally common.
- Use the canonical purity factors from `src/config/karats.js` — never inline new numbers.
- Tabular figures + thousands separators per locale.

## 5. Bilingual EN / AR parity

- If you ship an EN country page, the AR equivalent should follow in the same PR (or be tracked
  in `docs/REVAMP_PLAN.md`).
- AR content must read naturally — not a literal English-shaped translation.
- Hreflang on both sides (`en` ↔ `ar` + `x-default`).

## 6. Content hub pages (`learn.html`, `insights.html`, `content/**`)

- Tone: neutral, factual, **not financial advice**. Use phrasing like "informational only", "your
  shop may quote differently".
- One H1, clean H2/H3 hierarchy.
- TL;DR / key-takeaways block at the top for long pieces.
- Last-updated date visible — and accurate.
- No AI-generated filler. If a paragraph would survive being deleted with no information loss,
  delete it.
- Cite external sources when claiming numbers (LBMA, World Gold Council, IMF, UAE Central Bank,
  etc.).

## 7. FAQ blocks

- Use real questions from search query data, not invented ones.
- Each Q/A: one paragraph max, link to deeper resource where relevant.
- Schema (`FAQPage`) injected by `scripts/node/inject-schema.js`. Don't hand-author.

## 8. Shops references

- If a content page mentions shops, link to `shops.html` rather than naming individual shops.
- Never claim "trusted by", "verified", "official", or "best price" without evidence — see the
  shops-data-honesty prompt.

## 9. Internal linking

Every content page must:

- Link out to methodology
- Link out to at least one calculator / tracker entry
- Be reachable from a hub (nav, footer, sibling country list, or learn index)

## 10. Common content mistakes

- "Today's gold rate in <country>" without freshness label or local-context paragraph.
- Country page where only `H1` and breadcrumb differ from a sibling.
- Calculator-style claims of precision without disclaimer.
- AI tone words ("delve", "unlock", "explore the world of", "in the realm of") — rewrite or delete.
- Hardcoded EN-only strings; AR equivalent missing.
- Outdated "Last updated" dates left from previous year.

## 11. Validation

```bash
npm run seo:governance:check
npm run validate
npm run audit-pages
```

`audit-pages` flags thin / templated pages — read its output before merging.

See [`docs/SEO_STRATEGY.md`](../../docs/SEO_STRATEGY.md),
[`docs/EDIT_GUIDE.md`](../../docs/EDIT_GUIDE.md),
[`docs/revamp-page-map.md`](../../docs/revamp-page-map.md).
