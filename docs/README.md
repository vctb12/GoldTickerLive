# Gold-Prices docs index

This directory holds **one master plan** plus a small set of reference docs.

> 🛑 **All planning, status tracking, roadmaps, task backlogs, audits, and
> decision logs live in [`REVAMP_PLAN.md`](./REVAMP_PLAN.md).** If you are
> looking for "what are we building next", "what is the status", or "what have
> we decided", open that file first. Every other planning-style doc in this
> directory is now a thin pointer into the relevant section of the master plan.

---

## Master plan (start here)

| File                                           | Role                                                     |
| ---------------------------------------------- | -------------------------------------------------------- |
| [`REVAMP_PLAN.md`](./REVAMP_PLAN.md)           | **Single source of truth.** All planning & tracking.    |

## Reference docs (stable knowledge base)

These are referenced from the master plan but have their own lifecycle.

| File                                                                 | Role                                                                  |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)                               | System / data-flow overview                                           |
| [`DESIGN_TOKENS.md`](./DESIGN_TOKENS.md)                             | Canonical CSS custom-property catalog                                 |
| [`ACCESSIBILITY.md`](./ACCESSIBILITY.md)                             | WCAG 2.1 AA patterns used in the codebase                             |
| [`PERFORMANCE.md`](./PERFORMANCE.md)                                 | Perf budgets, critical-CSS strategy, image/font rules                 |
| [`SEO_STRATEGY.md`](./SEO_STRATEGY.md)                               | Long-form SEO strategy                                                |
| [`SEO_CHECKLIST.md`](./SEO_CHECKLIST.md)                             | Per-release SEO checklist                                             |
| [`SEO_SITEMAP_GUIDE.md`](./SEO_SITEMAP_GUIDE.md)                     | Sitemap authoring guide                                               |
| [`DEPENDENCIES.md`](./DEPENDENCIES.md)                               | Runtime + devDep version matrix                                       |
| [`FILES_GUIDE.md`](./FILES_GUIDE.md)                                 | Repository file tour                                                  |
| [`EDIT_GUIDE.md`](./EDIT_GUIDE.md)                                   | How to add a country / city / shop / page                             |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md)                               | Branching, PR discipline, conventions                                 |
| [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md)                                 | Admin panel usage                                                     |
| [`ADMIN_SETUP.md`](./ADMIN_SETUP.md)                                 | Admin Supabase setup                                                  |
| [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)                           | Supabase project setup                                                |
| [`SUPABASE_SCHEMA.md`](./SUPABASE_SCHEMA.md)                         | Database schema reference                                             |
| [`AUTOMATIONS.md`](./AUTOMATIONS.md)                                 | GitHub Actions & scheduled bots                                       |
| [`TWITTER_AUTOMATION.md`](./TWITTER_AUTOMATION.md)                   | Social-posting architecture                                           |
| [`twitter_bot_architecture.md`](./twitter_bot_architecture.md)       | Twitter bot runtime architecture                                      |
| [`twitter_bot_schema.md`](./twitter_bot_schema.md)                   | Twitter bot DB schema                                                 |
| [`twitter_bot_secrets.md`](./twitter_bot_secrets.md)                 | Twitter bot secrets inventory                                         |
| [`MANUAL_INPUTS.md`](./MANUAL_INPUTS.md)                             | Human inputs required per release                                     |
| [`TEARDOWN.md`](./TEARDOWN.md)                                       | Full-site teardown / decommission playbook                            |
| [`environment-variables.md`](./environment-variables.md)             | Env-var inventory (server + CI + workflows)                           |
| [`performance-baseline.json`](./performance-baseline.json)           | Perf baseline snapshot                                                |
| [`replit.md`](./replit.md)                                           | Replit setup (legacy)                                                 |
| [`ERROR_REPORT.md`](./ERROR_REPORT.md)                               | Known-error inventory (historical)                                    |
| [`LIMITATIONS.md`](./LIMITATIONS.md)                                 | Current technical limitations                                         |
| [`CLAUDE.md`](./CLAUDE.md)                                           | Claude / agent operating rules for this repo                          |
| [`CHANGELOG.md`](./CHANGELOG.md)                                     | Changelog                                                             |

## Pointers (consolidated into the master plan)

These files used to host their own planning content. Each now points at the
section in [`REVAMP_PLAN.md`](./REVAMP_PLAN.md) that owns it.

| File                                                               | Consolidated into                                                     |
| ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| [`product/PRD.md`](./product/PRD.md)                               | `REVAMP_PLAN.md` §0 Product context                                  |
| [`product/PHASE0_GUARDRAILS.md`](./product/PHASE0_GUARDRAILS.md)   | `REVAMP_PLAN.md` §0.1 Trust guardrails                               |
| [`product/TRUST_SNIPPETS.md`](./product/TRUST_SNIPPETS.md)         | `REVAMP_PLAN.md` §0.2 Reusable trust copy                            |
| [`product/DECISIONS.md`](./product/DECISIONS.md)                   | `REVAMP_PLAN.md` §19 Decisions log                                   |
| [`product/MEMORY.md`](./product/MEMORY.md)                         | `REVAMP_PLAN.md` §20 Project memory                                  |
| [`product/PLANNING.md`](./product/PLANNING.md)                     | `REVAMP_PLAN.md` §3 Status at a glance                               |
| [`product/TASKS.md`](./product/TASKS.md)                           | `REVAMP_PLAN.md` §28 Task backlog                                    |
| [`product/VERIFICATION.md`](./product/VERIFICATION.md)             | `REVAMP_PLAN.md` §13 Track J — Final QA                              |
| [`product/ROLLOUT_GOVERNANCE.md`](./product/ROLLOUT_GOVERNANCE.md) | `REVAMP_PLAN.md` §21 Rollout governance                              |
| [`REVAMP_STATUS.md`](./REVAMP_STATUS.md)                           | `REVAMP_PLAN.md` §22 Production-revamp tracks                        |
| [`REVAMP_EXECUTION_SUMMARY.md`](./REVAMP_EXECUTION_SUMMARY.md)     | `REVAMP_PLAN.md` §23 Historical execution summary                    |
| [`ROADMAP_IMPLEMENTATION.md`](./ROADMAP_IMPLEMENTATION.md)         | `REVAMP_PLAN.md` §24 Product roadmap                                 |
| [`issues-found.md`](./issues-found.md)                             | `REVAMP_PLAN.md` §25 Known issues / risks / open items               |
| [`risks.md`](./risks.md)                                           | `REVAMP_PLAN.md` §25 Known issues / risks / open items               |
| [`pr-audit.md`](./pr-audit.md)                                     | `REVAMP_PLAN.md` §25 Known issues / risks / open items               |
| [`codebase-audit.md`](./codebase-audit.md)                         | `REVAMP_PLAN.md` §26 Codebase architecture snapshot                  |
| [`execution-log.md`](./execution-log.md)                           | `REVAMP_PLAN.md` §27 Historical execution log                        |
| [`PR_REVIEW_REQUEST.md`](./PR_REVIEW_REQUEST.md)                   | _Historical one-off request — retained for archaeology only._        |

---

## Conventions

- **Pointer files** are intentionally short. Edit the master plan instead.
- **Reference files** are free to grow but should not host planning content.
- **Every `report_progress` on the revamp branch** must edit `REVAMP_PLAN.md`
  in the same commit. See `REVAMP_PLAN.md` §18 Update protocol.
