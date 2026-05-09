# X / Twitter automation: duplicate-post policy

X rejects update text equal to a recent post (HTTP 403, error code 187 — "Status is a duplicate").
This is enforced server-side; the bot must skip unchanged content rather than try to force it
through with random punctuation, invisible characters, or other cosmetic tricks. Doing so risks an
automation-rule violation against the account.

> Owner-only pre-merge checklist for the bakeoff + duplicate-guard PR:
> [`OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md`](./OWNER_ACTIONS_REQUIRED_GOLD_BAKEOFF.md). Before
> opening for review or merging, run the readiness gate:
> `python scripts/python/gold_bakeoff_readiness.py --strict`.

This doc describes how `scripts/python/post_gold_price.py` and `scripts/python/tweet_guard.py`
cooperate to make the bot duplicate-safe and freshness-honest.

Production posture:

- scheduled posting is **hourly**, not every 6 minutes
- manual GitHub `workflow_dispatch` is supported for GitHub UI and iPhone Shortcut triggers
- manual runs still use the cached `data/gold_price.json` source-of-truth and the same GitHub
  guardrails
- manual / Shortcut runs outside market hours switch to a labeled `market_closed_reference` post
  type instead of the live hourly template
- that closed-market reference path may use cached last-known spot/reference data only when the
  source timestamp exists and the age is within `CLOSED_MARKET_MAX_STALE_HOURS` (default 48h)
- `source=shortcut` records the latest Shortcut-triggered attempt and soft-skips another Shortcut
  attempt inside a 2-minute window unless `force_post=true`
- `force_post=true` only overrides the cooldown guard; stale and duplicate checks still apply
- long posts are logged and attempted locally; if X rejects them, the API error is surfaced in the
  workflow logs

---

## 1. Failure mode we're guarding against

The historical pattern with GoldPriceZ:

- Bot wakes every 6 minutes.
- GoldPriceZ returns the **same price + same timestamp** for 30–45 minutes.
- Old bot generated nearly-identical tweet text → X rejected with 403.
- Logs filled with duplicate-post errors and the account got noisy.

The fix is twofold:

1. **Don't poll the same provider when it's frozen** — the new orchestrator (`fetch_gold_price.py`)
   tries a chain of providers and a frozen provider's circuit eventually opens.
2. **Even when polling succeeds, only post when meaningful** — the `tweet_guard` module decides.

## 2. Decision rules (in order)

`tweet_guard.decide()` evaluates these in order and returns the first match. `should_post=False`
means the bot exits 0 with a `skip_reason`.

| #   | Skip reason                    | Trigger                                                                                                                                                                                                                   |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------- | -------- | ------------------------------------------------------------------------ |
| 1   | `stale_quote`                  | `is_fresh=false` and `ALLOW_STALE_TWEET≠true`. Fresh = `freshness_seconds ≤ MAX_GOLD_FRESHNESS_SECONDS`. Closed-market reference posts are explicitly labeled and pass `is_fresh=true` only in their narrow allowed case. |
| 2   | `cooldown_active`              | Last successful tweet was less than `MIN_TWEET_INTERVAL_MINUTES` ago (default 55) and `FORCE_POST≠true`.                                                                                                                  |
| 3   | `provider_sample_unchanged`    | Provider price **and** provider timestamp both match the last successful post. Always skipped.                                                                                                                            |
| 4   | `provider_timestamp_unchanged` | Provider timestamp equals the last successful post's, and `FORCE_SUMMARY_AFTER_MINUTES` hasn't elapsed.                                                                                                                   |
| 5   | `duplicate_text_hash`          | SHA-256 of generated tweet text equals the last posted hash. Always skipped — X would reject anyway.                                                                                                                      |
| 6   | `fallback_no_change`           | `is_fallback=true` (or `source_type` is `cache_last_known` / `spot_delayed`) AND price equals last price.                                                                                                                 |
| 7   | `price_move_below_threshold`   | `                                                                                                                                                                                                                         | move_usd | < MIN_TWEET_MOVE_USD`AND` | move_pct | < MIN_TWEET_MOVE_PCT`, and `FORCE_SUMMARY_AFTER_MINUTES` hasn't elapsed. |

