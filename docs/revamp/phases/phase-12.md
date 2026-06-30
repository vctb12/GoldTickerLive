# Phase 12 — JSON-LD expansion & validation

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 12 — JSON-LD expansion & validation
- **Maps to:** strengthens existing Organization/WebSite/FAQPage.
- **Branch:** `phase12-jsonld` · **PR:** Add/repair structured data
```
Audit existing JSON-LD (homepage has Organization, WebSite, FAQPage). Add appropriate schema sitewide: BreadcrumbList on inner pages, WebSite SearchAction, Organization with logo/sameAs, and on price/country pages a suitable Dataset or Product-style schema for the reference price WITH clear "reference price, not retail" semantics (do not imply a purchasable offer/price you don't sell). Localize where relevant. Validate every type against schema.org and Google Rich Results. Read current JSON-LD emission first. Open PR phase12-jsonld. Use the `schema` skill conventions. Static stack only.
```
- **Accept:** All pages emit valid JSON-LD; no Rich Results errors; no misleading Offer.
