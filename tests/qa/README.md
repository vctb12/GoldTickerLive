# Tracker QA evidence harness

`tests/qa/qa-harness.mjs` is the canonical **"prove no regression"** tool for the
[Tracker 50-phase revamp](../../docs/plans/2026-06-26_tracker-html-50-phase-revamp.md). Every later
phase runs it before and after a change and diffs the report + screenshots. It is the evidence tool
— _"evidence or it didn't happen."_

## Why it exists (the bug it fixes)

The earlier ad-hoc harness hung because Playwright was told to `waitUntil: 'networkidle'`. The
tracker polls the price source every **90 s**, so the network **never goes idle** and the wait never
resolves. It also printed its JSON metrics to stdout, where the numbers were lost.

This harness is reliable instead:

1. **No `networkidle`.** It uses `waitUntil: 'domcontentloaded'`, then
   `waitForSelector('#tp-hero-readout')` (the live reference-price element), then a short fixed
   settle (`~1500 ms`, env `QA_SETTLE_MS`) for hydration / first price.
2. **Pinned Chromium.** Playwright 1.61 wants browser build 1228; the image ships 1194. The harness
   points `executablePath` at the existing binary (`/opt/pw-browsers/chromium-1194/...`, env
   `QA_CHROMIUM_BIN`) and **never** runs `playwright install`.
3. **Report goes to a file.** Metrics are written with `fs.writeFileSync` to `tests/qa/report.json`,
   not stdout.
4. **Self-serving.** The repo root is served on `:8080` (same contract as `playwright.config.js` and
   `scripts/qa/leaked-key-scan.mjs`). If `:8080` is already up it is reused; otherwise the harness
   starts `python3 -m http.server 8080` and tears it down on exit.

## What it captures

Per **page × lang × viewport** (default: `tracker` × `en/ar` × `390/1366`):

| Field                    | Meaning                                                                         |
| ------------------------ | ------------------------------------------------------------------------------- |
| screenshot               | **full-page** PNG → `tests/qa/baseline/<label>-<page>-<lang>-<vp>.png`          |
| `consoleErrors`          | `console.error` + page errors, with GA/GTM/Clarity/`ERR_ABORTED` noise filtered |
| `networkErrors`          | failed requests, same noise filter                                              |
| `leakedKeys`             | raw i18n keys in body text (`namespace.key.key` / `UPPER.CASE.DOT`)             |
| `h1count`, `h1`          | `<h1>` count + text (SEO structure)                                             |
| `overflowPx`, `overflow` | RTL/overflow check: `documentElement.scrollWidth > innerWidth + 2`              |

The run also prints a one-line summary and exits **non-zero** if any console error, network error,
or leaked key was found — so a later session (or CI) can gate on a clean report.

## Run it

```bash
# default: tracker baseline, EN+AR @ 390/1366 → tests/qa/report.json + tests/qa/baseline/
node tests/qa/qa-harness.mjs

# label a run (e.g. after a phase) so artifacts don't overwrite the baseline
node tests/qa/qa-harness.mjs --label after-phase7 \
  --out /tmp/qa-after --report /tmp/qa-after/report.json

# capture more pages / override the server port or Chromium binary
node tests/qa/qa-harness.mjs --pages tracker,home
QA_PORT=8080 QA_CHROMIUM_BIN=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  node tests/qa/qa-harness.mjs
```

It is a standalone script: it is **not** picked up by `npm test` (`node --test tests/*.test.js`,
non-recursive) nor by Playwright (`testDir: ./tests/e2e`).

## Committed baseline (2026-06-27)

`report.json` + `baseline/*.png` are the captured starting state for the revamp.

- **4 views** (tracker EN/AR × 390/1366) · **0 leaked keys** · **0 network errors (filtered)** · **0
  RTL overflow** · h1 = 1 per view (`Gold Command Center` / `مركز قيادة الذهب`).
- **4 console errors** — all `net::ERR_CONNECTION_CLOSED`. These are **environmental, not a tracker
  defect**: this sandbox has no outbound access to the live gold-price source, so the price fetch
  fails and the tracker correctly degrades to a non-live freshness state (freshness honesty intact).
  In an environment with network access these disappear, and any **new** console error a later phase
  introduces stands out against this baseline.

## Relationship to the other QA tools

- `scripts/qa/leaked-key-scan.mjs` (`npm run i18n:leaked-scan`) — the wired, CI-style leaked-key
  gate across 6 pages. This harness reuses the same detection regex so the two agree; it adds
  screenshots, overflow, h1, console/network capture for the tracker specifically.
- `tests/e2e/*.spec.js` (`npm run test:playwright`) — the assertion-based Playwright suite. This
  harness is for **evidence capture / diffing**, not pass/fail assertions.
