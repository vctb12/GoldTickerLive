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
- Be tough on weak UX, fake completeness, unclear trust language, and disconnected pages.

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
- Do not treat `claude/gold-price-tracker-FHFL3` as source of truth.
- Before serious work, verify:
  - current branch
  - git status
  - whether local `main` exists
  - whether `origin` exists
  - whether `origin/main` exists
  - whether the current branch can be safely compared with `main`
  - whether the checkout appears connected to repo truth
- If source-of-truth cannot be safely verified, stop and report only:
  1. blocker
  2. exact reason
  3. smallest safe corrective step

## Required preflight behavior
Before planning or implementation:
1. Check whether `AGENTS.md` exists and read it first if present.
2. Check whether `CLAUDE.md` exists and read it if present.
3. Check git status.
4. Check current branch name.
5. Check whether local `main` exists.
6. Check whether `origin` exists.
7. Check whether `origin/main` exists.
8. Check whether the current branch is up to date with, ahead of, or behind `main` if possible.
9. If the environment cannot safely verify or compare against `main`, stop.

Report clearly:
- current branch
- whether `AGENTS.md` was found and read
- whether git status is clean
- whether local `main` exists
- whether `origin` exists
- whether `origin/main` exists
- whether the current session is safe to continue from
- whether correction is needed before planning or implementation

If any of the following are true, stop:
- no `origin` remote
- no local `main` and no `origin/main`
- current branch cannot be compared against `main`
- checkout is clearly stale or disconnected from repo truth

## Planning mode rules
Start in plan mode for new, large, or risky work.
Do not jump into code for audits or revamps.
Do not give shallow checklists.
Do not silently start implementing.
Do not give generic praise like “looks good overall.”
Be practical, product-minded, and grounded in current repo reality.

When planning:
- verify repo reality before trusting past claims
- separate verified facts from assumptions
- identify what is already true
- identify what is still missing
- separate quick wins from medium and large revamps
- call out high-risk changes
- say when a page needs restructuring instead of patching

## Repo inspection rules
Before serious planning:
- inspect repo structure
- inspect package/build/deploy files
- inspect key pages and shared systems
- inspect live-site behavior as far as the environment allows
- if live verification is partial, say so clearly
- do not claim a feature exists unless verified from repo or live evidence

## Whole-site audit scope
Think about the site as both:
- page-level quality
- system-level quality

At minimum inspect:
- homepage
- tracker
- shops
- calculator
- insights
- learn
- methodology
- invest
- country pages
- city pages
- market pages
- nav
- footer
- internal linking
- CTA flow
- page hierarchy
- mobile behavior
- trust messaging
- SEO/discoverability patterns
- repo structure
- build/deploy reality

## Shops-specific rules
The shops page is not just a list.
Treat it like a directory/discovery product.

Inspect and improve:
- first impression
- hero usefulness
- loading behavior
- stats behavior
- filter logic
- search usefulness
- URL state and deep-linking
- featured/popular logic
- empty states
- modal/detail behavior
- mobile filter behavior
- accessibility
- trust/freshness messaging
- CTA flow
- internal links to market/country/city pages
- discoverability, shareability, and monetization opportunities

Be especially skeptical of:
- fake directory completeness
- weak trust wording
- flat card actions
- poor stateful discovery
- filters that are present but product-weak

## Technical rules
- Keep the stack lightweight.
- Avoid heavy dependencies unless clearly justified.
- Prefer improving existing structure over broad rewrites.
- Preserve accessibility, metadata, canonical logic, and performance.
- Prefer maintainable structure over cleverness.
- Preserve static-first direction unless there is a strong reason to change it.
- Verify claims about architecture, build setup, tracker structure, and nav extraction before repeating them.

## Execution rules
Keep changes narrow and conflict-resistant.
Prefer smaller phases over huge overlapping edits.
Do not rewrite broad sections unless clearly justified.
Do not edit many unrelated files in one chunk.

After edits:
- summarize exactly what changed
- explain how to test it
- note any follow-up risk
- say whether another sync against `main` is advisable before the next chunk

## Merge-conflict avoidance rules
- Prefer a fresh task branch based on current `main` for implementation.
- Re-check branch state before any execution session.
- Keep PRs or push chunks narrow.
- Avoid large overlapping edits across many files unless necessary.
- Stop and resync if branch/source-of-truth becomes unclear.
- If `origin/main` or local `main` is missing, do not continue implementation.

## Output standards for major audits
For serious planning work, return these sections:
1. Branch / Source-of-Truth Verification
2. Preflight Check Results
3. Executive Summary
4. Earlier Plan Reconciliation
5. Verified Improvements vs Still-Weak Areas
6. Shops Page Updated Master Revamp Plan
7. Whole-Site Audit and Revamp Plan
8. Technical / Repo Review
9. Merge-Conflict Reduction Strategy
10. Recommended Execution Order
11. Do This Next
12. If/When We Switch To Implementation

## What to avoid
- generic filler
- fake certainty
- broad rewrites without evidence
- planning from stale branch context
- treating partially verified claims as confirmed
- bloated “all at once” implementation plans
- product praise that ignores weak UX or trust issues
