# Product Roadmap — Near / Medium / Long Term

```yaml
plan-status: in-progress
priority: P1
class: roadmap
owner: @vctb12
created: 2026-07-04
updated: 2026-07-04 (owner revision r2 — cost discipline + free-first additions)
requested-by: owner (session 2026-07-04, design-consolidation)
discipline: one item = its own plan file + PR sequence; nothing here ships without its phase gate
```

## Owner revision r2 (2026-07-04) — cost discipline

Standing rule from the owner: **automation and integrations must be $0 to run** (no per-API or
per-message fees like X's paid tiers). Applied below:

- ❌ **Removed — Email newsletter automation** (item 4). Owner does not want it.
- ❌ **Parked — WhatsApp Business API alerts** (item 9). The WhatsApp Cloud API charges per
  business-initiated template message (utility/marketing templates are metered per send) — a price
  alert is business-initiated by definition, so this cannot be run for free. Violates the $0 rule.
- ⏸️ **Parked (owner: "maybe later") — Stripe payment for gold ordering** (item 15).
- ⚠️ **Conditional — Instagram + LinkedIn automation** (item 5): only proceeds because the Meta
  Graph API (Instagram) and the LinkedIn Posts API have **no per-post fees** — the cost is app
  review + account setup, not money. If either platform moves posting behind a paid tier, this item
  parks itself automatically under the $0 rule.
- ✅ **Kept — Web Push** (item 11): the Web Push protocol (VAPID) is free; a $0 architecture exists
  today — subscriptions in the existing Supabase free tier, sends from a scheduled GitHub Action (or
  a Cloudflare Worker free tier). No paid API anywhere in the path.
- ➕ **Added — free-first items 18–21** (see "Near-term additions" below): Telegram channel
  automation (Bot API is genuinely free, unlike X), repo-committed daily price history (real
  multi-year charts for every visitor, not per-browser localStorage), a public RSS/JSON price feed
  (a free alert channel any reader/automation can consume), and the embed-widget configurator
  (concrete $0 start of white-label item 14).

**Status 2026-07-04 (branch `claude/product-roadmap-implementation-4oopr4`):** the two ungated
frontend items shipped in one session — **item 6 Portfolio tracker** (`portfolio.html`,
`src/pages/portfolio.js`, pure core `src/pages/portfolio/portfolio-core.js` + 16 unit tests,
`gtl_portfolio_v1` local-only storage) and **item 7 World heatmap** (`heatmap.html`,
`src/pages/heatmap.js`, pure core `src/pages/heatmap/heatmap-core.js` + 10 unit tests, generated
inline-SVG world map `src/pages/heatmap/world-map-data.js` via `scripts/node/generate-world-map.js`,
zero new dependencies). Item 10's interim step (documented Sheets formulas against the committed
`data/gold_price.json`) landed in `docs/API_PRODUCT.md` § Google Sheets. Everything else below
remains gated as annotated.

Owner-supplied roadmap, mapped against what already exists in this repo so each item starts from its
real baseline instead of from scratch. Items marked **OWNER-GATED** touch production-critical
surfaces (`post_gold.yml`, `gold-price-fetch.yml`, billing, Supabase RLS, `sw.js`) or need
secrets/budget decisions, per `AGENTS.md` operational guardrails.

Recurring blocker to know about: **production is static GitHub Pages with
`API_BACKEND_ENABLED: false`** — every item needing a live server API (WhatsApp, Web Push, Sheets
plugin, premium API) is blocked on the owner deciding to run the Express/Supabase backend in
production first.

## Near-term

