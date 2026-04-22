#!/usr/bin/env python3
"""
scripts/gold_poster.py

Single entry point for all @GoldTickerLive posting workflows.
Reads POST_MODE from the environment to decide what to do:
    hourly        — fetch price, post hourly update, log to Supabase
    market_event  — detect session open/close, post event tweet
    spike_alert   — detect price spike, post alert if confirmed
    health_check  — verify system health, output summary

All logic is delegated to utility modules in scripts/utils/.
"""

import os
import sys

# Ensure `scripts/python/` is on sys.path so `utils.*` imports resolve
# regardless of the working directory used by GitHub Actions.
_PYTHON_DIR = os.path.dirname(os.path.abspath(__file__))
if _PYTHON_DIR not in sys.path:
    sys.path.insert(0, _PYTHON_DIR)

from utils.logger import get_logger
from utils.market_hours import (
    get_market_status_text,
    get_session_event,
)
from utils.price_fetcher import PriceFetchError, fetch_gold_price
from utils.spike_detector import detect_spike
from utils.supabase_client import (
    get_last_post_for_mode,
    get_latest_price,
    insert_fetch_log,
    insert_price,
)
from utils.tweet_formatter import format_tweet
from utils.twitter_client import (
    TwitterAuthError,
    TwitterDuplicateError,
    TwitterPostError,
    post_tweet,
    verify_credentials,
)

log = get_logger("gold_poster")

# ── Required environment variables by mode ───────────────────────────────────
REQUIRED_ENV = {
    "all": ["GOLD_API_KEY"],
    "twitter": [
        "TWITTER_API_KEY",
        "TWITTER_API_SECRET",
        "TWITTER_ACCESS_TOKEN",
        "TWITTER_ACCESS_TOKEN_SECRET",
    ],
    "supabase": ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
}


def _validate_env(groups: list) -> list:
    """Validate required environment variables. Return list of missing names."""
    missing = []
    for group in groups:
        for var in REQUIRED_ENV.get(group, []):
            if not os.environ.get(var, "").strip():
                missing.append(var)
    return missing


def _check_duplicate(mode: str, current_price: float) -> bool:
    """
    Check if the last successful post for this mode used the same price.
    Returns True if it's a duplicate.
    """
    last = get_last_post_for_mode(mode)
    if last and last.get("price_usd") == current_price:
        log.info("Duplicate detected: last %s post was also $%.2f", mode, current_price)
        return True
    return False


# ── Mode handlers ────────────────────────────────────────────────────────────


def run_hourly():
    """Fetch price, format hourly tweet, save to Supabase, post to X."""
    log.info("=== HOURLY MODE ===")

    # Fetch price
    price_data = fetch_gold_price()
    spot = price_data["spot_usd"]
    log.info("Price fetched: $%.2f/oz", spot)

    # Save to Supabase (non-fatal if it fails)
    saved = insert_price(price_data)
    if not saved:
        log.warning("Price not saved to Supabase — continuing with tweet")

    # Check for duplicate
    if _check_duplicate("hourly", spot):
        log.info("Skipping duplicate hourly tweet")
        insert_fetch_log("skipped", "hourly", price_usd=spot)
        _print_summary("hourly", spot, posted=False, note="Duplicate — skipped")
        return

    # Format tweet
    tweet_text = format_tweet(price_data, "hourly")
    log.info("Tweet formatted (%d chars)", len(tweet_text))

    # Post tweet
    tweet_id = post_tweet(tweet_text)
    log.info("Tweet posted: %s", tweet_id)

    # Log success
    insert_fetch_log("success", "hourly", price_usd=spot, tweet_id=tweet_id)
    _print_summary("hourly", spot, posted=True)


