# Gold-Prices

## Mission
Gold-Prices is a trust-first gold price platform for UAE, GCC, Arab markets, and related search intent.
The product must feel like one coherent system, not a pile of disconnected pages.

Core priorities:
1. Trust and clarity
2. Mobile usability
3. Clean user journeys
4. Accurate, explicit data handling
5. SEO and internal linking quality
6. Lightweight, maintainable code

## Product principles
- Do not invent prices, shops, claims, freshness, history, or coverage.
- Do not present estimated or derived values as raw facts.
- If something is uncertain, say it clearly in the UI or in planning.
- Prefer user trust over flashy presentation.
- Prefer connected journeys over isolated pages.
- Prefer strong structure over feature sprawl.

## Current product focus
Highest page-level priority:
- shops

Highest system-level priorities:
- homepage → tracker → calculator → shops → country/city/market journey
- trust messaging
- mobile usability
- internal linking
- SEO consistency
- page/system cohesion

## Branch and source-of-truth rules
- Treat `main` as the source of truth unless clearly verified otherwise.
- Do not plan or implement from stale, detached, or unclear branch context.
- Before serious work, verify:
  - current branch
  - git status
  - whether local `main` exists
  - whether `origin` exists
  - whether `origin/main` exists
  - whether the branch can be safely compared with `main`
- If source-of-truth cannot be verified safely, stop and report:
  1. blocker
  2. exact reason
  3. smallest safe corrective step

## Repo inspection rules
Before planning or implementation:
- read `AGENTS.md` if present
- read `CLAUDE.md` if present
- inspect package/build/deploy files
- inspect repo structure before making assumptions
- inspect the live site as far as the environment allows
- if live verification is partial, say so clearly

Do not claim features are present unless verified from repo or live evidence.

## Planning rules
Start in plan mode for new or risky work.
Do not jump into code for large audits or revamps.
Do not give shallow checklists.
Be practical and product-minded.

When planning:
- identify what is already true
- identify what is not true yet
- separate verified facts from assumptions
- separate quick wins from medium and large revamps
- call out high-risk changes
- say when a page needs restructuring instead of patching

## Execution rules
Keep changes narrow and conflict-resistant.
Prefer smaller phases over huge overlapping edits.
Do not rewrite broad sections unless clearly justified.
After edits:
- summarize exactly what changed
- explain how to test it
- note any follow-up risk

## UX rules
- Prioritize readability over ornament
- Prioritize mobile-first layouts
- Avoid fake completeness
- Avoid misleading stats or weak trust language
- Avoid pages that feel like filler
- Make CTAs specific and useful
- Make cross-page navigation intentional

## Data rules
- Mark estimated, delayed, cached, derived, or manually curated data clearly
- Keep methodology consistent with implementation
- Keep trust claims aligned with actual repo/live behavior
- Separate verified shops from broad market-area content when needed

## Technical rules
- Keep the stack lightweight
- Avoid heavy dependencies unless clearly justified
- Preserve accessibility, metadata, canonical logic, and performance
- Prefer maintainable structure over cleverness
- Preserve static-first direction unless there is a strong reason to change it

## Shops-specific rules
The shops page is not just a list.
Treat it like a directory/discovery product.

Inspect and improve:
- first impression
- search/filter usefulness
- URL state and deep-linking
- mobile filter behavior
- trust/freshness messaging
- empty states
- internal links to country/city/market context
- action flow to calculator, rates, and related pages
- shareability and discoverability

## Output standards for audits
For major audits, include:
1. branch/source-of-truth verification
2. preflight results
3. executive summary
4. verified improvements vs weak areas
5. page-by-page/system audit
6. execution order
7. single best next chunk
8. merge-conflict reduction strategy

## What to avoid
- generic praise
- fake certainty
- broad rewrites without evidence
- planning from stale branch context
- treating partially verified claims as confirmed
- bloated “all at once” implementation plans