| #   | Item                                                                 | Existing assets (start here)                                                                                                                                                                                                                                                                                            | Next concrete step                                                                                                                                                                                                                                                                              | Gates                                                                  |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | Multi-source price aggregation (Kitco + London Fix cross-validation) | Python provider chain `gold_api_com → twelvedata_xauusd → fmp_gcusd` in `gold-price-fetch.yml`; provider bakeoff docs (`docs/gold-price-provider-bakeoff.md`); **T1.1 secondary-gold cross-validation is already a planned task** with a ready prompt (`.github/prompts/platform-upgrade-t11-secondary-gold.prompt.md`) | Execute T1.1 as specced (adds a second independent source + divergence guard). Kitco has no free official API — treat "Kitco" as _a second independent source_, chosen via the bakeoff method                                                                                                   | **OWNER-GATED** (`gold-price-fetch.yml` is production-critical)        |
| 2   | Silver / Platinum / Palladium expansion                              | Nothing metal-specific; the provider bakeoff + freshness contract + tracker architecture generalise                                                                                                                                                                                                                     | **$0 path first:** the current primary provider (gold-api.com) also serves XAG/XPT/XPD for free — try it before any paid bakeoff. Separate `data/<metal>_price.json` files + fetch steps → tracker metal switcher. Keep gold's freshness contract identical per metal                           | Workflow edits **OWNER-GATED**; $0-API rule                            |
| 3   | Premium tier (ad-free)                                               | `pricing.html` (Stripe-backed), `docs/BILLING_AND_ENTITLEMENTS.md`, `src/components/adSlot.js`                                                                                                                                                                                                                          | Wire entitlement check into `adSlot.js`; but billing fail-closed + Supabase RLS lockdown are **staged RED-zone items** (`OWNER_REVIEW.md`) awaiting the two owner answers (signups enabled? what writes `public.orders`?)                                                                       | **OWNER-GATED** (RED zone)                                             |
| 4   | ❌ **REMOVED (owner r2)** — Email newsletter automation              | `docs/NEWSLETTER_AND_LEADS.md`, `scripts/node/generate-newsletter.js`, `admin/newsletter/` remain in the tree for a future revisit                                                                                                                                                                                      | None — owner explicitly does not want this. Do not build.                                                                                                                                                                                                                                       | —                                                                      |
| 5   | ⚠️ Instagram + LinkedIn post automation (**$0-API rule applies**)    | The whole X pipeline is a template: `post_gold.yml`, duplicate/staleness guards, `docs/X_AUTOMATION_OBSERVABILITY.md`, dry-run discipline                                                                                                                                                                               | Proceeds only because Meta Graph (Instagram) + LinkedIn Posts APIs have no per-post fees — cost is app review/account setup. Clone the pipeline per network; image cards reuse the OG approach; dry-run gate like X. Parks itself if either API becomes paid                                    | App approvals (owner); new workflows **OWNER-GATED**; $0-API rule      |
| 6   | ✅ **SHIPPED 2026-07-04** — Portfolio tracker (holdings over time)   | Alert engine + localStorage persistence patterns (`gtl_alerts_v2`), daily snapshots (`gtl_history`), calculator value logic, `docs/PUBLIC_ACCOUNTS_AND_SAVED_TOOLS.md`                                                                                                                                                  | Shipped local-first at `portfolio.html`: `gtl_portfolio_v1` holdings (weight/karat/date/cost), reference valuation with fixed AED peg, gain only against a complete same-currency cost basis, value-over-time from daily snapshots, CSV/JSON export + restore. Account sync remains future work | Trust framing baked in (reference ≠ resale; making charges called out) |

### Near-term additions (owner r2 — all $0 to run)

| #   | Item                               | Why it is feasible and rational                                                                                                                                                                                                                                             | Next concrete step                                                                                                                                              | Gates                                                        |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 18  | Telegram channel automation        | The Telegram Bot API is **actually free** (no tiers, no per-message fees) — everything the X pipeline does, at $0, and Telegram is huge in the GCC/Arab audience. The entire `post_gold.yml` discipline (duplicate guard, staleness guard, dry-run) transfers 1:1           | Create bot + channel (owner, 5 min), add `TELEGRAM_BOT_TOKEN` secret, clone the poster script with a `sendMessage` call; dry-run gate first                     | Owner creates bot/channel + secret; new workflow OWNER-GATED |
| 19  | Repo-committed daily price history | Today "history" lives in each visitor's localStorage — new visitors see nothing. The hourly fetch workflow already commits `data/gold_price.json`; appending one daily row to a committed `data/history/daily.json` gives **every** visitor real multi-year charts for free | Add an append step to the existing fetch workflow + a backfill from `src/data/historical-baseline.json`; charts and portfolio timelines read the committed file | `gold-price-fetch.yml` edit is **OWNER-GATED**               |
| 20  | Public RSS + JSON price feed       | A free alert channel with zero infrastructure: a static `feed.xml`/`feed.json` regenerated by the hourly workflow. Any RSS reader, Slack/Discord webhook or IFTTT can consume it — replaces the parked WhatsApp alerts at $0                                                | Generate feed files in the fetch workflow; link them from the tracker page; document in `docs/API_PRODUCT.md`                                                   | Same workflow gate as item 19                                |
| 21  | Embed widget configurator          | Concrete $0 start of white-label (item 14): a small UI on the developer-facing page that outputs a copy-paste `<iframe>`/script snippet with color/karat/currency params for the existing embed widget                                                                      | Pure frontend page section; params read by the widget at load                                                                                                   | None                                                         |

## Medium-term

