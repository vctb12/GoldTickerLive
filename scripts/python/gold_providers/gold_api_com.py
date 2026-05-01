"""gold-api.com adapter (legacy reference).

The product team already had a bad experience with gold-api.com in
production — it became unreliable / hit limits quickly. This adapter
exists only so the bakeoff can re-measure it cleanly. Disabled by default.
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

PROVIDER_NAME = "gold_api_com"
PROVIDER_URL = "https://gold-api.com/"
ENDPOINT = "https://api.gold-api.com/price/XAU"


def fetch() -> Dict[str, Any]:
    if not env_bool("GOLD_API_COM_ENABLED", default=False):
        return make_error(PROVIDER_NAME, "provider_disabled", "GOLD_API_COM_ENABLED is not true")
    # gold-api.com has historically required no key for a small free quota;
    # accept an optional key header anyway in case the user has one.
    api_key = env_str("GOLD_API_COM_KEY")
    headers: Dict[str, str] = {"Accept": "application/json"}
    if api_key:
        headers["X-API-KEY"] = api_key

    fetched_at = utc_now_dt()
    result = http_get(ENDPOINT, headers=headers)
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

    ts = parse_timestamp(body.get("updatedAt") or body.get("timestamp"))
    return make_success(
        PROVIDER_NAME,
        provider_url=PROVIDER_URL,
        raw_symbol="XAU",
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
        notes="gold-api.com — historically rate-limited in this project; not for primary use",
    )
