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

Workflow cron schedule (.github/workflows/post_gold.yml):
  - cron: '0 4-18 * * 1-5'   # Hourly 8AM–10PM UAE, Mon–Fri only
  - cron: '0 21 * * 0'        # Market OPEN  — Sun 9PM UTC = Mon 1AM UAE
  - cron: '0 21 * * 5'        # Market CLOSE — Fri 9PM UTC = Sat 1AM UAE"""

import os
import sys
import requests
from datetime import datetime, timezone, timedelta

# ── Config ────────────────────────────────────────────────────────────────────
AED_RATE = 3.6725  # UAE Dirham is pegged to USD
SITE_URL  = "https://vctb12.github.io/Gold-Prices/"
UAE_TZ    = timezone(timedelta(hours=4))

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


# ── Helpers ───────────────────────────────────────────────────────────────────
def _parse_fields(data):
    price = data.get('price')
    g24   = data.get('price_gram_24k')
    g22   = data.get('price_gram_22k')
    g21   = data.get('price_gram_21k')
    g18   = data.get('price_gram_18k')
    chp   = data.get('chp')
    if not all([price, g24, g22, g21, g18]):
        raise ValueError("GoldAPI response missing required price fields")
    return price, g24, g22, g21, g18, chp

def _aed(gram_usd):
    return f'{gram_usd * AED_RATE:.2f}'

def _change_str(chp):
    if chp is None:
        return ''
    sign = '+' if chp >= 0 else ''
    return f' ({sign}{chp:.2f}%)'

def _trend_emoji(chp):
    if chp is None: return '📊'
    if chp > 0:     return '📈'
    if chp < 0:     return '📉'
    return '➡️'

def _uae_datetime():
    now = datetime.now(UAE_TZ)
    date_str = now.strftime('%b %-d, %Y')
    time_str = now.strftime('%I:%M %p').lstrip('0')
    return date_str, time_str


# ── Detect post type ──────────────────────────────────────────────────────────
def get_post_type():
    now     = datetime.now(timezone.utc)
    weekday = now.weekday()  # 0=Mon … 6=Sun
    hour    = now.hour
    if weekday == 6 and hour == 21:
        return 'market_open'
    if weekday == 4 and hour == 21:
        return 'market_close'
    return 'hourly'


# ── Tweet templates ───────────────────────────────────────────────────────────
def format_hourly_tweet(data):
    price, g24, g22, g21, g18, chp = _parse_fields(data)
    date_str, time_str = _uae_datetime()
    return (
        f"📍 Gold Price Update — {date_str}\n"
        f"🕐 {time_str} (UAE · GMT+4)\n"
        f"─────────────────────\n"
        f"Spot XAU/USD\n"
        f"24K · ${price:,.2f}/oz{_change_str(chp)}\n"
        f"─────────────────────\n"
        f"🇦🇪 Per Gram in AED\n"
        f"24K  {_aed(g24)} AED\n"
        f"22K  {_aed(g22)} AED\n"
        f"21K  {_aed(g21)} AED\n"
        f"18K  {_aed(g18)} AED\n"
        f"─────────────────────\n"
        f"Spot rate · Not retail price\n"
        f"{_trend_emoji(chp)} {SITE_URL}\n"
        f"\n"
        f"#GoldPrice #Gold #UAE #Dubai"
    )

def format_market_open_tweet(data):
    price, g24, g22, g21, g18, chp = _parse_fields(data)
    return (
        f"🟢 Gold Market Is Now Open\n"
        f"🕐 Monday · 1:00 AM (UAE · GMT+4)\n"
        f"─────────────────────\n"
        f"Opening Spot XAU/USD\n"
        f"24K · ${price:,.2f}/oz{_change_str(chp)}\n"
        f"─────────────────────\n"
        f"🇦🇪 Per Gram in AED\n"
        f"24K  {_aed(g24)} AED\n"
        f"22K  {_aed(g22)} AED\n"
        f"21K  {_aed(g21)} AED\n"
        f"18K  {_aed(g18)} AED\n"
        f"─────────────────────\n"
        f"New week. Track live prices 👇\n"
        f"{SITE_URL}\n"
        f"\n"
        f"#GoldPrice #Gold #XAU #UAE #Dubai"
    )

def format_market_close_tweet(data):
    price, g24, g22, g21, g18, chp = _parse_fields(data)
    return (
        f"🔴 Gold Market Is Now Closed\n"
        f"🕐 Saturday · 1:00 AM (UAE · GMT+4)\n"
        f"─────────────────────\n"
        f"Closing Spot XAU/USD\n"
        f"24K · ${price:,.2f}/oz{_change_str(chp)}\n"
        f"─────────────────────\n"
        f"🇦🇪 Per Gram in AED\n"
        f"24K  {_aed(g24)} AED\n"
        f"22K  {_aed(g22)} AED\n"
        f"21K  {_aed(g21)} AED\n"
        f"18K  {_aed(g18)} AED\n"
        f"─────────────────────\n"
        f"Reopens Monday 1:00 AM 🌙\n"
        f"{SITE_URL}\n"
        f"\n"
        f"#GoldPrice #Gold #XAU #UAE #Dubai"
    )

def format_tweet(data):
    post_type = get_post_type()
    print(f"   Post type: {post_type}")
    if post_type == 'market_open':
        return format_market_open_tweet(data)
    if post_type == 'market_close':
        return format_market_close_tweet(data)
    return format_hourly_tweet(data)

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
