#!/usr/bin/env python3
"""
scripts/post_gold_price.py

Reads the canonical gold-price data file written by
`scripts/fetch_gold_price.py` (from goldpricez.com) and posts a
formatted update to X / Twitter using tweepy.

This script does NOT call any gold-price API directly. It reads
`data/gold_price.json`, which is committed by the
`.github/workflows/gold-price-fetch.yml` workflow every 6 minutes.

Required environment variables (set as GitHub Secrets):
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
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

# ── Config ────────────────────────────────────────────────────────────────────
AED_RATE = 3.6725  # UAE Dirham is pegged to USD
SITE_URL  = "https://goldtickerlive.com/"
UAE_TZ    = timezone(timedelta(hours=4))
TROY_OZ_GRAMS = 31.1034768

# Canonical data file written by scripts/fetch_gold_price.py
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
GOLD_PRICE_FILE = _REPO_ROOT / "data" / "gold_price.json"
STATE_FILE = _REPO_ROOT / "data" / "last_gold_price.json"

TWITTER_API_KEY = os.environ.get('TWITTER_API_KEY', '')
TWITTER_API_SECRET = os.environ.get('TWITTER_API_SECRET', '')
TWITTER_ACCESS_TOKEN = os.environ.get('TWITTER_ACCESS_TOKEN', '')
TWITTER_ACCESS_TOKEN_SECRET = os.environ.get('TWITTER_ACCESS_TOKEN_SECRET', '')



# ── Step 1: Load gold price from the canonical data file ────────────────────
def _load_last_price():
    if not STATE_FILE.exists():
        return None
    try:
        return json.loads(STATE_FILE.read_text()).get("price")
    except Exception:
        return None

def _save_last_price(price):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps({"price": price}))

def get_gold_price():
    """Read gold price from data/gold_price.json (written by
    scripts/fetch_gold_price.py from goldpricez.com) and shape it
    the way the rest of this file expects."""
    if not GOLD_PRICE_FILE.exists():
        raise FileNotFoundError(
            f"{GOLD_PRICE_FILE} not found. "
            "The gold-price-fetch.yml workflow must run first to populate it."
        )

    raw = json.loads(GOLD_PRICE_FILE.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("gold_price.json is not a JSON object")

    gold = raw.get("gold") or {}
    price = gold.get("ounce_usd")
    if not isinstance(price, (int, float)) or price <= 0:
        raise ValueError("gold_price.json missing or invalid gold.ounce_usd")
    price = float(price)

    previous_price = _load_last_price()
    chp = None
    if previous_price and previous_price > 0:
        chp = ((price - previous_price) / previous_price) * 100

    # Prefer the per-gram AED value already computed by the fetcher; fall
    # back to local math if absent.
    g24_aed = gold.get("gram_aed")
    if isinstance(g24_aed, (int, float)) and g24_aed > 0:
        g24 = float(g24_aed) / AED_RATE  # USD/g to keep downstream _aed() happy
    else:
        g24 = price / TROY_OZ_GRAMS
    g22 = g24 * (22 / 24)
    g21 = g24 * (21 / 24)
    g18 = g24 * (18 / 24)

    return {
        "price": price,
        "price_gram_24k": g24,
        "price_gram_22k": g22,
        "price_gram_21k": g21,
        "price_gram_18k": g18,
        "chp": chp,
    }


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
        raise ValueError("gold_price.json missing required price fields")
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
        f"📍 Gold Price Update {_trend_emoji(chp)} - {date_str}\n"
        f"\n"
        f"🕐 {time_str} (UAE · GMT+4)\n"
        f"\n"
        f"Spot XAU/USD\n"
        f"24K · ${price:,.2f}/oz{_change_str(chp)} {_trend_emoji(chp)}\n"
        f"\n"
        f"🇦🇪 Prices:\n"
        f"24K  {_aed(g24)} AED/g\n"
        f"22K  {_aed(g22)} AED/g\n"
        f"21K  {_aed(g21)} AED/g\n"
        f"18K  {_aed(g18)} AED/g\n"
        f"\n"
        f"{_trend_emoji(chp)} goldtickerlive.com\n"
        f"Spot rate · Not retail price\n"
        f"\n"
        f"#GoldPrice #Gold #UAE #Dubai"
    )

def format_market_open_tweet(data):
    price, g24, g22, g21, g18, chp = _parse_fields(data)
    return (
        f"🟢 Gold Market Is Now Open\n"
        f"🕐 Monday · 1:00 AM (UAE · GMT+4)\n"
        f"\n"
        f"Opening Spot XAU/USD\n"
        f"24K · ${price:,.2f}/oz{_change_str(chp)}\n"
        f"\n"
        f"🇦🇪 Prices:\n"
        f"24K  {_aed(g24)} AED/g\n"
        f"22K  {_aed(g22)} AED/g\n"
        f"21K  {_aed(g21)} AED/g\n"
        f"18K  {_aed(g18)} AED/g\n"
        f"\n"
        f"New week. Track live prices 👇\n"
        f"📲: goldtickerlive.com\n"
        f"\n"
        f"#GoldPrice #Gold #XAU #UAE #Dubai"
    )

def format_market_close_tweet(data):
    price, g24, g22, g21, g18, chp = _parse_fields(data)
    return (
        f"🔴 Gold Market Is Now Closed\n"
        f"🕐 Saturday · 1:00 AM (UAE · GMT+4)\n"
        f"\n"
        f"Closing Spot XAU/USD\n"
        f"24K · ${price:,.2f}/oz{_change_str(chp)}\n"
        f"\n"
        f"🇦🇪 Prices:\n"
        f"24K  {_aed(g24)} AED/g\n"
        f"22K  {_aed(g22)} AED/g\n"
        f"21K  {_aed(g21)} AED/g\n"
        f"18K  {_aed(g18)} AED/g\n"
        f"\n"
        f"Reopens Monday 1:00 AM 🌙\n"
        f"🖥️: goldtickerlive.com\n"
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

    # Load gold price from the canonical data file
    print("📡 Reading gold price from data/gold_price.json (goldpricez.com)…")
    data = get_gold_price()
    print(f"   Spot: ${data['price']:,.2f}/oz")

    # Format
    tweet = format_tweet(data)
    print("📝 Generated tweet:")
    print(tweet)
    print(f"   ({len(tweet)} characters)")

    # Post
    post_tweet(tweet)
    _save_last_price(data["price"])


if __name__ == '__main__':
    main()
