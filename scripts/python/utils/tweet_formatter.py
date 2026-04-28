"""
scripts/utils/tweet_formatter.py

Reads tweet_templates.json and formats tweets by replacing placeholders
with live data. Enforces tweet length limits from thresholds.json.
"""

import json
from pathlib import Path
from typing import Any, Dict, Optional

from utils.logger import get_logger
from utils.market_hours import format_time_gst, get_market_status_text

log = get_logger("tweet_formatter")

_CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config" / "twitter_bot"

DISCLAIMER = "\u26a0\ufe0f Spot/reference rate \u00b7 Not retail"
SITE_URL = "goldtickerlive.com"


def _load_json(filename: str) -> Any:
    filepath = _CONFIG_DIR / filename
    with open(filepath, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _fmt_price(value: Optional[float]) -> str:
    """Format a price with thousands separator and 2 decimal places."""
    if value is None:
        return "—"
    return f"{value:,.2f}"


def _change_direction(change_pct: float) -> str:
    """Return a direction arrow based on percentage change."""
    if change_pct > 1:
        return "🚀 +"
    if change_pct > 0:
        return "📈 +"
    if change_pct < -1:
        return "📉 "
    if change_pct < 0:
        return "🔻 "
    return "➡️ "


def _get_emoji_for_mode(mode: str, change_pct: float) -> str:
    """Return the header emoji based on mode and price direction."""
    if mode == "spike_up":
        return "🚀"
    if mode == "spike_down":
        return "🔻"
    if mode == "market_open":
        return "🔔"
    if mode == "market_close":
        return "🔒"
    if mode == "health_check":
        return "✅"
    # Hourly
    if change_pct > 0:
        return "🥇"
    if change_pct < 0:
        return "🥇"
    return "🥇"


def _get_karat_price(karat_prices: list, code: str) -> str:
    """Get formatted AED per gram for a specific karat code."""
    for k in karat_prices:
        if k["code"] == code:
            return _fmt_price(k["aed_per_gram"])
    return "—"


def format_tweet(
    price_data: Dict[str, Any],
    mode: str,
    session_name: Optional[str] = None,
    health_summary: Optional[str] = None,
    spike_amount: Optional[float] = None,
    spike_pct: Optional[float] = None,
) -> str:
    """
    Format a tweet using the template for the given mode.

    Args:
        price_data: Dict from price_fetcher.fetch_gold_price()
        mode: One of 'hourly', 'market_open', 'market_close',
              'spike_up', 'spike_down', 'health_check'
        session_name: Name of the market session (for open/close tweets)
        health_summary: Summary text for health check tweets
        spike_amount: Dollar amount of spike move
        spike_pct: Percentage of spike move

    Returns:
        Formatted tweet text, truncated if necessary.
    """
    templates = _load_json("tweet_templates.json")
    thresholds = _load_json("thresholds.json")

    max_length = thresholds.get("max_tweet_length", 280)
    safety_buffer = thresholds.get("tweet_length_safety_buffer", 10)
    effective_max = max_length - safety_buffer

    template_data = templates.get(mode)
    if not template_data:
        log.warning("Unknown mode '%s', falling back to 'hourly'", mode)
        template_data = templates.get("hourly", {})

    template_str = template_data.get("template", "")
    hashtags = template_data.get("hashtags", "#Gold #GoldPrice")

    # Build replacement values
    spot = price_data.get("spot_usd", 0)
    change_pct = price_data.get("change_pct", 0)
    karat_prices = price_data.get("karat_prices", [])

    replacements = {
        "{emoji}": _get_emoji_for_mode(mode, change_pct),
        "{spot_usd}": _fmt_price(spot),
        "{change_pct}": f"{abs(change_pct):.2f}",
        "{change_direction}": _change_direction(change_pct),
        "{k24_aed}": _get_karat_price(karat_prices, "24K"),
        "{k22_aed}": _get_karat_price(karat_prices, "22K"),
        "{k21_aed}": _get_karat_price(karat_prices, "21K"),
        "{market_status}": get_market_status_text(),
        "{timestamp_gst}": format_time_gst(),
        "{session_name}": session_name or "",
        "{high_usd}": _fmt_price(price_data.get("high_usd")),
        "{low_usd}": _fmt_price(price_data.get("low_usd")),
        "{spike_amount}": _fmt_price(spike_amount) if spike_amount else "0.00",
        "{spike_pct}": f"{abs(spike_pct):.2f}" if spike_pct else "0.00",
        "{health_summary}": health_summary or "All systems operational",
        "{disclaimer}": DISCLAIMER,
        "{url}": SITE_URL,
        "{hashtags}": hashtags,
    }

    tweet = template_str
    for placeholder, value in replacements.items():
        tweet = tweet.replace(placeholder, value)

    # Enforce length — never truncate hashtags, price, disclaimer, or URL
    if len(tweet) > effective_max:
        log.warning(
            "Tweet is %d chars (max %d). Truncating middle content.",
            len(tweet),
            effective_max,
        )
        tweet = _truncate_tweet(tweet, effective_max, hashtags)

    log.info("Formatted %s tweet: %d chars", mode, len(tweet))
    return tweet


def _truncate_tweet(tweet: str, max_len: int, hashtags: str) -> str:
    """
    Truncate a tweet to fit within max_len.
    Preserves: first line, price line, disclaimer, URL, hashtags.
    Removes middle content lines until it fits.
    """
    lines = tweet.split("\n")

    # Identify protected lines (first, any with $, disclaimer, URL, hashtags)
    protected_indices = set()
    protected_indices.add(0)  # First line always kept
    for i, line in enumerate(lines):
        stripped = line.strip()
        if "$" in stripped and "/oz" in stripped:
            protected_indices.add(i)
        if DISCLAIMER in stripped:
            protected_indices.add(i)
        if SITE_URL in stripped:
            protected_indices.add(i)
        if stripped.startswith("#") or stripped == hashtags:
            protected_indices.add(i)

    # Remove non-protected lines from the middle until it fits
    removable = [i for i in range(len(lines)) if i not in protected_indices]
    removable.reverse()  # Remove from bottom-middle first

    for idx in removable:
        lines[idx] = ""
        candidate = "\n".join(line for line in lines if line).strip()
        if len(candidate) <= max_len:
            return candidate

    # Last resort: just hard truncate (shouldn't normally happen)
    result = "\n".join(line for line in lines if line).strip()
    return result[:max_len]
