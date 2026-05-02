"""Metal Sentinel adapter (RapidAPI-style, configurable).

Candidate endpoint:
  GET https://metal-sentinel.com/api/metal-quote?metal=AU&currency=USD

This adapter is intentionally configurable because the real docs/dashboard
were not directly verifiable at implementation time:

  * ``METAL_SENTINEL_ENDPOINT``  – override full endpoint URL (default below)
  * ``METAL_SENTINEL_API_KEY``    – auth token
  * ``METAL_SENTINEL_API_HOST``   – RapidAPI host header (optional)
  * ``METAL_SENTINEL_AUTH_HEADER`` – override header name (default
                                     ``x-api-key``; some deployments use
                                     ``Authorization: Bearer`` style)

Disabled by default. The bakeoff is the source of truth.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

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

PROVIDER_NAME = "metal_sentinel"
PROVIDER_URL = "https://metal-sentinel.com/"
DEFAULT_ENDPOINT = "https://metal-sentinel.com/api/metal-quote"


def _pick_price(body: Dict[str, Any]) -> Optional[float]:
    """Try multiple common JSON shapes for the gold price field."""
    for key in ("price", "price_usd", "usd", "spot", "spot_price", "rate", "ounce_usd"):
        v = parse_price(body.get(key))
        if v is not None:
            return v
    # Nested shapes
    for nest_key in ("data", "quote", "result", "metal", "AU", "gold"):
        nested = body.get(nest_key)
        if isinstance(nested, dict):
            for key in ("price", "price_usd", "usd", "spot", "spot_price", "rate", "ounce_usd"):
                v = parse_price(nested.get(key))
                if v is not None:
                    return v
    return None


def _pick_timestamp(body: Dict[str, Any]):
    for key in ("timestamp", "time", "updated_at", "as_of", "datetime"):
        ts = parse_timestamp(body.get(key))
        if ts is not None:
            return ts
    for nest_key in ("data", "quote", "result", "metal", "AU", "gold"):
        nested = body.get(nest_key)
        if isinstance(nested, dict):
            for key in ("timestamp", "time", "updated_at", "as_of", "datetime"):
                ts = parse_timestamp(nested.get(key))
                if ts is not None:
                    return ts
    return None


def fetch() -> Dict[str, Any]:
    if not env_bool("METAL_SENTINEL_ENABLED", default=False):
        return make_error(PROVIDER_NAME, "provider_disabled", "METAL_SENTINEL_ENABLED is not true")
    api_key = env_str("METAL_SENTINEL_API_KEY")
    if not api_key:
        return make_error(PROVIDER_NAME, "missing_api_key", "METAL_SENTINEL_API_KEY not set")

    endpoint = env_str("METAL_SENTINEL_ENDPOINT", DEFAULT_ENDPOINT) or DEFAULT_ENDPOINT
    auth_header = env_str("METAL_SENTINEL_AUTH_HEADER", "x-api-key") or "x-api-key"
    api_host = env_str("METAL_SENTINEL_API_HOST")

    headers: Dict[str, str] = {auth_header: api_key, "Accept": "application/json"}
    # If a RapidAPI host is configured, send it the standard way; some
    # deployments require both x-rapidapi-host and x-rapidapi-key.
    if api_host:
        headers["x-rapidapi-host"] = api_host
        headers.setdefault("x-rapidapi-key", api_key)

    fetched_at = utc_now_dt()
    result = http_get(endpoint, headers=headers, params={"metal": "AU", "currency": "USD"})
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

    price = _pick_price(body)
    if price is None:
        return make_error(PROVIDER_NAME, "missing_price",
                          "could not find a numeric price field in response",
                          http_status=status, response_time_ms=result.elapsed_ms)
    if not sanity_check_price(price):
        return make_error(PROVIDER_NAME, "sanity_range_failed",
                          f"price {price} outside sanity range",
                          http_status=status, response_time_ms=result.elapsed_ms)
    ts = _pick_timestamp(body)
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
        notes="Metal Sentinel adapter is permissive about response shape; verify schema in bakeoff",
    )
