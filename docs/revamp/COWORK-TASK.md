# Cowork task — live-site QA tracker + Wave-6 brand assets

> **Paste this whole block into a Claude Cowork session** (the one with Claude-in-Chrome +
> Higgsfield). It runs _in parallel_ with the code revamp, which a local Claude Code session is
> shipping as PRs against `vctb12/GoldTickerLive`. **Do NOT touch the repo.** Save every output to
> your outputs folder — the Claude Code session will commit them into `docs/revamp/qa/` and
> `src/assets/brand/`.

---

## Why you (Cowork) and not Claude Code

The Claude Code session has the repo + GitHub and is doing all code/PR work. You have the live
browser and image/video generation. Do the two things it can't easily do from a headless repo
checkout: **verify the live site** and **produce brand assets**.

## Part A — Live-site verification tracker (Claude-in-Chrome)

1. Open https://goldtickerlive.com. If the Chrome extension isn't connected, say so and stop.
2. Walk and screenshot each surface: homepage **EN + AR**, `/calculator` **EN + AR**, one country
   page (e.g. `/countries/uae/dubai/gold-rate`), `/methodology`, a chart page, and the **404** page.
   Resize toward ~390px where the environment allows; note if you can't.
3. Log every issue in one table — **quote real on-screen text/values**, don't paraphrase:

   | Surface | Issue (quote it) | Severity P0/P1/P2 | Trust-impacting? | Maps-to-phase | Screenshot
   |

   Cross-reference `Maps-to-phase` to the phase numbers in `docs/revamp/phases/`.

4. **Re-verify the original audit's open items** and mark each `STILL-PRESENT` / `FIXED` /
   `CHANGED`:
   - canonical `/calculator.html` vs clean `/calculator`
   - "Live" label shown on stale (>~10 min) data
   - homepage **chart value vs spot-card value** mismatch
   - header nav **overlaps logo** ~768–1240px
   - muted text contrast (~2.7:1) in light mode
   - quick-convert **blank reference value**
   - **Arabic not separately indexable** (title/meta stay EN, no distinct URL, hreflang points at a
     URL the toggle never produces)
   - `/assets/favicon.svg` **404**
5. Flag any **NEW** issues not in the original audit → list them as candidate new phases (they'll be
   appended to `PROGRESS.md`).
6. Save the table as `cowork-live-qa-tracker.md` plus the screenshots.

## Part B — Wave-6 brand assets (Higgsfield)

On-brand = **premium gold, trustworthy, finance-grade — not generic stock**. Generate:

- **favicon master** — square, one simple gold mark, legible at 16px
- **OG / Twitter card** — 1200×630, safe area for brand + headline
- **hero background** — desktop (wide) **and** mobile (9:16)
- _(optional)_ **5s looping hero video** — muted, subtle motion, with a 4K still as poster (gate
  behind `prefers-reduced-motion`)

Save each asset + a manifest `cowork-asset-manifest.md` mapping
`filename → intended use → dimensions/format`. Prefer **WebP/AVIF** for raster.

## Non-negotiables (verify, don't restyle away)

- Spot/reference price **must never** read as a retail/jewelry price.
- AED/USD peg is **3.6725**.
- Non-live values (estimated/derived/delayed/fallback/cached) must stay clearly labeled.
- Static stack only — no framework/SSR/build-tool proposals.

## Handback

Tell the Claude Code session (or the user) when outputs are in your outputs folder. Claude Code will
commit `cowork-live-qa-tracker.md` → `docs/revamp/qa/`, append new issues to
`docs/revamp/PROGRESS.md`, and place brand assets under `src/assets/brand/` via their own PRs.
