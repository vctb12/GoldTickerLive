"""Provider registry + dispatch.

Maps adapter names (used in ``GOLD_PROVIDER_ORDER``) to ``fetch()``
callables. Each callable returns either a successful raw-quote dict
(``base.make_success`` shape) or a structured-error dict
(``base.make_error`` shape). They never raise on missing keys / disabled
flags — those produce structured errors so the orchestrator can fall
through cleanly.
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List

from . import (
    finnhub,
    fmp,
    gold_api_com,
    goldapi_io,
    goldpricez,
    metal_sentinel,
    twelvedata,
)
from .base import make_error

# Adapter name → fetch callable
PROVIDERS: Dict[str, Callable[[], Dict[str, Any]]] = {
    "metal_sentinel": metal_sentinel.fetch,
    "finnhub_oanda": finnhub.fetch,
    "fmp_gcusd": fmp.fetch,
    "goldapi_io": goldapi_io.fetch,
    "twelvedata_xauusd": twelvedata.fetch,
    "goldpricez": goldpricez.fetch,
    "gold_api_com": gold_api_com.fetch,
}


def list_known_providers() -> List[str]:
    return list(PROVIDERS.keys())


def fetch_provider(name: str) -> Dict[str, Any]:
    """Dispatch to the named provider; unknown names produce a structured error."""
    fn = PROVIDERS.get(name)
    if fn is None:
        return make_error(
            provider=name or "unknown",
            category="unknown_error",
            message=f"unknown provider name '{name}'",
        )
    try:
        return fn()
    except Exception as exc:  # belt-and-braces: never let an adapter crash the run
        return make_error(
            provider=name,
            category="unknown_error",
            message=f"adapter raised: {type(exc).__name__}: {exc}",
        )
