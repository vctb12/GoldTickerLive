"""Canonical price-math constants for scripts/python — re-exported from the pipeline.

Single source of truth: ``scripts/python/gold_providers/base.py`` (the pipeline
writer). ``base.py`` is loaded directly from its file path (stdlib-only module)
so importing these constants never triggers ``gold_providers/__init__.py``,
which pulls the full provider registry and its third-party deps (``requests``).

Immutable product facts (see AGENTS.md):
    AED_PEG        — 3.6725, UAE Central Bank USD peg. Never override with a fetched rate.
    TROY_OZ_GRAMS  — 31.1034768, pipeline-exact troy ounce. NOTE: the client
                     (src/config/constants.js) still carries the rounded 31.1035
                     pending owner decision Q4 in docs/plans/midas/RISK_REGISTER.md.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

_BASE_PATH = Path(__file__).resolve().parent.parent / "gold_providers" / "base.py"
_spec = importlib.util.spec_from_file_location("_gold_providers_base_for_constants", _BASE_PATH)
assert _spec is not None and _spec.loader is not None
_base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_base)

AED_PEG: float = _base.DEFAULT_AED_PEG
TROY_OZ_GRAMS: float = _base.TROY_OUNCE_GRAMS

__all__ = ["AED_PEG", "TROY_OZ_GRAMS"]
