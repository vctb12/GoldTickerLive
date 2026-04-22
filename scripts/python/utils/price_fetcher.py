"""
scripts/utils/price_fetcher.py

Fetches live XAU/USD spot price from GoldAPI (goldapi.io) and calculates
per-gram prices for all karats and AED conversion.

All behaviour is driven by config files — no hardcoded values except the
AED peg rate (3.6725), which is a true constant.
"""

import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List

import requests

from utils.logger import get_logger

log = get_logger("price_fetcher")

# ── Constants ────────────────────────────────────────────────────────────────
AED_PEG = 3.6725
TROY_OZ_GRAMS = 31.1035
GOLDAPI_URL = "https://www.goldapi.io/api/XAU/USD"

# ── Config paths ─────────────────────────────────────────────────────────────
_CONFIG_DIR = Path(__file__).resolve().parent.parent.parent / "config" / "twitter_bot"


class PriceFetchError(Exception):
    """Raised when the price cannot be fetched after all retries."""


def _load_json(filename: str) -> Any:
    filepath = _CONFIG_DIR / filename
    with open(filepath, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _get_thresholds() -> Dict[str, Any]:
    return _load_json("thresholds.json")


def _get_karats() -> List[Dict[str, Any]]:
    data = _load_json("karat_weights.json")
    return data["karats"]


def fetch_gold_price() -> Dict[str, Any]:
    """
    Fetch live XAU/USD from GoldAPI with retry logic.

    Returns a dictionary:
        spot_usd        – raw USD price per troy ounce
        change_pct      – percentage change from previous close
        open_usd        – day open price
        high_usd        – day high
        low_usd         – day low
        prev_close_usd  – previous close
        timestamp       – ISO-8601 timestamp of the fetch
        karat_prices    – list of per-karat per-gram prices (USD + AED)
        aed_rate        – the AED peg rate used
    """
    api_key = os.environ.get("GOLD_API_KEY", "")
    if not api_key:
        raise PriceFetchError("GOLD_API_KEY environment variable is not set")

    thresholds = _get_thresholds()
    max_retries = thresholds.get("api_retry_attempts", 3)
    retry_delay = thresholds.get("api_retry_delay_seconds", 5)

    headers = {
        "x-access-token": api_key,
        "Content-Type": "application/json",
    }

    last_error = None
    for attempt in range(1, max_retries + 1):
        log.info("Fetch attempt %d/%d from GoldAPI", attempt, max_retries)
        try:
            response = requests.get(GOLDAPI_URL, headers=headers, timeout=15)
            response.raise_for_status()
            data = response.json()

            # Validate required fields
            spot = data.get("price")
            if spot is None or not isinstance(spot, (int, float)) or spot <= 0:
                raise ValueError(
                    f"Invalid or missing 'price' field in GoldAPI response: {data}"
                )

            open_price = data.get("open_price")
            prev_close = data.get("prev_close_price")
            high_price = data.get("high_price")
            low_price = data.get("low_price")

            # Calculate change from previous close
            change_pct = 0.0
            reference = prev_close or open_price
            if reference and reference > 0:
                change_pct = ((spot - reference) / reference) * 100

            # Calculate per-karat per-gram prices
            karats = _get_karats()
            karat_prices = []
            for k in karats:
                usd_per_gram = (spot / TROY_OZ_GRAMS) * k["purity"]
                aed_per_gram = usd_per_gram * AED_PEG
                karat_prices.append(
                    {
                        "code": k["code"],
                        "label": k["label"],
                        "purity": k["purity"],
                        "usd_per_gram": round(usd_per_gram, 2),
                        "aed_per_gram": round(aed_per_gram, 2),
                    }
                )

            result = {
                "spot_usd": round(spot, 2),
                "change_pct": round(change_pct, 2),
                "open_usd": round(open_price, 2) if open_price else None,
                "high_usd": round(high_price, 2) if high_price else None,
                "low_usd": round(low_price, 2) if low_price else None,
                "prev_close_usd": round(prev_close, 2) if prev_close else None,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "karat_prices": karat_prices,
                "aed_rate": AED_PEG,
            }

            log.info("Price fetched successfully: $%.2f/oz", spot)
            return result

        except Exception as exc:
            last_error = exc
            log.warning(
                "Attempt %d failed: %s", attempt, str(exc)
            )
            if attempt < max_retries:
                log.info("Retrying in %d seconds...", retry_delay)
                time.sleep(retry_delay)

    raise PriceFetchError(
        f"Failed to fetch gold price after {max_retries} attempts. "
        f"Last error: {last_error}"
    )
