# Phase 10 — hreflang & bilingual SEO audit (Track C)

Audit of reciprocal hreflang, `x-default`, and `lang`/`dir` attributes across every indexable page.
**Result: the hreflang layer is complete and correct — no code change warranted.** The deeper
"distinct Arabic titles/URLs" problem (audit P0-1) is a separate, in-progress workstream and is
documented here, not attempted in this phase.

## Findings

Scanned all 32 tracked HTML files; 14 are indexable (have a `canonical`, not `noindex`).

| Check                                                                                 | Result                                                                                              |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Indexable pages with reciprocal `hreflang` (`en` + `ar` + `x-default`)                | **14 / 14** ✅                                                                                      |
| hreflang model                                                                        | `?lang=ar` (e.g. `…/calculator.html` ↔ `…/calculator.html?lang=ar`) — **matches in-flight PR #536** |
| Self-referencing hreflang present                                                     | ✅ (`en` and `x-default` both point to the page's own EN URL)                                       |
| `x-default` target                                                                    | ✅ the EN URL (correct default)                                                                     |
| `<html lang="en" dir="ltr">` default; AR toggle sets `lang="ar" dir="rtl"` at runtime | ✅ (RTL verified in the live audit)                                                                 |
| `404.html` / `offline.html` without hreflang                                          | ✅ **correct** — both are `noindex` with no canonical, so they must not carry hreflang              |

No missing, non-reciprocal, or mismatched hreflang was found. This is consistent with the metadata
audit in Phase 9 (canonicals self-consistent).

## Reconciliation with PR #536

PR #536 standardises hreflang alternates on the `?lang=ar` form (same canonical URL) rather than
separate `/ar/...` locs. The pages already emit exactly that form, so **Phase 10 introduces no
conflicting hreflang change** — it confirms the model #536 formalises.

## Deferred — the real Arabic-indexability limitation (audit P0-1)

The `?lang=ar` URLs serve the **same static HTML** with an English `<title>`/`<meta description>`
and `<html lang="en">`; the Arabic layer is applied by client JS. A JS-rendering crawler sees
Arabic, but the pre-render limitation (no distinct Arabic `<title>`/URL in the served HTML) is real.
Fixing it properly means **pre-rendering distinct Arabic pages** — a large static-generation change
that:

- is already **in progress** (`scripts/node/generate-ar-homepage.mjs` exists for the homepage),
- overlaps **PR #536** and the 50-phase plan's SEO phases 6–9,

so it is intentionally **out of this phase's safe green scope**. Tracked in the master tracker /
Owner-Gated & follow-up notes; not attempted here to avoid colliding with #536 and the AR-pre-render
generator.

## Verification

`npm run validate` (0), `npm test` — green. No files changed except this report.
