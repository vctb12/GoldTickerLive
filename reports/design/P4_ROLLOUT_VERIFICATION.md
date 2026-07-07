# P4 / v3 §7 rollout verification — home, calculator, compare, learn, admin settings

```yaml
date: 2026-07-07
branch: claude/goldtickerlive-design-consolidation-d64571 (fresh from main after PR #530 merged)
method:
  Chromium sweep, both themes, automated background-leak detector (light theme → flag opaque dark
  surfaces; dark theme → flag opaque light surfaces; ≥12000px² elements) + screenshot review;
  evidence in reports/design/shots/p4-*.png
```

## Verdict: no per-page fixes required

The dual-theme token system merged in PR #530 propagates cleanly to every page in the P4 rollout
list. Every automated flag was either a false positive (deliberate design) or a bug already owned by
another lane. No cosmetic churn was invented to fill the phase.

| Page           | Light | Dark  | Notes                                                                                                                                                                                              |
| -------------- | ----- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| home           | clean | clean | trust band is a documented intentional dark accent in BOTH themes; its inner inks are explicitly overridden to cream/gold (home.css `.home-section--trust-banner` block) — detector false positive |
| calculator     | clean | clean | zero flags either theme                                                                                                                                                                            |
| compare        | clean | clean | zero flags; `.compare-karat-btn.is-active` hardcoded `#fff8e8` on gold-dark ≈6.6:1 with an existing dark override — acceptable                                                                     |
| learn          | clean | clean | invest band (merged from invest.html) is a self-contained theme-invariant composition: dark band + intentional white accent cards, identical in both themes. NOT a leak.                           |
| admin settings | n/a   | n/a   | redirects to /admin/login/ without a session (lockdown working); login renders clean; admin pages deliberately do not carry the public theme preinit (standalone light styling)                    |

## Findings forwarded to the audit lane (not fixed here — out of this lane's scope)

1. **learn.html below-fold reveal void (both themes equally).** Full-page capture shows all content
   below "Buying gold" stuck unrevealed — matches the owner-recon finding (read-counter +
   `InvalidStateError` + stuck low-opacity cards) already assigned to the
   `audit/goldtickerlive-master-website-diagnosis` session. Theme-independent; do not double-fix.
2. **Admin pages load `@supabase/supabase-js` from cdn.jsdelivr.net as a render-blocking head script
   (10 pages).** If the CDN stalls, `DOMContentLoaded` never fires and the page hangs (reproduced
   in-sandbox; production works because the CDN resolves). `window.supabase` is consumed lazily and
   guarded (admin/supabase-auth.js:52), so `defer`/vendoring looks safe — but this is auth bootstrap
   on an owner-sensitive surface; recommend the backend-admin lane verify init order before changing
   it.

## Raw-hex audit of rollout page CSS

learn/glossary/admin: 0. calculator: 1 (token fallback). compare: 1 (AA-passing active-state ink
with dark override). portfolio: 3 (token fallbacks). heatmap: 20 — all inside the page's own
light/dark choropleth ramp blocks (`--heatmap-*`), i.e. a local themed palette, not leaks.
