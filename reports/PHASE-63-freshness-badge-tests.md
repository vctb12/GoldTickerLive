# Phase 63 — Freshness-badge metadata regression lock (shippable-now)

A regression lock on `src/lib/freshness.js` — the user-facing freshness-badge metadata layer, which
was **untested**. Immediately mergeable: test-only, no source change, no feed, no flag, no
dependency on any open PR.

## Why this (direction shift)

I've shipped 18 tested PRs (#589–#607); **none are merged yet**, and Theme B/C's remaining work is
blocked on those merges + owner feeds. Rather than pile up more dormant flagged-OFF modules, I'm
shifting to **immediately-mergeable, genuinely-additive** work. This phase locks down a user-visible
module that had zero test coverage.

## What it guards

`src/lib/freshness.js` decides what the freshness **badge** shows (the "Live / Cached / Delayed / …"
pill users see) and how the "updated at" timestamp is formatted — none of it tested until now
(distinct from the already-tested age→state engine in `freshness-policy.js`):

- **`FRESHNESS_CONFIG`** — every state (`live`/`cached`/`delayed`/`estimated`/`fallback`/`closed`/
  `stale`/`unavailable`) has a tone + `freshness.badge.*` translation key; `stale`/`unavailable`
  degrade to the `fallback` tone.
- **`normalizeFreshnessState`** — known states pass through; unknown → `estimated`; a **closed
  market overrides even `live`** (truth-first).
- **`getFreshnessMeta`** — maps tone/key, defaults the source to "Gold Ticker Live", preserves an
  explicit source and `updatedAt`, and downgrades to the closed badge when the market is closed.
- **`formatUtcTimestamp`** — renders UTC in 24-hour form (never AM/PM), and returns `—` for
  empty/invalid input; still renders a real string under the Arabic locale.

## What shipped

- **`tests/freshness.test.js`** — 4 tests importing the real module.

Test-only — no source change; the module was already correct, this makes any future regression in
the badge users see **loud**. Peg / troy-oz / framing untouched.

## Verification

- `node --test tests/freshness.test.js` → 4/4 pass
- `npm test` → 1396/1396 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0

## ⚠️ Owner: 18 revamp PRs are open and unmerged

#589–#607 are all green. Reviewing/merging a batch — **especially the metals view-model stack
#601–#606** — unblocks the multi-metal orchestrator + real page wiring and reduces stack risk. Feeds
still needed: non-gold spot feeds (Theme B), crypto feed (Theme C); plus the 11 monthly gold
averages for the history backfill (#589) and the French-content review (Phase 41).