Before those seven rules, `post_gold_price.py` also applies a narrow Shortcut anti-spam pre-check:
when `source=shortcut`, it records the latest Shortcut-triggered attempt and exits early if the
prior Shortcut-triggered attempt in `data/last_tweet_state.json` happened less than 2 minutes
earlier, unless `FORCE_POST=true`. Scheduled runs are not affected. When the pre-check passes and
all seven rules pass, the bot posts and updates `data/last_tweet_state.json`.

`post_gold_price.py` prints the generated post text and character count before calling the X API.
The repo no longer skips locally just because the text is longer than 280 characters. X still owns
its own eligibility rules, including Premium / verified longer-post capability, so any external
length rejection should come back from X and be logged by the workflow. Dry-run mode
(`DRY_RUN_TWEET=true`) still evaluates all guards but never posts or mutates state.

The legacy guards (`check_duplicate_guard` and the content-hash check in `post_gold_price.py`) still
run before `tweet_guard.decide()` — this layer is **additive**.

## 3. Knobs

All env vars; sensible defaults baked into the code so a missing variable behaves safely.

| Env var                       | Default | Effect                                                                                                                                                        |
| ----------------------------- | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SKIP_DUPLICATE_TWEETS`       |  `true` | Master switch for the new guard. `false` → bypass (tests only).                                                                                               |
| `ALLOW_STALE_TWEET`           | `false` | Allow posting when `is_fresh=false`. Use only for forced summaries with explicit "delayed" copy.                                                              |
| `MIN_TWEET_INTERVAL_MINUTES`  |    `55` | Cooldown between successful tweets so scheduled + manual runs do not double-post.                                                                             |
| `MIN_TWEET_MOVE_USD`          |  `1.00` | Skip below this absolute USD/oz move (when timestamp has changed).                                                                                            |
| `MIN_TWEET_MOVE_PCT`          |  `0.03` | Skip below this percentage move.                                                                                                                              |
| `FORCE_SUMMARY_AFTER_MINUTES` |    `60` | Override "no movement" suppression after N minutes since the last post (so the feed always has a recent reference).                                           |
| `FORCE_POST`                  | `false` | Override the cooldown guard only. It does **not** bypass stale or duplicate checks, and it does not change how X enforces its own external post-length rules. |
| `DRY_RUN_TWEET`               | `false` | Run the full pipeline including the guard but never call the X API. Useful for the migration sign-off.                                                        |

## 4. State file

`data/last_tweet_state.json` (schema version 1):

```json
{
  "schema_version": 1,
  "last_tweet_id": "1900000000000000000",
  "last_tweet_time_utc": "2026-05-01T10:00:00Z",
  "last_tweet_text_hash": "<sha256 hex>",
  "last_price_usd_oz": 4550.0,
  "last_provider": "twelvedata_xauusd",
  "last_provider_timestamp_utc": "2026-05-01T09:59:30Z",
  "last_source_type": "spot_reference",
  "last_post_reason": "price_moved",
  "last_trigger_source": "shortcut",
  "last_trigger_attempt_time_utc": "2026-05-01T10:01:10Z",
  "last_trigger_nonce": "ios-shortcut-run-1",
  "last_trigger_run_id": "12345678901",
  "last_trigger_run_attempt": "1"
}
```

Atomic write semantics: the file is written to `*.tmp` and renamed. Corrupt or missing files are
tolerated and treated as "no prior post."

## 5. Source-type labels (for tweet copy)

The normalized quote payload exposes a `source_type` field. Tweet templates **must** be honest about
it:

| `source_type`             | Suggested copy fragment                     |
| ------------------------- | ------------------------------------------- |
| `spot_live`               | "Spot XAU/USD"                              |
| `spot_reference`          | "Spot reference price"                      |
| `market_closed_reference` | "Last spot/reference price (market closed)" |
| `spot_delayed`            | "Delayed spot reference"                    |
| `futures_reference`       | "GCUSD futures reference (not pure spot)"   |
| `commodity_reference`     | "Commodity reference price"                 |
| `daily_fix`               | "Daily fix"                                 |
| `cache_last_known`        | "Last known price (provider cached)"        |
| `unknown`                 | "Reference price"                           |

A fallback (`is_fallback=true`) should additionally include a short "(fallback source)" disclaimer
in the tweet text.

For Gold Ticker Live's market-closed manual / Shortcut path, the copy must make all of these clear:

- the gold market is closed
- the quoted figure is the **last** spot/reference price, not a live retail price
- the source timestamp / last updated time is shown
- the data came from cached `data/gold_price.json`, not a fresh provider call in `post_gold.yml`

## 6. Why we never bypass X duplicate detection

X's automation rules treat duplicate-bypass tactics (zero-width-spaces, trailing periods,
capitalisation tweaks) as manipulation. The right answer is to **not post** when the underlying data
hasn't changed. That's the entire point of `tweet_guard.decide()`.

If you find yourself reaching for "let's just append a timestamp suffix to defeat the duplicate
check," the correct action is to ask why the upstream provider is repeating itself — that's the
bakeoff's job to surface, not the bot's job to paper over.

## 7. market_closed_reference same-price skip — behavior and operator override

### Default behavior

`post_gold_price.py`'s `check_duplicate_guard` skips posting whenever the current price equals the
previous successfully posted price. For `market_closed_reference` posts this produces a detailed
diagnostic log (not a workflow failure):

```
SKIP: market_closed_reference — same closing/reference price already posted.
  previous_price:       $4,724.10
  current_price:        $4,724.10
  previous_post_at:     2026-05-09T06:04:47Z
  minutes_since_post:   138 min ago
  selected_post_type:   market_closed_reference
  source:               shortcut
  trigger_nonce:        (none)
  refresh_price_first:  false
  hint: use allow_same_price_closed_market_repost=true (workflow_dispatch, manual/shortcut only) to override
