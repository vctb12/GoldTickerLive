"""
scripts/utils/twitter_client.py

Posts tweets to X (Twitter) using Tweepy v2 with OAuth 1.0a.
Credentials come from environment variables only.
"""

import os
import time
from typing import Optional

import tweepy

from scripts.utils.logger import get_logger

log = get_logger("twitter_client")


class TwitterAuthError(Exception):
    """Raised for authentication/permission failures."""


class TwitterDuplicateError(Exception):
    """Raised when attempting to post a duplicate tweet."""


class TwitterPostError(Exception):
    """Raised for general posting failures after retries."""


def _get_client() -> tweepy.Client:
    """Create and return a Tweepy v2 Client using environment variables."""
    api_key = os.environ.get("TWITTER_API_KEY", "")
    api_secret = os.environ.get("TWITTER_API_SECRET", "")
    access_token = os.environ.get("TWITTER_ACCESS_TOKEN", "")
    access_token_secret = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET", "")

    if not all([api_key, api_secret, access_token, access_token_secret]):
        missing = []
        if not api_key:
            missing.append("TWITTER_API_KEY")
        if not api_secret:
            missing.append("TWITTER_API_SECRET")
        if not access_token:
            missing.append("TWITTER_ACCESS_TOKEN")
        if not access_token_secret:
            missing.append("TWITTER_ACCESS_TOKEN_SECRET")
        raise TwitterAuthError(
            f"Missing Twitter credentials: {', '.join(missing)}"
        )

    return tweepy.Client(
        consumer_key=api_key,
        consumer_secret=api_secret,
        access_token=access_token,
        access_token_secret=access_token_secret,
    )


def verify_credentials() -> dict:
    """
    Verify Twitter credentials are valid by fetching account info.
    Returns a dict with user info if successful.
    Raises TwitterAuthError if credentials are invalid.
    """
    try:
        client = _get_client()
        me = client.get_me()
        if me and me.data:
            info = {
                "id": me.data.id,
                "username": me.data.username,
                "name": me.data.name,
            }
            log.info("Twitter credentials valid: @%s", info["username"])
            return info
        raise TwitterAuthError("Could not retrieve account information")
    except tweepy.Unauthorized as exc:
        raise TwitterAuthError(f"Twitter authentication failed: {exc}") from exc
    except tweepy.Forbidden as exc:
        raise TwitterAuthError(f"Twitter permission denied: {exc}") from exc


def post_tweet(text: str, max_retries: int = 3) -> Optional[str]:
    """
    Post a tweet to X.

    Args:
        text: The tweet text to post.
        max_retries: Maximum retry attempts for transient errors.

    Returns:
        The tweet ID if successful, None if skipped.

    Raises:
        TwitterAuthError: For authentication/permission failures.
        TwitterDuplicateError: For duplicate tweet attempts.
        TwitterPostError: For all other failures after retries.
    """
    client = _get_client()

    last_error = None
    for attempt in range(1, max_retries + 1):
        log.info("Post attempt %d/%d", attempt, max_retries)
        try:
            response = client.create_tweet(text=text)
            if response and response.data:
                tweet_id = response.data.get("id")
                log.info("Tweet posted successfully: ID %s", tweet_id)
                return tweet_id
            raise TwitterPostError("Empty response from Twitter API")

        except tweepy.TooManyRequests as exc:
            # HTTP 429 — rate limit, wait with exponential backoff
            wait_time = (2 ** attempt) * 15  # 30s, 60s, 120s
            log.warning(
                "Rate limited (429). Waiting %d seconds before retry...",
                wait_time,
            )
            last_error = exc
            if attempt < max_retries:
                time.sleep(wait_time)
            continue

        except tweepy.Unauthorized as exc:
            # Authentication failure — do not retry
            raise TwitterAuthError(
                f"Authentication failed: {exc}"
            ) from exc

        except tweepy.Forbidden as exc:
            error_msg = str(exc)
            # Check for duplicate tweet
            if "duplicate" in error_msg.lower():
                raise TwitterDuplicateError(
                    f"Duplicate tweet detected: {exc}"
                ) from exc
            # Other permission errors — do not retry
            raise TwitterAuthError(
                f"Permission denied: {exc}"
            ) from exc

        except (tweepy.TwitterServerError, Exception) as exc:
            # Server errors (500, 503) or transient — retry with backoff
            wait_time = (2 ** attempt) * 5  # 10s, 20s, 40s
            log.warning(
                "Transient error: %s. Waiting %d seconds...",
                str(exc),
                wait_time,
            )
            last_error = exc
            if attempt < max_retries:
                time.sleep(wait_time)
            continue

    raise TwitterPostError(
        f"Failed to post tweet after {max_retries} attempts. "
        f"Last error: {last_error}"
    )
