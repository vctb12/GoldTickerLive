---
applyTo: "**/*.html,src/**/*.js,scripts/**/*.js,styles/**/*.css,assets/**"
---

# Frontend / Mobile Instructions

Gold Ticker Live's identity is a **premium dark/gold financial dashboard**, mobile-first,
bilingual EN/AR, accessible by default. Every UI change is reviewed against this identity.

## 1. Design system source of truth

- Tokens: `styles/global.css` — `--color-*`, `--surface-*`, `--text-*`, `--space-*`, `--radius-*`,
  `--shadow-*`, `--ease-*`, `--duration-*`. **Don't hand-pick hex or raw rem when a token exists.**
- Per-page CSS: `styles/pages/*.css` — local overrides, never global mutations.
- Page entry HTML: top-level `*.html` files; partials are inlined (static MPA).
- Shared JS: `src/components/`, `src/lib/`, `src/pages/`, `src/config/`.

If you find yourself adding a 7th `.card` variant or a 4th button colour, **stop** — consolidate
into a token + variant first.

## 2. Mobile-first rules

- Build for 360px wide, scale up. Test 360/390/430/768/1024+.
- Touch targets ≥ 44×44 px. Don't pack two below 44px in one row.
- One-hand reach: primary actions stay in the lower 2/3 of the viewport.
- Sticky tracker controls (currency, karat, unit, range) must not occlude the price card or chart.
  Combine into a single condensed bar on `<= 480px`.
- Tables become cards on small screens — never horizontal-scroll a primary data table.
- Cap modals/drawers at `min(100vh - safe-areas, 720px)` and trap focus.

## 3. Visual hierarchy

- Hero price > freshness label > karat strip > CTA > supporting copy.
- A single dominant CTA per primary card. Secondary actions are ghost / outline / link.
- White space is a tool — don't squeeze cards edge-to-edge on mobile.
- Numeric content uses tabular figures (`font-variant-numeric: tabular-nums`).

## 4. Arabic / RTL

- All strings go through `src/config/translations.js`. **Never hard-code English in markup.**
- Test every changed page at `dir="rtl"` — mirror chevrons, arrows, progress bars, badge stacks.
- Numbers: use `Intl.NumberFormat` via `src/lib/formatter.js` — Arabic-Indic digits where the
  locale calls for them.
- Don't translate brand name "Gold Ticker Live". Tagline translates.
- Watch for layout breaks where English copy is shorter than Arabic (or vice-versa) — Arabic
  often runs ~20% longer.

## 5. Motion

- All animation must respect `prefers-reduced-motion: reduce`. The global reset is in
  `styles/global.css` — don't override per-component.
- Durations: snap to `--duration-*` tokens. Easing: `--ease-*` tokens.
- No animation purely for decoration on the tracker / calculator. They are tools, not landing
  pages.

## 6. Safe DOM (non-negotiable)

- Only `src/lib/safe-dom.js` writes via `innerHTML` patterns. Everything else uses `el()`,
  `replaceChildren()`, `escape()`, `safeHref()`, `safeTel()`, `clear()`.
- `scripts/node/check-unsafe-dom.js` keeps a per-file baseline. **CI blocks growth.** When you
  remove a sink, tighten the baseline in the same PR.
- Never concatenate user input into HTML strings. Never `document.write`.

## 7. Performance budgets

- Largest Contentful Paint (mobile, 4G): < 2.5 s
- Cumulative Layout Shift: < 0.1
- Total Blocking Time: < 200 ms
- Per-page JS bundle: < 60 KB gzip (tracker/calculator allowed up to 120 KB)
- No new runtime npm dependency without a) `gh-advisory-database` check and b) size justification.

If a change risks a budget regression, run Lighthouse before/after and include numbers in the PR.

## 8. Service worker / base-path awareness

- `sw.js` lives at the site root and serves both `goldtickerlive.com/*` and the legacy
  `/Gold-Prices/*` path. Asset URLs in HTML must be **relative** or root-absolute, never
  domain-absolute, unless intentional.
- Bump cache version when shipping a visual/behavioural change to assets the SW caches.
- Cached responses for prices must always be labeled `cached` on render — see the pricing
  instructions.

## 9. Accessibility (summary — full file: `accessibility.instructions.md`)

- Semantic HTML first. ARIA only when semantics aren't enough.
- Focus rings visible. Don't `outline: none` without a replacement.
- Forms: every input has a `<label>`; errors linked via `aria-describedby`.
- Charts: provide a tabular fallback (visually hidden table is acceptable).
- Skip link to `<main>` on every page.

## 10. Page-specific notes

- **Homepage** (`index.html`): hero ticker + value prop + 3-4 entry points (Tracker, Calculator,
  Country pages, Methodology). Mobile must answer "what is this?" in the first viewport.
- **Tracker** (`tracker.html`): the flagship. Treat as a workspace — not a landing page. See the
  tracker-revamp prompt under `.github/prompts/`.
- **Calculator** (`calculator.html`): explicit about VAT + making charges. Mobile keyboard
  appropriate (`inputmode="decimal"`).
- **Shops** (`shops.html`): honest verification tier; filter chips not dropdowns on mobile.
- **Methodology** (`methodology.html`): the trust page. Link to it from every priced surface.
- **Country/city pages** (`countries/**`): unique local context. Thin duplicates fail SEO
  governance.
