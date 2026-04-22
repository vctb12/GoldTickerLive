"""
scripts/utils/supabase_client.py

All Supabase read/write logic for the @GoldTickerLive posting system.
Credentials come from environment variables only.

Tables used:
    gold_prices  — stores every fetched price
    fetch_logs   — logs every workflow run (status, mode, errors)
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from utils.logger import get_logger

log = get_logger("supabase_client")


class SupabaseConnectionError(Exception):
    """Raised when Supabase cannot be reached."""


def _get_client():
    """
    Create and return a Supabase client using environment variables.
    Returns None if credentials are not configured.
    """
    url = os.environ.get("SUPABASE_URL", "")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        log.warning("Supabase credentials not configured — database operations will be skipped")
        return None

    try:
        from supabase import create_client
        return create_client(url, key)
    except Exception as exc:
        log.error("Failed to create Supabase client: %s", str(exc))
        return None


# ── gold_prices table ────────────────────────────────────────────────────────


def insert_price(price_data: Dict[str, Any]) -> bool:
    """
    Insert a new price row into the gold_prices table.

    Args:
        price_data: Dict with spot_usd, change_pct, open_usd, high_usd,
                    low_usd, karat_prices, etc.

    Returns:
        True if successful, False otherwise.
    """
    client = _get_client()
    if client is None:
        return False

    try:
        row = {
            "spot_usd": price_data.get("spot_usd"),
            "change_pct": price_data.get("change_pct"),
            "open_usd": price_data.get("open_usd"),
            "high_usd": price_data.get("high_usd"),
            "low_usd": price_data.get("low_usd"),
            "k24_aed": None,
            "k22_aed": None,
            "k21_aed": None,
            "fetched_at": price_data.get(
                "timestamp",
                datetime.now(timezone.utc).isoformat(),
            ),
        }

        # Extract karat AED prices
        for kp in price_data.get("karat_prices", []):
            if kp["code"] == "24K":
                row["k24_aed"] = kp["aed_per_gram"]
            elif kp["code"] == "22K":
                row["k22_aed"] = kp["aed_per_gram"]
            elif kp["code"] == "21K":
                row["k21_aed"] = kp["aed_per_gram"]

        client.table("gold_prices").insert(row).execute()
        log.info("Price saved to Supabase: $%.2f", row["spot_usd"])
        return True
    except Exception as exc:
        log.error("Failed to insert price into Supabase: %s", str(exc))
        return False


def get_latest_price() -> Optional[Dict[str, Any]]:
    """
    Get the most recent price from the gold_prices table.

    Returns:
        A dict with price data, or None if unavailable.
    """
    client = _get_client()
    if client is None:
        return None

    try:
        result = (
            client.table("gold_prices")
            .select("*")
            .order("fetched_at", desc=True)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as exc:
        log.error("Failed to get latest price from Supabase: %s", str(exc))
        return None


def get_last_n_prices(n: int = 5) -> List[Dict[str, Any]]:
    """
    Get the last N prices from the gold_prices table for spike comparison.

    Returns:
        A list of price dicts, newest first.
    """
    client = _get_client()
    if client is None:
        return []

    try:
        result = (
            client.table("gold_prices")
            .select("*")
            .order("fetched_at", desc=True)
            .limit(n)
            .execute()
        )
        return result.data if result.data else []
    except Exception as exc:
        log.error("Failed to get recent prices from Supabase: %s", str(exc))
        return []


# ── fetch_logs table ─────────────────────────────────────────────────────────


def insert_fetch_log(
    status: str,
    mode: str,
    price_usd: Optional[float] = None,
    tweet_id: Optional[str] = None,
    error_message: Optional[str] = None,
) -> bool:
    """
    Insert a log row into the fetch_logs table.

    Args:
        status: 'success', 'error', 'skipped', 'spike_alert'
        mode: 'hourly', 'market_event', 'spike_alert', 'health_check'
        price_usd: The fetched price (if available)
        tweet_id: The posted tweet ID (if applicable)
        error_message: Error details (if any)

    Returns:
        True if successful, False otherwise.
    """
    client = _get_client()
    if client is None:
        return False

    try:
        row = {
            "status": status,
            "mode": mode,
            "price_usd": price_usd,
            "tweet_id": tweet_id,
            "error_message": error_message,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        client.table("fetch_logs").insert(row).execute()
        log.info("Fetch log saved: status=%s, mode=%s", status, mode)
        return True
    except Exception as exc:
        log.error("Failed to insert fetch log into Supabase: %s", str(exc))
        return False


def count_spike_posts_last_24h() -> int:
    """
    Count how many spike alert posts have been made in the last 24 hours.

    Returns:
        Integer count of spike posts. Returns 0 if Supabase is unavailable.
    """
    client = _get_client()
    if client is None:
        return 0

    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        result = (
            client.table("fetch_logs")
            .select("id", count="exact")
            .eq("mode", "spike_alert")
            .eq("status", "success")
            .gte("created_at", cutoff)
            .execute()
        )
        count = result.count if result.count is not None else 0
        log.info("Spike posts in last 24h: %d", count)
        return count
    except Exception as exc:
        log.error("Failed to count spike posts: %s", str(exc))
        return 0


def get_last_spike_post_time() -> Optional[datetime]:
    """
    Get the timestamp of the most recent spike alert post.

    Returns:
        A datetime object (UTC), or None if no spike posts found.
    """
    client = _get_client()
    if client is None:
        return None

    try:
        result = (
            client.table("fetch_logs")
            .select("created_at")
            .eq("mode", "spike_alert")
            .eq("status", "success")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            ts_str = result.data[0]["created_at"]
            return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        return None
    except Exception as exc:
        log.error("Failed to get last spike post time: %s", str(exc))
        return None


def get_last_post_for_mode(mode: str) -> Optional[Dict[str, Any]]:
    """
    Get the most recent successful log entry for a given mode.
    Used for duplicate detection.

    Returns:
        A dict with log data, or None.
    """
    client = _get_client()
    if client is None:
        return None

    try:
        result = (
            client.table("fetch_logs")
            .select("*")
            .eq("mode", mode)
            .eq("status", "success")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as exc:
        log.error("Failed to get last post for mode %s: %s", mode, str(exc))
        return None
