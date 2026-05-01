"""Shared types and helpers for gold-price provider adapters."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

# ── Allowed enumerations ─────────────────────────────────────────────────────

SOURCE_TYPES = (
    "spot_live",
    "spot_reference",
    "spot_delayed",
    "futures_reference",
    "commodity_reference",
    "daily_fix",
    "cache_last_known",
    "unknown",
)

ERROR_CATEGORIES = (
    "missing_api_key",
    "provider_disabled",
    "network_error",
    "timeout",
    "http_error",
    "auth_error",
    "rate_limited",
    "quota_exhausted",
    "malformed_json",
    "missing_price",
    "missing_timestamp",
    "stale_timestamp",
    "sanity_range_failed",
    "unsupported_symbol",
    "plan_gated",
    "terms_unclear",
    "unknown_error",
)


# ── Constants ─────────────────────────────────────────────────────────────────

TROY_OUNCE_GRAMS = 31.1034768
DEFAULT_AED_PEG = 3.6725
DEFAULT_MAX_FRESHNESS_SECONDS = 900
DEFAULT_MIN_VALID_XAU_USD = 500.0
DEFAULT_MAX_VALID_XAU_USD = 10000.0
DEFAULT_HTTP_TIMEOUT = 10
DEFAULT_HTTP_RETRIES = 1


# ── Env helpers (truthy/numeric) ─────────────────────────────────────────────

_TRUTHY = {"1", "true", "yes", "on", "enabled"}


def env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    return str(raw).strip().lower() in _TRUTHY


def env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    try:
        return float(raw)
    except (TypeError, ValueError):
        return default


def env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except (TypeError, ValueError):
        return default


def env_str(name: str, default: str = "") -> str:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return str(raw).strip()


# ── Time helpers ──────────────────────────────────────────────────────────────

def utc_now_iso() -> str:
    """Return the current UTC time as an ISO-8601 string with ``Z`` suffix."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def utc_now_dt() -> datetime:
    return datetime.now(timezone.utc)


def parse_timestamp(value: Any) -> Optional[datetime]:
    """Best-effort parse of a provider timestamp.

    Accepts:
      * ISO-8601 strings (with or without ``Z`` / explicit timezone offset)
      * Unix epoch seconds (int/float ≤ 1e11)
      * Unix epoch milliseconds (int/float > 1e11)

    Returns a tz-aware UTC ``datetime`` or ``None`` if the value cannot be
    interpreted.
    """
    if value is None or value == "":
        return None
    # Numeric: epoch seconds or milliseconds
    if isinstance(value, (int, float)):
        try:
            n = float(value)
        except (TypeError, ValueError):
            return None
        if n <= 0:
            return None
        if n > 1e11:  # very likely milliseconds
            n = n / 1000.0
        try:
            return datetime.fromtimestamp(n, tz=timezone.utc)
        except (OverflowError, OSError, ValueError):
            return None
    # Numeric-looking string
    if isinstance(value, str):
        s = value.strip()
        if not s:
            return None
        # Plain integer/float string
        try:
            n = float(s)
            if n > 1e11:
                n = n / 1000.0
            return datetime.fromtimestamp(n, tz=timezone.utc)
        except ValueError:
            pass
        # ISO-8601
        iso = s
        if iso.endswith("Z"):
            iso = iso[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(iso)
        except ValueError:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    return None


def iso_z(dt: datetime) -> str:
    """Format a ``datetime`` as ISO-8601 UTC with trailing ``Z``."""
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Price parsing ────────────────────────────────────────────────────────────

def parse_price(value: Any) -> Optional[float]:
    """Best-effort parse of a numeric price.

    Accepts numeric values and strings (including thousands separators).
    Returns ``None`` for missing / un-parseable / non-positive values.
    """
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        try:
            v = float(value)
        except (TypeError, ValueError):
            return None
        return v if v > 0 else None
    if isinstance(value, str):
        s = value.strip().replace(",", "").replace(" ", "")
        if not s:
            return None
        try:
            v = float(s)
        except ValueError:
            return None
        return v if v > 0 else None
    return None


def sanity_check_price(price: float) -> bool:
    lo = env_float("MIN_VALID_XAU_USD", DEFAULT_MIN_VALID_XAU_USD)
    hi = env_float("MAX_VALID_XAU_USD", DEFAULT_MAX_VALID_XAU_USD)
    return lo <= price <= hi


# ── Structured error result ──────────────────────────────────────────────────

def make_error(
    provider: str,
    category: str,
    message: str = "",
    *,
    http_status: Optional[int] = None,
    response_time_ms: Optional[int] = None,
    rate_limit_remaining: Optional[str] = None,
    rate_limit_reset: Optional[str] = None,
    raw_sample: Optional[Any] = None,
) -> Dict[str, Any]:
    """Build a structured provider-error result.

    The returned dict has ``success: False`` and never contains API keys.
    """
    if category not in ERROR_CATEGORIES:
        category = "unknown_error"
    return {
        "success": False,
        "provider": provider,
        "error_category": category,
        "error_message": (message or "")[:500],
        "http_status": http_status,
        "response_time_ms": response_time_ms,
        "rate_limit_remaining": rate_limit_remaining,
        "rate_limit_reset": rate_limit_reset,
        "raw_sample": raw_sample,
    }


def make_success(
    provider: str,
    *,
    provider_url: str,
    raw_symbol: str,
    quote_currency: str,
    price_usd_oz: float,
    timestamp_dt: Optional[datetime],
    timestamp_source: str,
    fetched_at_dt: datetime,
    response_time_ms: Optional[int],
    http_status: Optional[int],
    source_type: str = "spot_reference",
    bid: Optional[float] = None,
    ask: Optional[float] = None,
    rate_limit_remaining: Optional[str] = None,
    rate_limit_reset: Optional[str] = None,
    raw_sample: Optional[Any] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """Build a successful raw-quote result (pre-normalize)."""
    if source_type not in SOURCE_TYPES:
        source_type = "unknown"
    return {
        "success": True,
        "provider": provider,
        "provider_url": provider_url,
        "raw_symbol": raw_symbol,
        "quote_currency": quote_currency,
        "price_usd_oz": float(price_usd_oz),
        "timestamp_dt": timestamp_dt,
        "timestamp_source": timestamp_source,
        "fetched_at_dt": fetched_at_dt,
        "source_type": source_type,
        "bid": bid,
        "ask": ask,
        "http_status": http_status,
        "response_time_ms": response_time_ms,
        "rate_limit_remaining": rate_limit_remaining,
        "rate_limit_reset": rate_limit_reset,
        "raw_sample": raw_sample,
        "notes": notes,
    }


def categorize_http_status(status: int) -> Tuple[str, str]:
    """Map an HTTP status code to (error_category, default_message)."""
    if status in (401, 403):
        return ("auth_error", f"HTTP {status} authentication/authorization failure")
    if status == 429:
        return ("rate_limited", "HTTP 429 rate limited")
    if status == 402:
        return ("quota_exhausted", "HTTP 402 quota exhausted")
    if 500 <= status < 600:
        return ("http_error", f"HTTP {status} server error")
    return ("http_error", f"HTTP {status}")