def run_market_event():
    """Detect session open/close and post appropriate tweet."""
    log.info("=== MARKET EVENT MODE ===")

    # Determine what session event is happening
    event = get_session_event()
    if event is None:
        log.info("No session open/close event detected at this time")
        insert_fetch_log("skipped", "market_event", error_message="No event detected")
        _print_summary("market_event", None, posted=False, note="No event at this time")
        return

    session_name = event["session_name"]
    event_type = event["event_type"]
    log.info("Event: %s %s", session_name, event_type)

    # Fetch price
    price_data = fetch_gold_price()
    spot = price_data["spot_usd"]

    # Save to Supabase
    insert_price(price_data)

    # Format tweet based on event type
    mode = "market_open" if event_type == "open" else "market_close"
    tweet_text = format_tweet(price_data, mode, session_name=session_name)

    # Post tweet
    tweet_id = post_tweet(tweet_text)
    log.info("Market event tweet posted: %s", tweet_id)

    insert_fetch_log("success", "market_event", price_usd=spot, tweet_id=tweet_id)
    _print_summary("market_event", spot, posted=True, note=f"{session_name} {event_type}")


def run_spike_alert():
    """Check for price spike and post alert if confirmed and allowed."""
    log.info("=== SPIKE ALERT MODE ===")

    # Fetch current price
    price_data = fetch_gold_price()
    spot = price_data["spot_usd"]
    log.info("Current price: $%.2f/oz", spot)

    # Save price to Supabase
    insert_price(price_data)

    # Run spike detector
    spike = detect_spike(spot)

    if not spike["spike_detected"]:
        log.info("No spike detected: %s", spike["reason"])
        insert_fetch_log(
            "skipped",
            "spike_alert",
            price_usd=spot,
            error_message=spike["reason"],
        )
        _print_summary(
            "spike_alert", spot, posted=False,
            note=f"No spike ({spike['change_pct']:.2f}%)",
        )
        return

    if not spike["posting_allowed"]:
        log.warning("Spike detected but posting not allowed: %s", spike["reason"])
        insert_fetch_log(
            "skipped",
            "spike_alert",
            price_usd=spot,
            error_message=f"Rate limited: {spike['reason']}",
        )
        _print_summary(
            "spike_alert", spot, posted=False,
            note=f"Rate limited: {spike['reason']}",
        )
        return

    # Post spike alert
    direction = spike["direction"]
    mode = "spike_up" if direction == "up" else "spike_down"
    tweet_text = format_tweet(
        price_data,
        mode,
        spike_amount=abs(spike["change_amount"]),
        spike_pct=abs(spike["change_pct"]),
    )

    tweet_id = post_tweet(tweet_text)
    log.info("Spike alert posted: %s", tweet_id)

    insert_fetch_log(
        "success",
        "spike_alert",
        price_usd=spot,
        tweet_id=tweet_id,
    )
    _print_summary(
        "spike_alert", spot, posted=True,
        note=f"{direction} {spike['change_pct']:.2f}%",
    )


def run_health_check():
    """Verify system health: price freshness, Twitter creds, Supabase."""
    log.info("=== HEALTH CHECK MODE ===")

    issues = []
    spot = None

    # 1. Check gold price fetch
    try:
        price_data = fetch_gold_price()
        spot = price_data["spot_usd"]
        log.info("✅ Price fetch OK: $%.2f", spot)
    except PriceFetchError as exc:
        issues.append(f"Price fetch failed: {exc}")
        log.error("❌ Price fetch FAILED: %s", exc)

    # 2. Check Supabase freshness
    try:
        from datetime import datetime, timedelta, timezone

        latest = get_latest_price()
        if latest:
            fetched_at = latest.get("fetched_at", "")
            if fetched_at:
                ts = datetime.fromisoformat(fetched_at.replace("Z", "+00:00"))
                age = datetime.now(timezone.utc) - ts
                if age > timedelta(hours=2):
                    issues.append(
                        f"Last Supabase price is {age.total_seconds() / 3600:.1f}h old (max 2h)"
                    )
                    log.warning("⚠️ Supabase price is stale: %s", fetched_at)
                else:
                    log.info("✅ Supabase price is fresh: %s", fetched_at)
            else:
                log.warning("⚠️ No fetched_at timestamp in latest price")
        else:
            issues.append("No prices found in Supabase")
            log.warning("⚠️ No prices in Supabase")
    except Exception as exc:
        issues.append(f"Supabase check failed: {exc}")
        log.error("❌ Supabase check FAILED: %s", exc)

    # 3. Check Twitter credentials
    try:
        info = verify_credentials()
        log.info("✅ Twitter OK: @%s", info["username"])
    except (TwitterAuthError, Exception) as exc:
        issues.append(f"Twitter credential check failed: {exc}")
        log.error("❌ Twitter check FAILED: %s", exc)

    # Summary
    if issues:
        summary = "⚠️ Issues found:\n" + "\n".join(f"  • {i}" for i in issues)
        log.error("Health check FAILED:\n%s", summary)
        insert_fetch_log(
            "error",
            "health_check",
            price_usd=spot,
            error_message="; ".join(issues),
        )
        print(f"\n{'='*60}")
        print("HEALTH CHECK: FAILED")
        print(summary)
        print(f"{'='*60}\n")
        sys.exit(1)
    else:
        summary = "All systems operational"
        log.info("Health check PASSED")
        insert_fetch_log("success", "health_check", price_usd=spot)
        print(f"\n{'='*60}")
        print("HEALTH CHECK: PASSED")
        print(f"  Price: ${spot:,.2f}/oz" if spot else "  Price: N/A")
        print(f"  Market: {get_market_status_text()}")
        print(f"{'='*60}\n")


