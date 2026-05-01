"""GoldAPI.io adapter (NOT to be confused with gold-api.com).

Endpoint:
  GET https://www.goldapi.io/api/XAU/USD
Header:
  x-access-token: $GOLDAPI_IO_KEY

Notes:
  * Free quota historically very low (often ~100/month); not suitable for
    240/day production. Disabled by default; keep as candidate only.
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

PROVIDER_NAME = "goldapi_io"
PROVIDER_URL = "https://www.goldapi.io/"
ENDPOINT = "https://www.goldapi.io/api/XAU/USD"


def fetch() -> Dict[str, Any]:
    if not env_bool("GOLDAPI_IO_ENABLED", default=False):
        return make_error(PROVIDER_NAME, "provider_disabled", "GOLDAPI_IO_ENABLED is not true")
    api_key = env_str("GOLDAPI_IO_KEY")
    if not api_key:
        return make_error(PROVIDER_NAME, "missing_api_key", "GOLDAPI_IO_KEY not set")

    fetched_at = utc_now_dt()
    result = http_get(ENDPOINT, headers={"x-access-token": api_key, "Content-Type": "application/json"})
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
    try:
        body = resp.json()
    except ValueError:
        return make_error(PROVIDER_NAME, "malformed_json", "response is not JSON",
                          http_status=status, response_time_ms=result.elapsed_ms)
    if not isinstance(body, dict):
        return make_error(PROVIDER_NAME, "malformed_json", "response is not an object",
                          http_status=status, response_time_ms=result.elapsed_ms)

    price = parse_price(body.get("price"))
    if price is None:
        return make_error(PROVIDER_NAME, "missing_price", "missing 'price' field",
                          http_status=status, response_time_ms=result.elapsed_ms)
    if not sanity_check_price(price):
        return make_error(PROVIDER_NAME, "sanity_range_failed",
                          f"price {price} outside sanity range",
                          http_status=status, response_time_ms=result.elapsed_ms)

    ts = parse_timestamp(body.get("timestamp"))
    bid = parse_price(body.get("bid"))
    ask = parse_price(body.get("ask"))
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
        bid=bid,
        ask=ask,
        rate_limit_remaining=result.rate_limit_remaining,
        rate_limit_reset=result.rate_limit_reset,
        notes="GoldAPI.io free tier quota historically very low; verify before primary use",
    )
