"""Finnhub forex (OANDA XAU/USD) adapter.

Endpoints:
  * /api/v1/forex/symbol?exchange=OANDA&token=...   (symbol discovery, optional)
  * /api/v1/forex/candle?symbol=OANDA:XAU_USD&resolution=1&from=...&to=...&token=...

Notes:
  * Forex/metal symbols are commonly plan-gated on Finnhub free tier; the
    adapter detects ``"You don't have access"`` style messages and returns
    a structured ``plan_gated`` error.
  * The bakeoff is the truth; do not assume free-key access works.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List

from .base import (
    categorize_http_status,
    env_bool,
    env_str,
    make_error,
    make_success,
    parse_price,
    sanity_check_price,
    utc_now_dt,
)
from .http_client import http_get

PROVIDER_NAME = "finnhub_oanda"
PROVIDER_URL = "https://finnhub.io/"
ENDPOINT_CANDLE = "https://finnhub.io/api/v1/forex/candle"
DEFAULT_SYMBOL = "OANDA:XAU_USD"


def _looks_plan_gated(text: str) -> bool:
    t = (text or "").lower()
    return any(s in t for s in ("don't have access", "premium", "upgrade", "plan"))


def fetch() -> Dict[str, Any]:
    if not env_bool("FINNHUB_ENABLED", default=False):
        return make_error(PROVIDER_NAME, "provider_disabled", "FINNHUB_ENABLED is not true")
    api_key = env_str("FINNHUB_API_KEY")
    if not api_key:
        return make_error(PROVIDER_NAME, "missing_api_key", "FINNHUB_API_KEY not set")

    symbol = env_str("FINNHUB_SYMBOL", DEFAULT_SYMBOL) or DEFAULT_SYMBOL
    now_unix = int(time.time())
    # Pull the last ~10 minutes of 1-minute candles; latest close = price.
    from_unix = now_unix - 60 * 10
    params = {
        "symbol": symbol,
        "resolution": "1",
        "from": from_unix,
        "to": now_unix,
        "token": api_key,
    }
    fetched_at = utc_now_dt()
    result = http_get(ENDPOINT_CANDLE, params=params)

    if result.exception is not None:
        cat = "timeout" if "Timeout" in type(result.exception).__name__ else "network_error"
        return make_error(PROVIDER_NAME, cat, str(result.exception),
                          response_time_ms=result.elapsed_ms)
    resp = result.response
    if resp is None:
        return make_error(PROVIDER_NAME, "network_error", "no response",
                          response_time_ms=result.elapsed_ms)

    status = resp.status_code
    body_text = resp.text or ""
    if status != 200:
        cat, msg = categorize_http_status(status)
        if status in (401, 403) and _looks_plan_gated(body_text):
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
    if not isinstance(body, dict):
        return make_error(PROVIDER_NAME, "malformed_json", "response is not an object",
                          http_status=status, response_time_ms=result.elapsed_ms)

    s = str(body.get("s") or "").lower()
    if s == "no_data":
        return make_error(PROVIDER_NAME, "missing_price",
                          "Finnhub returned s=no_data (closed market or symbol gated)",
                          http_status=status, response_time_ms=result.elapsed_ms)
    if s != "ok":
        # Some plans return 200 with empty ``c`` array and no ``s``; treat as plan_gated.
        if not body.get("c"):
            return make_error(PROVIDER_NAME, "plan_gated",
                              "Finnhub returned no candle data; symbol likely plan-gated",
                              http_status=status, response_time_ms=result.elapsed_ms)

    closes: List[Any] = body.get("c") or []
    times: List[Any] = body.get("t") or []
    if not closes or not times:
        return make_error(PROVIDER_NAME, "missing_price",
                          "missing 'c' or 't' arrays",
                          http_status=status, response_time_ms=result.elapsed_ms)

    last_close = parse_price(closes[-1])
    if last_close is None:
        return make_error(PROVIDER_NAME, "missing_price", "last close not numeric",
                          http_status=status, response_time_ms=result.elapsed_ms)
    if not sanity_check_price(last_close):
        return make_error(PROVIDER_NAME, "sanity_range_failed",
                          f"price {last_close} outside sanity range",
                          http_status=status, response_time_ms=result.elapsed_ms)

    # ``t`` is a list of unix-second epochs.
    last_t = times[-1]
    from .base import parse_timestamp
    ts = parse_timestamp(last_t)

    return make_success(
        PROVIDER_NAME,
        provider_url=PROVIDER_URL,
        raw_symbol=symbol,
        quote_currency="USD",
        price_usd_oz=last_close,
        timestamp_dt=ts,
        timestamp_source="provider" if ts else "missing",
        fetched_at_dt=fetched_at,
        response_time_ms=result.elapsed_ms,
        http_status=status,
        source_type="spot_reference",
        rate_limit_remaining=result.rate_limit_remaining,
        rate_limit_reset=result.rate_limit_reset,
        notes="Finnhub OANDA:XAU_USD 1m candle close (free key may be plan-gated)",
    )
