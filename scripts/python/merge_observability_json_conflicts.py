#!/usr/bin/env python3
"""Merge rebase conflicts in X automation observability JSON append logs."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any

OBSERVABILITY_FILES = (
    "data/automation_runs.json",
    "data/tweet_posts.json",
    "data/tweet_failures.json",
)
MAX_ROWS = 250


def _parse_json_array(raw: str, label: str) -> list[dict[str, Any]]:
    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{label} is not valid JSON: {exc}") from exc
    if not isinstance(loaded, list):
        raise ValueError(f"{label} must be a JSON array")
    rows: list[dict[str, Any]] = []
    for item in loaded:
        if isinstance(item, dict):
            rows.append(item)
    return rows


def _git_show_stage(path: str, stage: int) -> str:
    return subprocess.check_output(
        ["git", "show", f":{stage}:{path}"],
        text=True,
    )


def _sort_key(row: dict[str, Any]) -> tuple[str, str]:
    created = row.get("created_at")
    if isinstance(created, str) and created:
        return (created, str(row.get("run_id", "")))
    return ("", str(row.get("run_id", "")))


def merge_observability_arrays(
    upstream: list[dict[str, Any]],
    incoming: list[dict[str, Any]],
    *,
    max_rows: int = MAX_ROWS,
) -> list[dict[str, Any]]:
    """Union upstream + incoming rows, dedupe by run_id, keep newest created_at per id."""
    merged: dict[str, dict[str, Any]] = {}
    for row in upstream + incoming:
        run_id = row.get("run_id")
        key = str(run_id) if run_id not in (None, "") else None
        if key is None:
            key = json.dumps(row, sort_keys=True, default=str)
        existing = merged.get(key)
        if existing is None or _sort_key(row) >= _sort_key(existing):
            merged[key] = row
    ordered = sorted(merged.values(), key=_sort_key)
    if len(ordered) > max_rows:
        ordered = ordered[-max_rows:]
    return ordered


def resolve_conflicted_file(path: str) -> None:
    repo_path = Path(path)
    upstream = _parse_json_array(_git_show_stage(path, 2), f"{path} (upstream)")
    incoming = _parse_json_array(_git_show_stage(path, 3), f"{path} (incoming)")
    merged = merge_observability_arrays(upstream, incoming)
    repo_path.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    args = list(argv if argv is not None else sys.argv[1:])
    if not args:
        args = [
            p
            for p in OBSERVABILITY_FILES
            if subprocess.run(
                ["git", "diff", "--name-only", "--diff-filter=U", "--", p],
                capture_output=True,
                text=True,
                check=False,
            ).stdout.strip()
        ]
    if not args:
        print("No conflicted observability JSON files to merge.", file=sys.stderr)
        return 1

    unknown = [p for p in args if p not in OBSERVABILITY_FILES]
    if unknown:
        print(f"Refusing to merge non-observability paths: {unknown}", file=sys.stderr)
        return 1

    for path in args:
        resolve_conflicted_file(path)
        subprocess.run(["git", "add", path], check=True)
        print(f"Merged observability conflict: {path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
