"""Fetch all enabled Actions providers and publish a validated snapshot.

This is intentionally separate from the browser manager. Keys are read only
inside the Actions process, all provider output is sanitized, and the selected
snapshot is based on median/MAD outlier protection rather than first-success.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "scripts" / "python"))

from gold_consensus import choose_consensus  # noqa: E402
from gold_providers import fetch_provider, list_known_providers  # noqa: E402
from gold_providers.base import env_bool, env_float, env_str, iso_z, parse_timestamp, utc_now_dt  # noqa: E402
from gold_providers.normalize import normalize_quote  # noqa: E402

DATA_DIR = ROOT / "data"
GOLD_PRICE_FILE = DATA_DIR / "gold_price.json"
LAST_GOLD_PRICE_FILE = DATA_DIR / "last_gold_price.json"
PROVIDER_STATE_FILE = DATA_DIR / "provider_state.json"
DEFAULT_PROVIDER_ORDER = ",".join(list_known_providers())
FAILURE_THRESHOLD = 3
OPEN_MINUTES = 30


def load_json(path: Path) -> Dict[str, Any]:
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return raw if isinstance(raw, dict) else {}


def atomic_write(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)


def emit_outputs(values: Dict[str, Any]) -> None:
    target = os.environ.get("GITHUB_OUTPUT")
    if not target:
        return
    try:
        with open(target, "a", encoding="utf-8") as handle:
            for key, value in values.items():
                handle.write(f"{key}={value if value is not None else ''}\n")
    except OSError:
        pass


def circuit_open(entry: Dict[str, Any], now: datetime) -> bool:
    until = parse_timestamp(entry.get("circuit_open_until_utc"))
    return bool(until and until > now)


def record_failure(state: Dict[str, Any], name: str, category: str, now: datetime) -> None:
    entry = state.setdefault(name, {})
    entry["consecutive_failures"] = int(entry.get("consecutive_failures", 0)) + 1
    entry["last_failure_utc"] = iso_z(now)
    entry["last_error_category"] = category
    entry["circuit"] = "open" if entry["consecutive_failures"] >= FAILURE_THRESHOLD else "closed"
    if entry["circuit"] == "open":
        entry["circuit_open_until_utc"] = iso_z(now + timedelta(minutes=OPEN_MINUTES))


def record_success(state: Dict[str, Any], name: str, now: datetime) -> None:
    entry = state.setdefault(name, {})
    entry["consecutive_failures"] = 0
    entry["last_success_utc"] = iso_z(now)
    entry["last_error_category"] = None
    entry["circuit"] = "closed"
    entry["circuit_open_until_utc"] = None


def provider_order(value: Optional[str]) -> List[str]:
    raw = value or env_str("GOLD_PROVIDER_ORDER", DEFAULT_PROVIDER_ORDER)
    known = set(list_known_providers())
    return [name.strip() for name in raw.split(",") if name.strip() in known]


def legacy_wrapper(normalized: Dict[str, Any]) -> Dict[str, Any]:
    payload = dict(normalized)
    xau = float(payload["xau_usd_per_oz"])
    peg = float(payload.get("aed_peg", 3.6725))
    aed_per_gram = float(payload.get("aed_per_gram_24k") or (xau / 31.1034768) * peg)
    timestamp = parse_timestamp(payload.get("timestamp_utc"))
    payload.update({
        "source": payload.get("provider"),
        "source_updated_at_gmt": timestamp.strftime("%d-%m-%Y %I:%M:%S %p").lower() if timestamp else None,
        "gold": {
            "ounce_usd": round(xau, 2),
            "ounce_aed": round(xau * peg, 2),
            "gram_aed": round(aed_per_gram, 2),
            "day_low_usd": None,
            "day_high_usd": None,
            "ask_usd": round(xau, 2),
            "bid_usd": round(xau, 2),
        },
        "karats_aed_per_gram": {
            "24k": round(aed_per_gram, 2),
            "22k": round(aed_per_gram * 22 / 24, 2),
            "21k": round(aed_per_gram * 21 / 24, 2),
            "18k": round(aed_per_gram * 18 / 24, 2),
        },
        "status": "ok" if payload.get("is_fresh") else "stale",
    })
    return payload


def previous_price() -> Optional[float]:
    previous = load_json(GOLD_PRICE_FILE).get("xau_usd_per_oz")
    try:
        value = float(previous)
    except (TypeError, ValueError):
        return None
    return value if value > 0 else None


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch and validate a multi-provider gold consensus")
    parser.add_argument("--providers", default="", help="Comma-separated provider names")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    names = provider_order(args.providers or None)
    state = load_json(PROVIDER_STATE_FILE)
    now = utc_now_dt()
    normalized: List[Dict[str, Any]] = []
    diagnostics: List[Dict[str, Any]] = []

    for name in names:
        entry = state.get(name, {})
        if circuit_open(entry, now):
            diagnostics.append({"provider": name, "status": "circuit_open", "valid": False, "reason": "cooldown"})
            continue
        raw = fetch_provider(name)
        diagnostic = {
            "provider": name,
            "requested_at_utc": iso_z(now),
            "status": "success" if raw.get("success") else "error",
            "valid": False,
            "http_status": raw.get("http_status"),
            "response_time_ms": raw.get("response_time_ms"),
            "provider_timestamp": None,
            "normalized_price": None,
            "reason": None,
        }
        if not raw.get("success"):
            reason = raw.get("error_category") or "provider_error"
            diagnostic["reason"] = reason
            record_failure(state, name, reason, now)
            diagnostics.append(diagnostic)
            continue
        try:
            quote = normalize_quote(raw)
        except (KeyError, TypeError, ValueError) as error:
            diagnostic["reason"] = f"normalization_failed:{type(error).__name__}"
            record_failure(state, name, "normalization_failed", now)
            diagnostics.append(diagnostic)
            continue
        diagnostic.update({
            "valid": bool(quote.get("is_fresh") and quote.get("xau_usd_per_oz")),
            "provider_timestamp": quote.get("timestamp_utc"),
            "normalized_price": quote.get("xau_usd_per_oz"),
            "reason": "fresh" if quote.get("is_fresh") else "stale_or_missing_timestamp",
        })
        record_success(state, name, now)
        diagnostics.append(diagnostic)
        if diagnostic["valid"]:
            normalized.append(quote)

    selected, selection = choose_consensus(
        normalized,
        max_relative_deviation=env_float("CONSENSUS_MAX_DEVIATION_PCT", 3.0) / 100,
    )
    max_jump_pct = env_float("MAX_PRICE_JUMP_PCT", 12.0)
    if selected and previous_price() is not None:
        prior = previous_price()
        jump_pct = abs(float(selected["xau_usd_per_oz"]) - prior) / prior * 100
        if jump_pct > max_jump_pct:
            selection["method"] = "spike_rejected"
            selection["spike_rejected_pct"] = round(jump_pct, 3)
            selected = None

    if not args.dry_run:
        atomic_write(PROVIDER_STATE_FILE, state)
        if selected:
            payload = legacy_wrapper(selected)
            payload["selection_method"] = selection.get("method")
            payload["consensus"] = selection
            payload["provider_diagnostics"] = diagnostics
            payload["is_fallback"] = False
            atomic_write(GOLD_PRICE_FILE, payload)
            atomic_write(LAST_GOLD_PRICE_FILE, payload)
        elif not GOLD_PRICE_FILE.exists():
            atomic_write(GOLD_PRICE_FILE, {
                "schema_version": 1,
                "provider": None,
                "is_fresh": False,
                "is_fallback": True,
                "fetched_at_utc": iso_z(now),
                "selection_method": selection.get("method"),
                "provider_diagnostics": diagnostics,
            })

    outputs = {
        "fresh": "true" if selected else "false",
        "provider": selected.get("provider", "") if selected else "",
        "price": selected.get("xau_usd_per_oz", "") if selected else "",
        "timestamp_utc": selected.get("timestamp_utc", "") if selected else "",
        "consensus_method": selection.get("method", "none"),
        "valid_provider_count": len(normalized),
        "reason": selection.get("method", "no_fresh_quote"),
    }
    emit_outputs(outputs)
    print(json.dumps({"summary": outputs, "selection": selection, "providers": diagnostics}, indent=2))
    return 0 if selected or env_bool("SOFT_FAIL_ON_NO_FRESH_PRICE", default=True) else 1


if __name__ == "__main__":
    sys.exit(main())
