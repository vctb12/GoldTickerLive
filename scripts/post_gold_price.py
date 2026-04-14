#!/usr/bin/env python3
"""
scripts/post_gold_price.py

Fetches live gold price from GoldAPI (goldapi.io) and posts to X / Twitter
using tweepy. Includes AED conversion for UAE-focused audience.

Required environment variables (set as GitHub Secrets):
  GOLD_API_KEY              – goldapi.io API key
  TWITTER_API_KEY           – X Developer Portal: API Key (Consumer Key)
  TWITTER_API_SECRET        – X Developer Portal: API Key Secret
  TWITTER_ACCESS_TOKEN      – X Developer Portal: Access Token (read-write)
  TWITTER_ACCESS_TOKEN_SECRET – X Developer Portal: Access Token Secret

Runs from .github/workflows/post_gold.yml every 3 hours (at :30 past the hour).
"""

import os
import sys
import requests

# ── Config ────────────────────────────────────────────────────────────────────
AED_RATE = 3.6725  # UAE Dirham is pegged to USD

GOLD_API_KEY = os.environ.get('GOLD_API_KEY', '')
TWITTER_API_KEY = os.environ.get('TWITTER_API_KEY', '')
TWITTER_API_SECRET = os.environ.get('TWITTER_API_SECRET', '')
TWITTER_ACCESS_TOKEN = os.environ.get('TWITTER_ACCESS_TOKEN', '')
TWITTER_ACCESS_TOKEN_SECRET = os.environ.get('TWITTER_ACCESS_TOKEN_SECRET', '')


# ── Step 1: Fetch gold price ─────────────────────────────────────────────────
def get_gold_price():
    """Fetch XAU/USD from goldapi.io. Returns the JSON response dict."""
    url = "https://www.goldapi.io/api/XAU/USD"
    headers = {
        "x-access-token": GOLD_API_KEY,
        "Content-Type": "application/json",
    }
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    return response.json()


# ── Step 2: Format the tweet ─────────────────────────────────────────────────
from datetime import datetime, timezone, timedelta

UAE_TZ = timezone(timedelta(hours=4))

def format_tweet(data):
    price   = data.get('price')
    g24     = data.get('price_gram_24k')
    g22     = data.get('price_gram_22k')
    g21     = data.get('price_gram_21k')
    g18     = data.get('price_gram_18k')
    chp     = data.get('chp')

    if not all([price, g24, g22, g21, g18]):
        raise ValueError("GoldAPI response missing required price fields")

    now_uae  = datetime.now(UAE_TZ)
    date_str = now_uae.strftime('%b %-d, %Y')
    time_str = now_uae.strftime('%I:%M %p').lstrip('0')  # e.g. "2:35 PM"

    if chp is not None:
        sign = '+' if chp >= 0 else ''
        change_str = f' ({sign}{chp:.2f}%)'
    else:
        change_str = ''

    if chp is None:
        trend = '📊'
    elif chp > 0:
        trend = '📈'
    elif chp < 0:
        trend = '📉'
    else:
        trend = '➡️'

    def aed(gram_usd):
        return f'{gram_usd * AED_RATE:.2f}'

    tweet = (
        f"🥇 Gold Prices Now - {date_str}\n"
        f"\n"
        f"🕐 {time_str} UAE (GMT+4)\n"
        f"\n"
        f"Spot: 24K - ${price:,.2f}/oz{change_str}\n"
        f"\n"
        f"🇦🇪 UAE (AED/g):\n"
        f"24K: {aed(g24)} AED/g\n"
        f"22K: {aed(g22)} AED/g\n"
        f"21K: {aed(g21)} AED/g\n"
        f"18K: {aed(g18)} AED/g\n"
        f"\n"
        f"{trend} https://vctb12.github.io/Gold-Prices/\n"
        f"\n"
        f"#GoldPrice #Gold #UAE #Dubai"
    )
    return tweet

# ── Step 3: Post to X / Twitter ──────────────────────────────────────────────
def post_tweet(text):
    """Post the tweet using tweepy (X API v2)."""
    import tweepy

    client = tweepy.Client(
        consumer_key=TWITTER_API_KEY,
        consumer_secret=TWITTER_API_SECRET,
        access_token=TWITTER_ACCESS_TOKEN,
        access_token_secret=TWITTER_ACCESS_TOKEN_SECRET,
    )
    client.create_tweet(text=text)
    print("✅ Tweet posted successfully")


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    # Check for required secrets
    missing = []
    for name, value in [
        ('GOLD_API_KEY', GOLD_API_KEY),
        ('TWITTER_API_KEY', TWITTER_API_KEY),
        ('TWITTER_API_SECRET', TWITTER_API_SECRET),
        ('TWITTER_ACCESS_TOKEN', TWITTER_ACCESS_TOKEN),
        ('TWITTER_ACCESS_TOKEN_SECRET', TWITTER_ACCESS_TOKEN_SECRET),
    ]:
        if not value:
            missing.append(name)

    if missing:
        count = len(missing)
        print(f"⚠️  {count} required environment variable(s) not set.")
        print("   Set these as GitHub Secrets in Settings → Secrets → Actions.")
        print("   Skipping tweet.")
        sys.exit(0)  # Exit 0 so the workflow doesn't report as failed

    # Fetch gold price
    print("📡 Fetching gold price from goldapi.io…")
    data = get_gold_price()
    print(f"   Spot: ${data['price']:,.2f}/oz")

    # Format
    tweet = format_tweet(data)
    print("📝 Generated tweet:")
    print(tweet)
    print(f"   ({len(tweet)} characters)")

    # Post
    post_tweet(tweet)


if __name__ == '__main__':
    main()
