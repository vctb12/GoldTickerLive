# Premium Dark/Gold Revamp — Final Report (feat/ui-overhaul)

```yaml
date: 2026-07-06
brief: owner "Premium Dark/Gold Design Revamp" (frontend design lane)
spec: reports/design/DESIGN_SPEC.md
evidence: reports/design/shots/ (before-* vs after-*)
```

## What shipped

1. **Dark is now the brand identity and default.** Unset preference resolves to `dark` in all three
   places that decide it (pre-paint snippet via `inject-theme-preinit.js`, the internal-stub
   generator, and the `nav.js` runtime controller — the third one was silently clobbering the first
   two back to OS-light). Saved `light`/`auto` prefs still win; the toggle still cycles.
2. **Layered warm near-black palette** replacing the blue-tinted dark set, in every tokens.css dark
   block _and_ the 25 legacy hardcoded blue-dark stops across page CSS (hero gradients, tracker
   terminal `--tp-*` palette, footer gradient): base `#0b0b0d`, surfaces `#141418/#1c1c22/#26262c`,
   warm hairline borders.
3. **Disciplined 3-tier gold**: metallic `#ddb040` (CTAs/accents), NEW antique `#b5945c` for large
   display headings (dark `h1`s now render antique serif — one gold voice per block, subtitles stay
   ink), bright `#fad97a` sparing. Body/data/fine print stay near-white — never gold.
4. **Editorial display serif**: self-hosted Playfair Display 600/700 latin subset (46 KB total, OFL
   license committed), `font-display: swap`, wired through `--font-display` (38 consumers). Arabic
   headings automatically stay on Cairo via the existing `[dir=rtl]` swap.
5. **First-paint + PWA alignment**: `critical.css` flipped dark-first with `[data-theme=light]`
   overrides; manifest background `#0b0b0d`.
6. **Component/bug fixes surfaced by the pass**: shops trust-date skeleton never cleared its shimmer
   classes after fill (text rendered inside a fixed-width block and clipped) — fixed;
   `--color-text-faint` brightened `#8f857a→#988e83` (4.16:1 → 4.68:1 on the raised surface-3).

## VERIFIED (ran here, evidence in repo)

- **Contrast**: every gold-on-dark and ink-on-dark pairing computed (not guessed) — table in
  DESIGN_SPEC.md; all AA (worst pair 4.68:1 vs 4.5 requirement; antique headings 6.4–6.9:1 vs 3.0
  large-text requirement). `scripts/node/check-basic-a11y.js` CI gate green.
- **Gates**: `npm test` **1292/1292 pass**, `npm run validate` 0 errors/0 warnings, eslint +
  stylelint clean, `NODE_ENV=production npm run build` succeeds.
- **Runtime (Chromium against Vite)**: home/tracker/shops/learn all boot `data-theme=dark` with no
  saved prefs; light toggle restores parchment (`after-home-light-toggle.png`); RTL verified
  (`dir=rtl`, `after-tracker-ar.png`, `after-shops-ar.png`); mobile 375px no horizontal scroll on
  flagships; trust surfaces (reference-only banner, freshness chips, spot-vs-retail rows,
  methodology links) visible and near-white on dark in every shot.
- **Motion**: price-tick `flash-up/down` keyframes intact; 18 `prefers-reduced-motion` guards in the
  motion/tracker layer; reduced-motion render captured.

## ASSUMED / NOT RUN (needs an environment with the missing pieces)

- **Lighthouse before/after** — not run: no Lighthouse binary in this sandbox and production is
  unreachable from it (proxy resets). Run `npx lighthouse` on the deploy preview for
  home/tracker/shops and compare accessibility+performance vs main. Font cost is +46 KB swap-loaded
  woff2, so LCP risk is low but unmeasured.
- **Playwright spec suite** (`npm run test:playwright`) — ad-hoc Chromium smoke performed instead
  (same engine, scripted checks + screenshots).
- **Live-data render paths** — external price feeds are blocked in the sandbox; loading/ unavailable
  fallbacks (honest states) are what the screenshots show.
- **Per-page bespoke polish (brief Phase 4 depth)** — the token system propagates the identity to
  every page (calculator/compare/heatmap/portfolio/learn/glossary/admin verified rendering dark in
  the shot suite before pruning), but page-by-page fine-tuning (spacing rhythm, bespoke empty
  states, admin settings form polish) is follow-up work, one PR per page as the brief prescribes.

## Contrast pairings adjusted

| Pair                                     | Before   | After                                               |
| ---------------------------------------- | -------- | --------------------------------------------------- |
| `--color-text-faint` on surface-3 (dark) | 4.16:1 ✗ | 4.68:1 ✓ (`#988e83`)                                |
| everything else                          | —        | passed as designed; no other pair needed adjustment |

## Rollback

Single branch `feat/ui-overhaul`; each concern is its own commit. Reverting the token commit
restores the previous parchment-default identity wholesale (the light theme was never modified).

## Notes

- This revamp supersedes the 2026-06-29 "no re-theme" gate **by owner instruction**;
  `docs/design-language.md` should be updated to describe the dark-first identity in a follow-up.
- Nonexistent page from the brief: none — portfolio/heatmap/glossary all exist on current main
  (shipped by the parallel product lane); all inherit the system via tokens.
