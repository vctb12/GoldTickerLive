"""Tests for observability JSON conflict merge helper."""

import json
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_REPO_ROOT / "scripts" / "python"))

from merge_observability_json_conflicts import merge_observability_arrays


def test_merge_dedupes_by_run_id_prefers_newer_created_at():
    upstream = [
        {"run_id": "1", "created_at": "2026-09-22T10:00:00Z", "status": "old"},
        {"run_id": "2", "created_at": "2026-09-22T10:05:00Z"},
    ]
    incoming = [
        {"run_id": "1", "created_at": "2026-09-22T11:00:00Z", "status": "new"},
        {"run_id": "3", "created_at": "2026-09-22T10:10:00Z"},
    ]
    merged = merge_observability_arrays(upstream, incoming)
    assert [row["run_id"] for row in merged] == ["2", "3", "1"]
    assert merged[-1]["status"] == "new"


def test_merge_trims_to_max_rows():
    upstream = [{"run_id": str(i), "created_at": f"2026-09-22T10:{i:02d}:00Z"} for i in range(200)]
    incoming = [{"run_id": str(i), "created_at": f"2026-09-22T11:{i:02d}:00Z"} for i in range(200, 260)]
    merged = merge_observability_arrays(upstream, incoming, max_rows=50)
    assert len(merged) == 50
    assert merged[0]["run_id"] == "210"
    assert merged[-1]["run_id"] == "259"


def test_merge_output_is_json_serializable():
    merged = merge_observability_arrays(
        [{"run_id": "a", "created_at": "2026-09-22T12:00:00Z"}],
        [{"run_id": "b", "created_at": "2026-09-22T12:01:00Z"}],
    )
    json.dumps(merged)
