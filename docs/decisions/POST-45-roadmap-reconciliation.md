# POST-45 — Roadmap Wishlist Reconciliation

_Docs-only. Closes out the continuation run (phases 31–45). It reconciles the 21-item product
roadmap (`docs/plans/2026-07-04_product-roadmap.md`) against what the continuation actually shipped,
verifies the two items the roadmap flagged for explicit sign-off (gold-api multi-metal readiness;
ai-drafts stays template-only), and lists the owner actions that would unblock the scaffolds already
built._

## What the continuation shipped (31–45)

Fifteen phases, each a separate PR (#568–#582), all gated green (`build` + `validate` + `test` +
`lint`). Every phase stayed inside the hard constraints — $0-to-run, no new recurring costs, no
owner-gated files touched, trust framing preserved.

| Theme                  | Phases | PRs       | Shipped                                                             |
| ---------------------- | ------ | --------- | ------------------------------------------------------------------- |
| Heatmap lens           | 31     | #568      | Spot/retail lens toggle                                             |
| Metals expansion       | 32–35  | #569–#572 | Metals data layer + silver on tracker/calc; silver + Pt/Pd SEO docs |
| Crypto correlation     | 36–37  | #573–#574 | Crypto history plumbing + descriptive correlation model (pilot OFF) |
| i18n / languages       | 38–41  | #575–#578 | Locale scaffold; French + Urdu pilots; content-translation policy   |
| PWA / AI / white-label | 42–44  | #579–#581 | PWA hardening; descriptive market-analysis; white-label spike       |
| Decision brief         | 45     | #582      | White-label / AI / React Native recommendations                     |

## Roadmap reconciliation (21 items)

| #   | Roadmap item                        | Status after continuation                                                            |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Multi-source price cross-validation | **Owner-gated** — `gold-price-fetch.yml`. Cross-validation flagged in 30-Revamp #8.  |
| 2   | Silver/Platinum/Palladium expansion | **Data layer + UI/SEO scaffold shipped** (32–35). Live data owner-gated (see below). |
| 3   | Premium tier (ad-free)              | **Owner-gated** — billing + Supabase RLS. Not built.                                 |
| 4   | Email newsletter automation         | **Skipped** — removed by owner; not built.                                           |
| 5   | Instagram + LinkedIn automation     | **Owner-gated** — app approvals + new workflows.                                     |
| 6   | Portfolio tracker                   | **Done** (shipped earlier).                                                          |
| 7   | Interactive world heatmap           | **Done**; Phase 31 added the spot/retail lens.                                       |
| 8   | Crypto–gold correlation tracker     | **Plumbing + model shipped** (36–37), pilot OFF. Live crypto feed owner-gated.       |
| 9   | WhatsApp Business API alerts        | **Skipped** — parked by owner ($0 rule).                                             |
| 10  | Google Sheets `=GOLDPRICE()`        | **Owner-gated** — real add-on needs backend. Interim docs exist.                     |
| 11  | Web Push notifications              | **Owner-gated** — `sw.js`. VAPID itself is $0.                                       |
| 12  | Multi-language FR/UR/HI             | **FR + UR pilots shipped** (38–41). **HI not started.** Content pending review.      |
| 13  | Premium developer API               | **Owner-gated** — backend + billing.                                                 |
| 14  | White-label for dealers             | **Spike shipped** (44); Phase 45 recommends deferring productisation.                |
| 15  | Stripe payment for ordering         | **Skipped** — parked by owner (legal/KYC + billing).                                 |
| 16  | Mobile app (PWA / React Native)     | **PWA hardened** (42); Phase 45 recommends staying PWA, RN parked.                   |
| 17  | AI market analysis / predictions    | **Descriptive module shipped** (43); predictions **forbidden** (45). Verified below. |
| 18  | Telegram channel automation         | **Owner-gated** — new workflow + secret.                                             |
| 19  | Repo-committed daily price history  | **Owner-gated** — `gold-price-fetch.yml`.                                            |
| 20  | Public RSS + JSON price feed        | **Not started.** Client-generated parts are $0-doable — see open work.               |
| 21  | Embed widget configurator           | **Not started.** Pure frontend, $0-doable — see open work.                           |

## Verification 1 — gold-api multi-metal readiness

The metals data layer (`src/config/metals.js`, Phase 32) implements gold / silver / platinum /
palladium with `metalUsdPerGram()` **byte-identical** to the gold math (proven by test), and the
UI/SEO scaffolds (silver on tracker + calculator; silver + Pt/Pd landing specs) are ready.
gold-api.com does expose XAG/XPT/XPD, so the pricing path is $0-viable.

**What is verified ready:** the client-side data layer, pricing math, and UI/SEO plans. **What
remains owner-gated:** the _live_ multi-metal feed. Populating XAG/XPT/XPD requires editing the
price-fetch workflow (`gold-price-fetch.yml`) — an owner-gated file the continuation did not touch.
The metals pilot flags stay OFF until that data exists. **Recommendation:** owner adds the metals
feed to the workflow; the pilots then flip on with no further code change.

## Verification 2 — ai-drafts stays template-only

Confirmed on both sides of the stack:

- **Backend** `server/services/ai-drafts.js` is explicitly template-based, no-LLM,
  human-review-first, and forbids inventing causes (its own header design constraints).
- **Client** `src/analysis/market-analysis.js` (Phase 43) is pure templates with a CI guard
  (`assertDescriptiveOnly`) that fails the build on any forecast/advice/invented-cause language.
- **Policy** Phase 45 records "no LLM, no predictions — permanently", and Phase 41 keeps any
  agent-drafted content `noindex` until human review.

No change is needed to keep ai-drafts template-only; it is enforced in code and policy.

## Open $0 work not covered by the 45-phase plan

Not blockers — future frontend-only, $0 candidates the roadmap still lists:

- **Roadmap 20** — Public RSS + JSON price feed (client-generated parts).
- **Roadmap 21** — Embed widget configurator (pure frontend; complements the white-label spike).
- **Roadmap 12** — Hindi (HI) locale pilot (the FR/UR scaffolding generalises to it directly).

## Outstanding owner actions (unblock shipped scaffolds)

1. Add XAG/XPT/XPD to the price-fetch workflow → activates the metals pilots (Phases 32–35).
2. Add a crypto price feed (`data/crypto/*.json`) → activates the correlation view (Phases 36–37).
3. Human-review the first French content batch → makes it indexable (Phase 41).
4. Decide white-label / premium / API / native items still marked owner-gated in the table above.

Everything the continuation could deliver at $0 without crossing an owner-gated boundary has been
delivered as tested, honest scaffolding; the remaining items are owner decisions or owner-gated
edits, each documented with the exact unblock step.
