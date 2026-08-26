---
name: goldticker-browser-qa
description: >-
  Use when auditing, testing, reviewing, or changing GoldTickerLive browser-facing behavior. Covers
  price/freshness honesty, reference-vs-retail terminology, EN/AR semantic parity, RTL/mobile
  behavior, navigation, console errors, accessibility, and SEO-visible regressions.
---

# GoldTickerLive browser QA

Use this skill only inside `vctb12/GoldTickerLive` or when explicitly reviewing the production site.

## Mandatory context

1. Read repository `AGENTS.md` first.
2. Read `PLAN.md` before proposing non-trivial work.
3. Treat repository pricing/freshness terminology and production-critical file rules as
   authoritative.
4. Do not modify production-critical pricing/workflow files during an audit unless the owner
   explicitly requests that scope.

## Preferred browser tool

- Prefer the project's existing deterministic Playwright tests for repeatable regression coverage.
- Use Playwright MCP/CLI for exploratory browser inspection, reproduction, console inspection, and
  flow verification.
- Browser findings are evidence; they do not override source-of-truth pricing/data rules.

## Audit order

1. Price accuracy presentation and karat-math symptoms.
2. Freshness labels and source/timestamp visibility.
3. Reference-price versus retail-quote wording.
4. EN/AR semantic parity.
5. RTL and 360px mobile behavior.
6. Console/runtime errors and failed requests.
7. Navigation, internal links, country/city routes, and broken states.
8. Canonical/hreflang/schema/meta regressions visible from rendered pages.
9. Accessibility basics: keyboard reachability, labels, dialogs, reduced motion, obvious
   contrast/overflow defects.
10. Cosmetic issues last.

## Required surfaces for a broad audit

At minimum inspect `/`, `/tracker.html`, `/calculator.html`, `/portfolio.html`, `/shops.html`, one
English country page, the corresponding Arabic page, and one 360px RTL/mobile pass.

If a task only touches one feature, keep the audit bounded to that feature plus directly dependent
surfaces.

## Finding contract

Every confirmed finding must include severity (`block` / `high` / `medium` / `low`), exact page and
code path when known, observation, impact, exact implementation direction, proof, and whether it
already appears in `PLAN.md` or an open PR.

Do not report guesses as defects. Mark uncertain observations as `NEEDS VERIFICATION`.

## Change workflow

When asked to fix findings: reproduce first; make the smallest correct diff; preserve translation
centralization and safe-DOM rules; add/update tests where testable; run relevant checks and the
repository gate required by `AGENTS.md`; use a PR and never push directly to `main`.

## Do not

- Do not call cached/hourly data `live` unless it satisfies the repository contract.
- Do not hide methodology, freshness, or reference-vs-retail disclosures for visual cleanliness.
- Do not create thin SEO pages simply to increase page count.
- Do not invent Arabic copy independently from English intent.
- Do not use browser screenshots alone to infer numerical correctness when code/source evidence is
  available.
