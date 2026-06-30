# GoldTickerLive Revamp

A-to-Z revamp derived from a live-site audit (2026-06-30). Stays on the existing static stack (vanilla ES6 + Vite, Express, Supabase) — **no framework migration, SSR, or build-tool swap.**

## Contents
- `00-AUDIT.md` — the live-site audit (findings tagged VERIFIED / UNVERIFIED).
- `MASTER-50-PHASE-PLAN.md` — all 50 phases in one document + asset library + sequencing.
- `phases/phase-00.md … phase-50.md` — one file per phase, each with a paste-ready Claude Code PROMPT and acceptance criteria. **A phase may be one or several PRs.**

## How to execute
1. Open Claude Code in this repo on a fresh `main`.
2. Run `phases/phase-00.md` (repo map), then proceed in order.
3. Each phase: copy the PROMPT, let Claude Code branch (`phaseNN-slug`), implement, self-verify, open PR(s). Review + merge before the next.

## Waves
- **0 (01–05):** foundation & safety — tests, CI, design tokens, budgets, inventory
- **1 (06–14):** P0 SEO/bilingual — canonical, static `/ar/` pages, meta, hreflang, sitemap, JSON-LD
- **2 (15–22):** trust & freshness integrity
- **3 (23–30):** layout, responsive & RTL
- **4 (31–36):** accessibility (WCAG AA)
- **5 (37–42):** performance & infra
- **6 (43–47):** visual & brand polish (Higgsfield assets in MASTER plan)
- **7 (48–50):** content depth, SEO growth, launch

## Priority map (from audit)
- **P0:** Arabic not separately indexable (Phases 07–09, 13–14); canonical `/` vs `/calculator.html` (Phase 06).
- **P1:** "Live" on 9-min data (15); chart vs spot price mismatch (16); nav overlaps logo ~768–1240px (23); muted text ~2.7:1 contrast (31); quick-convert blank (18).
- **P2:** favicon 404 (38); ~30 JS chunks (37); repeated checklist headings (27); repo paths in methodology copy (20); freshness-vocab/numeral/bidi consistency (17/13/26).
