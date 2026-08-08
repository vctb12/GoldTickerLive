"""MetalpriceAPI XAU/USD adapter (Actions-only)."""

from __future__ import annotations

from typing import Any, Dict

from .base import categorize_http_status, env_bool, env_str, make_error, make_success, parse_price, parse_timestamp, sanity_check_price, utc_now_dt
from .http_client import http_get

PROVIDER_NAME = "metalpriceapi_xau"
PROVIDER_URL = "https://metalpriceapi.com/"
ENDPOINT = "https://api.metalpriceapi.com/v1/latest"


def fetch() -> Dict[str, Any]:
    if not env_bool("METALPRICEAPI_ENABLED", default=False):
        return make_error(PROVIDER_NAME, "provider_disabled", "METALPRICEAPI_ENABLED is not true")
    api_key = env_str("METALPRICEAPI_API_KEY")
    if not api_key:
        return make_error(PROVIDER_NAME, "missing_api_key", "METALPRICEAPI_API_KEY not set")
    fetched_at = utc_now_dt()
    result = http_get(ENDPOINT, params={"api_key": api_key, "base": "USD", "currencies": "XAU"})
    if result.exception is not None:
        category = "timeout" if "Timeout" in type(result.exception).__name__ else "network_error"
        return make_error(PROVIDER_NAME, category, str(result.exception), response_time_ms=result.elapsed_ms)
    response = result.response
    if response is None:
        return make_error(PROVIDER_NAME, "network_error", "no response", response_time_ms=result.elapsed_ms)
    if response.status_code != 200:
        category, message = categorize_http_status(response.status_code)
        return make_error(PROVIDER_NAME, category, message, http_status=response.status_code, response_time_ms=result.elapsed_ms)
    try:
        body = response.json()
    except ValueError:
        return make_error(PROVIDER_NAME, "malformed_json", "response is not JSON", http_status=200, response_time_ms=result.elapsed_ms)
    rates = body.get("rates") if isinstance(body, dict) else None
    raw_rate = rates.get("XAU") if isinstance(rates, dict) else None
    price = parse_price(body.get("price") if isinstance(body, dict) else None)
    if price is None:
        rate = parse_price(raw_rate)
        # With USD as base, some versions return XAU per USD; convert that
        # unit to USD per troy ounce before validation.
        price = (1 / rate) if rate and rate < 1 else rate
    if price is None or not sanity_check_price(price):
        return make_error(PROVIDER_NAME, "missing_price", "missing valid XAU rate", http_status=200, response_time_ms=result.elapsed_ms)
    timestamp = parse_timestamp(body.get("timestamp") if isinstance(body, dict) else None)
    return make_success(
        PROVIDER_NAME,
        provider_url=PROVIDER_URL,
        raw_symbol="XAU",
        quote_currency="USD",
        price_usd_oz=price,
        timestamp_dt=timestamp,
        timestamp_source="provider" if timestamp else "missing",
        fetched_at_dt=fetched_at,
        response_time_ms=result.elapsed_ms,
        http_status=200,
        source_type="spot_reference",
        notes="MetalpriceAPI documented XAU conversion; Actions-only credential path",
    )
