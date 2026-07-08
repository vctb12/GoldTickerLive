# Phase 11 — Structured data completion (Track C)

Audited JSON-LD across the tool + content pages and closed the one real gap.

## Audit — coverage is already broad

| Type                                 | Where                                                            | Status                        |
| ------------------------------------ | ---------------------------------------------------------------- | ----------------------------- |
| `Organization` + `WebSite`           | homepage                                                         | ✅                            |
| `BreadcrumbList`                     | every tool + content page (via `inject-schema.js`, non-homepage) | ✅                            |
| `WebApplication` (+ `Offer` price 0) | tracker, calculator, compare, heatmap, portfolio                 | ✅                            |
| `ItemList` + `JewelryStore`          | shops                                                            | ✅ already present            |
| `Article`                            | learn, methodology                                               | ✅                            |
| `FAQPage`                            | country pages (Dubai etc.), built from visible Q&A               | ✅                            |
| `Dataset` (+ `FAQPage`)              | reference/price pages                                            | ✅ (non-commercial, no Offer) |

The build's `inject-schema.js` already governs breadcrumbs, Article, Dataset, and country-page
FAQPage, and `inject-schema --check` is enforced in `npm run validate`.

## Gap fixed — methodology FAQPage

`methodology.html` renders a visible **"Frequently asked questions"** section, but it uses a
`<dl class="method-faq-list">` (`<dt>` question / `<dd>` answer) — while `inject-schema.js` only
detected the `<details class="dubai-faq-item">` form. So the site's strongest trust page had **no
`FAQPage` schema** and was ineligible for the FAQ rich result.

Fix (build-managed, so it stays in sync):

- Added `extractDlFaq(content, sectionId)` to `inject-schema.js` — extracts `<dt>/<dd>` pairs
  constrained to a section id, canonical-English only (same Arabic-skip rule as the details
  extractor).
- For any page containing `id="method-faq"`, it now pushes a `FAQPage` schema.
- Ran the injector: `methodology.html` gained a valid `FAQPage` with its 3 real Q&A ("Why does my
  shop quote differ?", "How fresh is the data?", "Why is AED pricing special?").
  `inject-schema --check` is **idempotent** (0 re-modifications).

## Deferred (owned by other phases)

- **Glossary `DefinedTermSet`/`DefinedTerm`** — `glossary.html` has ~50 terms but no term schema; it
  is Phase 28's surface (learn hub & glossary), so the schema is best added there alongside the
  glossary rework.
- **Homepage `WebSite` `SearchAction`** (sitelinks searchbox) — touches `index.html`/homepage
  schema, Phase 21's surface; deferred to avoid collision.

## Verification

`npm run validate` (incl. `inject-schema --check`) / `npm test` / `npm run build` green. FAQPage
JSON is well-formed (produced by `getFAQPageSchema`, `--check` clean).
