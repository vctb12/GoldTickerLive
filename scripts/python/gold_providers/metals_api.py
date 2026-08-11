"""Metals-API XAU/USD adapter (Actions-only)."""

from __future__ import annotations

from typing import Any, Dict

from .base import categorize_http_status, env_bool, env_str, make_error, make_success, parse_price, parse_timestamp, sanity_check_price, utc_now_dt
from .http_client import http_get

PROVIDER_NAME = "metals_api_xau"
PROVIDER_URL = "https://www.metals-api.com/"
ENDPOINT = "https://metals-api.com/api/latest"


def fetch() -> Dict[str, Any]:
    if not env_bool("METALS_API_ENABLED", default=False):
        return make_error(PROVIDER_NAME, "provider_disabled", "METALS_API_ENABLED is not true")
    api_key = env_str("METALS_API_ACCESS_KEY")
    if not api_key:
        return make_error(PROVIDER_NAME, "missing_api_key", "METALS_API_ACCESS_KEY not set")
    fetched_at = utc_now_dt()
    result = http_get(ENDPOINT, params={"access_key": api_key, "base": "USD", "symbols": "XAU"})
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
    rate = parse_price(rates.get("XAU") if isinstance(rates, dict) else None)
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
        notes="Metals-API documented XAU latest endpoint; Actions-only credential path",
    )
