#!/usr/bin/env python3
"""Resolve rebase conflicts in data/gold_price.json during workflow push retries."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

GOLD_PRICE_FILE = "data/gold_price.json"


def _parse_payload(raw: str, label: str) -> dict[str, Any]:
    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{label} is not valid JSON: {exc}") from exc
    if not isinstance(loaded, dict):
        raise ValueError(f"{label} must be a JSON object")
    return loaded


def _git_show_stage(path: str, stage: int) -> str:
    return subprocess.check_output(
        ["git", "show", f":{stage}:{path}"],
        text=True,
    )


def _freshness_key(payload: dict[str, Any]) -> datetime:
    for field in ("fetched_at_utc", "timestamp_utc"):
        value = payload.get(field)
        if isinstance(value, str) and value.strip():
            normalized = value.strip().replace("Z", "+00:00")
            try:
                parsed = datetime.fromisoformat(normalized)
            except ValueError:
                continue
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
    return datetime.min.replace(tzinfo=timezone.utc)


def choose_fresher_gold_price(
    upstream: dict[str, Any],
    incoming: dict[str, Any],
) -> dict[str, Any]:
    """Return the payload with the latest fetched_at_utc / timestamp_utc."""
    upstream_key = _freshness_key(upstream)
    incoming_key = _freshness_key(incoming)
    if incoming_key > upstream_key:
        return incoming
    if upstream_key > incoming_key:
        return upstream
    # Tie-break: prefer upstream (origin/main) to avoid overwriting production fetch.
    return upstream


def resolve_conflicted_file(path: str = GOLD_PRICE_FILE) -> None:
    if path != GOLD_PRICE_FILE:
        raise ValueError(f"Refusing to merge non-canonical path: {path}")
    upstream = _parse_payload(_git_show_stage(path, 2), f"{path} (upstream)")
    incoming = _parse_payload(_git_show_stage(path, 3), f"{path} (incoming)")
    merged = choose_fresher_gold_price(upstream, incoming)
    Path(path).write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    args = list(argv if argv is not None else sys.argv[1:])
    path = args[0] if args else GOLD_PRICE_FILE
    if path != GOLD_PRICE_FILE:
        print(f"Unsupported path: {path}", file=sys.stderr)
        return 1

    conflicted = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=U", "--", path],
        capture_output=True,
        text=True,
        check=False,
    ).stdout.strip()
    if not conflicted:
        print(f"No conflict on {path}; nothing to merge.", file=sys.stderr)
        return 1

    resolve_conflicted_file(path)
    subprocess.run(["git", "add", path], check=True)
    print(f"Merged gold price conflict: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
