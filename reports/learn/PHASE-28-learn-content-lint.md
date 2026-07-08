# Phase 28 — Learn hub & glossary + content lint (Track G · Green)

Audited the learn hub (`learn.html`, `src/learn-hub/*`) and glossary (`glossary.html`,
`src/pages/glossary.js`). Both are well-built — the glossary uses proper `<dl>/<dt>/<dd>` semantics
with balanced bilingual `data-lang-block` sections, and the learn hub is a clean modular renderer.
This phase ships the **content-lint tool** the phase calls for (wired into the validation gate),
fixes the recurring fallback-token nit, and registers one content-honesty finding.

## New: content-lint (`scripts/qa/content-lint.mjs`, `npm run content-lint`)

A reusable content-quality lint over the 15 authored top-level pages, catching the defects that pass
HTML/JS validation but hurt trust and polish:

- **Placeholder / TODO / lorem markers** — ERROR in visible text, WARN in comments (may await owner
  content).
- **Doubled words** ("the the").
- **Unbalanced bilingual blocks** — `data-lang-block="en"` count ≠ `="ar"` count on a page.
- **Broken same-page anchors** — real `<a href="#id">` links whose target id is missing (SVG
  `<use href="#i-…">` sprite refs are correctly excluded).
- **Empty headings** — flagged ERROR only when there is **no** runtime-population binding
  (`data-i18n` / `id` / `data-*`); the many i18n/JS-filled-on-load headings in this codebase are an
  intentional pattern and are not flagged.

`--check` fails (exit 1) on any ERROR (WARN only fails under `--strict`). **Wired into
`npm run validate`** so content regressions are caught in CI going forward. Charset-safe (operates
on a fixed in-repo page allowlist — no external input reaches `fs`).

**Result across all 15 pages: 0 errors, 1 warning** — the whole authored surface is content-clean
(no broken anchors, doubled words, unbalanced bilingual blocks, visible placeholders, or truly-empty
headings). The single WARN is the affiliate placeholder below.

## Fix — recurring fallback-token nit

`--tracking-wide` is defined as `0.025em`, but three
`letter-spacing: var(--tracking-wide, <literal>)` fallbacks carried mismatched dead literals —
`styles/pages/learn.css` (`0.08em`, `0.06em`) and `styles/pages/glossary.css` (`0.06em`). Removed
the fallbacks (same cleanup as Phases 24–27).

## Registered — content-honesty finding (owner decision)

`learn.html` renders an **Affiliate Disclosure** section — _"Some links on this page may be
affiliate links… Gold Ticker Live may earn a small commission"_ — but the `AFFILIATE_PLACEHOLDER`
comment (`learn.html:863`) was never filled, and the page has **no affiliate links** at all.
Disclosing a commercial relationship that doesn't exist is misleading. The honest resolutions are
either (a) remove the disclosure until real affiliate links are added, or (b) the owner fills the
placeholder. Because this is a **monetization decision** (and adjacent to the "$0 / don't resurrect
monetization" guardrail), it is left for the owner rather than changed unilaterally. The
content-lint now surfaces this placeholder on every run so it can't be forgotten.

## Verified well-built — no change needed

- **Glossary:** semantic `<dl>/<dt>/<dd>` term list; balanced EN/AR `data-lang-block` sections
  (RTL-correct); all 5 jump-nav anchors resolve.
- **Learn hub:** modular renderer (`content-model.js`, `article-renderer.js`, `toc-renderer.js`);
  role="img" on the article icon already fixed in Phase 19.
- No doubled words, no visible placeholders, no broken content anchors anywhere.

## Gate

`npm run build` + `npm run validate` (now including `content-lint --check`) + `npm test` (1286
pass) + `npm run lint` — all green.
