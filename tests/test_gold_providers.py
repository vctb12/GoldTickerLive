"""Tests for scripts/python/gold_providers normalization + parsing."""
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT / "scripts" / "python"))

from gold_providers import base, normalize  # noqa: E402


# ── parse_timestamp ────────────────────────────────────────────────────────
def test_parse_timestamp_iso_z():
    dt = base.parse_timestamp("2026-05-01T10:00:00Z")
    assert dt is not None
    assert dt.tzinfo is not None
    assert dt.year == 2026 and dt.minute == 0


def test_parse_timestamp_iso_offset():
    dt = base.parse_timestamp("2026-05-01T14:00:00+04:00")
    assert dt.hour == 10  # converted to UTC


def test_parse_timestamp_unix_seconds():
    dt = base.parse_timestamp(1714557600)  # 2024-05-01T10:00:00Z
    assert dt is not None
    assert dt.year == 2024


def test_parse_timestamp_unix_milliseconds():
    dt = base.parse_timestamp(1714557600000)
    assert dt is not None
    assert dt.year == 2024


def test_parse_timestamp_string_unix():
    dt = base.parse_timestamp("1714557600")
    assert dt is not None
    assert dt.year == 2024


def test_parse_timestamp_missing():
    assert base.parse_timestamp(None) is None
    assert base.parse_timestamp("") is None
    assert base.parse_timestamp("not-a-time") is None


# ── parse_price ────────────────────────────────────────────────────────────
def test_parse_price_numeric():
    assert base.parse_price(4550.5) == 4550.5
    assert base.parse_price(4550) == 4550.0


def test_parse_price_string():
    assert base.parse_price("4,550.50") == 4550.5
    assert base.parse_price("  4550 ") == 4550.0


def test_parse_price_missing_or_zero():
    assert base.parse_price(None) is None
    assert base.parse_price("") is None
    assert base.parse_price(0) is None
    assert base.parse_price(-1) is None
    assert base.parse_price("not-a-number") is None


def test_parse_price_bool_rejected():
    # bool is an int subclass — must NOT be treated as a price.
    assert base.parse_price(True) is None
    assert base.parse_price(False) is None


# ── sanity_check_price ─────────────────────────────────────────────────────
def test_sanity_range_default():
    assert base.sanity_check_price(4550.0) is True
    assert base.sanity_check_price(0.5) is False
    assert base.sanity_check_price(50000.0) is False


# ── normalize_quote ────────────────────────────────────────────────────────
def _raw(price=4550.0, ts_offset_seconds=10):
    fetched = datetime(2026, 5, 1, 10, 0, 10, tzinfo=timezone.utc)
    timestamp = fetched - timedelta(seconds=ts_offset_seconds) if ts_offset_seconds is not None else None
    return base.make_success(
        provider="twelvedata_xauusd",
        provider_url="https://twelvedata.com/",
        raw_symbol="XAU/USD",
        quote_currency="USD",
        price_usd_oz=price,
        timestamp_dt=timestamp,
        timestamp_source="provider",
        fetched_at_dt=fetched,
        response_time_ms=220,
        http_status=200,
    )


def test_normalize_fresh_within_window():
    n = normalize.normalize_quote(_raw(4550.0, ts_offset_seconds=10))
    assert n["xau_usd_per_oz"] == 4550.0
    assert n["is_fresh"] is True
    assert n["freshness_seconds"] == 10
    assert n["timestamp_utc"] == "2026-05-01T10:00:00Z"
    # AED conversion math
    assert abs(n["usd_per_gram_24k"] - (4550.0 / 31.1034768)) < 1e-6
    assert abs(n["aed_per_gram_24k"] - n["usd_per_gram_24k"] * 3.6725) < 1e-3


def test_normalize_stale_beyond_default_window():
    n = normalize.normalize_quote(_raw(4550.0, ts_offset_seconds=2000))
    assert n["is_fresh"] is False
    assert n["freshness_seconds"] == 2000


def test_normalize_missing_timestamp():
    n = normalize.normalize_quote(_raw(4550.0, ts_offset_seconds=None))
    assert n["timestamp_utc"] is None
    assert n["timestamp_source"] == "missing"
    assert n["is_fresh"] is False


def test_normalize_schema_keys_present():
    n = normalize.normalize_quote(_raw())
    expected = {
        "schema_version", "provider", "provider_url", "source_type",
        "raw_symbol", "quote_currency", "xau_usd_per_oz",
        "usd_per_gram_24k", "aed_per_gram_24k", "aed_peg",
        "timestamp_utc", "timestamp_source", "fetched_at_utc",
        "freshness_seconds", "max_freshness_seconds", "is_fresh",
        "is_fallback", "bid", "ask", "spread",
        "provider_response_time_ms", "notes",
    }
    assert expected.issubset(n.keys())
    assert n["schema_version"] == 1


# ── make_error ─────────────────────────────────────────────────────────────
def test_make_error_known_category():
    e = base.make_error("twelvedata_xauusd", "rate_limited", "HTTP 429")
    assert e["success"] is False
    assert e["error_category"] == "rate_limited"
    assert e["provider"] == "twelvedata_xauusd"


def test_make_error_unknown_category_falls_back():
    e = base.make_error("x", "totally_invented")
    assert e["error_category"] == "unknown_error"


# ── disabled / missing-key adapters ────────────────────────────────────────
def test_all_adapters_skip_cleanly_with_no_env(monkeypatch):
    # Strip every adapter env var and confirm nothing raises.
    for var in (
        "TWELVEDATA_ENABLED", "TWELVEDATA_API_KEY",
        "FINNHUB_ENABLED", "FINNHUB_API_KEY",
        "FMP_ENABLED", "FMP_API_KEY",
        "GOLDAPI_IO_ENABLED", "GOLDAPI_IO_KEY",
        "METAL_SENTINEL_ENABLED", "METAL_SENTINEL_API_KEY",
        "GOLDPRICEZ_API_KEY", "GOLDPRICEZ_ENABLED",
        "GOLD_API_COM_ENABLED", "GOLD_API_COM_KEY",
    ):
        monkeypatch.delenv(var, raising=False)
    from gold_providers import PROVIDERS
    for name, fn in PROVIDERS.items():
        result = fn()
        assert result["success"] is False, f"{name} unexpectedly succeeded with no env"
        assert result["error_category"] in ("provider_disabled", "missing_api_key")
        # No API keys leaked into the error message.
        assert "key" not in (result.get("error_message") or "").lower() or \
            "not set" in (result.get("error_message") or "").lower()
