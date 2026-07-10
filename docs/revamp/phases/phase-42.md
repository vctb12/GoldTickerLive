# Phase 42 — Analytics & consent (privacy-safe)

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 42 — Analytics & consent (privacy-safe)

- **Branch:** `phase42-analytics-consent` · **PR:** Consent-gated analytics + ad-slot review

```
There are analytics scripts and ad slots present. Add a privacy-respectful consent mechanism (region-aware; default to least data), gate analytics/ads behind consent, ensure no PII in URLs, and keep the page fast when consent is denied. Document what is collected in a privacy page (EN/AR). Read current analytics/adSlot modules. Open PR phase42-analytics-consent. Static stack only.
```

- **Accept:** Analytics/ads load only after consent; privacy page live EN/AR.

---
