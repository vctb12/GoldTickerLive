# Phase 23 — Header nav breakpoint (stop logo overlap)

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 23 — Header nav breakpoint (stop logo overlap)

- **Maps to:** P1-3 (nav overlaps logo ~792–1240px).
- **Branch:** `phase23-nav-breakpoint` · **PR:** Raise hamburger breakpoint

```
The desktop nav overlaps the logo between ~768px and ~1240px because the hamburger only engages below ~792px. Read the header/nav component + its CSS. Raise the collapse breakpoint (switch to the existing hamburger at ~1024–1100px) or let the nav condense before it collides; verify no overlap of logo, links, search icon, theme toggle, language button, or CTA at 768/900/1024/1200/1280/1440 in BOTH EN and AR (RTL). Open PR phase23-nav-breakpoint with screenshots at those widths in both languages. Static stack only.
```

- **Accept:** No header element overlap at any width in EN or AR; hamburger works.
