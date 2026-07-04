# Radical page reduction + nav redesign (owner order)

```yaml
plan-status: in-progress
priority: P0
class: structural
owner: @vctb12
created: 2026-07-04
requested-by: owner, verbatim: "reduce html pages count and nav bar redesign … i neeed to have
  5-10 meaningfull htmls rather than the currectn collection i do not care about seo or anything
  else, we can do it later"
supersedes: page-count targets in 2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md
```

The owner explicitly waived SEO/canonical concerns for this change ("we can do it later"). That
waiver is recorded here because it overrides, for this PR only, the AGENTS.md rule against silent
canonical/sitemap restructuring — this restructuring is owner-ordered, not silent.

## Target public IA (9 meaningful pages)

| Page               | Role                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| `index.html`       | Home — snapshot + entry points                                         |
| `tracker.html`     | Live prices flagship                                                   |
| `calculator.html`  | All calculators (value, scrap, zakat, buying power, converter)         |
| `compare.html`     | Countries: cross-country comparison (absorbs the country-pages intent) |
| `heatmap.html`     | World map choropleth                                                   |
| `portfolio.html`   | Private holdings tracker                                               |
| `shops.html`       | Shops directory                                                        |
| `learn.html`       | Education hub (absorbs learn/insights/invest/guides intent)            |
| `methodology.html` | Trust / how prices work                                                |

Plus system/legal (not "meaningful pages", still required): `terms.html`, `privacy.html`,
`404.html`, `offline.html`. Non-public: `admin/`.

## Deleted trees (git history keeps everything)

`countries/` (country/city/karat pages), `content/` (guides/tools/embed/search/order), `ar/` (static
Arabic mirrors — AR stays fully supported via the runtime `?lang=ar` toggle on every kept page),
`chart/`, `gold-price/`, `methodology/` (directory form), `redesign/`, and the dormant root pages
`account.html`, `dashboard.html`, `pricing.html`, `developer.html`, `design-lab.html`,
`insights.html`, `invest.html`.

Old URLs 301 via `_redirects`/`.htaccess` to the nearest surviving surface (countries → compare,
guides/insights/invest → learn, chart/gold-price → tracker, ar/* → `/?lang=ar`). Not for SEO — just
so existing bookmarks and the X-post backlink history don't dead-end.

## Nav redesign

Flat, small-IA nav from `nav-data.js`: Home · Live Prices · Calculator · Compare · World Map ·
Portfolio · Shops · Learn (+ Methodology), keeping the existing shell visuals (ink-first bar,
condense-on-scroll, theme/lang toggles, Live Tracker CTA) and the drawer/footer that derive from the
same data. Mega-menu groups collapse to at most one compact dropdown.

## CI guard reconciliation

Every validate script / test that iterated the deleted trees is updated in the same PR (sitemap
regenerates from the filesystem; country/city/content-specific guards and tests are retired or
retargeted). Full gate must be green before merge.