```

This is expected and correct. The market is closed; the last reference price has not moved; there is
nothing new to post. The workflow exits 0.

### Why the same price recurs

When the market is closed, `gold-price-fetch.yml` still runs hourly but the provider returns the
same last-known closing price. `data/gold_price.json` is updated (provider timestamp may advance)
but `xau_usd_per_oz` is unchanged. The price-change guard correctly prevents reposting the same
figure repeatedly.

### Operator override: allow_same_price_closed_market_repost

If an operator needs to re-post the same closing reference price (for example, to announce a market
closure that was not posted earlier, or to post after a gap where the closing price has not moved),
they can set
`allow_same_price_closed_market_repost=true` in the `workflow_dispatch` inputs. This bypasses
**only** the price-change guard. All other protections remain active:

- `duplicate_text_hash` — if the tweet text is byte-for-byte identical to the last post, it still
  skips (and X would reject it anyway).
- Cooldown — still active unless `force_post=true`.
- X's own duplicate detection — still active server-side.
- Stale data guard — still active.
- Shortcut anti-spam guard — still active.

**Conditions for the override to apply:**

1. `ALLOW_SAME_PRICE_CLOSED_MARKET_REPOST=true` (set by the workflow from the dispatch input).
2. `event == workflow_dispatch`.
3. `source` is `manual` or `shortcut`.
4. `selected_post_type == market_closed_reference`.

Scheduled runs **never** apply this override even if the env var is set.

### Using refresh_price_first with allow_same_price_closed_market_repost

`refresh_price_first=true` runs a fresh provider fetch and updates `data/gold_price.json` before the
posting path executes. However, if the market is still closed the provider will return the same
last-known closing price — `xau_usd_per_oz` will not change, and the price-change guard will still
fire and skip. In that case `allow_same_price_closed_market_repost=true` is also required to bypass
the price-change guard.

Use both inputs together when the operator wants to fetch the latest provider snapshot and then force
a `market_closed_reference` post regardless of whether the price moved:

```
refresh_price_first: true
allow_same_price_closed_market_repost: true
```

The `duplicate_text_hash` guard remains active; if the fetched price and all tweet fields are
byte-for-byte identical to the last post, the post will still be skipped (and X would reject it
anyway).
