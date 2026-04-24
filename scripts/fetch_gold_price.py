#!/usr/bin/env python3
"""
scripts/fetch_gold_price.py

Fetches gold prices from goldpricez.com and writes the canonical data file
`data/gold_price.json` atomically.

Auth: reads ``GOLDPRICEZ_API_KEY`` from the environment and sends it as
the ``X-API-KEY`` header. The key MUST NEVER be logged, printed, echoed,
or written to disk.

Endpoints used (see goldpricez.com/about/api):
  1. GET https://goldpricez.com/api/rates/currency/aed/measure/all
  2. GET https://goldpricez.com/api/rates/currency/usd/measure/ounce

Schema contract: data/gold_price.json follows the structure defined in
the cutover task's Appendix A. Field names are frozen.

Exit codes:
  0 — wrote a fresh file OR intentionally skipped (e.g. 429 rate-limited).
  1 — hard failure (missing key, 401/403, validation failure, parse error
      after retries). On any hard failure the existing data/gold_price.json
      is preserved untouched.

Dependencies: ``requests`` only (already pinned in scripts/python/requirements.txt).
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# ── Constants ────────────────────────────────────────────────────────────────
BASE_URL = "https://goldpricez.com"
ENDPOINT_AED_ALL = "/api/rates/currency/aed/measure/all"
ENDPOINT_USD_OUNCE = "/api/rates/currency/usd/measure/ounce"

REQUEST_TIMEOUT = 10  # seconds per request
RETRY_BACKOFFS = (2, 4)  # 2 retries with 2s then 4s pause; do NOT retry on 401/403/429

USER_AGENT = "GoldTickerLive/1.0"

# Karat purity ratios (24k = 1.0000)
KARAT_RATIOS = {
    "24k": 1.0000,
    "22k": 0.9167,
    "21k": 0.8750,
    "18k": 0.7500,
}

# Repo-root-relative output path. Script is expected to be invoked from the
# repo root in CI (``python scripts/fetch_gold_price.py``) but we resolve the
# path relative to this file so local runs work from any cwd.
_REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = _REPO_ROOT / "data"
OUTPUT_FILE = DATA_DIR / "gold_price.json"
TMP_FILE = DATA_DIR / "gold_price.json.tmp"


# ── Logging (plain stdout, never logs secrets) ───────────────────────────────
def _log(msg: str) -> None:
    """One-line structured log to stdout. UTC timestamp first."""
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"{ts} {msg}", flush=True)


def _err(msg: str) -> None:
    """One-line log to stderr (for fatal errors)."""
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"{ts} ERROR: {msg}", file=sys.stderr, flush=True)


# ── HTTP ─────────────────────────────────────────────────────────────────────
class FetchError(Exception):
    """Raised for hard, non-retryable failures."""


class RateLimited(Exception):
    """Raised when the API returns 429. Caller should exit 0 without writing."""


def _request(endpoint: str, api_key: str) -> dict:
    """Fetch one endpoint with retry/backoff.

    Returns parsed JSON dict.

    Raises:
        RateLimited on 429 (caller should skip the run).
        FetchError on any hard failure.
    """
    url = BASE_URL + endpoint
    headers = {
        "X-API-KEY": api_key,
        "Accept": "application/json",
        "User-Agent": USER_AGENT,
    }

    attempt = 0
    backoffs = list(RETRY_BACKOFFS)

    while True:
        attempt += 1
        start = time.monotonic()
        try:
            resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
            duration_ms = int((time.monotonic() - start) * 1000)
        except requests.exceptions.Timeout:
            duration_ms = int((time.monotonic() - start) * 1000)
            _log(
                f"endpoint={endpoint} status=timeout duration_ms={duration_ms} "
                f"attempt={attempt}"
            )
            if backoffs:
                time.sleep(backoffs.pop(0))
                continue
            raise FetchError(f"timeout after retries on {endpoint}")
        except requests.exceptions.RequestException as exc:
            duration_ms = int((time.monotonic() - start) * 1000)
            _log(
                f"endpoint={endpoint} status=network_error duration_ms={duration_ms} "
                f"attempt={attempt} type={type(exc).__name__}"
            )
            if backoffs:
                time.sleep(backoffs.pop(0))
                continue
            raise FetchError(f"network error after retries on {endpoint}")

        status = resp.status_code
        _log(
            f"endpoint={endpoint} status={status} duration_ms={duration_ms} "
            f"attempt={attempt}"
        )

        if status == 200:
            try:
                return resp.json()
            except ValueError:
                raise FetchError(f"invalid JSON response from {endpoint}")

        # Non-retryable client errors.
        if status in (401, 403):
            raise FetchError(f"auth failure {status} on {endpoint}")
        if status == 429:
            raise RateLimited()

        # 5xx → retry if we have retries left.
        if 500 <= status < 600 and backoffs:
            time.sleep(backoffs.pop(0))
            continue

        raise FetchError(f"non-success status {status} on {endpoint}")


# ── Schema construction ──────────────────────────────────────────────────────
def _get_float(d: dict, key: str) -> float:
    """Extract ``key`` as a float. Raise FetchError if missing or non-numeric."""
    val = d.get(key)
    if val is None:
        raise FetchError(f"missing required field: {key}")
    try:
        return float(val)
    except (TypeError, ValueError):
        raise FetchError(f"non-numeric value for field {key}: {val!r}")


def _optional_float(d: dict, key: str) -> float:
    """Extract ``key`` as float; return 0.0 if absent or non-numeric."""
    val = d.get(key)
    if val is None:
        return 0.0
    try:
        return float(val)
    except (TypeError, ValueError):
        return 0.0


def build_payload(aed_all: dict, usd_ounce: dict) -> dict:
    """Assemble the canonical data/gold_price.json payload.

    Required fields (missing → FetchError from _get_float):
      aed_all.ounce_price_usd, aed_all.gram_in_aed,
      aed_all.gmt_ounce_price_usd_updated
    """
    # Required fields — raise if missing/invalid.
    ounce_usd = _get_float(aed_all, "ounce_price_usd")
    gram_aed = _get_float(aed_all, "gram_in_aed")
    source_updated = aed_all.get("gmt_ounce_price_usd_updated")
    if not source_updated or not isinstance(source_updated, str):
        raise FetchError("missing required field: gmt_ounce_price_usd_updated")

    # Optional but commonly present fields. Prefer the dedicated USD/ounce
    # endpoint when it returns them; fall back to the AED/all payload.
    ask_usd = _optional_float(usd_ounce, "ounce_price_ask") or _optional_float(
        aed_all, "ounce_price_ask"
    )
    bid_usd = _optional_float(usd_ounce, "ounce_price_bid") or _optional_float(
        aed_all, "ounce_price_bid"
    )
    day_low_usd = _optional_float(usd_ounce, "ounce_price_usd_today_low") or _optional_float(
        aed_all, "ounce_price_usd_today_low"
    )
    day_high_usd = _optional_float(
        usd_ounce, "ounce_price_usd_today_high"
    ) or _optional_float(aed_all, "ounce_price_usd_today_high")

    ounce_aed = _optional_float(aed_all, "ounce_in_aed")
    kg_aed = _optional_float(aed_all, "kg_in_aed")
    tola_india_aed = _optional_float(aed_all, "tola-india_in_aed")

    # Silver — schema-preserving placeholders. The /currency/aed/measure/all
    # endpoint returns gold-only. The ``metal=all`` variant (not wired in v1)
    # would add silver fields; until then these stay at 0.0.
    silver_ounce_usd = _optional_float(aed_all, "silver_ounce_price_usd")
    silver_gram_aed = _optional_float(aed_all, "silver_gram_in_aed")

    # Karat ladder (AED per gram) from the 24k gram.
    karats = {
        code: round(gram_aed * ratio, 2) for code, ratio in KARAT_RATIOS.items()
    }

    fetched_at_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return {
        "source": "goldpricez.com",
        "fetched_at_utc": fetched_at_utc,
        "source_updated_at_gmt": source_updated,
        "currency_primary": "AED",
        "gold": {
            "ounce_usd": round(ounce_usd, 2),
            "ounce_aed": round(ounce_aed, 2),
            "gram_aed": round(gram_aed, 2),
            "kg_aed": round(kg_aed, 2),
            "tola_india_aed": round(tola_india_aed, 2),
            "ask_usd": round(ask_usd, 2),
            "bid_usd": round(bid_usd, 2),
            "day_low_usd": round(day_low_usd, 2),
            "day_high_usd": round(day_high_usd, 2),
        },
        "silver": {
            "ounce_usd": round(silver_ounce_usd, 2),
            "gram_aed": round(silver_gram_aed, 2),
        },
        "karats_aed_per_gram": karats,
        "status": "ok",
        "notes": "Spot/reference prices. Not UAE retail or jewelry shop prices.",
    }


# ── Atomic write ─────────────────────────────────────────────────────────────
def _atomic_write(payload: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    # Write to tmp then os.replace — atomic on POSIX.
    with open(TMP_FILE, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2, sort_keys=False)
        fh.write("\n")
    os.replace(TMP_FILE, OUTPUT_FILE)


# ── Main ─────────────────────────────────────────────────────────────────────
def main() -> int:
    api_key = os.environ.get("GOLDPRICEZ_API_KEY", "").strip()
    if not api_key:
        _err("GOLDPRICEZ_API_KEY not set")
        return 1

    try:
        aed_all = _request(ENDPOINT_AED_ALL, api_key)
        usd_ounce = _request(ENDPOINT_USD_OUNCE, api_key)
    except RateLimited:
        _log("rate limited, skipping run")
        return 0
    except FetchError as exc:
        _err(str(exc))
        return 1

    # The provider returns an error envelope on some failures:
    #   {"error": true, "code": N, "message": "..."} with HTTP 200.
    # Detect and treat as a permanent failure for v1.
    for payload, label in ((aed_all, "aed_all"), (usd_ounce, "usd_ounce")):
        if isinstance(payload, dict) and payload.get("error"):
            _err(
                f"{label} returned error envelope code="
                f"{payload.get('code')!r} message={payload.get('message')!r}"
            )
            return 1

    try:
        out = build_payload(aed_all, usd_ounce)
    except FetchError as exc:
        _err(f"validation failed: {exc}")
        return 1

    try:
        _atomic_write(out)
    except OSError as exc:
        _err(f"failed to write {OUTPUT_FILE}: {exc}")
        return 1

    _log(
        f"wrote {OUTPUT_FILE.name} ounce_usd={out['gold']['ounce_usd']} "
        f"gram_aed={out['gold']['gram_aed']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
