"""
scripts/utils/spike_detector.py

Detects significant price spikes by comparing the current price against
the last recorded price in Supabase, and enforces rate limits on spike
posts using thresholds.json.
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from scripts.utils.logger import get_logger
from scripts.utils.supabase_client import (
    count_spike_posts_last_24h,
    get_last_spike_post_time,
    get_latest_price,
)

log = get_logger("spike_detector")

_CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config" / "twitter_bot"


def _load_thresholds() -> Dict[str, Any]:
    filepath = _CONFIG_DIR / "thresholds.json"
    with open(filepath, "r", encoding="utf-8") as fh:
        return json.load(fh)


def detect_spike(current_price: float) -> Dict[str, Any]:
    """
    Check whether the current price constitutes a spike compared to
    the last recorded price.

    Args:
        current_price: The current XAU/USD spot price.

    Returns a dict:
        spike_detected   – bool
        direction        – 'up', 'down', or None
        change_pct       – float percentage change
        change_amount    – float absolute dollar change
        posting_allowed  – bool
        reason           – str explanation if posting is not allowed
    """
    thresholds = _load_thresholds()
    threshold_pct = thresholds.get("spike_threshold_pct", 2.0)
    max_posts_24h = thresholds.get("max_spike_posts_per_24h", 4)
    min_minutes = thresholds.get("min_minutes_between_spike_posts", 60)

    result = {
        "spike_detected": False,
        "direction": None,
        "change_pct": 0.0,
        "change_amount": 0.0,
        "posting_allowed": False,
        "reason": "",
    }

    # Get last recorded price from Supabase
    last_price_row = get_latest_price()
    if last_price_row is None:
        result["reason"] = (
            "No previous price in Supabase — cannot detect spike. "
            "Supabase may be unavailable."
        )
        log.warning(result["reason"])
        return result

    last_price = last_price_row.get("spot_usd")
    if not last_price or last_price <= 0:
        result["reason"] = "Invalid last price from Supabase"
        log.warning(result["reason"])
        return result

    # Calculate change
    change_amount = current_price - last_price
    change_pct = ((current_price - last_price) / last_price) * 100

    result["change_pct"] = round(change_pct, 2)
    result["change_amount"] = round(change_amount, 2)

    log.info(
        "Price comparison: current=$%.2f, last=$%.2f, change=%.2f%%",
        current_price,
        last_price,
        change_pct,
    )

    # Check if threshold is exceeded
    if abs(change_pct) < threshold_pct:
        result["reason"] = (
            f"Change ({change_pct:.2f}%) is below threshold ({threshold_pct}%)"
        )
        log.info(result["reason"])
        return result

    # Spike detected
    result["spike_detected"] = True
    result["direction"] = "up" if change_amount > 0 else "down"

    log.info(
        "Spike detected: %s %.2f%% ($%.2f)",
        result["direction"],
        abs(change_pct),
        abs(change_amount),
    )

    # Check rate limits
    # 1. Max posts in 24h window
    spike_count = count_spike_posts_last_24h()
    if spike_count >= max_posts_24h:
        result["posting_allowed"] = False
        result["reason"] = (
            f"Max spike posts ({max_posts_24h}) reached in last 24 hours "
            f"(current: {spike_count})"
        )
        log.warning(result["reason"])
        return result

    # 2. Minimum time between posts
    last_spike_time = get_last_spike_post_time()
    if last_spike_time is not None:
        min_delta = timedelta(minutes=min_minutes)
        elapsed = datetime.now(timezone.utc) - last_spike_time
        if elapsed < min_delta:
            remaining = min_delta - elapsed
            result["posting_allowed"] = False
            result["reason"] = (
                f"Minimum time between spike posts ({min_minutes} min) not elapsed. "
                f"Last spike was {elapsed.total_seconds() / 60:.0f} min ago. "
                f"Wait {remaining.total_seconds() / 60:.0f} more min."
            )
            log.warning(result["reason"])
            return result

    # All checks passed
    result["posting_allowed"] = True
    result["reason"] = "Spike confirmed and posting is allowed"
    log.info(result["reason"])
    return result
