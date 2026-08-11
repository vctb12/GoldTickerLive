"""Gold price provider adapters.

Each provider implements ``fetch()`` returning a normalized dict (see
``normalize.normalize_quote``) or a structured error dict (see
``base.make_error``). No adapter is allowed to print, log, or otherwise
expose API keys. Missing keys/disabled flags must produce a clean
``missing_api_key`` / ``provider_disabled`` error result, never raise.
"""

from .base import (
    ERROR_CATEGORIES,
    SOURCE_TYPES,
    make_error,
)
__all__ = [
    "ERROR_CATEGORIES",
    "PROVIDERS",
    "SOURCE_TYPES",
    "fetch_provider",
    "list_known_providers",
    "make_error",
]


def __getattr__(name):
    """Load provider adapters only when registry access is requested.

    Formula and normalization helpers are useful without the optional HTTP
    adapter dependencies. Keeping registry imports lazy makes those helpers
    safe to use in lightweight checks and avoids import-time side effects.
    """
    if name in {"PROVIDERS", "fetch_provider", "list_known_providers"}:
        from .registry import PROVIDERS, fetch_provider, list_known_providers

        return {
            "PROVIDERS": PROVIDERS,
            "fetch_provider": fetch_provider,
            "list_known_providers": list_known_providers,
        }[name]
    raise AttributeError(name)
