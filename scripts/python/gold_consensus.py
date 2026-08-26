"""Pure consensus and outlier-selection helpers for the Actions price plane."""

from __future__ import annotations

from statistics import median
from typing import Any, Dict, Iterable, Optional, Tuple


def median_absolute_deviation(values: Iterable[float]) -> float:
    numbers = [float(value) for value in values if isinstance(value, (int, float))]
    if not numbers:
        return 0.0
    center = float(median(numbers))
    return float(median([abs(value - center) for value in numbers]))


def choose_consensus(
    quotes: Iterable[Dict[str, Any]],
    *,
    max_relative_deviation: float = 0.03,
    mad_multiplier: float = 6.0,
) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
    """Choose a representative quote without allowing one outlier to win.

    Two or more inliers are required for ``median_consensus``. A single valid
    quote is returned as ``single_provider`` so the snapshot can remain useful,
    but the selection method is explicit for monitoring and UI copy.
    """
    candidates = [q for q in quotes if isinstance(q, dict) and isinstance(q.get("xau_usd_per_oz"), (int, float))]
    if not candidates:
        return None, {"method": "no_valid_quotes", "median": None, "outliers": []}
    values = [float(q["xau_usd_per_oz"]) for q in candidates]
    center = float(median(values))
    mad = median_absolute_deviation(values)
    # Keep the deviation guard strict even when only two providers respond.
    # MAD is still recorded for diagnostics, but with two values it is large
    # enough to make both quotes look like inliers if used as a relaxed bound.
    absolute_limit = max(center * max_relative_deviation, 0.01)
    inliers = [q for q in candidates if abs(float(q["xau_usd_per_oz"]) - center) <= absolute_limit]
    outliers = [q for q in candidates if q not in inliers]
    if len(inliers) < 2 and len(candidates) == 1:
        selected = candidates[0]
        method = "single_provider"
    elif len(inliers) >= 2:
        selected = min(inliers, key=lambda q: abs(float(q["xau_usd_per_oz"]) - center))
        method = "median_consensus"
    else:
        selected = None
        method = "consensus_failed"
    return selected, {
        "method": method,
        "median": round(center, 4),
        "mad": round(mad, 4),
        "inlier_count": len(inliers),
        "candidate_count": len(candidates),
        "outliers": [q.get("provider") for q in outliers],
    }
