# Platform Upgrade — Session Bootstrap

> Paste at the start of a Cursor / Composer session when working the **Platform Upgrade Program**.
> Canonical plan:
> [`docs/plans/2026-06-09_platform-upgrade-program.md`](../docs/plans/2026-06-09_platform-upgrade-program.md)

---

## Quick start

1. Read [`AGENTS.md`](../AGENTS.md) and [`PLAN.md`](../PLAN.md).
2. Open the upgrade program plan (link above) → **Progress registry** → pick **one** ⬜ or 🟡 task.
3. Paste that task's **Session prompt** from the plan (or `@` the prompt file from §11).
4. **One task = one branch = one PR.** Do not batch phases.

---

## Fix-first status (2026-06-09)

| Task                           | Status  | PR                                                        |
| ------------------------------ | ------- | --------------------------------------------------------- |
| F1 License                     | ✅ Done | [#421](https://github.com/vctb12/GoldTickerLive/pull/421) |
| F2 Source truth (gold-api.com) | ✅ Done | [#421](https://github.com/vctb12/GoldTickerLive/pull/421) |

**Next recommended:** T0.3 secret scanning docs → then T2.1 Lighthouse budgets.

---

## Pick a phase

| Phase | Next task                | Prompt                                                            |
| ----- | ------------------------ | ----------------------------------------------------------------- |
| 0     | T0.3 Secrets             | `@.github/prompts/platform-upgrade-t03-secrets.prompt.md`         |
| 1     | T1.1 Secondary gold      | `@.github/prompts/platform-upgrade-t11-secondary-gold.prompt.md`  |
| 1     | T1.2 Historical gap-fill | `@.github/prompts/platform-upgrade-t12-historical.prompt.md`      |
| 2     | T2.1 Lighthouse gate     | `@.github/prompts/platform-upgrade-t21-lighthouse.prompt.md`      |
| 2     | T2.2 axe Playwright      | `@.github/prompts/platform-upgrade-t22-a11y-playwright.prompt.md` |
| 3     | T3.1 JSON-LD             | `@.github/prompts/platform-upgrade-t31-jsonld.prompt.md`          |
| 3     | T3.2 Sitemap gaps        | `@.github/prompts/platform-upgrade-t32-sitemap.prompt.md`         |
| —     | Unsure what to run       | `@.github/prompts/platform-upgrade-bootstrap.prompt.md`           |

---

## Non-negotiables

- Reference price ≠ retail price; freshness labels on every visible price.
- EN + AR via `src/config/translations.js`; RTL at 360px.
- Do not change `post_gold.yml`, `gold-price-fetch.yml`, `data/gold_price.json`, `sw.js`,
  `constants.js` without owner approval.
- Production gold primary: **gold-api.com** (`gold_api_com`) — not GoldPriceZ.
