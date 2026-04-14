"""
scripts/utils/logger.py

Structured logging for all @GoldTickerLive posting modules.
Outputs to stdout so logs are visible in the GitHub Actions UI.
"""

import logging
import sys


def get_logger(name: str) -> logging.Logger:
    """Return a configured logger that writes structured output to stdout."""
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%SZ",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)

    return logger