| #   | Item                                                                   | Existing assets                                                                                                                               | Next concrete step                                                                                                                                                                                                                                                                   | Gates                                                  |
| --- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 7   | ✅ **SHIPPED 2026-07-04** — Interactive world heatmap                  | `compare-core.js` computes per-country all-in retail estimates; `src/config/countries.js` (26 countries); Leaflet already lazy-loads on shops | Shipped at `heatmap.html`: generated inline-SVG world map (Natural Earth 110m, no new dependency), 5-bucket validated gold ramp per theme, karat switcher, hash deep links, keyboard-operable countries + jump select + full table fallback, EN/AR                                   | a11y + RTL verified in-session (screenshots in PR)     |
| 8   | Crypto–gold correlation tracker                                        | Historical gold layers (`historical-data.js`); nothing crypto                                                                                 | Needs a crypto price source (bakeoff method) + clear "correlation ≠ causation/advice" framing per content standards                                                                                                                                                                  | Data-source cost; trust-language review                |
| 9   | ❌ **PARKED (owner r2, $0 rule)** — WhatsApp Business API price alerts | Alert engine (BUILD 10) + WhatsApp share links (`--brand-whatsapp` tokens) stay as-is                                                         | Cloud API meters business-initiated template messages (a price alert is exactly that) → cannot run at $0. Free substitute shipped instead: Telegram automation (item 18) + RSS/JSON feed (item 20) + Web Push (item 11)                                                              | —                                                      |
| 10  | Google Sheets plugin `=GOLDPRICE()`                                    | `developer.html`, `docs/API_PRODUCT.md`, server API routes (disabled in prod)                                                                 | Apps Script add-on hitting the public API; ✅ **interim step shipped 2026-07-04**: `docs/API_PRODUCT.md` § Google Sheets documents a `GOLDPRICE()` Apps Script function + formula against the committed `data/gold_price.json` (hourly-updated reference, freshness fields included) | **BLOCKED on backend enablement** for the real product |
| 11  | Web Push notifications (**$0 path confirmed**)                         | PWA complete (sw.js v19, manifest, offline); alert engine defines trigger semantics; Supabase free tier already in the stack                  | VAPID is free. $0 architecture: subscription store in existing Supabase free tier, sends from a scheduled GitHub Action (or Cloudflare Worker free tier) — no paid API anywhere. `sw.js` edits **OWNER-GATED**                                                                       | `sw.js` edits **OWNER-GATED**; no budget gate          |
| 12  | Multi-language: French, Urdu, Hindi                                    | `src/config/translations.js` architecture (EN/AR, CI-enforced key parity), RTL machinery (Urdu is RTL), i18n guard tests                      | Pilot ONE language on the 5 flagship surfaces first; extend parity gates to N languages before content translation. Real linguist review required — semantic-parity rule extends to every new language                                                                               | Translation budget (owner); large sustained effort     |

## Long-term

| #   | Item                                                                  | Existing assets                                                                                           | Notes                                                                                                                                                                                  | Gates                                                |
| --- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 13  | Premium developer API (rate-limited free tier)                        | `docs/API_PRODUCT.md`, `developer.html`, Express routes + key hashing + billing scaffolding already coded | Whole product exists in the repo, dormant behind `API_BACKEND_ENABLED: false`                                                                                                          | **BLOCKED on backend enablement** + billing RED zone |
| 14  | White-label for gold dealers                                          | `content/embed/gold-ticker.html` widget; tokenized theming (`tokens.css`) makes skinning cheap            | Start as "embed configurator" (params for colors/karats) before a real white-label program                                                                                             | Licensing/commercial terms (owner)                   |
| 15  | ⏸️ **PARKED (owner r2: "maybe later")** — Stripe payment for ordering | `content/order-gold/`, Stripe scaffolding, `docs/BILLING_AND_ENTITLEMENTS.md` stay in git history         | Revisit only on explicit owner ask; selling physical gold still needs KYC/AML + legal review first                                                                                     | **OWNER-GATED** (legal + RED zone)                   |
| 16  | Mobile app (PWA or React Native)                                      | **PWA already shipped** (installable, offline, precache). React Native would be a second codebase         | Recommendation: invest in the PWA (push, better install prompts) — a native rewrite contradicts the static-first guardrail unless the owner explicitly wants it                        | Owner decision                                       |
| 17  | AI market analysis / predictions                                      | Insights feed architecture, `docs/AI_CONTENT_AUTOMATION.md`                                               | Content standards forbid fake precision and implied financial advice — frame as "context summaries," never price predictions with certainty. Human review gate on every published item | Trust/content review gate (hard requirement)         |

## Suggested sequencing (first five PRs)

1. ~~Portfolio tracker local-first MVP (item 6)~~ — ✅ shipped 2026-07-04 (PR #494).
2. ~~SVG heatmap on compare data (item 7)~~ — ✅ shipped 2026-07-04 (PR #494).
3. **T1.1 secondary gold cross-validation** (item 1) — already specced, highest trust value.
4. **Telegram channel automation** (item 18) — free X twin; owner creates the bot + secret.
5. **Repo-committed daily history + RSS/JSON feed** (items 19 + 20) — one workflow PR, unlocks real
   charts for everyone.
6. **Embed widget configurator** (item 21) — pure frontend, no gates.
7. **Owner decision meeting**: backend-in-production + billing RED-zone answers — unblocks items 3,
   10, 11 (store), 13 in one sitting.

Removed/parked by owner revision r2: newsletter (4), WhatsApp alerts (9), Stripe ordering (15).
