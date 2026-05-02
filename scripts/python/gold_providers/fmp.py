"""Financial Modeling Prep (FMP) GCUSD adapter.

Endpoint candidates:
  * /stable/quote?symbol=GCUSD&apikey=...

Notes:
  * GCUSD on FMP is COMEX gold futures, NOT pure XAU/USD spot — labeled
    ``futures_reference`` to keep tweet copy honest.
  * Free plan ~250 calls/day barely covers 240/day; treat as fallback or
    benchmark unless the user reduces polling cadence.
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

PROVIDER_NAME = "fmp_gcusd"
PROVIDER_URL = "https://financialmodelingprep.com/"
DEFAULT_SYMBOL = "GCUSD"
ENDPOINT = "https://financialmodelingprep.com/stable/quote"


def fetch() -> Dict[str, Any]:
    if not env_bool("FMP_ENABLED", default=False):
        return make_error(PROVIDER_NAME, "provider_disabled", "FMP_ENABLED is not true")
    api_key = env_str("FMP_API_KEY")
    if not api_key:
        return make_error(PROVIDER_NAME, "missing_api_key", "FMP_API_KEY not set")

    symbol = env_str("FMP_SYMBOL", DEFAULT_SYMBOL) or DEFAULT_SYMBOL
    fetched_at = utc_now_dt()
    result = http_get(ENDPOINT, params={"symbol": symbol, "apikey": api_key})
    if result.exception is not None:
        cat = "timeout" if "Timeout" in type(result.exception).__name__ else "network_error"
        return make_error(PROVIDER_NAME, cat, str(result.exception),
                          response_time_ms=result.elapsed_ms)
    resp = result.response
    if resp is None:
        return make_error(PROVIDER_NAME, "network_error", "no response",
                          response_time_ms=result.elapsed_ms)

    status = resp.status_code
    body_text = (resp.text or "").lower()
    if status != 200:
        cat, msg = categorize_http_status(status)
        if status in (401, 403) and ("upgrade" in body_text or "plan" in body_text or "premium" in body_text):
            cat = "plan_gated"
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
    if isinstance(body, dict) and "Error Message" in body:
        msg = str(body["Error Message"])
        cat = "plan_gated" if "plan" in msg.lower() or "premium" in msg.lower() else "auth_error"
        return make_error(PROVIDER_NAME, cat, msg,
                          http_status=status, response_time_ms=result.elapsed_ms)

    if not isinstance(body, list) or not body:
        return make_error(PROVIDER_NAME, "missing_price", "expected non-empty array",
                          http_status=status, response_time_ms=result.elapsed_ms)
    item = body[0]
    if not isinstance(item, dict):
        return make_error(PROVIDER_NAME, "malformed_json", "first item is not an object",
                          http_status=status, response_time_ms=result.elapsed_ms)

    price = parse_price(item.get("price"))
    if price is None:
        return make_error(PROVIDER_NAME, "missing_price", "missing 'price' field",
                          http_status=status, response_time_ms=result.elapsed_ms)
    if not sanity_check_price(price):
        return make_error(PROVIDER_NAME, "sanity_range_failed",
                          f"price {price} outside sanity range",
                          http_status=status, response_time_ms=result.elapsed_ms)

    ts = parse_timestamp(item.get("timestamp")) or parse_timestamp(item.get("datetime"))
    bid = parse_price(item.get("bid"))
    ask = parse_price(item.get("ask"))
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
        source_type="futures_reference",
        bid=bid,
        ask=ask,
        rate_limit_remaining=result.rate_limit_remaining,
        rate_limit_reset=result.rate_limit_reset,
        notes="FMP GCUSD = COMEX gold futures, not pure XAU/USD spot",
    )
