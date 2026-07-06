# GoldTickerLive — Master Website Audit & 20-Phase Net-New Plan

Branch: `audit/goldtickerlive-master-website-diagnosis`
Date: 2026-07-06
Scope: A grounded live-site + repo audit of goldtickerlive.com (`vctb12/GoldTickerLive`), a real fix for the actual learn.html read-progress bug, and a net-new 20-phase plan that reconciles with — and does not duplicate — the existing 50-phase revamp (`docs/revamp/`) and the owner-revised product roadmap (`docs/plans/2026-07-04_product-roadmap.md`).

## 1. Executive summary

learn.html is **not empty**. All 9 guides render correctly across 4 sections (Start here, Buying gold, Investment, GCC markets), and the long-form guide content is real — for example the "Gold Karats Explained" section ships a full karat comparison table and the price formula `Gold price per gram = (XAU/USD spot / 31.1035) x (karat / 24) x FX rate`. This was confirmed directly in-browser, not assumed.

The real, reproduced bug is narrower and was root-caused in code, not guessed: the "Read X of 9 featured guides" counter never advances past 0. Two independent defects compound in `src/pages/learn-hub-ui.js` and `src/config/learn-hub-catalog.js`:

1. The click handler stripped the leading slash from a card's `href` before calling `markGuideRead()`, but the read-state check (`renderGuideCard`) and the progress count compared against the catalog's un-stripped `href`. The stored key and the compared key could never match, so the counter stayed at 0 forever and cards never visually flipped to "read."
2. 2. Two of the 9 catalog entries ("Spot vs retail" and "Making charges") intentionally share the same in-page anchor (`/learn.html#pricing`). Even a fixed href-based key could never reach "9 of 9," because two guides would always collapse onto one stored key.
  
   3. A third, separately-reproduced defect explains the console `InvalidStateError: Transition was aborted because of invalid state` and the briefly-faded guide cards: `src/lib/motion-boot.js` wraps every same-origin anchor click in `document.startViewTransition()`, including in-page anchors formatted as absolute paths (`/learn.html#karats`) while already on `/learn.html`. That API only supports same-document DOM-mutation transitions, not real navigations, so wrapping a hash-only same-document `location.href` assignment in it can abort mid-transition and leave the pre-reveal (faded) DOM snapshot on screen.
  
   4. All three defects are fixed in this branch with minimal, targeted diffs, plus new automated tests. No redesign was performed, and `feat/ui-overhaul` (PR #530, dark/gold design system) was not touched — that PR's own description states "Learn page and Arabic/RTL untouched and re-verified rendering," which this audit corroborates from the opposite direction (this branch never touches theme/token/footer/shops/nav-search files that PR #530 changed).
  
   5. This repo already runs a mature, in-flight improvement program, and this document is written to extend it, not replace or duplicate it:
  
   6. - `docs/revamp/00-AUDIT.md` + `docs/revamp/MASTER-50-PHASE-PLAN.md` — a 50-phase, wave-organized revamp (foundation, P0 bilingual/SEO, trust/freshness, layout/RTL, accessibility, performance, visual/brand, content/launch). Several phases have already merged.
      - - `docs/plans/2026-07-04_product-roadmap.md` — an owner-revised (`r2`) near/medium/long-term roadmap under a strict $0-to-run rule. Portfolio tracker and the world heatmap are already shipped. Newsletter automation is removed by owner decision; WhatsApp Business API alerts and Stripe payments are parked.
        - - PR #530 (`feat/ui-overhaul`) — an open, unmerged dual-theme (light-default, dark-optional) design system plus four P0 fixes (returning-visitor crash, shops default tab, footer contrast, nav search wiring). Still in CI at the time of this audit; not merged; not touched by this branch.
         
          - The 20-phase plan in Section 11 is deliberately scoped around what neither of those documents already owns: hardening this fix, executing the roadmap's specced-but-unshipped $0 items (RSS/JSON feed, embed-widget configurator, Telegram automation, committed price history) to an implementation-ready level, and closing testing/accessibility/documentation gaps.
         
          - 
