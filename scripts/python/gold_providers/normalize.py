"""Normalize raw provider quotes into the canonical schema."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from .base import (
    DEFAULT_AED_PEG,
    DEFAULT_MAX_FRESHNESS_SECONDS,
    TROY_OUNCE_GRAMS,
    env_float,
    env_int,
    iso_z,
    sanity_check_price,
)

SCHEMA_VERSION = 1


def _aed_peg() -> float:
    return env_float("AED_PEG", DEFAULT_AED_PEG)


def _max_freshness_seconds() -> int:
    return env_int("MAX_GOLD_FRESHNESS_SECONDS", DEFAULT_MAX_FRESHNESS_SECONDS)


def normalize_quote(raw: Dict[str, Any], *, is_fallback: bool = False) -> Dict[str, Any]:
    """Convert a successful raw-quote dict (from ``base.make_success``) into the
    canonical normalized schema (see docs/data-source-methodology.md).

    Caller must have validated ``raw["success"] is True``.
    """
    price = float(raw["price_usd_oz"])
    aed_peg = _aed_peg()
    usd_per_gram_24k = price / TROY_OUNCE_GRAMS
    aed_per_gram_24k = usd_per_gram_24k * aed_peg

    fetched_at_dt: datetime = raw["fetched_at_dt"]
    timestamp_dt: Optional[datetime] = raw.get("timestamp_dt")

    max_fresh = _max_freshness_seconds()
    if timestamp_dt is None:
        freshness_seconds: Optional[int] = None
        is_fresh = False
    else:
        freshness_seconds = int(
            max(0.0, (fetched_at_dt - timestamp_dt).total_seconds())
        )
        is_fresh = freshness_seconds <= max_fresh

    bid = raw.get("bid")
    ask = raw.get("ask")
    spread = None
    if isinstance(bid, (int, float)) and isinstance(ask, (int, float)):
        try:
            spread = round(float(ask) - float(bid), 6)
        except (TypeError, ValueError):
            spread = None

    return {
        "schema_version": SCHEMA_VERSION,
        "provider": raw["provider"],
        "provider_url": raw.get("provider_url"),
        "source_type": raw.get("source_type", "spot_reference"),
        "raw_symbol": raw.get("raw_symbol"),
        "quote_currency": raw.get("quote_currency", "USD"),
        "xau_usd_per_oz": round(price, 4),
        "usd_per_gram_24k": round(usd_per_gram_24k, 6),
        "aed_per_gram_24k": round(aed_per_gram_24k, 4),
        "aed_peg": aed_peg,
        "timestamp_utc": iso_z(timestamp_dt) if timestamp_dt else None,
        "timestamp_source": raw.get("timestamp_source", "provider")
        if timestamp_dt
        else "missing",
        "fetched_at_utc": iso_z(fetched_at_dt),
        "freshness_seconds": freshness_seconds,
        "max_freshness_seconds": max_fresh,
        "is_fresh": bool(is_fresh),
        "is_fallback": bool(is_fallback),
        "bid": bid,
        "ask": ask,
        "spread": spread,
        "provider_response_time_ms": raw.get("response_time_ms"),
        "raw_provider_confidence": raw.get("raw_provider_confidence"),
        "notes": raw.get("notes"),
    }


def is_within_sanity_range(price_usd_oz: float) -> bool:
    """Wrapper for ``base.sanity_check_price`` (re-exported for callers)."""
    return sanity_check_price(price_usd_oz)


def usd_per_gram_24k(xau_usd_per_oz: float) -> float:
    return xau_usd_per_oz / TROY_OUNCE_GRAMS


def aed_per_gram_24k(xau_usd_per_oz: float, aed_peg: Optional[float] = None) -> float:
    peg = _aed_peg() if aed_peg is None else aed_peg
    return usd_per_gram_24k(xau_usd_per_oz) * peg


def freshness_seconds(
    timestamp_dt: Optional[datetime], fetched_at_dt: Optional[datetime] = None
) -> Optional[int]:
    if timestamp_dt is None:
        return None
    if fetched_at_dt is None:
        fetched_at_dt = datetime.now(timezone.utc)
    return int(max(0.0, (fetched_at_dt - timestamp_dt).total_seconds()))
