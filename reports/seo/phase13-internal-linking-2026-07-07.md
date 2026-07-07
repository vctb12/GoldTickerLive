# Phase 13 — Internal linking & crawl architecture (Track C)

Mapped the internal-linking graph, breadcrumb coverage, and contextual cross-links. **The crawl
architecture is sound — no orphans.** Findings that touch another phase's surface are routed to
their owning phase rather than edited here (file-isolation discipline).

## Architecture map

| Layer                  | Source                                                                                                                  | Coverage                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary nav            | `src/components/nav.js` built at runtime from `src/components/nav-data.js`                                              | All tools (tracker, calculator, compare, heatmap, portfolio, shops, learn, glossary, methodology, market, country hub) are nav items — linked from **every** page |
| Footer rail            | `src/components/footer.js`, derived from `NAV_DATA.groups` (≤3 links/section)                                           | Site-wide deep links, sourced from the same nav data (no divergence)                                                                                              |
| Breadcrumbs            | `src/components/breadcrumbs.js` + `.page-breadcrumbs` mount + `injectBreadcrumbs()`                                     | 13 / 14 indexable pages (home excepted — it's the root)                                                                                                           |
| Contextual cross-links | `src/lib/cross-page-links.js`, `src/components/RelatedGuides.js`, `src/lib/page-handoff.js`, `src/lib/page-hydrator.js` | calculator→shops, home→tracker, learn/methodology related-guides, etc.                                                                                            |

## Orphan detection — none

Every indexable page has inbound links (min 2). Corrected inbound counts (HTML + nav-data + footer;
nav is JS-injected from nav-data so it links all tools site-wide):

| Page            |                             Inbound | Page             | Inbound |
| --------------- | ----------------------------------: | ---------------- | ------: |
| methodology     |                                  16 | shops            |       8 |
| calculator      |                                  13 | glossary         |       4 |
| compare         |                                  13 | heatmap          |       4 |
| learn           |                                  12 | market           |       4 |
| tracker         |                                  12 | dubai-gold-price |       3 |
| —               |                                   — | portfolio        |       3 |
| privacy / terms | 2 (footer legal line — appropriate) |                  |         |

No true orphans. Legal pages (privacy/terms) are intentionally linked only from the footer.

## Findings routed to owning phases (not edited here)

| #   | Finding                                                                                                                                                                                                                              | Owning phase                                                | Why not here                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| L-1 | `tracker.html` emits a `BreadcrumbList` JSON-LD but renders **no visible `.page-breadcrumbs`** (unlike the other 12 tool pages). The schema is structurally accurate (Home › Tracker), so it's a consistency gap, not a false claim. | **Phase 22** (tracker, in-place)                            | Adding a visible breadcrumb bar is a tracker layout change — Phase 22 owns tracker edits |
| L-2 | Newer tools **portfolio (3)** and **heatmap (4)** have the thinnest inbound link profile; best strengthened site-wide by surfacing them in the footer rail.                                                                          | **Phase 18** (global shell & nav)                           | The footer/nav-data are Phase 18's surface                                               |
| L-3 | `market.html` ("How Gold Is Priced", 4 inbound) links **out** to 13 tool pages but is linked **to** less; a "related: how pricing works" cross-link from the tools would help.                                                       | **Phase 18** + Track F related-tools sections (Phase 25/26) | Editing tool pages overlaps Track F                                                      |

## Verification

`npm run validate` / `npm test` green (no code changed — report only).
