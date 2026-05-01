"""Tiny HTTP wrapper used by provider adapters.

Wraps ``requests`` to provide:
  * uniform timeout (``HTTP_TIMEOUT_SECONDS`` env)
  * a single retry on transient network errors (``HTTP_RETRIES`` env)
  * elapsed-ms measurement
  * extraction of common rate-limit headers
  * never logs URL params, headers, or response bodies (the caller decides
    what to record)

The raw ``requests.Response`` is returned alongside metadata so adapters
can read either ``.json()`` or ``.text``.
"""

from __future__ import annotations

import time
from typing import Any, Dict, Optional, Tuple

import requests
from requests import Response

from .base import (
    DEFAULT_HTTP_RETRIES,
    DEFAULT_HTTP_TIMEOUT,
    env_int,
)

DEFAULT_USER_AGENT = "GoldTickerLive-bakeoff/1.0 (+https://goldtickerlive.com)"


class HttpResult:
    __slots__ = (
        "response",
        "elapsed_ms",
        "exception",
        "rate_limit_remaining",
        "rate_limit_reset",
    )

    def __init__(
        self,
        response: Optional[Response],
        elapsed_ms: int,
        exception: Optional[BaseException] = None,
        rate_limit_remaining: Optional[str] = None,
        rate_limit_reset: Optional[str] = None,
    ) -> None:
        self.response = response
        self.elapsed_ms = elapsed_ms
        self.exception = exception
        self.rate_limit_remaining = rate_limit_remaining
        self.rate_limit_reset = rate_limit_reset


def _extract_rate_limit_headers(resp: Response) -> Tuple[Optional[str], Optional[str]]:
    if resp is None:
        return (None, None)
    h = resp.headers
    remaining = (
        h.get("X-RateLimit-Remaining")
        or h.get("x-ratelimit-remaining")
        or h.get("RateLimit-Remaining")
        or h.get("x-rate-limit-remaining")
    )
    reset = (
        h.get("X-RateLimit-Reset")
        or h.get("x-ratelimit-reset")
        or h.get("RateLimit-Reset")
        or h.get("Retry-After")
    )
    return remaining, reset


def http_get(
    url: str,
    *,
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, Any]] = None,
    timeout: Optional[float] = None,
    retries: Optional[int] = None,
    user_agent: str = DEFAULT_USER_AGENT,
) -> HttpResult:
    """Issue a GET request with timeout + transient-error retry.

    Never raises; always returns ``HttpResult``. The caller inspects
    ``result.exception`` (network/timeout) and ``result.response`` (HTTP
    status, body) to make a decision.
    """
    if timeout is None:
        timeout = float(env_int("HTTP_TIMEOUT_SECONDS", DEFAULT_HTTP_TIMEOUT))
    if retries is None:
        retries = max(0, env_int("HTTP_RETRIES", DEFAULT_HTTP_RETRIES))

    final_headers: Dict[str, str] = {"User-Agent": user_agent}
    if headers:
        final_headers.update(headers)

    last_exc: Optional[BaseException] = None
    attempt = 0
    while True:
        attempt += 1
        start = time.monotonic()
        try:
            resp = requests.get(
                url,
                headers=final_headers,
                params=params,
                timeout=timeout,
            )
            elapsed_ms = int((time.monotonic() - start) * 1000)
            remaining, reset = _extract_rate_limit_headers(resp)
            return HttpResult(
                response=resp,
                elapsed_ms=elapsed_ms,
                rate_limit_remaining=remaining,
                rate_limit_reset=reset,
            )
        except (requests.Timeout, requests.ConnectionError) as exc:
            elapsed_ms = int((time.monotonic() - start) * 1000)
            last_exc = exc
            if attempt > retries:
                return HttpResult(
                    response=None, elapsed_ms=elapsed_ms, exception=exc
                )
            # short pause before retry
            time.sleep(min(2.0, 0.5 * attempt))
        except requests.RequestException as exc:
            elapsed_ms = int((time.monotonic() - start) * 1000)
            return HttpResult(response=None, elapsed_ms=elapsed_ms, exception=exc)
