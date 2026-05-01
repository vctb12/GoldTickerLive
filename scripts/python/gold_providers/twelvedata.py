"""Twelve Data XAU/USD adapter.

Endpoint:
  GET https://api.twelvedata.com/time_series
       ?symbol=XAU/USD&interval=1min&outputsize=1&timezone=UTC&apikey=...

Notes:
  * Indexed docs say ``/time_series`` costs 1 credit per symbol; Basic plan
    is 8 req/min and 800 credits/day, so 240 calls/day fits on paper.
  * Real free-key access for ``XAU/USD`` and public/social-display terms
    must still be verified via the bakeoff before promoting to primary.
  * Disabled by default until a key is configured.
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

PROVIDER_NAME = "twelvedata_xauusd"
PROVIDER_URL = "https://twelvedata.com/"
DEFAULT_SYMBOL = "XAU/USD"
ENDPOINT = "https://api.twelvedata.com/time_series"


def fetch() -> Dict[str, Any]:
    if not env_bool("TWELVEDATA_ENABLED", default=False):
        return make_error(PROVIDER_NAME, "provider_disabled", "TWELVEDATA_ENABLED is not true")

    api_key = env_str("TWELVEDATA_API_KEY")
    if not api_key:
        return make_error(PROVIDER_NAME, "missing_api_key", "TWELVEDATA_API_KEY not set")

    symbol = env_str("TWELVEDATA_SYMBOL", DEFAULT_SYMBOL) or DEFAULT_SYMBOL
    params = {
        "symbol": symbol,
        "interval": "1min",
        "outputsize": 1,
        "timezone": "UTC",
        "apikey": api_key,
    }
    fetched_at = utc_now_dt()
    result = http_get(ENDPOINT, params=params)
    if result.exception is not None:
        cat = "timeout" if "Timeout" in type(result.exception).__name__ else "network_error"
        return make_error(
            PROVIDER_NAME, cat, str(result.exception),
            response_time_ms=result.elapsed_ms,
        )
    resp = result.response
    if resp is None:
        return make_error(PROVIDER_NAME, "network_error", "no response", response_time_ms=result.elapsed_ms)

    status = resp.status_code
    if status != 200:
        cat, msg = categorize_http_status(status)
        return make_error(
            PROVIDER_NAME, cat, msg,
            http_status=status,
            response_time_ms=result.elapsed_ms,
            rate_limit_remaining=result.rate_limit_remaining,
            rate_limit_reset=result.rate_limit_reset,
        )
    try:
        body = resp.json()
    except ValueError:
        return make_error(
            PROVIDER_NAME, "malformed_json", "response is not JSON",
            http_status=status, response_time_ms=result.elapsed_ms,
        )

    if not isinstance(body, dict):
        return make_error(
            PROVIDER_NAME, "malformed_json", "response is not an object",
            http_status=status, response_time_ms=result.elapsed_ms,
        )

    # Twelve Data error shape: {"code": int, "message": str, "status": "error"}
    if str(body.get("status", "")).lower() == "error":
        message = str(body.get("message") or body.get("status"))
        code = body.get("code")
        lower = message.lower()
        if "symbol" in lower and ("not" in lower or "invalid" in lower or "supported" in lower):
            cat = "unsupported_symbol"
        elif "plan" in lower or "upgrade" in lower or "premium" in lower:
            cat = "plan_gated"
        elif code in (401, 403) or "key" in lower or "auth" in lower:
            cat = "auth_error"
        elif code == 429 or "limit" in lower or "credit" in lower:
            cat = "rate_limited"
        else:
            cat = "http_error"
        return make_error(
            PROVIDER_NAME, cat, message,
            http_status=status, response_time_ms=result.elapsed_ms,
            rate_limit_remaining=result.rate_limit_remaining,
            rate_limit_reset=result.rate_limit_reset,
        )

    values = body.get("values")
    if not isinstance(values, list) or not values:
        return make_error(
            PROVIDER_NAME, "missing_price", "missing 'values' array",
            http_status=status, response_time_ms=result.elapsed_ms,
        )
    latest = values[0]
    price = parse_price(latest.get("close"))
    if price is None:
        return make_error(
            PROVIDER_NAME, "missing_price", "missing 'close' in latest value",
            http_status=status, response_time_ms=result.elapsed_ms,
        )
    if not sanity_check_price(price):
        return make_error(
            PROVIDER_NAME, "sanity_range_failed",
            f"price {price} outside sanity range",
            http_status=status, response_time_ms=result.elapsed_ms,
        )

    ts = parse_timestamp(latest.get("datetime"))
    return make_success(
        PROVIDER_NAME,
        provider_url=PROVIDER_URL,
        raw_symbol=symbol,
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
        notes="Twelve Data XAU/USD 1min close (verify free-key terms before public posting)",
    )
