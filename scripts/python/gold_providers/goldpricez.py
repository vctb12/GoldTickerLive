"""GoldPriceZ adapter (existing production source — kept as low-priority fallback).

Reuses the same endpoints as ``scripts/fetch_gold_price.py`` so this adapter
participates in the bakeoff and reproduces the freezing behavior the
project is migrating away from.

Endpoint used for the bakeoff:
  GET https://goldpricez.com/api/rates/currency/usd/measure/ounce
Header:
  X-API-KEY: $GOLDPRICEZ_API_KEY
"""

from __future__ import annotations

from typing import Any, Dict

from .base import (
    categorize_http_status,
    env_bool,
    env_str,
    make_error,
    make_success,
    parse_price,
    parse_timestamp,
    sanity_check_price,
    utc_now_dt,
)
from .http_client import http_get

PROVIDER_NAME = "goldpricez"
PROVIDER_URL = "https://goldpricez.com/"
ENDPOINT_USD_OUNCE = "https://goldpricez.com/api/rates/currency/usd/measure/ounce"
ENDPOINT_AED_ALL = "https://goldpricez.com/api/rates/currency/aed/measure/all"


def fetch() -> Dict[str, Any]:
    if not env_bool("GOLDPRICEZ_ENABLED", default=True):
        # Default-enabled because this is the existing production source;
        # operators can disable by setting GOLDPRICEZ_ENABLED=false.
        return make_error(PROVIDER_NAME, "provider_disabled", "GOLDPRICEZ_ENABLED is false")
    api_key = env_str("GOLDPRICEZ_API_KEY")
    if not api_key:
        return make_error(PROVIDER_NAME, "missing_api_key", "GOLDPRICEZ_API_KEY not set")

    headers = {"X-API-KEY": api_key, "Accept": "application/json"}
    fetched_at = utc_now_dt()
    result = http_get(ENDPOINT_USD_OUNCE, headers=headers)
    if result.exception is not None:
        cat = "timeout" if "Timeout" in type(result.exception).__name__ else "network_error"
        return make_error(PROVIDER_NAME, cat, str(result.exception),
                          response_time_ms=result.elapsed_ms)
    resp = result.response
    if resp is None:
        return make_error(PROVIDER_NAME, "network_error", "no response",
                          response_time_ms=result.elapsed_ms)
    status = resp.status_code
    if status != 200:
        cat, msg = categorize_http_status(status)
        return make_error(
            PROVIDER_NAME, cat, msg,
            http_status=status, response_time_ms=result.elapsed_ms,
            rate_limit_remaining=result.rate_limit_remaining,
            rate_limit_reset=result.rate_limit_reset,
        )
    # goldpricez may return JSON or a JSON-string-wrapped JSON object.
    try:
        body = resp.json()
    except ValueError:
        return make_error(PROVIDER_NAME, "malformed_json", "response is not JSON",
                          http_status=status, response_time_ms=result.elapsed_ms)
    if isinstance(body, str):
        # Some endpoints double-encode.
        import json as _json
        try:
            body = _json.loads(body)
        except (ValueError, TypeError):
            return make_error(PROVIDER_NAME, "malformed_json",
                              "response is JSON-wrapped string but inner is not JSON",
                              http_status=status, response_time_ms=result.elapsed_ms)

    if not isinstance(body, dict):
        return make_error(PROVIDER_NAME, "malformed_json", "response is not an object",
                          http_status=status, response_time_ms=result.elapsed_ms)

    # Common keys: ``ounce``, ``rate``, ``price``.
    price = (
        parse_price(body.get("ounce"))
        or parse_price(body.get("rate"))
        or parse_price(body.get("price"))
    )
    if price is None:
        return make_error(PROVIDER_NAME, "missing_price",
                          "no numeric 'ounce'/'rate'/'price' in response",
                          http_status=status, response_time_ms=result.elapsed_ms)
    if not sanity_check_price(price):
        return make_error(PROVIDER_NAME, "sanity_range_failed",
                          f"price {price} outside sanity range",
                          http_status=status, response_time_ms=result.elapsed_ms)

    # GoldPriceZ exposes a "DD-MM-YYYY HH:MM:SS am/pm" GMT-ish field; try both.
    ts = parse_timestamp(body.get("timestamp")) or parse_timestamp(body.get("date_gmt"))
    if ts is None:
        # Fall back to a custom GoldPriceZ-style format.
        raw_ts = body.get("date_gmt") or body.get("timestamp_gmt")
        if isinstance(raw_ts, str):
            from datetime import datetime, timezone
            try:
                parsed = datetime.strptime(raw_ts.strip().upper(), "%d-%m-%Y %I:%M:%S %p")
                ts = parsed.replace(tzinfo=timezone.utc)
            except ValueError:
                ts = None

    return make_success(
        PROVIDER_NAME,
        provider_url=PROVIDER_URL,
        raw_symbol="XAU/USD",
        quote_currency="USD",
        price_usd_oz=price,
        timestamp_dt=ts,
        timestamp_source="provider" if ts else "missing",
        fetched_at_dt=fetched_at,
        response_time_ms=result.elapsed_ms,
        http_status=status,
        source_type="spot_reference",
        rate_limit_remaining=result.rate_limit_remaining,
        rate_limit_reset=result.rate_limit_reset,
        notes="GoldPriceZ — known to freeze for 30–45 minutes; fallback only",
    )