# ── Utilities ────────────────────────────────────────────────────────────────


def _print_summary(
    mode: str,
    price: float | None,
    posted: bool,
    note: str = "",
):
    """Print a clear run summary to stdout."""
    print(f"\n{'='*60}")
    print(f"Mode:    {mode}")
    print(f"Price:   ${price:,.2f}/oz" if price else "Price:   N/A")
    print(f"Posted:  {'Yes' if posted else 'No'}")
    if note:
        print(f"Note:    {note}")
    print(f"{'='*60}\n")


# ── Main ─────────────────────────────────────────────────────────────────────


def main():
    mode = os.environ.get("POST_MODE", "").strip().lower()
    log.info("Starting gold_poster with POST_MODE=%s", mode)

    if not mode:
        print("ERROR: POST_MODE environment variable is not set.")
        print("Valid modes: hourly, market_event, spike_alert, health_check")
        sys.exit(1)

    # Validate environment variables
    required_groups = ["all"]
    if mode in ("hourly", "market_event", "spike_alert"):
        required_groups.append("twitter")
    if mode in ("spike_alert",):
        required_groups.append("supabase")

    missing = _validate_env(required_groups)
    if missing:
        print(f"ERROR: Missing required environment variables: {', '.join(missing)}")
        print("Set these as GitHub Secrets in Settings → Secrets → Actions.")
        sys.exit(1)

    # Dispatch to mode handler
    handlers = {
        "hourly": run_hourly,
        "market_event": run_market_event,
        "spike_alert": run_spike_alert,
        "health_check": run_health_check,
    }

    handler = handlers.get(mode)
    if handler is None:
        print(f"ERROR: Unknown POST_MODE '{mode}'")
        print(f"Valid modes: {', '.join(handlers.keys())}")
        sys.exit(1)

    handler()


if __name__ == "__main__":
    try:
        main()
    except PriceFetchError as exc:
        log.error("Price fetch failed: %s", exc)
        insert_fetch_log(
            "error",
            os.environ.get("POST_MODE", "unknown"),
            error_message=str(exc),
        )
        print(f"\nFATAL: {exc}")
        sys.exit(1)
    except (TwitterAuthError, TwitterPostError) as exc:
        log.error("Twitter error: %s", exc)
        insert_fetch_log(
            "error",
            os.environ.get("POST_MODE", "unknown"),
            error_message=str(exc),
        )
        print(f"\nFATAL: {exc}")
        sys.exit(1)
    except TwitterDuplicateError as exc:
        log.warning("Duplicate tweet: %s", exc)
        insert_fetch_log(
            "skipped",
            os.environ.get("POST_MODE", "unknown"),
            error_message=str(exc),
        )
        print(f"\nSkipped: {exc}")
    except Exception as exc:
        log.error("Unhandled error: %s", exc, exc_info=True)
        try:
            insert_fetch_log(
                "error",
                os.environ.get("POST_MODE", "unknown"),
                error_message=str(exc),
            )
        except Exception:
            pass  # If Supabase is also down, don't mask the original error
        print(f"\nFATAL (unhandled): {exc}")
        sys.exit(1)
